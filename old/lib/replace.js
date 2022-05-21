class Replace {

	offRegExp(src, opt = 'gim') {
		src = src.replace(Replace.regExp, '\\$&');
		this.regExp = new RegExp(src, opt);
		return this.regExp;
	}
	off(text, tar = '') {
		return text.replace(this.regExp, ()=>tar);
	}
	onRegExp(src, opt = 'gim') {
		this.regExp = new RegExp(src, opt);
		return this.regExp;
	}
	on(text, tar = '') {
		return text.replace(this.regExp, tar);
	}
}
Replace.regExp = /\\|\||\/|\(|\)|\[|\]|\{|\}|\.|\?|\*|\+|\!|\-|\=|\^|\$/g;
