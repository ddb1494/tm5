import {} from '/lib/jquery.js';
import {} from '/lib/d3.js';
import debug from '/module/debug.js';


debug.blue(d3)

function z(){
	let fd = new FormData();
	fd.set('lang_src','auto');
	fd.set('lang_dst','zh');
	fd.set('sentence','안녕');
	fd.set('query_type', 1);
	fetch('https://119.28.238.66:7979/kefu-bg/external/call/translate.do',{
		method:'POST',body:fd,
		credentials:'include',
	});
}

z()