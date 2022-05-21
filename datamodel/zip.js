import JSZip from '/module/jszip.js'

const DEFAULT_OPTIONS = Object.freeze({
	type: 'blob',
	compression: "DEFLATE",
	compressionOptions: {
		level: 9
	}
})


//压缩
function zip(obj, opt) {
	opt = Object.assign({}, DEFAULT_OPTIONS, opt);
	let z = new JSZip();
	for(let k in obj) {
		let v = JSON.stringify(obj[k])
		z.file(k,v)
	}

	self.z = z
	return z.generateAsync(opt)
}


//解压缩
function unzip(ab, opt) {
	opt = Object.assign({}, DEFAULT_OPTIONS, opt);

	let z = new JSZip();
	return z.loadAsync(ab).then(o => {
		//o.files[ opt.name || '.txt'] === o.file(opt.name || '.txt')
		return o.file(opt.name || '.txt')
			.async('text')
			.then(data => {
				try {
					data = JSON.parse(data);
				} catch (err) { }
				return data;
			})
	});
}


zip.unzip = unzip
zip.DEFAULT_OPTIONS = DEFAULT_OPTIONS

export default zip