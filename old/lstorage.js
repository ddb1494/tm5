class LStorage{
	static gk(k){
		return location.search+'/'+k;
	}
	
	static set(k,v=null){
		return localStorage.setItem(this.gk(k), JSON.stringify(v));
	}
	static get(k){
		// JSON.parse(null) === null;// undefined 会报错！
		return JSON.parse(localStorage.getItem(this.gk(k)));
	}
}