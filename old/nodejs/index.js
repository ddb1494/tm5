const fs=require('fs');




var cnRegExp=/[\\u4e00-\\u9fff\\uf900-\\ufaff]/;
function stringToArray(t,n=0){
	return t.split('\r\n').map(e=>e.split('\t')).filter(e=>e.length>n);
}

// 读取目录下的txt文件
var dirname = './ZHO/';
var filenames = fs.readdirSync(dirname);

filenames =filenames.filter(function(filename){
	return /\.txt$/ .test(filename);
});



function read(path,n){
	// console.log(path);    //filename
	var text  = fs.readFileSync(path,{flag:'r',encoding:'UTF-16LE'});
	var array = stringToArray(text,n);
	return array;
}






// 将目录下文件读入text，分类成cns和others。
var results = Object.create(null);
var cns=[];
var others = []
filenames.forEach(function (filename,index){
	var array = results[index]=read(dirname+filename,5);
	array.forEach(function(e){
		if(cnRegExp.test(e[1])) {
			cns.push(e);
		}else{
			others.push(e);
		}
	})
});




console.log('중국어 번안 현환 보고입니다.\n');

var countChars;

countChars=0;
cns.forEach(function(e){
	countChars+=e[1].replace(/\s+/,'').length;
});
console.log('[TM Tool현황] 오랜지색   %d행/%d자(공백제외)', cns.length, countChars);

countChars=0;
others.forEach(function(e){
	countChars+=e[1].replace(/\s+/,'').length;
});
console.log('[TM Tool현황] 빨강색     %d행/%d자(공백제외)', others.length, countChars);



// 去除已经翻译的内容
diffTranlations:{
var dictArray= read('./dict.txt',0);
// console.log(dictArray.slice(0,10))
cns = cns.filter(function(e){
	var ko=e[5];
	var b=false;
	b=dictArray.some(function(e){
		return e[0]===ko;
	});
	return !b;
});
others = others.filter(function(e){
	var ko=e[5];
	var b=false;
	b=dictArray.some(function(e){
		return e[0]===ko;
	});
	return !b;
})
}




// 计算字数。


countChars=0;
cns.forEach(function(e){
	countChars+=e[1].replace(/\s+/,'').length;
});
console.log('[실제 현황] 오랜지색   %d행/%d자(공백제외)', cns.length, countChars);

countChars=0;
others.forEach(function(e){
	countChars+=e[1].replace(/\s+/,'').length;
});
console.log('[실제 현황] 빨강색     %d행/%d자(공백제외)', others.length, countChars);

// 3735 100576  TMTool中的原文被修改的内容
// 7529 108057	TMTool中目前显示的尚未翻译内容

// 원문 수정   2348행/65604자
// 아직 미번   3753행/64779   

fs.writeFileSync('_orange.txt', cns.map(e=>e.join('\t')).join('\n'), {encoding:'utf8'});
fs.writeFileSync('_red.txt', others.map(e=>e.join('\t')).join('\n'), {encoding:'utf8'});


// var s=new Set();
// for(var i in results) {
// 	results[i].forEach(function(e){
// 		s.add(e);
// 	});
// }

// fs.writeFileSync('all.txt', Array.from(s).join('\n'), {encoding:'utf8'})


// function tableSort(table,colIndex,) {
// }



// var arr=[
// 	'3.123',
// 	'1.a',
// 	'4.aaaaaaa',
// 	'2.bbbb'
// ];

// function sortByLength(asc) {
// 	asc=asc?1:-1;
// 	return this.sort(function (a,b){
// 		var ia=a.length, ib=b.length;
// 		return asc*(ia>ib ? 1 : (ia===ib ? 0 : -1));
// 	});
// }


// sortByLength.call(arr, false);



// function sortByNumber(asc){
// 	asc=asc?1:-1;
// 	return this.sort(function (a,b){
// 		var b=typeof a && typeof b;
		
// 	});
// }


// 49457 .toString(16)



// '\uFFFF'
// &#49457;


// chr(49457)