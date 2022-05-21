(function (g) {
	// 缓存worker.js文件，以下伪代码。
	let cache = {}
	let cacheurljs = function cacheurljs(url, callback) {
		if (cache[url]) return callback(cache[url])

		let q = new XMLHttpRequest()
		q.open('get', url)// 'worker.js'
		q.onload = ({ target: { responseText } }) => {
			let code = responseText
			let blob = new Blob([code], { type: 'text/javascript' })
			let objectURL = URL.createObjectURL(blob)

			cache[url] = { code, blob, objectURL }
			callback(cache[url])
		};
		q.send(null)
	}

	let cachefnjs = function cachefnjs(name, fn) {
		if (cache[name]) return cache[name]
		let code = fn.toString()
		code = code.slice(code.indexOf('{') + 1, code.lastIndexOf('}')).trim()
		// code = `${ code }; if(result instanceof Promise) { result.then(result=>postMessage(result)) } else { postMessage(result) };`
		let blob = new Blob([code], { type: 'text/javascript' })
		let objectURL = URL.createObjectURL(blob)

		cache[name] = { code, blob, objectURL }
		return cache[name]
	}


	let worker = function worker(name, fn, onmessage, onerror) {
		let cache = cachefnjs(name, fn)

		let w = new Worker(cache.objectURL)
		w.onmessage = ({ data }) => {
			onmessage.call(w, data)
		}
		w.onerror = onerror
		return w
	}

	Object.assign(g, {
		cacheurljs,
		cachefnjs,
		worker
	})
})(this)
