function google(q, tl) {
	return new Promise(function(y,n){
		let url = `https://cihot.com/google/?q=${encodeURIComponent(q)}&tl=${encodeURIComponent(tl)}`;
		let xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'json';
		xhr.onload = function () {
			y(xhr.result);
		}
		xhr.onabort = xhr.onerror = function () {
			y([])
		}
		xhr.send(null)
	})
}

export { google };