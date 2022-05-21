/* 
功能：将长文章按符号“.”进行分隔。
MIT
*/

function longSegmentSplit(str) {
	let r = /\!\?+|\?\!+|\?+|\!+|\.+|。+/g;
	let s = str.split(r);
	let m = str.match(r)
	// console.log(JSON.stringify(s));
	// console.log(JSON.stringify(m));

	let p = str.replace(r, (e, i, a) => {
		let before = a.slice(0, i);
		let after = a.slice(i + e.length);
		if (/\.$/.test(before)) return e;
		if (/。$/.test(before)) return e;
		if (/\d$/.test(before) && /^\d/.test(after)) return e;
		if (/lv$|level$|vip$/i.test(before) && /^(<|\{|\[|\()?\d/.test(after)) return e;
		// console.log(before);
		// console.log(after);
		return e + '\0';
	});
	p = p.replace(/\{\\r\\n\}|\\r\\n|\\r|\\n/g, '\0$&\0');
	p = p.split('\0').map(e => e.trim()).filter(e => e.length > 0);

	// console.log(JSON.stringify(p));
	return p;
}


//test:
// {
	// console.log(JSON.stringify(longSegmentSplit('aaa.asdfsa1.{\\r\\n}2asfasf.asf.')));
// }
