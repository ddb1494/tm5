const { log, time, timeEnd } = console
let works, tr, no, source, target, info;
let i = 0, len = 1000// 数量越少，输入越快。在输入框中按住w就能看到卡不卡了。


works = document.querySelector('#works')
works.frame = ['void', 'above', 'below', 'hsides', 'vsides', 'lhs', 'rhs', 'box', 'border'][7]
works.border = '1px solid red'
works.rules = ['none', 'groups', 'rows', 'cols', 'all'][2]
works.summary = 'demo table'
// works.width = '100%'
works.style.width = '100%'


let thead = document.createElement('thead')
works.appendChild(thead)
let tbody = document.createElement('tbody')
works.appendChild(tbody)
let tfoot = document.createElement('tfoot')
works.appendChild(tfoot)


let caption = works.appendChild(document.createElement('caption'))
let all = caption.appendChild(document.createElement('button'))
all.textContent = 'All'
all.addEventListener('click',(e)=>{
	works.querySelectorAll('tr').forEach((tr)=>{
		tr.hidden = false
	})
})
let one = caption.appendChild(document.createElement('button'))
one.textContent = '1'
one.addEventListener('click',(e)=>{
	let current = works.querySelector('.current') || works.querySelector('tr')
	works.querySelectorAll('tr').forEach((tr)=>{
		tr.hidden = tr !== current
	})
})

let ten = caption.appendChild(document.createElement('button'))
ten.textContent = '10'
ten.addEventListener('click', (e)=>{
	
})

let fifty = caption.appendChild(document.createElement('button'))
fifty.textContent = '50'


caption.innerHTML = '<b>C</b>aption'


// tbody数据
while (i < len) {
	tr = document.createElement('tr')
	no = document.createElement('td')
	source = document.createElement('td')
	target = document.createElement('td')
	info = document.createElement('td')
	no.textContent = i
	no.classList.add('no')
	source.textContent = Math.random().toString(16).slice(2).repeat(3)
	source.classList.add('source')
	target.textContent = Math.random().toString(16).slice(2).repeat(3)
	target.classList.add('target')
	info.classList.add('info')
	tr.appendChild(no)
	tr.appendChild(source)
	tr.appendChild(target)
	tr.appendChild(info)
	tbody.appendChild(tr)
	i++
}

// document.querySelectorAll('tr:nth-child(50) ~ tr').forEach(tr => tr.hidden = true)


// thead数据
let head = ['no', 'source', 'target', 'info']
// head.forEach((text)=>{
// 	let td = document.createElement('td')
// 	td.textContent = text
// 	thead.appendChild(td)
// })



// let keydowns = {
// 	'13': function (e) {
// 		let tar = e.target
// 		if (tar.nodeType === 1 && tar.classList.contains('target')) {
// 			if (e.ctrlKey || e.shiftKey) {
// 				e.preventDefault()
// 				let p = tar.parentElement
// 				if (e.ctrlKey) {
// 					p.querySelector('.info').classList.add('done')
// 				} else if (e.shiftKey) {
// 					if (e.altKey) {
// 						prompt('원인 기재')
// 					}
// 					p.querySelector('.info').classList.add('warn')
// 				}
// 				p = p.nextElementSibling
// 				if (p) {
// 					tar = p.querySelector('.target')
// 					if (tar) {
// 						tar.focus()
// 					}
// 				}
// 			}
// 		}
// 	}
// }
// function keydownHandle(e) {
// 	let f = keydowns[e.keyCode]
// 	if (typeof f === 'function') {
// 		f(e)
// 	}
// }
// works.addEventListener('keydown', keydownHandle)


function tip(html) {
	let tip = works.querySelector('#tip')
	if (!tip) {
		tip = document.createElement('tr')
		tip.setAttribute('id', 'tip')
		tip.setAttribute('name', 'tip')

		let no = tip.insertCell()
		let source = tip.insertCell()
		let target = tip.insertCell()
		let info = tip.insertCell()

		no.textContent = '🌙'
		source.innerHTML = '<div>' + `<pre>원문</pre>`.repeat(10) + '</div>'
		target.innerHTML = html || '<div>' + `<pre>원문</pre>`.repeat(10) + '</div>'
	}
	return tip
}


Array.prototype.forEach.call(works.rows, tr => {
	Array.prototype.forEach.call(tr.cells, td => {
		if (td.classList.contains('target')) {
			td.addEventListener('focus', function () {
				let tbody = tr.parentElement
				let trIndex = tr.sectionRowIndex

				if(tbody.dataset.editing) {
					
				}

				Array.prototype.forEach.call(tbody.rows, (e, i) => {
					if (i < (trIndex - 2) || i > (trIndex + 2)) {
						if(!e.hidden) e.hidden = true
						// e.style.display = 'none'
					}
				})

				// if (td.classList.contains('target')) {
				// 	tr.insertAdjacentElement('beforeBegin', tip())
				// 	// tr.insertAdjacentElement('afterend', tip())
				// 	td.scrollIntoView({ block: 'center' })
				// }
			})
			td.addEventListener('blur', function () {
				if (td.classList.contains('target')) {
					// let tipTr = works.rows.namedItem('tip')
					// let tipTr = works.rows.item(tr.rowIndex+1)
					// log(tipTr)
					// tipTr.remove()

					// delete e.target.dataset.text
					// delete e.target.dataset.after
					Array.prototype.forEach.call(tbody.rows, (e)=>{
						e.hidden = false
						// e.style.display = ''
					})

					tr.scrollIntoView({ block: 'center' })
					
				}
			})
		}
	})
})



function table(data) {
	let table = document.createElement('table')
	let tbody = table.createTBody()
	data.forEach(row => {
		let tr = tbody.insertRow()
		row.forEach(cell => {
			let td = tr.insertCell()
			td.textContent = cell
		})
	})
	let blob = new Blob([table.outerHTML], { type: 'application/html' })
	let url = URL.createObjectURL(blob)
	return { table, blob, url }
}

function tableRand() {
	return table(Array.from(new Array(10), (e, i) => {
		i = i + 1;
		return [i, `source${i}`, `target${i}`, Math.random().toFixed(3)]
	}))
}


document.querySelector('.target').focus()