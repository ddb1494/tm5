function maskScreen() {
	let mask=$('#mask')
	if(mask.length===0){
		mask=$('<div><menu /><content /></div>').css({
			width:'100%',height:'100%',
			position:'fixed', left:0, top:0,
			background:'rgba(0,0,0,.8)'
		})
		// .on('contextmenu',(e)=>{ e.preventDefault() mask.detach() })
	}
	mask.appendTo('body')
	return mask;
}