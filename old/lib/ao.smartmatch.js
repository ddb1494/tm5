function smartMatch(source,sourceTargetArray,dictArray){
	var ret='';
	var o=diff(source,sourceTargetArray[0]);
	var d1=o.diff1, d2=o.diff2, len1=d1.length, len2=d2.length,d1Value,d2Value;
	var regexp=/^[\x01-\xff]+$/;
	if(len1===len2) {
		for(var i=0; i<len1; i++) {
			d1Value=d2Value='';
			if(regexp.test(d1[i])) {
				sourceTargetArray[1]=sourceTargetArray[1].replace(d2[i], d1[i]);
			}else{
				dictArray.some(function(e){
					if(e && (typeof e[0]==='string') && e[0] && (typeof e[1]==='string') && e[1]){
						if(e[0].trim()===d1[i].trim()) d1Value=e[1];
						if(e[0].trim()===d2[i].trim()) d2Value=e[1];
						if(d1Value&&d2Value) return true;
					}
				});
				if(d2Value){
					sourceTargetArray[1]=sourceTargetArray[1].replace(d2Value,d1Value||d1[i]);
				}else{
					sourceTargetArray[1]+='*'+d2[i]+'->'+d1[i]+(d1Value?'('+d1Value+')':'')+'*';
				}
			}
		}
		ret=sourceTargetArray[1];
	}
	return ret;
}

{
	// test
	let similar = require('../../lib/similarText.js').similar;
	let a='aaaaaaa';
	let b='bbbbaa';
	let s = similar(a, b);
	let aLen=a.length, bLen=b.length;
	let len = aLen + bLen;
	console.log(s, len, s/(len-s));
}


