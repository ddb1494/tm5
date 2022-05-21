class TableEdit {

	constructor(id,parent){
		id= id.indexOf('#')===0? id.slice(1) : id;
		this.id=id;
		// 获取table，如果没有就创建table
		// this.table
		var t=$('#'+id);
		if(t.length==0){
			t=$('<table />').attr('id',id);
		}
		if(parent) {
			t.appendTo(parent);
		}
		t.addClass('tableEdit');
		this.table=t;
		TableEdit.initStyle();
	}

	static initStyle(){
		// console.log(document.readyState);
		if(document.readyState==="complete") TableEdit._initStyle();
		else $(function(){TableEdit._initStyle();});
	}
	static _initStyle(){
		var t=$('#tableEditStyle');
		if(t.length===0) {
			t=$('<style />').attr('id','#tableEditStyle');
		}
		t.text('.tableEdit th,.tableEdit td{ border:1px solid rgba(255,255,255,0.5)!important; background:rgba(198,239,206,0.1)!important; min-width:80px!important; white-space: pre-wrap!important; }');
		t.appendTo('head');
	}

	add(source,target='',...others) {
		var tr=$('<tr></tr>').appendTo(this.table);
		var source=$('<td class="source"></td>').text(source).appendTo(tr);
		var target=$('<td class="target" contentEditable></td>').text(target).appendTo(tr);
		if(others.length){
			for(var i in others){
				$('<td class="reference"></td>').text(others[i]).appendTo(tr);
			}
		}
		return this;
	}

	from(arr) {
		var t=this;
		t.removeAll();
		arr.forEach(function(e){
			t.add.apply(t, e);
			// console.log(e);
		});
		return this;
	}

	removeAll(){
		this.table.empty();
		return this;
	}


	on(f){
		var d=$(document);
		var focus=f.focus;
		var blur=f.blur;
		if(typeof focus==='function') d.on('focus','.target',focus);
		if(typeof blur==='function') d.on('blur','.target',blur);
		return this;
	}

	off(f){
		var d=$(document);
		var focus=f.focus;
		var blur=f.blur;
		if(typeof focus==='function') d.off('focus','.target');
		if(typeof blur==='function') d.off('blur','.target');
		return this;
	}

	getBySource(source){
		return $('.source', this.table);
	}
	getByTarget(target){
		return $('.target', this.table);
	}

	static count(){
		if(typeof this._count !=='number'){
			this._count=0;
		}
		return ++this._count;
	}

}

