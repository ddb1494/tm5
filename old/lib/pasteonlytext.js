window.addEventListener('paste',function(e){
	var c=e.clipboardData;
	c.setData('text/html',c.getData('text/plain'));

	console.log(c.getData('text/plain'));
	console.log(c.getData('text/html'));

},true);