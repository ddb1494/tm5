// callback 无法正常发动
function tagDrag(tag, callback) {
	tag.draggable=true
	// // tag.ondragleave = dodrag;
	// // tag.ondragenter = dodrag;
	// // tag.ondragend = dodrag;
	// tag.ondrag    = dodrag;

	tag.ondragover  = function(e){
		e.dataTransfer.effectAllowed = 'copy';
	};
	tag.addEventListener('dragstart', function(e){
		e.dataTransfer.setData('id', e.target.id);
		e.dataTransfer.effectAllowed = 'copy';
		if(typeof callback==='function') callback(e);
	});

	function dodrag(e){
		e.preventDefault();
	}
}

function tagDrop(tag, callback) {
	tag.ondragover = function(e){
		e.preventDefault();
	}
	tag.ondrop=function(e) {
		e.preventDefault();
		e.dataTransfer.effectAllowed = 'copy';
		var id = e.dataTransfer.getData('id');
		var o = document.createElement('div');
		o.setAttribute('uid', id);
		o.textContent = document.querySelector('#'+id).textContent;
		e.currentTarget.appendChild(o);
		o.onclick=onRemoveFromDictUIRecordUI;
		
		reflushDict(e.target);
		if(typeof callback==='function') callback(e);
	}
}
function onRemoveFromDictUIRecordUI(e){
	var p = e.target.parentElement;
	var pid= p.getAttribute('id');
	var uid= e.target.getAttribute('uid');
	var s;
	var i; 

	reflushDict(p);
	if(pid==='dictUI'){
		s = sys.cache.useDictIds;
		i = s.indexOf(uid);
		if(i!==-1) s.splice(i,1);
	}else if (pid==='recordUI')	{
		s = sys.cache.useRecordIds;
		i = s.indexOf(uid);
		if(i!==-1) s.splice(i,1);
	}
	e.target.remove();
};



function reflushDict(target){
	var id = target.id;
	if(id){
		var name = id.replace('#','').replace('UI','');
		name=name.slice(0,1).toUpperCase()+name.slice(1);
		// console.log(target.id, target.id.replace('#','').replace('UI',''))
		sys['use'+name+'Ids'] = Array.prototype.map.call(target.children, function(e){
			return e.getAttribute('uid');
		});
	}
}


//__________________________________________________________________________
function tagDropFile(tag,callback){
	var css = '.dragenter{border:2px solid #f00 !important;}\n.drop{border:2px solid #00f;background:#ddd !important;}';

	if(callback===null) {
		tag.ondrop=tag.ondragleave=tag.ondragover=tag.ondragenter=null;
		return ;
	}

	var dropCss=document.querySelector('#dropCss');
	if(dropCss===null){
		dropCss = document.createElement('style');
		dropCss.setAttribute('id','dropCss');
		dropCss.textContent = css;
		document.head.appendChild(dropCss);
	}
	
	tag.ondragenter=function(e){
		e.preventDefault();
		tag.classList.add('dragenter');
	}
	tag.ondragover=function(e){
		e.preventDefault();
	}
	tag.ondragleave=function(e){
		e.preventDefault();
		tag.classList.remove('dragenter');
	}
	tag.ondrop=function(e){
		e.preventDefault();
		tag.classList.add('drop');
		var
		files = e.dataTransfer.files,
		len=files.length,
		i=0;
		var file,fr,result=[];
		if(len){
			while(file=files.item(i)) {
				fr = new FileReader();
				fr.file = file;
				fr.readAsText(file);
				fr.onload=function(e){
					var fr = e.target, file=fr.file, i=file.name.lastIndexOf('.')+1;
					file.text = fr.result;
					file.ext = i ? file.name.slice(i) : '';
					result.push(file);// 插入了文件。 file.name, file.text, file.ext
					if(--len ===0) {
						tag.classList.remove('dragenter');
						tag.classList.remove('drop');
						callback(result);
					}
				}
				i++;
			}
		}else{
			callback(result);
		}
	}
}


//-------------------------------------------------------------------------
function createUniqueKey(size=36,datePrefix=true) {
    let s = [];
    let chars = createUniqueKey.chars;
    let len  = chars.length;
    let time = Date.now().toString(36);

    for (let i = 0; i < size; i++) {
        s[i] = chars.substr(Math.floor(Math.random() * len), 1);
    }
	let uk = s.join('');
	
	return datePrefix ? Date.now().toString(36)+uk : uk;
}
createUniqueKey.chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';




//---------------------------------------------------------------------------
function* count(start=0,step=1){
	while(true){
		yield start;
		start+=step;
	}
}

class Counter{
	constructor(){
	}
	init(start, step) {
		this.start = start
		this.step = step
	}
	next(){
		let v = this.start + this.step
		this.start = v
		return v
	}
}
	


//----------------------------------------------------------------------------
function replaceIndataToArray(indata){
	var i=indata.indexOf('[Table]');
	if(i!==-1){
		indata = indata.slice(i+7);
	}
	indata.trim();
	var rows=indata.split(/\r?\n/);
	return rows
	.filter(function(e){
		if(e && (typeof e==='string')) {
			return e.trim().length!==0;
		}
	})
	.map(function(e){
		return e.split('\t');
	});
	// var leng = row.length;
	// if(row == 1 && row[leng] == '') row[leng].pop();
	// for (var i = 0; i < row.length; i++) {
	// 	row[i]=row[i].split('\t');
	// }
	// return row;
}


//Array数组数据转换为UI表格格式；
function replaceArrayToTableUI(arr){
	var rs = '<table>';
	for (var i=0, iLen=arr.length; i<iLen; i++) {
		rs += '<tr>';
		for (var j=0, jLen=arr[i].length; j<jLen; j++) {
			// console.log('row:',i,j, arr[i][j])
			rs += '<td>'+htmlentities(arr[i][j])+'</td>';
		}
		rs += '</tr>';
	}
	rs += '</table>';
	return rs;
}


function htmlentities(v){
	// if(!v) console.warn(v)
	return v.toString().replace(/&/g,'&#38;').replace(/</g, '&#60;').replace(/>/g, '&#62;').replace(/"/g,'&#34;').replace(/'/g,'&#39;');
}



function parseDictTextToArray(txt) {
	var rows=txt.split('\n');
	var result = rows.map(function(e,i,a){
		return e.split('\t');
	});
	return result;
}
//----------------------------------------------------------------------------
function arraySearchEqual(arr, cellIndex, searchText, resultCellIndex) {
	var resultCell = [];
	for(var i=0,e,len=arr.length; i<len; i++) {
		e = arr[i];
		if(e[cellIndex]===searchText) resultCell.push([e[cellIndex], e[resultCellIndex], i]);
	}
	return resultCell;
}


function arraySearch(arr, cellIndex, searchText, resultCellIndex) {
	var resultCell = [];
	for(var i=0,e,len=arr.length; i<len; i++) {
		e = arr[i];
		if(e[cellIndex].indexOf(searchText)!==-1) resultCell.push([e[cellIndex], e[resultCellIndex], i]);
	}
	return resultCell;
}

function arrayInsert(arr, index, value) {
	arr.forEach(function(e){
		e.splice(index, 0, value);
	})
}

function arrayReplace(arr, searchCellIndex, searchCellText, replaceCellIndex, replaceCellText, cancelRowIds) {
	var result = [];
	arr.forEach(function(e,i){
		if(Array.isArray(cancelRowIds)){
			if(cancelRowIds.indexOf(i)!==-1) return ;
		}
		
		if(e[searchCellIndex].indexOf(searchCellText)!==-1){
			result.push(e);
			e[replaceCellIndex] = e[replaceCellIndex].replace(new RegExp(searchCellText.replace(/\\/,'\\\\'),'g'), replaceCellText);
			// console.log(e)
		}
	});
	console.log(result)
	return result;
}

//  jQuery need
function tableToArray(id){
	var arr = [];
	$(id).find('tr').each(function(i,tr){
		var row = [];
		$(tr).find('td').each(function(i,td){
			row.push(td.textContent.trim());
		});
		arr.push(row);
	});
	return arr;
}
//----------------------------------------------------------------------------
function doubleClickFromListUI(e) {
	var target=e.target;
	var uid=target.id;
	var file=list[uid];
	sys.cache.workFileId = uid;
	sys.cache.countNum = file.arr.arrRowCount;
	// sys.cache.finishNum
	work.allDatas = list[uid].arr;
	showTable('#workUI', work.allDatas);

}

function showTable(id, arr) {
	var table = $(replaceArrayToTableUI(arr))

	table.find('tr').each(function(i,e){
	  $(e).find('td:gt(1)').addClass('hide').end()
	  .find('td:nth-child(2)').attr('contentEditable',true)
	  .on('keydown',function(e){
	  	if(e.keyCode===9) {
	  		if(e.shiftKey){
	  			$(e.target).removeClass('ok');	
	  		}else{
	  			$(e.target).addClass('ok');
	  		}
	  		
	  	}
	  });
	});

	// console.log(arr)

	$(id).html(table);
}

//----------------------------------------------------------------------------
function download(){

	$('#workUI').find('tr').each(function(i,tr){})

	var table = tableToArray('#workUI');

	table = table.map(function(e){
		return e.join('\t');
	}).join('\n');


	var oldText = list[sys.cache.workFileId].raw.text;
	var i = oldText.indexOf('[Table]');
	
	var prefix;
	if(i!==-1) {
		prefix  = oldText.slice(0, oldText.indexOf('[Table]')+7)+'\n';
	}else{
		prefix = '[FieldNames!!!!]\t\t\t\t\t\t\nTextKey	Text\tComment\tSeasonCode\t\t\t\n\t\t\t\t\t\t\n[Table]\t\n';
	}
	var result  = list[sys.cache.workFileId].raw.text = prefix + table;

	console.log(prefix);

	createAndDownloadFile(list[sys.cache.workFileId].raw.name, result);
}



function createAndDownloadFile(fileName, content) {
	var aTag = document.createElement('a');
	var blob = new Blob([content]);
	aTag.download = fileName;
	aTag.href = URL.createObjectURL(blob);
	aTag.click();
	URL.revokeObjectURL(blob);
}


// 김 희준, [12.03.18 00:08]
// saveWork 逻辑，把work[searchDatas][1]  替换在list[$file001][arr]中

// 김 희준, [12.03.18 00:08]
// 然后把那个array 转换为输出格式



// buttonId:  saveToLocalBtn, saveToServerBtn, loadFromLocalBtn, loadFromServerBtn
// funcion:   saveToLocal, saveToServer, loadFromLocal, loadFromServer
// work, sys, list




function saveToLocal(){
	var prefix = location.search;
	localStorage.setItem(prefix + '_work', JSON.stringify(work));
	localStorage.setItem(prefix + '_sys', JSON.stringify(sys));
	localStorage.setItem(prefix + '_list', JSON.stringify(list));
}

function loadFromLocal(){
	var prefix = location.search, data;

	if(data=localStorage.getItem(prefix+'_work')) {
		work = JSON.parse(data);
	}
	if(data=localStorage.getItem(prefix+'_sys')) {
		sys = JSON.parse(data);
	}
	if(data=localStorage.getItem(prefix+'_list')) {
		list = JSON.parse(data);
		listVToListUI();
		sysCacheToUI();
	}
	// console.log('list',list)
	// console.log('work',work)
	// console.log('sys',sys)
}

function saveToServer(){

}
function loadFromServer(){
	listVToListUI();
	sysCacheToUI();

}



// 根据全局变量 list ，显示 listUI 的内容。
function listVToListUI(){
	var listUI = $('#listUI');
	if(listUI.length===0) {
		listUI = $('<div id="listUI"></div>').appendTo('body');
	}

	var tag, o, id, raw;
	for(var id in list) {
		// console.log(id);
		o   = list[id];
		raw = o.raw;
		tag = $('<div>').addClass('file').attr('id',id).text(raw.name).appendTo(listUI).get(0);
		tag.ondblclick=doubleClickFromListUI;
		if(raw.name.indexOf('.dic.')!==-1){
			o.arr = parseDictTextToArray(raw.text);
			tagDrag(tag);
		}else{
			o.arr = replaceIndataToArray(raw.text);
			tagDrag(tag);
		}
		o.arrCellCount = o.arr[0].length;
		o.arrRowCount  = o.arr.length;
	}
}

function sysCacheToUI(){
	sys.cache.useDictIds.forEach(function(e){
		createDiv(list[e].raw.name, e, '#dictUI');
	})
	sys.cache.useRecordIds.forEach(function(e){
		createDiv(list[e].raw.name, e, '#recordUI');
	})

	function createDiv(filename,uid, parent){
		return $('<div>').addClass('file').attr('uid',uid).text(filename).appendTo(parent).on('click',onRemoveFromDictUIRecordUI);
	}







}
//----------------------------------------------------------------------------!!!!!!!!!!!!!!!!
loadFromLocal();

if(!list) {
	var list = {};
}
if(!sys){
	var sys = {}
	sys.cache = {};
	sys.cache.fromIndex = 5;//몇번째 열을  (work원문에서 검색)(원문열은)
	sys.cache.toIndex = 1; //몇번째 열로 번역하겠다. (편집가능한열) (work번역문에서 검색)(번역열은)
	sys.cache.canIndexs =[0,2,3,4,6]; //값없으면 자동 생성, 아님 수동 생성, 수동배열
	sys.login = {};
	sys.login.projectId = 'enName';	//프로젝트 영어 이름
	sys.login.projectName= 'koName';	//프로젝트 한글 이름
	sys.login.userId = 'test1';		//테스트 유저
	sys.login.password = 'test1'; 		//테스트 유저 파스워드
	sys.login.autoLogin = true; 		//자동 로그인
	sys.login.sid = 'kahge2iofh9324r92hefdsaihflh'; 
	sys.cache = {};
}
if(!work) {
	var work = {};
}





tagDropFile($('#drop').get(0), function (arr) {
	var listUI = $('#listUI');
	if(listUI.length===0) {
		listUI = $('<div id="listUI"></div>').appendTo('body');
	}
	// 遍历所有拖拽进来的文件
	arr.forEach(function(e){
		var id=createUniqueKey();
		var o=list[id] = {
			raw:{
				name:e.name, 
				text:e.text, 
				ext:e.ext, 
				size:e.size, 
				lastModifiedDate:e.lastModifiedDate, 
				lastModified:e.lastModified
			},
			uselistConfId:'conf001'
		};
		// 新建listUI中的div标签
		var tag = $('<div>').addClass('file').attr('id',id).text(e.name).appendTo(listUI).get(0);
		// 在list双击文件时，显示table
		tag.ondblclick=	doubleClickFromListUI;
		if(e.text.search(/^\[FieldNames\]\n/i)===0){
			o.arr = replaceIndataToArray(e.text);

			tagDrag(tag);
		}else{
			o.arr = parseDictTextToArray(e.text);
			tagDrag(tag);
		}
		o.arrCellCount = o.arr[0].length;
		o.arrRowCount  = o.arr.length;
	});
});
function listVToListUI(){
	var listUI = $('#listUI');
	if(listUI.length===0) {
		listUI = $('<div id="listUI"></div>').appendTo('body');
	}

	var tag, o, id, raw;
	for(var id in list) {
		o   = list[id];
		raw = o.raw;
		tag = $('<div>').addClass('file').attr('id',id).text(raw.name).appendTo(listUI).get(0);
		tag.ondblclick=doubleClickFromListUI;

	}
}
function listUIToListV(){

}



tagDrop($('#dictUI').get(0), onTagDrop);
tagDrop($('#recordUI').get(0), onTagDrop);

function onTagDrop(e) {
	var tar=e.target, id=tar.getAttribute('id'), s;
	if(id==='dictUI'){
		s=sys.cache.useDictIds=[];
	}
	else if(id==='recordUI'){
		s=sys.cache.useRecordIds=[];
	}
	$(tar).find('[uid]').each(function(i,e){
		var uid = e.getAttribute('uid');
		if(s.indexOf(uid)===-1) {
			s.push(uid);
		}else{
			e.remove();
		}
	});

	console.log(sys.cache)
}






// 搜索，替换
$('#searchBtn').on('click',function(e){
	var arr = $('form').get(0).searchArea.value === 'global' ? work.allDatas : work.searchDatas;
	work.searchDatas = arraySearch(arr, 0, $('#search').val(), 1);
	showTable('#searchUI', work.searchDatas);
	form.searchArea.value = 'local';
});

$('#replaceBtn').on('click',function(e){
	var arr = $('form').get(0).searchArea.value === 'global' ? work.allDatas : tableToArray('#searchUI');
	var cancelRowIds;

	console.log('search', arr)
	work.replaceDatas = arrayReplace(arr, 0, $('#search').val(), 1, $('#replace').val(), cancelRowIds);

	showTable('#searchUI', work.replaceDatas);
	showTable('#workUI', work.allDatas)

})

$('#search').on('change',function(e){
	if(e.target.value.length===0) {
		$('#searchUI').empty()
	}
})


window.onbeforeunload = saveToLocal;


// 文件单击时，设置file setting
$('#listUI [id]').on('click',function(e){
	var target = e.target;
	var uid = target.getAttribute('id');
	var file = list[uid];

	$('#stFilename').val(file.raw.name);
	// $('#')
	list[uid].fileUniqueId = uid; 	//자동생서하는 고유키($filename부분)
	list[uid].fileName = file.raw.name; 		//한글 파일명
	list[uid].importType = $('#stImportType').val(); 		//drageFile, parseText
	list[uid].parseText = $('#stParseText').val(); 		//붙여넣는 텍스트
	list[uid].textType = $('#stTextType').val(); 		//dict사전 전용 파일, recode기록 전용 파일.
	list[uid].createUser = sys.login.userId; 	//생성자
	list[uid].remarksText = $('#stRemarksText').val(); 	//비고

	var table = $('#stColSetting').html(replaceArrayToTableUI(file.arr.slice(0,3))).find('table');
	var len=table.find('tr:first td').length;
	var i=0;
	var tr=$('<tr>').prependTo(table);


	// Array.from($('#stColSetting table th').map(function(_,th){return th.textContent;}));// th values
	while(i<len){
		$('<th>').appendTo(tr).prop('contentEditable',true).css('border','1px solid green');
		i++;
	}


	list[uid].colNames = [] ; 	// ["TextKey", "Trans.Text", "Trans.Comment", "Season", "M.O", "Origin.Text", "Orign.Comment"]; //
	list[uid].sourceLang = $('#stSourceLang').val(); 	//한글에서
	list[uid].targetLang = $('#stTargetLang').val();	//중국어로번역함
	list[uid].sourceIndex =$('#stSourceIndex').val();	//몇번째 열을  (work원문에서 검색)(원문열은)
	list[uid].targetIndex =$('#stTargetIndex').val(); 	//몇번째 열로 번역하겠다. (편집가능한열) (work번역문에서 검색)(번역열은)
	list[uid].canIndexs = '' ; //값없으면 일반순서(자동생성), 수동입력시 입력순서대로 배열

});
$('#stPasteTextarea').on('change',function(e){
	list[uid].parseText = $(e.target).val();
});





