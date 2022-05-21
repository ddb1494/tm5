const fs = require('fs');
const path = require('path');

let rows = [];
let rootDir = path.join(__dirname, '../.tm4/');
fs.readdirSync(rootDir).forEach(d=>{
	if(/\.txt$/.test(d)) {
		let fp = path.join(rootDir, d);
		let txt =fs.readFileSync(fp, 'utf8');
		rows = rows.concat(txt.split(/\r?\n/).filter(e=>e).map(e=>e.split('\t')));
	}
});


//projectName	targetText	sourceText	machineId	timeStamp
//console.log(rows[0]);

//console.log(rows.filter(e=>e[3]==='kgo5eplf-tk97xlw92ja').join('\n'))
//console.log(rows.filter(e=>e[3]==='kginu61n-tb28kixtfa').map(e=>[e[0],e[2],new Date(parseInt(e[4])).toLocaleString()]).join('\n'))
console.log(rows.filter(e=>e[3]==='kginu61n-tb28kixtfa').map(e=>[e[0],e[2],new Date(parseInt(e[4])).toLocaleString()]).join('\n'))