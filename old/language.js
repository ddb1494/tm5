class Language {
}

Object.defineProperties(Language, {
	zh: { value: /[⺀-⻳⼀-⿕㐀-䶵一-鿕-豈-舘]/, enumerable: true },
	'zh-CN': { value: /[一-鿕豈-舘]/, enumerable: true },
	jp: {value: /[ぁ-ヺㇰ-ㇿ㋐-㋾㌀-㍗ｦ-ﾟ]/, enumerable:true },
	ko: { value: /[ᄀ-ᇿㄱ-ㆎ㈀-㈞㉠-㉽가-힣ힰ-ퟻﾡ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]/, enumerable: true },
	en: { value: /[A-Za-z⒜-⒵Ⓐ-Ⓩⓐ-ⓩＡ-Ｚａ-ｚ]/, enumerable: true },
	num: { value: /[0-9⁰-⁹₀-₉①-⑳⑴-⒇⒈-⒛⓪⓫-⓴⓵-⓾⓿❶-❿➀-➉➊-➓㉈-㉏㊀㊉㉑-㉟㊱-㊿-０-９]/, enumerable: true },
	time: { value: /[㊊-㊐㋀-㋋㏠-㏾㍘-㍰]/, enumerable: true },
});

// console.log('舘'.charCodeAt(0).toString(16));
// console.log('龜'.charCodeAt(0).toString(16));
// console.log(Language.ko.test('한'));


let regExps = Object.values(Language);
function test(str){
	return regExps.some(function(regExp){
		return regExp.test(str);
	});
}

let i = 0x2600, s='' , len=0;
while(i<0x2700) {
	let c = String.fromCharCode(i++);
	if(!test(c)) {
		len++;
		s+=c;
		if(len%30===0) s+='\n';
	}
}
console.log(s);

console.log('★'.charCodeAt(0).toString(16))
// console.log('一'.charCodeAt(0).toString(16))

// console.log(Language.num.test('⑥'));

// let a = Language.ko.source.replace(/[\-\[\]]/g,'');
// console.log(a.split('').map(e=>e.charCodeAt(0)+':'+e).join('\n'));
