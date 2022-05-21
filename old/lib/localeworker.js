((g) => {
	const { log } = console

	let cacheWorkers = Object.create(null)
	let cacheUrls = Object.create(null);

	function createLocaleWorker(mainHandles, workerHandles) {
		let code, blob, url, worker;
		code = 'function send(...a){ this.postMessage(Array.from(a)) }; ';

		if (typeof workerHandles === 'string') {
			code += workerHandles;
		} else if (typeof workerHandles === 'function') {
			code += 'this.addEventListener(\'message\',' + workerHandles.toString() + ');';
		} else if (typeof workerHandles === 'object' && workerHandles) {
			// 输入
			let k, f;
			for (k in workerHandles) {
				f = workerHandles[k]
				if (k.length > 2) k = k.replace(/^on(.+)/, '$1');	// 去掉开头的on
				code += 'this.addEventListener(\'' + k + '\',' + f.toString() + ');';
			}
		} else {
			// 输入其他类型的代码
			code = 'addEventListener("message",(e)=>{console.log(e.data);});';
		}

		if (code) {
			if (!cacheUrls[code]) {
				blob = new Blob([code], { type: 'text/javascript' });
				url = URL.createObjectURL(blob);
				cacheUrls[code] = url;
			} else {
				url = cacheUrls[code];
			}
			worker = new Worker(url);
			if (typeof mainHandles === 'string') {
				code += mainHandles;
			} else if (typeof mainHandles === 'function') {
				worker.addEventListener('message', mainHandles);
			} else if (typeof mainHandles === 'object' && mainHandles) {
				let k, f;
				for (k in mainHandles) {
					f = mainHandles[k];
					if (k.length > 2) k = k.replace(/^on(.+)/, '$1');	// 去掉开头的on
					worker.addEventListener(k, f);
				}
			} else {
				worker.addEventListener('message', (e) => {
					console.log(e.data);
				});
			}
		}
		worker.code = code;
		worker.url = url;
		return worker;
	}

	class LocaleWorker {

		constructor(name, mainHandles, workerHandles) {
			this._autoReconnect = false;
			this.name = name;
			this.mainHandles = mainHandles;
			this.workerHandles = workerHandles;
			this.connect();
		}

		close() {
			if (this.name in cacheWorkers) {
				cacheWorkers[this.name].terminate();
				delete cacheWorkers[this.name];
			}
			if (this.worker) this.worker.terminate();
			delete this.worker;
		}

		destroy() {
			if (this.code in cacheUrls) {
				URL.revokeObjectURL(cacheUrls[this.code]);
				delete cacheUrls[this.code]
			}
			this.terminate()
			delete cacheWorkers[this.name]
		}

		connect() {
			this.close();
			cacheWorkers[this.name] = this.worker = createLocaleWorker(this.mainHandles, this.workerHandles);
		}

		send(...a) {
			try {
				this.worker.postMessage(a);
			} catch (e) {
				log('想要发送的数据', a)
				log('worker异常关闭，纠正了错误！')
				this.connect()
				this.worker.postMessage(a);
			}
		}

		set autoReconnect(b) {
			this._autoReconnect = b;
			if (this._autoReconnect === false && b) {
				this.worker.addEventListener('close', this.connect.bind(this));
			} else {
				this.worker.removeEventListener('close', this.connect.bind(this));
			}
		}
		get autoReconnect() {
			return this._autoReconnect;
		}
	}

	g.LocaleWorker = LocaleWorker;
	LocaleWorker.cache = { workers: cacheWorkers, urls: cacheUrls };

})(this)

/*

let lw = new LocaleWorker('test',

	{
		message:()=>{
		},
		error:()=>{
		},
		massageerror:()=>{
		},
	},

	{
		message(){
			send()
		},
		close(){
		},
		error(){}
	}
);

lw.send(1,2,3,4)
lw.worker
lw.url
lw.close()

LocaleWorker.cache.workers
LocaleWorker.cache.urls

*/