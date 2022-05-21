class Search {
	static _getRegExp(v) {
		v = v.replace(Search.REGEXP_SPACES, '')
		if (v === '') return '';
		var s = Search.SPACES;
		return s + v.split('').map(function (e) { return e.replace(Search.REGEXP_TOKENS, '\\$&'); }).join(s) + s;
	}
	static getRegExp(v, options, noFormat) {
		if (!v) return;
		if (noFormat) {
			try {
				v = new RegExp(v, 'g');
				return v;
			} catch (err) {
				console.warn('Invalid argument - new RegExp(' + v + ',"g")');
			}
		}
		v = v.split('\\');
		v = new RegExp(v.map(Search._getRegExp).join('\\\\'), options);
		v = v.source === '(?:)' ? Search.VIRTUAL_REGEXP : v;
		return v;
	}
}
Object.defineProperties(Search, {
	REGEXP_TOKENS: { value: /[\/\?\*\+\-\^\$\(\)\<\>\[\]\{\}\.\,\:\&\|]/g },
	REGEXP_SPACES: { value: /\s+/g },
	SPACES: { value: '\\s*' },
	VIRTUAL_REGEXP: { value: { test: function () { return false; }, match: function () { return null; } } }
});


addEventListener('message', (e) => {
	let [source,array] = e.data;
	let res = [];
	array.forEach(function (kv, index) {
		// let k=kv[0], v=kv[1], _k=stringNormalize(k);
		let k = kv[0], v = kv[1], _k = k;
		let re = Search.getRegExp(_k.length > 0 ? _k : k);
		if (re) {
			if (re.test(source)) {
				res.push([k, v, index]);
			}
		} else {
			console.warn({ k, v, _k, re })
		}
	});

	res.sort((a, b) => String(a[0]).length < String(b[0]).length)
	res.reverse();
	this.postMessage(res);
});
