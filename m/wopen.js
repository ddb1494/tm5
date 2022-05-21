function wopen(...a) {
	let { length } = a
	let t
	let o
	let url = 'about:blank'
	let name = ''
	let opt = []
	let v
	if (length === 1) {
		v = a[0]
		t = typeof v
		if (t === 'string') {
			url = v
		} else if (t === 'object') {
			name = v.name
			delete v.name
			o = v
		}
	} else if (length === 2) {
		v = a[0]
		t = typeof v
		if (t === 'string') {
			url = v
			v = a[1]
			t = typeof v
			if (t === 'string') {
				name = v
			} else if (t === 'object') {
				name = v.name
				delete v.name
				o = v
			}
		}
	}
	o = Object.assign({
		fullscreen: 0,
		width: 10,
		height: 10,
		top: 0,
		left: 0,
		screenX: 0,
		screenY: 0,
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
	}, o)
	for (let k in o) {
		v = o[k]
		t = typeof v
		if (t === 'number') {
			v = String(v)
		} else {
			v = '0'
		}
		opt.push(`${k}=${v}`)
	}

	const w = window.open(url, name, opt.join(','))
	const u = new URL(url)
	const { origin } = u
	const acks = {}

	window.addEventListener('beforeunload', function (ev) {
		w.close()
		ev.preventDefault()
	}, { capture: true, passive: false })

	window.addEventListener('message', function (ev) {
		const { data, origin } = ev
		const { id, result } = data
		if (id) {
			let fn = acks[id]
			if (fn instanceof Function) {
				delete acks[id]
				fn.call(null, result)
				ev.preventDefault()
				ev.stopImmediatePropagation()
				ev.stopPropagation()
			}
		}
	}, { capture: true, passive: false })


	const o = {
		
		id: 0,
		get window() {
			return w
		},
		get url() {
			return u
		},
		postMessage(data) {
			w.postMessage(data, origin)
		},
		on(type, handle, options) {
			w.addEventListener(type, handle, options)
		},
		off(type, handle, options) {
			w.removeEventListener(type, handle, options)
		},
	}

	o.emit = function(type, data, ack){
		let id = ++o.id


	}
	return o
}
// wopen(opt)
// wopen(url, opt)


export default wopen