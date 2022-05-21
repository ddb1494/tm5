// // 类编
class Chain {
	constructor(initValue) {
		this.fns = []
		this.running = false
		this.fn
		this.promise = Promise.resolve(initValue)
		this.value = initValue
		this.start()
	}

	add(fn) {
		if (typeof fn === 'function') {
			this.fns.push(fn)
			this.start()
		}
		return this
	}

	start(handle) {
		if (!this.running) {
			this.running = true
			this.promise = this.promise.then(this.next.bind(this))
		}
		if(typeof handle==='function') Reflect.apply(handle, this, [])
		return this
	}

	stop(handle) {
		if (this.running) {
			this.running = false
		}
		if (typeof handle === 'function') Reflect.apply(handle, this, [])
		return this
	}

	clear() {
		if(this.running) this.running=false
		this.fns = []
	}

	next(value) {
		if(this.fns.length) {
			let fn = this.fns.shift()
			this.promise = new Promise((resolve, reject) => {
				Reflect.apply(fn, this, [value, resolve, reject])
			})
			if (this.running) this.promise.then(this.next.bind(this))
		}
		return this.promise
	}
}
