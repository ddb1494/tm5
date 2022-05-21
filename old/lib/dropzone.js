(function (){


	function Dropzone(t){
		this._handles = {};
		
		if(typeof t === 'text') {
			t=document.querySelector(t);
		}
		if(t instanceof EventTarget){
			t.addEventListener('drop',this.load)
		}

	}



	Dropzone.prototype.load = function(e) {
		console.log(this)
	}

Dropzone.prototype.on = function(e) {

}
Dropzone.prototype.off = function(type, handle){};

})();