import io from '/lib/socket.io.3.0.3.m.js';



let uiLoginPage = document.createElement('form')
uiLoginPage.method = 'dialog'
uiLoginPage.classList.add('ui_login','display_none')
document.body.appendChild(uiLoginPage)

let labelUsername = document.createElement('label')
labelUsername.textContent = 'username'
labelUsername.for = 'username'

let iptUsername = document.createElement('input')
iptUsername.type = 'text'
iptUsername.id = 'username'
iptUsername.name = 'username'
iptUsername.autocomplete = 'On'

let labelPassword = document.createElement('label')
labelPassword.textContent = 'password'
labelPassword.for = 'password'

let iptPassword = document.createElement('input')
iptPassword.type = 'password'
iptPassword.id = 'password'
iptPassword.name = 'current-password'
iptPassword.autocomplete = 'On'

let btnLogin = document.createElement('button')
btnLogin.textContent = 'Login'
btnLogin.addEventListener('mousedown', ()=>{
	if(s.disconnected) {
		let user = iptUsername.value
		let pass = iptPassword.value
		s.io.opts.query = { user, pass }
		console.log(s.connect(console.warn))
	}
})

uiLoginPage.append(labelUsername, iptUsername, labelPassword, iptPassword, btnLogin)




let uiControlPage = document.createElement('div')
uiControlPage.classList.add('ui_control_page','display_none')
document.body.appendChild(uiControlPage)


let uiMainControl = document.createElement('div')
uiControlPage.append(uiMainControl)


let btnRestartServer = document.createElement('button')
btnRestartServer.textContent = 'Re Start Server'
btnRestartServer.addEventListener('mousedown', () => {
	fetch('/restart/sio.access').then(res => res.text().then(console.log))
})

let btnReconnectSocket = document.createElement('button')
btnReconnectSocket.textContent = 'Re Connect Socket'
btnReconnectSocket.addEventListener('mousedown', () => {
	s.disconnect(console.warn)
	s.connect(console.warn)
})

let btnSendMessage = document.createElement('button')
btnSendMessage.textContent = 'Send'
btnSendMessage.addEventListener('mousedown', () => {
	s.compress(true).send('消息1'.repeat(100))
	s.compress(false).send('消息2'.repeat(100))
	s.send('消息3'.repeat(100))
})

uiMainControl.append(btnRestartServer, btnReconnectSocket, btnSendMessage)


let iptRoom = document.createElement('input')
let btnJoin = document.createElement('button')
let btnLeave = document.createElement('button')
let btnPrintRooms = document.createElement('button')
let uiRoom = document.createElement('div')
uiRoom.style.display = 'grid'
uiRoom.style.gridTemplateAreas = (['a a a', 'b c d']).reduce((r, e) => `${r} "${e}"`, '')
iptRoom.value = 'Room A,Room B,  Room C  '
btnJoin.textContent = 'Join'
btnLeave.textContent = 'Leave'
btnPrintRooms.textContent = 'PrintRooms'
iptRoom.style.gridArea = 'a'
btnJoin.style.gridArea = 'b'
btnLeave.style.gridArea = 'c'
btnPrintRooms.style.gridArea = 'd'
btnJoin.addEventListener('mousedown', () => {
	let v = iptRoom.value.split(/[,;]/)
	v = v.length === 1 ? v[0] : v
	console.log(v)
	s.emit('join', v)
})
btnLeave.addEventListener('mousedown', () => {
	let v = iptRoom.value.split(/[,;]/)
	console.log(v)
	s.emit('leave', v)
})
btnPrintRooms.addEventListener('mousedown', () => {
	s.emit('print_rooms')
})
uiControlPage.appendChild(uiRoom)
uiRoom.append(iptRoom, btnJoin, btnLeave, btnPrintRooms)

let iptType = document.createElement('input')
let iptTo = document.createElement('input')
let btnEmit = document.createElement('button')
let uiEmit = document.createElement('div')
iptType.placeholder = 'Type'
iptTo.placeholder = 'To'
iptType.value = 'seachme'
btnEmit.textContent = 'Emit'
btnEmit.addEventListener('mousedown', () => {
	let type = iptType.value
	let to = iptTo.value.split(/[,;]/)
	to = to.length === 1 ? to[0] : to
	s.emit(type, to)
})
uiEmit.append(iptType, iptTo, btnEmit)
uiControlPage.appendChild(uiEmit)

let iptCode = document.createElement('textarea')
let uiCode = document.createElement('div')
iptCode.placeholder = 'Code'
iptCode.addEventListener('keydown', (event) => {
	if (event.repeat) return
	if (event.ctrlKey && event.key === 'Enter') {
		let code = iptCode.value
		if (iptCode.nextElementSibling && iptCode.nextElementSibling.textContent === code) {
			return s.emit('eval', code)
		} else {
			drawCode(code)
		}
		return s.emit('eval', code)
	}
})
iptCode.autofocus='On'
uiControlPage.appendChild(uiCode)
uiCode.appendChild(iptCode)
function drawCode(code, insert = true) {
	let el = document.createElement('code')
	el.textContent = code
	el.style.userSelect = 'none'
	if (insert) {
		iptCode.insertAdjacentElement('afterend', el)
	} else {
		uiCode.appendChild(el)
	}
	el.addEventListener('mousedown', (event) => {
		event.preventDefault()
		s.emit('eval', code)
		if (event.ctrlKey) {
			iptCode.value = code
		}
	})
	el.addEventListener('contextmenu', (event) => {
		event.preventDefault()
		el.remove()
	})
	//remove
	uiCode.querySelectorAll('code').forEach((e, i) => {
		if (i > 9) e.remove()
	})

	//save
	saveCodes()
}
loadCodes().forEach(code => {
	drawCode(code, false)
})
function saveCodes() {
	let codes = Array.from(uiCode.querySelectorAll('code'), e => e.textContent)
	sessionStorage.setItem('codes', JSON.stringify(codes))
}
function loadCodes() {
	let codes = sessionStorage.getItem('codes')
	if (codes) {
		codes = JSON.parse(sessionStorage.getItem('codes'))
	} else {
		codes = []
	}
	return codes
}


let s = io(':10000/dev/', {
	transports: ['websocket'],
	autoConnect: false,
	reconnection: true,
	reconnectionDelay: 10,
	reconnectionDelayMax: 10,
	reconnectionAttempts: 3,
	timeout: 5000,
});

window.s = s

if(s.disconnected) {
	uiLoginPage.classList.remove('display_none')
}

s.on('connect', (noa) => {
	let p = 'connect'
	console.group(p)
	console.log(s.nsp)
	console.log(s.id)
	console.groupEnd(p)

	setTimeout(()=>{
		uiLoginPage.classList.add('display_none')
		uiControlPage.classList.remove('display_none')
	},10)
})
s.on('disconnect', (signal) => {
	//触发两次事件
	//第一次signal：io client disconnect
	//第二次signal：forced close
	console.log('disconnect', signal)
	setTimeout(()=>{
		uiControlPage.classList.add('display_none')
		uiLoginPage.classList.remove('display_none')
	},10)
});
s.on('error', (err) => {
	console.log('[error]', err)
})
s.on('message', (...s) => {
	console.log('[message]', s)
})
//console.log(s.listenersAny())
s.io.on('reconnect_attempt', (attempt) => {
	console.log('reconnect_attempt', attempt)
	let user = iptUsername.value
	let pass = iptPassword.value
	s.io.opts.query = { user, pass }
	if (attempt > 5) s.close()
});
s.io.on('reconnect', (...s) => {
	console.log('reconnect', s)
})
s.io.on('reconnect_error', (err) => {
	console.log('reconnect_error', err)
})
s.io.on('reconnect_failed', (noa) => {
	console.log('reconnect_failed')
})
s.io.on('ping', (...s) => {
	console.log('ping', s)
})
s.on('connect_info', function (info) {
	this.info = info
	console.log('connect_info', info)
})


//s.onAny((event, ...s)=>{ console.log(`[${event}]`, s) })
//s.prependAny((event, ...s) => { console.log(`[${event}]`, s) })


////class UI extends Element {
////	constructor(){
////		super();
////	}
////	show(){
////		this.classList.remove('hidden')
////	}
////	hide() {
////		this.classList.add('hidden')
////	}
////}

////class UIConnect extends UI {
////	constructor(){
////		super();
////		this.form = document.createElement('form');
////		this.form.method = 'dialog';
////		this.append(this.form);
////	}

////	input(label)
////}

////customElements.define('uiconnect', UIConnect);




//let form = document.createElement('form');
//form.method = 'dialog';
//uiControlPage.append(form);
//form.addEventListener('submit', (ev) => {
//	ev.preventDefault();
//	send.click();
//});

//let nickname = document.createElement('input');
//nickname.name = 'nickname';
//nickname.placeholder = 'Nickname';
//nickname.style.gridArea = 'a';
//let connect = document.createElement('input');
//connect.type = 'submit';
//connect.value = 'Connect';
//connect.style.gridArea = 'b';

//let message = document.createElement('textarea');
//message.classList.add('hidden');
//message.style.gridArea = 'd';
//let send = document.createElement('input');
//send.type = 'button';
//send.value = 'Send';
//send.style.gridArea = 'e';
//message.classList.add('hidden');
//send.classList.add('hidden');

//let messageLog = document.createElement('div');
//messageLog.style.gridArea = 'c';
//messageLog.classList = 'message-log';

//connect.onclick = function () {
//	let b = s.connected;
//	if (s.connected) {
//		s.close()
//	} else {
//		s.io.opts.query = {
//			nickname: nickname.value,
//		}
//		s.connect();
//	}
//}

//let lastMessage;
//send.onclick = function () {
//	let d = message.value;
//	if (d) {
//		if (lastMessage === d) return console.error('消息重复')
//		s.send(d);
//		lastMessage = d;
//		message.value = '';
//	}
//	else {
//		console.error('须输入消息')
//	}
//}
//message.addEventListener('keydown', (ev) => {
//	if (ev.ctrlKey && !ev.repeat && ev.keyCode === 13) {
//		send.click();
//	}
//})


//form.append(nickname, connect, messageLog, message, send);
//nickname.focus();


//s.on('message', function (d, nn) {
//	console.log(d, nn);
//	let a = document.createElement('div')
//	a.textContent = d;
//	a.className = 'message';
//	let b = document.createElement('div');
//	b.textContent = nn;
//	b.className = 'nickname';
//	messageLog.append(a, b);
//	messageLog.scrollTo(0, messageLog.scrollHeight);
//});
//s.on('connect', function () {
//	connect.value = 'Disconnect'
//	message.classList.remove('hidden');
//	send.classList.remove('hidden');
//	message.focus();
//	nickname.disabled = true;
//});
//s.on('disconnect', function () {
//	connect.value = 'Connect'
//	message.classList.add('hidden');
//	send.classList.add('hidden');
//	nickname.disabled = false;
//});



//window.addEventListener('beforeunload', (ev) => {
//	if (s.connected) {
//		sessionStorage.setItem('nickname', nickname.value);
//	}
//});
//window.addEventListener('load', (ev) => {
//	if (s.disconnected) {
//		let _nickname = sessionStorage.getItem('nickname');
//		if (_nickname) {
//			nickname.value = _nickname;
//			connect.click();
//		}
//	}
//});

//window.s = s;



////function logType(ev){
////	s.send(ev.type);
////};
////Array.from(new Set(Object.keys(window).concat(Object.keys(Object.getPrototypeOf(window))))).forEach((p)=>{
////	if(/^on\S/.test(p) && !/mouse|pointer|key/.test(p)) {
////		window[p] = logType;
////	}
////})

document.addEventListener('load', () => {
	document.querySelectorAll('script').forEach(el => el.remove())
})