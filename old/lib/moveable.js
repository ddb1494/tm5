class Mover {

	constructor(t) {
		t.instance=this;
		this.content = t;
		this.content.classList.add('mover');
		this._initStyle();
		this._onmousedown=Mover._onmousedown.bind(this);
		this._onmouseup=Mover._onmouseup.bind(this);
		this._onmousemove=Mover._onmousemove.bind(this);
	}

	_initStyle(){
		var s=document.querySelector('#MoverStyle');
		if(!s){
			s=document.createElement('style');
			s.setAttribute('id','MoverStyle');
			document.head.appendChild(s)
			s.textContent='.mover-bar{cursor:move!important;user-select:none!important;}.mover{position:absolute!important;}';
		}

	}

	start(t){
		if(!t) t=this.content;
		this.setDragBar(t);
	}

	stop(){
		this.clearDragBar();
	}

	setDragBar(t) {
		t.content=this.content;
		this.clearDragBar();
		this.dragBar = t;
		t.classList.add('mover-bar');
		window.addEventListener('mousedown', this._onmousedown);	
		window.addEventListener('mouseup', this._onmouseup);
	}

	clearDragBar() {
		var t = this.dragBar;
		if(t) {
			t.classList.remove('mover-bar');
			window.removeEventListenr('mousedown', this._onmousedown);
			window.removeEventListenr('mouseup', this._onmouseup);
			window.removeEventListenr('mousemove', this._onmousemove);
			delete t.content;
			delete this.dragBar;
		}
	}
	static _onmousedown(e){
		var t=e.target, c=this.content;
		c.style.tabIndex=Number.MAX_SAFE_INTEGER;
		var b=t.classList.contains('mover-bar');
		if(b) window.addEventListener('mousemove', this._onmousemove);
		c.offsetXY={x:e.offsetX,y:e.offsetY};
	}
	static _onmouseup(e){
		delete this.content.style.tabIndex;
		window.removeEventListener('mousemove', this._onmousemove);
	}
	static _onmousemove(e){
		var c=this.content;
		c.style.left=(e.pageX-c.offsetXY.x)+'px';
		c.style.top=(e.pageY-c.offsetXY.y)+'px';
	}
}


// window.onmousemove=function(e){
// 	console.log(e.clientY, e.layerY, e.pageY, e.offsetY, e.y);
// }




