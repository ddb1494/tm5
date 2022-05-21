(function(g){if(typeof g.ao==='undefined'){g.ao={};}var r=g.ao.similar=function similar(t,s,u){if(null===t||null===s||void 0===t||void 0===s)return 0;var n,o,e,l,f=0,i=0,b=0,c=(t+="").length,h=(s+="").length;for(n=0;n<c;n++)for(o=0;o<h;o++){for(e=0;n+e<c&&o+e<h&&t.charAt(n+e)===s.charAt(o+e);e++);e>b&&(b=e,f=n,i=o)}return(l=b)&&(f&&i&&(l+=r(t.substr(0,f),s.substr(0,i))),f+b<c&&i+b<h&&(l+=r(t.substr(f+b,c-f-b),s.substr(i+b,h-i-b)))),u?200*l/(c+h):l};})(this);


var cn=/[\u4e00-\u9fff\uf900-\ufaff]/;
var ko=/[\u3131-\u314e\u314f-\u3163\uac00-\ud7a3]/;
var rangeMinimal = 0;

this.onmessage=function(e){
	var r, o=e.data;
	if(typeof o==='string') {
		this.postMessage(searchDict(o));
	}else if(typeof o){
		var f;
		for(var k in o) {
			f=this[k];
			if(typeof f==='function') this.postMessage(f.apply(null,o[k]));
		}
	}
};


function searchDict(t, dictArr){
	if(typeof t==='string' && t.length>0 && dictArr instanceof Array && dictArr.length>0) {
		// 判断搜索内容是韩文还是中文还是混合内容
		var tisko = ko.test(t);
		var tiscn = cn.test(t);

		// var reg__s =/\s+/g;// 去掉空白
		var dictSArr = [];
		// var tmpArr = [];
		var dict;
		// var search=t.replace(reg__s,'');// 先去掉要搜索的文中空格
		var similar;
		// if(search.length===0) search=t;// 如果只有空格，那就只搜索空格

		dictArr.forEach(function(e,i){
			var similar=0, v;
			if(typeof e==='string') {
				e=e.split('\t',2);
			}
			for(var k in e){
				v=e[k];
				if(tisko){
					if(ko.test(v)) similar += this.ao.similar(t, v, true);
				}
				if(tiscn){
					if(cn.test(v)) similar += this.ao.similar(t, v, true);
				}
			}

			// dict=e.replace(reg__s,'');
			// if(dict.length===0) dict=e;
			// var b;
			// if(dict.length>=search.length){
			// 	b= dict.indexOf(search)>-1;
			// }else{
			// 	b= search.indexOf(dict)>-1;
			// }
			// if(b) {
			// 	// 词典记录中包含本句子
			// 	dictSArr.push(e);
			// }else{
			// 	// 近似度匹配结果
			// 	similar=this.ao.similar(t,e,true);
			// 	b = similar>30;
			// 	if(b) {
			// 		tmpArr.push([e, similar]);
			// 	}
			// }
			// similar=this.ao.similar(t,e,true);
			// b = similar>30;
			// if(b) {
			// 	tmpArr.push([e, similar]);
			// }
			// similar=this.ao.similar(t,dict,true);
			b = similar > rangeMinimal;
			if(b) {
				dictSArr.push(e.concat(similar));
			}
		});
		// if(tmpArr.length>0) {
		// 	tmpArr.sort(function(a,b){
		// 		return a[1]>b[1] ? -1 : (a[1]===b[1] ? 0 : 1);
		// 	});
		// 	tmpArr=tmpArr.map(function(e){
		// 		return e[0]+'\t['+Math.round(e[1])+'%]';
		// 	});
		// 	dictSArr=dictSArr.concat(['----------------------------'],tmpArr);
		// }
		dictSArr.sort(function(a,b){
			return a[2]>b[2] ? -1 : (a[2]===b[2] ? 0 : 1);
		});
		// dictSArr=dictSArr.map(function(e){
		// 	return e[0]+'\t['+Math.round(e[1])+'%]';
		// });

		return {searchDict: dictSArr};
	}
}



function load(name){
	return {load:localStorage.getItem(location.search+location.hash+'/'+name)};
}