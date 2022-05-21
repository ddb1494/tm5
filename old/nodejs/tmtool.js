var tmtool = module.exports = {};

tmtool.parse = function (text){
	return new TMToolObject(text);
};





function TMToolObject(text) {
	this.text = text;
}

TMToolObject.prototype.parse = function (text){
	if(text!==undefined) {
		this.text = text;
	}
	var arr  = this.array = this.text.split('\r\n');
	var data = this.data = Object.create(null);
	arr.forEach(function (e,i,a){
		e = a[i] = e.split('\t');
		if(e.length>4) data[i]=e;
	});
	delete this.text;
	return arr;
};

TMToolObject.prototype.toString = function (){
	var arr = this.array;
	var data = this.data;
	var rs = [];
	var v;
	arr.forEach(function (e,i){
		v = data[i];
		rs[i] = v!==undefined ? v.join('\t') : e.join('\t');
	});
	this.text = rs.join('\n');
	return this.text;
};


