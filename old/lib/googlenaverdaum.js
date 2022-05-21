function google(v,t,f){
	return $.ajax({
			url:'https://cihot.com/googles/',
			dataType:'json',
			data: {
				q:v,
				s:'auto',
				t:t||'zh-CN'
			},
			method:'POST'
		}).done(function (o){
			if(typeof f==='function') f(o);
		});
}
function naver(v,t,f){
	return $.ajax({
		url:'https://cihot.com/naver/',
			dataType:'json',
			data: {
				q:v,
				s:'auto',
				t:t||'zh-CN'
			},
			method:'POST'
		}).done(function (o){
			if(typeof f==='function') f(o);
		});
}
function daum(v,t,f){
	return $.ajax({
		url:'https://cihot.com/daum/',
			dataType:'json',
			data: {
				q:v,
				s:'auto',
				t:t||'zh-CN'
			},
			method:'POST'
		}).done(function (o){
			if(typeof f==='function') f(o);
		});
}
