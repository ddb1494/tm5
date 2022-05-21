(function(){
	var str;var arr;var target;
	var div= $('<div>').css({
		position:'fixed',top:0,width:'40%',right:10,bottom:10,
		border:'2px solid blue',padding:24,
		background:'rgba(0,0,0,0.5)',zIndex:99999999999
	}).appendTo('body');
	var msg =$('<h5>').text('안녕하세요~ 스마트켓을 위한 붙여넣는 기능입니다.').css({
		'background':'rgba(255,255,255,0.9)','font-weight':'bold'
	}).appendTo(div);
	var ok = $('<button>').text('확인').on('click',function(){
		str = ta.val().trim();
		arr=str.split('\n');ta.remove();ok.remove();
		msg.text('Enter키를 눌러서 입력됩니다...').appendTo(div);
		$(document).on('keydown','.x-segment-tinymce-editor',doWork);
		div.css({width:'20%',right:10});
	}).appendTo(div);
	var ng = $('<button>').text('취소').on('click',function(){
		div.remove();$(document).off('keydown',doWork)}).appendTo(div);div.append('<br>');
	var ta = $('<textarea>').appendTo(div).css({width:'100%',height:window.innerHeight/2});
	function doWork(e){
		if(e.keyCode!==13) return;
		var v = arr.shift();
		if(v){
			$(e.target).html($('<p>').text(v))
		}else{
			msg.text('입력할 데이터가 없습니다.').appendTo(div).css({background:'rgba(255,0,0,0.2)'});
			$(document).off('keydown',doWork);
			setTimeout(function(){div.remove()},5000)};
			console.log(v,e);
		}
	})();
