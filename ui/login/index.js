if(navigator.credentials === undefined) {
	alert('网页不支持');
}


//通过浏览器自带的保存账号密码功能来进行登录。
let form = document.querySelector('#localLogin');
let _id = form.querySelector('[name=id]');
let _password = form.querySelector('[name=password]');
let _name = form.querySelector('[name=name]');
_name.addEventListener('blur', function(){
	//console.log(this.validity);
	//if (!this.value) {
	//	this.setCustomValidity("입력하세요");//现将有输入时的提示设置为空
	//}
	//if (this.validity.valueMissing) {
	//	this.setCustomValidity('입력하세요');
	//}
	//if (this.validity.patternMismatch) {
	//	this.setCustomValidity(`최소 2글자${this.pattern}`);
	//}
});

form.hidden = false;
form.addEventListener('submit', (e) => {
	e.preventDefault();
	//新建一个本地账号，但是无法保存
	let { protocol, host } = location;
	navigator.credentials.create({
		password: {
			iconURL: `${protocol}//${host}/favicon.ico`,
			id: _id.value,
			password: _password.value,
			name: _name.value,
		}
	})
		.then((cred) => {
			console.warn(cred);
			return navigator.credentials.store(cred);
		})
		.then(()=>{
			console.warn('保存本地');
		});
});
function getT(input) {
	let T = [], F= [], O=input.validity;
	for(let k in O) {
		if(O[k]) T.push(k);
		else F.push(k);
	}
	return T;
}



//登录操作会阻止form中的autocomplete事件。
//因此，延迟操作可以解决自动填充被阻止的问题。
setTimeout(()=>{
	//通过本地账号登录
	navigator.credentials.get({
		password: true,
		unmediated: true, //无需用户调解(mediation)即可请求凭证(credential)。
		//federated: {
		//	providers: [
		//		'https://account.google.com',
		//		//'https://www.facebook.com'
		//	]
		//}
	}).then(function (cred) {
		//获取到浏览器默认登录账号信息
		function insert(v) {
			let el;
			if(/^http/.test(v)) {
				el = document.createElement('img');
				el.src = v;
			}else{
				el = document.createElement('p');
				el.textContent = v;
			}
			document.body.appendChild(el);
		}
	
		console.log(cred);//{iconURL: "", name: "", password: "1234", id: "ddb", type: "password"}
		insert(cred.iconURL);
		insert(cred.name);
		insert(cred.id);
		insert(cred.password.replace(/(?<!^).(?!$)/g, '*'));
	});
}, 500);