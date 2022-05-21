function saveSource(){
	_saveSource('paste');
	_saveSource('source');
	_saveSource('dict');
	_saveSource('copySource');
	_saveSource('copyResultTextarea');

	var d=new Date();
	logpush('[저장]'+d.tcs+'.'+d.ms);
}
function loadSource(){
	_loadSource('paste');
	_loadSource('source');
	_loadSource('dict');
	_loadSource('copySource');
	_loadSource('copyResultTextarea');
	$('#source').trigger('input');
	$('#dict').trigger('change')
	// logpush('[loaded data] ')
}

function _saveSource(name){
	setLocalStorage(name, $('#'+name).val());
}
function _loadSource(name){
	$('#'+name).val(getLocalStorage(name));
}


function setLocalStorage(k,v){
	return localStorage.setItem(location.search+'/'+k, v);
}
function getLocalStorage(k) {
	return localStorage.getItem(location.search+'/'+k)
}