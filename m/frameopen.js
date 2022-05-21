function frameopen(...a) {
	function blob(html, name = 'index.html') {
		let blob = new Blob([html], { type: 'text/html' })
		blob.name = name
		blob.lastModifiedDate = new Date()
		blob.lastModified = blob.lastModifiedDate.getTime()
		return blob
	}
	function url(html, name) {
		return URL.createObjectURL(blob(html, name))
	}
	function html(...a) {
		let html = `<!DOCTYLE html><html><head>
		<style>
		* {box-sizing: border-box margin:0 padding:0 border:none }
		body { display: grid grid-template-rows: auto height: 100vh }
		iframe { border: none display: block width:100vw height:100% border-bottom:1px solid #eee }
		</style>
		</head><body>`
		a.forEach(src => {
			if (!/^https?:/.test(src)) src = `${location.protocol}//${location.host}/${src}`
			html += `\n<iframe src="${src}" seamless width="100%"></iframe>`
		})
		html += '\n</body>\n</html>'
		return html
	}


	let page = url(html(...a))
	let w = Object.create(wopen(page, { height: screen.availHeight, scrollbars: 0 }))
	w.flush = function flush(...a) {
		this.location.replace(url(html(...a)))
	}
	return w
}


export default frameopen