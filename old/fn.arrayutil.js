function replaceIndataToArray(indata){
	var i=indata.indexOf('[Table]');
	if(i!==-1){
		indata = indata.slice(i+7);
	}
	indata.trim();
	var rows=indata.split(/\r?\n/);
	return rows
	.filter(function(e){
		if(e && (typeof e==='string')) {
			return e.trim().length!==0;
		}
	})
	.map(function(e){
		return e.split('\t');
	});
	// var leng = row.length;
	// if(row == 1 && row[leng] == '') row[leng].pop();
	// for (var i = 0; i < row.length; i++) {
	// 	row[i]=row[i].split('\t');
	// }
	// return row;
}


//Array数组数据转换为UI表格格式；
function replaceArrayToTableUI(arr){
	var rs = '<table>';
	for (var i=0, iLen=arr.length; i<iLen; i++) {
		rs += '<tr>';
		for (var j=0, jLen=arr[i].length; j<jLen; j++) {
			// console.log('row:',i,j, arr[i][j])
			rs += '<td>'+htmlentities(arr[i][j])+'</td>';
		}
		rs += '</tr>';
	}
	rs += '</table>';
	return rs;
}


function htmlentities(v){
	// if(!v) console.warn(v)
	return v.toString().replace(/&/g,'&#38;').replace(/</g, '&#60;').replace(/>/g, '&#62;').replace(/"/g,'&#34;').replace(/'/g,'&#39;');
}



function parseDictTextToArray(txt) {
	var rows=txt.split('\n');
	var result = rows.map(function(e,i,a){
		return e.split('\t');
	});
	return result;
}