window.ui = {}

//fetch('./ui/login/index.html')
//.then(d=>d.text())
//.then(d=>{
//	ui.login = $(d).appendTo('body').on('submit',(ev)=>{
//		console.log(ev)

//		console.log(ev.target)
//	})
//})



setTimeout(() => {
	//通过本地账号登录
	navigator.credentials.preventSilentAccess(console.log)
	//navigator.credentials.get({
	//	password: true,
	//	//unmediated: true, //无需用户调解(mediation)即可请求凭证(credential)。
	//	//federated: {
	//	//	providers: [
	//	//		'https://account.google.com',
	//	//		//'https://www.facebook.com'
	//	//	]
	//	//}
	//})
	//	.then(function (cred) {
	//		//获取到浏览器默认登录账号信息
	//		function insert(v) {
	//			let el
	//			if (/^http/.test(v)) {
	//				el = document.createElement('img')
	//				el.src = v
	//			} else {
	//				el = document.createElement('p')
	//				el.textContent = v
	//			}
	//			document.body.appendChild(el)
	//		}

	//		console.log('登录成功', cred)//{iconURL: "", name: "", password: "1234", id: "ddb", type: "password"}
	//		insert(cred.iconURL)
	//		insert(cred.name)
	//		insert(cred.id)
	//		insert(cred.password.replace(/(?<!^).(?!$)/g, '*'))
	//	})
	//	.catch(err => {
	//		console.log('登录问题', err)
	//		$('<div>').load('./ui/login/index.html').appendTo('body')
	//			.on('load', (ev) => {
	//			})
	//			.on('submit', (ev) => {
	//				let d = new FormData(ev.target)
	//				d.forEach((v, k) => {
	//					console.log(k, v)
	//				})
	//			})
	//	})

	
}, 0)