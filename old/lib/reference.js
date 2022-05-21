'use strict';

// require   'ao.similar.js'
class Reference{
	constructor(arr){
		if(!(arr instanceof Array)) arr=[];
		this.from(arr);
	}

	// [ ['source','target','other', ...], ... ]
	from(arr) {
		this.array=Reference.unique(arr);
	}

	add(source,target){
		this.array.push([source,target]);
		this.from(this.array);
	}

	static enlistKey(arr){
		return arr.filter(function(e){
			return e[0] && e.toString().trim().length>0;
		});
	}

	unique(arr){
		// var o={},  a=[],  da=arr instanceof Array?arr:(this.array||[]), row, k,  v;
		// for(var i in da){
		// 	row=da[i];
		// 	if(row) {
		// 		k=da[i][0];
		// 		if(k===undefined||String(k).trim()===0) continue;
		// 		v=da[i][1];
		// 		if(v===undefined||String(v).trim()===0) continue;
		// 		o[k]=v;
		// 	}
		// }
		// for(k in o){
		// 	a.push([k,o[k]]);
		// }
		// return a;
		return arr;
	}
	static unique(arr){
		// var o={},  a=[],  da=arr||[],  row,  k,  v;
		// for(var i in da){
		// 	row=da[i];
		// 	if(row) {
		// 		k=da[i][0];
		// 		if(k===undefined||String(k).trim()===0) continue;
		// 		v=da[i][1];
		// 		if(v===undefined||String(v).trim()===0) continue;
		// 		o[k]=v;
		// 	}
		// }
		// for(k in o){
		// 	a.push([k,o[k]]);
		// }
		// return a;
		return arr;
	}
	
	// [ ['source','target','other', ...], ... ]
	concat(arr) {
		this.from(this.array.concat(arr));
	}

	search(s,p=0,i=0){
		var r=this.result=[];
		if(typeof s==='undefined' || typeof s!=='string') return r;
		this.array.forEach(function(e,index){
			var _s=e[i], sv=similar(s, e[i], true);
			if(sv >= p) {
				r.push(([]).concat(e,sv,index));
			}
		});

		r.sort(function(a,b){
			// 0:source, 1:target, 2:similar, 3:index
			var a_similar=parseFloat(a[2]);
			var b_similar=parseFloat(b[2]);
			if(a_similar===b_similar) {
				var a_index=parseFloat(a[3]);
				var b_index=parseFloat(b[3]);
				return a_index>b_index? -1: (a_index===b_index? 0 : 1)
			}else{
				return a_similar>b_similar?-1:(a_similar===b_similar?0:1);
			}
		});
		// console.log(s,r,this.array);
		// r.reverse();
		return r;
	}
	searchAll(s,p=0){
		var r=this.result=[];
		if(typeof s==='undefined' || typeof s!=='string') {
			return r;
		}
		this.array.forEach(function(e){
			var sv;
			var b = e.some(function(ee){
				sv = similar(s, ee, true);
				return sv >= p;
			});
			if(b) {
				r.push([sv].concat(e));
			}
		});
		return r;
	}
}

function similar(a,b,c=true) {
	return Number(ao.similar(a,b,c).toFixed(2));
}




// var ref=new Reference('ko','cn');

// ref.add({ko:'안녕', cn:'你好'});


// // console.log(ref.get('안 녕'))




// console.log('1string 2stming 3sting' .match(/.st(?!ing)/g) )
// console.log('1string 2stming 3sting' .replace(/.st(?!.ing)/g, '$&') )

// 国家是人民的，祖国是大家的。