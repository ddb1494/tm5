const fs=require('fs');

class SublimeTextCompletions {
	constructor(name='nodejs'){
		this.file = 'C:\\Users\\Gamedex-Any\\AppData\\Roaming\\Sublime Text 3\\Packages\\User\\'+name+'.sublime-completions';
		this.data = JSON.parse(fs.readFileSync(this.file, {encoding:'utf8'}));
	}

	add(k,v){
		if(k===undefined) return ;
		if(v===undefined) v=k;
		return this.completions.push({trigger:k,contents:v});
	}
	remove(k,v) {
		var o=this.completions, e;
		for(var i in o) {
			e=o[i];
			if(e.trigger===k && e.contents===v) {
				return o.splice(i,1) ? true: false;
			}
		}
		return false;
	}
	save(){
		fs.writeFileSync(this.file, JSON.stringify(this.data), {encoding:'utf8'});
	}

	get scope(){
		return this.data.scope;
	}

	get completions(){
		return this.data.completions;
	}
}

module.exports = SublimeTextCompletions;

