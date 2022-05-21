if (typeof ao !== 'object') var ao = {};
(function () {
	'use strict';

	function arrayToTable(a) {
		var t = $('<table />');
		a.forEach(function (e) {
			var tr = $('<tr />').appendTo(t);
			e.forEach(function (v) {
				var td = $('<td />').appendTo(tr).text(v);
			});
		});
		return t.get(0);
	}
	function tableToArray(t) {
		var a = [];
		$(t).find('tr').each(function (_, tr) {
			var row = [];
			a.push(row);
			$(tr).find('td').each(function (_, td) {
				row.push($(td).text().trim());
			})
		})
		return a;
	}

	// 返回个数
	function stringToArray(t, n = 0) {
		var r = t.split('\n').map(function (e) {
			var row = e.split('\t').map(function (e) {
				return e.trim();
			});
			return row;
		});
		if (n > 0) r = r.filter(function (e) {
			return (e.length >= n) && (e.join('').trim() > 0);
		});

		return r;
	}
	function tmstringToTable(s) {
		let table = $('<table />'), tr, td;
		s.split('\n').forEach(function (e, i) {
			if (i < 10) {
				var line = e.trim();
				if (/^TextKey\tText\tComment/.test(line) || /^\[.+?\]$/.test(line)) {
					// console.warn('ignore',line);
					return;
				}
			}
			let row = e.split('\t');
			if (row.length >= 3) {
				let [textKey, target, targetComment, season, revision, source, sourceComment] = row
				tr = $('<tr>').appendTo(table);
				if (!source) source = ''
				if (!sourceComment) sourceComment = ''
				$('<td>').text(i).appendTo(tr).addClass('no');
				$('<td>').text(source).appendTo(tr).addClass('source');
				$('<td>').text(target).appendTo(tr).addClass('target').attr('contentEditable', 'plaintext-only');
				$('<td>').text(textKey).appendTo(tr).addClass('textKey').attr({ title: textKey });
				$('<td>').text(sourceComment).appendTo(tr).addClass('sourceComment').attr({ title: sourceComment });
				$('<td>').text(targetComment).appendTo(tr).addClass('targetComment')
				$('<td>').text(season).appendTo(tr).addClass('season').attr({title:season});
			}
		});
		return table.get(0);
	}

	function arrayUnique(arr) {
		// return Array.from(new Set(arr.map(e=>e.join('\u200d')))).map(e=>e.split('\u200d'));
		return arr;
	}
	// 
	function arrayToString(a) {
		var tmp = [];
		a.forEach(function (e) {
			if (e.length > 0 && e instanceof Array) {
				tmp.push(e.map(e => e.trim()).join('\t'));
			}
		})
		return tmp.join('\n');
	}

	function stringToTable(s, n) {
		return arrayToTable(stringToArray(s, n));
	}

	function tableToString(t) {
		return arrayToString(tableToArray(t))
	}


	if (typeof ao === 'undefined') {
		this.ao = {};
	}
	ao.arrayToTable = arrayToTable;
	ao.tableToArray = tableToArray;
	ao.stringToArray = stringToArray;
	ao.arrayToString = arrayToString;
	ao.stringToTable = stringToTable;
	ao.tableToString = tableToString;
	ao.tmstringToTable = tmstringToTable;
	ao.arrayUnique = arrayUnique;
})(this);



(function (g) { if (typeof g.ao === 'undefined') { g.ao = {}; } var r = g.ao.similar = function similar(t, s, u) { if (null === t || null === s || void 0 === t || void 0 === s) return 0; var n, o, e, l, f = 0, i = 0, b = 0, c = (t += "").length, h = (s += "").length; for (n = 0; n < c; n++)for (o = 0; o < h; o++) { for (e = 0; n + e < c && o + e < h && t.charAt(n + e) === s.charAt(o + e); e++); e > b && (b = e, f = n, i = o) } return (l = b) && (f && i && (l += r(t.substr(0, f), s.substr(0, i))), f + b < c && i + b < h && (l += r(t.substr(f + b, c - f - b), s.substr(i + b, h - i - b)))), u ? 200 * l / (c + h) : l }; })(this);

(function (g) {
	var ls = ao.ls = ao.localStorage = {};


	function gk(k) {
		return location.search + '/' + k;
	};

	function set(k, v = null) {
		return localStorage.setItem(gk(k), JSON.stringify(v));
	};

	function get(k) {
		// JSON.parse(null) === null;// undefined 会报错！
		return JSON.parse(localStorage.getItem(ls.gk(k)));
	};

	ls.gk = gk;
	ls.set = set;
	ls.get = get;
})(this);



