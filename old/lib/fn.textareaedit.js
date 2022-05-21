function textareaEdit(textarea) {
	
}


// ta.setRangeText('替换内容');// 默认，替换选区内容
// ta.setRangeText('替换内容', start, end);// 替换指定索引位置

// 选择
// 全选
// ta.select();
// ta.setSelectionRange(0,1);


// cols, rows, name, placeholder, readonly, wrap, from, disabled, dirname, autofocus, required


Object.defineProperty(HTMLTextAreaElement.prototype, 'autosize', {
	set (autosize=true){
		this._autosize=autosize;
		this[autosize?'addEventListener':'removeEventListener']('input', this._onautosize);
	},
	get(){
		return this._autosize;
	}
});
HTMLTextAreaElement.prototype._onautosize = function (e) {
	var arr = this.arr = this._run ? this.arr : this.value.split('\n');
	var str  = this.value;
	var width = 0;
	var height = 1;
	arr.forEach(function(l){
		width=Math.max(width, l.length);
	});
	height = arr.length;
	this.cols = width*2;
	this.rows = height+1;
};


Object.defineProperty(HTMLTextAreaElement.prototype, 'run', {
	set (doRun=true){
		this._run=doRun;
		this[doRun?'addEventListener':'removeEventListener']('input', this._onrun);
	},
	get () {
		return this._run;
	}
});

HTMLTextAreaElement.prototype._onrun = function (e) {
	this.arr = this.value.split('\n');
};


// line { index, text }
Object.defineProperty(HTMLTextAreaElement.prototype, 'line', {
	get (){
		var end = this.selectionEnd;
		var text= this.value.slice(0,end);
		var arr = text.split('\n');
		var index = arr.length-1;
		arr = this.arr = this._run ? this.arr : this.value.split('\n');
		text = arr[index];
		total = arr.length;

		return {text, index, total};
	}
});

Object.defineProperty(HTMLTextAreaElement.prototype, 'selectionText', {
	get (){
		return this.value.substring(this.selectionStart, this.selectionEnd);
	}
});