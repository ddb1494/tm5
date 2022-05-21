!function (undefined) {
	// 数值正则
	let numberRegExp = /[+-]?\d{1,3}(,?\d{3}|\d+)*(\.\d+)?(e[+-]?\d+)?|\p{Number}+/gu
	// let numberRegExp = /[\+\-]?[\p{Number}\.,eE%]+/gu;

	function makeTextPair(t1, t2, mark = '{') {
		let mt1, mt2, tagText;

		mt1 = makeText(t1);
		mt2 = makeText(t2);
		console.warn(mt1)
		console.warn(mt2)

		let indexs = reIndexs(mt1.args, mt2.args);
		let i = 0;

		tagText = mt2.tagText.replace(/((\{\{)*\{)(\d+)(\})/g, function (m, begin, _, number, end) {
			number = indexs[i];
			number = (number === undefined) ? (mt2.args[i] === undefined ? '' : mt2.args[i]) : `${begin}${number}${end}`;
			i++;
			return number;
		});

		function make(args, reIndex = true) {
			return reIndex ? makeArgs(this.tagText, args) : makeArgs(this.b.tagText, args);
		}
		return { a: mt1, b: mt2, tagText, accepted: indexs.accepted, make };
	}

	// 得出将a1排列成a2的index序列。例如： [1,11,111]->[111,1,11] 结果为 [1, 2, 0]
	function reIndexs(a1, a2) {
		a2 = Array.from(a2);
		let i, len, index, indexs;
		i = 0;
		len = a1.length;
		if (len) {
			indexs = [];
			indexs.accepted = true;
		} else {
			indexs.accepted = false;
		}
		for (; i < len; i++) {
			index = a2.indexOf(a1[i])
			if (index == -1) {
				indexs.accepted = false;
			} else {
				a2[index] = null;
				indexs.push(index);
			}
		}
		return indexs;
	}

	// 如果字符串中带有mark，那就要加上mark。即{变为{{。
	function encodeReady(text, mark = '{') {
		let markRegExp = new RegExp(mark.split('').map(e => '\\' + e).join(''), 'g');
		return text.replace(markRegExp, '$&$&');
	}

	// 如果字符串中带有mark，那就要减去mark。即{{变为{，但{不会消失。
	function decodeReady(text, mark = '{') {
		let markRegExp = new RegExp('(' + mark.split('').map(e => '\\' + e).join('') + ')\\1', 'g');
		return text.replace(markRegExp, mark);
	}

	// 单个
	function makeText(text, mark = '{') {
		let i = 0, args = [], tagText;
		tagText = encodeReady(text, mark);
		tagText = tagText.replace(numberRegExp, function (m) {
			args.push(m);
			return `{${i++}}`;
		});
		return { text, tagText, args };
	}

	// 将args中的内容应用到文本中的{0},{1}...{n}参数。
	function makeArgs(str, args) {
		// 但愿是字符串
		if (typeof str !== 'string') return '';

		let s, regexp;
		regexp = /\{([^\}]+?)\}/g;

		// 在这里{为转义符，遇到{{须进行回避
		s = str.split('{{');// 回避{{符号
		s = s.map(function (str) {
			return str.replace(regexp, function (match, name) {
				let v = args[name];
				if (v === undefined || v === null) v = match;
				// console.debug(v !== match ? 替换成功：${match}-->${v}: 保留原样：${match});
				return v;
			});
		});
		return s.join('{{');
	}


	// 导出以上内容
	let g;
	if (typeof window === 'object') {
		g = self;
	} else if (typeof global === 'object') {
		g = global;
	} else {
		g = this;
	}
	g.ArgText = {
		numberRegExp,
		makeArgs,
		makeText,
		makeTextPair,
		encodeReady,
		decodeReady,
		reIndexs,
	};

	// 兼容chrome和nodejs
	if (typeof module === 'object') {
		module.exports = ArgText;
	} else {
		this.ArgText = ArgText;
	}
}();


// {
// let a = '[FFC663FF][1월 이벤트][-] 더 즐거운 11월의 창세기전!';
// let b = '[FFC663FF][111月活动][-]1月更好玩的创世纪战！'
// let p = ArgText.makeTextPair(a, b);
// console.log(p.make(['*', , '**']));
// }


// 无法匹配
// {
// 	let s = '이벤트 기간 : 12/13 점검 후 ~ 12/20 14:00';

// 	let d = {
// 		s: '이벤트 기간 : 12/06 점검 후 ~ 12/13 14:00',
// 		t: '活动时间:12月6日维护后~12月13日 13:00',
// 	}

// 	let p = ArgText.makeTextPair(d.s, d.t);

// 	let a = ArgText.makeText(s).args;

// 	// result
// 	console.log(
// 		// p.make(a),
// 		p.make(a, false),
// 	);
// }


