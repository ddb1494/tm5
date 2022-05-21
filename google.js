function google(q, tl = 'zh-CN', sl = 'auto') {

	function createURL(q, tl, sl) {
		let url = new URL('https://translate.googleapis.com/translate_a/single')
		url.searchParams.set('sl', sl)
		url.searchParams.set('tl', tl)
		url.searchParams.set('client', 'gtx')
		url.searchParams.set('dt', 't')
		url.searchParams.set('q', q)
		return url
	}

	function translate(url) {
		return fetch(url.toString(), { method: 'POST' })
			.then(res => res.json())
			.then(res => {
				return res[0][0].slice(0, 2)
			})
	}

	if (typeof q === 'string') {
		let url = createURL(q, tl, sl)
		return translate(url)
	} else if (Array.isArray(q)) {
		return Promise.all(q.filter(e => typeof e === 'string' && e.length).map(e=>translate(createURL(e,tl,sl))))
	} else {
		return Promise.resolve([])
	}
}


google(
	[
		'많고 많은 주식 관련 책 중 오늘은 단 한 권의 책을 소개하고자 하는데요,',
		'주식 책도 이제는 하루가 갈수록 많은 책들이 쏟아져 나오는 가운데',
		'개인투자자들은 무엇을 어떻게 읽고 투자에 활용해야 하는 것인가?라는 고민에 빠지게 되죠.'
	].join(' ')
).then(res => {
	//console.log(res[0][0][0], res[0][0][1])
	//console.log(JSON.stringify(res[8]))
	console.log(res)
})


