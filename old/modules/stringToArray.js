// 字符串转为数组
function stringToArray(text, minLength = 0) {
	let rs = [];

	if (typeof text !== 'string') {
		// 静默处理，不报错！
		console.warn('Need a string!', text);
		return rs;
	}
	
	text.split('\n').forEach(function (line) {
		if (line.trim()) {
			let row = line.split('\t').map(function (cell) {
				return cell.trim();
			})
			if (row.length >= minLength) rs.push(row);
		}
	})
	return rs;
}

export default stringToArray;