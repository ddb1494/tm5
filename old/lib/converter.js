class Converter {
	static stringToArray(t,n=0){
		return t.split('\r?\n').map(e=>e.split('\t')).filter(e=>e.length>n);
	}
	
	static arrayToString(a) {
		var tmp=[];
		a=a.map(function(e){
			if(e.length>0 && e instanceof Array) {
				e.map(e=>e.trim()).join('\t');
			}
		})
		return tmp;
	}

	static arrayToTable(){

	}

	static tableToArray(){

	}
}
