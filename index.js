import wopen from './m/wopen.js'
import config from './config.js'



(function () {
	let { scripts, modules, main } = config
	for (let i = 0, { length } = scripts; i < length; i++) {
		let url = scripts[i]
		let n = document.createElement('script')
		n.src = url
		n.defer = true
		document.head.appendChild(n)
		n.remove()
	}
	let q = ''
	for (let name in modules) {
		let url = modules[name]
		q += `import ${name} from '${url}';`
	}
	fetch(main).then((r) => r.text()).then((r) => {
		let n = document.createElement('script')
		n.type = 'module'
		n.defer = true
		n.textContent = q + r
		document.head.appendChild(n)
		n.remove()
	})
})();

window.wopen = wopen


let ibmWindow = wopen('https://www.ibm.com/demos/live/watson-language-translator/self-service/home', { name: 'ibm', width: 10, height: 10, top: 100, left: 0 })
window.ibm = ibmWindow
ibmWindow.on('message', function (ev) {
	const { origin, data } = ev
	console.log(ev)

})


window.texts = [
	'#크로스파이어 #전쟁시뮬레이션',
	'사령관님, 테러리스트에게 습격받고 있습니다!',
	'지금 군대를 이끌어 반격하십시오!',
	'전쟁 시뮬레이션 장르의 마스터피스!',
	'지금, "크로스파이어: 워존"에 참전하세요.',
	'🏆2020년 최고의 전쟁게임🏆',
	'당신만을 위한 전략MMO',
	'긴급 지원요청!',
	'지금 다운로드',
	'전쟁은 이미 시작되었다.',
	'당신을 위한 #1 전쟁 시뮬레이션',
	'지금, 실시간 전투에 참여하라',
	'전략게임의 마스터피스',
	'21세기 현대전 전략게임의 완성판',
	'세계평화 수호를 위한 끝없는 전쟁이 시작된다!',
	'21세기 현대전 전략게임의 완성판\n세계평화 수호를 위한 끝없는 전쟁이 시작된다!',
	'전략 시뮬레이션 게임에 수집형 RPG의 재미를 더하다',
	'FPS 레전드 IP 크로스파이어가 전쟁 시뮬레이션으로 재탄생, 전략을 통해 테러리스트를 섬멸하라.',
	'고퀄리티 전쟁 시뮬레이션을 찾고있다면, 주목해야할 단 하나의 게임',
	'고퀄리티 전쟁 시뮬레이션으로 돌아온 레전드 FPS "크로스파이어"\n지금 모바일로 치열한 전투를 즐겨보세요!🔥🔥\n#크로스파이어 #전쟁시뮬레이션',
	'사령관님, 테러리스트에게 습격받고 있습니다!\n지금 군대를 이끌어 반격하십시오!\n#크로스파이어 #전쟁시뮬레이션',
	'전쟁 시뮬레이션 장르의 마스터피스!\n지금, "크로스파이어: 워존"에 참전하세요.\n#크로스파이어 #전쟁시뮬레이션',

]


document.addEventListener('wheel', function (ev) {
	let text = texts.shift()
	if (text) {
		console.log('请求翻译...')
		ibmWindow.postMessage({
			id: 1,
			type: 'fetch',
			url: 'https://www.ibm.com/demos/live/watson-language-translator/api/translate/text',
			options: {
				method: 'POST',
				headers: {
					'content-type': 'application/json;charset=UTF-8'
				},
				body: JSON.stringify({
					//text:`원문(${Date.now()})을 번역하세요.`,
					text,
					source: 'ko',
					target: 'zh',//en,ko,zh,zh-TW,ru,fr,de
				})
			}
		})
	} else {
		console.log('texts池中没有要翻译的文本')
	}
})


window.addEventListener('message', function (ev) {
	const { data, origin, target } = ev
	const { result } = data
	if (result && result.payload && result.payload.translations) {
		let text = result.payload.translations.map(e => e.translation).join('\n')
		console.log(origin, text, data)
	}else{
		console.log(origin, data)
	}
})