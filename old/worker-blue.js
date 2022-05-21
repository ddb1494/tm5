const TERM_LEGNTH = 16;

let r = new RegExp('['+'\\/?:!(){}<>[]|=$^*+-.'.replace(/(?:)/g,'\\').slice(1,-1)+']', 'g');

self.addEventListener('message', ({ data }) => {
	let { source, dictArray, termLength } = data;
	
	termLength = termLength || TERM_LEGNTH;
	
	let result = [];

	let __s__ = source.replace(/\s+/g,'');
	dictArray.forEach((row,index)=>{
		let [s, t]=row;

		if((s===t) || (s.length > termLength) || /\d/.test(s)) {
			return ;
		}

		let i = __s__.indexOf(s.replace(/\s+/g,''));
		if(i !== -1) {
			result.push([s,t,i,index]);
		}
	});
	result.sort((a,b)=>a.i<b.i?1:0);
	self.postMessage(result);
});


