void function (undefined) {
	const REGEXPS = {
		W: /0-9A-Z_a-z/,
		THIS_KEY: /(?<!\\)\$\{(\w+)\}/,
		THIS_KEYS: /(?<!\\)\$\{(\w+)\}/g,
	}

	function strarg(str, obj) {
		return str.replace(REGEXPS.THIS_KEYS, function (m, k) {
			// log(m,k)
			let v = obj[k]
			return v === undefined ? '' : v
		})
	}

	if (typeof window === 'object') {
		window.strarg = strarg
	} else if (typeof module === 'object') {
		module.exports = strarg
	}
	// log(  str('Name${ } is${0} \\${name-}-(${age})', { name: '金熙栋', age:37, 0:'零' })  )

}()
