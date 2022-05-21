{
	let counts = {};

	window.addEventListener('keydown',function(e){
		e.stopImmediatePropagation();
		e.stopPropagation();
		e.preventDefault();
		let command=[], commandString;
		if(e.ctrlKey)  command.push('ctrl');
		if(e.shiftKey) command.push('shift');
		if(e.altKey)   command.push('alt');
		command.push(e.code);
		commandString=command.join('+');
		if(e.repeat)   commandString='[repeat]'+commandString;
		key(commandString);
		console.log(e);
		return false;
	},true);

	function UI(k='keydownUI'){
		let ui=document.getElementById(k);
		if(!ui) {
			ui=document.createElement('div');
			document.body.insertAdjacentElement('afterbegin',ui);
			ui.setAttribute('id',k);
			ui.style.border='2px solid #ccf';
			ui.style.background='#eef';
			ui.style.display='block';
		}
		return ui;
	}

	function key(k) {
		let ui = document.getElementById(k);
		if(!ui){
			ui=document.createElement('div');
			UI().insertAdjacentElement('afterbegin',ui);
			ui.setAttribute('id',k);
			ui.style.background='2px solid #ffe';
			ui.style.borderRadius='6px';
			ui.style.display='flex';
		}
		if(counts[k]===undefined) counts[k]=1;
		else counts[k]++;
		ui.textContent=`${k}(${counts[k]})`;
	}
}