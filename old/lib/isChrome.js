// 20200129 DDB
function isChrome() {
	console.log(`%c${navigator.userAgent}`, 'color:seablue');
	let a = navigator.userAgent;
	return Boolean(typeof chrome === 'object' && chrome.csi
		&& a.indexOf('Chrome') >= 0 && a.indexOf('OPR') === -1)
		|| (/Mobile/i.test(a) && /CriOS/i.test(a));
};
if (!isChrome()) location.replace('/chrome.html');