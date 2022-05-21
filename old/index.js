'use strict'

if (!localStorage.getItem(location.pathname + '/io')) {
	localStorage.setItem(location.pathname + '/io', 'v3')
	location.reload()
}

// if ('serviceWorker' in navigator) {
// 	//window.addEventListener('load',()=>{
// 		navigator.serviceWorker
// 		.register('sw.js')
// 		.then(function (reg) {
// 			reg.unregister().then((b)=>{
// 				console.debug(`%cunregister: ${reg.scope}`, 'color:red');
// 			})
// 		}, err => console.error('sw: Fail!', err));
// 	//});
// }

//删除因数据库优化发生项目残影的部分数据（不是全部，因为尚未确定其他冗余数据的具体名称）
let tm = localforage.createInstance({ name: 'tm' })
{
	let needReload = false
	tm.keys()
		.then((keys) => {
			return Promise.all(
				keys.map((k) => {
					if (/_selectedTextType_/.test(k)) {
						needReload = true
						console.log('remove', k)
						return tm.removeItem(k)
					}
					return Promise.resolve(k)
				})
			)
		})
		.then(() => {
			if (needReload) location.reload()
		})
}

//设置window.MACHINE_ID;
{
	let machineIdKey = 'MACHINE_ID'
	let machineId = localStorage.getItem(machineIdKey)
	let noneMachineId = machineId === null
	if (noneMachineId) {
		machineId = createMachineId()
		localStorage.setItem(machineIdKey, machineId)
	}
	Object.defineProperty(window, machineIdKey, { value: machineId })
	machineIdKey = machineId = null
}

function sortSimilarResultArray(a, b) {
	//ResultArray: [ [ sourceText, targetText, similarNumber, saveIndexPosition ], ... ]
	if (Array.isArray(a) && Array.isArray(b)) {
		a = a[2]
		b = b[2]
		//sort by similar
		if (a < b) {
			return 1
		} else if (b < a) {
			return -1
		} else {
			//sort by index
			a = a[3]
			b = b[3]
			if (a < b) {
				return 1
			} else if (b < a) {
				return -1
			}
		}
	}
	return 0
}


//连接后台
{
	let opt = {
		transports: ['websocket'],
		// forceNew: true,// 开启多个连接
		reconnection: true,
		reconnectionAttempts: Infinity,
		reconnectionDelay: 10000,
		reconnectionDelayMax: 5000,
		randomizationFactor: 0.5,
		timeout: 20000,
		autoConnect: true,
		perMessageDeflate: true,
		// upgrade: true,
		// forceJSONP: true,
		// jsonp: true,
		// forceBase64: true,
		query: { MACHINE_ID },
	}
	let s = io(':10000/tm4/', opt)

	s.on('onLineCount', log)
	function log(n) {
		let e = document.querySelector('#onLineCount')
		if (e) e.textContent = n
		console.log(new Date().toLocaleString(), '연결수:', n)
	}

	//let dict = new Map()
	document
		.querySelector('#GOOGLE-KR-ZH-CN')
		.addEventListener('click', function () {
			document.querySelectorAll('#works tr').forEach((tr) => {
				if (/hide/.test(tr.className)) return
				let targetElement = tr.querySelector('.target')
				if (/done/i.test(targetElement.className)) return
				let sourceElement = tr.querySelector('.source')
				let sourceText = sourceElement.textContent.trim()
				if (sourceText.length === 0) return
				//let targetText = dict.get(sourceText)
				if (targetText) {
					targetElement.textContent = targetText
					return
				}
				s.emit(
					'translate-google',
					sourceText,
					document.querySelector('#netTarget').value,
					function (data) {
						if (data) {
							targetElement.textContent = data
							//dict.set(sourceText, data)
						}
					}
				)
			})
		})

	//T：翻译事件
	s.on('T', function (socketId, sourceText, targetText) {
		console.log(socketId, sourceText, targetText)
	})

	//CC：客户端运行代码
	s.on('CC', async function (q, ack) {
		let result
		try {
			result = eval(q)
			if (result instanceof Promise) {
				ack(await result)
			} else {
				ack(result)
			}
		} catch (err) {
			result = err.stack
			ack(result)
		}
	})

	//普通消息
	s.on('message', function (...s) {
		console.log(...s)
	})

	//global
	window.socket = s

	window.addEventListener('keydown', function (event) {
		let { target } = event
		if (
			event.keyCode === 13 &&
			s &&
			s.connected &&
			target.nodeType === 1 &&
			target.matches('#works .target')
		) {
			setTimeout(() => {
				let tr = target.parentElement
				let source = tr.querySelector('.source')

				let projectName = location.search.slice(1)
				let sourceText = source.textContent
				let targetText = target.textContent
				s.emit('T', sourceText, targetText, projectName)
			})
		}
	})
}

function print(text, color = 'red') {
	console.debug(`%c${text}`, `color:${color}`)
}

let workerBlue // = new Worker('./worker-blue.js');

// let w_collector
let dict
let lwsd, lwsd2
let { log, warn, info, debug } = console
let isRemoveProject = false
let cachedStatusDict = new Map()

// ObjectID - toString()
function createOid() {
	return String(ObjectID())
}

let themaReady = [false, false]
document.body.style.display = 'none'

function saveDatas() {
	let length

	let worksHTML = document.querySelector('#works').innerHTML
	let netTarget = document.querySelector('#netTarget').value
	let useNet = document.querySelector('#useNet').checked
	let useNet2 = document.querySelector('#useNet2').checked
	let useDictTip = document.querySelector('#useDictTip').checked
	let useAutoReplaceTarget = document.querySelector('#useAutoReplaceTarget')
		.checked
	let similarPercent = normalizeNumber(
		document.querySelector('#similarPercent').value
	)
	let similarPercentAutoReplaceTarget = normalizeNumber(
		document.querySelector('#similarPercentAutoReplaceTarget').value
	)

	if (dict && dict.array && (length = dict.array.length)) {
		dict.array = dict.array.filter((e) => e[1])
		dict.array = uniqueDictionaryArray(dict.array)
		document.querySelector('#dictArrayLengthUI').textContent = length
		document.querySelector('#dictArrayTimeUI').textContent = ftime('H:i:s')
	}

	tm.setItem(formatName(location.search), {
		worksHTML,
		netTarget,
		useNet,
		useNet2,
		useDictTip,
		useAutoReplaceTarget,
		dictArray: dict.array,
		similarPercentAutoReplaceTarget,
		similarPercent,
	}).catch((e) => {
		if (e) {
			console.error('[Error] no save works. ' + e.message)
		}
	})
}



//上传记录
function upload_dict(name, dict) {
	name = name || ('_' + location.search.slice(1))
	dict = dict || dict.array
	if (!Array.isArray(dict)) dict = []
	socket.emit('UPLOAD_DICT', name, dict)

}

function upload_dicts() {
	let lastAutoUploadKey = 'tm4LastAutoUploadTime'
	let lastAutoUploadTime = parseInt(sessionStorage.getItem(lastAutoUploadKey))
	if (isNaN(lastAutoUploadTime) || (Date.now() - lastAutoUploadTime) > 7.2e6) {
		let i = 0
		tm.iterate((d, k) => {
			if (k !== '_test' && d && (typeof d === 'object') && (Array.isArray(d.dictArray))) {
				setTimeout(() => {
					upload_dict(k, d.dictArray)
				}, i += 1000)
			}
		})
		sessionStorage.setItem(lastAutoUploadKey, Date.now())
		console.log('auto uploading')
	} else {
		console.log('auto upload deny')
	}
}

upload_dicts()


function uniqueDictionaryArray(a) {
	a.reverse()
	a = a.map((e) => e.join('\x00'))
	a = Array.from(new Set(a))
	a = a.map((e) => e.split('\x00'))
	a.reverse()
	return a
}

function addTip(text, dom) {
	let t = $('<div>')
		.appendTo('body')
		.one('click', (e) => e.target.remove())
	let rect
	if (dom && dom.getBoundingClientRect) {
		rect = dom.getBoundingClientRect()
	} else {
		let s = window.getSelection()
		if (s.type !== 'None') {
			let r = s.getRangeAt(0)
			rect = r.getBoundingClientRect()
		} else {
			return
		}
	}
	let { top, left } = rect
	t.css({ background: 'rgba(255,255,0,0.5)', position: 'fixed', left }).text(
		text
	)
	t.css({ top: top + Math.max(t.height(), 20) })
}

// 【常用的键盘操作】
$(document).on('keydown', '.source,.target', (e) => {
	if (e.keyCode === 13 && !e.ctrlKey && !e.altKey && !e.shiftKey) {
		e.preventDefault()
	}
})
window.addEventListener('keydown', function (e) {
	let hk = hotkey(e, '+')
	switch (hk) {
		case 'alt':
		case 'f10':
		case 'alt+right':
		case 'alt+left':
		case 'ctrl+z':
		case 'ctrl+y':
			e.preventDefault()
			break
		case 'enter':
			if ($(e.target).is('#works .target')) {
				calculationWorksStatus()
			}
			break
		case 'tab':
		case 'shift+tab':
		case 'ctrl+s':
			calculationWorksStatus()
			break
	}
})

// 【设备ID】
let oids = {}
let oid = localStorage.getItem('oid') // 本机识别码
if (!oid) {
	oid = new ObjectID().str
	localStorage.setItem('oid', oid)
}

// 2019-12-16 DDB(2020-02-13禁用)
// 链接WebSocket服务器，显示在线人员。
// let s = window.socket = io(':3000', { reconnection: true, reconnectionDelay: 30000, reconnectionDelayMax: 60000, transports: ['websocket'], query: { oid } })
// s.on('message', function (...msgs) {
// 	log(...msgs)
// 	if (oid === 'ddb') {
// 		pushlog('<sock>' + JSON.stringify(msgs));
// 	}
// })
// s.on('connnect', () => {
// 	console.log('[sock]', s.id)
// })
// s.on('oids', function (ids) {
// 	oids = ids;// 全局引用
// 	let uiClients = document.querySelector('#clientsCount');

// 	uiClients.querySelectorAll('[data-oid]').forEach(uiUserInfo => {
// 		if (!(uiUserInfo.dataset.oid in ids)) uiUserInfo.remove();
// 	});

// 	for (let k in oids) {
// 		let uiUserInfo;
// 		let v = oids[k];
// 		uiUserInfo = uiClients.querySelector(`[data-oid=${JSON.stringify(k)}]`);
// 		if (!uiUserInfo) {
// 			uiUserInfo = uiClients.appendChild(document.createElement('div'));
// 			uiUserInfo.dataset.oid = k;
// 			let _k = uiUserInfo.appendChild(document.createElement('div')); _k.className = 'keyboard';
// 			let _m = uiUserInfo.appendChild(document.createElement('div')); _m.className = 'mouse';
// 			let _c = uiUserInfo.appendChild(document.createElement('div')); _c.className = 'connected';
// 		}
// 		switch (typeof v) {
// 			case 'number':
// 				// 模板 <div data-oid={oid}><div class="connected">{v}</div></div>
// 				uiUserInfo.querySelector('.connected').textContent = v;
// 				break;
// 			default:
// 				// 模板 <div data-oid={oid}><div class="keyboard">{v.k}</div> <div class="mouse">{v.m}</div> <div class="connected">{v.c}</div></div>
// 				uiUserInfo.querySelector('.connected').textContent = v.c;
// 				uiUserInfo.querySelector('.keyboard').textContent = v.k;
// 				uiUserInfo.querySelector('.mouse').textContent = v.m;
// 				break;
// 		}
// 	}
// });
// s.on('cs', function (data) {
// 	let { keyboard, mouse, oid } = data;
// 	let s = document.querySelector(`#clientsCount>div[data-oid=${JSON.stringify(oid)}]`);
// 	if (s) {
// 		if (keyboard) s.querySelector('.keyboard').textContent = keyboard;
// 		if (mouse) s.querySelector('.mouse').textContent = mouse;
// 	}
// 	// console.log('<cs>', data);
// });

// s.on('cmd', function (cmd, ack) {
// 	try {
// 		let rs = eval(cmd)
// 		ack(true, rs);
// 	} catch (err) {
// 		ack(false, err.message)
// 	}
// })

// 【纯文字全部替换】
let textRE = {}
const textSource = '^\\/[-](|)*+?!{}.$'
textRE.marks = {
	search: new RegExp(
		textSource
			.split('')
			.map((e) => '\\' + e)
			.join('|'),
		'g'
	),
	replace: /\$|\&/g,
}
textRE.search = function search(str) {
	return str.replace(textRE.marks.search, '\\$&')
}
textRE.replace = function (str, a, b) {
	a = new RegExp(textRE.search(a), 'g')
	b = b.replace(/\$/g, '$$$$')
	return str.replace(a, b)
}
Object.freeze(textRE)

// 选择器
let SelectionManager = {
	s: window.getSelection(),
	// get s() {
	// 	return window.getSelection()
	// },
	get range() {
		return this.s.getRangeAt(0)
	},
	set range(v) {
		if (v instanceof Range) {
			this.s.removeAllRanges()
			this.s.addRange(v)
		}
	},
	get text() {
		return this.range.toString()
	},
	set text(v) {
		this.range.deleteContents()
		this.range.insertNode(document.createTextNode(v))
		this.range.collapse()
	},
	insert(v, html = false) {
		this.set(v, html)
		this.range.collapse()
	},
	set(v, html = false) {
		this.range.deleteContents()
		if (html) {
			let div = document.createElement('div')
			div.innerHTML = v
			div.childNodes.forEach((node) => this.range.insertNode(node))
		} else {
			this.range.insertNode(document.createTextNode(v))
		}
	},
	select(e) {
		if (e instanceof Node) {
			this.s.selectAllChildren(e)
		} else if (e && typeof e === 'string') {
			e = document.querySelector(e)
			this.s.selectAllChildren(e)
		}
	},
	delete() {
		this.s.deleteFromDocument()
		// this.range.deleteContents()
	},
	blur() {
		this.s.removeAllRanges()
	},
}
let SM = SelectionManager

$(function () {
	let code_similar = `(function(g){if(typeof g.ao==='undefined'){g.ao={};}var r=g.ao.similar=function similar(t,s,u){if(null===t||null===s||void 0===t||void 0===s)return 0;var n,o,e,l,f=0,i=0,b=0,c=(t+="").length,h=(s+="").length;for(n=0;n<c;n++)for(o=0;o<h;o++){for(e=0;n+e<c&&o+e<h&&t.charAt(n+e)===s.charAt(o+e);e++);e>b&&(b=e,f=n,i=o)}return(l=b)&&(f&&i&&(l+=r(t.substr(0,f),s.substr(0,i))),f+b<c&&i+b<h&&(l+=r(t.substr(f+b,c-f-b),s.substr(i+b,h-i-b)))),u?200*l/(c+h):l};})(this);`
	let code_Reference = `class Reference{
	constructor(arr){if(!(arr instanceof Array)) arr=[]; this.from(arr); }
	from(arr) {this.array=Reference.unique(arr); }
 	add(source,target){this.array.push([source,target]); this.from(this.array); }
	static enlistKey(arr){return arr.filter(function(e){return e[0] && e.toString().trim().length>0; }); }
	unique(arr){
		return arr;
	}
	static unique(arr){
		return arr;
	}
	// [ ['source','target','other', ...], ... ]
	concat(arr) {
		this.from(this.array.concat(arr));
	}

	search(s,p=0,i=0){
		var r=this.result=[];
		if(typeof s==='undefined' || typeof s!=='string') return r;
		this.array.forEach(function(e,index){
			var _s=e[i], sv=similar(s, e[i], true);
			if(sv >= p) {
				r.push(([]).concat(e,sv,index));
			}
		});

		r.sort(function(a,b){
			// 0:source, 1:target, 2:similar, 3:index
			var a_similar=parseFloat(a[2]);
			var b_similar=parseFloat(b[2]);
			if(a_similar===b_similar) {
				var a_index=parseFloat(a[3]);
				var b_index=parseFloat(b[3]);
				return a_index>b_index? -1: (a_index===b_index? 0 : 1)
			}else{
				return a_similar>b_similar?-1:(a_similar===b_similar?0:1);
			}
		});
		// console.log(s,r,this.array);
		// r.reverse();
		return r;
	}
	searchAll(s,p=0){
		var r=this.result=[];
		if(typeof s==='undefined' || typeof s!=='string') {
			return r;
		}
		this.array.forEach(function(e){
			var sv;
			var b = e.some(function(ee){
				sv = similar(s, ee, true);
				return sv >= p;
			});
			if(b) {
				r.push([sv].concat(e));
			}
		});
		return r;
	}
};

function similar(a,b,c=true) {
	return Number(ao.similar(a,b,c).toFixed(2));
};`
	let code_Search_min = `class Search {
	static _getRegExp(v) {
		v=v.replace(Search.REGEXP_SPACES,'')
		if(v==='') return '';
		var s=Search.SPACES;
		return s+v.split('').map(function(e){return e.replace(Search.REGEXP_TOKENS,'\\\\$&');}).join(s)+s;
	}
	static getRegExp(v,options,noFormat) {
		if(!v) return ;
		if(noFormat) {
			try{
				v=new RegExp(v,'g');
				return v;
			}catch(err){
				console.warn('Invalid argument - new RegExp('+v+',"g")');
			}
		}
		v=v.split('\\\\');
		v=new RegExp(v.map(Search._getRegExp).join('\\\\\\\\'),options);
		v= v.source==='(?:)' ? Search.VIRTUAL_REGEXP : v;
		return v;
	}
}
Object.defineProperties(Search, {
	REGEXP_TOKENS : {value:/[\\/\\?\\*\\+\\-\\^\\$\\(\\)\\<\\>\\[\\]\\{\\}\\.\\,\\:\\&\\|]/g},
	REGEXP_SPACES : {value:/\\s+/g},
	SPACES        : {value:'\\\\s*'},
	VIRTUAL_REGEXP: {value:{test:function(){return false;},match:function(){return null;}}}
});
`

	// 点击 #works .source 时，搜索词库
	// statusDict tip
	lwsd2 = new LocaleWorker(
		'searchDictionary2',
		function (e) {
			let data = e.data,
				status = data[0],
				res
			if (status === 200) {
				lwsd2.done = true
				// 显示到#statusDict中
				res = data[1]

				//cached
				let uiRow = document.querySelector('#works .currentEditRow')
				if (uiRow) {
					cachedStatusDict.set(
						uiRow,
						res.map(([s, t]) => [s, t])
					)
				}

				let statusDict = document.querySelector('#statusDict')
				statusDict.textContent = '' //当target获取焦点时显示cache，当完成重新查询时，再次刷新。
				function createTd(p, c, t) {
					let td
					td = document.createElement('td')
					td.classList.add(c)
					td.textContent = t
					p.appendChild(td)
					return td
				}

				console.log(res)

				res.forEach((kv, i) => {
					let [sourceText, targetText, index] = kv
					let tr = document.createElement('tr')
					createTd(tr, 'no', i + 1)
					createTd(tr, 'source', sourceText)
					createTd(tr, 'target', targetText)
					createTd(tr, 'similar', '-')
					createTd(tr, 'index', index)
					statusDict.appendChild(tr)
				})
			}
		},
		code_Search_min +
		`console.warn('lwsd2');
function stringNormalize(s){
		// return typeof s!=='undefined' ? String(s).replace(/[\\x00-\\xff]/g,'') : s;
		return s;
}

addEventListener('message',(e)=>{
	let a=e.data, status=a[0], source, res, array;
	if(status===100){
		// send(100,source,dict.array);
		// a[1] text
		// a[2] dict
		source=a[1];
		array=a[2];

		// source=stringNormalize(source);
		res=[];

		array.forEach(function(kv,index){
				// let k=kv[0], v=kv[1], _k=stringNormalize(k);
				let k=kv[0], v=kv[1], _k=k;
			let re= Search.getRegExp(_k.length>0 ? _k : k);
				if(re) {
				if(re.test(source)) {
					res.push([k,v,index]);
				}
				}else{
				console.warn({k, v, _k, re})
			}
		});

		res.sort((a,b)=>String(a[0]).length<String(b[0]).length)
		res.reverse();
		send(200,res);
	}
});
`
	)
	lwsd2.done = true

	// tips
	//当编辑区target获取焦点时运行
	lwsd = new LocaleWorker(
		'searchDictionary',
		(e) => {
			/* e.data
			[ statusCode, resultArray ]
			*/
			let data = e.data
			if (data[0] === 200) {
				// statusCode1
				lwsd.done = true
				let res = data[1] // resultArray

				res.sort((a, b) => {
					if (Array.isArray(a) && Array.isArray(b)) {
						a = a[2]
						b = b[2]
						//sort by similar
						if (a < b) {
							return 1
						} else if (b < a) {
							return -1
						} else {
							//sort by index
							a = a[3]
							b = b[3]
							if (a < b) {
								return 1
							} else if (b < a) {
								return -1
							}
						}
					}
					return 0
				})
				//console.table(res)

				let table = ao.arrayToTable(res)
				// 显示到#tips中
				$('td:nth-child(4)', table).addClass('index')
				$('td:nth-child(3)', table)
					.addClass('similar')
					.each((i, e) => (e.textContent = parseInt(e.textContent) + '%'))
				$('td:nth-child(2)', table)
					.attr({ contenteditable: 'plaintext-only' })
					.addClass('target')
				$('td:nth-child(1)', table)
					.attr({ contenteditable: 'plaintext-only' })
					.addClass('source')
				$('tr', table).each(function (i, tr) {
					$(tr).prepend($('<td class="no"></td>').text(i + 1))
				})
				$('#tips').html(table.innerHTML).prop('scrollTop', 0)
				// console.log($('#useAutoReplaceTarget').prop('checked') && a && a[0] &&a[0][2]==100)
				// 规则A：对于如果最后一个编辑的内容，不要采取自动插入。
				if (
					$(document.querySelector('#useAutoReplaceTarget')).prop('checked') &&
					res &&
					res[0] &&
					res[0][2] >=
					parseInt(
						document.querySelector('#similarPercentAutoReplaceTarget').value
					) &&
					lwsd.target.textContent !== res[0][1]
				) {
					let __e__ = lwsd.target
					if (__e__) {
						$(__e__).text(res[0][1]) // 自动替换译文
						// .css({background:$('#ctrlEnterColor').val()})
						if (res[0][2] !== 100) {
							let t = res[0]
							if (t) {
								let t1 = t[0]
								let t2 = $('.currentEditRow .source').text().trim()
								let dmp = new diff_match_patch()
								let diff = dmp.diff_main(t1, t2)
								dmp.diff_cleanupSemantic(diff)
								let dmpHTML = dmp.diff_prettyHtml(diff)
								dmpHTML = dmpHTML.replace(
									/style="background:#(?:e6ffe6|ffe6e6);"/g,
									''
								)
								pushloghtml(dmpHTML)
								let { x, y, height } = $('.currentEditRow .target')
									.get(0)
									.getBoundingClientRect()
								showTip({
									html: dmpHTML,
									x,
									y,
									delay: 5000,
									css: { transform: 'translate(0,-100%)' },
								})
							}
							__e__.classList.remove(
								'done',
								'doneAtuo',
								'doneSmart',
								'doneAutoNumber',
								'doneSpace'
							)
						} else {
							__e__.classList.add('doneAuto')
						}
					}

					//let tar = document.querySelector('.currentEditRow .target')
					//if(tar) {
					//	document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey:true, key:'1',keyCode:49,code:'Digit1',repeat:false }))
					//}
				}
			}
		},
		code_similar +
		code_Reference +
		`addEventListener('message',(e)=>{
	let a=e.data;
	if(a[0]===100){
		// send(100,t,similarPercent,dict.array);
		// a[1] text
		// a[2] similarPercent
		// a[3] dict

		let arr=new Reference(a[3]).search(a[1],a[2]);
		// let table=a[4](arr);
		arr = arr.map(e=>{
			if(e.length>4) {
				console.warn('Referenct的search结果应为4元素数组：', e);
				e = e.filter(e=>String(e).length>0);
			}
			return e;
		});
		send(200,arr);
	}
});
`
	)
	lwsd.done = true

	// $(window).on('unload',function(e){
	// 	e.preventDefault();
	// 	var msg='[Warning] Close the page?';
	// 	return msg;
	// });

	// 词典查找大法。长度截断渐进法。
	// function lenSearch(str, dictArray) {
	// 	let startTime = Date.now();
	// 	let timeout = false;
	// 	let rs = [];
	// 	if (!dictArray) return rs;
	// 	let i = 0, len = str.length, start = i, end = len, chunk, index = 0, re, b = false;

	// 	while (true) {
	// 		if ((Date.now() - startTime) > 2000) {
	// 			timeout = true;
	// 			break;
	// 		}
	// 		if (end === start) break;
	// 		chunk = str.slice(start, end);

	// 		// 寻找这个内容
	// 		b = dictArray.some((e, i, a) => {
	// 			if ((Date.now() - startTime) > 2000) {
	// 				timeout = true;
	// 				return true;
	// 			}
	// 			re = new RegExp('^' + Search._getRegExp(chunk) + '$', 'gi');
	// 			if (re.test(e[0])) {
	// 				index = i;
	// 				start = end;
	// 				end = len;
	// 				return true;
	// 			}
	// 			return false;
	// 		})

	// 		if (timeout) {
	// 			return [];
	// 		} else if (b) {
	// 			// 找到
	// 			rs.push(dictArray[index]);
	// 			// console.log('[has]',dict[index]);
	// 			continue;
	// 		}
	// 		end--;
	// 	}
	// 	if (timeout) {
	// 		return [];
	// 	}
	// 	return rs;
	// }

	var lastEditTarget

	var targetLang
	// var asciiNospace=/[\x00-\x08\x0e-\x1f\x21-\x2b\x2d\x2f\x3a-\x9f\xa1-\xff]+|(\d[\x2c\x2e]?)+/g; //  ASCII范围内的 [^ \f\n\r\t\v,\.\d]  ,\x2c .\x2e
	var asciiNospace = /(\d[\x2c\x2e]?)+|[\x00-\x08\x0e-\x1f\x21-\x2b\x2d\x2f-\x9f\xa1-\xff]+/g //  ASCII范围内的 [^ \f\n\r\t\v,\.\d]  ,\x2c .\x2e

	{
		//begin
		let f = $('#TMToolFile')
		let input = f.get(0) // <input>
		f.on('change', (e) => {
			inputFiles(e)
		})
		$('#importTMToolFile').on('click', () => {
			f.click()
		})
		// end
	}

	{
		$(window).on('dragover', function (e) {
			e.preventDefault()
		})
		$(window).on('drop', function (e) {
			// drop file
			e.preventDefault()
			let files,
				length,
				E,
				onloadCount = 0
			files = e.originalEvent.dataTransfer.files // 被拖进的文件
			length = files.length // 文件数量
			E = new Event('loaddropfiles') // 创建事件实例
			E.files = files // 加入文件
			E.datas = [] // 加入数据
			for (var i = 0; i < length; i++) {
				// 遍历文件
				let file = files.item(i) // 文件
				let filename = file.name
				pushlog(`[파일] ${filename}`)
				if (!/\.txt$/.test(filename)) {
					// 是否扩展名为.txt
					pushlog(
						'식별할 수 없는 파일유형입니다.' + file.name + '(' + file.size + ')'
					) // 不支持非.txt文件
					continue
				}

				var fr = new FileReader() // 读文件数据
				fr.file = file
				fr.name = filename
				fr.onload = function (e) {
					onloadCount++
					let t = e.target
					// E.datas['tmtoolfile_'+t.file.name] = t.result;
					// E.datas['tmtoolfile_'+t.file.name] = t.result;
					// E.datas['type'] = 'tmtool';
					// E.datas['filename'] = t.file.name;
					// console.log(t)
					E.datas.push({
						type: 'tmtool',
						name: t.name,
						data: t.result,
						file: t.file,
					})
					if (onloadCount === length) window.dispatchEvent(E) // 读完后触发事件
				}
				fr.readAsText(file)
			}
		})

		// $('#dictDrop').on('drop');

		$('#dictPaste').on('paste', dictPasteHandle)

		$('#worksFontSize').on('keydown change input', changeWorksFontSize)

		// 查找内容
		let prevFocusTarget
		$(document).on('focus', '#works .target', async function (e) {
			// log(e.type)
			// 焦点太卡了。记录上一次的焦点吧。
			if (prevFocusTarget === e.target && $('#works td.target').length > 1) {
				//debug('忽略target对焦', prevFocusTarget)
				return false
			}
			prevFocusTarget = e.target
			SM.lastTargetRange = undefined

			// 词典提示
			if ($('#useDictTip').prop('checked')) {
				// t: target text
				// a: dict search result

				let t = $(e.target).prev('.source').text().trim()
				let similarPercent = Number($('#similarPercent').val())

				{
					// 转移给worker执行
					// var a=dict.search(t,similarPercent);
					// debug(`搜索tips...`)
					$('#tips').empty()

					if (!lwsd.done) {
						debug(`重启tips worker`)
						lwsd.connect()
					}
					lwsd.target = e.target
					lwsd.send(100, t, similarPercent, dict.array)
					lwsd.done = false
				}

				{
					// 焦点,上方自动显示
					//let statusDict = document.querySelector('#statusDict');
					//if (!lwsd2.done) {
					//	lwsd2.connect();
					//}
					//let row = $(e.target).parent('tr').get(0);
					//lwsd2.target = row.querySelector('td.source');
					//let text = lwsd2.target.textContent;
					//statusDict.textContent = '';
					//let res = cachedStatusDict.get(row);
					//if(res) {
					//	function createTd(p, c,t) {
					//		let td;
					//		td = document.createElement('td');
					//		td.classList.add(c);
					//		td.textContent = t;
					//		p.appendChild(td);
					//		return td;
					//	};
					//	res.forEach(([sourceText, targetText],i) => {
					//		let tr = document.createElement('tr');
					//		createTd(tr, 'no', i+1);
					//		createTd(tr, 'source', sourceText);
					//		createTd(tr, 'target', targetText);
					//		createTd(tr, 'similar', '-');
					//		createTd(tr, 'index', 'cached');
					//		statusDict.appendChild(tr);
					//	});
					//}
					//// 搜索规则
					//// 将内容中的标签去掉后搜索(1来自tmtool文件，2和3来自memoQ文件)
					//// 1)	[99FFFF]...[-]   [99FFFF99]...[-]
					//// 2)	{1>...<1}
					//// 3)	<1>
					//text = text.replace(/\[([a-z0-9]{6}|[a-z0-9]{8})\]([\s\S]+?)(\[-\])/gim, '$2');
					//text = text.replace(/\{(\d+)>([\s\S]+?)<\1\}/gim, '$2');
					//text = text.replace(/<\d+>/gim, '');
					//// console.log(text);
					//lwsd2.send(100, text, dict.array);
					//lwsd2.done = false;
				}

				{
					//焦点上方显示（2020-05-25）优化
					if (workerBlue instanceof Worker) workerBlue.terminate()
					workerBlue = new Worker('./worker-blue.js', { type: 'module' })
					workerBlue.addEventListener('message', ({ data }) => {
						let statusDict = document.querySelector('#statusDict')

						statusDict.textContent = ''

						data.sort((a, b) => {
							//sort by index
							if (Array.isArray(a) && Array.isArray(b)) {
								a = a[3]
								b = b[3]
								if (a < b) {
									return 1
								} else if (b < a) {
									return -1
								}
							}
							return 0
						})

						data.forEach((row, i) => {
							let [st, tt, x, index] = row
							let _
							let tr = document.createElement('tr')

							_ = document.createElement('td')
							_.textContent = i + 1
							_.classList.add('no')
							tr.appendChild(_)

							_ = document.createElement('td')
							_.textContent = st
							_.classList.add('source')
							tr.appendChild(_)

							_ = document.createElement('td')
							_.classList.add('target')
							_.textContent = tt
							tr.appendChild(_)

							_ = document.createElement('td')
							_.classList.add('similar')
							_.textContent = '?'
							tr.appendChild(_)

							_ = document.createElement('td')
							_.classList.add('index')
							_.textContent = index
							tr.appendChild(_)

							statusDict.appendChild(tr)
						})
					})

					let __t__ = e.target
					if (__t__.matches('#works .target')) {
						let __s__ = __t__.parentElement.querySelector('.source')
						let source = __s__.textContent
						let dictArray = dict.array
						workerBlue.postMessage({ source, dictArray })
					}
				}
			}

			// 显示谷歌等
			let isUseNet = document.querySelector('#useNet').checked
			let isUseNet2 = document.querySelector('#useNet2').checked
			if (isUseNet || isUseNet2) {
				let s = $(e.target).parent('tr').find('.source').text().trim()
				let t = document.querySelector('#netTarget').value
				if (s) {
					gSearch(s, t)
				}
			}

			// 当前行高亮显示
			$('#works tr').removeClass('currentEditRow')
			$(e.target).parent().addClass('currentEditRow')

			// 让当前编辑框置顶、居中、置底。
			let block = $('#focusScrollBlock').val()
			e.target.scrollIntoView({ block })
		})

		// 창희님 제안으로(메모큐처럼 기록 번역문을 두번 클릭 시, 편집위치로 추가하기)
		$(document).on(
			'dblclick',
			'#statusDict .target, #tips .target',
			function (e) {
				e.preventDefault()
				if (SM.lastTargetRange) {
					let b = document.querySelector('#useDictTip').checked
					if (b) document.querySelector('#useDictTip').checked = false
					SM.range = SM.lastTargetRange
					SM.insert($(e.target).text())
					if (b) document.querySelector('#useDictTip').checked = true
				}
			}
		)

		$(document).on('blur', '#works .target', (e) => {
			SM.lastTargetRange = SM.range
		})

		// 全局按键侦听
		$(window).on('keydown', function (e) {
			if (e.keyCode === 19 && !e.repeat) {
				// Pause Break
				if (e.altKey) {
					let t = $(e.target)
					if (t.is('#works .target')) {
						e.preventDefault()
						let s = t.prev('.source')
						let rs = cnEncode(s.text(), getTips())
						log('Alt+Pause', rs)
						if (rs.t) return t.text(rs.t)

						let _red = red()
						collector(_red)
						rs = cnEncode(s.text(), collector.r)
						log(rs)
						if (rs.t) return t.text(rs.t)

						rs = undefined
						let dmp = new diff_match_patch()
						_red
							.filter((e) => e.similar > 80)
							.map((e) => {
								let diff = dmp.diff_main(e.source, s.text())
								dmp.diff_cleanupSemantic(diff)
								diff = diff.filter((diff) => diff[0] !== 0)
								if (diff.length === 2) {
									let search, replace
									diff.forEach((e) => {
										if (e[0] === -1) search = e[1]
										if (e[0] === 1) replace = e[1]
									})
									console.log(e.target, e.search, replace)
									collector.r.forEach((e2) => {
										if (e2[0] === search) {
											let v = e.target.replace(search, replace)
											if (!rs) rs = v
											else if (rs === v) return rs
										}
									})
									if (rs) {
										pushlog('^ ^')
										return t.text(rs)
									}
								}
							})
					}
				} else {
					match100(
						$('#works tr:has(.selected)').add('#works tr.currentEditRow')
					)
				}
				return
			} else if (e.keyCode === 113) {
				// F2               移动到未翻译内容td上
				// 当焦点不是文档时，返回焦点。

				e.preventDefault()
				let arr = $('#works tr td.target')
					.not(
						'.hide, .hide2, .hide3, .emptyRow, .splitTarget, .done, .doneAutoNumber, .doneAuto, .doneSmart, .doneAutoSpace'
					)
					.toArray()
				let index, td

				if (arr.length === 0) return pushlog('비어 있는 칸이 없습니다.')

				if (e.ctrlKey) {
					td = arr[0]
				} else if (e.shiftKey) {
					index =
						arr.findIndex(function (td) {
							return td.parentElement.classList.contains('currentEditRow')
						}) - 1
					td = arr[index]
				} else {
					index =
						arr.findIndex(function (td) {
							return td.parentElement.classList.contains('currentEditRow')
						}) + 1
					td = arr[index]
				}
				if (td) td.focus()
			} else if (e.keyCode === 114) {
				// F3        移动到未翻译内容td上
				e.preventDefault()
				if (e.altKey) {
					$('#downloadWork').trigger({ type: 'click' })
				} else {
					$('#downloadWorkT').trigger({ type: 'click', ctrlKey: e.ctrlKey })
				}
			} else if (e.keyCode === 112) {
				// F1        自动匹配100%内容
				e.preventDefault()
				var event = {
					type: 'click',
					ctrlKey: e.ctrlKey,
					altKey: e.altKey,
					shiftKey: e.shiftKey,
					metaKey: e.metaKey,
				}
				$('#MatchWork100').trigger(event)
				pushlog('[시스템] 자동 채우기를 시작했습니다.')
			} else if (
				e.keyCode === 192 &&
				e.altKey &&
				!e.ctrlKey &&
				!e.shiftKey &&
				!e.metaKey
			) {
				// Alt+`
				// 翻译技巧：将source按\s进行分割后逐个匹配记忆，最终拼凑成结果。
				// 缺点：没有空格分割的语言中，无法使用。例：汉语、日语为source时。
				// let t = $(e.target);
				// if (t.is('#works td.source')) {// 在可编辑的source格时，按下快键
				// 	e.preventDefault();
				// 	let v = '';
				// 	let source = t;
				// 	let sourceText = source.text();
				// 	let target = t.next('td.target');// 定位右边的target格
				// 	let arr = sourceText.split(/\s+/g)
				// 	arr.forEach(function (text) {
				// 		v = dict.search(text, 100)[0];
				// 		v = (v === undefined ? text : v[1]);
				// 		target.text(target.text() + v);
				// 		pushlog(text + '|' + v)
				// 	});
				// } else if (t.is('#works td.target')) {// 在target格时，按下按键
				// 	let target = t;
				// 	let source = target.prev('td.source');// 定位左边的source格
				// 	let sourceText = source.text();
				// 	let arr = sourceText.split(/\s+/g);
				// 	arr.forEach(function (text) {
				// 		v = dict.search(text, 100)[0];
				// 		log(v)
				// 		v = (v === undefined ? text : v[1]);
				// 		target.text(target.text() + v);
				// 		pushlog(text + '|' + v)
				// 	});
				// }

				// 20190910改版！改为蓝色提示的拼凑。
				// 根据蓝色提示的出现顺序进行拼凑。优先选择长度长的进行拼凑。
				let statusDict = document.querySelector('#statusDict')
				let trs = statusDict.querySelectorAll('tr')
				let arr = Array.from(trs, function (tr) {
					let r = {
						s: tr.querySelector('.source').textContent,
						t: tr.querySelector('.target').textContent,
						i: parseInt(tr.querySelector('.index').textContent),
					}
					// r.sr = new RegExp(r.s.split('').map(e=>'\\s*\\'+e).join(''),'i')
					return r
				})
				let sourceText = source.textContent
				let resultText = ''

				let results = []
				let cursor = 0
				// 句子，从左到右进行正则匹配。
				// 正则列表初始来源于#statusDict的.source
				// 但随着句子指针的向右偏移，列表内容找不到匹配的项可以下一轮不用尝试了。
				// 每次尝试匹配后，需要去掉没有匹配的.source正则，而句子指针需要相应地向右移动。
				// 如果指针移动到最后位置，或者已经没有可以进行正则的项目时，该匹配任务结束。
				// 根据匹配内容，拼凑出最终结果。

				let result,
					startIndex,
					count = sourceText.length
				while (count-- > 0) {
					result = undefined
					sourceText = sourceText.slice(cursor)
					startIndex = sourceText.length
					if (startIndex > 0) {
						arr = arr.filter((e) => !e.done)
						if (arr.length === 0) break
						arr.forEach((e) => {
							let { s, t, i } = e
							let re = new RegExp(
								s
									.split('')
									.map((e) => {
										// 重点！！数值不用加\\
										if (/[A-Z0-9a-z]/.test(e)) {
											return e
										} else {
											return '\\s*\\' + e
										}
									})
									.join(''),
								'i'
							)
							let m = re.exec(sourceText)
							if (m) {
								let text = m[0]
								let start = m.index
								let end = start + text.length
								if (start < startIndex) {
									result = { s, t, i, text, start, end } // targetText
									startIndex = start
									cursor = end
								} else if (start === startIndex) {
									if (end > result.end) {
										result = { s, t, i, text, start, end } // targetText
										startIndex = start
										cursor = end
									} else if (end === result.end && result.i < i) {
										result = { s, t, i, text, start, end } // targetText
										startIndex = start
										cursor = end
									}
								}
							} else {
								e.done = true
							}
						})
					} else {
						break
					}

					if (result) results.push(result)
				}

				if (results.length) {
					let tar = target
					if (tar) {
						let v = results.map((e) => e.t)
						let splitter = ''
						if (v.some((e) => /[가-힣]/.test(e))) {
							splitter = ' '
						}
						v = results.map((e) => e.t).join(splitter)
						tar.textContent = v
						results.forEach((e) => {
							pushlog(e.s + ' = ' + e.t)
						})
					}
				}
				// log(JSON.stringify(results))
			} else if (e.keyCode === 117) {
				// F6       将分割句子拼凑起来
				e.preventDefault()
				mergeSplits()
			} else if (e.keyCode === 119) {
				// F8       切割长文章
				e.preventDefault()
				let tar = $(e.target)
				if (tar.is('#works .currentEditRow .target')) {
					let $parent = tar.parent()
					if ($parent.is('.split')) {
						console.log('yes')
						tar.addClass('edit')

						let parent = $parent.get(0)
						let originalname = parent
							.querySelector('.name')
							.getAttribute('originalname')
						let tr = document.createElement('tr')
						tr.classList.add('split')
						tr.setAttribute('originalname', originalname)
						let el, x

						el = document.createElement('td')
						el.classList.add('no')
						tr.appendChild(el)

						el = document.createElement('td')
						el.classList.add('source', 'edit')
						tr.appendChild(el)

						x = el = document.createElement('td')
						el.classList.add('target', 'edit')
						tr.appendChild(el)

						el = document.createElement('td')
						el.classList.add('name')
						el.setAttribute('originalname', originalname)
						tr.appendChild(el)

						$parent.get(0).insertAdjacentElement('afterend', tr)
						x.focus()
					} else {
						console.log('no')
						if (e.ctrlKey) {
							// Ctrl+F8        同F6
							// 合并
							mergeSplits()
						} else if (e.altKey) {
							// Alt+F8       非完成语句全部分割
							$('#works .target')
								.not(
									'.done,.doneAuto,.doneAutoSpace,.doneAutoNumber,.doneSmart'
								)
								.each((i, e) => {
									splitLong(e)
								})
						} else {
							// 分解长文
							splitLong(tar)
						}
					}
				}
			} else if (
				e.keyCode === 81 &&
				e.ctrlKey &&
				!e.shiftKey &&
				!e.altKey &&
				!e.metaKey
			) {
				// Ctrl+Q      保存到词库
				e.preventDefault()
				let lsst = $('#lsst')
				let stst = $('#ltst')
				let lsstText = lsst.text().trim()
				let ststText = stst.text().trim()

				if (lsstText && ststText) {
					// 保存
					// var l = dict.array.length;
					dict.add(lsstText, ststText)

					// 2019-12-16 在添加词库的同时，刷新一下蓝色区域。
					{
						let index = dict.array.length - 1
						let row = dict.array[index]
						if (row && row[0] === lsstText && row[1] === ststText) {
							let parent = document.querySelector('#statusDict')
							let tr = document.createElement('tr')
							let td
							td = tr.appendChild(document.createElement('td'))
							td.textContent = '-'
							td.className = 'no'
							td = tr.appendChild(document.createElement('td'))
							td.textContent = lsstText
							td.className = 'source'
							td = tr.appendChild(document.createElement('td'))
							td.textContent = ststText
							td.className = 'target'
							td = tr.appendChild(document.createElement('td'))
							td.textContent = 'Dict'
							td.className = 'similar'
							td = tr.appendChild(document.createElement('td'))
							td.textContent = index
							td.className = 'index'
							parent.insertBefore(tr, parent.firstElementChild)
						}
					}

					let rect, rect2

					rect = lsst.get(0).getBoundingClientRect()
					rect2 = $('#dictArrayLengthUI').get(0).getBoundingClientRect()
					showTip({
						text: lsstText,
						css: { background: '#c85050', color: '#ff0', width: rect.width },
						x: rect.left,
						y: rect.top,
						animate: [
							{ left: rect2.x, top: rect2.top - rect.height, delay: 1000 },
							{ left: rect2.left, top: rect2.top, opacity: 0 },
						],
					})

					rect = stst.get(0).getBoundingClientRect()
					showTip({
						text: ststText,
						css: { background: '#c85050', color: '#ff0', width: rect.width },
						x: rect.left,
						y: rect.top,
						x: rect.left,
						y: rect.top,
						animate: [
							{ left: rect2.x, top: rect2.bottom, delay: 1000 },
							{ left: rect2.left, top: rect2.top, opacity: 0 },
						],
					})

					lsst.empty()
					stst.empty()
				} else {
					pushlog('[경고] 내용이 부족합니다.')
				}
			} else if (
				e.keyCode === 68 &&
				e.ctrlKey &&
				e.shiftKey &&
				!e.altKey &&
				!e.metaKey
			) {
				// Ctrl+Shift+D       复制上面.target的内容
				e.preventDefault()
				let c = $(document.activeElement)
				if (c.is('#works .target')) {
					s = c.parent().prevAll(':not(.hide,.hide1.hide2)').first()
					if (s.length) {
						let v = s.find('.target').text()
						if (v) SM.set(v)
					}
				}
			} else if (
				e.keyCode === 83 &&
				e.ctrlKey &&
				!e.shiftKey &&
				!e.altKey &&
				!e.metaKey
			) {
				// Ctrl+S       保存内容
				e.preventDefault()
				saveDatas()
			}
		})

		$(document).on('keydown', function (e) {
			// 忽略Ctrl键自身反复触发，有什么用？下面又没有Ctrl自身的命令
			// if (e.ctrlKey && (e.keyCode === 17) && e.repeat) return ;
			// 在译文格子中按下回车键时的处理。
			if (e.keyCode === 13) {
				// Enter

				// ALT+ENTER时删除100%的其他记录
				if (e.altKey) {
					let st = source.textContent
					for (let arr = dict.array, i = 0, len = arr.length; i < len; i++) {
						if (arr[i][0] === st) {
							arr.splice(i, 1)
							i--, len--
						}
					}
				}

				let b = undefined
				if ((b = saveSelectedHandle())) {
					e.preventDefault()
					saveDatas()
					return
				}
				// console.log('선택형 저장', b);

				if (!$(e.target).is('.target')) return

				e.preventDefault()
				// Enter 提交数据，并跳转下一行。
				let current
				let tar = $(e.target)
				let p = tar.parent()

				// 当译文格子中没有有效文字内容时，不做任何处理。
				if (tar.text().trim().length === 0) {
					return pushlog('번역내용을 입력해 주세요!')
				}

				// 译文格子分为工作区和记忆区两大类。
				// 先从记忆区看起。记忆区有蓝色记忆和红色记忆。蓝色statusDict，红色tips
				if ($(tar).is('#statusDict td.target, #tips td.target')) {
					// 由于旧版本的记忆没有唯一识别ID，修改删除操作不会实时反应到用户界面中。
					// 编辑红蓝记忆区时,将相反的区域清除,以免记忆残留处理不当
					if ($(tar).is('#tips td.target')) {
						$('#statusDict').empty()
					} else if ($(tar).is('#statusDict td.target')) {
						$('#tips').empty()
					}

					// var no=$('.no',p);
					// no.animate({backgroundColor:$('#ctrlEnterColor').val()});
					tar.addClass('done')
					let s = $('.source', p)
					let t = $('.target', p)
					s = s.text().trim()
					t = t.text().trim()
					// s或t的值为空，则跳到下一个。
					if (s.length === 0 || t.length === 0) {
						// return p.next().find('.target').focus();
						// console.log('next')
						current = p
							.nextAll()
							.not('.hide,.hide1,.hide2,.emptyRow')
							.find('td.target')
						if (e.ctrlKey) {
							current = current.not(
								'.done,.doneAuto,.doneAutoSpace,.doneAutoNumber'
							)
						}
						current = current.eq(0)
						if (current.length > 0) {
							current.focus()
						} else {
							current = current.parent()
							if (current.is('#works table')) {
								current = current.next()
								if (current.is('#works table')) {
									console.log('穿越了下一个table')
									current.find('.target').not('.hide,.hide1,.hide2,.emptyRow')
									if (e.ctrlKey) {
										current = current.not(
											'.done,.doneAuto,.doneAutoSpace,.doneAutoNumber'
										)
									}
									current = current.eq(0)
									current.focus()
								} else {
									console.log('没有找到下一个格子')
								}
							}
						}
						return
					}
					let i = $('td:last()', p).text().trim()
					if (dict.array[i]) {
						var l = dict.array.length
						dict.array[i][0] = s
						dict.array[i][1] = t
						dict.from(dict.array)
						pushlog(`[source]${s} <==> [target]${t}`)
					}

					// ctrl+enter 换色
					// var t=$(e.target);
					// if($('#ctrlEnter').prop('checked')){
					// 	t.animate({background:$('#ctrlEnterColor').val()});
					// }
				} else {
					// log('#works td.target')
					// var no=$('.no',p);
					// no.animate({backgroundColor:$('#ctrlEnterColor').val()},function(){no.removeAttr('style');});
					var s = $('.source', p)
					var t = $('.target', p)
					t = t
						.text()
						.trim()
						.replace(/\{\\r\\n\}/g, '\\n')
					s = s
						.text()
						.trim()
						.replace(/\{\\r\\n\}/g, '\\n')
					var l = dict.array.length
					dict.array.push([s, t])
					dict.from(dict.array)
					// pushloghtml($('<p>').append($('<h6>').text('[+]')).append($('<span>').text(s)).append($('<br>')).append($('<p>').text(t)));
					// ctrl+enter 换色
					// var t=$(e.target);
					// if($('#ctrlEnter').prop('checked')){
					// 	t.css({background:$('#ctrlEnterColor').val()})
					// }
					// 改变状态为已完成
					tar
						.removeClass('done doneAuto doneAutoSpace doneAutoNumber doneSmart')
						.addClass('done')

					{
						// 检查数值是否正确
						let b = numCheck(s, t)
						if (!b.done) {
							if (b.sa.length !== 0 || b.ta.length !== 0) {
								// console.log(b);
								p.addClass('error')
								let tip = p.find('.tip')
								if (tip.length === 0)
									tip = $(
										'<td class="tip"><span class="sd"></span><span class="td"></span></td>'
									)
										.appendTo(p)
										.css({
											color: '#ff0',
											display: 'grid',
											'grid-template-columns': '1fr 1fr',
										})
								setTimeout(() => {
									tip.remove()
									p.removeClass('error')
								}, 5000)
								let sd = tip.find('.sd').empty().css({ minWidth: '10px' })
								let td = tip.find('.td').empty().css({ minWidth: '10px' })
								b.sa.forEach((e) =>
									$('<span>')
										.css({ background: '#f00', margin: '1px' })
										.text(e)
										.appendTo(sd)
								)
								b.ta.forEach((e) =>
									$('<span>')
										.css({ background: '#00f', margin: '1px' })
										.text(e)
										.appendTo(td)
								)
							}
						}
					}
				}

				// 按下Enter键时，跳转到下一个格子。如果同时按下Ctrl键，则略过各种完成状态的格子。
				// current = p.nextAll().not('.hide,.hide1,.hide2,.emptyRow').find('td.target');
				current = p
					.nextAll()
					.not('.hide,.hide1,.hide2,.emptyRow')
					.filter((i, e) => e.style.display !== 'none')
					.find('td.target')
					.not('.splitTarget')
				if (e.ctrlKey) {
					current = current.not(
						'.done,.doneAuto,.doneAutoSpace,.doneAutoNumber'
					) // 略过各种完成状态
				}
				current.eq(0).focus()

				requestAnimationFrame(() => {
					clearTimeout(window.privateTimeout)
					window.privateTimeout = setTimeout(() => {
						saveDatas()
					}, 2000)
				})
			} else if (e.ctrlKey) {
				// Ctrl + Ins 键，将原文复制到译文格子中。
				if (e.keyCode === 45) {
					// <insert>
					var t = $(e.target)
					if (t.is('#works .target')) {
						SM.text = t.parent().find('.source').text()
					}
				}
			} else if (e.keyCode === 27) {
				//esc
				$('.tipSelect').remove()
				$('#tips, #statusDict, #lsst, #ltst').empty()
			}
			// console.warn('****任何按键*****')
		})

		// 锁定未翻译目标
		$('#gotoUntranslationTarget').click(function (e) {
			nextEmptyTarget(e.ctrlKey)
		})

		// 红色记忆下载为文本
		$('#downloadDict').click(function () {
			try {
				dict.array.forEach(function (e) {
					e.forEach(function (v, i, a) {
						a[i] = String(v)
							.trim()
							.replace(/\r|\n|\{\\r\\n\}/g, '\\n')
					})
				})
			} catch (_) {
				dict = new Reference(ao.ls.get('dict') || [])
				dict.array.forEach(function (e) {
					e.forEach(function (v, i, a) {
						a[i] = String(v)
							.trim()
							.replace(/\r|\n|\{\\r\\n\}/g, '\\n')
					})
				})
			}
			dict.from(dict.array)

			let filename = getDictFilename()

			downloadFile(filename, ao.arrayToString(dict.array))
		})
		// 红色记忆下载为Excel
		$('#downloadDictXLS').click(function () {
			let sheet = XLSX.utils.aoa_to_sheet(dict.array)
			let html = XLSX.utils.sheet_to_html(sheet)
			let table = $(html).filter('table').get(0)
			let wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' })

			let filename = getDictFilename() + '.xlsx'

			XLSX.writeFile(wb, filename)
		})

		function getDictFilename() {
			let filename = 'dict_' + formatName(location.search.slice(1))
			filename +=
				'_' + ftime().replace(/\//g, '').replace(/:/g, '').replace(/ |\./g, '_')
			return filename
		}

		// 提交所有翻译内容
		$('#mergeDict').on('click', function (e) {
			if (
				confirm(
					'[Warning] Are you sure you want to overwrite your work with dict?'
				)
			) {
				$('#works tr').each((i, e) => {
					let source = $(e).find('.source').text().trim()
					let target = $(e).find('.target').text().trim()
					if (source && target) {
						// 保存
						dict.add(source, target)
						pushlog(
							`[source]${source.textContent} <==> [target]${target.textContent}`
						)
					}
				})
			}
		})

		// 下载任务
		$('#downloadWorksExcel').on('click', function (e) {
			//showTip('잠시만 기다려 주십시오.(최대 30초 대기)');
			let filename =
				formatName(location.search) + '-works-' + ftime('Ymd-His') + '.xlsx'
			//doit($('#works').get(0), fn, 'xls');

			let wb = XLSX.utils.book_new()

			if (e.ctrlKey) {
				let rs = []
				document.querySelectorAll('#works tbody[dataname]').forEach((tbody) => {
					let dataname = tbody.getAttribute('dataname')
					tbody.querySelectorAll('tr').forEach((tr) => {
						let source = tr.querySelector('.source')
						let target = tr.querySelector('.target')
						let st = source.textContent
						let tt = target.textContent
						rs.push([String(st), String(tt), dataname])
					})
				})
				let sheet = XLSX.utils.aoa_to_sheet(rs)
				XLSX.utils.book_append_sheet(wb, sheet, 'All')
			} else {
				document.querySelectorAll('#works tbody[dataname]').forEach((tbody) => {
					let rs = []
					tbody.querySelectorAll('tr').forEach((tr) => {
						let source = tr.querySelector('.source')
						let target = tr.querySelector('.target')
						let st = source.textContent
						let tt = target.textContent
						rs.push([String(st), String(tt)])
					})
					let sheet = XLSX.utils.aoa_to_sheet(rs)
					XLSX.utils.book_append_sheet(
						wb,
						sheet,
						tbody.getAttribute('dataname')
					)
				})
			}

			//download
			let wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
			let a = document.createElement('a')
			let blob = new Blob([wbout], { type: 'application/octet-stream' })
			a.href = URL.createObjectURL(blob)
			a.download = filename
			a.click()
			setTimeout(function () {
				URL.revokeObjectURL(a.href)
			}, 1000)
		})

		$('#downloadWork').click(function (e) {
			let ctrl = e.ctrlKey,
				shift = e.shiftKey,
				alt = e.altKey,
				meta = e.metaKey

			// tbody下的tbody被和谐了。如果没被和谐。
			let range = $('#works tbody[dataname]')
			if (range.length) {
				range.each(function (_, tbody) {
					let r = [],
						hasTextKey = false
					if ($('td.textKey').length)
						r.push('[FieldNames]\nTextKey\tText\tComment\n[Table]')

					$('tr', tbody)
						.clone()
						.find('td.no')
						.remove()
						.end()
						.each(function (i, tr) {
							var k = $('td.textKey', tr)
							var c = $('td.targetComment', tr).text().trim()
							var row = []
							if (k.length) {
								hasTextKey = true
								var t = $('td.target', tr)
								row.push(k.get(0).textContent.trim())
								row.push(t.get(0).textContent.trim())
								if (ctrl) {
									// empty comment add datetime
									if (!Boolean(c)) c = new Date().toISOString()
								} else if (shift) {
									// all comment replace datetime
									c = new Date().toISOString()
								}
								row.push(c)
								r.push(row.join('\t'))
							} else {
								var row = []
								$('td', tr).each(function (i, td) {
									row.push(td.textContent.trim())
								})
								r.push(row.join('\t'))
							}
						})

					let name = tbody.getAttribute('dataname')
					var data = r.join('\n')

					// 直接下载，以前不会下载
					if (hasTextKey) {
						// downloadFileUcs2(name + 'work', data);
						downloadFileUcs2(name, data)
					} else {
						downloadFile(name, data)
					}
				})
				log('download1')
			} else {
				range = $('#works tr')
				if (range.length) {
					let data = ''
					range.each((i, tr) => {
						let source = $(tr)
							.find('.source')
							.text()
							.replace(/\r\n|\n/g, '\\n')
						let target = $(tr)
							.find('.target')
							.text()
							.replace(/\r\n|\n/g, '\\n')
						data += source + '\t' + target + '\n'
					})
					downloadFileUcs2('works_' + Date.now() + '.txt', data)
					log('download2', data)
				}
			}
			log('download')
		})

		$('#downloadWorkT').on('click', function (e) {
			let data
			let r = []
			$('#works td.target').each(function (i, td) {
				r.push(td.textContent.trim())
			})
			data = r.join('\n')

			if (e.ctrlKey) {
				downloadFile('work_target', data)
			} else {
				copyToTempResult(data)
			}
		})

		$('#downloadWorkS').on('click', function (e) {
			let data
			let r = []
			$('#works td.source').each(function (i, td) {
				r.push(td.textContent.trim())
			})
			data = r.join('\n')

			if (e.ctrlKey) {
				downloadFile('work_source', data)
			} else {
				copyToTempResult(data)
			}
		})

		// 清空任务
		$('#clearWork').click(function (e) {
			$('#works').empty()
			$('#tips').empty()

			let { x, y, height } = e.target.getBoundingClientRect()
			y = Math.max(y - height, 0)
			showTip({
				text: '삭제완료',
				x,
				y,
				animate: { top: Math.max(y - 10, 0) },
				delay: 1000,
			})
		})
		// 清空任务
		$('#clearDict').click(function () {
			if (confirm('Warning! Delete the dictionary?')) {
				$('#tips').empty()
				$('#downloadDict').trigger('click')
				setTimeout(function () {
					window.dictarray0 = dict.array
					pushlog('번역기록이 전부 삭제 되었습니다.')
					dict.array.length = 0
					$('#works tr .target').removeAttr('style').removeClass('done')
					$('#dictArrayLengthUI').text(dict.array.length)
					$('#dictArrayTimeUI').text(ftime('H:i:s'))
					saveDatas()
				}, 100)
			}
		})

		// 选择任务
		$('#selectWorks').click(function (e) {
			if (e.ctrlKey) {
				var s = window.getSelection()
				s.removeAllRanges()
				s.selectAllChildren($('#works').get(0))
				document.execCommand('copy', true)
			} else if (e.altKey) {
				$('#works tr td.no').each((i, td) => td.classList.remove('selected'))
			} else {
				$('#works tr td.no').each((i, td) => td.classList.add('selected'))
			}
		})

		// 过滤词典
		function myFilter(id, cls) {
			var _cls = cls.slice(0, 1).toUpperCase() + cls.slice(1).toLowerCase()
			$('#' + id + _cls + 'Filter').on('input', function (e) {
				var tar = e.target,
					v = tar.value
				if (v.length > 0) {
					$('#' + id)
						.find('.' + cls)
						.each(function (i, e) {
							var regexp = Search.getRegExp(
								v,
								'gim',
								$('#' + id + _cls + 'RegExp').prop('checked')
							)
							if (regexp.test(e.textContent)) {
								$(e).parent().removeClass('hide')
							} else {
								$(e).parent().addClass('hide')
							}
						})
				} else {
					$('#' + id)
						.find('.' + cls)
						.parent()
						.removeClass('hide hide2')
				}
			})
		}

		myFilter('statusDict', 'source')
		myFilter('statusDict', 'target')
		myFilter('works', 'source')
		myFilter('works', 'target')
		myFilter('tips', 'source')
		myFilter('tips', 'target')

		function mySearch(id, cls) {
			var _cls = cls.slice(0, 1).toUpperCase() + cls.slice(1).toLowerCase()
			$('#' + id + _cls + 'Search').on('input', function (e) {
				var t = e.target,
					v = t.value
				if (v.length > 0) {
					$('#' + id)
						.find('.' + cls)
						.each(function (i, e) {
							if (e.textContent.indexOf(v) > -1) {
								$(e).parent().removeClass('hide2')
							} else {
								$(e).parent().addClass('hide2')
							}
						})
				} else {
					$('#' + id)
						.find('tr')
						.removeClass('hide2')
				}
			})
		}

		mySearch('statusDict', 'source')
		mySearch('statusDict', 'target')
		mySearch('works', 'source')
		mySearch('works', 'target')
		mySearch('tips', 'source')
		mySearch('tips', 'target')

		function myReplace(id, cls) {
			let _cls = cls.slice(0, 1).toUpperCase() + cls.slice(1).toLowerCase()
			$('#' + id + _cls + 'Replace').on('keydown', function (e) {
				if (
					e.keyCode === 13 &&
					confirm(
						'검색내용을 바꿈내용으로 전환합니다. 전환 후, 하나씩 <Enter>키로 저장해야 합니다!'
					)
				) {
					e.preventDefault()
					let s = $('#' + id + _cls + 'Search').val()
					let r = $('#' + id + _cls + 'Replace').val()

					// 过滤替换
					$('#' + id + ' tr:not(.hide,.hide2) td.' + cls).each(function (i, e) {
						e.textContent = textRE.replace(e.textContent, s, r)
						$(e).addClass('')
					})
					setTimeout(function () {
						$('#useDictTip').prop('checked', false)
						$('#' + id + _cls + 'Search,#' + id + _cls + 'Replace').val('')
					})
				}
			})
		}

		myReplace('statusDict', 'source')
		myReplace('statusDict', 'target')
		myReplace('works', 'source')
		myReplace('works', 'target')
		myReplace('tips', 'source')
		myReplace('tips', 'target')

		$('#tipsSourceFilterAll').on('keydown', function (e) {
			if (e.keyCode !== 13) return
			var v = e.target.value
			if (v.length) {
				let id = '#tips'
				let tips = document.querySelector(id)
				if (!tips) return
				tips.innerHTML = ''
				let regexp = Search.getRegExp(
					v,
					'gim',
					$(id + 'SourceRegExp').prop('checked')
				)
				let a = dict.array,
					i = a.length,
					row,
					tr,
					s,
					t,
					m,
					count = 1
				while (true) {
					if (--i === -1) break
					regexp.lastIndex = undefined
					row = a[i]
					if (Array.isArray(row)) {
						s = row[0]
						t = row[1]
						if (s && t) {
							m = regexp.test(s)
							if (m) {
								regexp.lastIndex = undefined
								let no = document.createElement('td')
								no.className = 'no'
								no.textContent = count++
								let source = document.createElement('td')
								source.className = 'source'
								source.textContent = s
								let target = document.createElement('td')
								target.className = 'target'
								target.textContent = t
								let m = document.createElement('td')
								m.className = 'match'
								m.textContent = Array.from(s.match(regexp)).join('\n')
								let index = document.createElement('td')
								index.className = 'index'
								index.textContent = i
								let tr = document.createElement('tr')
								tr.appendChild(no)
								tr.appendChild(source)
								tr.appendChild(target)
								tr.appendChild(m)
								tr.appendChild(index)
								tips.appendChild(tr)
							}
						}
					}
				}
			}
		})

		$('#tipsTargetFilterAll').on('keydown', function (e) {
			if (e.keyCode !== 13) return
			let v = e.target.value
			if (v.length > 0) {
				let id = '#tips'
				let tips = document.querySelector(id)
				if (!tips) return
				tips.innerHTML = ''
				let regexp = Search.getRegExp(
					v,
					'gim',
					$(id + 'TargetRegExp').prop('checked')
				)
				let a = dict.array,
					i = a.length,
					count = 0,
					s,
					t
				while (true) {
					if (--i === -1) break
					regexp.lastIndex = undefined
					let row = a[i]
					if (row) {
						s = row[0]
						t = row[1]
						if (s && t) {
							let m = regexp.test(t)
							if (m) {
								regexp.lastIndex = undefined
								let no = document.createElement('td')
								no.className = 'no'
								no.textContent = count++
								let source = document.createElement('td')
								source.className = 'source'
								source.textContent = s
								let target = document.createElement('td')
								target.className = 'target'
								target.textContent = t
								let m = document.createElement('td')
								m.className = 'match'
								m.textContent = Array.from(t.match(regexp)).join('\n')
								let index = document.createElement('td')
								index.className = 'index'
								index.textContent = i
								let tr = document.createElement('tr')
								tr.appendChild(no)
								tr.appendChild(source)
								tr.appendChild(target)
								tr.appendChild(m)
								tr.appendChild(index)
								tips.appendChild(tr)
							}
						}
					}
				}
			}
		})

		// if(dict && dict.array) pushlog('Update Dictionary: '+dict.array+length+'ea');

		$('#useDictTip').on('click', function (e) {
			if (e.target.checked === false) {
				$('#tips').empty()
				$('#statusDict').empty()
			}
		})

		// 需要从记录中全文匹配，如果没有则智能匹配。useAutoReplaceTarget
		$('#MatchWork100').click(function (e) {
			e.preventDefault()
			if (e.ctrlKey) {
				let range = $('#works td.no.selected')
					.parent('tr')
					.add('#works .currentEditRow')
				match100(range)
			} else {
				match100()
			}
		})

		$('#hideDone').on('click', hideDone)
		$('#showAll').on('click', showAll)
		// ____________________________________________________
		$('#numQA').click(function (e) {
			// Number QA 核心算法 --start
			$('#works tr').each((i, e) => {
				let $e = $(e)
				let $source = $e.find('.source')
				let $target = $e.find('.target')
				let $qa = $e.find('.qa')
				if ($qa.length === 0) $qa = $('<td class="qa">').appendTo($e)
				$qa.removeClass('success failure')
				let { done, sa, ta } = numCheck($source.text(), $target.text())
				if (done) {
					$e.addClass('hide')
					$qa.text('OK').addClass('success')
				} else {
					if (sa.length === 0 && ta.length === 0) {
						$e.addClass('hide')
						$qa.text('OK').addClass('success')
						return
					}
					$qa.text('').addClass('failure')
					sa.forEach((e) =>
						$('<span class="qa-s"></span>').text(e).appendTo($qa)
					)
					ta.forEach((e) =>
						$('<span class="qa-t"></span>').text(e).appendTo($qa)
					)
				}
			})
		})

		$('#tagQA').click(function (e) {
			// Number QA 核心算法 --start
			$(document.querySelectorAll('#works tr')).each((i, tr) => {
				let $tr = $(tr)
				let $source = $tr.find('.source')
				let $target = $tr.find('.target')
				let $qa = $tr.find('.qa')

				if ($qa.length === 0) $qa = $('<td class="qa"></td>').appendTo($tr)
				$qa.removeClass('success failure')

				let { done, sa, ta } = tagCheck($source.text(), $target.text())

				if (done) {
					$qa.text('OK').addClass('success')
					$tr.addClass('hide')
				} else {
					$qa.text('').addClass('failure')
					sa.forEach((e) =>
						$('<span class="qa-s"></span>').text(e).appendTo($qa)
					)
					ta.forEach((e) =>
						$('<span class="qa-t"></span>').text(e).appendTo($qa)
					)
				}
			})
		})
		function tagCheck(s, t) {
			//let re = {
			//	n: /[0-9]/,
			//	en: /[a-zA-Z]/,
			//	cn: /[\u4e00-\u9fa5]/,
			//	kr: /[\u3131-\u314e\u314f-\u3163\uac00-\ud7a3]/,// [ㄱ-ㅎㅏ-ㅣ가-힣
			//	jp: /[\u3040-\u30ff\u31f0-\u31ff]/,
			//}
			// let s='1,001291 asfas  0.12  100,1000,00.0'
			// let t='asfas  0.12  100,1000,00.0  1,00129'
			let tagRE = /[^\sA-Za-z0-9\u4e00-\u9fa5\u3131-\u314e\u314f-\u3163\uac00-\ud7a3\u3040-\u30ff\u31f0-\u31ff]/g
			let sa = Array.from(s.match(tagRE) || 0)
			let ta = Array.from(t.match(tagRE) || 0)

			// console.log(sa, ta);

			function clac(sa, ta) {
				let sLave = Array.from(sa)
				let tLave = Array.from(ta)

				ta.forEach((e) => {
					sLave.some((item, i, a) =>
						item === e ? (a.splice(i, 1), true) : false
					)
				})
				sa.forEach((e) => {
					tLave.some((item, i, a) =>
						item === e ? (a.splice(i, 1), true) : false
					)
				})

				sa = sLave
				ta = tLave

				return { sa, ta, done: sa.length === 0 && ta.length === 0 }
			}

			// console.log(clac(sa,ta))
			return clac(sa, ta)
		}

		let repeatQARecord = {}
		$('#repeatQA').click(function (e) {
			repeatQARecord = { s: {}, t: {} }
			// Number QA 核心算法 --start
			$(document.querySelectorAll('#works tr')).each((i, tr) => {
				let $tr = $(tr)
				let $source = $tr.find('.source')
				let $target = $tr.find('.target')
				let $qa = $tr.find('.qa')

				if ($qa.length === 0) $qa = $('<td class="qa">').appendTo($tr)
				$qa.removeClass('success failure')

				let { done, sa, ta } = repeatCheck($source.text(), $target.text())

				if (done) {
					$qa.text('OK').addClass('success')
				} else {
					$qa.text('').addClass('failure')
					sa.forEach((e) =>
						$('<span class="qa-s"></span>').text(e).appendTo($qa)
					)
					ta.forEach((e) =>
						$('<span class="qa-t"></span>').text(e).appendTo($qa)
					)
				}
			})
			toggleQARow()
		})
		function toggleQARow() {
			let ss = new Set()
			let ts = new Set()
			$(document.querySelectorAll('#works .qa.failure')).each(function (i, td) {
				let tr = td.parentElement
				if (/s/.test($(td).text())) {
					let tdSource = tr.querySelector('.source')
					ss.add(tdSource.textContent)
				}
				if (/t/.test($(td).text())) {
					let tdTarget = tr.querySelector('.target')
					ts.add(tdTarget.textContent)
				}
			})

			$(document.querySelectorAll('#works tr')).each(function (i, tr) {
				if (
					ss.has(tr.querySelector('.source').textContent) ||
					ts.has(tr.querySelector('.target').textContent)
				) {
					tr.classList.remove('hide')
				} else {
					tr.classList.add('hide')
				}
			})
		}
		function repeatCheck(s, t) {
			let done = true
			let sa = []
			let ta = []
			if (s in repeatQARecord.s) {
				let b = repeatQARecord.s[s] === t
				if (!b) sa.push('s')
				done = done && b
			}
			if (t in repeatQARecord.t) {
				let b = repeatQARecord.t[t] === s
				if (!b) ta.push('t')
				done = done && b
			}
			repeatQARecord.s[s] = t
			repeatQARecord.t[t] = s

			done = done && sa.length === 0 && ta.length === 0
			//console.log(s,t,done,sa,ta)
			return { done, sa, ta }
		}

		$('#dictQA').on('click', function () {
			let dict = getSTWords()

			$('#works tr').each((i, e) => {
				let $e = $(e)
				let $source = $e.find('.source')
				let $target = $e.find('.target')
				let $qa = $e.find('.qa')

				if ($qa.length === 0) $qa = $('<td class="qa">').appendTo($e)
				$qa.removeClass('success failure')

				let ret = wordCheck($source.text(), $target.text(), dict)

				if (ret.done) {
					$qa.text('OK').addClass('success')
				} else {
					$qa.text(ret.map((e) => e.join('|')).join('\n')).addClass('failure')
				}
			})
		})

		// import text lines
		$('#ImportTextLines').click(function (e) {
			var str
			var arr
			var target
			var div = $('<div>')
				.css({
					position: 'fixed',
					top: 0,
					width: '40%',
					right: 10,
					bottom: 10,
					border: '2px solid blue',
					padding: 24,
					background: 'rgba(0,0,0,0.5)',
					zIndex: 99999999999,
				})
				.appendTo('body')
			var msg = $('<h5>')
				.text('use lines...')
				.css({
					background: 'rgba(255,255,255,0.9)',
					'font-weight': 'bold',
				})
				.appendTo(div)
			var ok = $('<button>')
				.text('done')
				.on('click', function () {
					str = ta.val().trim()
					arr = str.split('\n')
					ta.remove()
					ok.remove()
					msg.text('Please thouch <down> key').appendTo(div)
					$(document).on('keydown', '.target', doWork)
					div.css({
						width: 200,
						height: 200,
						top: 0,
						right: 10,
					})
				})
				.appendTo(div)
			var ng = $('<button>')
				.text('cancel')
				.on('click', function () {
					div.remove()
					$(document).off('keydown', doWork)
				})
				.appendTo(div)
			div.append('<br>')
			var ta = $('<textarea>')
				.appendTo(div)
				.css({
					width: '100%',
					height: window.innerHeight / 2,
				})
			function doWork(e) {
				if (e.keyCode !== 40) {
					return
				}
				var v = arr.shift()
				if (v) {
					e.preventDefault()
					e.target.textContent = v
					$(e.target)
						.parent()
						.nextAll()
						.not('.hide,hide1,.hide2,.hide3,.hide4')
						.eq(0)
						.find('.target')
						.focus()
					msg.text(arr.length + 'ea')
					if (arr.length === 0) {
						msg.text('complete.').appendTo(div).css({
							background: 'rgba(0,255,0,0.2)',
						})
						$(document).off('keydown', doWork)
						div.remove()
					}
				}
			}
		})

		// 绑定事件，侦听util工具栏中的查找和替换按钮
		function activeSRButton(id) {
			$('#' + id).on('click', function (e) {
				if (confirm('전체바꾸기를 진행합니까?')) {
					let id = e.target.getAttribute('id').replace('Button', '')
					if (id) {
						$('#' + id).trigger({ type: 'keydown', keyCode: 13 })
						console.log(id)
					}
				}
			})
		}
		activeSRButton('statusDictSourceReplaceButton')
		activeSRButton('statusDictTargetReplaceButton')
		activeSRButton('worksSourceReplaceButton')
		activeSRButton('worksTargetReplaceButton')
		activeSRButton('tipsSourceReplaceButton')
		activeSRButton('tipsTargetReplaceButton')
	}

	window.addEventListener(
		'loaddropfiles',
		function (e) {
			setTimeout(() => {
				// e.datas  [ {type, name, data} ,...]
				// return console.log(e.datas);
				let ls = ao.ls,
					table,
					datas = e.datas,
					name,
					type,
					data,
					fragment
				fragment = document.createDocumentFragment()
				for (let i = 0, len = datas.length; i < len; i++) {
					pushlog(`${i}/${len} 도입 중...`)
					name = datas[i].name
					type = datas[i].type
					data = datas[i].data

					{
						let _table = ao.tmstringToTable(data)
						let tbody = document.createElement('tbody')
						tbody.setAttribute('datatype', _table.getAttribute('datatype'))
						tbody.setAttribute('dataname', _table.getAttribute('dataname'))
						tbody.setAttribute('class', _table.getAttribute('class'))
						tbody.innerHTML = _table.innerHTML
						table = tbody
					}

					$(table)
						.attr({ dataType: type, dataName: name })
						.find('.source')
						.each(function (i, e) {
							$(e).text(
								$(e)
									.text()
									.replace(/\{\\r\\n\}/g, '\\n')
							)
						})

					if (type === 'tmtool') table.classList.add('tmtoolfile')
					fragment.appendChild(table)
				}

				$('#works').get(0).appendChild(fragment)
			}, 100)
		},
		true
	)

	function loadDatas() {
		let prefix = location.search
		// 读入worksn内容
		tm.getItem(formatName(prefix) + 'dict', (j, v) => {
			console.log({ name: formatName(prefix), j, v })
			if (j) {
				console.warn('[优化]', j)
			} else {
				if (Array.isArray(v)) {
					addDict(v)
					//tm.removeItem(formatName(prefix)+'dict', function(j){
					//	console.warn(j?j:'已删除dict旧地址');
					//});
				} else {
					console.debug('没有dict旧地址')
				}
				tm.getItem(formatName(prefix), (j, v) => {
					if (j) {
						console.error('[严重]', j)
					} else if (v) {
						let {
							worksHTML,
							dictArray,
							netTarget,
							useNet,
							useNet2,
							useDictTip,
							similarPercentAutoReplaceTarget,
							similarPercent,
							useAutoReplaceTarget,
						} = v

						//worksHTML
						{
							let fragment = document.createElement('table')
							fragment.innerHTML = worksHTML
							fragment.querySelectorAll('.tip').forEach(function (tip) {
								tip.remove()
							})
							fragment.querySelectorAll('.target').forEach((target) => {
								target.classList.remove('wait')
							})
							fragment.querySelectorAll('.target.done').forEach((target) => {
								if (!target.textContent.trim()) {
									let { classList: s } = target
									s.remove('done')
									s.remove('doneAuto')
									s.remove('doneAutoSpace')
									s.remove('doneAutoNumber')
									s.remove('doneAutoSmart')
								}
							})
							fragment
								.querySelectorAll('tr.error')
								.forEach((e) => e.classList.remove('error'))
							let works = document.querySelector('#works')
							works.appendChild(fragment)
							setTimeout(() => {
								// 不知为何，这里需要延迟才能正常对焦。
								let target = works.querySelector(
									'#works .currentEditRow .target'
								)
								if (target) {
									target.scrollIntoView({ block: 'center' })
									target.focus()
								}
								calculationWorksStatus()
							}, 200)
						}
						//dictArray
						if (Array.isArray(dictArray)) {
							addDict(dictArray)
						}
						//
						{
							if (netTarget)
								document.querySelector('#netTarget').value = netTarget
							if (typeof useNet === 'boolean')
								document.querySelector('#useNet').checked = useNet
							if (typeof useNet2 === 'boolean')
								document.querySelector('#useNet2').checked = useNet2
							if (typeof useDictTip === 'boolean')
								document.querySelector('#useDictTip').checked = useDictTip
							if (typeof useAutoReplaceTarget === 'boolean')
								document.querySelector(
									'#useAutoReplaceTarget'
								).checked = useAutoReplaceTarget
							if (typeof similarPercentAutoReplaceTarget === 'number')
								document.querySelector(
									'#similarPercentAutoReplaceTarget'
								).value = similarPercentAutoReplaceTarget
							if (typeof similarPercent === 'number')
								document.querySelector('#similarPercent').value = similarPercent
						}
					}
				})

					; (async function () {
						let tamai = await tm.getItem('tamaiMode')
						let chanhee = await tm.getItem('chanheeMode')
						if (tamai) {
							document.querySelector('#tamaiModeSwitch').click()
						}
						if (chanhee) {
							document.querySelector('#chanheeModeSwitch').click()
						} else {
							let style = document.querySelector('#chanheeMode')
							style.disabled = true
						}
						themaReady[1] = true
						showBody()
					}.call(this))

				const $projectAnchors = $('#projectAnchors').text('')
				tm.keys().then((ks) => {
					ks.filter((k) => /^_/.test(k)).forEach((k) => {
						let pname = k.slice(1)
						try {
							pname = decodeURI(pname.replace(/_/g, '%'))
						} catch (err) {
							console.warn(`decodeURI(`, pname, `)`)
							socket.emit('B', '[Warning] decodeURI', pname)
						}
						$('<a>')
							.prop({ href: '?' + pname, textContent: pname })
							.appendTo($projectAnchors)
						//console.log(pname)
					})
				})
			}
		})
	}

	loadDatas()

	window.loadDatas = loadDatas // export

	// 【备份】
	// function backup() {
	// 	let bd = localforage.createInstance({ name: 'backup' }), date = new Date(), dictArrayLength, length;
	// 	if (typeof dict !== 'undefined' && dict.array && (dictArrayLength = dict.array.length)) {

	// 		bd.getItem(formatName(location.search) + 'dict', (j, v) => {
	// 			if (v && Array.isArray(v) && (length = v.length) > dictArrayLength) {
	// 				if (!confirm('[Warning] Do you replace? ' + length + '(old)--->(new)' + dictArrayLength)) return console.error('Failed to back up.');
	// 			}
	// 			bd
	// 				.setItem(formatName(location.search) + 'dict', dict.array)
	// 				.catch((e) => { if (e) { alert('[Error] no save dict. ' + e.message); } })

	// 			bd.setItem(formatName(location.search) + 'backuptime', date.getTime())
	// 				.catch(e => { if (e) { alert('[Error] no save time. ' + e.message); } })

	// 			bd.setItem(formatName(location.search) + 'backuptimestring', date.toLocaleString())
	// 				.catch(e => { if (e) { alert('[Error] no save time. ' + e.message); } })
	// 		});
	// 	}
	// }
	// 【还原】
	// function restore() {
	// 	let bd = localforage.createInstance({ name: 'backup' });
	// 	if (typeof dict === 'undefined') window.dict = new Reference();
	// 	bd.getItem(formatName(location.search) + 'dict',
	// 		(j, v) => {
	// 			if (j) {
	// 				console.warn('[Error] No read dict . ' + j.message);
	// 				addDict();
	// 			} else if (v) {
	// 				addDict(v);
	// 			}
	// 		});
	// }

	// setTimeout(() => {
	// 	let message = '[Auto backup]';
	// 	backup();
	// 	pushlog(message);
	// 	console.info(message);
	// }, 60000 * 30);

	var t
	// function replaceTD(t){
	// 	var w=window.getSelection();
	// 	var bn=w.baseNode;
	// 	var b=w.baseOffset;
	// 	var en=w.extentNode;
	// 	var e=w.extentOffset;
	// 	if(bn===en){
	// 		window.bn=bn;
	// 		console.log(bn);
	// 	}
	// }

	// ddb-move

	// function uniqueDict(){
	// 	var o = {}, a=[];
	// 	dict.array.forEach(function(e){
	// 		o[e[0]]=e[1];
	// 	});
	// 	for(var k in o) {
	// 		a.push([k,o[k]]);
	// 	}
	// 	return a;
	// }

	// 问题：在翻译时，mission中的相似文章，没有像Dictionary一样同时被显示出来，所以很难统一语句。
	// 问题：需要在某个范围内，大量替换某个关键字、关键词的功能。
	// 问题：自动提示本文中的词语，越长的开始匹配，有可能有2个原文词合并的情况，但有可能又是别的译文。
	$(document).on('keydown', function (e) {
		let { repeat, keyCode, code } = e
		// 16:Shift  17:Ctrl   18:Alt
		if (repeat || keyCode === 16 || keyCode === 17 || keyCode === 18)
			return e.preventDefault()
		if (code === undefined) {
			let oe = e.originalEvent
			if (oe === undefined) return console.error(e)
			code = oe.code
			if (code === undefined) return console.error(oe)
		}

		// Digit0~Digit9,Numpad0~Numpad9
		if (/^Digit\d$/.test(code) || /^Numpad\d$/.test(code)) {
			let tipName
			if (e.ctrlKey) {
				// ctrl+num
				e.preventDefault()
				tipName = '#tips'
			} else if (e.altKey) {
				// alt+num
				e.preventDefault()
				tipName = '#statusDict'
			}
			if (tipName && $(tipName).find('tr').length) {
				let tar = $(e.target)
				e.preventDefault()
				let key = parseInt(code.match(/\d/))
				if (key === 0) key = 10
				key--
				let t = $(tipName).find('tr').eq(key).find('.target').text().trim()

				let { startContainer, endContainer } = SM.range

				if (
					startContainer &&
					startContainer.nodeType === 1 &&
					startContainer.classList.contains('target') &&
					endContainer &&
					endContainer.nodeType === 1 &&
					endContainer.classList.contains('target')
				) {
				} else if (
					startContainer &&
					startContainer.nodeType === 3 &&
					startContainer.parentElement.classList.contains('target') &&
					endContainer &&
					endContainer.nodeType === 3 &&
					endContainer.parentElement.classList.contains('target')
				) {
				} else if (SM.lastTargetRange) {
					SM.range = SM.lastTargetRange
				}

				let range = SM.range
				endContainer = range.endContainer
				startContainer = range.startContainer
				if (startContainer.normalize) startContainer.normalize() // 很重要，由于Text片段太多，需要合并，否则影响td的宽度变长，css无法控制长度。
				if (
					(endContainer.nodeType === 3 &&
						$(endContainer.parentNode).is('#works .target') &&
						startContainer.nodeType === 3 &&
						$(startContainer.parentNode).is('#works .target')) ||
					(endContainer.nodeType === 1 &&
						$(endContainer).is('#works .target') &&
						startContainer.nodeType === 1 &&
						$(startContainer).is('#works .target'))
				) {
					SM.insert(t) // 替换 selection.range 所选中的内容为 t。
					if (e.ctrlKey) {
						// show diff  -- dmp
						if (t.length) {
							let t1 = $(tipName)
								.find('tr')
								.eq(key)
								.find('.source')
								.text()
								.trim()
							let t2 = $(e.target).parent().find('.source').text().trim()
							let dmp = new diff_match_patch()
							let diff = dmp.diff_main(t1, t2)


							//内置编码转换 utf8 - utf16
							//console.log(t1 === t2)
							//{
							//	let enc = new TextEncoder('utf-8')
							//console.log('t1', Array.from(enc.encode(t1)).map(e => e.toString(16)).join(''))
							//console.log('t2', Array.from(enc.encode(t2)).map(e => e.toString(16)).join(''))
							//}


							//dmp.diff_cleanupSemantic(diff)
							let dmpHTML = dmp.diff_prettyHtml(diff)

							let { x, y, width, height } = tar.get(0).getBoundingClientRect()
							// showTip({html:dmpHTML, x, y:Math.max(y-height,0)});
							let tip = showTip({
								name: 'uniq-tips', // 使用唯一一个
								delay: -1, // 用Esc或blur事件消除
								html: dmpHTML,
								x,
								y,
								width,
								css: { transform: 'translate(0,-100%)' },
							})

							$(pushloghtml(dmpHTML))
						}
					}
				}
			}
		}
	})

	/*
	智能匹配任务
	源：검성 라시드의 비밀
	
	已知：
		검성 라시드	剑圣拉希德
		라시드의 비밀	拉希德的秘密
	
	推荐翻译：
	검성 라시드의 비밀	剑圣拉希德的秘密
	
	推荐词库收录：
	검성	剑圣
	라시드	拉希德
	비밀	秘密
	
	
	
	
	Inconsistency in Source
	原文一样，译文不同。(空格敏感)
	原文不同，译文一样。(空格敏感)
	
	Tag Mismatch
	原文中的某些<[()]>标签，在译文中有所不同。
	
	Numeric Mismatch
	原文中的数字，与译文中的内容有所不同。
	
	
	Alphanumeric Mismatch Source(AD2DB57FF) Target(ADD625FF)
	原文多进制数字，与译文中的内容有所不同。
	
	Unpaired Symbol
	不成对的符号
	()[]{}<>没有开或关，就是没有配套出现。
	
	Unpaired Quotes
	各种开始或结束的没有匹配到的" ' 中文的全角‘’
	
	
	*/

	function maskScreen() {
		let mask = $('#mask')
		if (mask.length === 0) {
			mask = $('<div id="mask">').css({
				width: '100%',
				height: '100%',
				position: 'fixed',
				left: 0,
				top: 0,
				background: 'rgba(255,255,255,.8)',
			})
			// .on('contextmenu',(e)=>{ e.preventDefault() mask.detach() })
		}
		mask.appendTo('body')
		return mask
	}

	function get2DArrayMaxLength(arr) {
		let maxLength = 0
		arr.forEach((row) => {
			maxLength = Math.max(row.length, maxLength)
		})
		return maxLength
	}

	function createControlTr(maxLength) {
		let tr = $('<tr class="control">')
		while (maxLength-- > 0) {
			$('<td>')
				.appendTo(tr)
				.append(createRadioButton('source'))
				.append(createRadioButton('target'))
				.append(createCheckButton('edit'))
		}
		return tr
	}

	function createRadioButton(name, checked) {
		let label = $('<label class="button">').text(name),
			radio = $('<input type="radio">').attr({ name, checked }).prependTo(label)
		radio.after('<br>')
		return label
	}
	function createCheckButton(name, checked) {
		let label = $('<label class="button">').text(name),
			radio = $('<input type="checkbox">')
				.attr({ name, checked })
				.prependTo(label)
		radio.after('<br>')
		return label
	}

	{
		$('#flipDict').click(function (e) {
			let array = dict.array

			array.forEach(function (e) {
				let temp
				if (Array.isArray(e)) {
					temp = e[0]
					e[0] = e[1]
					e[1] = temp
				} else if (typeof e === 'object' && e.source && e.target) {
					temp = e.source
					e.source = e.target
					e.target = temp
				}
			})

			alert(
				'[주의] 번역기록의 소스와 타겟이 위치전환합니다.\n' +
				dict.array
					.slice(0, 100)
					.map((e) => e.join('-->'))
					.join('\n') +
				'...'
			)
		})
	}

	function changeWorksFontSize() {
		let size = Math.max(parseInt($('#worksFontSize').val()), 8)
		$('#activeStyle').text(`#works td.source,#works td.target{
		font-size:${size}pt;
	}`)
	}

	{
		$('#restoreButton').click(() => {
			let bd = localforage.createInstance({ name: 'backup' })
			bd.getItem(formatName(location.search) + 'backuptime', (j, v) => {
				if (j) {
					console.warn('[Error] No backup.')
				} else if (v) {
					if (
						confirm('Last backup time is:  ' + new Date(v).toLocaleString())
					) {
						restore()
					}
				}
			})
		})

		$('#toggleComments').click(() =>
			$('#works td').not('.no,.source,.target').toggle()
		)
	}

	{
		// 插入特殊符号
		let chars =
			'\\{\\r\\n\\}|\\n|\\s*[' +
			'`~!@#$%^&*()_+-=[]{}\\|:;\'"/<>?'
				.split('')
				.map((e) => '\\' + e)
				.join('') +
			']+\\s*'
		// let chars='['+'`~!@#$%^&*()_+-=[]{}\\|:;\'",./<>?'.split('').map(e=>'\\'+e).join('')+']+';
		let _customChars = '\\s*[\\x00-\\x19\\x21-\\xff→♥♣◆★※≪≫▶◀ⅠⅡⅢⅣ꒰꒱]+\\s*'
		$(window).on('keydown', (e) => {
			if (e.keyCode === 120) {
				// 120:F9
				// ctrl+shift+alt+f9 配置
				if (e.ctrlKey && e.shiftKey && e.altKey) {
					return (_customChars =
						prompt('매칭 할 내용을 넣어 주세요', _customChars) || _customChars)
				}

				e.preventDefault()
				insertTips(e) // 插入找到的内容
			}
		})
		function insertTips(e) {
			// 插入找到的内容
			let t = $(e.target)
			if (t.is('#works .target')) {
				let s = t.parent().find('.source')

				let regExp, r
				if (e.ctrlKey || e.altKey) {
					regExp = new RegExp(_customChars, 'gm')
				} else {
					let rs = [
						/\[[ A-Z0-9a-z_#]+\]/,
						/\/\w+/,
						/(?:\p{Open_Punctuation})[0-9a-zA-Z]{6,}(?:\p{Close_Punctuation})/,
						/\[-\]/,
						/\{\d\}/,
						/(?:[\-\+] *)?(?:,?\d{1,3})*(?:\.?\d+)(?:(?:e)\d+)?(?: *%)?/,
						/\p{Number}+/u,
						/\p{Punctuation}+/,
						/\p{Emoji}+/,
						/[\\x00-\\x19\\x21-\\xff＃＆＊~＠§※★☆○●◎◇◆□■△▲▽▼◁◀▷▶♤♠♡♥♧♣⊙◈▣◐◑®※≪≫▶◀꒰꒱→♬♪∥◡✿◕ˇεΔºᴖᴈᴑˊᗜˋ☜☞و`´˃˂˘]/,
					]
					regExp = new RegExp(rs.map((e) => e.source).join('|'), 'gui')
				}

				r = s.text().match(regExp).join('').replace('：', ':')
				// console.debug(regExp,r);
				if (e.altKey) {
					r = r.replace(/'([\s\S]*?)'/g, '「$1」')
					r = r.replace(/"([\s\S]*?)"/g, '『$1』')
					// r=r.replace(/:/g,'：');
				}

				// 由于Ctrl+F9错误插入到source中，解决此BUG。
				if (r) {
					// let range = window.range = SM.range
					// if(range)
					// SM.range.deleteContents()
					// SM.range.insertNode(new Text(r))
					// SM.s.removeAllRanges()
					// if(SM.focusNode && SM.focusNode.nodeType
					if (
						SM.s.focusNode &&
						SM.s.focusNode.nodeType === Document.TEXT_NODE &&
						SM.s.anchorNode &&
						SM.s.anchorNode.nodeType === Document.TEXT_NODE
					) {
						if (
							parentNodeIsTargetClasses(SM.s.focusNode) &&
							parentNodeIsTargetClasses(SM.s.anchorNode)
						) {
							SM.text = r
						}
					} else if (
						SM.s.focusNode &&
						SM.s.focusNode === SM.s.anchorNode &&
						SM.s.anchorNode.classList.contains('target')
					) {
						SM.text = r
					} else {
						warn(r)
						warn(SM.s)
					}
				}
			}
		}
	}

	{
		$('#main .utilsource').on('contextmenu', (e) => {
			if (e.originalEvent.target === e.originalEvent.currentTarget) {
				e.preventDefault()
				$('#worksSourceFilter').val('').trigger('input')
			}
		})
	}

	// {
	// 	let t = true;
	// 	$('#sort').on('click', e => {
	// 		$('#works tr').sort((a, b) => {
	// 			if (t) {
	// 				a = $(a).find('.source').text().length;
	// 				b = $(b).find('.source').text().length;
	// 			} else {
	// 				a = parseInt($(a).find('.no').text());
	// 				b = parseInt($(b).find('.no').text());
	// 			}
	// 			return a > b ? 1 : (a < b ? -1 : 0);
	// 		}).detach().appendTo('#works');
	// 		t = !t;
	// 		$('#sort').find('span').last().text((t ? '길이' : '순서') + '배열');
	// 	});
	// }

	// 编辑下一个空格子
	function nextEmptyTarget(ctrlKey = false) {
		let e = $('#works tr').not('.hide,.hide2,.hide3,.emptyRow,.splitTarget')
		if (!ctrlKey) {
			e = e.filter((i, e) => $(e).find('.target').is(':empty()'))
		} else {
			e = e.filter((i, e) => !$(e).find('.target').is('.done'))
		}
		let t = e.eq(0).find('.target')
		if (t.length) {
			t.focus()
		} else {
			let p = $('.currentEditRow').parent()
			if (p.is('.tmtoolfile')) {
				p = p.next()
				p.find('.target').eq(0).focus()
			}
		}
	}

	// function WorksRange(){
	// 	this.ranges = {};
	// 	this.parents = {};
	// 	this.selection;
	// }
	// Object.defineProperty(WorksRange.prototype,'selection',{
	// 	get(){
	// 		if(!this._selection) Object.defineProperty(this,'_selection',{value:window.getSelection()});
	// 		return this._selection;
	// 	}
	// });
	// Object.defineProperty(WorksRange.prototype,'range',{
	// 	get(){
	// 		return this.selection.rangeCount ? this.selection.getRangeAt(0) : null;
	// 	}
	// });
	// WorksRange.prototype.flush = function (){
	// 	let r=this.range;
	// 	if(!r) return;
	// 	let n = r.endContainer;
	// 	while(true)	{
	// 		if(!n) break;
	// 		if($(n).is('#works .target')) {
	// 			this.ranges.target=r;
	// 			this.parents.target=n.parentElement;
	// 			break;
	// 		}
	// 		if($(n).is('#works .source')) {
	// 			this.ranges.source=r;
	// 			this.parents.source=n.parentElement;
	// 			break;
	// 		}
	// 		n=n.parentElement;
	// 	}
	// 	// console.log(JSON.stringify(this.ranges,function(k,v){
	// 	// 	if(k==='target' || k==='source') {
	// 	// 		return v.toString();
	// 	// 	}
	// 	// 	return v;
	// 	// }))
	// 	// console.log(this.parents)
	// }
	// Object.defineProperty(WorksRange.prototype, 'isSameParent', {
	// 	get(){
	// 		return this.parents.source === this.parents.target;
	// 	}
	// });
	// WorksRange.prototype.start = function(){
	// 	$(window).on('mouseup keyup', this.defaultHandle.bind(this));
	// }
	// WorksRange.prototype.stop = function(){
	// 	$(window).off('mouseup keyup', this.defaultHandle.bind(this));
	// }
	// WorksRange.prototype.defaultHandle = function(e){
	// 	e.preventDefault();
	// 	this.flush();
	// }
	// let wr=new WorksRange()
	// wr.start()

	// function splitLongSource(s) {
	// 	let r = /(?!\d)\s*(?:\.|\?|\!)\s*(?!\d)|{\\r\\n}|\\n/g;
	// 	let a1 = s.split(r);
	// 	let l1 = a1.length;
	// 	if (l1 < 2) return false;
	// 	let a2 = s.match(r);
	// 	let l2 = a2.length;
	// 	console.warn(a1, a2)
	// 	let a = [];
	// 	let len = Math.max(l1, l2);
	// 	let i = 0;
	// 	while (i < len) {
	// 		let v1 = a1[i], v2 = a2[i] || '', chunk;
	// 		if (v2.indexOf('.') === -1 || v2.indexOf('!')===-1 || v2.indexOf('?')===-1) {
	// 			chunk = [v1, v2];
	// 		} else {
	// 			chunk = [v1 + v2];
	// 		}
	// 		a = a.concat(chunk);
	// 		i++;
	// 	}
	// 	a = a.filter(e => e.length > 0);
	// 	return a;
	// }

	{
		// 让.source可以编辑
		$(window).on('contextmenu', (e) => {
			let t = e.target,
				k = 'contenteditable',
				v = 'plaintext-only'
			if ($(t).is('.source')) {
				e.originalEvent.preventDefault()
				if (t.hasAttribute(k)) {
					t.removeAttribute(k)
				} else {
					t.setAttribute(k, v)
				}
			}
		})

		// 下方格子向上合并(Ctrl+E)
		let match100Timeout
		$(window).on('keydown', (e) => {
			/* 
			t  当前译文
			p  当前译文的父级
			pn 下一个父级
			 */
			let t = $(e.target),
				p = $(t).parent(),
				pn = p.next()
			if (e.keyCode === 69 && e.ctrlKey) {
				// CTRL+E
				e.originalEvent.preventDefault()
				if (t.is('.target') && p.is('.split') && pn.is('.split')) {
					let s = p.find('.source')
					let sn = pn.find('.source')
					s.text(s.text() + sn.text())

					let tn = pn.find('.target')
					t.text(t.text() + tn.text())
					t.focus()
					pn.remove()
				}
				t.trigger({ type: 'keydown', keyCode: 19, code: 'Pause' })
				clearTimeout(match100Timeout)
				match100Timeout = setTimeout(() => {
					match100($('.currentEditRow .target'))
				}, 2000)
			}
		})
	}

	// 让单按Alt键失效（否则总会失真）
	window.addEventListener('keyup', function (e) {
		e.preventDefault()
	})

	// 点击关闭原来的窗口
	{
		$('#useNet').click((e) => {
			gSearch.google && gSearch.google.close()
			gSearch.papago && gSearch.papago.close()
			gSearch.googleAll && gSearch.googleAll.close()
		})
	}

	let w
	{
		!(function () {
			// debug flag
			let debug = localStorage.getItem('debug')
			if (!debug) return
			// console.warn(debug);
			w = new Worker('./dict-worker.js')
			w.addEventListener('message', function (e) {
				// console.log(e.data);
				// console.timeEnd(e.data.type);
			})
			function remove(source) {
				// console.time('remove');
				w.postMessage({ type: 'remove', source })
			}
			function get(source) {
				// console.time('get');
				w.postMessage({ type: 'get', source })
			}
			function set(source, target) {
				// console.time('set');
				w.postMessage({ type: 'set', source, target })
			}
			function similar(source, cv) {
				// console.time('similar');
				w.postMessage({ type: 'similar', source, cv })
			}
			function size() {
				// console.time('size');
				w.postMessage({ type: 'size' })
			}
			w.remove = remove
			w.get = get
			w.set = set
			w.similar = similar
			w.size = size
		})()
	}

	let d
	{
		!(function () {
			d = {}
			function sml(source, cv = 1) {
				let result = []
				dict.array.forEach(function (e) {
					let [k, v] = e
					let _cv = similar(source, k, true)
					if (_cv >= cv) {
						let o = Object.create(null)
						Object.assign(o, { cv: _cv, source: k, target: v })
						result.push(o)
					}
				})
				return result
			}
			d.similar = function (source, cv = 1) {
				// console.time('d silimar');
				let res = sml(source, cv)
				// console.timeEnd('d silimar');
				return res
			}
		})()
	}
})

// 【】
function cnEncode(s, tips) {
	let ts = {},
		source = s,
		space = s,
		t

	tips.forEach(function (e, i) {
		while (space.indexOf(e[0]) > -1) {
			space = space.replace(e[0], '')
			source = source.replace(e[0], `\uffff${i}\uffff`)
			ts[i] = e[1]
		}
	})
	space = space
		.replace(/\s+/g, '')
		.replace(/\\n+/g, '')
		.replace(/\\t+/g, '')
		.replace(
			/[\~\!\@\#\$\%\^\&\*\(\)\_\+\`\-\=\[\]\\\;\'\,\.\/\{\}\|\:\"\<\>\?]+/g,
			''
		)
		.replace(/\p{Number}/gu, '')
		.replace(/\p{Mark}/gu, '')
	if (space.length == 0) {
		t = source
		for (let i in ts) {
			while (t.indexOf(`\uffff${i}\uffff`) > -1) {
				t = t.replace(`\uffff${i}\uffff`, ts[i])
			}
		}
		t = t.replace(/ +/g, '')
	}
	return { ts, space, source, s, tips, t }
}
function getTips() {
	return $('#statusDict tr')
		.toArray()
		.map((e) => [$(e).find('.source').text(), $(e).find('.target').text()])
		.sort((a, b) => {
			let al, bl
			al = a[0].length
			bl = b[0].length
			if (al > bl) {
				return -1
			} else if (al < bl) {
				return 1
			} else {
				return a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0
			}
		})
}

function dmpMatch() {
	// statusDict, tips
	let red = $('#tips tr')
		.toArray()
		.map((tr) => [$(tr).find('.source').text(), $(tr).find('.target').text()])
	// let curr = $('#works .currentEditRow')
	// let s = curr.find('.source')
	// let st = s.text()
	let st = $('#works .currentEditRow').find('.source').text()
	let dmp = new diff_match_patch()
	return red.map((e) => {
		let diff = dmp.diff_main(e[0], st)
		dmp.diff_cleanupSemantic(diff)
		return e.concat(diff)
	})
}
function red() {
	return $('#tips tr')
		.toArray()
		.map(function (tr) {
			tr = $(tr)
			return {
				source: tr.find('.source').text(),
				target: tr.find('.target').text(),
				similar: parseFloat(tr.find('.similar').text()),
			}
		})
}

function blue() {
	return $('#statusDict tr')
		.toArray()
		.map(function (tr) {
			tr = $(tr)
			return {
				source: tr.find('.source').text(),
				target: tr.find('.target').text(),
				similar: parseFloat(tr.find('.similar').text()),
			}
		})
}

function collector(dicts) {
	let dmp = new diff_match_patch()
	let s = (collector.s = {})
	dicts.forEach(function (dict, index) {
		let { source, target, similar } = dict
		dicts.forEach((e, i, a) => {
			if (index === i) return
			let sd = dmp.diff_main(source, e.source)
			dmp.diff_cleanupSemantic(sd)
			let td = dmp.diff_main(target, e.target)
			dmp.diff_cleanupSemantic(td)
			let sa = { '-1': new Set(), 1: new Set(), 0: new Set() }
			let ta = { '-1': new Set(), 1: new Set(), 0: new Set() }
			sd.forEach((e) => sa[e[0]].add(e[1]))
			td.forEach((e) => ta[e[0]].add(e[1]))
			let f = function (k) {
				if (sa[k].size === 1 && ta[k].size === 1) {
					let st = Array.from(sa[k])[0]
					let tt = Array.from(ta[k])[0]
					if (!s[st]) s[st] = {}
					if (!s[st][tt]) s[st][tt] = 0
					s[st][tt] += 1
				}
			}
			f('-1')
			f('0')
			f('1')
		})
	})
	collector.r = collectorTips()
	return s
}
function collectorTips() {
	let s = collector.s,
		r = []
	if (s) {
		for (let k in s) {
			let v,
				count = 0
			Object.keys(s[k]).forEach((t) => {
				if (s[k][t] > count) v = t
			})
			r.push([k, v])
		}
	}
	return r
}

// $(()=>{
// 	let dmp = new diff_match_patch()
// 	let a = {source:'영웅 장비 제조시 엘드 자원 10% 감소',target:'制作英雄装备时，减少10%金币资源消耗'}
// 	let b = {source:'영웅 장비 제조시 에딜륨 자원 10% 감소', target:'制作英雄装备时，减少10%紫水晶资源消耗'}

// 	function kkv(k,kv){
// 		let r = dmp.diff_main(kv.source||kv[0],k).filter(e=>e[0]!==0)
// 		let l = r.length
// 		if(l===2 && r[0][0]===-1 && r[1][0]===1){
// 			let search = dict.search(r[0][1],100)[1]
// 			if(search) {
// 				let replace = dict.search(r[1][1],100)[1]
// 				if(replace) {
// 					let v = kv.target||kv[1]
// 					if(v) return v.replace(search,replace)
// 				}
// 				return false
// 			}
// 		}else{
// 			return false
// 		}
// 	}

// 	console.log(auto(a,b))
// })

function kkv(k, kv) {
	let dmp = new diff_match_patch()
	let r = dmp.diff_main(kv.source || kv[0], k)
	dmp.diff_cleanupSemantic(r)
	r = r.filter((e) => e[0] !== 0)
	let l = r.length
	if (l === 2 && r[0][0] === -1 && r[1][0] === 1) {
		// console.log(r[0][1])
		let search = dict.search(r[0][1], 100)[0]
		// console.log(search)
		if (search) {
			let replace = dict.search(r[1][1], 100)[0]
			// console.log(replace)
			if (replace) {
				let v = kv.target || kv[1]
				// console.log(v, search[1],replace[1], v.replace(search[1],replace[1]))
				if (v) return v.replace(search[1], replace[1])
			}
		}
	}
	return false
}

function mergeSplits() {
	let t, p, name
	let splits = document.querySelectorAll('#works tbody.split')
	if (splits.length === 0) return console.warn('[오류] 합병할 내용이 없습니다.')

	splits.forEach((tbody) => {
		let originalname = tbody.getAttribute('originalname')
		if (!originalname || !/^\w+$/i.test(originalname))
			return console.warn('[오류] originalnam:', originalname)

		let originalTarget = document.querySelector(
			`#works .target[originalname="${originalname}"]`
		)
		if (!originalTarget) return

		let text = ''
		tbody.querySelectorAll('tr').forEach((tr) => {
			let t = tr.querySelector('.target')
			text += t.textContent
		})
		originalTarget.classList.remove('splitTarget')
		originalTarget.removeAttribute('originalname')
		originalTarget.textContent = text
		originalTarget.focus()
		tbody.remove()
	})
	// .parent().removeClass('hide')// 20190306
	//if (p) p.focus();

	// 优化：阻止合并时自动插入旧100%记录
	lwsd.close()
	lwsd2.close()
	//$('#statusDict,#tips').empty()
}
function splitLong(tar) {
	tar = $(tar)
	if (tar.is('.splitTarget')) return

	let p = tar.parent()
	let s = p.find('.source')
	let st = s.text()
	let t = tar
	// t.text('')// 2019-12-16 DDB  分解当前格子时，无法分解时会删除该格子中的内容，让我失去了刚刚输入的宝贵译文。
	let res = splitLongSource(st)
	console.log(res)

	if (res.length > 1) {
		let originalname = ObjectID().toHexString()
		tar.addClass('splitTarget').empty()
		tar.attr({ originalname })

		let worksTable =
			document.querySelector('#works>table') || document.querySelector('#works')
		let tbody, first, tr, no, s, t, n
		tbody = document.createElement('tbody')
		tbody.classList.add('split')
		tbody.setAttribute('dataname', originalname)
		tbody.setAttribute('originalname', originalname)

		res.forEach((e, i) => {
			tr = document.createElement('tr')
			tr.classList.add('split')

			no = document.createElement('td')
			no.classList.add('no')
			no.textContent = i + 1
			tr.appendChild(no)

			s = document.createElement('td')
			s.classList.add('source')
			s.textContent = e
			tr.appendChild(s)

			t = document.createElement('td')
			t.classList.add('target')
			tr.appendChild(t)
			if (
				/^[A-Z0-9-a-z\s\\\/`~!@#\$%\^&\*\(\)_\+\-=\[\]\{\}\|\:'";\,\.\/\?\<\>]+$/.test(
					e
				)
			) {
				t.textContent = s.textContent
			}
			if (/^\\r|\\n$/.test(e)) {
				tr.classList.add('hide2')
			} else if (!first) {
				first = t
			}

			n = document.createElement('td')
			n.classList.add('name')
			n.setAttribute('originalname', originalname)
			tr.appendChild(n)

			e = e.trim() // 清除空白（包括换行）
			if (e === '') {
				tr.classList.add('hide2')
			} else if (e === '\\n') {
				t.textContent = e
				tr.classList.add('hide2')
			} else if (/^[,\?\!，、。！？]+$/.test(e)) {
				let trPrev = tr.previousElementSibling
				if (trPrev && trPrev.nodeName === 'TR') {
					let y = trPrev.querySelector('.source')
					y.textContent = y.textContent + e
					tr.remove()
					return
				}
			}
			tbody.appendChild(tr)
		})
		worksTable.appendChild(tbody)
		worksTable.scrollTo(0, worksTable.scrollHeight)
		console.log(first)
		first.scrollIntoView()
		first.focus()
	} else {
		let rect = tar.offset()
		showTip({
			text: '분해할 수 없습니다',
			x: rect.left,
			y: rect.top,
			css: { transform: 'translate(0,-100%)' },
		})
	}
}
// F8 分隔长文段
function splitLongSource(str) {
	// return longSegmentSplit(str)
	let ss = new StringSplitter(str)
	ss.split(/\<[0-9a-zA-Z ="']+?\>/)
	ss.split(/\<\/[0-9a-zA-Z ]+?\>/)
	ss.split(/\<[0-9a-zA-Z ]+?\/>/)
	ss.split(`{\\r\\n}`)
	ss.split(`{\\n}`)
	ss.split(/\(\\?\\r\\?\\n\)+|(\\?\\r\\?\\n)+|(\\?\\n)+/)
	ss.split(/\(.+\)/u)
	// ss.split(/(?=(?!\d)\.)/)
	ss.split(/.+?(\!\?|\?\!|\?|\!|\.)+(\s*)/)
	//ss.split(/(\s*),(\s*)/)
	ss.split(/。/)
	return ss.s.map((e) => (e instanceof StringSplitterDelimiter ? e.value : e))
}

// 屏幕显示提示，但需要对超出屏幕时显示进行优化。
function showTip(opt) {
	// opt  { name, html, text, animate, delay }
	if (opt === undefined || opt === null) return

	let type = typeof opt
	if (type !== 'object') {
		opt = { text: opt }
	}

	let $ui
	// 如果opt提供了名称，则该提示窗将是唯一的提示，并常驻在页面中。
	let { name } = opt
	if (name) {
		name = name.replace(/\W+/g, '')
		$ui = $(`div[name="tip-${name}"]`)

		if ($ui.length === 1) {
			// 已有一个
		} else if ($ui.length < 1) {
			// 新建一个
			$ui = $('<div></div>').appendTo('body')
			$ui.attr({ name: `tip-${name}` })
		} else if ($ui.length > 1) {
			// 删除多余
			$ui.slice(1).remove()
		}
	} else {
		$ui = $('<div></div>').appendTo('body')
	}

	$ui
		.fadeIn()
		.css({
			position: 'fixed',
			left: opt.x || 0,
			top: opt.y || 0,
			zIndex: 999,
		})
		.css(
			Object.assign(
				{
					margin: 0,
					padding: '1em 3px 3px 3px',
					borderRadius: '1em 1em 0 0',
					background: 'white',
					color: 'black',
					border: '1px solid black',
					borderBottomWidth: '2px',
				},
				opt.css
			)
		)

	if (opt.html) {
		// 删除script标签
		$ui.html($('<div>').html(opt.html).find('script').remove().end())
	} else if (opt.text) {
		$ui.text(opt.text)
	}

	if (opt.animate) {
		if (Array.isArray(opt.animate)) {
			opt.animate.forEach((e) => {
				$ui = $ui.animate(e)
			})
		} else {
			$ui = $ui.animate(opt.animate)
		}
	}

	if (name && opt.delay < 0) {
		function onkeydown(e) {
			if (
				(e.keyCode === 27 &&
					!e.ctrlKey &&
					!e.shiftKey &&
					!e.altKey &&
					!e.metaKey) ||
				(e.keyCode === 13 &&
					!e.ctrlKey &&
					!e.shiftKey &&
					!e.altKey &&
					!e.metaKey) ||
				e.keyCode === 9
			) {
				$(document).off('keydown', '#works .target', onkeydown)
				$ui.fadeOut()
			}
		}
		$(document).on('keydown', '#works .target', onkeydown)

		// function onblur(e) {
		// 	$(document).off('blur', onblur)
		// 	$ui.fadeOut()
		// }
		// $(document).on('blur', '#works .target', onblur)
		// 不需要这么做，只要上面的键盘侦听即可。
		// 回车13时，由于提交数据，所以可以消除了。
		// Esc27时，视为用户希望取消
	} else {
		$ui.delay(opt.delay || 3000).fadeOut(() => $ui.remove())
	}
	return $ui
}

function chars(start, end) {
	function charCode(o) {
		let type = typeof o
		if (type === 'number') return o
		if (type === 'string') return o.charCodeAt(0)
		o = 0
		return o
	}
	start = charCode(start)
	end = charCode(end)

	let code = Math.min(start, end)
	end = Math.max(start, end)

	let res = []
	while (code <= end) {
		res.push({ code, char: String.fromCharCode(code++) })
	}
	return res
}

let searchRE = '^\\/<>()[-]?*+{,}.:=!|$'.split('').map((c) => '\\' + c)

// 【自动填入译文】
let match100workers = {}
let match100fns = []
function match100chain(fns, callback) {
	match100fns = match100fns.concat(fns)
	match100run()
}
async function match100run() {
	let fn
	while ((fn = match100fns.shift())) {
		await fn()
	}
}
function match100(range) {
	// @range     jqueryInstance
	// log('match100 start', match100fns.length)
	let _
	// let trimRegExp = /^\s+|\s+$/
	// _ = array.filter(([source, target])=>{
	// 	return trimRegExp.test(source) || trimRegExp.test(target)
	// })

	// close workers
	for (let objectId in match100workers) {
		let worker = match100workers[objectId]
		worker.terminate()
		delete match100workers[objectId]
	}
	// make unique o
	let o = {}
	let { array } = dict
	array.forEach((row) => {
		let [source, target] = row
		// 去掉左右空白后，再整理出键值对。
		if (source !== String(source).trim()) row[0] = String(source).trim()
		if (target !== String(target).trim()) row[1] = String(target).trim()
		if (source && target) o[source] = target
	})

	// 测试
	let b = Boolean(range && range.length > 0)
	if (!b) {
		range = $('#works tr')
			.not('.hide')
			.not('.hide2')
			.not('.emptyRow')
			.filter((_, e) => !$(e).find('.target').is('.splitTarget'))
	}
	range
		.find('.target')
		.removeClass('done doneAuto doneAutoSpace doneAutoNumber doneAutoSmart')
		.empty()

	match100fns = []
	let fns = range
		.toArray()
		.filter((tr) => $(tr).find('.source').text().trim())
		.map((tr) => {
			return clac.bind(this, tr)
		})
	if (fns.length) match100chain(fns)

	function clac(tr) {
		return new Promise((resolve) => {
			let s,
				t,
				st,
				worker,
				objectId = ObjectID().str
			s = $(tr).find('.source')
			t = $(tr).find('.target')
			// log(b,s,t,tr)
			st = s
				.text()
				.replace(/\{\\r\\n\}/g, '\\n')
				.trim()
			t.addClass('wait')

			// cacheWorker
			worker = cacheWorker(
				'match100',
				function () {
					// ArgText
					!(function (undefined) {
						// 数值正则
						let numberRegExp = /[+-]?\d{1,3}(,?\d{3}|\d+)*(\.\d+)?(e[+-]?\d+)?|\p{Number}+/gu
						// let numberRegExp = /[\+\-]?[\p{Number}\.,eE%]+/gu;

						function makeTextPair(t1, t2, mark = '{') {
							let mt1, mt2, tagText

							mt1 = makeText(t1)
							mt2 = makeText(t2)
							console.warn(mt1)
							console.warn(mt2)

							let indexs = reIndexs(mt1.args, mt2.args)
							let i = 0

							tagText = mt2.tagText.replace(
								/((\{\{)*\{)(\d+)(\})/g,
								function (m, begin, _, number, end) {
									number = indexs[i]
									number =
										number === undefined
											? mt2.args[i] === undefined
												? ''
												: mt2.args[i]
											: `${begin}${number}${end}`
									i++
									return number
								}
							)

							function make(args, reIndex = true) {
								return reIndex
									? makeArgs(this.tagText, args)
									: makeArgs(this.b.tagText, args)
							}
							return {
								a: mt1,
								b: mt2,
								tagText,
								accepted: indexs.accepted,
								make,
							}
						}

						// 得出将a1排列成a2的index序列。例如： [1,11,111]->[111,1,11] 结果为 [1, 2, 0]
						function reIndexs(a1, a2) {
							a2 = Array.from(a2)
							let i, len, index, indexs
							i = 0
							len = a1.length
							if (len) {
								indexs = []
								indexs.accepted = true
							} else {
								indexs.accepted = false
							}
							for (; i < len; i++) {
								index = a2.indexOf(a1[i])
								if (index == -1) {
									indexs.accepted = false
								} else {
									a2[index] = null
									indexs.push(index)
								}
							}
							return indexs
						}

						// 如果字符串中带有mark，那就要加上mark。即{变为{{。
						function encodeReady(text, mark = '{') {
							let markRegExp = new RegExp(
								mark
									.split('')
									.map((e) => '\\' + e)
									.join(''),
								'g'
							)
							return text.replace(markRegExp, '$&$&')
						}

						// 如果字符串中带有mark，那就要减去mark。即{{变为{，但{不会消失。
						function decodeReady(text, mark = '{') {
							let markRegExp = new RegExp(
								'(' +
								mark
									.split('')
									.map((e) => '\\' + e)
									.join('') +
								')\\1',
								'g'
							)
							return text.replace(markRegExp, mark)
						}

						// 单个
						function makeText(text, mark = '{') {
							let i = 0,
								args = [],
								tagText
							tagText = encodeReady(text, mark)
							tagText = tagText.replace(numberRegExp, function (m) {
								args.push(m)
								return `{${i++}}`
							})
							return { text, tagText, args }
						}

						// 将args中的内容应用到文本中的{0},{1}...{n}参数。
						function makeArgs(str, args) {
							// 但愿是字符串
							if (typeof str !== 'string') return ''

							let s, regexp
							regexp = /\{([^\}]+?)\}/g

							// 在这里{为转义符，遇到{{须进行回避
							s = str.split('{{') // 回避{{符号
							s = s.map(function (str) {
								return str.replace(regexp, function (match, name) {
									let v = args[name]
									if (v === undefined || v === null) v = match
									// console.debug(v !== match ? 替换成功：${match}-->${v}: 保留原样：${match});
									return v
								})
							})
							return s.join('{{')
						}

						// 导出以上内容
						let g
						if (typeof window === 'object') {
							g = self
						} else if (typeof global === 'object') {
							g = global
						} else {
							g = this
						}
						g.ArgText = {
							numberRegExp,
							makeArgs,
							makeText,
							makeTextPair,
							encodeReady,
							decodeReady,
							reIndexs,
						}

						// 兼容chrome和nodejs
						if (typeof module === 'object') {
							module.exports = ArgText
						} else {
							this.ArgText = ArgText
						}
					})()
					// Search
					class Search {
						constructor(e) {
							this.input = e
						}
						test(e) {
							var t = Search.getRegExp(e)
							return (this.response = t.test(this.input))
						}
						replace(e, t) {
							var r = (this.regExp = Search.getRegExp(e, 'g'))
							return (this.response = this.input.replace(r, t))
						}
						static getRegExp(e, t, r) {
							if (e) {
								if (r)
									try {
										return (e = new RegExp(e, 'g'))
									} catch (t) {
										console.warn('Invalid argument - new RegExp(' + e + ',"g")')
									}
								return (
									(e = e.split('\\')),
									(e =
										'(?:)' ===
											(e = new RegExp(e.map(Search._getRegExp).join('\\\\'), t))
												.source
											? Search.VIRTUAL_REGEXP
											: e)
								)
							}
						}
						static _getRegExp(e) {
							if ('' === (e = e.replace(Search.REGEXP_SPACES, ''))) return ''
							var t = Search.SPACES
							return (
								t +
								e
									.split('')
									.map(function (e) {
										return e.replace(Search.REGEXP_TOKENS, '\\$&')
									})
									.join(t) +
								t
							)
						}
						static lenSearch(e, t) {
							if (!t) return []
							let r,
								n,
								a = e.length,
								c = 0,
								s = a,
								i = 0,
								E = !1
							for (; s !== c;)
								(r = e.slice(c, s)),
									(E = dict.some(
										(e, t, E) =>
											!!(n = new RegExp(
												'^' + Search._getRegExp(r) + '$',
												'gi'
											)).test(e[0]) && ((i = t), (c = s), (s = a), !0)
									))
										? console.log('[has]', dict[i])
										: s--
						}
					}
					Object.defineProperties(Search, {
						REGEXP_TOKENS: {
							value: /[\/\?\*\+\-\^\$\(\)\<\>\[\]\{\}\.\,\:\&\|]/g,
						},
						REGEXP_SPACES: { value: /\s+/g },
						SPACES: { value: '\\s*' },
						VIRTUAL_REGEXP: {
							value: {
								test: function () {
									return !1
								},
								match: function () {
									return null
								},
							},
						},
					})
						// similar
						; (function (g) {
							if (typeof g.ao === 'undefined') {
								g.ao = {}
							}
							var r = (g.ao.similar = function similar(t, s, u) {
								if (null === t || null === s || void 0 === t || void 0 === s)
									return 0
								var n,
									o,
									e,
									l,
									f = 0,
									i = 0,
									b = 0,
									c = (t += '').length,
									h = (s += '').length
								for (n = 0; n < c; n++)
									for (o = 0; o < h; o++) {
										for (
											e = 0;
											n + e < c &&
											o + e < h &&
											t.charAt(n + e) === s.charAt(o + e);
											e++
										);
										e > b && ((b = e), (f = n), (i = o))
									}
								return (
									(l = b) &&
									(f && i && (l += r(t.substr(0, f), s.substr(0, i))),
										f + b < c &&
										i + b < h &&
										(l += r(
											t.substr(f + b, c - f - b),
											s.substr(i + b, h - i - b)
										))),
									u ? (200 * l) / (c + h) : l
								)
							})
						})(this)
					// Reference
					class Reference {
						constructor(r) {
							r instanceof Array || (r = []), this.from(r)
						}
						from(r) {
							this.array = Reference.unique(r)
						}
						add(r, t) {
							this.array.push([r, t]), this.from(this.array)
						}
						static enlistKey(r) {
							return r.filter(function (r) {
								return r[0] && r.toString().trim().length > 0
							})
						}
						unique(r) {
							return r
						}
						static unique(r) {
							return r
						}
						concat(r) {
							this.from(this.array.concat(r))
						}
						search(r, t = 0, a = 0) {
							var i = (this.result = [])
							return void 0 === r || 'string' != typeof r
								? i
								: (this.array.forEach(function (e, n) {
									e[a]
									var s = similar(r, e[a], !0)
									s >= t && i.push([].concat(e, s, n))
								}),
									i.sort(function (r, t) {
										var a = parseFloat(r[2]),
											i = parseFloat(t[2])
										if (a === i) {
											var e = parseFloat(r[3]),
												n = parseFloat(t[3])
											return e > n ? -1 : e === n ? 0 : 1
										}
										return a > i ? -1 : a === i ? 0 : 1
									}),
									i)
						}
						searchAll(r, t = 0) {
							var a = (this.result = [])
							return void 0 === r || 'string' != typeof r
								? a
								: (this.array.forEach(function (i) {
									var e
									i.some(function (a) {
										return (e = similar(r, a, !0)) >= t
									}) && a.push([e].concat(i))
								}),
									a)
						}
					}
					function similar(r, t, a = !0) {
						return Number(ao.similar(r, t, a).toFixed(2))
					}
					// dmp
					let diff_match_patch = function () {
						this.Diff_Timeout = 1
						this.Diff_EditCost = 4
						this.Match_Threshold = 0.5
						this.Match_Distance = 1e3
						this.Patch_DeleteThreshold = 0.5
						this.Patch_Margin = 4
						this.Match_MaxBits = 32
					},
						DIFF_DELETE = -1,
						DIFF_INSERT = 1,
						DIFF_EQUAL = 0
					diff_match_patch.Diff = function (a, b) {
						this[0] = a
						this[1] = b
					}
					diff_match_patch.Diff.prototype.length = 2
					diff_match_patch.Diff.prototype.toString = function () {
						return this[0] + ',' + this[1]
					}
					diff_match_patch.prototype.diff_main = function (a, b, c, d) {
						'undefined' == typeof d &&
							(d =
								0 >= this.Diff_Timeout
									? Number.MAX_VALUE
									: new Date().getTime() + 1e3 * this.Diff_Timeout)
						if (null == a || null == b) throw Error('Null input. (diff_main)')
						if (a == b)
							return a ? [new diff_match_patch.Diff(DIFF_EQUAL, a)] : []
						'undefined' == typeof c && (c = !0)
						var e = c,
							f = this.diff_commonPrefix(a, b)
						c = a.substring(0, f)
						a = a.substring(f)
						b = b.substring(f)
						f = this.diff_commonSuffix(a, b)
						var g = a.substring(a.length - f)
						a = a.substring(0, a.length - f)
						b = b.substring(0, b.length - f)
						a = this.diff_compute_(a, b, e, d)
						c && a.unshift(new diff_match_patch.Diff(DIFF_EQUAL, c))
						g && a.push(new diff_match_patch.Diff(DIFF_EQUAL, g))
						this.diff_cleanupMerge(a)
						return a
					}
					diff_match_patch.prototype.diff_compute_ = function (a, b, c, d) {
						if (!a) return [new diff_match_patch.Diff(DIFF_INSERT, b)]
						if (!b) return [new diff_match_patch.Diff(DIFF_DELETE, a)]
						var e = a.length > b.length ? a : b,
							f = a.length > b.length ? b : a,
							g = e.indexOf(f)
						return -1 != g
							? ((c = [
								new diff_match_patch.Diff(DIFF_INSERT, e.substring(0, g)),
								new diff_match_patch.Diff(DIFF_EQUAL, f),
								new diff_match_patch.Diff(
									DIFF_INSERT,
									e.substring(g + f.length)
								),
							]),
								a.length > b.length && (c[0][0] = c[2][0] = DIFF_DELETE),
								c)
							: 1 == f.length
								? [
									new diff_match_patch.Diff(DIFF_DELETE, a),
									new diff_match_patch.Diff(DIFF_INSERT, b),
								]
								: (e = this.diff_halfMatch_(a, b))
									? ((b = e[1]),
										(f = e[3]),
										(a = e[4]),
										(e = this.diff_main(e[0], e[2], c, d)),
										(c = this.diff_main(b, f, c, d)),
										e.concat([new diff_match_patch.Diff(DIFF_EQUAL, a)], c))
									: c && 100 < a.length && 100 < b.length
										? this.diff_lineMode_(a, b, d)
										: this.diff_bisect_(a, b, d)
					}
					diff_match_patch.prototype.diff_lineMode_ = function (a, b, c) {
						var d = this.diff_linesToChars_(a, b)
						a = d.chars1
						b = d.chars2
						d = d.lineArray
						a = this.diff_main(a, b, !1, c)
						this.diff_charsToLines_(a, d)
						this.diff_cleanupSemantic(a)
						a.push(new diff_match_patch.Diff(DIFF_EQUAL, ''))
						for (var e = (d = b = 0), f = '', g = ''; b < a.length;) {
							switch (a[b][0]) {
								case DIFF_INSERT:
									e++
									g += a[b][1]
									break
								case DIFF_DELETE:
									d++
									f += a[b][1]
									break
								case DIFF_EQUAL:
									if (1 <= d && 1 <= e) {
										a.splice(b - d - e, d + e)
										b = b - d - e
										d = this.diff_main(f, g, !1, c)
										for (e = d.length - 1; 0 <= e; e--) a.splice(b, 0, d[e])
										b += d.length
									}
									d = e = 0
									g = f = ''
							}
							b++
						}
						a.pop()
						return a
					}
					diff_match_patch.prototype.diff_bisect_ = function (a, b, c) {
						for (
							var d = a.length,
							e = b.length,
							f = Math.ceil((d + e) / 2),
							g = 2 * f,
							h = Array(g),
							l = Array(g),
							k = 0;
							k < g;
							k++
						)
							(h[k] = -1), (l[k] = -1)
						h[f + 1] = 0
						l[f + 1] = 0
						k = d - e
						for (
							var m = 0 != k % 2, p = 0, x = 0, w = 0, q = 0, t = 0;
							t < f && !(new Date().getTime() > c);
							t++
						) {
							for (var v = -t + p; v <= t - x; v += 2) {
								var n = f + v
								var r =
									v == -t || (v != t && h[n - 1] < h[n + 1])
										? h[n + 1]
										: h[n - 1] + 1
								for (
									var y = r - v;
									r < d && y < e && a.charAt(r) == b.charAt(y);

								)
									r++, y++
								h[n] = r
								if (r > d) x += 2
								else if (y > e) p += 2
								else if (
									m &&
									((n = f + k - v), 0 <= n && n < g && -1 != l[n])
								) {
									var u = d - l[n]
									if (r >= u) return this.diff_bisectSplit_(a, b, r, y, c)
								}
							}
							for (v = -t + w; v <= t - q; v += 2) {
								n = f + v
								u =
									v == -t || (v != t && l[n - 1] < l[n + 1])
										? l[n + 1]
										: l[n - 1] + 1
								for (
									r = u - v;
									u < d && r < e && a.charAt(d - u - 1) == b.charAt(e - r - 1);

								)
									u++, r++
								l[n] = u
								if (u > d) q += 2
								else if (r > e) w += 2
								else if (
									!m &&
									((n = f + k - v),
										0 <= n &&
										n < g &&
										-1 != h[n] &&
										((r = h[n]), (y = f + r - n), (u = d - u), r >= u))
								)
									return this.diff_bisectSplit_(a, b, r, y, c)
							}
						}
						return [
							new diff_match_patch.Diff(DIFF_DELETE, a),
							new diff_match_patch.Diff(DIFF_INSERT, b),
						]
					}
					diff_match_patch.prototype.diff_bisectSplit_ = function (
						a,
						b,
						c,
						d,
						e
					) {
						var f = a.substring(0, c),
							g = b.substring(0, d)
						a = a.substring(c)
						b = b.substring(d)
						f = this.diff_main(f, g, !1, e)
						e = this.diff_main(a, b, !1, e)
						return f.concat(e)
					}
					diff_match_patch.prototype.diff_linesToChars_ = function (a, b) {
						function c(a) {
							for (
								var b = '', c = 0, g = -1, h = d.length;
								g < a.length - 1;

							) {
								g = a.indexOf('\n', c)
									; -1 == g && (g = a.length - 1)
								var l = a.substring(c, g + 1)
									; (e.hasOwnProperty ? e.hasOwnProperty(l) : void 0 !== e[l])
										? (b += String.fromCharCode(e[l]))
										: (h == f && ((l = a.substring(c)), (g = a.length)),
											(b += String.fromCharCode(h)),
											(e[l] = h),
											(d[h++] = l))
								c = g + 1
							}
							return b
						}
						var d = [],
							e = {}
						d[0] = ''
						var f = 4e4,
							g = c(a)
						f = 65535
						var h = c(b)
						return { chars1: g, chars2: h, lineArray: d }
					}
					diff_match_patch.prototype.diff_charsToLines_ = function (a, b) {
						for (var c = 0; c < a.length; c++) {
							for (var d = a[c][1], e = [], f = 0; f < d.length; f++)
								e[f] = b[d.charCodeAt(f)]
							a[c][1] = e.join('')
						}
					}
					diff_match_patch.prototype.diff_commonPrefix = function (a, b) {
						if (!a || !b || a.charAt(0) != b.charAt(0)) return 0
						for (
							var c = 0, d = Math.min(a.length, b.length), e = d, f = 0;
							c < e;

						)
							a.substring(f, e) == b.substring(f, e) ? (f = c = e) : (d = e),
								(e = Math.floor((d - c) / 2 + c))
						return e
					}
					diff_match_patch.prototype.diff_commonSuffix = function (a, b) {
						if (!a || !b || a.charAt(a.length - 1) != b.charAt(b.length - 1))
							return 0
						for (
							var c = 0, d = Math.min(a.length, b.length), e = d, f = 0;
							c < e;

						)
							a.substring(a.length - e, a.length - f) ==
								b.substring(b.length - e, b.length - f)
								? (f = c = e)
								: (d = e),
								(e = Math.floor((d - c) / 2 + c))
						return e
					}
					diff_match_patch.prototype.diff_commonOverlap_ = function (a, b) {
						var c = a.length,
							d = b.length
						if (0 == c || 0 == d) return 0
						c > d ? (a = a.substring(c - d)) : c < d && (b = b.substring(0, c))
						c = Math.min(c, d)
						if (a == b) return c
						d = 0
						for (var e = 1; ;) {
							var f = a.substring(c - e)
							f = b.indexOf(f)
							if (-1 == f) return d
							e += f
							if (0 == f || a.substring(c - e) == b.substring(0, e))
								(d = e), e++
						}
					}
					diff_match_patch.prototype.diff_halfMatch_ = function (a, b) {
						function c(a, b, c) {
							for (
								var d = a.substring(c, c + Math.floor(a.length / 4)),
								e = -1,
								g = '',
								h,
								k,
								l,
								m;
								-1 != (e = b.indexOf(d, e + 1));

							) {
								var p = f.diff_commonPrefix(a.substring(c), b.substring(e)),
									u = f.diff_commonSuffix(a.substring(0, c), b.substring(0, e))
								g.length < u + p &&
									((g = b.substring(e - u, e) + b.substring(e, e + p)),
										(h = a.substring(0, c - u)),
										(k = a.substring(c + p)),
										(l = b.substring(0, e - u)),
										(m = b.substring(e + p)))
							}
							return 2 * g.length >= a.length ? [h, k, l, m, g] : null
						}
						if (0 >= this.Diff_Timeout) return null
						var d = a.length > b.length ? a : b,
							e = a.length > b.length ? b : a
						if (4 > d.length || 2 * e.length < d.length) return null
						var f = this,
							g = c(d, e, Math.ceil(d.length / 4))
						d = c(d, e, Math.ceil(d.length / 2))
						if (g || d)
							g = d ? (g ? (g[4].length > d[4].length ? g : d) : d) : g
						else return null
						if (a.length > b.length) {
							d = g[0]
							e = g[1]
							var h = g[2]
							var l = g[3]
						} else (h = g[0]), (l = g[1]), (d = g[2]), (e = g[3])
						return [d, e, h, l, g[4]]
					}
					diff_match_patch.prototype.diff_cleanupSemantic = function (a) {
						for (
							var b = !1,
							c = [],
							d = 0,
							e = null,
							f = 0,
							g = 0,
							h = 0,
							l = 0,
							k = 0;
							f < a.length;

						)
							a[f][0] == DIFF_EQUAL
								? ((c[d++] = f), (g = l), (h = k), (k = l = 0), (e = a[f][1]))
								: (a[f][0] == DIFF_INSERT
									? (l += a[f][1].length)
									: (k += a[f][1].length),
									e &&
									e.length <= Math.max(g, h) &&
									e.length <= Math.max(l, k) &&
									(a.splice(
										c[d - 1],
										0,
										new diff_match_patch.Diff(DIFF_DELETE, e)
									),
										(a[c[d - 1] + 1][0] = DIFF_INSERT),
										d--,
										d--,
										(f = 0 < d ? c[d - 1] : -1),
										(k = l = h = g = 0),
										(e = null),
										(b = !0))),
								f++
						b && this.diff_cleanupMerge(a)
						this.diff_cleanupSemanticLossless(a)
						for (f = 1; f < a.length;) {
							if (a[f - 1][0] == DIFF_DELETE && a[f][0] == DIFF_INSERT) {
								b = a[f - 1][1]
								c = a[f][1]
								d = this.diff_commonOverlap_(b, c)
								e = this.diff_commonOverlap_(c, b)
								if (d >= e) {
									if (d >= b.length / 2 || d >= c.length / 2)
										a.splice(
											f,
											0,
											new diff_match_patch.Diff(DIFF_EQUAL, c.substring(0, d))
										),
											(a[f - 1][1] = b.substring(0, b.length - d)),
											(a[f + 1][1] = c.substring(d)),
											f++
								} else if (e >= b.length / 2 || e >= c.length / 2)
									a.splice(
										f,
										0,
										new diff_match_patch.Diff(DIFF_EQUAL, b.substring(0, e))
									),
										(a[f - 1][0] = DIFF_INSERT),
										(a[f - 1][1] = c.substring(0, c.length - e)),
										(a[f + 1][0] = DIFF_DELETE),
										(a[f + 1][1] = b.substring(e)),
										f++
								f++
							}
							f++
						}
					}
					diff_match_patch.prototype.diff_cleanupSemanticLossless = function (
						a
					) {
						function b(a, b) {
							if (!a || !b) return 6
							var c = a.charAt(a.length - 1),
								d = b.charAt(0),
								e = c.match(diff_match_patch.nonAlphaNumericRegex_),
								f = d.match(diff_match_patch.nonAlphaNumericRegex_),
								g = e && c.match(diff_match_patch.whitespaceRegex_),
								h = f && d.match(diff_match_patch.whitespaceRegex_)
							c = g && c.match(diff_match_patch.linebreakRegex_)
							d = h && d.match(diff_match_patch.linebreakRegex_)
							var k = c && a.match(diff_match_patch.blanklineEndRegex_),
								l = d && b.match(diff_match_patch.blanklineStartRegex_)
							return k || l
								? 5
								: c || d
									? 4
									: e && !g && h
										? 3
										: g || h
											? 2
											: e || f
												? 1
												: 0
						}
						for (var c = 1; c < a.length - 1;) {
							if (a[c - 1][0] == DIFF_EQUAL && a[c + 1][0] == DIFF_EQUAL) {
								var d = a[c - 1][1],
									e = a[c][1],
									f = a[c + 1][1],
									g = this.diff_commonSuffix(d, e)
								if (g) {
									var h = e.substring(e.length - g)
									d = d.substring(0, d.length - g)
									e = h + e.substring(0, e.length - g)
									f = h + f
								}
								g = d
								h = e
								for (
									var l = f, k = b(d, e) + b(e, f);
									e.charAt(0) === f.charAt(0);

								) {
									d += e.charAt(0)
									e = e.substring(1) + f.charAt(0)
									f = f.substring(1)
									var m = b(d, e) + b(e, f)
									m >= k && ((k = m), (g = d), (h = e), (l = f))
								}
								a[c - 1][1] != g &&
									(g ? (a[c - 1][1] = g) : (a.splice(c - 1, 1), c--),
										(a[c][1] = h),
										l ? (a[c + 1][1] = l) : (a.splice(c + 1, 1), c--))
							}
							c++
						}
					}
					diff_match_patch.nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/
					diff_match_patch.whitespaceRegex_ = /\s/
					diff_match_patch.linebreakRegex_ = /[\r\n]/
					diff_match_patch.blanklineEndRegex_ = /\n\r?\n$/
					diff_match_patch.blanklineStartRegex_ = /^\r?\n\r?\n/
					diff_match_patch.prototype.diff_cleanupEfficiency = function (a) {
						for (
							var b = !1,
							c = [],
							d = 0,
							e = null,
							f = 0,
							g = !1,
							h = !1,
							l = !1,
							k = !1;
							f < a.length;

						)
							a[f][0] == DIFF_EQUAL
								? (a[f][1].length < this.Diff_EditCost && (l || k)
									? ((c[d++] = f), (g = l), (h = k), (e = a[f][1]))
									: ((d = 0), (e = null)),
									(l = k = !1))
								: (a[f][0] == DIFF_DELETE ? (k = !0) : (l = !0),
									e &&
									((g && h && l && k) ||
										(e.length < this.Diff_EditCost / 2 &&
											3 == g + h + l + k)) &&
									(a.splice(
										c[d - 1],
										0,
										new diff_match_patch.Diff(DIFF_DELETE, e)
									),
										(a[c[d - 1] + 1][0] = DIFF_INSERT),
										d--,
										(e = null),
										g && h
											? ((l = k = !0), (d = 0))
											: (d--, (f = 0 < d ? c[d - 1] : -1), (l = k = !1)),
										(b = !0))),
								f++
						b && this.diff_cleanupMerge(a)
					}
					diff_match_patch.prototype.diff_cleanupMerge = function (a) {
						a.push(new diff_match_patch.Diff(DIFF_EQUAL, ''))
						for (var b = 0, c = 0, d = 0, e = '', f = '', g; b < a.length;)
							switch (a[b][0]) {
								case DIFF_INSERT:
									d++
									f += a[b][1]
									b++
									break
								case DIFF_DELETE:
									c++
									e += a[b][1]
									b++
									break
								case DIFF_EQUAL:
									1 < c + d
										? (0 !== c &&
											0 !== d &&
											((g = this.diff_commonPrefix(f, e)),
												0 !== g &&
												(0 < b - c - d && a[b - c - d - 1][0] == DIFF_EQUAL
													? (a[b - c - d - 1][1] += f.substring(0, g))
													: (a.splice(
														0,
														0,
														new diff_match_patch.Diff(
															DIFF_EQUAL,
															f.substring(0, g)
														)
													),
														b++),
													(f = f.substring(g)),
													(e = e.substring(g))),
												(g = this.diff_commonSuffix(f, e)),
												0 !== g &&
												((a[b][1] = f.substring(f.length - g) + a[b][1]),
													(f = f.substring(0, f.length - g)),
													(e = e.substring(0, e.length - g)))),
											(b -= c + d),
											a.splice(b, c + d),
											e.length &&
											(a.splice(
												b,
												0,
												new diff_match_patch.Diff(DIFF_DELETE, e)
											),
												b++),
											f.length &&
											(a.splice(
												b,
												0,
												new diff_match_patch.Diff(DIFF_INSERT, f)
											),
												b++),
											b++)
										: 0 !== b && a[b - 1][0] == DIFF_EQUAL
											? ((a[b - 1][1] += a[b][1]), a.splice(b, 1))
											: b++,
										(c = d = 0),
										(f = e = '')
							}
						'' === a[a.length - 1][1] && a.pop()
						c = !1
						for (b = 1; b < a.length - 1;)
							a[b - 1][0] == DIFF_EQUAL &&
								a[b + 1][0] == DIFF_EQUAL &&
								(a[b][1].substring(a[b][1].length - a[b - 1][1].length) ==
									a[b - 1][1]
									? ((a[b][1] =
										a[b - 1][1] +
										a[b][1].substring(
											0,
											a[b][1].length - a[b - 1][1].length
										)),
										(a[b + 1][1] = a[b - 1][1] + a[b + 1][1]),
										a.splice(b - 1, 1),
										(c = !0))
									: a[b][1].substring(0, a[b + 1][1].length) == a[b + 1][1] &&
									((a[b - 1][1] += a[b + 1][1]),
										(a[b][1] =
											a[b][1].substring(a[b + 1][1].length) + a[b + 1][1]),
										a.splice(b + 1, 1),
										(c = !0))),
								b++
						c && this.diff_cleanupMerge(a)
					}
					diff_match_patch.prototype.diff_xIndex = function (a, b) {
						var c = 0,
							d = 0,
							e = 0,
							f = 0,
							g
						for (g = 0; g < a.length; g++) {
							a[g][0] !== DIFF_INSERT && (c += a[g][1].length)
							a[g][0] !== DIFF_DELETE && (d += a[g][1].length)
							if (c > b) break
							e = c
							f = d
						}
						return a.length != g && a[g][0] === DIFF_DELETE ? f : f + (b - e)
					}
					diff_match_patch.prototype.diff_prettyHtml = function (a) {
						for (
							var b = [], c = /&/g, d = /</g, e = />/g, f = /\n/g, g = 0;
							g < a.length;
							g++
						) {
							var h = a[g][0],
								l = a[g][1]
									.replace(c, '&amp;')
									.replace(d, '&lt;')
									.replace(e, '&gt;')
									.replace(f, '&#8629;<br>')
							switch (h) {
								case DIFF_INSERT:
									b[g] = '<ins>' + l + '</ins>'
									break
								case DIFF_DELETE:
									b[g] = '<del>' + l + '</del>'
									break
								case DIFF_EQUAL:
									b[g] = '<span>' + l + '</span>'
							}
						}
						return b.join('')
					}
					diff_match_patch.prototype.diff_text1 = function (a) {
						for (var b = [], c = 0; c < a.length; c++)
							a[c][0] !== DIFF_INSERT && (b[c] = a[c][1])
						return b.join('')
					}
					diff_match_patch.prototype.diff_text2 = function (a) {
						for (var b = [], c = 0; c < a.length; c++)
							a[c][0] !== DIFF_DELETE && (b[c] = a[c][1])
						return b.join('')
					}
					diff_match_patch.prototype.diff_levenshtein = function (a) {
						for (var b = 0, c = 0, d = 0, e = 0; e < a.length; e++) {
							var f = a[e][1]
							switch (a[e][0]) {
								case DIFF_INSERT:
									c += f.length
									break
								case DIFF_DELETE:
									d += f.length
									break
								case DIFF_EQUAL:
									; (b += Math.max(c, d)), (d = c = 0)
							}
						}
						return (b += Math.max(c, d))
					}
					diff_match_patch.prototype.diff_toDelta = function (a) {
						for (var b = [], c = 0; c < a.length; c++)
							switch (a[c][0]) {
								case DIFF_INSERT:
									b[c] = '+' + encodeURI(a[c][1])
									break
								case DIFF_DELETE:
									b[c] = '-' + a[c][1].length
									break
								case DIFF_EQUAL:
									b[c] = '=' + a[c][1].length
							}
						return b.join('\t').replace(/%20/g, ' ')
					}
					diff_match_patch.prototype.diff_fromDelta = function (a, b) {
						for (
							var c = [], d = 0, e = 0, f = b.split(/\t/g), g = 0;
							g < f.length;
							g++
						) {
							var h = f[g].substring(1)
							switch (f[g].charAt(0)) {
								case '+':
									try {
										c[d++] = new diff_match_patch.Diff(
											DIFF_INSERT,
											decodeURI(h)
										)
									} catch (k) {
										throw Error('Illegal escape in diff_fromDelta: ' + h)
									}
									break
								case '-':
								case '=':
									var l = parseInt(h, 10)
									if (isNaN(l) || 0 > l)
										throw Error('Invalid number in diff_fromDelta: ' + h)
									h = a.substring(e, (e += l))
									'=' == f[g].charAt(0)
										? (c[d++] = new diff_match_patch.Diff(DIFF_EQUAL, h))
										: (c[d++] = new diff_match_patch.Diff(DIFF_DELETE, h))
									break
								default:
									if (f[g])
										throw Error(
											'Invalid diff operation in diff_fromDelta: ' + f[g]
										)
							}
						}
						if (e != a.length)
							throw Error(
								'Delta length (' +
								e +
								') does not equal source text length (' +
								a.length +
								').'
							)
						return c
					}
					diff_match_patch.prototype.match_main = function (a, b, c) {
						if (null == a || null == b || null == c)
							throw Error('Null input. (match_main)')
						c = Math.max(0, Math.min(c, a.length))
						return a == b
							? 0
							: a.length
								? a.substring(c, c + b.length) == b
									? c
									: this.match_bitap_(a, b, c)
								: -1
					}
					diff_match_patch.prototype.match_bitap_ = function (a, b, c) {
						function d(a, d) {
							var e = a / b.length,
								g = Math.abs(c - d)
							return f.Match_Distance ? e + g / f.Match_Distance : g ? 1 : e
						}
						if (b.length > this.Match_MaxBits)
							throw Error('Pattern too long for this browser.')
						var e = this.match_alphabet_(b),
							f = this,
							g = this.Match_Threshold,
							h = a.indexOf(b, c)
							; -1 != h &&
								((g = Math.min(d(0, h), g)),
									(h = a.lastIndexOf(b, c + b.length)),
									-1 != h && (g = Math.min(d(0, h), g)))
						var l = 1 << (b.length - 1)
						h = -1
						for (
							var k, m, p = b.length + a.length, x, w = 0;
							w < b.length;
							w++
						) {
							k = 0
							for (m = p; k < m;)
								d(w, c + m) <= g ? (k = m) : (p = m),
									(m = Math.floor((p - k) / 2 + k))
							p = m
							k = Math.max(1, c - m + 1)
							var q = Math.min(c + m, a.length) + b.length
							m = Array(q + 2)
							for (m[q + 1] = (1 << w) - 1; q >= k; q--) {
								var t = e[a.charAt(q - 1)]
								m[q] =
									0 === w
										? ((m[q + 1] << 1) | 1) & t
										: (((m[q + 1] << 1) | 1) & t) |
										((x[q + 1] | x[q]) << 1) |
										1 |
										x[q + 1]
								if (m[q] & l && ((t = d(w, q - 1)), t <= g))
									if (((g = t), (h = q - 1), h > c)) k = Math.max(1, 2 * c - h)
									else break
							}
							if (d(w + 1, c) > g) break
							x = m
						}
						return h
					}
					diff_match_patch.prototype.match_alphabet_ = function (a) {
						for (var b = {}, c = 0; c < a.length; c++) b[a.charAt(c)] = 0
						for (c = 0; c < a.length; c++)
							b[a.charAt(c)] |= 1 << (a.length - c - 1)
						return b
					}
					diff_match_patch.prototype.patch_addContext_ = function (a, b) {
						if (0 != b.length) {
							if (null === a.start2) throw Error('patch not initialized')
							for (
								var c = b.substring(a.start2, a.start2 + a.length1), d = 0;
								b.indexOf(c) != b.lastIndexOf(c) &&
								c.length <
								this.Match_MaxBits - this.Patch_Margin - this.Patch_Margin;

							)
								(d += this.Patch_Margin),
									(c = b.substring(a.start2 - d, a.start2 + a.length1 + d))
							d += this.Patch_Margin
								; (c = b.substring(a.start2 - d, a.start2)) &&
									a.diffs.unshift(new diff_match_patch.Diff(DIFF_EQUAL, c))
								; (d = b.substring(
									a.start2 + a.length1,
									a.start2 + a.length1 + d
								)) && a.diffs.push(new diff_match_patch.Diff(DIFF_EQUAL, d))
							a.start1 -= c.length
							a.start2 -= c.length
							a.length1 += c.length + d.length
							a.length2 += c.length + d.length
						}
					}
					diff_match_patch.prototype.patch_make = function (a, b, c) {
						if (
							'string' == typeof a &&
							'string' == typeof b &&
							'undefined' == typeof c
						) {
							var d = a
							b = this.diff_main(d, b, !0)
							2 < b.length &&
								(this.diff_cleanupSemantic(b), this.diff_cleanupEfficiency(b))
						} else if (
							a &&
							'object' == typeof a &&
							'undefined' == typeof b &&
							'undefined' == typeof c
						)
							(b = a), (d = this.diff_text1(b))
						else if (
							'string' == typeof a &&
							b &&
							'object' == typeof b &&
							'undefined' == typeof c
						)
							d = a
						else if (
							'string' == typeof a &&
							'string' == typeof b &&
							c &&
							'object' == typeof c
						)
							(d = a), (b = c)
						else throw Error('Unknown call format to patch_make.')
						if (0 === b.length) return []
						c = []
						a = new diff_match_patch.patch_obj()
						for (var e = 0, f = 0, g = 0, h = d, l = 0; l < b.length; l++) {
							var k = b[l][0],
								m = b[l][1]
							e || k === DIFF_EQUAL || ((a.start1 = f), (a.start2 = g))
							switch (k) {
								case DIFF_INSERT:
									a.diffs[e++] = b[l]
									a.length2 += m.length
									d = d.substring(0, g) + m + d.substring(g)
									break
								case DIFF_DELETE:
									a.length1 += m.length
									a.diffs[e++] = b[l]
									d = d.substring(0, g) + d.substring(g + m.length)
									break
								case DIFF_EQUAL:
									m.length <= 2 * this.Patch_Margin && e && b.length != l + 1
										? ((a.diffs[e++] = b[l]),
											(a.length1 += m.length),
											(a.length2 += m.length))
										: m.length >= 2 * this.Patch_Margin &&
										e &&
										(this.patch_addContext_(a, h),
											c.push(a),
											(a = new diff_match_patch.patch_obj()),
											(e = 0),
											(h = d),
											(f = g))
							}
							k !== DIFF_INSERT && (f += m.length)
							k !== DIFF_DELETE && (g += m.length)
						}
						e && (this.patch_addContext_(a, h), c.push(a))
						return c
					}
					diff_match_patch.prototype.patch_deepCopy = function (a) {
						for (var b = [], c = 0; c < a.length; c++) {
							var d = a[c],
								e = new diff_match_patch.patch_obj()
							e.diffs = []
							for (var f = 0; f < d.diffs.length; f++)
								e.diffs[f] = new diff_match_patch.Diff(
									d.diffs[f][0],
									d.diffs[f][1]
								)
							e.start1 = d.start1
							e.start2 = d.start2
							e.length1 = d.length1
							e.length2 = d.length2
							b[c] = e
						}
						return b
					}
					diff_match_patch.prototype.patch_apply = function (a, b) {
						if (0 == a.length) return [b, []]
						a = this.patch_deepCopy(a)
						var c = this.patch_addPadding(a)
						b = c + b + c
						this.patch_splitMax(a)
						for (var d = 0, e = [], f = 0; f < a.length; f++) {
							var g = a[f].start2 + d,
								h = this.diff_text1(a[f].diffs),
								l = -1
							if (h.length > this.Match_MaxBits) {
								var k = this.match_main(
									b,
									h.substring(0, this.Match_MaxBits),
									g
								)
									; -1 != k &&
										((l = this.match_main(
											b,
											h.substring(h.length - this.Match_MaxBits),
											g + h.length - this.Match_MaxBits
										)),
											-1 == l || k >= l) &&
										(k = -1)
							} else k = this.match_main(b, h, g)
							if (-1 == k) (e[f] = !1), (d -= a[f].length2 - a[f].length1)
							else if (
								((e[f] = !0),
									(d = k - g),
									(g =
										-1 == l
											? b.substring(k, k + h.length)
											: b.substring(k, l + this.Match_MaxBits)),
									h == g)
							)
								b =
									b.substring(0, k) +
									this.diff_text2(a[f].diffs) +
									b.substring(k + h.length)
							else if (
								((g = this.diff_main(h, g, !1)),
									h.length > this.Match_MaxBits &&
									this.diff_levenshtein(g) / h.length >
									this.Patch_DeleteThreshold)
							)
								e[f] = !1
							else {
								this.diff_cleanupSemanticLossless(g)
								h = 0
								var m
								for (l = 0; l < a[f].diffs.length; l++) {
									var p = a[f].diffs[l]
									p[0] !== DIFF_EQUAL && (m = this.diff_xIndex(g, h))
									p[0] === DIFF_INSERT
										? (b = b.substring(0, k + m) + p[1] + b.substring(k + m))
										: p[0] === DIFF_DELETE &&
										(b =
											b.substring(0, k + m) +
											b.substring(k + this.diff_xIndex(g, h + p[1].length)))
									p[0] !== DIFF_DELETE && (h += p[1].length)
								}
							}
						}
						b = b.substring(c.length, b.length - c.length)
						return [b, e]
					}
					diff_match_patch.prototype.patch_addPadding = function (a) {
						for (var b = this.Patch_Margin, c = '', d = 1; d <= b; d++)
							c += String.fromCharCode(d)
						for (d = 0; d < a.length; d++)
							(a[d].start1 += b), (a[d].start2 += b)
						d = a[0]
						var e = d.diffs
						if (0 == e.length || e[0][0] != DIFF_EQUAL)
							e.unshift(new diff_match_patch.Diff(DIFF_EQUAL, c)),
								(d.start1 -= b),
								(d.start2 -= b),
								(d.length1 += b),
								(d.length2 += b)
						else if (b > e[0][1].length) {
							var f = b - e[0][1].length
							e[0][1] = c.substring(e[0][1].length) + e[0][1]
							d.start1 -= f
							d.start2 -= f
							d.length1 += f
							d.length2 += f
						}
						d = a[a.length - 1]
						e = d.diffs
						0 == e.length || e[e.length - 1][0] != DIFF_EQUAL
							? (e.push(new diff_match_patch.Diff(DIFF_EQUAL, c)),
								(d.length1 += b),
								(d.length2 += b))
							: b > e[e.length - 1][1].length &&
							((f = b - e[e.length - 1][1].length),
								(e[e.length - 1][1] += c.substring(0, f)),
								(d.length1 += f),
								(d.length2 += f))
						return c
					}
					diff_match_patch.prototype.patch_splitMax = function (a) {
						for (var b = this.Match_MaxBits, c = 0; c < a.length; c++)
							if (!(a[c].length1 <= b)) {
								var d = a[c]
								a.splice(c--, 1)
								for (
									var e = d.start1, f = d.start2, g = '';
									0 !== d.diffs.length;

								) {
									var h = new diff_match_patch.patch_obj(),
										l = !0
									h.start1 = e - g.length
									h.start2 = f - g.length
									'' !== g &&
										((h.length1 = h.length2 = g.length),
											h.diffs.push(new diff_match_patch.Diff(DIFF_EQUAL, g)))
									for (
										;
										0 !== d.diffs.length && h.length1 < b - this.Patch_Margin;

									) {
										g = d.diffs[0][0]
										var k = d.diffs[0][1]
										g === DIFF_INSERT
											? ((h.length2 += k.length),
												(f += k.length),
												h.diffs.push(d.diffs.shift()),
												(l = !1))
											: g === DIFF_DELETE &&
												1 == h.diffs.length &&
												h.diffs[0][0] == DIFF_EQUAL &&
												k.length > 2 * b
												? ((h.length1 += k.length),
													(e += k.length),
													(l = !1),
													h.diffs.push(new diff_match_patch.Diff(g, k)),
													d.diffs.shift())
												: ((k = k.substring(
													0,
													b - h.length1 - this.Patch_Margin
												)),
													(h.length1 += k.length),
													(e += k.length),
													g === DIFF_EQUAL
														? ((h.length2 += k.length), (f += k.length))
														: (l = !1),
													h.diffs.push(new diff_match_patch.Diff(g, k)),
													k == d.diffs[0][1]
														? d.diffs.shift()
														: (d.diffs[0][1] = d.diffs[0][1].substring(k.length)))
									}
									g = this.diff_text2(h.diffs)
									g = g.substring(g.length - this.Patch_Margin)
									k = this.diff_text1(d.diffs).substring(0, this.Patch_Margin)
									'' !== k &&
										((h.length1 += k.length),
											(h.length2 += k.length),
											0 !== h.diffs.length &&
												h.diffs[h.diffs.length - 1][0] === DIFF_EQUAL
												? (h.diffs[h.diffs.length - 1][1] += k)
												: h.diffs.push(new diff_match_patch.Diff(DIFF_EQUAL, k)))
									l || a.splice(++c, 0, h)
								}
							}
					}
					diff_match_patch.prototype.patch_toText = function (a) {
						for (var b = [], c = 0; c < a.length; c++) b[c] = a[c]
						return b.join('')
					}
					diff_match_patch.prototype.patch_fromText = function (a) {
						var b = []
						if (!a) return b
						a = a.split('\n')
						for (
							var c = 0, d = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
							c < a.length;

						) {
							var e = a[c].match(d)
							if (!e) throw Error('Invalid patch string: ' + a[c])
							var f = new diff_match_patch.patch_obj()
							b.push(f)
							f.start1 = parseInt(e[1], 10)
							'' === e[2]
								? (f.start1--, (f.length1 = 1))
								: '0' == e[2]
									? (f.length1 = 0)
									: (f.start1--, (f.length1 = parseInt(e[2], 10)))
							f.start2 = parseInt(e[3], 10)
							'' === e[4]
								? (f.start2--, (f.length2 = 1))
								: '0' == e[4]
									? (f.length2 = 0)
									: (f.start2--, (f.length2 = parseInt(e[4], 10)))
							for (c++; c < a.length;) {
								e = a[c].charAt(0)
								try {
									var g = decodeURI(a[c].substring(1))
								} catch (h) {
									throw Error('Illegal escape in patch_fromText: ' + g)
								}
								if ('-' == e)
									f.diffs.push(new diff_match_patch.Diff(DIFF_DELETE, g))
								else if ('+' == e)
									f.diffs.push(new diff_match_patch.Diff(DIFF_INSERT, g))
								else if (' ' == e)
									f.diffs.push(new diff_match_patch.Diff(DIFF_EQUAL, g))
								else if ('@' == e) break
								else if ('' !== e)
									throw Error('Invalid patch mode "' + e + '" in: ' + g)
								c++
							}
						}
						return b
					}
					diff_match_patch.patch_obj = function () {
						this.diffs = []
						this.start2 = this.start1 = null
						this.length2 = this.length1 = 0
					}
					diff_match_patch.patch_obj.prototype.toString = function () {
						for (
							var a = [
								'@@ -' +
								(0 === this.length1
									? this.start1 + ',0'
									: 1 == this.length1
										? this.start1 + 1
										: this.start1 + 1 + ',' + this.length1) +
								' +' +
								(0 === this.length2
									? this.start2 + ',0'
									: 1 == this.length2
										? this.start2 + 1
										: this.start2 + 1 + ',' + this.length2) +
								' @@\n',
							],
							b,
							c = 0;
							c < this.diffs.length;
							c++
						) {
							switch (this.diffs[c][0]) {
								case DIFF_INSERT:
									b = '+'
									break
								case DIFF_DELETE:
									b = '-'
									break
								case DIFF_EQUAL:
									b = ' '
							}
							a[c + 1] = b + encodeURI(this.diffs[c][1]) + '\n'
						}
						return a.join('').replace(/%20/g, ' ')
					}
					this.diff_match_patch = diff_match_patch
					this.DIFF_DELETE = DIFF_DELETE
					this.DIFF_INSERT = DIFF_INSERT
					this.DIFF_EQUAL = DIFF_EQUAL

					// kkv
					function kkv(e, t, arr) {
						let dict = new Reference(arr)
						let i = new diff_match_patch()
							.diff_main(t.source || t[0], e)
							.filter((e) => 0 !== e[0])
						if (2 === i.length && -1 === i[0][0] && 1 === i[1][0]) {
							let e = dict.search(i[0][1], 100)[0]
							if (e) {
								let f = dict.search(i[1][1], 100)[0]
								if (f) {
									let i = t.target || t[1]
									if (i) return i.replace(e[1], f[1])
								}
							}
						}
						return !1
					}

					const { log } = console
					onmessage = function ({ data: { array, st, o } }) {
						let result = run(new Reference(array), st, o)
						// 直接找到一致内容。
						if (result) postMessage(result)
						close()
					}

					// smartMath
					function smartMatch(source, sourceTargetArray, dict) {
						var ret = ''
						var o = strDiff(source, sourceTargetArray[0])
						var d1 = o.diff1,
							d2 = o.diff2,
							len1 = d1.length,
							len2 = d2.length,
							d1Value,
							d2Value
						var regexp = /^[\x01-\xff]+$/

						let dmp = new diff_match_patch()
						// let diff = dmp.diff_main(sourceTargetArray[0], source)
						// dmp.diff_cleanupSemantic(diff)
						// let dmpHTML = dmp.diff_prettyHtml(diff)
						let dmpPatch = dmp.patch_make(sourceTargetArray[0], source)
						if (dmpPatch.length === 1) {
							let e = dmpPatch[0]
							let a = e.diffs
							let b = a.every((row) => row[0] !== '-1')
							if (b) {
								let r = a.map((row) => {
									if (row[0] === 0) {
										let m = dict.search(row[1], 100)
										if (m && m.length) {
											return m[0][1]
										} else {
											return ''
										}
										log(m)
									} else if (row[0] === 1) {
										return row[1]
									}
								})
								log(r)
								return r.join(' ')
							}
						}

						if (len1 === len2) {
							// 不同点个数一样
							var startResult = []
							startResult.push('⁉ Replace')
							ret = sourceTargetArray[1]
							for (var i = 0; i < len1; i++) {
								d1Value = d2Value = ''
								if (regexp.test(d1[i])) {
									ret = ret.replace(d2[i], d1[i])
									startResult.push(d2[i] + ' -> ' + d1[i])
								} else {
									dict.array.some(function (e) {
										if (
											e &&
											typeof e[0] === 'string' &&
											e[0] &&
											typeof e[1] === 'string' &&
											e[1]
										) {
											if (e[0].trim() === d1[i].trim()) d1Value = e[1].trim()
											if (e[0].trim() === d2[i].trim()) d2Value = e[1].trim()
											if (d1Value && d2Value) return true
										}
									})
									if (d2Value) {
										ret = ret.replace(d2Value, d1Value || d1[i])
										if (d1Value) {
											startResult.push(d2Value + ' -> ' + d1Value)
										} else {
											startResult.push(d2Value + ' *> ' + d1[i])
										}
									} else {
										if (d1Value) {
											startResult.push(d2[i] + ' *> ' + d1Value)
										} else {
											startResult.push(d2[i] + ' *> ' + d1[i])
										}
									}
								}
							}
							startResult.push('[Use] ' + sourceTargetArray[1])
						} else if (len1 == 0) {
							// len2多，所以要删除多余的部分
							var startResult = []
							startResult.push('⁉ Remove')
							ret = sourceTargetArray[1]
							for (var i = 0; i < len2; i++) {
								d2Value = ''
								if (regexp.test(d2[i])) {
									ret = ret.replace(d2[i], '')
								} else {
									dict.array.some(function (e) {
										if (
											e &&
											typeof e[0] === 'string' &&
											e[0] &&
											typeof e[1] === 'string' &&
											e[1]
										) {
											if (e[0].trim() === d2[i].trim()) {
												d2Value = e[1]
												return true
											}
										}
									})
									if (d2Value) {
										ret = ret.replace(d2Value, '')
										startResult.push('[x] ' + d2Value)
									} else {
										startResult.push('[*] ' + d2[i])
									}
								}
							}
							startResult.push('[Use] ' + sourceTargetArray[1])
						} else if (len2 == 0) {
							// len1多，所以要找到内容，添加进去
							var startResult = []
							ret = sourceTargetArray[1]
							startResult.push('‼ Add')
							for (var i = 0; i < len1; i++) {
								d1Value = ''
								if (regexp.test(d1[i])) {
									startResult.push('[*]' + d1[i])
								} else {
									dict.array.some(function (e) {
										if (
											e &&
											typeof e[0] === 'string' &&
											e[0] &&
											typeof e[1] === 'string' &&
											e[1]
										) {
											if (e[0].trim() === d1[i].trim()) {
												d1Value = e[1]
												return true
											}
										}
									})
									if (d1Value) {
										startResult.push('[*] ' + d1Value)
									} else {
										startResult.push('[*] ' + d1[i])
									}
								}
							}
							startResult.push('[Use] ' + sourceTargetArray[1])
						} else {
							ret = sourceTargetArray[1]
							var startResult = []
							startResult.push('❌ No smart')
							startResult.push('[*]' + d1.join('|') + ' <- ' + d2.join('|'))
							// ❌💯‼️⁉️
						}
						// console.log({ type: 'test', ret, source, sourceTargetArray })
						// postMessage({type:'test', ret, source, sourceTargetArray })
						// postMessage({name:'test', data:Date.now()})

						return ret
					}
					function strDiff(str1, str2, separator) {
						str1 = str1 || ''
						str2 = str2 || ''
						// separator = separator || /\b|[\s,\.\!_\-\+]+|\{\\r\\n\}|\\n/;// 原来的
						separator = separator || /[\s,\.\!_\-\+]+|\{\\r\\n\}|\\n/
						// arr中有ele元素
						function hasElement(arr, ele) {
							// 内存循环
							var hasItem1 = false
							for (var i2 = 0; i2 < arr.length; i2++) {
								//
								var item2 = arr[i2] || ''
								if (!item2) {
									continue
								}
								//
								if (ele == item2) {
									hasItem1 = true
									break
								}
							}
							return hasItem1
						}
						function inAnotB(a, b) {
							// 在A中，不在B中
							var res = []
							for (var i1 = 0; i1 < a.length; i1++) {
								var item1 = a[i1] || ''
								if (!item1) {
									continue
								}
								var hasItem1 = hasElement(b, item1)
								if (!hasItem1) {
									res.push(item1)
								}
							}
							return res
						}
						//
						var list1 = str1.split(separator)
						var list2 = str2.split(separator)
						//
						var diff1 = inAnotB(list1, list2)
						var diff2 = inAnotB(list2, list1)
						// 返回结果
						var result = {
							diff1: diff1,
							diff2: diff2,
							separator: separator,
						}
						return result
					}

					function run(dict, st, o) {
						console.log('run')
						/* 
					@dict    []
					st       sourceText
					o        {source:target, ...}
					*/
						if (st in o) {
							// t  需要填充的该target单元格
							// st t单元格的当前内容
							// tt 需要填充的100%匹配的最新内容
							let tt = o[st]
							// 已经填好的内容与100%内容一致时，直接退出操作。
							if (st === tt)
								return {
									text: tt,
									removeClass:
										'done doneAuto doneAutoSpace doneAutoNumber doneSmart',
									addClass: 'doneAuto',
								} // 相等内容
							// if (clickEvent.altKey) return t.parent().remove();
							let addClass = 'doneAuto'
							log(addClass)
							return {
								text: tt,
								removeClass:
									'done doneAuto doneAutoSpace doneAutoNumber doneSmart',
								addClass,
							} // 已有内容
						}

						// 如果没有直接找到一致内容，则需要只能匹配了。
						// 智能忽略空格匹配
						if (st.length === 0) {
							return
						}
						var regexp = new RegExp('^' + Search.getRegExp(st).source + '$')
						for (var k in o) {
							if (regexp.test(k)) {
								// 找到一致内容
								// if (clickEvent.altKey) return t.parent().remove();
								let addClass = 'doneAutoSpace'
								log(addClass)
								return {
									text: o[k],
									removeClass:
										'done doneAuto doneAutoSpace doneAutoNumber doneSmart',
									addClass,
								} // 淡灰色
							}
						}

						// 数值匹配
						{
							let result = '',
								accepted = false,
								p
							let regExp = ArgText.numberRegExp
							let stNoNumber = st.replace(regExp, '')
							if (regExp.test(st)) {
								// log('숫자매칭1')
								let arr = dict.array
								arr.some((e) => {
									let s = e[0],
										t = e[1]
									if (regExp.test(s)) {
										// log('숫자매칭2')
										let sNoNumber = s.replace(regExp, '')
										if (sNoNumber === stNoNumber) {
											p = ArgText.makeTextPair(s, t)
											let stMade = ArgText.makeText(st)
											// accepted = p.a.args.length === stMade.args.length
											// accepted = p.a.args.length === stMade.args.length || p.accepted
											accepted = p.accepted
											log(JSON.stringify({ p, stMade }))
											if (accepted) {
												result = p.make(stMade.args)
											}
											// log('숫자매칭3',accepted, p, result)
										}
									}
									return accepted
								})

								if (accepted) {
									// log('숫자매칭3',accepted, result)
									let addClass = p.accepted ? 'doneAutoNumber' : 'doneSmart'
									log(addClass)
									return {
										text: result,
										removeClass:
											'done doneAuto doneAutoSpace doneAutoNumber doneSmart',
										addClass,
									} // 不要继续往下执行。
								}
							}
						}

						// 一个词的替换
						{
							if (
								dict.search(st, 80).some((kv) => {
									let tt
									try {
										tt = kkv(st, kv, dict.array)
									} catch (err) {
										console.warn(err)
									}
									if (tt) {
										let addClass = 'doneAutoNumber'
										log(addClass)
										return { text: tt, addClass }
									}
								})
							) {
								return {}
							}
						}

						// 只能忽略数字英文符号等的匹配。
						var filterRegExp = /[\x00-\xff]/g,
							_k,
							_v
						for (var k in o) {
							_k = k.replace(filterRegExp, '')
							if (_k == st.replace(filterRegExp, '')) {
								let v = smartMatch(st, [k, o[k]], dict)
								let addClass = 'doneSmart'
								log(addClass)
								return { text: v, addClass }
							}
						}

						// 实在是没有找到，需要做最后的处理。
						// 按下ctrl时，保留原来内容。按下alt时，删除找到的内容。找到内容时，自动替换背景颜色为灰色。
						// if (!clickEvent.ctrlKey) {
						// 	t.text('').removeAttr('style');
						// }
						return {}
					}
				},
				function (data) {
					// 自动匹配后执行的操作
					if (data) {
						let { text, addClass, removeClass } = data

						if (Reflect.has(data, 'text')) t.text(text)
						if (Reflect.has(data, 'removeClass')) t.removeClass(removeClass)
						if (Reflect.has(data, 'addClass')) t.addClass(addClass)
						// if (text) log(st, text)
					}
					t.removeClass('wait')
					worker.terminate()
					delete match100workers[objectId]
					resolve()
					if (match100fns.length === 0) {
						let last = t.last()
						last.focus() // 激活焦点 2019.03.22
						// log(last[0])
						SM.s.selectAllChildren(last[0]) // 选取内容
					}
				}
			)
			worker.postMessage({ array, st, o })
			match100workers[objectId] = worker
		})
		// }
	}
}

// 【插入日志】
let clogCount = 0
let clogs = document.querySelector('#clogs')
function pushlog(...args) {
	let clog = createCustomLog.apply(null, args)
	if (clog) {
		clogs.insertAdjacentElement('afterbegin', clog)
		let { bottom } = clogs.getBoundingClientRect()
		Array.from(clogs.children).forEach((node, i) => {
			if (i > 10) node.remove()
		})
	}
}
function pushloghtml(v) {
	let clog = document.createElement('p')
	clog.classList.add('clog')
	clog.innerHTML = v
	clogs.insertAdjacentElement('afterbegin', clog)
	let { bottom } = clogs.getBoundingClientRect()
	Array.from(clogs.children).forEach((node, i) => {
		if (i > 10) node.remove()
	})
	return $(clog)
}
// arg为string时，视为信息。arg为object时，视为css。
function createCustomLog(...args) {
	let length = args.length,
		header,
		content,
		style = {},
		contents = []

	if (length === 0) {
		return
	} else {
		let pre = document.createElement('p')
		pre.classList.add('clog')
		pre.dataset.count = ++clogCount
		args.forEach((e) => {
			let type = typeof e
			if (type === 'string' || type === 'number') {
				contents.push(e)
			} else if (e === 'object') {
				Object.assign(style, e)
			}
		})
		content = contents.join('\n')
		pre.textContent = content
		if (style) {
			for (let k in style) {
				pre.style[k] = style[k]
			}
		}
		return pre
	}
}

// 【格式化名称】 特别是文件名
function formatName(n) {
	return n.replace(
		/[\\\/\:\*\?\"\<\>\|\&\-\+\=\`\~\%\!\@\#\$\%\^\,\.\;\:\'\(\)\{\}\[\]\s]/g,
		'_'
	)
}

// 【排除arr中source的空格数小于等于n的项】
function filterStep(arr, n = 0) {
	return arr.filter(function (e) {
		let [v] = e
		if (v) {
			v = v.trim().match(/\s+/g)
			if (v) {
				return v.length <= n // 空格个数少于等于n
			} else {
				return true // 没有空格
			}
		}
		return false
	})
}
// 删除标签符号，重组arr
function filterTag(arr) {
	let regExp = /\[[a-z0-9\-]+?\]|\{[\d+?]\}|[\(\)\[\]\{\}\<\>\"\'\`\!\！\,\，\.\。\…\?\？]|^\d+$/gi
	let rs = []
	arr.forEach(function (e) {
		let [s, t] = e
		if (s) {
			s = s.trim()
			if (s) {
				s = s.replace(regExp, '')
				if (t) {
					t = t.replace(regExp, '')
				}
				rs.push([s, t])
			}
		}
	})
	return rs
}
// 排除不符合长度规则的项
function filterLength(arr, max = 16, min = 2) {
	return arr.filter(function (e) {
		var s = e[0]
		if (s) {
			s = s.trim()
			if (s) {
				var length = s.length
				return length <= max && length >= min
			}
		}
		return false
	})
}
// 推测出词库。没有空格，删除标签，长度10以内的项。
function filterDict() {
	var rs = filterStep(dict.array, 0)
	rs = filterTag(rs)
	rs = filterLength(rs, 10)
	return rs
}

// 下载文件(文件名，数据)   编码UTF-8格式
function downloadFile(filename, content) {
	if (!/\.txt$/i.test(filename)) filename += '.txt'

	var a = document.createElement('a')
	var blob = new Blob([content])
	var url = window.URL.createObjectURL(blob)
	a.href = url
	a.download = filename
	a.click()
	window.URL.revokeObjectURL(url)
}

// 下载文件(文件名，数据)   编码UTF-16格式
function downloadFileUcs2(filename, content) {
	if (!/\.txt$/i.test(filename)) filename += '.txt'

	content = content.replace(/\n/g, '\r\n')
	content = punycode.ucs2.decode(content)
	content.unshift(0xfeff)
	content = Uint16Array.from(content)
	let a = document.createElement('a')
	let blob = new Blob([content])
	let url = window.URL.createObjectURL(blob)

	a.href = url
	a.download = filename
	a.click()
	window.URL.revokeObjectURL(url)
}
function downloadFile2(fileName, content) {
	var aLink = document.createElement('a')
	if (!(content instanceof Blob)) {
		content = new Blob([content])
	}
	aLink.download = fileName
	aLink.href = URL.createObjectURL(content)
	aLink.click()
	// var evt = document.createEvent("HTMLEvents");
	// evt.initEvent("click", false, false);//initEvent 不加后两个参数在FF下会报错, 感谢 Barret Lee 的反馈
	// aLink.dispatchEvent(evt);
	setTimeout(() => {
		URL.revokeObjectURL(aLink.href)
	}, 1000)
}
// downloadExcel
function doit(table, fn, type, dl) {
	var elt = document.getElementById('works')
	var wb = XLSX.utils.table_to_book(elt, { sheet: 'Sheet1' })
	return dl
		? XLSX.write(wb, { bookType: type, bookSST: true, type: 'base64' })
		: XLSX.writeFile(wb, fn || 'test.' + (type || 'xlsx'))
}

// function smartMatch(source, sourceTargetArray) {
// 	warn('调用smartMath()')
// 	var ret = '';
// 	var o = strDiff(source, sourceTargetArray[0]);
// 	var d1 = o.diff1, d2 = o.diff2, len1 = d1.length, len2 = d2.length, d1Value, d2Value;
// 	var regexp = /^[\x01-\xff]+$/;
// 	if (len1 === len2) {// 不同点个数一样
// 		var startResult = [];
// 		startResult.push('⁉ Replace');
// 		ret = sourceTargetArray[1];
// 		for (var i = 0; i < len1; i++) {
// 			d1Value = d2Value = '';
// 			if (regexp.test(d1[i])) {
// 				ret = ret.replace(d2[i], d1[i]);
// 				startResult.push(d2[i] + ' -> ' + d1[i]);
// 			} else {
// 				dict.array.some(function (e) {
// 					if (e && (typeof e[0] === 'string') && e[0] && (typeof e[1] === 'string') && e[1]) {
// 						if (e[0].trim() === d1[i].trim()) d1Value = e[1].trim();
// 						if (e[0].trim() === d2[i].trim()) d2Value = e[1].trim();
// 						if (d1Value && d2Value) return true;
// 					}
// 				});
// 				if (d2Value) {
// 					ret = ret.replace(d2Value, d1Value || d1[i]);
// 					if (d1Value) {
// 						startResult.push(d2Value + ' -> ' + d1Value);
// 					} else {
// 						startResult.push(d2Value + ' *> ' + d1[i]);
// 					}
// 				} else {
// 					if (d1Value) {
// 						startResult.push(d2[i] + ' *> ' + d1Value);
// 					} else {
// 						startResult.push(d2[i] + ' *> ' + d1[i]);
// 					}
// 				}
// 			}
// 		}
// 		startResult.push('[Use] ' + sourceTargetArray[1]);
// 		pushlog.apply(null, startResult);
// 	} else if (len1 == 0) {
// 		// len2多，所以要删除多余的部分
// 		var startResult = [];
// 		startResult.push('⁉ Remove');
// 		ret = sourceTargetArray[1];
// 		for (var i = 0; i < len2; i++) {
// 			d2Value = '';
// 			if (regexp.test(d2[i])) {
// 				ret = ret.replace(d2[i], '');
// 			} else {
// 				dict.array.some(function (e) {
// 					if (e && (typeof e[0] === 'string') && e[0] && (typeof e[1] === 'string') && e[1]) {
// 						if (e[0].trim() === d2[i].trim()) {
// 							d2Value = e[1];
// 							return true;
// 						}
// 					}
// 				});
// 				if (d2Value) {
// 					ret = ret.replace(d2Value, '');
// 					startResult.push('[x] ' + d2Value);
// 				} else {
// 					startResult.push('[*] ' + d2[i]);
// 				}
// 			}
// 		}
// 		startResult.push('[Use] ' + sourceTargetArray[1]);
// 		pushlog.apply(null, startResult);
// 	} else if (len2 == 0) {
// 		// len1多，所以要找到内容，添加进去
// 		var startResult = [];
// 		ret = sourceTargetArray[1];
// 		startResult.push('‼ Add');
// 		for (var i = 0; i < len1; i++) {
// 			d1Value = '';
// 			if (regexp.test(d1[i])) {
// 				startResult.push('[*]' + d1[i]);
// 			} else {
// 				dict.array.some(function (e) {
// 					if (e && (typeof e[0] === 'string') && e[0] && (typeof e[1] === 'string') && e[1]) {
// 						if (e[0].trim() === d1[i].trim()) {
// 							d1Value = e[1];
// 							return true;
// 						}
// 					}
// 				});
// 				if (d1Value) {
// 					startResult.push('[*] ' + d1Value);
// 				} else {
// 					startResult.push('[*] ' + d1[i]);
// 				}
// 			}
// 		}
// 		startResult.push('[Use] ' + sourceTargetArray[1]);
// 		pushlog.apply(null, startResult);
// 	} else {
// 		ret = sourceTargetArray[1];
// 		var startResult = [];
// 		startResult.push('❌ No smart');
// 		startResult.push('[*]' + d1.join('|') + ' <- ' + d2.join('|'));
// 		pushlog.apply(null, startResult);
// 		// ❌💯‼️⁉️
// 		log({ ret, source, sourceTargetArray })
// 	}
// 	return ret;
// }

// function strDiff(str1, str2, separator) {
// 	str1 = str1 || "";
// 	str2 = str2 || "";
// 	// separator = separator || /\b|[\s,\.\!_\-\+]+|\{\\r\\n\}|\\n/;// 原来的
// 	separator = separator || /[\s,\.\!_\-\+]+|\{\\r\\n\}|\\n/;
// 	// arr中有ele元素
// 	function hasElement(arr, ele) {
// 		// 内存循环
// 		var hasItem1 = false;
// 		for (var i2 = 0; i2 < arr.length; i2++) {
// 			//
// 			var item2 = arr[i2] || "";
// 			if (!item2) {
// 				continue;
// 			}
// 			//
// 			if (ele == item2) {
// 				hasItem1 = true;
// 				break;
// 			}
// 		}
// 		return hasItem1;
// 	};
// 	function inAnotB(a, b) { // 在A中，不在B中
// 		var res = [];
// 		for (var i1 = 0; i1 < a.length; i1++) {
// 			var item1 = a[i1] || "";
// 			if (!item1) {
// 				continue;
// 			}
// 			var hasItem1 = hasElement(b, item1);
// 			if (!hasItem1) {
// 				res.push(item1);
// 			}
// 		}
// 		return res;
// 	};
// 	//
// 	var list1 = str1.split(separator);
// 	var list2 = str2.split(separator);
// 	//
// 	var diff1 = inAnotB(list1, list2);
// 	var diff2 = inAnotB(list2, list1);
// 	// 返回结果
// 	var result = {
// 		diff1: diff1,
// 		diff2: diff2,
// 		separator: separator
// 	};
// 	return result;
// };

// 【查找表情符号用】
function imo(begin, count) {
	while (count-- > 0) console.log(String.fromCharCode(55357, begin++))
}
// 【将数据复制到textarea上后复制到剪贴板中】
function copyToTempResult(data) {
	let ta = $('#tempResult').get(0)
	ta.value = data
	ta.select()
	document.execCommand('copy', true)
	let length = data.length
	pushlog(
		'[복사완료]',
		length > 50 ? data.slice(0, 50) + '...(' + length + ')' : data
	)
}

// 【记录最后一次在source或target中选择的文字内容】
$(document).on('mouseup', '.source, .target', async function (e) {
	// log(e.originalEvent.target, e.originalEvent.path)
	// log(e.type);
	let s = window.getSelection() // 选择文字
	if (s.type !== 'Range' || s.anchorNode !== s.focusNode) {
		return
	}
	let p = s.anchorNode,
		isSource,
		isWorksSource,
		isTarget,
		text
	while ((p = p.parentElement)) {
		isSource = p.classList.contains('source')
		isTarget = p.classList.contains('target')
		if (
			p.nodeType === Element.ELEMENT_NODE &&
			p.classList &&
			(isSource || isTarget)
		) {
			text = s.toString()
			if (isSource) {
				isWorksSource = $(p).is('#works .source')
				if (!isWorksSource) return
				$('#lsst').text(text)

				// 기타 웹페이지 참조
				let g = $('#useNet').prop('checked')
				if (g) {
					if (text && text.trim()) {
						gSearch(text, $('#netTarget').val())
					}
				}

				// 选词搜索规则
				// 1）source !== target
				// 2）带有数值的排到下方
				var a = dict.search(text, Number($('#similarPercent').val()))
				a = a.filter((e) => e[0] !== e[1])
				a.sort(function (a, b) {
					if (/\d/.test(a)) return 1
				})
				// 提示内容
				var table = ao.arrayToTable(a)
				$('td:nth-child(4)', table).addClass('index')
				$('td:nth-child(3)', table)
					.addClass('similar')
					.each((_, e) => (e.textContent = parseInt(e.textContent) + '%'))
				$('td:nth-child(2)', table)
					.attr({ contenteditable: 'plaintext-only' })
					.addClass('target')
				$('td:nth-child(1)', table)
					.attr({ contenteditable: 'plaintext-only' })
					.addClass('source')
				$('tr', table).each(function (i, tr) {
					$(tr).prepend($('<td class="no"></td>').text(i + 1))
				})
				$('#statusDict').html(table.innerHTML).prop('scrollTop', 0)

				//
			} else if (isTarget) {
				$('#ltst').text(text)
			}
			break
		}
	}
	return
})

// 【计算当前文档任务状态】
let calculationWorksStatusTimeout = null
let worksStatus = document.querySelector('#worksStatus')
function calculationWorksStatus() {
	clearTimeout(calculationWorksStatusTimeout)
	calculationWorksStatusTimeout = setTimeout(() => {
		let totalLength = 0
		let doneLength = 0
		let undoneLength = 0
		let works = document.querySelector('#works')
		let targets = works.querySelectorAll('.target')
		let doneSegmentLength = 0
		targets.forEach((target) => {
			let isDone = /\bdone/.test(target.className)
			let source = target.previousElementSibling
			let sourceLength = source.textContent.length
			// log(isDone, source, target)
			totalLength += sourceLength
			if (isDone) {
				doneLength += sourceLength
				doneSegmentLength += 1
			} else {
				undoneLength += sourceLength
			}
		})
		// let workProgress = document.querySelector('#workProgress')
		// workProgress.max = totalLength
		// workProgress.value = doneLength

		if (worksStatus) worksStatus.textContent = `${doneLength}/${totalLength}`

		let progressDone = Math.floor((100 * doneLength) / totalLength)
		let progressDoneSegment = Math.floor(
			(100 * doneSegmentLength) / targets.length
		)
		document.querySelector(
			'#worksStatus'
		).style.backgroundImage = `linear-gradient(0deg, #c0ffc0 ${progressDone}%, transparent 0),linear-gradient(90deg, #c8ebff ${progressDoneSegment}%, transparent 0),linear-gradient(0deg, #fffe 100%, transparent 0)`
		// log(progressDone, progressDoneSegment)
	}, 200)
}
// 【解锁F1键填充前锁住的格子】
function clearWait() {
	$('#works .target').removeClass('wait')
}
// 【清空任务中的译文】
function clearTarget() {
	$('#works .target').each((i, e) => {
		// clear class.
		e.classList.forEach((c) => {
			if (/^target/.test(c) || /^hide/.test(c)) {
				return
			}
			e.classList.remove(c)
		})
		e.textContent = ''
	})
}
document.addEventListener('contextmenu', function () {
	let tar = event.target
	if (tar && tar.matches('#works .target')) {
		tar.classList.remove('wait', 'splitTarget')
	}
})

$(function () {
	$('#tamaiModeSwitch').on('click', function (event) {
		let { checked } = event.currentTarget
		let tag
		if (checked) {
			tag = document.body.appendChild(document.createElement('style'))
			tag.setAttribute('id', 'tamaiModetag')
			tag.innerText = `
.util.tm th {
		background: #ffb7cf;
}
.util.work th {
		background: #ffc3d7;
}
.util.tb th {
		background: #FCE4EC;
}
h3 {
		background: #ffa8c6;
		color: #fff;
}
.util {
		background: #FFFDE7;
}
tbody {
		border: 1px solid #FFFDE7!important;
}
h3 {
		background: #ffa8c6;
		color: #fff;
		max-width: 18em;
}
#toolleft div, #toolright div {
		border: 2px solid #FFFDE7;
		background: #FCE4EC;
		color: #F06292;
}

#worksButtonbox {
		background: #F8BBD0!important;
}

#tipButtonbox {
		background: #F8BBD0!important;
}

.clog td {
		border: 1px solid #CE93D8;
		background: #F3E5F5;
		color: #CE93D8;
}

.buttonbox input, .buttonbox button {
		background: #F3E5F5;
		border: 1px solid #E1BEE7!important;
}
.no{
	color: #ffffff;
	background: #ffbad1;
}
.target {
	font-family: Meiryo;
}
`
		} else {
			tag = document.getElementById('tamaiModetag')
			if (tag) tag.remove()
		}
		tm.setItem('tamaiMode', $('#tamaiModeSwitch').prop('checked'))
	})
})

// 打开外部参考网站（日后提供更详细的设置）
// opt: 是否激活为当前窗口。个别打开设置。添加自定义网址。
function gSearch(s, t) {
	let isUseNet = document.querySelector('#useNet').checked
	let isUseNet2 = document.querySelector('#useNet2').checked

	if (!(isUseNet || isUseNet2)) return

	s = encodeURIComponent(s)
	let screenX = 0
	let screenY = 0
	let width = screen.availWidth
	let height = screen.availHeight

	if (isUseNet) {
		if (!gSearch.google || gSearch.google.closed) {
			gSearch.google = wopen(`about:blank`, {
				name: 'google',
				width: Math.min(400, width / 4),
				height: height / 2,
				screenX,
				screenY: screenY,
			})
		}
		if (!gSearch.papago || gSearch.papago.closed) {
			gSearch.papago = wopen(`about:blank`, {
				name: 'papago',
				width: Math.min(400, width / 4),
				height: height / 2,
				screenX,
				screenY: screenY + height / 2,
			})
		}
		gSearch.google.location.href = `https://translate.google.cn/?view=home&op=translate&sl=auto&tl=${t}&text=${s}`
		gSearch.papago.location.href = `https://papago.naver.com/?sk=auto&tk=${t}&st=${s}`
	}
	if (isUseNet2) {
		if (!gSearch.googleAll || gSearch.googleAll.closed) {
			gSearch.googleAll = wopen(`about:blank`, {
				name: 'googleAll',
				width: Math.min(400, width / 4),
				height,
				screenX,
				screenY,
			})
		}
		gSearch.googleAll.location.href = `https://translators.to/?source=&target=${t}&text=${s}`
	}
}
window.addEventListener('beforeunload', beforeunloadHandle)
function beforeunloadHandle(e) {
	e.preventDefault()
	document.querySelectorAll('.qa').forEach((e) => e.remove())

	//关闭外部搜索窗口
	function fn(name) {
		if (
			gSearch[name] &&
			typeof gSearch[name].close === 'function' &&
			!gSearch[name].closed
		)
			gSearch[name].close()
	}
	fn('google')
	fn('papago')
	fn('googleAll')

	if (!isRemoveProject) {
		saveDatas()
		//upload
	}
}

$(function () {
	themaReady[0] = true
	showBody()
})

function showBody() {
	if (themaReady.every((e) => e)) {
		document.body.removeAttribute('style')
	}
}

function hideDone() {
	$('.done, .doneAuto, .doneAutoSpace, .doneAutoNumber, .doneSmart')
		.parent()
		.addClass('hide')
}
function showAll() {
	document.querySelectorAll('#works tr').forEach((tr) => {
		tr.removeAttribute('style')
		tr.classList.remove('hide', 'hide2', 'hide3')
	})
	let o = document.querySelector('.currentEditRow .target')
	if (o) {
		o.focus()
		o.scrollIntoView({ block: 'center' })
	}
	document.getElementById('useDictTip').checked = true
}

// 测试一个节点是否有父级target
function parentNodeIsTargetClasses(o) {
	let p,
		b = false
	while ((p = o.parentNode)) {
		if (p.classList.contains('target')) {
			b = true
			break
		}
	}
	return b
}

function showDiff(target, source, tips) {
	if (t.length) {
		let t1 = $(tipName).find('tr').eq(key).find('.source').text().trim()
		let t2 = $(e.target).parent().find('.source').text().trim()
		let dmp = new diff_match_patch()
		let diff = dmp.diff_main(t1, t2)
		dmp.diff_cleanupSemantic(diff)
		let dmpHTML = dmp.diff_prettyHtml(diff)
		pushloghtml(dmpHTML)

		let { x, y, height } = tar.get(0).getBoundingClientRect()
		// showTip({html:dmpHTML, x, y:Math.max(y-height,0)});
		showTip({
			html: dmpHTML,
			x,
			y,
			delay: 5000,
			css: { transform: 'translate(0,-100%)' },
		})
	}
}

// 排序
function readySort(className = '.source', method = 'text', asc = 1) {
	let s = $('#works tr')

	$('#works tbody[dataname] tr')
		.sort((a, b) => {
			let at, bt
			at = $(a).find(className).text()
			bt = $(b).find(className).text()
			if (method === 'length') {
				// length已经是数值
				at = at.length
				bt = bt.length
			}
			if (className === '.no') {
				// 由于no是数值，所以需要转化为数值后，在进行比较
				at = parseInt(at)
				bt = parseInt(bt)
			}
			// 如果是文本，则直接进行比较
			return at > bt ? asc : at < bt ? -asc : 0
		})
		.each((i, e) => {
			let target = $(e)
			let parent = target.parent().get(0)
			target.detach().appendTo(parent)
		})
}

$('#noAsc').on('click', (e) => readySort('.no', 'text', 1))
$('#sourceAsc').on('click', (e) => readySort('.source', 'text', 1))
$('#sourceDesc').on('click', (e) => readySort('.source', 'text', -1))
$('#sourceLengthAsc').on('click', (e) => readySort('.source', 'length', 1))
$('#sourceLengthDesc').on('click', (e) => readySort('.source', 'length', -1))

function readFile(file, callback) {
	let result = []
	let reader = new FileReader()
	let start = 0
	let total = file.size
	let {
		batch,
		onabort,
		onerror,
		onload,
		onloadstart,
		onloadend,
		onprogress,
		methodName,
	} = readFile.options
	let callbackType = typeof callback
	if (callbackType === 'function') {
		onload = callback
	} else if (callbackType === 'object' && callback !== null) {
		if (typeof callback.onabort === 'function') onabort = callback.onabort
		if (typeof callback.onerror === 'function') onerror = callback.onerror
		if (typeof callback.onload === 'function') onload = callback.onload
		if (typeof callback.onloadstart === 'function')
			onloadstart = callback.onloadstart
		if (typeof callback.onloadend === 'function') onloadend = callback.onloadend
		if (typeof callback.onprogress === 'function')
			onprogress = callback.onprogress
	}

	reader.onabort = onabort
	reader.onerror = onerror
	reader.onloadstart = onloadstart
	reader.onloadstart = onloadstart
	reader.onloadend = onloadend
	reader.onprogress = onprogress
	reader.onload = function (event) {
		try {
			result.push(event.target.result)
			asyncUpdate()
		} catch (e) {
			log(e)
		}
	}
	let asyncUpdate = function () {
		if (start < total) {
			log(((start / total) * 100).toFixed(2) + '%')
			let end = Math.min(start + batch, total)
			// reader.readAsArrayBuffer(file.slice(start, end))
			reader[methodName](file.slice(start, end))
			start = end
		} else {
			onload(result)
		}
	}
	asyncUpdate()
	return reader
}
readFile.options = {
	batch: 1024 * 1024 * 2,
	onabort: console.warn,
	onerror: console.error,
	onload: console.log,
	onloadstart: console.log,
	onloadend: console.log,
	onprogress: console.log,
	methodName: 'readAsText',
}

// 在works中，source和target对换位置。
$('#changeSourceAndTarget').on('click', () => {
	$('#works tr').each((i, tr) => {
		let source = $(tr).find('.source')
		let target = $(tr).find('.target')
		let cache = target.text()
		target.text(source.text())
		source.text(cache)
	})
})

// 【粘贴到source和target时，处理下换行内容】
// 针对粘贴的文本，替换换行和制表符。
window.addEventListener('paste', function (e) {
	let {
		clipboardData,
		target,
		target: { nodeType },
	} = event
	// clipboardData.setData('text/plain', clipboardData.getData('text/plain').replace(/\r\n|\n/g,'\\n'))
	// log(clipboardData.getData('text/plain'))
	if (nodeType === 3) {
		// 如果是Text
		target = target.parentElement
		nodeType = target.nodeType
	}
	if (nodeType === 1) {
		// 如果是Element，且.target或.source
		let { classList } = target
		if (classList.contains('target') || classList.contains('source')) {
			if (/\r\n|\n|\t/.test(clipboardData.getData('text/plain'))) {
				console.warn('粘贴了带有换行符或制表符的内容')
				if (getComputedStyle(target).webkitUserModify.indexOf('write') > -1) {
					setTimeout(() => {
						target.textContent = target.textContent
							.replace(/\r\n|\n/g, '\\n')
							.replace(/\t/g, ' ')
					}, 60)
				}
			}
			// let { startContainer, endContainer } = SM.range
			// if (startContainer === endContainer) {
			// 	event.preventDefault()
			// 	let text = clipboardData.getData('text/plain').replace(/\r\n|\n/g, '\\n').replace(/\t/g, ' ')
			// 	SM.text = text
			// }
		}
	} else {
		error(nodeType, target)
	}
})

// 选取行
let lastSelectedNoElement // 记录最后一个选中的no元素
let isMousedownAddSelectedStatByNo = false // 是否需要添加selected状态标记。是时添加；否时移除。
$(document).on('mousedown', onmousedownHandleByNo)
$(document).on('mouseup', onmouseupHandleByNo)
$(document).on('mouseup', function (e) {
	isMousedownAddSelectedStatByNo = false
})

function onmousedownHandleByNo(e) {
	let { target } = e
	if (!(target && target.nodeType === 1 && target.classList.contains('no')))
		return
	e.preventDefault()
	if (e.which === 1) {
		if (e.shiftKey) {
			// 用SHIFT组合键进行多重选择或移除。
			if (!lastSelectedNoElement) return // 不存在
			if (!lastSelectedNoElement.isConnected) return // 被DOM移除
			if (lastSelectedNoElement.parentElement.style.display === 'none') return // 不可见
			if (e.target === lastSelectedNoElement) return // 相同

			let startNoValue = parseInt(lastSelectedNoElement.textContent)
			let endNoValue = parseInt(e.target.textContent)
			let startNo, endNo // 排在上面的no元素，排在下面的no元素
			if (startNoValue > endNoValue) {
				startNo = e.target
				endNo = lastSelectedNoElement
			} else {
				startNo = lastSelectedNoElement
				endNo = e.target
			}
			startNoValue = parseInt(startNo.textContent)
			endNoValue = parseInt(endNo.textContent)
			let tr = startNo.parentElement
			let isStartNoSelected = lastSelectedNoElement.classList.contains(
				'selected'
			) // 开始No的状态
			let count = 0
			do {
				if (
					tr.isConnected &&
					!(
						tr.classList.contains('hide') ||
						tr.classList.contains('hide2') ||
						tr.style.display === 'none'
					)
				) {
					// let $no = $(tr).find('td.no')
					// let noValue = parseInt($no.text())
					// if (noValue > endNoValue) break;
					// $no[isStartNoSelected ? 'addClass' : 'removeClass']('selected')// 根据开始No的状态，确定添加/移除。
					// log($no, isStartNoSelected)
					let no = tr.querySelector('.no')
					let noValue = parseInt(no.textContent)
					if (noValue > endNoValue) break
					no.classList[isStartNoSelected ? 'add' : 'remove']('selected') // 根据开始No的状态，确定添加/移除。
					// log(no, isStartNoSelected, tr)
					count++
				}
			} while ((tr = tr.nextElementSibling))
			pushlog(`selected ${count}.`)
		} else {
			lastSelectedNoElement = e.target

			isMousedownAddSelectedStatByNo = !e.target.classList.contains('selected')
			e.target.classList[isMousedownAddSelectedStatByNo ? 'add' : 'remove'](
				'selected'
			)

			// $(document).on('mouseover', '#works .no', onmouseoverHandleByNo)
			document.addEventListener('mouseover', onmouseoverHandleByNo)
		}
	}
}

function onmouseupHandleByNo(e) {
	// let { target } = e
	// if(target && target.nodeType && target.classList.contains('no')) {
	// 	isMousedownAddSelectedStatByNo = false
	// 	document.removeEventListener('mouseover', onmouseoverHandleByNo)
	// }
	isMousedownAddSelectedStatByNo = false
	document.removeEventListener('mouseover', onmouseoverHandleByNo)
}

function onmouseoverHandleByNo(e) {
	e.preventDefault()
	let { target } = e
	if (target && target.nodeType === 1) {
		let { classList } = target
		if (classList.contains('source') || classList.contains('target')) {
			target = target.parentElement.querySelector('.no')
			if (target)
				target.classList[isMousedownAddSelectedStatByNo ? 'add' : 'remove'](
					'selected'
				)
		}
		if (classList.contains('no')) {
			target.classList[isMousedownAddSelectedStatByNo ? 'add' : 'remove'](
				'selected'
			)
		}
	}
}

// 删除行
$(document).on('contextmenu', '#works td.no', function (e) {
	e.preventDefault()
	removeSelectedHandle(e)
})

// 删除表
$(document).on('contextmenu', '#works tbody', function (e) {
	e.preventDefault()
	let range = $(e.target)
	if (range.is('#works tbody')) {
		if (
			(e.ctrlKey && e.shiftKey && e.altKey) ||
			confirm(
				'[삭제] ' + range.attr('dataname') + '를 삭제합니다! 확인해 주세요.'
			)
		) {
			range.remove()
		}
	}
})

function toUTC(dateStr) {
	let o = {
		$: dateStr ? new Date(dateStr) : new Date(),
		get Y() {
			return this.$.getUTCFullYear().toString().padStart(2, '0')
		},
		get m() {
			return (this.$.getUTCMonth() + 1).toString().padStart(2, '0')
		},
		get d() {
			return this.$.getUTCDate().toString().padStart(2, '0')
		},
		get H() {
			return this.$.getUTCHours().toString().padStart(2, '0')
		},
		get i() {
			return this.$.getUTCMinutes().toString().padStart(2, '0')
		},
		get s() {
			return this.$.getUTCSeconds().toString().padStart(2, '0')
		},
	}

	let { Y, m, d, H, i, s } = o
	return `${Y}.${m}.${d} ${H}:${i}`
}

//module/ftime.js
function ftime(format = 'Y/m/d H:i:s.ms z', date = new Date(), utc = false) {
	let rs = format
	if (typeof format === 'string') {
		let dt = new DTime(utc)
		rs = rs.replace(/ms/g, dt.ms)
		rs = rs.replace(/s/g, dt.s)
		rs = rs.replace(/i/g, dt.i)
		rs = rs.replace(/H/g, dt.H)
		rs = rs.replace(/d/g, dt.d)
		rs = rs.replace(/m/g, dt.m)
		rs = rs.replace(/Y/g, dt.Y)
		rs = rs.replace(/y/g, dt.y)
		rs = rs.replace(/z/g, dt.z)
	} else {
		rs = date.toLocaleString()
	}
	return rs
}

class DTime {
	constructor(utc = false) {
		this._date = new Date()
		this._utc = utc
	}
	set utc(v) {
		this._utc = Boolean(v)
	}
	get utc() {
		return this._utc
	}
	get Y() {
		this._Y =
			this._Y ||
			this._date[`get${this._utc ? 'UTC' : ''}FullYear`]()
				.toString()
				.padStart(4, '0')
		return this._Y
	}
	get y() {
		this._y = this._y || this.Y.substr(2, 2)
		return this._y
	}
	get m() {
		this._m =
			this._m ||
			(this._date[`get${this._utc ? 'UTC' : ''}Month`]() + 1)
				.toString()
				.padStart(2, '0')
		return this._m
	}
	get d() {
		this._d =
			this._d ||
			this._date[`get${this._utc ? 'UTC' : ''}Date`]()
				.toString()
				.padStart(2, '0')
		return this._d
	}
	get H() {
		this._H =
			this._H ||
			this._date[`get${this._utc ? 'UTC' : ''}Hours`]()
				.toString()
				.padStart(2, '0')
		return this._H
	}
	get i() {
		this._i =
			this._i ||
			this._date[`get${this._utc ? 'UTC' : ''}Minutes`]()
				.toString()
				.padStart(2, '0')
		return this._i
	}
	get s() {
		this._s =
			this._s ||
			this._date[`get${this._utc ? 'UTC' : ''}Seconds`]()
				.toString()
				.padStart(2, '0')
		return this._s
	}
	get ms() {
		this._ms =
			this._ms ||
			this._date[`get${this._utc ? 'UTC' : ''}Milliseconds`]()
				.toString()
				.padStart(3, '0')
		return this._ms
	}
	get z() {
		let { _date } = this
		this._z =
			this._z ||
			(function () {
				let i = _date.getTimezoneOffset() / 60
				if (i <= 0) {
					return 'GMT+' + Math.abs(i)
				} else {
					return 'GMT-' + i
				}
			})()
		return this._z
	}
}

// 只有GNSS项目才有的侦听。
// 检测并转换提示UTC时间。
if (/\?gnss\b/.test(location.search)) {
	$(document).on('focus', '#works .target', (e) => {
		let $target = $(e.target)
		let $tr = $target.parent()
		let $source = $tr.find('.source')
		let sourceText = $source.text()
		let datetimeRegExp = /(?<Y>\d{4})\s*(\.|\-|\/)\s*(?<m>\d{1,2})\s*\2\s*(?<d>\d{1,2})\s*(?<H>\d{1,2})\s*:\s*(?<i>\d{1,2})/
		let matchs
		if ((matchs = datetimeRegExp.exec(sourceText))) {
			if (matchs.groups) {
				let { Y, m, d, H, i } = matchs.groups
				let date = new Date(Y, parseInt(m) - 1, d, H, i)
				let utc = ftime('Y.m.d H:i', date, true)

				let rect = $target.get(0).getBoundingClientRect()

				let v = `${this._utc}`

				if ($target.text().indexOf(v) === -1) {
					v = '[UTC] ' + v
					showTip({
						text: v,
						x: rect.x + rect.width,
						y: rect.y,
					})
					pushlog(v)
				}
			}
		}
	})
}

$(document).on('blur', '#works .target', (e) => {
	clearDoneMarks(e.target)
})

// 业务逻辑。当失去焦点，如果target没有内容，则清除done类标记。
function clearDoneMarks(target) {
	if (target.textContent.length === 0) {
		target.classList.forEach((className) => {
			if (/^done/.test(className)) {
				target.classList.remove(className)
			}
		})
	}
}

// Number QA 核心算法 --start
function numberQA(s, t) {
	/* 
	<input type="number">
	试图给它赋值字符串时，提示不符合正则表达式 /-?(\d+|\d+\.\d+|\.\d+)([eE][-+]?\d+)?/
	*/

	// 改良过的数值匹配
	let myNumberRegExp = ArgText.numberRegExp
	// 其他全部数值
	let number = /\p{Number}/gu
	// 合并数值匹配规则
	let regExp = [myNumberRegExp, number]
	regExp = new RegExp(regExp.map((re) => re.source).join('|'), 'gu')
	// 测试
	// log('①Ⅰ一1１ 50%  1,000. .5% 90％ 1.001e1000'.match(regExp))

	let r = regExp
	s = s.match(r) || []
	t = t.match(r) || []
	return arrayDiff(s, t)
}
function arrayDiff(a, b) {
	let __a = a.map((e) => e.replace(/,/g, ''))
	let __b = b.map((e) => e.replace(/,/g, ''))
	let _a = []
	let _b = []

	a.forEach((e, i) => {
		if (b.indexOf(e) === -1 && __b.indexOf(e) === -1) {
			_a.push({ value: e, index: i })
		}
	})
	b.forEach((e, i) => {
		if (a.indexOf(e) === -1 && __a.indexOf) {
			_b.push({ value: e, index: i })
		}
	})

	let ok = true,
		_al = _a.length,
		_bl = _b.length
	if (_al === _bl) {
		if (a.join('\x02') !== b.join('\x02')) {
			ok = false
		}
	} else {
		ok = false
	}
	return { arr1: a, arr2: b, diff1: _a, diff2: _b, ok }
}
// Number QA 核心算法 --start

function numberQACur() {
	let cer = $('.currentEditRow')
	let source = cer.find('.source')
	let target = cer.find('.target')

	let rs = numberQA(source.text(), target.text())
	log(rs)
}

// 消除#works中.no的选中状态
$('.util.work th.no').click((e) => {
	$('#works .no.selected').removeClass('selected')
})

$('#mergeSelected').click((e) => {
	$('#works .no.selected')
		.each((i, e) => {
			if (e.isConnected) {
				let p = $(e).parent()

				let pn
				while (true) {
					pn = p.next()
					if (pn.length) {
						let en = pn.find('.no.selected')
						if (en.length) {
							let es = p.find('.source'),
								et = p.find('.target') // 当前行
							let ns = pn.find('.source'),
								nt = pn.find('.target') // 下一行

							es.text(es.text() + '\\n' + ns.text())
							et.text(et.text() + '\\n' + nt.text())
							pn.remove()
						} else {
							break
						}
					} else {
						break
					}
				}
			}
		})
		.removeClass('selected')
})

async function testtime(fn) {
	if (!Number.isInteger(testtime.i)) testtime.i = 0
	testtime.i++
	let label = 'testtime' + testtime.i
	console.time(label)
	let v = await fn()
	console.log(v)
	console.timeEnd(label)
	return v
}

function emptyFunction() { }

$('#saveSelected').click(saveSelectedHandle)
$('#removeSelected').click(removeSelectedHandle)

function saveSelectedHandle() {
	let b = false
	if (!document.querySelector('.currentEditRow td.no.selected')) return b

	let nArr = []
	let selecteds = Array.from(document.querySelectorAll('#works td.no.selected'))
	if (selecteds.length === 0) return b

	selecteds.forEach((no) => {
		let p = no.parentElement
		let s = p.querySelector('td.source')
		let t = p.querySelector('td.target')
		let st = s.textContent.trim()
		let tt = t.textContent.trim()
		if (st && tt) {
			dict.array.push([st, tt])
			nArr.push(no.textContent)
			t.classList.add('done')
		}
		no.classList.remove('selected')
	})

	b = Boolean(nArr.length)
	if (b) pushlog('기록한 선택행: ' + nArr.join())
	return b
}

function removeSelectedHandle(e) {
	let range = $('#works td.no.selected')
	if (range.length) {
		if (
			(e.ctrlKey && e.shiftKey && e.altKey) ||
			confirm(
				'아래 내용을 삭제하시겠습니까?\n' +
				range
					.toArray()
					.map((e) => e.textContent)
					.join()
			)
		) {
			range.parent().remove()
		}
	}
}

// 统一管理按键
// document.on('keydown', (e)=>{
// 	let oe = e.originalEvent;
// 	keydownaction(e,oe)
// })
// function keydownaction(e,oe) {

// }

let numRE = ArgText.numberRegExp
function numCheck(s, t) {
	// let s='1,001291 asfas  0.12  100,1000,00.0'
	// let t='asfas  0.12  100,1000,00.0  1,00129'
	let sa = s.match(numRE)
	let ta = t.match(numRE)

	// console.log(sa);
	// console.log(ta);

	function clac(sa, ta) {
		sa = sa || []
		ta = ta || []
		let r = {}
		if (sa.length === ta.length) {
			if (sa.join('\u200c') === ta.join('\u2000c')) {
				r.done = true
				return r
			} else {
				r.done = false
			}
		}
		sa.forEach((e, i) => {
			let index = ta.indexOf(e)
			if (index !== -1) {
				delete ta[index]
				delete sa[i]
			}
		})
		sa = sa.filter((e) => e !== undefined)
		ta = ta.filter((e) => e !== undefined)
		return { sa, ta }
	}

	// console.log(clac(sa,ta))
	return clac(sa, ta)
}

function getSTWords() {
	let RE = /\s+/g
	let _dict = []
	for (let i = 0, len = dict.array.length; i < len; i++) {
		let [s, t] = dict.array[i]
		s = s.replace(RE, '')
		if (s.length < 10) {
			t = t.replace(RE, '')
			_dict.push([s, t])
		}
	}
	return _dict
}

function wordCheck(s, t, dict) {
	let RE = /\s+/g
	let ret = []
	s = s.replace(RE, '')
	t = t.replace(RE, '')

	dict.some(([ds, dt]) => {
		if (s.indexOf(ds) !== -1) {
			if (s === ds) {
				ret.length = 0
				return true
			}
			if (t.indexOf(dt) === -1) {
				ret.push([ds, dt])
			} else {
				ret = ret.filter((rs, rt) => rs !== ds)
			}
		}
	})

	return ret.length === 0 ? ((ret.done = true), ret) : ret
}

$(document).on('keydown', '#lsst, #ltst', (e) => {
	if (e.keyCode === 13) {
		e.preventDefault()
		if (e.altKey) {
			SM.insert('\\n')
		}
		if (e.ctrlKey) {
			$(document).trigger({ type: 'keydown', keyCode: 81, ctrlKey: true })
		}
	}
})

let tipIndex, tipTargetText
$(document).on('keydown', '#works .target', (e) => {
	let { ctrlKey, keyCode, altKey } = e
	if (keyCode === 38 || keyCode === 40) {
		if (ctrlKey) {
			e.preventDefault()

			if (typeof tipIndex !== 'number') tipIndex = -1

			// 10个可选项目, 索引可以是 -10 ~ 9
			if (keyCode === 38) tipIndex = (tipIndex - 1) % $('#tips .target').length
			else if (keyCode === 40)
				tipIndex = (tipIndex + 1) % $('#tips .target').length
			let tip = $('#tips').find('.target').eq(tipIndex)
			tipTargetText = tip.text()

			$('#tips .active').removeClass('active')
			tip.addClass('active')
			tip.parent().addClass('active')
			tip.prop('scrollIntoView', { block: 'center' })
		} else if (altKey) {
			e.preventDefault()
			if (typeof tipIndex !== 'number') tipIndex = -1

			// 10个可选项目, 索引可以是 -10 ~ 9
			if (keyCode === 38)
				tipIndex = (tipIndex - 1) % $('#statusDict .target').length
			else if (keyCode === 40)
				tipIndex = (tipIndex + 1) % $('#statusDict .target').length
			let tip = $('#statusDict').find('.target').eq(tipIndex)
			tipTargetText = tip.text()

			$('#statusDict .active').removeClass('active')
			tip.addClass('active')
			tip.parent().addClass('active')
			tip.get(0).scrollIntoView({ block: 'center' })
		}
	}
})
$(document).on('keyup', '#works .target', (e) => {
	let { originalEvent } = e
	let { keyCode, ctrlKey, shiftKey, altKey, repeat } = originalEvent
	if ((keyCode === 17 || keyCode === 18) && tipTargetText !== undefined) {
		SM.set(tipTargetText)
		tipTargetText = undefined
		tipIndex = undefined
		$('#tips .active, #statusDict .active').removeClass('active')
	}
})

// 鼠标右键，删除
$(document).on('contextmenu', '#tips td.no, #statusDict td.no', function (e) {
	e.preventDefault()
	let tar = $(e.target)
	let p, n, s, t, i
	if (tar.is('.selected')) {
		let parents
		parents = tar.parents('tbody')
		if (parents.length) {
			let trs = parents
				.eq(0)
				.find('.no.selected')
				.map((i, e) => e.parentElement)
				.sort((a, b) => {
					let ai = parseInt($(a).find('.index').text())
					let bi = parseInt($(b).find('.index').text())
					return ai > bi ? -1 : 1
				})
			let indexs = trs
				.find('.index')
				.map((i, e) => e.textContent)
				.toArray()
			if (confirm(`정말로 삭제하시겠습니까?\n${indexs}`)) {
				trs.each((_, tr) => {
					let p = $(tr)
					let s = p.find('td.source').text()
					let t = p.find('td.target').text()
					let i = parseInt(p.find('td.index').text())
					if (!Array.isArray(dict.array[i])) {
						return pushlog(`Index ${i}는 사전에 없는 행입니다.`)
					}
					if (s !== dict.array[i][0] && t !== dict.array[i][1]) {
						console.log(s, dict.array[i][0])
						return pushlog(
							`Index ${i}는 사전 위치 내용과 일치하지 않아 삭제하지 못했습니다!`
						)
					}
					dict.array.splice(i, 1)
					tr.remove()
				})
			}
		}
	} else {
		p = tar.parent('tr')
		n = p.find('td.no').text()
		s = p.find('td.source').text()
		t = p.find('td.target').text()
		i = parseInt(p.find('td.index').text())
		if (!Array.isArray(dict.array[i])) return pushlog('사전에 없는 행입니다.')

		if (s !== dict.array[i][0] && t !== dict.array[i][1])
			return pushlog('사전 위치 내용과 일치하지 않아 삭제하지 못했습니다!')

		if (
			(e.shiftKey && e.ctrlKey && e.altKey) ||
			confirm(`정말로 삭제하시겠습니까?`)
		) {
			let item = dict.array.splice(i, 1)

			$('#tips tr, #statusDict tr').each((_, tr) => {
				let $index = $(tr).find('td.index')
				let index = parseInt($index.text())
				if (i === index) {
					tr.remove() // 相同时删除
				} else if (i < index) {
					$index.text(index - 1)
				}
			})

			console.info(`[삭제] ${i} ${item.join('\n')}`)
			pushlog(`[삭제] ${i} ${item.join('\n')}`)
		}
	}
})

// console command
function removeTips() {
	let ret = []
	$('#statusDict tr').remove()
	$('#tips tr')
		.sort(
			(a, b) =>
				parseInt($(b).find('.index').text()) -
				parseInt($(a).find('.index').text())
		)
		.each((i, tr) => {
			let $tr = $(tr)
			let index = parseInt($tr.find('.index').text())
			let source = $tr.find('.source').text()
			let target = $tr.find('.target').text()

			if (!Array.isArray(dict.array[index]))
				return log('사전에 없는 행입니다', index, dict.array.length)
			if (source !== dict.array[index][0] && target !== dict.array[index][1])
				return log('사전 위치 내용과 일치하지 않아 삭제하지 못했습니다!')

			let item = dict.array.splice(index, 1)
			ret.push(source + '\t' + target)
		})
	log(ret.join('\n'))
}
function uniqueWorks() {
	$('#works')
		.find('tbody')
		.each((i, tbody) => {
			let uniqueSet = new Set()
			$(tbody)
				.find('tr')
				.each((i, tr) => {
					let $tr = $(tr)
					let source = $tr.find('td.source').text()
					if (uniqueSet.has(source)) tr.remove()
					else uniqueSet.add(source)
				})
		})
}

$('#uniqueWorksBtn').on('click', uniqueWorks)

// 删除隐藏行，删除空tbody
$('#removeHides').on('click', (e) => {
	$('#works').find('tr.hide, tr.hide1, tr.hide2').remove()
	$('#works tbody:empty').remove()
})

/* 
已知：（记忆文）
蓝色忍者武器65(单刃)	희귀 닌자 무기65(외날검)
紫色	영웅
蓝色	희귀
蓝莓	블루베리
紫菜	김

得出：（任务文）
紫色游侠武器65(弓)	


过程：
dmp对比后得出“蓝”和“紫”不同。（但是词库中有“蓝色”和“紫色”，没有“蓝”和“紫”）
任务文搜索“紫色”和“紫菜”，结果“紫色”被保留，“紫菜”被流放。
记忆文搜索“蓝色”和“蓝莓”，结果“蓝色”被保留，“蓝莓”被流放。
由于记忆候选和任务候选都只有一项，所以记忆文的译文需要替换。
*/
function smartMatchReplaceOfCase(source, dict) { }

// 横版

$('#chanheeModeSwitch').click((e) => {
	let v = e.target.checked
	let chanheeMode = document.querySelector('#chanheeMode')
	chanheeMode.disabled = !v
	v
		? chanheeMode.removeAttribute('disabled')
		: chanheeMode.setAttribute('disabled', '')
	tm.setItem('chanheeMode', v)
})

// 选中行插入工具
let selectedctl = {
	form: document.querySelector('#selectedctl'),
	get pos() {
		return this.form.elements.namedItem('selectedPos').value
	},
	get text() {
		return this.form.elements.namedItem('selectedText').value
	},
	get textType() {
		return this.form.elements.namedItem('selectedTextType').value
	},
	get selecteds() {
		let s = document.querySelectorAll('#works tr')
		let ret = []
		s.forEach((tr) => {
			if (tr.querySelector('.selected')) {
				if (!/\bhide/i.test(tr.className)) {
					ret.push(tr)
				}
			}
		})
		return ret
	},
}
document
	.querySelector('#selectedInsertButton')
	.addEventListener('click', function (e) {
		log('click')
		let { pos, text, textType, selecteds } = selectedctl
		let len = selecteds.length
		let regExp
		log(len, selectedctl)

		if (len && text && textType && pos) {
			if (textType === 'regexp') {
				try {
					regExp = new RegExp(text, 'gui')
				} catch (err) {
					return pushlog('정규식 오류!')
				}
			}
			selecteds.forEach((tr) => {
				let target = tr.querySelector('.target')
				if (textType === 'regexp') {
					let source = tr.querySelector('.source')
					text = source.textContent.match(regExp)
					if (text && Array.isArray(text) && text.length > 0) {
						text = text.join('')
					} else {
						return
					}
				}
				if (pos === 'begin') {
					target.insertAdjacentText('afterbegin', text)
				} else {
					target.insertAdjacentText('beforeend', text)
				}
			})
		} else {
			pushlog('삽입 오류!')
		}
	})

async function downloadDicts() {
	const RE = /_(?<pname>[A-Z0-9a-z]+)/
	let time = ftime().replace(/\//g, '').replace(/:/g, '').replace(/ |\./g, '_') // 格式化的当前时间串
	let filename = `tm4_dicts_${time}.xlsx`
	let workbook = XLSX.utils.book_new()

	let keys = await tm.keys()
	for (let i = 0; i < keys.length; i++) {
		let k = keys[i]
		let m = k.match(RE)
		if (m) {
			const {
				groups: { pname },
			} = m // 焦点1：项目名——pname
			try {
				pname = decodeURI(pname.replace(/_/g, '%'))
			} catch (err) {
				console.debug(pname, '无法decodeURI')
			}
			let arr = await tm.getItem(k) // 焦点2：项目数据——arr
			let sheet = XLSX.utils.aoa_to_sheet(arr)
			try {
				XLSX.utils.book_append_sheet(workbook, sheet, pname.substr(0, 31))
			} catch (err) {
				console.error(k, pname, err)
				return
			}
		}
	}
	// wopts = { bookType: 'xlsx', bookSST: false, type: 'array' };
	// wbout = XLSX.write(workbook, wopts);
	XLSX.writeFile(workbook, filename)
}

$('#downloadDictsXLS').click(downloadDicts)

// quick debug code
Object.defineProperty(window, 'no', {
	get() {
		return document.querySelector('#works .currentEditRow .no')
	},
})
Object.defineProperty(window, 'source', {
	get() {
		return document.querySelector('#works .currentEditRow .source')
	},
})
Object.defineProperty(window, 'target', {
	get() {
		return document.querySelector('#works .currentEditRow .target')
	},
})
Object.defineProperty(window, 'statusDict', {
	get() {
		return $('#statusDict tr')
			.toArray()
			.map((e) =>
				Array.from(e.querySelectorAll('.source,.target'), (e) => e.textContent)
			)
	},
})

function parseLocationSearch(dk, dv) {
	// dk  空时默认键?=v(?dk=v)
	// dv  空时默认值?k=(?k=dv)
	let rs = {}
	location.search
		.slice(1)
		.split('&')
		.forEach(function (e) {
			if (e) {
				let [k, v] = e.split('=')
				let temp
				k = k ? decodeURI(k) : dk
				v = v ? decodeURI(v) : dv
				try {
					v = JSON.parse(v)
				} catch (err) { }
				rs[k] = v
			}
		})
	return rs
}

/* 
背景图片
*/
// async function backgroundImage() {
// 	let blob = await localforage.getItem('bgImage')
// 	let draw = function(blob){
// 		let url = URL.createObjectURL(blob)
// 		url = `url(${url})`
// 		log(url)
// 		setTimeout(()=>{
// 			let s = document.body.style
// 			s.backgroundImage = url
// 			// s.backgroundRepeat = 'no-repeat'
// 			// s.backgroundSize = 'cover'
// 			s.backgroundSize = 'contain'
// 			// s.backgroundPosition = 'right bottom'
// 			s.backgroundPosition = 'left'
// 			s.minHeight = '100vh'
// 		},1000)
// 	}
// 	if(!blob) {
// 		let res = await fetch('bg.jpg')
// 		blob = await res.blob()
// 		await localforage.setItem('bgImage', blob)
// 	}
// 	draw(blob)
// }

// document.addEventListener('DOMContentLoaded', backgroundImage)
// window.addEventListener('blur', (e)=>{
// 	document.body.style.backgroundBlendMode = 'luminosity'
// 	document.body.style.filter = 'grayscale(1)'
// })
// window.addEventListener('focus', (e)=>{
// 	document.body.style.backgroundBlendMode = ''
// 	document.body.style.filter = ''
// })

function requestRename(id) {
	s.emit(
		'cmd',
		id || oid,
		`
	let id = prompt('안녕하세요!사용자 이름을 변경해 주세요.^^', localStorage.getItem('oid'));
	if(id && id!===oid) {
		oid=id;
		localStorage.setItem('oid',id);
		let b = confirm('지금 새로고침 하시겠습니까?');
		if(b) {
			location.reload();
		}
	}
	id;`,
		console.log
	)
}

function randstr() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2, 10)
}

//只填充source为100%匹配的内容。别忘了填充最新的！
function quandeng() {
	let count = 0
	document.querySelectorAll('#works tbody tr').forEach(function (tr) {
		let source = tr.querySelector('.source')
		let target = tr.querySelector('.target')
		target.classList.remove(
			'done',
			'doneAutoNumber',
			'doneAuto',
			'doneSmart',
			'doneAutoSpace'
		)
		let sourceText = source.textContent
		let a = dict.array
		let i = a.length
		let item
		//词库的倒序就是最新的！
		while (i-- >= 0) {
			let e = a[i]
			if (e && e[0] === sourceText) {
				item = e
				break
			}
		}
		if (item) {
			target.textContent = item[1]
			target.classList.add('doneAuto')
		} else {
			count++
		}
	})
	console.log(`还剩${count}个需要翻译。`)
}
document.querySelector('#MatchWork100re').addEventListener('click', quandeng)

/* 
撤销与重做（CTRL-Z，CTRL-R）

作用范围，当前激活的编辑框为#works td时
激活时间，格子的focus事件
注销时间，格子的blur事件
量，最多30个
技术，侦听change事件，记录所有变化
*/
{
	let records, index
	resetRecords()

	function resetRecords() {
		records = []
		index = -1
	}

	let timeout = NaN
	let works = document.querySelector('#works')
	works.addEventListener(
		'focus',
		function (e) {
			let { target } = e
			let s = target.classList
			let isValidateScope =
				(target.nodeName === 'TD' && s.contains('source')) ||
				s.contains('target')
			if (isValidateScope) {
				// console.log('开始记录历史', isValidateScope);
				records.push(target.textContent)
				index++
				target.addEventListener('input', oninput, {
					passive: false,
					once: false,
					capture: true,
				})
				target.addEventListener('keydown', ondo, {
					passive: false,
					once: false,
					capture: true,
				})
			} else {
				s.emit('cs', '[异常] 焦点对象不是侦听范围!(5e310ee908b50b27894226e3)')
				console.warn('焦点对象不是侦听范围', target)
			}
		},
		{ passive: false, once: false, capture: true }
	)
	works.addEventListener(
		'blur',
		function (e) {
			let { target } = e
			let s = target.classList
			let isValidateScope =
				(target.nodeName === 'TD' && s.contains('source')) ||
				s.contains('target')
			if (isValidateScope) {
				// console.log('结束记录历史', isValidateScope);
				target.removeEventListener('input', oninput)
				target.removeEventListener('keydown', ondo)
				resetRecords()
			} else {
				s.emit('cs', '[异常] 焦点对象不是侦听范围!(5e310ef708b50b27894226e4)')
				console.warn('焦点对象不是侦听范围', target)
			}
		},
		{ passive: false, once: false, capture: true }
	)
	function oninput(e) {
		let text = e.target.textContent
		if (!records.some((e) => e === text)) {
			clearTimeout(timeout)
			timeout = setTimeout(() => {
				records.push(text)
				records = records.slice(-20)
				++index
			}, 200)
		}
	}
	function ondo(e) {
		let k = hotkey(e, '+')
		switch (k) {
			case 'ctrl+z':
				undo(e)
				break
			case 'ctrl+y':
				redo(e)
				break
			default:
				break
		}
	}
	function undo(e) {
		e.preventDefault()
		e.stopPropagation()
		if (e.repeat) {
			return false
		}
		let min = 0
		let max = records.length
		index = Math.max(min, --index)
		let text = records[index]
		e.target.textContent = text
		// console.log(index, text);
	}
	function redo(e) {
		e.preventDefault()
		e.stopPropagation()
		if (e.repeat) {
			return false
		}
		let min = 0
		let max = records.length - 1
		index = Math.min(max, ++index)
		let text = records[index]
		e.target.textContent = text
		// console.log(index, text);
	}
}

/* 
invoice: 收支确认.
세금계산서: 법적 세금 신고 절차. 메일만 발송 가능.
*/
// {
// 	let keyboard = 0, mouse = 0, timeout = NaN;
// 	function send() {
// 		clearTimeout(timeout);
// 		timeout = setTimeout(() => {
// 			s.emit('cs', { keyboard, mouse, oid, time: new Date().localeTime });
// 		}, 1000);
// 	}
// 	window.addEventListener('keydown', function (e) {
// 		keyboard++;
// 		send();
// 	});
// 	window.addEventListener('mousedown', function (e) {
// 		mouse++;
// 		send();
// 	});
// }

// {
// // 循环切换网站favicon。 loop change images
// 	function* nexter() {
// 		let i = 0;
// 		while (true) {
// 			i = i % 50;
// 			yield ++i;
// 		}
// 	}

// 	let z = nexter();

// 	let favicon = document.head.querySelector('link[rel=icon]');

// 	let urls = {};

// 	if(favicon) {
// 		setInterval(() => {
// 			let i = z.next().value;
// 			// let url = '/img/spring/'+i.toString().padStart(3,'0')+'.png';
// 			let url = '/img/superhero/'+i.toString().padStart(3,'0')+'.png';

// 			if(!urls[i]) {
// 				fetch(url).then(res=>{
// 					if(res.ok) {
// 						res.blob().then(blob=>{
// 							urls[i] = URL.createObjectURL(blob);
// 							favicon.setAttribute('href', urls[i]);
// 							// console.log(favicon);
// 						})
// 					}
// 				})
// 			}else{
// 				favicon.setAttribute('href', urls[i]);
// 				// console.log(favicon);
// 			}
// 		}, 5000);
// 		// console.log('有favicon', favicon)
// 	}else{
// 		console.warn('没有找到favicon', favicon)
// 	}
// }

{
	// 删除项目 removeProject
	$('#projectAnchors').on('contextmenu', (e) => {
		e.preventDefault()

		let { target, shiftKey } = e

		//<a href=....>
		if (target.nodeName === 'A') {
			let name = target.textContent

			if (!confirm(`경고! 프로젝트(${name}) 삭제는 복구 불가하니, 미리 백업하시기 바랍니다. 지금 삭제하시겠습니까?`)) return false

			//兼容旧版本参数
			let names = [
				`_${name}dict`,
				`_${name}netTarget`,
				`_${name}useDaum`,
				`_${name}useDictTip`,
				`_${name}useNaver`,
				`_${name}useNet`,
				`_${name}works`,
				`_${name}worksFontSize`,
			]

			isRemoveProject = true

			let keyName = `_${name}`
			tm.removeItem(keyName, (err, result) => {
				if (err) {
					console.error(err)
					alert(err)
				} else {
					console.log('[Delete]', `${name}(${keyName})`, { err, result })
					target.remove()//태그
				}
			})
		}
	})

	function counter(element, i = 5, y) {
		let e = element.querySelector('.counter.number')
		if (!e) {
			e = element.appendChild(document.createElement('span'))
			e.className = 'counter number'
			e.style.fontSize = '9px'
		}

		let interval = setInterval(() => {
			if (--i < 0) {
				y()
			} else {
				e.textContent = ` - ${i}s`
			}
		}, 1000)

		return () => {
			if (e.isConnected) e.remove()
			clearInterval(interval)
		}
	}
}

// 2020/02/05  Ctrl+Pause快捷键实现选区内拼凑
function doneFill(source, target, arr) {
	let sourceText = source.textContent
	let resultText = ''

	let results = []
	let cursor = 0
	// 句子，从左到右进行正则匹配。
	// 正则列表初始来源于#statusDict的.source
	// 但随着句子指针的向右偏移，列表内容找不到匹配的项可以下一轮不用尝试了。
	// 每次尝试匹配后，需要去掉没有匹配的.source正则，而句子指针需要相应地向右移动。
	// 如果指针移动到最后位置，或者已经没有可以进行正则的项目时，该匹配任务结束。
	// 根据匹配内容，拼凑出最终结果。

	let result,
		startIndex,
		count = sourceText.length
	while (count-- > 0) {
		result = undefined
		sourceText = sourceText.slice(cursor)
		startIndex = sourceText.length
		if (startIndex > 0) {
			arr = arr.filter((e) => !e.done)
			if (arr.length === 0) break
			arr.forEach((e) => {
				let [s, t, i] = e
				let re = new RegExp(
					s
						.split('')
						.map((e) => {
							// 重点！！数值不用加\\
							if (/[A-Z0-9a-z]/.test(e)) {
								return e
							} else {
								return '\\s*\\' + e
							}
						})
						.join(''),
					'i'
				)
				let m = re.exec(sourceText)
				if (m) {
					let text = m[0]
					let start = m.index
					let end = start + text.length
					if (start < startIndex) {
						result = { s, t, i, text, start, end } // targetText
						startIndex = start
						cursor = end
					} else if (start === startIndex) {
						if (end > result.end) {
							result = { s, t, i, text, start, end } // targetText
							startIndex = start
							cursor = end
						} else if (end === result.end && result.i < i) {
							result = { s, t, i, text, start, end } // targetText
							startIndex = start
							cursor = end
						}
					}
				} else {
					e.done = true
				}
			})
		} else {
			break
		}

		if (result) results.push(result)
	}

	if (results.length) {
		let tar = target
		if (tar) {
			let v = results.map((e) => e.t)
			let splitter = ''
			if (v.some((e) => /[가-힣]/.test(e))) {
				splitter = ' '
			}
			v = results.map((e) => e.t).join(splitter)
			tar.textContent = v
			results.forEach((e) => {
				pushlog(e.s + ' = ' + e.t)
			})
		}
	}
}

let workerDoneFill
window.addEventListener('keydown', function (event) {
	let hk = hotkey(event, '+')
	if (hk === 'ctrl+pause') {
		// console.log('donefill-start')
		event.preventDefault()
		event.stopPropagation()
		event.stopImmediatePropagation()
		if (workerDoneFill) workerDoneFill.terminate() // 已有时终止先前worker

		let parent, source, target
		let tds = Array.from(document.querySelectorAll('#main td.selected'))
		function* next() {
			let td
			while ((td = tds.shift())) {
				yield td
			}
		}
		let n = next()
		let item

		function fill(event) {
			let { data } = event

			if (data && Array.isArray(data)) {
				doneFill(source, target, data)
				// console.log(data)
				console.log(source)

				if (item) item.value.classList.remove('selected')
			}

			item = n.next()
			if (item.done) {
				workerDoneFill.terminate()
				workerDoneFill = undefined
				parent = undefined
				source = undefined
				target = undefined
			} else {
				parent = item.value.parentElement
				console.log(parent)
				source = parent.querySelector('.source')
				target = parent.querySelector('.target')
				target.className = 'target'
				workerDoneFill.postMessage([source.textContent, dict.array])
			}
		}

		workerDoneFill = new Worker('donefill.js')
		workerDoneFill.addEventListener('message', fill)

		fill({ data: undefined })
	}
})

// 比如10000字，需要5天完成的话，nsplit(10000,5)，结果为[2000, 4000, 6000, 8000, 10000]。
function nsplit(total, day) {
	return Array.from(new Array(day), (e, i) => Math.ceil(total / day) * (i + 1))
}

// patern trans <F7>
let paterntransWindow
let paterntransTarget
window.addEventListener('keydown', (event) => {
	if (event.repeat) return
	if (
		event.keyCode === 118 &&
		!event.ctrlKey &&
		!event.altKey &&
		!event.shiftKey &&
		!event.metaKey
	) {
		event.preventDefault()
		event.stopPropagation()
		event.stopImmediatePropagation()

		paterntransWindow = wopen('paterntrans.html', {
			name: 'paterntans',
			width: 640,
			height: 480,
			screenX: (screen.availWidth - 640 / 2) / 1.8,
			screenY: (screen.availHeight - 480 / 2) / 1.8,
		})

		paterntransTarget = event.target

		document.querySelector('#useAutoReplaceTarget').checked = false
	}
})

window.addEventListener('message', (e) => {
	let { data } = e
	console.log(data)
	if (data) {
		switch (data.type) {
			case 'paterntrans-filter':
				filterWorks(data.source, data.begin, data.end)
				break
			case 'paterntrans-apply':
				applyWorks(data.source, data.begin, data.end, data.target)
				break
			case 'init':
				let e = document.querySelector('#works tr.currentEditRow')
				if (paterntransWindow && e) {
					paterntransWindow.postMessage({
						type: 'init',
						source: e.querySelector('.source').textContent,
						target: e.querySelector('.target').textContent,
					})
				}
				break
			case 'close':
				document.querySelector('#useAutoReplaceTarget').checked = true
				document
					.querySelectorAll('#works tbody[dataname="paternclips"]')
					.forEach((e) => e.remove())
				showAll()
				if (paterntransTarget)
					paterntransTarget.scrollIntoView({
						block: document.querySelector('#focusScrollBlock').value,
					})
				break
		}
	}

	function makeRegExp(patern, begin = true, end = true) {
		if (!Array.isArray(patern) || patern.length === 0)
			throw new Error(JSON.stringify(patern))
		let p = ''
		if (begin) p += '^'
		patern.forEach((e) => {
			switch (typeof e) {
				case 'string':
					p += e
					break
				case 'object':
					if (e.type === 'regexp') {
						p += e.name
						break
					} else if (e.type === 'symbol') {
						p += '(?<' + e.name + '>[\\s\\S]+?)'
						break
					}
			}
		})

		if (end) p += '$'

		return new RegExp(p, 'i')
	}

	function makeDoc(sourceText, regExp) {
		let m = regExp.exec(sourceText)
		return m && m.groups ? Object.values(m.groups) : []
	}
	function filterWorks(patern, begin, end) {
		let regExp = makeRegExp(patern, begin, end)
		console.log(regExp)

		let texts = new Set()
		Array.from(document.querySelectorAll('#works tr')).forEach((tr) => {
			let n = tr.querySelector('.no')
			let s = tr.querySelector('.source')
			let t = tr.querySelector('.target')

			makeDoc(s.textContent, regExp).forEach((text) => texts.add(text))

			if (regExp.test(s.textContent)) {
				tr.classList.remove('hide')
				tr.classList.remove('hide2')
			} else {
				tr.classList.add('hide')
				tr.classList.add('hide2')
			}
		})

		document
			.querySelectorAll('#works tbody[dataname="paternclips"]')
			.forEach((e) => e.remove())
		let tbody = document.createElement('tbody')
		tbody.setAttribute('dataname', 'paternclips')
		document.querySelector('#works').appendChild(tbody)

		texts = Array.from(texts)
		console.log(texts)
		texts.forEach((text, i) => {
			let tr, td
			tr = tbody.appendChild(document.createElement('tr'))
			td = tr.appendChild(document.createElement('td'))
			td.className = 'no'
			td.textContent = i + 1
			td = tr.appendChild(document.createElement('td'))
			td.className = 'source'
			td.textContent = text
			td = tr.appendChild(document.createElement('td'))
			td.className = 'target'

			let o = dict.search(text, 100)[0]
			if (o) {
				td.textContent = o[1]
				td.classList.add('doneAuto')
			}
		})
	}

	function applyWorks(source, begin, end, target) {
		let trs = Array.from(document.querySelectorAll('#works tr:not(.hide):not(.hide2)')).filter(
			(tr) => {
				return (
					!tr.classList.contains('hide') &&
					!tr.classList.contains('hide2') &&
					tr.parentElement.getAttribute('dataname') !== 'paternclips'
				)
			}
		)
		if (trs.length === 0) return console.warn('没有数据')

		let regExp = makeRegExp(source, begin, end)
		console.log(regExp)

		trs.forEach((tr) => {
			let s = tr.querySelector('.source')
			let t = tr.querySelector('.target')
			t.className = 'target'

			let matchedTargets = {}
			let m = regExp.exec(s.textContent)
			if (m && m.groups) {
				for (let k in m.groups) {
					let result = dict.search(m.groups[k], 100)
					result = result[0]
					if (result) {
						matchedTargets[k] = { v: result[1], p: 100 }
					} else if (
						/(?:[\-\+] *)?(?:,?\d{1,3})*(?:\.?\d+)(?:(?:e)\d+)?(?: *%)?/.test(
							m.groups[k]
						) ||
						/\p{Number}+/u.test(m.groups[k])
					) {
						matchedTargets[k] = { v: m.groups[k], p: 100 }
					}
				}
			}
			// console.log(matchedTargets);
			let r = ''
			target.forEach((e) => {
				switch (typeof e) {
					case 'string':
						r += e
						break
					case 'object':
						let o = matchedTargets[e.name]
						if (o) {
							r += o.v
						} else {
							r += '▩'
						}
						break
				}
			})

			t.textContent = r
		})
	}
})

document.querySelector('#showAllButton').addEventListener('click', showAll)

document
	.querySelector('#clearTargetButton')
	.addEventListener('click', (event) => {
		document.querySelectorAll('#works tr').forEach((tr) => {
			if (tr.classList.contains('hide')) return
			if (tr.classList.contains('hide2')) return
			let td = tr.querySelector('.target')
			td.textContent = ''
			td.className = 'target'
		})
	})

//매치율 입력 제한
function normalizeNumber(v, d = 50) {
	v = parseInt(v, 10)
	if (v === NaN) v = d
	return v
}
function normalizeSimilarInput(input) {
	if (!(input instanceof Element)) return
	let oldValue = normalizeNumber(input.value)
	input.addEventListener('keydown', function () {
		let k = hotkey(event)
		if (!/^\d|up|down|left|right|delete|back$/.test(k)) {
			return event.preventDefault()
		}
	})
	input.addEventListener('input', function () {
		let { target } = event
		let value = normalizeNumber(target.value)
		value = Math.min(100, value)
		value = Math.max(0, value)
		target.value = Number.isNaN(value) ? 0 : value
	})
}
normalizeSimilarInput(document.querySelector('#similarPercent'))
normalizeSimilarInput(
	document.querySelector('#similarPercentAutoReplaceTarget')
)

// 修改文档名称
let lastMousedownTimestamp = 0
$(document.body).on('mousedown', '#works tbody', function (e) {
	let now = Date.now()
	if (now - lastMousedownTimestamp < 300) {
		let { target, which } = e
		if (which === 1 && $(target).is('#works tbody')) {
			e.preventDefault()
			let oldValue = target.getAttribute('dataname')
			let value = prompt(`이름을 변경하세요!`, oldValue) || oldValue
			if (value) {
				target.setAttribute('dataname', value)
			}
		}
	}
	lastMousedownTimestamp = Date.now()
	return true
})

$('#downloadDictsTxt').click(downloadDictsTxtHandle)
async function downloadDictsTxtHandle(ev) {
	const RE = /_(?<pname>[A-Z0-9a-z]+)/
	let time = ftime().replace(/\//g, '').replace(/:/g, '').replace(/ |\./g, '_') // 格式化的当前时间串
	let filename = `tm4_dicts_${time}.zip`
	let zip = new JSZip()

	let keys = await tm.keys()
	let hasFile = false
	for (let i = 0; i < keys.length; i++) {
		let k = keys[i]
		let m = k.match(RE)
		if (m) {
			const {
				groups: { pname },
			} = m // 焦点1：项目名——pname
			try {
				if (pname.indexOf('__' === -1) && pname.indexOf('_') > -1) {
					pname = pname.replace(/_([A-Z0-9a-z]{2})/g, '%$1')
					if (pname.indexOf('%') > -1) {
						pname = decodeURI(pname)
					}
				}
			} catch (err) {
				console.debug(pname, '无法decodeURI')
			}

			let o = await tm.getItem(k)
			if (o && o.dictArray) {
				// 焦点2：项目数据——arr
				let arr = o.dictArray // 焦点2：项目数据——arr
				let content = arr.map((e) => e.join('\t')).join('\n')
				if (content) {
					zip.file(pname + '.txt', content)
					hasFile = true
				}
			}
		}
	}
	// wopts = { bookType: 'xlsx', bookSST: false, type: 'array' };
	// wbout = XLSX.write(workbook, wopts);
	if (hasFile) {
		return zip
			.generateAsync({
				type: 'blob',
				mimeType: 'application/zip',
				compression: 'DEFLATE',
			})
			.then(function (z) {
				if (ev) {
					downloadFile2(filename, z)
				} else {
					return z
				}
			})
	}
}

$('#removeAllDicts').on('click', async (ev) => {
	await downloadDictsTxtHandle()
	await exportDictTranslationMemoryFile()
	//dict.array = [];
	//location.reload();
})

$('#importDict').on('click', function (ev) {
	let el = document.querySelector('#importDictInput')
	if (!el) {
		el = document.createElement('input')
		el.id = 'importDictInput'
		el.hidden = true
		el.type = 'file'
		el.accept = '.txt;.zip'
		el.multiple = true
		el.addEventListener('change', updateOneDictFile)
		document.body.appendChild(el)
	}
	el.click()
})
async function updateOneDictFile(ev) {
	let { files } = ev.target
	let map = new Map()

	for (let i = 0, len = files.length; i < len; i++) {
		//file: { name, size, type, lastModified, lastModifiedDate, webkitRelativePath }
		let file = files.item(i)
		await new Promise((resolve, reject) => {
			let fr = new FileReader()
			fr.readAsText(file)
			fr.onload = (ev) => {
				let v = fr.resultText
				if (v) {
					let k = file.name.replace(/\.txt$/, '')
					file.k = k
					file.v = v
					console.log(k, v)
				}
				resolve()
			}
			fr.onerror = fr.onabort = () => reject()
		})
		console.log(file.k, file.v, file.lastModified)
	}
}

dict = new Reference([])
function addDict(a) {
	a = a || []
	if (typeof dict === 'undefined') {
		dict = new Reference(a)
		console.debug('[로그] 신규 사전')
	} else {
		dict.concat(a)
		console.debug('[로그] 사전 추가', a.length)
	}
	document.querySelector('#dictArrayLengthUI').textContent = dict.array.length
	document.querySelector('#dictArrayTimeUI').textContent = ftime('H:i:s')
}
function dictPasteHandle(e) {
	e.preventDefault()
	var t = e.originalEvent.clipboardData.getData('text/plain').trim()
	var a = ao.stringToArray(t)
	a = a.filter(function (e) {
		return e instanceof Array && e[0] && e[1] && e[0].length && e[1].length
	})
	addDict(a)
	console.log(dict)
	var oldDictArrayLength = dict.array ? dict.array.length : 0
}

/* 
导出 indexedDB 的数据。
- 编译 json文件。
- 导出 zip 文件。
*/
function exportDictTranslationMemoryFile() {
	let rs = {}
	return tm
		.iterate(function (v, k, id) {
			if (v) {
				rs[k] = v.dictArray
			} else {
				rs[k] = []
				console.warn(`警告！键名${k}没有值！（可能是旧版本未能更新导致）`)
			}
		})
		.then(() => {
			let time = ftime()
				.split(/[ .]/)
				.map((e) => e.replace(/[^\d]/g, ''))
				.join('-') // 格式化的当前时间串
			return toZip('TM4-EXPORT-TM-' + time + '.zip', JSON.stringify(rs))
		})
}
async function toZip(filename, data) {
	let zip = new JSZip()
	zip.file('data.json', data)
	return zip
		.generateAsync({
			type: 'blob',
			mimeType: 'application/zip',
			compression: 'DEFLATE',
		})
		.then(function (z) {
			downloadFile2(filename, z)
		})
}
//统一导出导入配置文件的用户界面
{
	let exporting = false
	let siblling = document.querySelector('#dictPaste')
	function createButton(id, icon, text) {
		let button, iconSpan, textSpan
		button = document.createElement('button')
		button.setAttribute('id', id)
		iconSpan = document.createElement('span')
		iconSpan.classList.add('icons', icon)
		textSpan = document.createElement('span')
		textSpan.style.setProperty('font-size', '9pt', '!important')
		textSpan.textContent = text
		button.append(iconSpan, textSpan)
		return button
	}
	let eb = createButton(
		'exportDictTranslationMemoryFile',
		'icon_download',
		'Export TM'
	)
	let ib = createButton(
		'importDictTranslationMemoryFile',
		'icon_upload',
		'Import TM'
	)
	let importDTMInput = document.createElement('input')
	importDTMInput.type = 'file'
	importDTMInput.multiple = false
	importDTMInput.accept = 'zip'
	importDTMInput.oninput = function (ev) {
		let file = importDTMInput.files[0]
		if (file) {
			//console.log('选中文件', file);
			//解压缩文件
			let zip = new JSZip()
			zip.loadAsync(file).then(function (o) {
				//o : { clone(), comment:null, files:{ data.json: i }, root:'' }
				//i : { date, name, asText, asBinary, asArrayBuffer, asUint8Array, async }
				let filename = 'data.json'
				o = o.files
				if (filename in o) {
					importDTMInput.disabled = true
					zip
						.file(filename)
						.async('string')
						.then((str) => {
							let d = JSON.parse(str)
							void (async function updateDatabase() {
								let msgs = []
								for (let k in d) {
									let v = d[k]
									let value = await tm.getItem(k)
									if (value) {
										let ov = value.dictArray
										if (Array.isArray(ov)) {
											value.dictArray = uniqueTMs(0, 1, ov, v)
											let msg = `[${k}] ${ov.length} + ${v.length} ==> ${value.dictArray.length}`
											pushlog(msg)
											msgs.push(msg)
										} else {
											value.dictArray = v
											let msg = `[${k}] NaN + ${v.length} ==> ${value.dictArray.length}`
											pushlog(msg)
											msgs.push(msg)
										}
									} else {
										value = { dictArray: v, worksHTML: '' }
										let msg = `[${k}] null ==> ${value.dictArray.length}`
										pushlog(msg)
										msgs.push(msg)
									}
									await tm.setItem(k, value)
								}
								alert(msgs.join('\n'))
								window.removeEventListener('beforeunload', beforeunloadHandle) //由于刷新页面时会保存内存中的TM，所以取消侦听（刷新自动保存）
								location.reload() //数据库更新完毕后，才可以刷新页面。
							})()
						})
				} else {
					console.log('格式不符', o)
				}
			})
		} else {
			console.warn('没有文件')
		}
	}
	siblling.after(eb, ib)
	eb.addEventListener('click', function () {
		if (exporting) {
			console.warn('请耐心等候……')
		} else {
			console.warn('开始导出。')
			exporting = true
			eb.style.setProperty('background-color', 'var(--blue)', 'important')

			exportDictTranslationMemoryFile().then(() => {
				eb.style.removeProperty('background-color')
				exporting = false
			})
		}
	})
	ib.addEventListener('click', function () {
		importDTMInput.click()
	})
}

function uniqueTM(sourceKey = 0, targetKey = 1, tm) {
	//删除重复记录（反冗余）
	//上一个出现的重复记录将被删除（新追加）
	let rs = []
	tm.forEach((tmRow) => {
		let tmSourceText = tmRow[sourceKey]
		let tmTargetText = tmRow[targetKey]
		let rsIndex = rs.findIndex((rsRow) => {
			let rsSourceText = rsRow[sourceKey]
			let rsTargetText = rsRow[targetKey]
			return rsSourceText === tmSourceText && rsTargetText === tmTargetText
		})
		if (rsIndex !== -1) {
			rs.splice(rsIndex, 1)
		}
		rs.push(tmRow)
	})
	return rs
}
function uniqueTMs(sourceKey = 0, targetKey = 1, ...tms) {
	//整合多个记录集合
	let rs = []
	tms.forEach((tm) => {
		rs = rs.concat(tm)
	})
	rs = uniqueTM(sourceKey, targetKey, rs)
	return rs
}
function test_uniqueTM() {
	//测试功能可用性
	let tm1 = [
		['a', 'A1'],
		['a', 'A2'],
		['a', 'A1'],
		['a', 'A3'],
		['b', 'B'],
		['c', 'C'],
		['c', 'C'],
	]
	let tm2 = [
		['d', 'D1'],
		['d', 'D2'],
		['e', 'E'],
		['e', 'E'],
		['a', 'A2'],
	]
	console.log(uniqueTMs(0, 1, tm1, tm2).join('\n'))
}

function createMachineId() {
	let date = Date.now().toString(36)
	let rand = Math.random().toString(36).slice(2)
	return `${date}-${rand}`
}

/* 
dmp可以找到两个句子的不同点。
如果是紧挨着的。那么就可以这么处理。
若翻译记录中各存在一个ins和del且紧挨着时，
1）找一下是否有ins和del记录，如果有则尝试自动完成；
2）与ins和del前后几个相邻字符补齐后查找是否有记录，如有则尝试自动完成。
3）步骤2的进化，去掉或补充助词，如의,와,과

*/
requestAnimationFrame(() => {
	let tipUI = document.querySelector(String.raw`div[name="tip-uniqtips"]`)
	if (tipUI === null) {
		tipUI = document.body.appendChild(document.createElement('div'))
		tipUI.setAttribute('name', 'tip-uniqtips')
	}
	new MutationObserver((mutations, observer) => {
		let searchLength = Number(document.querySelector('#doneAutoReplaceLength').value)
		if (isNaN(searchLength)) searchLength = 0

		//console.log('isArray', Array.isArray(mutations))
		let sDel = tipUI.querySelectorAll('del')
		let sIns = tipUI.querySelectorAll('ins')

		if (sIns.length === 1 && sDel.length === 1) {
			sDel = tipUI.querySelectorAll('del').item(0)
			sIns = tipUI.querySelectorAll('ins').item(0)

			let ins = sIns.textContent
			let del = sDel.textContent
			if (ins.length > searchLength || del.length > searchLength) return console.log('超出搜索长度')

			ins = dict.search(sIns.textContent, 95)[0]//[sourceText,targetText,percentive,index]
			del = dict.search(sDel.textContent, 95)[0]
			//console.log('[raw]', ins, del)
			if (del && ins) {
				del = del[1]
				ins = ins[1]
				if (!del) return
				if (!ins) return
				let target = document.querySelector('.currentEditRow .target')
				let textOld = target.textContent
				let textNew = textOld.replace(del, ins)
				if (textOld !== textNew) {
					target.textContent = textNew
					target.classList.add('doneSmart')
					console.log('[R1]', ins, '==>', del)
				} else {
					console.log('[R1] no', del, '-->', ins)
				}
			} else {
				let delPreviousSibling = sDel.previousSibling
				let insNextSibling = sIns.nextSibling
				let textPrevious = ''
				let textNext = ''
				if (!ins && insNextSibling) {
					let text = insNextSibling.textContent
					let index = text.indexOf(' ')
					if (index === -1) {
						textNext = text
					} else {
						textNext = text.slice(0, index)
					}
				}

				if (!del && delPreviousSibling) {
					let text = delPreviousSibling.textContent
					let index = text.lastIndexOf(' ')
					if (index === -1) {
						textPrevious = text
					} else {
						textPrevious = text.slice(index)
					}
				}

				del = textPrevious + sDel.textContent + textNext
				ins = textPrevious + sIns.textContent + textNext
				if (ins.length > searchLength || del.length > searchLength) return console.log('超出搜索长度')

				//console.log(dict)
				//console.log('[new]', ins, del)
				del = dict.search(del, 95)
				ins = dict.search(ins, 95)
				//console.log(del, ins)

				if (del.length && ins.length) {
					del = del[0][1]
					ins = ins[0][1]
					if (!del) return
					if (!ins) return
					let target = document.querySelector('.currentEditRow .target')
					let textOld = target.textContent
					let textNew = textOld.replace(del, ins)
					if (textOld !== textNew) {
						target.textContent = textNew
						target.classList.add('doneSmart')
						console.log('[R2]', ins, '==>', del)
					}
				}
				console.log('[R2]')
			}
		}
	}).observe(tipUI, { attributes: !true, childList: true, subtree: true })
})



function printTips() {
	let arr = Array.from(document.querySelector('#tips').querySelectorAll('tr'), (tr) => { return [tr.querySelector('.source').textContent, tr.querySelector('.target').textContent] })
	console.log(arr)
	console.log(arr.map(([s, t]) => `${s}\t${t}`).join('\n'))
}


function findAll(word) {
	let re = new RegExp(word, 'i')
	tm.iterate((d, k) => {
		let dict = d.dictArray
		if (Array.isArray(dict)) {
			dict.forEach(([s, t]) => {
				if (re.test(s.replace(/\s+/g, ''))) console.log(s, t)
			})
		}
	})
}

document.querySelector('#removeDictForDoc').addEventListener('click', () => {
	//从翻译记录中，删除当前文档中的内容。
	let delete_indexs = new Set()
	Array.from(document.querySelectorAll('#works tr:not(.hide):not(.hide2)')).some((tr, i) => {
		let s = tr.querySelector('.source')
		let t = tr.querySelector('.target')
		let sx = s.textContent
		let tx = t.textContent
		dict.array.forEach(([dsx, dtx], di) => dsx === sx && dtx === tx ? delete_indexs.add(di) : false)
	})
	let msg = `正在删除共 ${delete_indexs.size} 个记录。`
	pushlog(msg)
	console.log(msg)

	delete_indexs = Array.from(delete_indexs)
	delete_indexs = delete_indexs.sort((a, b) => a < b ? 1 : -1)
	delete_indexs.forEach(di => dict.array.splice(di, 1))

	msg = '已' + msg.slice(2)
	pushlog(msg)
	console.log(msg)
})