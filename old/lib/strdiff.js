function strDiff(str1, str2, separator){
	str1 = str1 || "";
	str2 = str2 || "";
	separator = separator || /\b|\s+/;
	// arr中有ele元素
	function hasElement(arr, ele){
		// 内存循环
		var hasItem1 = false;
		for(var i2=0; i2 < arr.length; i2++){
			//
			var item2 = arr[i2] || "";
			if(!item2){
				continue;
			}
			//
			if(ele == item2){
				hasItem1 = true;
				break;
			}
		}
		return hasItem1;
	};
	function inAnotB(a, b){ // 在A中，不在B中
		var res = [];
		for(var i1=0; i1 < a.length; i1++){
			var item1 = a[i1] || "";
			if(!item1){
				continue;
			}
			var hasItem1 = hasElement(b, item1);
			if(!hasItem1){
				res.push(item1);
			}
		}
		return res;
	};
	//
	var list1 = str1.split(separator);
	var list2 = str2.split(separator);
	//
	var diff1 = inAnotB(list1, list2);
	var diff2 = inAnotB(list2, list1);
	// 返回结果
	var result = {
		diff1:diff1,
		diff2:diff2,
		separator : separator
	};
	return result;
};