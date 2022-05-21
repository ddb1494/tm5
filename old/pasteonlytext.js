$(window).on('paste',function(e){
	var o=e.originalEvent;
	var c=o.clipboardData;
	c.setData('text/html',c.getData('text/plain'));
});