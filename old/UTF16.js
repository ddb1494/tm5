class UTF16 {
	static encode(s, littleEndian = true) {
		let { length } = s
		let len = length * 2
		let a = new Uint8Array(len)
		let view = new DataView(a.buffer)
		let i = 0
		while (i < length) {
			view.setUint16(i * 2, s.charCodeAt(i), littleEndian);
			i++
		}
		return a;
	}
	static decode(b, littleEndian = true) {
		if (b instanceof Uint8Array) {
			let s = ''
			let view = Uint16Array.from(b);
			console.log(b[0])
			console.log(view[0])
			let i = 0
			let len = view.length
			while (i < len) {
				s += String.fromCharCode(view[i])
				i++
			}
			return s
		}else if(b instanceof Buffer) {
			return b.toString('utf16le')
		}
		return '';
	}
}


let t = '아'
let b

//console.log(t.charCodeAt(0))
//console.log(Buffer.from(t, 'utf8'))
b = Buffer.from(t, 'ucs2')
console.log(b)
//console.log(b, Uint8Array.from(b))
console.log(UTF16.encode(t))
console.log(UTF16.decode(UTF16.encode(t)))


//let s = Buffer.from(t, 'utf8')// 236 149 132

//console.log(s)

//let code = t.charCodeAt(0)
//console.log(code)

//let x = Buffer.from('0000','hex')
//console.log(x.buffer)
//let v = new DataView(x.buffer)
//v.setUint16(0, code,true)
//console.log(v)

//new TextDecoder()