importScripts('/lib/localforage.min.js');

onmessage = function(e) {
	let data = e.data;
	if (typeof data === 'object' && data!==null) {
		if(data.get) {
			localforage.get('data').then(v => postMessage(v));
		}
		if(data.set) {
			
			localforage.get('data').then(v => postMessage(v));
		}
	}
}

function search(data) {
	localforage.get('data').then(v=>postMessage(v));
}
function 