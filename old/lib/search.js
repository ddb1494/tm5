'use strict';


class Search {

	constructor(input){
		this.input = input;
	}

	// 可测试input是否与v相同（忽略空白干扰）
	test(v){
		var re = Search.getRegExp(v)
		return this.response = re.test(this.input);
	}

	// 可替换input中的v内容为r（忽略空白干扰）
	replace(v,r){
		var re= this.regExp= Search.getRegExp(v,'g');
		return this.response = this.input.replace(re,r);
	}


	// 可将v转为特别的正则表达式(忽略空白干扰)
	// 有两个连着的斜线（即\\），就先截断为数组，内部调用_getRegExp后再拼接回来
	static getRegExp(v,options,noFormat) {
		if(!v) return ;
		if(noFormat) {
			try{
				v=new RegExp(v,'g');
				return v;
			}catch(err){
				console.warn('Invalid argument - new RegExp('+v+',"g")');
			}
		}
		v=v.split('\\');
		v=new RegExp(v.map(Search._getRegExp).join('\\\\'),options);
		v= v.source==='(?:)' ? Search.VIRTUAL_REGEXP : v;
		return v;
	}
	// 供getRegExp内部调用，即便包含单个斜线（\）也要转义（即前面加斜线）
	static _getRegExp(v) {
		v=v.replace(Search.REGEXP_SPACES,'')
		if(v==='') return '';
		var s=Search.SPACES;
		// return s+v.replace(Search.REGEXP_TOKENS,'\\$&').split('').join(s)+s;
		return s+v.split('').map(function(e){return e.replace(Search.REGEXP_TOKENS,'\\$&');}).join(s)+s;
	}

	static lenSearch(str,dictArray){
		if(!dictArray) return [];
		let i=0, len=str.length, start=i, end=len, chunk,index=0,re,b=false;

		while(true){
			if(end===start) break;
			chunk=str.slice(start,end);

			// 寻找这个内容
			b=dict.some((e,i,a)=>{
				re=new RegExp('^'+Search._getRegExp(chunk)+'$','gi');
				if(re.test(e[0])){
					index=i;
					start=end;
					end=len;
					return true;
				}
				return false;
			})

			if(b){
				// 找到
				console.log('[has]',dict[index]);
				continue;
			}
			end--;
		}
	}

}
// Search类内部常用到的正则相关内容
Object.defineProperties(Search, {
	REGEXP_TOKENS : {value:/[\/\?\*\+\-\^\$\(\)\<\>\[\]\{\}\.\,\:\&\|]/g},
	REGEXP_SPACES : {value:/\s+/g},
	SPACES        : {value:'\\s*'},
	VIRTUAL_REGEXP: {value:{test:function(){return false;},match:function(){return null;}}}
});





// 示例：
// var s= new Search('\\\\abc');// 指定全文
// console.log(s.replace('abc','<b>\\$&</b>'));// 指定目标，并全文替换。
// console.log(s);// Search { input:全文, regExp: 最后一次正则, response: 最后一次运算结果 }
// /[\-\=\|\\\/\,\.\?\*\+\{\}\[\]\(\)\^\$]/g
// /[\/\?\*\+\-\^\$\(\)\<\>\[\]\{\}\.\,\:\&\|]/g

if(typeof module!=='undefined') module.exports=Search;