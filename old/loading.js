void function (){
	let mask = document.createElement('div');
	let s = mask.style;
	s.background = 'white';
	s.width = '100vw';
	s.height = '100vh';
	s.position = 'fixed';
	s.zIndex = 9;
	s.display = 'grid';
	mask.textContent = '.';
	let timeout = setTimeout(function(){
		mask.textContent = mask.textContent + '.';
	}, 1000);
	window.addEventListener('loadend', onLoadEnd);
	
	function onLoadEnd (e){
		clearTimeout(timeout);
		//mask.remove();
		window.removeEventListener(onLoadEnd);
	}
}();