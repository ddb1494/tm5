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
var results = [];
// var cns=[];
// var others = []
filenames.forEach(function (filename,index){
	var fileArray=read(dirname+filename,5);
	fileArray = fileArray.map(function (e){
		return [e[5],e[1]]
	});
	results=results.concat(fileArray);
});

// 去除已经翻译的内容

console.log(results);


fs.writeFileSync('merge.txt', results.map(e=>e.join('\t')).join('\n'), {encoding:'utf8'});

results=Array.from(new Set(results.map(e=>e.join('\0')))).map(e=>e.split('\0'));
results.sort();
fs.writeFileSync('merge_uniq.txt', results.map(e=>e.join('\t')).join('\n'), {encoding:'utf8'});

