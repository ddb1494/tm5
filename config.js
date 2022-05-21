export default {
	name: 'Translation Memory',
	version: '5.0.210326',
	scripts: [
		'https://cdn.jsdelivr.net/npm/vue',
		'/lib/sha3.min.js',
	],
	modules: {
		localforage: '/module/localforage.js',
		$: '/module/jquery.js',
		io: '/module/socket.io.js',
	},
	main: './main.js'
}
