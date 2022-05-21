{
	let { log } = console
	// 缓存读取记录
	// MemoQ.rows
	// MemoQ.nonLockedRows

	function MemoQ() {
		if (!(this instanceof MemoQ)) new MemoQ();

		this.id = WebTrans.Doc.docInstanceId;
		this.length = WebTrans.Core.numberOfRows;
		this.divisionGuid = WebTrans.Core.docJobGuid;
		this.projectId = MQ.getQueryString('prj');
		this.documentId = MQ.getQueryString('doc');
		this.root = MQ.getAppRootUrl();
	}
	MemoQ.prototype.ajax = function (url, data, callback) {
		let headers;
		url = MQ.getAppRootUrl() + url;
		headers = {
			'accept': '*/*',
			'content-type': 'application/json; charset=UTF-8',
			// 'x-xsrf-token':document.cookie.match(/X-XSRF-TOKEN=(.+);?/)[1]
			'x-xsrf-token': MQ.getCookieValue('X-XSRF-TOKEN')
		};

		$.ajax({
			type: "POST",
			data: JSON.stringify(data),
			// dataType: '*/*',
			headers, url, success: callback
		});
	};

	MemoQ.prototype.getRows = function (callback) {// 获取记录 [ {id,source,target,locked} ,...]
		let o = {
			DocInstanceId: WebTrans.Doc.docInstanceId,
			RowIndicies: MemoQ.createArrayRange(0, this.length)
		};
		this.ajax('api/TranslationService/GetWebContent', o, (data) => {
			// 从MemoQ获取到的原始数据
			// data.Success  获取成功
			if (data.Success && data.Value && data.Value.Rows) {
				let rows = data.Value.Rows, res = [];
				// 缓存读取记录
				MemoQ.rows = rows.map(e => e.Row);
				MemoQ.nonLockedRows = MemoQ.rows.filter(row => !row.Info.Locked)

				for (let row of rows) {
					row = row.Row;
					let id = row.Id;
					// 整理tag
					let tag = row.SourceSegment.ITaglist.filter(e => {
						if (e.Name === 'rpr' && (e.Type === 0 || e.Type === 1)) return false;// 不要rpr
						return true;
					}).map(e => {
						if (e.Type === 2) {
							let k = '<' + e.NumID + '>';
							let v = e.AttrInfo;
							v = v.match(/(displaytext=".+?" )?val="([\s\S]+?)"/);
							if (v !== null) {
								v = v[2] || e[k];
							} else {
								v = '';
							}
							v = v.replace(/(\r?)\n/g, '\\n').replace(/\t/g, '\\t');
							return [k, v];
						}
						return e;
					});
					let source = row.SourceSegment.EditorString;// 不可在这里编辑source，否则上传时会修改原文。
					// 保留原文对策
					let originSourceSegmentEditorString = row.OriginalSourceSegment.EditorString
					let sourceSegmentEditorString = row.SourceSegment.EditorString

					// 优化source2
					let source2 = clearBracketLeft(clearRPR(source));
					// 应用tag
					tag.forEach(e => {
						// e:[k, v]
						source2 = source2.replace(e[0], e[1]);
					});

					let target = row.TargetSegment.EditorString;
					let target2 = clearBracketLeft(clearRPR2(target));// 酌情去掉[和{

					if (!row.Info.Locked) {
						res.push({
							locked: row.Info.Locked,
							id,
							source,
							source2,
							tag,
							target,
							target2,
							originSourceSegmentEditorString,
							sourceSegmentEditorString,
						});
					}
				}
				MemoQ.res = res
				callback(res);
			} else {
				alert('데이터를 불러올 수 없습니다.');
			}
		});
	};

	MemoQ.createArrayRange = function createArrayRange(start, end) {
		if (end === undefined) {
			end = start;
			start = 0;
		}
		let res = [];
		while (start <= end) {
			res.push(start++);
		}
		return res;
	};

	MemoQ.prototype.setRows = function (rows, callback) {// 设置记录
		let id = WebTrans.Doc.docInstanceId;
		rows = rows.map((e, i) => {
			console.log(e)
			let o = {
				DocInstanceId: id,
				id: e.id,
				comments: [],
				locked: false,
				rangeForCorrectedLQA: null,
				// originSourceSegmentHtml: e.originSourceSegmentEditorString,
				// originSourceSegmentChanges: [],
				sourceSegmentHtml: e.sourceSegmentEditorString,
				sourceSegmentChanges: [],
				targetSegmentHtml: e.target,
				targetSegmentChanges: [],
				translationState: 2,// 2编辑,3提交
				warnings: [],
				webLQAErrors: []
			};
			return o;
		});
		let url = 'api/TranslationService/SaveWebRows';
		let data = { DocInstanceId: id, WebRows: rows };

		this.ajax(url, data, callback);
	};

	MemoQ.getTip = function getTip(row, callback) {
		headers = {
			'accept': '*/*',
			'content-type': 'application/json; charset=UTF-8',
			// 'x-xsrf-token':document.cookie.match(/X-XSRF-TOKEN=(.+);?/)[1]
			'x-csrf-token': MQ.getCookieValue('X-CSRF-TOKEN')
		};

		let data = {
			DocInstanceId: WebTrans.Doc.docInstanceId,
			Row: {
				docInstanceId: WebTrans.Doc.docInstanceId,
				id: row.Id,
				sourceSegmentHtml: row.SourceSegment.EditorString,
				targetSegmentHtml: row.TargetSegment.EditorString,
				locked: row.Info.Locked,
				translationState: row.Info.TranslationState,
				warnings: row.Info.Warnings,
				webLQAErrors: row.Info.LQAErrors,
				comments: row.Info.Comments,
				rangeForCorrectedLQA: null,
				sourceSegmentChanges: row.SourceSegment.Changes,
				targetSegmentChanges: row.TargetSegment.Changes,
			},
			PerformOnOriginalView: true,
		}

		$.ajax({
			type: "POST",
			url: MQ.getAppRootUrl() + 'api/TranslationService/GetTranslationResults',
			data: JSON.stringify(data),
			// dataType: '*/*',
			headers,
			success: callback
		});
	}

	MemoQ.getTips = function getTips(callback) {
		if(typeof callback!=='function') return console.log('没有回调函数');
		let rs = MemoQ.tips = []
		let { rows } = MemoQ
		if(rows) {
			let i = 0, len = rows.length;
			let button = $('#ao-menu button[name="copyTips"]')
			if(button.length < 1) return console.error('没有找到copyTips按钮')
			button.prop({disabled: true})

			function next(data){
				let row = rows[i]
				if(row) {
					MemoQ.getTip(rows[i], next)
				} else {
					// complete
					console.log('complete tips')
					callback(MemoQ.tips)
					button.prop({ disabled: false })
					button.text(`copyTips`)
				}
				if(data && data.Value && Array.isArray(data.Value.Hits)) {
					data.Value.Hits.forEach((hit)=>{
						rs.push({
							source: hit.SourceDisplayText, // "大书箱"
							target: hit.TargetDisplayText,// "서류함(대)"
							type: hit.Type,// 0红 1蓝 2紫
						})
					})
					button.text(`tips(${i}/${len})`)
				}
				i++
			}

			next()
		}
	}


	function stringifyST(rows) {
		// rows  {id, locked, source2 , target2, tag }
		let ret = ''
		rows.forEach((e, i, a) => {
			let { locked, source2, target2, tag } = e;
			if (locked) return;
			tag.forEach((t) => {
				let [a, b] = t
				target2 = target2.replace(a, b)
			})
			ret += source2 + '\t' + target2 + '\n'
		});
		return ret
	}

	function View(memoQ) {
		$('#ao-mask').remove();
		this.memoQ = memoQ;
		let height = screen.availHeight;
		let html = `<div id="ao-mask">
<style>
#ao-edit .tag, #ao-edit .source, #ao-edit .target {
	width: 24vw;
}
#ao-mask{
	margin:0;
	padding:0;
	width:100%;
	height:100%;
	background:#000e;
	position:fixed;
	top:0;
	left:0;
	z-index:999;
	overflow: auto;
}
#ao-mask table {
	max-width:80%;
	background:#fff;
	margin:0 auto;
}
#ao-mask td{
	min-width:1em;
	max-width:20vw;
	min-height:1em;
	vertical-align: top;
	border: 1px solid #ccc;
	color: #000;
}
#ao-mask tr:hover{
	background:#ff07;
}
#ao-preview td{
	padding: .5em;
}
#ao-preview tr:even {
	background:#00f3;
}
#ao-mask textarea{
	width: 100%;
	height: 200px;
	resize: none;
	margin: 0;
	padding: 0;
	outline: none;
	border: none;
	text-shadow: 3px 3px 3px #ccc;
}
#ao-mask button {
	width: auto!important;
	height: auto!important;
	background: #5c6;
}
#ao-mask #ao-edit .target {
	user-modify: read-write-plaintext-only;
	-webkit-user-modify: read-write-plaintext-only;
}
textarea#ao-hiddenclip {
	width: 10px!important;
	height: 10px!important;
	position: fixed!important;
	top: -100px!important;
	left: -100px!important;
}
</style>
<table>
	<tbody id="ao-menu">
		<tr>
			<td></td>
			<td>
				<button name="close">close</button>
				<button name="copyTips">copyTips</button>
				<button name="copyST">copyST</button>
			</td>
			<td>
				<button name="save">save</button>
			</td>
		</tr>
	</tbody>
	<tbody>
		<tr>
			<th>no</th>
			<th>source(원본)</th>
			<th>source(태그처리)</th>
			<th>target(번역문)</th>
		</tr>
	</tbody>
	<tbody id="ao-edit">
		<tr>
			<td class="no">#</td>
			<td class="tag"><textarea readonly></textarea></td>
			<td class="source"><textarea readonly></textarea></td>
			<td class="target"><textarea></textarea></td>
		</tr>
	</tbody>
	<tbody id="ao-preview">
	</tbody>
</table>
<textarea id="ao-hiddenclip"></textarea>
</div>`;
		var c = this.content = $(html).appendTo('body');
		c.find('button[name="close"]').one('click', () => {
			c.remove();
		});
		c.find('button[name="save"]').one('click', (event) => {
			let rows = [];
			c.find('#ao-preview tr').each((i, e) => {
				e = $(e);
				// 运行时提交的数据
				let o = {
					id: e.attr('id'),
					source: e.find('.source').attr('data-original'),
					sourceSegmentEditorString: e.find('.source').attr('data-sourcesegmenteditorstring'),
					originSourceSegmentEditorString: e.find('.source').attr('data-originsourcesegmenteditorstring'),
					target: addRPR(addBracketLeft(e.find('.target').text())),
				}
				if (o.target.length) rows.push(o);
			})

			if (rows.length) {
				// 保存
				// console.warn(rows);
				this.memoQ.setRows(rows, (data) => {
					if (data.Success) {
						c.remove();
						location.reload();
					} else {
						alert('원인 불명의 에러가 발생 하였습니다.');
						console.log(data);
					}
				});
			} else {
				alert('번역문이 전부 비어 있습니다.');
			}
		});
		c.find('#ao-edit .target textarea').on('change', function (e) {
			// console.log(e.type);
			let text = e.target.value;
			let texts = text.split('\n');
			$(`#ao-preview tr td.target`).each((i, e) => {
				$(e).text(texts[i]);
			});
		})
		c.find('button[name="copyST"]').on('click', ()=>{
			let v = stringifyST(MemoQ.res)
			let o = document.querySelector('#ao-hiddenclip')
			o.value = v
			o.focus()
			o.select()
			if(!document.execCommand('copy')) alert('Unable to copy')
			console.log(v)
		})
		c.find('button[name="copyTips"]').on('click', () => {
			let v = stringifyTips()
			let o = document.querySelector('#ao-hiddenclip')
			o.value = v
			o.focus()
			o.select()
			if (!document.execCommand('copy')) alert('Unable to copy')
			console.log(v)
		})
	}

	View.prototype.from = function (rows) {
		// rows: {locked, id, source, source2, tag, target, target2 }

		let c = this.content, ta = $('#ao-edit .target textarea', c);

		// 将ajax获取的数据显示为HTML

		let trs = rows.map((row, index) => {
			return $('<tr>').attr('id', row.id)
				.append($('<td class="no">').text(index + 1))
				.append($('<td class="source">')
					.text(row.source2)
					.attr('data-originsourcesegmenteditorstring', row.originSourceSegmentEditorString)
					.attr('data-sourcesegmenteditorstring', row.sourceSegmentEditorString)
					.attr('data-original', row.source))
				.append($('<td class="tag">').text(JSON.stringify(row.tag)))
				.append($('<td class="target" contenteditable="plaintext-only">')
					.text(row.target2)
					.attr('data-original', row.target)
					.on('keydown', function (e) {
						if (e.keyCode === 13) {
							e.preventDefault();
						} else {
							setTimeout(() => {
								let text = $('#ao-preview tr td.target', c).toArray().map(function (e) {
									let row;
									row = $(e).text();
									return row;
								}).join('\n');
								ta.val(text);
							});
						}
					}));
		});

		// 最上方的内容
		let tags = [];// 标签内容
		let sources = [];// 原文
		let targets = [];// 译文

		rows.forEach(row => {
			sources.push(row.source2);
			targets.push(row.target2);
			tags.push(row.source);
		})

		this.content.find('#ao-preview').empty().append(trs);

		this.content.find('#ao-edit .source textarea').val(sources.join('\n'));
		this.content.find('#ao-edit .target textarea').val(targets.join('\n')).focus();
		this.content.find('#ao-edit .tag textarea').val(tags.join('\n'));
	}

	var mq = new MemoQ;
	var cacheRows
	var v = new View(mq);

	mq.getRows((rows) => {
		v.from(rows);
		MemoQ.getTips(console.log);
	});

	function stringifyTips(){
		return MemoQ.tips.filter(e => e.type < 2).map(e => `${e.source}\t${e.target}`).join('\n')
	}

	function clearBracketLeft(t) {
		return t.replace(/\[\[([^\]]*?)\](?!\])/gimu, '[$1]');
	}
	function addBracketLeft(t) {
		// return t.replace(/\[(?!(\/?)(b|i|u|-|[0-9A-Za-z]{4}|[0-9A-Za-z]{6})\])/gimu, '[[');
		// [b]..[/b]
		// [u]..[/u]
		// [i]..[/i]
		return t.replace(/\[(?!(\/?)(b|i|u)\])/gimu, '[[');
	}
	function clearRPR(t) {
		return t.replace(/\{(\d+)>([^<]+?)<\1\}/gimu, '$2');
	}
	// 读取target时，删除{{abc}中的{{
	function clearRPR2(t) {
		return t.replace(/\{{2}(?!\d+>)/gimu, '{');
	}
	function addRPR(t) {
		return t.replace(/\{(?!\d+>)/gimu, '{{')
	}
	// let s = '[b]Bold[/b] [ff00ff]color[-] [你好]  {1>rpr1<1} {haha}'
	// s = addRPR(s)
	// console.log(s)

	
}// domain end





/* getTips
POST https://sakura.memoq.com/gamedex-l10n/api/TranslationService/GetTranslationResults
{
	"DocInstanceId":"fac04bf5-4347-47d9-9a44-b188e1090be4",
	"Row":{
		"docInstanceId":"fac04bf5-4347-47d9-9a44-b188e1090be4",
		"id":1,
		"sourceSegmentHtml":"韩国版占用",
		"targetSegmentHtml":"",
		"locked":false,
		"translationState":0,
		"warnings":[],
		"webLQAErrors":[],
		"comments":[],
		"rangeForCorrectedLQA":null,
		"sourceSegmentChanges":[],
		"targetSegmentChanges":[]
	},
	"PerformOnOriginalView":true
}
{"DocInstanceId":"20d504ba-ea81-4700-9a8e-f8a1d3c0a6e3","Row":{"docInstanceId":"20d504ba-ea81-4700-9a8e-f8a1d3c0a6e3","id":0,"sourceSegmentHtml":"韩国版占用","targetSegmentHtml":"","locked":false,"translationState":0,"warnings":[],"webLQAErrors":[],"comments":[],"rangeForCorrectedLQA":null,"sourceSegmentChanges":[],"targetSegmentChanges":[]},"PerformOnOriginalView":true}
{"DocInstanceId":"20d504ba-ea81-4700-9a8e-f8a1d3c0a6e3","Row":{"docInstanceId":"20d504ba-ea81-4700-9a8e-f8a1d3c0a6e3",       "sourceSegmentHtml":"韩国版占用","targetSegmentHtml":"","locked":false,"translationState":0,"warnings":[],"webLQAErrors":[],"comments":[],"rangeForCorrectedLQA":null,"sourceSegmentChanges":[],"targetSegmentChanges":[]},"PerformOnOriginalView":true}
*/

