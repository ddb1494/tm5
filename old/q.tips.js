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

// 2019-12-20  ddb1494@gmail.com
// v7版本的目的是，解决上传时(<[{等4种括号的问题。
// 根据观察得知，当该行内存在参数时，这些括号须提交两个才能最终成为一个。即想提交“[你好]”，就必须提交“[[你好]”。

function createPromise() {
	let s = new Map();
	let p = new Promise(function (a, b) { s.set('a', a); s.set('b', b); });
	p.resolve = s.get('a');
	p.reject = s.get('b');
	return p;
}

function post(url, data, callback) {
	let p = createPromise();

	url = MQ.getAppRootUrl() + url;
	let req = new XMLHttpRequest();
	req.open('POST', url, true);//异步
	req.setRequestHeader('accept', '*/*');
	req.setRequestHeader('content-type', 'application/json; charset=UTF-8');
	req.setRequestHeader('x-xsrf-token', MQ.getCookieValue('X-XSRF-TOKEN'));
	//req.setRequestHeader('x-xsrf-token', document.cookie.match(/X-XSRF-TOKEN=(.+);?/)[1]);
	req.responseType = 'json';
	req.send(JSON.stringify(data));
	req.onloadend = function (ev) {
		let { target } = ev;
		let data = target.response;
		//console.log(data);
		p.resolve(data);
	};

	req.onabort = req.onerror = p.reject;

	return p;
}

function createArrayRange(start = 0, end) {
	if (arguments.length < 1) {
		end = start;
	}
	let res = [];
	while (start <= end) {
		res.push(start++);
	}
	return res;
};


function getRows(start, end, callback) {// 获取记录 [ {id,source,target,locked} ,...]
	start = start || 0;
	end = end || WebTrans.Core.numberOfRows;

	let url = 'api/TranslationService/GetWebContent';
	let data = {
		DocInstanceId: WebTrans.Doc.docInstanceId,
		RowIndicies: createArrayRange(start, end)
	};

	let readError = false
	let p = post(url, data);

	//p.then((data)=>{})
	//data的主要内容为{ Success:true,    Value:{ Rows:[] }, }
	//Rows的主要内容为{ Row:{ Guid, Id, Info:{Locked}, OriginalSourceSegment, SourceSegment, TargetSegment }, Index:0 }
	//SourceSegment的主要内容为{ EditorString, ITaglist:[ {NumID, Type, Name, AttrInfo } ] }



	return p.then(function (data) {
		if (data && data.Success && data.Value && data.Value.Rows) {
			let readError = false;
			let result = [];

			let { Rows } = data.Value;
			let rows = Rows.map(e => e.Row);
			//let nonLockedRows = Rows.filter(e => !e.Info.Locked);

			for (let row of rows) {
				let rowId = row.Id;
				let locked = row.Info.Locked;
				let taglist = row.SourceSegment.ITaglist.filter(e => {
					if (e.Name === 'rpr' && (e.Type === 0 || e.Type === 1)) return false;// 不要rpr
					return true;
				}).map(e => {
					//e: { NumID:1, Type:2, Name:'mq:ch', AttrInfo: 'val="", TextPosition:9 }
					//e: { NumID:1, Type:2, Name:'mq:rxt', AttrInfo: 'displaytext="<color=#2ccb9b>" val="<color=#2ccb9b>", TextPosition:15 }
					let {
						NumID,
						Type,
						Name,
						AttrInfo,
						TextPosition
					} = e;

					if (Type === 2) {
						let k = '<' + NumID + '>';
						let v = AttrInfo;

						if (/^val="/i.test(v)) {
							v = v.slice(5, -1);
						} else if (/^displaytext="[\s\S]+" val="/i.test(v)) {
							if (v.match(/" val="/g).length === 1) {
								v = v.slice(v.lastIndexOf('" val="') + 7, -1);
							} else {
								v = '\\*\\*\\*\\*\\*ReadError1\\*\\*\\*\\*\\*'
								console.error('ReadError1')
								readError = true
							}
						} else {
							v = '\\*\\*\\*\\*\\*ReadError2\\*\\*\\*\\*\\*'
							console.error('ReadError2')
							readError = true
						}

						// v === '\r\n'
						let b = /(\r?)\n/g.test(v);// 1.8
						//console.warn('发现换行符', e);

						v = v.replace(/(\r?)\n/g, '\\n').replace(/\t/g, '\\t');

						return { NumID, Type, Name, AttrInfo, TextPosition, k, v, b };
					}
					return e;//[{NumID,Type,TextPosition,Name,AttrInfo}]
				});


				// 保留原文对策
				let {
					OriginalSourceSegment,
					SourceSegment,
					TargetSegment,
				} = row;

				let sourceOriginal = SourceSegment.EditorString;
				let targetOriginal = TargetSegment.EditorString;

				let source = sourceOriginal;
				let target = targetOriginal;


				if (taglist.length) {
					taglist.forEach((e) => {
						if (e.k) {
							source = source.replace(e.k, e.v);
							target = target.replace(e.k, e.v);
						}
					});
					//console.warn('由于行内存在tag，或许会需要删除原文译文中的部分括号。', { source, target });// v7
				} else {
				}
				//console.group(rowId);
				//{
				//	//console.log(taglist);
				//	console.log(`source:${source === sourceOriginal}, target:${target === targetOriginal}`);
				//	console.log('[原生]', sourceOriginal);
				//	console.log('[处理]', source);
				//	console.log('[原生]', targetOriginal);
				//	console.log('[处理]', target);
				//}
				//console.groupEnd(rowId);

				if (!row.Info.Locked) {
					let row = {
						locked,
						id: rowId,
						OriginalSourceSegment,
						SourceSegment,
						TargetSegment,
						taglist,
						source,
						sourceOriginal,
						target,
						targetOriginal,
					};

					result.push(row);
				}
			}
			if (readError) {
				alert('Have ReadError!');
			}

			return result;

		}
		else {
			alert('통신 장애로 데이터에 실패하였습니다. 로그인 상태를 체크해 주십시오.');
		}
	});
}


function getTips(rows) {

	let tips = []
	if (rows) {
		let i = 0, len = rows.length;
		function next(data) {
			let row = rows[i]
			if (row) {
				getTip(rows[i], next)
			} else {
				// complete
				console.log('complete tips')
				callback(MemoQ.tips)
				button.prop({ disabled: false })
				button.text(`copyTips`)
			}
			if (data && data.Value && Array.isArray(data.Value.Hits) && data.Value.Hits.length) {
				data.Value.Hits.forEach((hit) => {
					let source = hit.SourceDisplayText;// 大书箱
					let target = hit.TargetDisplayText;// 서류함(대)
					let type = hit.Type;// 0红 1蓝 2紫

					if (source && target) {
						tips.push({ source, target, type });
					}
				})
				button.text(`[(${(100 * i / len) >> 0}%] ${tips.length}`);
			}
			i++
		}
		next()
	}
}

function getTip(row) {
	let promise = createPromise()
	//console.log(row)
	headers = {
		'accept': '*/*',
		'content-type': 'application/json; charset=UTF-8',
		// 'x-xsrf-token':document.cookie.match(/X-XSRF-TOKEN=(.+);?/)[1]
		'x-csrf-token': MQ.getCookieValue('X-CSRF-TOKEN')
	};
	let { id, locked } = row;
	let data = {
		DocInstanceId: WebTrans.Doc.docInstanceId,
		Row: {
			docInstanceId: WebTrans.Doc.docInstanceId,
			id,
			locked,
			sourceSegmentHtml: row.SourceSegment.EditorString,
			targetSegmentHtml: row.TargetSegment.EditorString,
			//locked: row.Info.Locked,
			//translationState: row.Info.TranslationState,
			//warnings: row.Info.Warnings,
			//webLQAErrors: row.Info.LQAErrors,
			//comments: row.Info.Comments,
			rangeForCorrectedLQA: null,
			//sourceSegmentChanges: row.SourceSegment.Changes,
			//targetSegmentChanges: row.TargetSegment.Changes,
		},
		PerformOnOriginalView: true,
	}

	let req = new XMLHttpRequest();
	req.open('POST', MQ.getAppRootUrl() + 'api/TranslationService/GetTranslationResults');
	req.responseType = 'json'
	for(let k in headers) {
		let v = headers[k]
		req.setRequestHeader(k, v)
	}
	req.onload = function(){
		let json = req.response;
		if(json.Success) {
			let { Value: { Hits } } = json;
			let hits = [];
			Hits.forEach(e=>{
				let {
					SourceDisplayText: source,
					TargetDisplayText: target,
					Type: type,
				} = e;

				// 0红 1蓝 3黄 4紫
				if(type==0 || type==1) {
					hits.push({ type, source, target});
				}
				else if(type==2){
					console.error('【稀有结果，请关注】类型2~')
					console.error({ type, source, target})
				}

			})
			promise.resolve(hits)
		}
		else {
			promise.reject()
		}
	}
	req.send(JSON.stringify(data))
	return promise
}



getRows().then(async (rows) => {
	console.clear();
	let s = [];
	for(let i=0, len=rows.length; i<len; i++) {
	//for(let i=0, len=10; i<len; i++) {
		console.log(`${i+1}/${len}`)
		let row = rows[i]
		try{
			let v = await getTip(row)
			v.forEach(ve=>{
				let hasEqual = s.some((se)=>se.source === ve.source && se.target === ve.target)
				if(!hasEqual) s.push(ve)
			})
		}catch(err){
			console.error(err)
		}
	}
	//console.clear();
	s = s.filter(e=>e.source && e.target && e.source!==e.target)
	s = s.reduce((r,e)=>`${r}\n${e.source}\t${e.target}`, '')
	console.log(s);
});