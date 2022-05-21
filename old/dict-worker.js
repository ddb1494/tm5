importScripts('/lib/localforage.min.js');
importScripts('/lib/similar_text.min.js');

addEventListener('message', function (e) {
	router(e.data);
});

let db = localforage.createInstance({ name: `tm4`, storeName: `test` });


let dict = new Map();

function runtimeDict(){
	let result = [];
	db.iterate(function (v, k, i) {
		dict.set(k,v);
	}, function () {
		postMessage({ type: 'initedDict', result });
	});
}

function router(data) {
	let { type, source, target, cv } = data;
	if (type === 'set' && source && target) {
		setItem(source, target);
	} else if (type === 'get' && source) {
		getItem(source);
	} else if (type === 'remove' && source) {
		removeItem(source);
	} else if (type === 'similar' && source) {
		similar(source, cv);
	} else if (type === 'size') {
		size();
	} else {
		postMessage(data);
	}
}

function setItem(source, target) {
	db.setItem(source, target, function (error, result) {
		postMessage({ type: 'set', error, result });
	});
}

function getItem(source) {
	db.getItem(source, function (error, target) {
		let o = Object.create(null);
		o.type = `get`;
		Object.assign(o, { error, target });
		postMessage(o);
	});
}

function removeItem(source) {
	db.removeItem(source, function (error, result) {
		postMessage({ type: 'remove', error, result });
	});
}

function similar(source, cv = 1) {
	let result = [];
	db.iterate(function (v, k, i) {
		let _cv = similarText(source, k, true);
		if (_cv >= cv) {
			let o = Object.create(null);
			Object.assign(o, { cv: _cv, source:k, target:v });
			result.push(o);
		}
	},function(){
		postMessage({type:'similar', result});
	});
}

function size(){
	db.length().then(function(e){
		postMessage({type:'size', result:e});
	});
}




postMessage(db.config());
postMessage({ similarText: typeof similarText });
postMessage({ localforage: typeof localforage });