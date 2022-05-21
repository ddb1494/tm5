document.querySelector('#workPaste').addEventListener('paste', function (e) {
	e.preventDefault()
	onPaste(e)
})


function onPaste(event) {
	let { clipboardData: cd } = event
	let h = cd.getData('text/html')

	if (h) {
		// let _h = new DOMParser().parseFromString(h, 'application/xml');
		// let _h = new DOMParser().parseFromString(h, 'text/html');// 
		// log(_h)
		if (isMicrosoftOffice(h)) {
			let _h = document.implementation.createHTMLDocument('')
			_h.documentElement.innerHTML = h

			if(isWord(h)) {
				console.log('Microsoft Offce %cWord', 'background:#aaf')
				pushlog('Microsoft Offce Word')
				// console.log(h)
				// h = Array.from(_h.body.querySelectorAll('p')).map(e=>e.textContent.replace(/\n/g,' ')).join('\n')
				h = cd.getData('text/plain')

				console.log(_h.body)

				// parseWord
				// let rows = []
				// text.split('\n').forEach(row=>{
				// 	row = row.trim()
				// 	if(row){
				// 		// row = row.replace(/\s/g, ' ')
				// 		// row = row.replace(/\r\n|\n/g, '\\n').replace(/\t/g, '\\t')
				// 		rows.push(row)
				// 	}
				// })
				// h = rows.join('\n')
				// log(h)
			}else if(isExcel(h)) {
				console.log('Microsoft Offce Excel')
				pushlog('Microsoft Offce Excel')
				// let rows = []
				// let trs = Array.from(_h.body.querySelectorAll('tr'))
				// if(trs.length) {
				// 	trs.forEach((tr)=>{
				// 		let tds = Array.from(tr.querySelectorAll('td'))
				// 		if (tds.some((td) => td.textContent.trim())){
				// 			let row = tds.map((td)=>{
				// 				return td.textContent.replace(/\r\n\s*/g, '\\n').replace(/\n\s*/g, '\\n').replace(/\t/g, '\\t')
				// 			}).join('\t')
				// 			rows.push(row)
				// 		}
				// 	})
				// }
				// h = rows.join('\n')

				h = cd.getData('text/plain')
				let tsv=d3.tsvParse(h, (d,i,a)=>a.map(k=>d[k]))
				h = tsv.columns.map(e => e.replace(/\r/gm,'\\r').replace(/\n/gm,'\\n')).join('\t') + '\n' + tsv.map(row => row.map(e=>e.replace(/\r/gm,'\\r').replace(/\n/gm,'\\n')).join('\t')).join('\n')
				// log(tsv)
				// h = [ tsv.columns.map((e) => {
				// 	return String(e).replace(/\n/g, '\\n').e.replace(/\t/g, '\\t')
				// })]
				// tsv.forEach(row=>{
				// 	h.push(tsv.columns.map((k)=>row[k].replace(/\n/g,'\\n').replace(/\t/g,'\\t')))
				// })
				// h = h.map(e=>e.join('\t')).join('\n')
				// log(h)
			}else{
				pushlog('Microsoft Offce')
				// console.log('Microsoft Offce')
				h = cd.getData('text/plain');
				return alert('This may be an  MICROSOFT OFFICE file, but it is currently NOT RECOGNIZED.');
			}
		} else {
			console.log('Not Microsoft Office')
			pushlog('Not Microsoft Office')
			h = cd.getData('text/plain');
		}
	}else{
		console.log('textplain')
		pushlog('textplain')
		h = cd.getData('text/plain');
	}
	addWork(h)
}

function addWork(h, name, type) {
	// h    用tab分隔的text
	if (h) {

		let a = stringToArray(h);// 外部模块
		// console.log(a);
		a.forEach((e, i, a) => a[i] = e.filter(e => e));
		let maxLength = a.reduce((r, e) => Math.max(r, e.length), 0);
		a.forEach(e => {
			let l = maxLength - e.length;
			while (l > 0) {
				e.push('');
				l--;
			}
		});
		console.log(h)

		if (maxLength > 0) {
			// 粘贴1列的情况, 明显只有原文
			{
				let f = document.createDocumentFragment();
				let tbody = document.createElement('tbody');// tbody中无法再加入table
				tbody.style.border = 'none'
				tbody.style.outline = 'none'
				// let table = document.createElement('table');
				tbody.setAttribute('dataname', name || `${location.search.slice(1)}-${ftime('Ymd-His-ms')}`)
				tbody.setAttribute('datatype', type || 'tmtoolfile')

				f.appendChild(tbody);

				a.forEach((e, i) => {
					let tr = tbody.appendChild(document.createElement('tr'));
					let no = tr.appendChild(document.createElement('td'));
					no.classList.add('no');
					no.textContent = i + 1;
					let source = tr.appendChild(document.createElement('td'));
					source.classList.add('source');
					source.textContent = e[0].replace(/\r/gm,'\\r').replace(/\n/gm,'\\n');
					let target = tr.appendChild(document.createElement('td'));
					target.classList.add('target');
					target.contentEditable = 'plaintext-only';
					if (maxLength > 1) target.textContent = e[1];// 译文
					if (maxLength > 2) {
						let comment = tr.appendChild(document.createElement('td'));
						comment.classList.add('comment');
						comment.textContent = e.slice(2).join('\n');
					}
					if (e[0].trim().length === 0) tr.classList.add('emptyRow');
				});
				// console.log(table)
				document.getElementById('works').appendChild(f);
				delete f;
			}
			pushlog('번역내용 추가');


			let offset = $('#workPaste').offset();
			showTip({ text: '번역내용 추가', css: Object.assign({ background: '#ff0c' }, offset), animate: { top: Math.max(0, offset.top - 10) + 'px' }, delay: 1000 });
		}
	}
}

function isMicrosoftOffice(text) {
	// xmlns:o="urn:schemas-microsoft-com:office:office" 
	return text && /^<html[\s\S]+?microsoft-com:office:office"[\s\S]+?>/mi.test(text)
}
function isWord(text) {
	// xmlns: w = "urn:schemas-microsoft-com:office:word"
	return text && /^<html[\s\S]+?microsoft-com:office:word"[\s\S]+?>/mi.test(text)
}
function isExcel(text) {
	// 	xmlns:x="urn:schemas-microsoft-com:office:excel"
	return text && /^<html[\s\S]+?microsoft-com:office:excel"[\s\S]+?>/mi.test(text)
}
function parseWord(doc) {
	let h
	h = Array.from(doc.querySelectorAll('p')).map(p => {
		return p.textContent.replace(/\r/gm,'\\r').replace(/\n/gm,'\\n').repleace(/\t/gm, ' ');
	}).join('\n');
	if (!h) {
		h = Array.from(doc.querySelectorAll('span')).map(span => {
			return span.textContent.replace(/\r/gm,'\\r').replace(/\n/gm,'\\n').replace(/\t/gm, ' ');
		}).join('\n');
	}
	
	console.log(doc, h)
}


// 遍历DOM：实现方式1
function treeWalkerNode(node, filter, callback) {
	if(typeof callback!=='function') return ;
	if (!(typeof filter === 'number')) filter = NodeFilter.SHOW_ALL
	let treeWalker = document.createTreeWalker(node, filter, null, false);
	while (node = treeWalker.nextNode()) {
		callback(node)
	}
}

// 遍历DOM：实现方式2
function iteratorNode(node, filter, callback) {
	if(typeof callback!=='function') return ;
	if(!(typeof filter==='number')) filter = NodeFilter.SHOW_ALL
	let iterator = document.createNodeIterator(node, filter, null, false);
	while (node = iterator.nextNode()) {
		callback(node)
	}
}

// 删除注释
function clearComments(node) {
	iteratorNode(node, NodeFilter.SHOW_COMMENT, (node) => node.remove())
}

// 字符串转为数组
function stringToArray(t, n = 0) {
	let rs = []
	if (typeof t === 'string') {
		t.split('\n').forEach(function (line) {
			if (line.trim()) {
				let row = line.split('\t').map(function (cell) {
					return cell.trim()
				})
				if (row.length >= n) rs.push(row)
			}
		})
	}
	return rs
}