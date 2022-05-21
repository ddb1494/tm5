// 侦听粘贴操作
window.addEventListener('paste', function (e) {
	let cd = e.clipboardData
	console.warn(cd.getData('text/html').substr(0, 50), '...')
	console.log(cd.getData('text/plain').substr(0, 50), '...')
	// 处理文件
	Array.from(cd.files).forEach(file => {
		console.warn(file.name, file.size, file.type, file.lastModified, file.lastModifiedDate.toLocaleString())
	})
	Array.from(cd.items).forEach(item => {
		console.warn(item.kind, item.type, item)
		if (item.kind === 'string') console.log(item.getAsString((s) => console.log(s)))
		else if (item.kind === 'file') console.log(item.getAsFile())
	})
})
