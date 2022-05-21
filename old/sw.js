const version = '4.1.20.3'
console.debug('sw.js version', version)
const baseURL = location.href.slice(0, location.href.lastIndexOf('/')) //用于缓存名
const baseScriptURL = baseURL + '/sw.js'
const CACHE_NAME = location.pathname.slice(
	0,
	location.pathname.lastIndexOf('/') + 1
)
const RED = 'color:crimson'
const BLUE = 'color:royalblue'
const GRAY = 'color:gray'
//console.debug('[sw]', CACHE_NAME);
//删除缓存
//self.caches
//  .keys()
//  .then((s) => Promise.all(s.map((n) => self.caches.delete(n))))
//  .then((s) => console.error);

//仅register时触发一次
self.addEventListener('install', function (event) {
	console.debug(`%c[sw] install`, BLUE, baseScriptURL)
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) =>
							caches
								.delete(cacheName)
								.then((b) =>
									console.debug('%cdelete cache', b ? BLUE : RED, cacheName)
								)
						)
				)
			)
			.then(self.skipWaiting)
	)
})

//刷新页面不会触发
//新打开页面触发
self.addEventListener('activate', function (event) {
  console.log('%cReflush cache', RED)
	console.debug(`%c[sw] activate`, BLUE, baseScriptURL)
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) => {
							console.debug(
								cacheName + 'sw.js',
								navigator.serviceWorker.getRegistration(cacheName + 'sw.js')
							)
							return caches
								.delete(cacheName)
								.then((b) =>
									console.debug('%cdelete cache', b ? BLUE : RED, cacheName)
								)
						})
				)
			)
			.then(self.skipWaiting)
	)
	//event.waitUntil(self.skipWaiting);
})

self.addEventListener('fetch', function (event) {
	//console.debug('[fetch]', event);
	//event { clientId, request:{type,method,url,headers,destination,mode,redirect,referrer}}
	const url = new URL(event.request.url)
	let { pathname } = url
	//console.debug('fetch', pathname);
	event.respondWith(
		caches
			.match(url)
			.then(function (response) {
				let valid = pathname.indexOf(CACHE_NAME) !== -1 &&
					!/\/(index\.\w{1,}|(sw|swpage)\.js)$/i.test(pathname)
				if (response) {
					//读取
					if (valid) {
						console.debug(`%c = ${pathname}`, GRAY)
						return response
					}
					//删除
					caches.open(CACHE_NAME).then((cache) => {
						cache.delete(pathname).then((b) => {
							console.debug(`%c - ${pathname}`, RED)
						})
					})
				} else {
					//缓存
					caches.open(CACHE_NAME).then((cache) => {
						if (valid) {
							cache.add(pathname).then(() => {
								console.debug(`%c + ${pathname}`, BLUE)
							})
						}
					})
				}
				return fetch(event.request)
			})
			.catch(function (err) {
				console.debug(err)
			})
	)
})
