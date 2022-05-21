function wopen(...a) {
	let len = a.length, t, o, url = 'about:blank', name = '', opt = [], v;
	if (len === 1) {
		v = a[0];
		t = typeof v;
		if (t === 'string') {
			url = v;
		} else if (t === 'object') {
			name = v.name;
			delete v.name;
			o = v;
		}
	} else if (len === 2) {
		v = a[0];
		t = typeof v;
		if (t === 'string') {
			url = v;
			v = a[1];
			t = typeof v;
			if (t === 'string') {
				name = v;
			} else if (t === 'object') {
				name = v.name;
				delete v.name;
				o = v;
			}
		}
	}
	o = Object.assign({
		fullscreen: 0,
		width: 400,
		height: 300,
		// top: 0,
		// left: 0,
		// screenX:0,
		// screenY:0,
		scrollbars: 0,
		resizable: 0,
		close: 0,
		personalbar: 0,
		dialog: 0,
		minimizable: 1,
		center: 1,
		centerscreen: 1,
		chrome: 0,
		toolbar: 0,
		menubar: 0,
		location: 0,
		status: 0,
		titlebar: 0,
	}, o);
	for (let k in o) {
		v = o[k];
		t = typeof v;
		if (t === 'number') {
			v = String(v);
		} else {
			v = '0';
		}
		opt.push(`${k}=${v}`);
	}
	let w = window.open(url, name, opt.join(','))
	addEventListener('beforeunload', () => w.close())
	return w
}
// wopen(opt)
// wopen(url, opt)


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
	function html(...a){
		let html = `<!DOCTYLE html><html><head>
		<style>
		* {box-sizing: border-box; margin:0; padding:0; border:none; }
		body { display: grid; grid-template-rows: auto; height: 100vh; }
		iframe { border: none; display: block; width:100vw; height:100%; border-bottom:1px solid #eee; }
		</style>
		</head><body>`
		a.forEach(src => {
			if (!/^https?:/.test(src)) src = `${ location.protocol }//${location.host}/${src}`
			html += `\n<iframe src="${src}" seamless width="100%"></iframe>`
		})
		html += '\n</body>\n</html>'
		return html
	}


	let page = url(html(...a))
	let w = Object.create(wopen(page, { height: screen.availHeight, scrollbars:0 }))
	w.flush = function flush(...a) {
		this.location.replace(url(html(...a)))
	};
	return w
}
