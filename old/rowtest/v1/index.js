const { log, time, timeEnd } = console



// 【采用jquery创建tag并设置text，需要1000ms时间】
// time('while')
// let i = 0, len=2000
// while(i<len) {
// 	let $tr = $('<tr>')
// 	let $works = $('#works')
// 	let $no = $('<td>').addClass('no').text(i)
// 	let $source = $('<td>').addClass('source').text(Math.random().toString(16).slice(2))
// 	let $target = $('<td>').addClass('target').text(Math.random().toString(16).slice(2))
// 	$tr.append($no, $source, $target)
// 	$works.append($tr)
// 	i++
// }
// timeEnd('while')// 830-1000ms


// 【只是将#works选择器挪出循环体】
// time('while')
// let i = 0, len = 2000
// let works = document.querySelector('#works')
// while (i < len) {
// 	let $tr = $('<tr>')
// 	let $no = $('<td>').addClass('no').text(i)
// 	let $source = $('<td>').addClass('source').text(Math.random().toString(16).slice(2))
// 	let $target = $('<td>').addClass('target').text(Math.random().toString(16).slice(2))
// 	$tr.append($no, $source, $target)
// 	works.appendChild($tr.get(0))
// 	i++
// }
// timeEnd('while')// 149-320ms


// 【使用DocumentFragment，但效果不明显】
// time('while')
// let i = 0, len = 2000
// let works = document.querySelector('#works')
// let fragment = document.createDocumentFragment()
// while (i < len) {
// 	let $tr = $('<tr>')
// 	let $no = $('<td>').addClass('no').text(i)
// 	let $source = $('<td>').addClass('source').text(Math.random().toString(16).slice(2))
// 	let $target = $('<td>').addClass('target').text(Math.random().toString(16).slice(2))
// 	$tr.append($no, $source, $target)
// 	fragment.appendChild($tr.get(0))// 将tr放入非渲染fragment中
// 	i++
// }
// works.appendChild(fragment)
// timeEnd('while')// 149-250ms



// 【jquery和内置的比较，内置十分快】
// time('while')
// let useJQuery = !true
// let i = 0, len = 2000
// let works
// works = document.body.querySelector('#works')
// while (i < len) {
// 	let tr, no, source, target;

// 	if(useJQuery) {
// 		works = $('#works')// 这个操作十分耗时
// 		tr = $('<tr>')
// 		no = $('<td>').addClass('no').text(i)
// 		source = $('<td>').addClass('source').text(Math.random().toString(16).slice(2))
// 		target = $('<td>').addClass('target').text(Math.random().toString(16).slice(2))
// 		tr.append(no)
// 		tr.append(source)
// 		tr.append(target)
// 		works.append(tr)
// 		// 878-1000ms
// 	}else{
// 		works = document.body.querySelector('#works')// 即使循环也不影响速度
// 		tr = document.createElement('tr')
// 		no = document.createElement('td')
// 		source = document.createElement('td')
// 		target = document.createElement('td')
// 		no.textContent = i
// 		no.classList.add('no')
// 		source.textContent = Math.random().toString(16).slice(2)
// 		source.classList.add('source')
// 		target.textContent = Math.random().toString(16).slice(2)
// 		target.classList.add('target')
// 		tr.appendChild(no)
// 		tr.appendChild(source)
// 		tr.appendChild(target)
// 		works.appendChild(tr)
// 		// 22-80ms
// 	}
// 	i++
// }
// timeEnd('while')



// 【测试得出不使用DocumentFragm会更快】
time('while')
let useDocumentFragment = !true
let i = 0, len = 2000
let works = document.querySelector('#works')
let fragment = document.createDocumentFragment()
while (i < len) {
	let tr = document.createElement('tr')
	let no = document.createElement('td')
	no.textContent = i
	let source = document.createElement('td')
	source.textContent = Math.random().toString(16).slice(2)
	let target = document.createElement('td')
	target.textContent = Math.random().toString(16).slice(2)
	tr.appendChild(no)
	tr.appendChild(source)
	tr.appendChild(target)
	if (useDocumentFragment) {
		fragment.appendChild(tr)// 20ms
	}else{
		works.appendChild(tr)// 15ms
	}
	i++
}
if(useDocumentFragment) works.appendChild(fragment)
timeEnd('while')// 16-60ms