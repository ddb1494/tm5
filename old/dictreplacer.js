let dict = [
	['\\(a)','*$1'],
	['ba', 'BO'],
	['aa', 'AA'],
	['a', '_'],
	// ['', '*'],
	// // undefined,
	// // ' ',
	// [' ', '~'],
	// ['_', '~'],
	// ['三才', '森次'],
	// ['三', '参'],
	// ['[a]', '[$&]'],
];

let str = '12aba\\(a) \\b';

console.log(str);
console.log(dictReplacer(str, dict,false));
console.log(dictReplacer(str, dict,true));


function dictReplacer(str, dict, useRegExp=false) {
	let regExpArr, regExpStr, regExp, r;
	regExpArr = dict.filter(e => Array.isArray(e) && (typeof e[0] === 'string' && e[0].length > 0));
	regExpStr = regExpArr.map(e => {
		let v = e[0];
		if(useRegExp) {
			v = v.replace(/\\/g, '\\\\');
		}else{
			v = v.replace(/[\[\]\{\}\^\$\(\)\\\/\?\+\*]/g,'\\$&');
		}
		return `(${v})`;
	}).join('|');
	regExp = new RegExp(regExpStr, 'g');
	r = str.replace(regExp, function (...strArgs) {
		let v, m=strArgs[0];
		dict.some(e => {
			let b = e[0] === strArgs[0];
			v = e[1];
			// 支持正则表达式
			// if(useRegExp) {
			// 	v = v.replace(/(\$)?\$(\d{1,2}|\&)/g, function (...vArgs) {
			// 		// return vArgs[1] ? vArgs[0].slice(1) : strArgs[vArgs[2]];
			// 		let r;
			// 		if(vArgs[1]) {
			// 			r = vArgs[0].slice(1);
			// 		}else{
			// 			r = strArgs[vArgs[2]];
			// 			console.log(r);
			// 			if(r==='&') {
			// 				r = m;
			// 			}
			// 		}
			// 		return r;
			// 	});
			// }
			return b;
		})
		return v;
	});
	return r;
}
	



// let r='abcdea'.replace(/a/g, '[$$&]');console.log(r);


// 对$\d进行特别处理的测试
// {
// 	let r = '$$1 $$2 $3 $33'.replace(/(\$)?\$\d{1,2}/g, function(...args){
// 		console.log(args[0], args[1]);
// 		return args[1] ? args[0].slice(1) : '*';
// 	});
// 	console.log(r);
// }


// {
// 	let s = 
// }


