function arraySearchEqual(arr, cellIndex, searchText, resultCellIndex) {
	var resultCell = [];
	for(var i=0,e,len=arr.length; i<len; i++) {
		e = arr[i];
		if(e[cellIndex]===searchText) resultCell.push([e[cellIndex], e[resultCellIndex], i]);
	}
	return resultCell;
}


function arraySearch(arr, cellIndex, searchText, resultCellIndex) {
	var resultCell = [];
	for(var i=0,e,len=arr.length; i<len; i++) {
		e = arr[i];
		if(e[cellIndex].indexOf(searchText)!==-1) resultCell.push([e[cellIndex], e[resultCellIndex], i]);
	}
	return resultCell;
}

function arrayInsert(arr, index, value) {
	arr.forEach(function(e){
		e.splice(index, 0, value);
	})
}

function arrayReplace(arr, searchCellIndex, searchCellText, replaceCellIndex, replaceCellText, cancelRowIds) {
	var result = [];
	arr.forEach(function(e,i){
		if(Array.isArray(cancelRowIds)){
			if(cancelRowIds.indexOf(i)!==-1) return ;
		}
		
		if(e[searchCellIndex].indexOf(searchCellText)!==-1){
			result.push(e);
			e[replaceCellIndex] = e[replaceCellIndex].replace(new RegExp(searchCellText.replace(/\\/,'\\\\'),'g'), replaceCellText);
			// console.log(e)
		}
	});
	console.log(result)
	return result;
}

//  jQuery need
function tableToArray(id){
	var arr = [];
	$(id).find('tr').each(function(i,tr){
		var row = [];
		$(tr).find('td').each(function(i,td){
			row.push(td.textContent.trim());
		});
		arr.push(row);
	});
	return arr;
}