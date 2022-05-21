let { debug:log } = console

let works = [
	{ source: '골드 1,000사용', target: '使用黄金1000' },
	{ source: 'Lv.3 테러리스트 전투 승리 10회', target: '战胜Lv.3恐怖分子10次' },
]






/* 
算法1

遍历语句中所有字符。
如果是数值，则记录数值。
取出数值

*/



class Select {
	constructor(){
		this.content = {}
		this.label
	}

	add(label, value) {
		this.content[label] = value
	}

	select(label) {
		this.label = this.content.hasOwnProperty(label) ? label : undefined
	}

	get value(){
		return this.content[this.label]
	}
}


let select = new Select()
select.add('num', 1)
select.add('str', 'a')
select.select('str')
log(select.label, select.value)



// Number QA 核心算法 --start
function numberQA(s, t) {
	/* 
	<input type="number">
	试图给它赋值字符串时，提示不符合正则表达式 /-?(\d+|\d+\.\d+|\.\d+)([eE][-+]?\d+)?/
	*/


	// 改良过的数值匹配
	let myNumberRegExp = /[-+]?\d{1,3}((,?)\d{3})?(\.\d+)?([eE][-+]?\d+)?%?/gmi
	// 其他全部数值
	let number = /\p{Number}/ug
	// 合并数值匹配规则
	let regExp = [myNumberRegExp, number]
	regExp = new RegExp(regExp.map(re => re.source).join('|'), 'gu')
	// 测试
	// log('①Ⅰ一1１ 50%  1,000. .5% 90％ 1.001e1000'.match(regExp))


	let r = regExp
	s = s.match(r) || [];
	t = t.match(r) || [];
	return arrayDiff(s, t);
}

function arrayDiff(a, b) {
	let _a = [], _b = [];
	a.forEach((e, i) => {
		if (b.indexOf(e) === -1) {
			_a.push({ value: e, index: i });
		}
	});
	b.forEach((e, i) => {
		if (a.indexOf(e) === -1) {
			_b.push({ value: e, index: i });
		}
	});

	let ok = true, _al = _a.length, _bl = _b.length;
	if (_al === _bl) {
		if (a.join('\x02') !== b.join('\x02')) {
			ok = false;
		}
	} else {
		ok = false;
	}
	return { arr1: a, arr2: b, diff1: _a, diff2: _b, ok };
}
// Number QA 核心算法 --start

// $('#numQA').css('boxShadow', '0 0 4px #F0F');
// $('#useDictTip').prop('checked', false);

// $('#worksTargetFilter').val('숫자QA');
// var count = 0;
// $('#works tr').removeClass('hide,hide1,hide2');
// $('#works tr').not('.emptyRow').each(function (i, tr) {
// 	var qa = $(tr).find('.qa');
// 	if (qa.length === 0) {
// 		qa = $('<td class="qa">').appendTo(tr);
// 	}

// 	var source = $(tr).find('td.source').eq(0).text() || '';
// 	var target = $(tr).find('td.target').eq(0).text() || '';

// 	let result = numberQA(source, target);
// 	if (result.ok) {
// 		$(tr).addClass('hide');
// 	} else {
// 		let table = $('<table>').appendTo(qa);
// 		for (let i = 0, len = Math.max(result.arr1.length, result.arr2.length); i < len; i++) {
// 			let tr = $('<tr>').appendTo(table);
// 			let s = result.arr1[i];
// 			let t = result.arr2[i];
// 			tr.append($('<td>').text(s || '').css({ textAlign: 'right' }).addClass('qa-index-' + i));
// 			tr.append($('<td>').text(t || '').addClass('qa-index-' + i));
// 			if (s !== t) tr.css({ color: '#f00', fontWeight: 'bold' });
// 		}
// 		result.diff1.forEach(e => {
// 			table.find('td.qa-index-' + e.index).eq(0).css({ background: '#ff0' });
// 		});
// 		result.diff2.forEach(e => {
// 			table.find('td.qa-index-' + e.index).eq(1).css({ background: '#ff0' });
// 		});
// 	}
// });
