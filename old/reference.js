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

	static unique(arr){
		var symbol='\u200d';
		return Array.from(new Set(arr.map(e=>e.join(symbol)))).map(e=>e.split(symbol));
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
			if(sv > p) {
				r.push(([]).concat(e,sv,index));
			}
		});

		r.sort(function(a,b){
			// 0:source, 1:target, 2:similar, 3:index
			var a_similar=a[2];
			var b_similar=b[2];
			if(a_similar===b_similar) {
				var a_index=a[3];
				var b_index=b[3];
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
				return sv > p;
			});
			if(b) {
				r.push([sv].concat(e));
			}
		});
		return r;
	}
}

function similar(a,b,c=true) {
	return Math.round(ao.similar(a,b,c));
}




// var ref=new Reference('ko','cn');

// ref.add({ko:'안녕', cn:'你好'});


// // console.log(ref.get('안 녕'))




// console.log('1string 2stming 3sting' .match(/.st(?!ing)/g) )
// console.log('1string 2stming 3sting' .replace(/.st(?!.ing)/g, '$&') )

// 国家是人民的，祖国是大家的。