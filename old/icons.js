let img = document.querySelector('#icons')

let points = { icons_download: { x: 0, y: 0 }, icons_dashboard: { x: -18, y: 0 }, icons_spaces: { x: -36, y: 0 }, icons_turnOff: { x: -54, y: 0 }, icons_moreBrightness: { x: -72, y: 0 }, icons_lessBrightness: { x: -90, y: 0 }, icons_widgets: { x: -108, y: 0 }, icons_brightness: { x: -126, y: 0 }, icons_forward: { x: 0, y: -18 }, icons_rewind: { x: -18, y: -18 }, icons_playPause: { x: -36, y: -18 }, icons_volumeOff: { x: -54, y: -18 }, icons_lowVolume: { x: -72, y: -18 }, icons_highVolume: { x: -90, y: -18 }, icons_application2: { x: -108, y: -18 }, icons_application4: { x: -126, y: -18 }, icons_paintbucket: { x: 0, y: -36 }, icons_text: { x: -18, y: -36 }, icons_colorMixer: { x: -36, y: -36 }, icons_selection: { x: -54, y: -36 }, icons_resize: { x: -72, y: -36 }, icons_crop: { x: -90, y: -36 }, icons_roundedSelection: { x: -108, y: -36 }, icons_switchColors: { x: -126, y: -36 }, icons_colors: { x: 0, y: -54 }, icons_noColor: { x: -18, y: -54 }, icons_wireFrame: { x: -36, y: -54 }, icons_layout: { x: -54, y: -54 }, icons_grid: { x: -72, y: -54 }, icons_topbar: { x: -90, y: -54 }, icons_expose: { x: -108, y: -54 }, icons_newLayer: { x: -126, y: -54 }, icons_lock: { x: 0, y: -72 }, icons_unlock: { x: -18, y: -72 }, icons_calendar: { x: -36, y: -72 }, icons_todoList1: { x: -54, y: -72 }, icons_rulers: { x: -72, y: -72 }, icons_writeDocument: { x: -90, y: -72 }, icons_jog: { x: -108, y: -72 }, icons_keyframes: { x: -126, y: -72 }, icons_intersect: { x: 0, y: -90 }, icons_split: { x: -18, y: -90 }, icons_union: { x: -36, y: -90 }, icons_intersect2: { x: -54, y: -90 }, icons_colorPicker: { x: -72, y: -90 }, icons_colorPickerSelected: { x: -90, y: -90 }, icons_reload: { x: -108, y: -90 }, icons_vinyl: { x: -126, y: -90 }, icons_acion: { x: 0, y: -108 }, icons_flame: { x: -18, y: -108 }, icons_earth: { x: -36, y: -108 }, icons_oldCamera: { x: -54, y: -108 }, icons_newCamera: { x: -72, y: -108 }, icons_zoomInPlace: { x: -90, y: -108 }, icons_zoomOutPlace: { x: -108, y: -108 }, icons_refresh: { x: -126, y: -108 }, icons_settings: { x: 0, y: -126 }, icons_boldPlus: { x: -18, y: -126 }, icons_ghost: { x: -36, y: -126 }, icons_addScreen: { x: -54, y: -126 }, icons_infoScreen: { x: -72, y: -126 }, icons_info: { x: -90, y: -126 }, icons_settings1: { x: -108, y: -126 }, icons_iceCream: { x: -126, y: -126 }, icons_drop: { x: 0, y: -144 }, icons_wall: { x: -18, y: -144 }, icons_flag: { x: -36, y: -144 }, icons_roller: { x: -54, y: -144 }, icons_marker: { x: -72, y: -144 }, icons_cutter: { x: -90, y: -144 }, icons_heart: { x: -108, y: -144 }, icons_gallery: { x: -126, y: -144 }, icons_addPin: { x: 0, y: -162 }, icons_star: { x: -18, y: -162 }, icons_comment: { x: -36, y: -162 }, icons_chat: { x: -54, y: -162 }, icons_pin: { x: -72, y: -162 }, icons_mail: { x: -90, y: -162 }, icons_newDocument: { x: -108, y: -162 }, icons_removePin: { x: -126, y: -162 }, icons_NYFatcap: { x: 0, y: -180 }, icons_tiles: { x: -18, y: -180 }, icons_spraycanEmpty: { x: -36, y: -180 }, icons_fullSparaycan: { x: -54, y: -180 }, icons_spraycanHalfFull: { x: -72, y: -180 }, icons_brush: { x: -90, y: -180 }, icons_toiletPaper: { x: -108, y: -180 }, icons_subway: { x: -126, y: -180 }, icons_bomb: { x: 0, y: -198 }, icons_slotenacesta: { x: -18, y: -198 }, icons_upload: { x: -36, y: -198 }, icons_santasReindeer: { x: -54, y: -198 }, icons_pointer: { x: -72, y: -198 }, icons_handy: { x: -90, y: -198 }, icons_home: { x: -108, y: -198 }, icons_capricorn1: { x: -126, y: -198 }, icons_paragraphJustify: { x: 0, y: -216 }, icons_paragraphLeft: { x: -18, y: -216 }, icons_paragraphRight: { x: -36, y: -216 }, icons_christmassTree: { x: -54, y: -216 }, icons_pcfan: { x: -72, y: -216 }, icons_zip: { x: -90, y: -216 }, icons_images: { x: -108, y: -216 }, icons_path: { x: -126, y: -216 }, icons_plus: { x: 0, y: -234 }, icons_reply: { x: -18, y: -234 }, icons_trash: { x: -36, y: -234 }, icons_retweet: { x: -54, y: -234 }, icons_unrated: { x: -72, y: -234 }, icons_rated: { x: -90, y: -234 }, icons_twitter: { x: -108, y: -234 }, icons_pen: { x: -126, y: -234 }, icons_user2: { x: 0, y: -252 }, icons_users: { x: -18, y: -252 }, icons_userComments: { x: -36, y: -252 }, icons_users2: { x: -54, y: -252 }, icons_usersComents: { x: -72, y: -252 }, icons_watchUser: { x: -90, y: -252 }, icons_thinkingUser: { x: -108, y: -252 }, icons_updateSummary: { x: -126, y: -252 }, icons_map: { x: 0, y: -270 }, icons_list: { x: -18, y: -270 }, icons_orderedList: { x: -36, y: -270 }, icons_imageLike: { x: -54, y: -270 }, icons_watch: { x: -72, y: -270 }, icons_watchMap: { x: -90, y: -270 }, icons_userComment: { x: -108, y: -270 }, icons_todoList: { x: -126, y: -270 }, icons_display: { x: 0, y: -288 }, icons_user: { x: -18, y: -288 }, icons_watchedUser: { x: -36, y: -288 }, icons_addUser: { x: -54, y: -288 }, icons_removeUser: { x: -72, y: -288 }, icons_userInfo: { x: -90, y: -288 }, icons_deleteUser: { x: -108, y: -288 }, icons_watchedWall: { x: -126, y: -288 }, icons_tags: { x: 0, y: -306 }, icons_addFlag: { x: -18, y: -306 }, icons_zoomOut: { x: -36, y: -306 }, icons_zoomIn: { x: -54, y: -306 }, icons_search: { x: -72, y: -306 }, icons_watchHome: { x: -90, y: -306 }, icons_taxi: { x: -108, y: -306 }, icons_car: { x: -126, y: -306 }, icons_iphoneVertical: { x: 0, y: -324 }, icons_creditCard: { x: -18, y: -324 }, icons_imac: { x: -36, y: -324 }, icons_cart: { x: -54, y: -324 }, icons_barcode: { x: -72, y: -324 }, icons_toCart: { x: -90, y: -324 }, icons_wallet: { x: -108, y: -324 }, icons_iphoneHorizontal: { x: -126, y: -324 }, icons_ok: { x: 0, y: -342 }, icons_ng: { x: -18, y: -342 }, icons_movieFrame: { x: -36, y: -342 }, icons_summary: { x: -54, y: -342 }, icons_coins: { x: -72, y: -342 }, icons_tool: { x: -90, y: -342 }, icons_soundWave: { x: -108, y: -342 }, icons_oldPhone: { x: -126, y: -342 }, icons_rightArrow: { x: 0, y: -360 }, icons_leftArrow: { x: -18, y: -360 }, icons_smallerPads: { x: -36, y: -360 }, icons_note: { x: -54, y: -360 }, icons_biggerPads: { x: -72, y: -360 }, icons_headphones: { x: -90, y: -360 }, icons_cd: { x: -108, y: -360 }, icons_arrows: { x: -126, y: -360 } }

let base64s = {}
let { log } = console

let renderer, stage, texture, sprite, g, icons = {}

// Application和Renderer不同吗
let app = new PIXI.Application({ width: 18, height: 18, backgroundColor: '#f000' })


let loader = new PIXI.Loader()
loader.add('icons', 'icons.png')
loader.load((loader, resources) => {
	let { width, height } = resources.icons.data
	sprite = new PIXI.TilingSprite(resources.icons.texture, width, height)
})

// loader.pre((...a)=>{ log('loader.pre', a) })
// loader.use((resource, next) => { 
// 	log('loader.use', resource)
// 	next()
// })
// loader.onError.add((...a) => { log('loader.onError.add', a) })
// loader.onProgress.add((loader, resource) => { log('loader.onProgress.add', loader, resource) })
// loader.onLoad.add((loader, resource) => { log('loader.onLoad.add', loader, resource) })

loader.onComplete.add((loader, resources) => {
	renderer = PIXI.autoDetectRenderer({ width: 18, height: 18, antialias: true, transparent: true })
	document.body.appendChild(renderer.view)

	stage = new PIXI.Container()
	texture = resources.icons.texture
	// sprite = new PIXI.TilingSprite(texture, 18, 18)
	stage.addChild(sprite)
	renderer.render(stage)

	function masking(target) {
		g = new PIXI.Graphics()
		g.beginFill(0xDE3249, 1);
		g.drawRect(0, 0, 18, 18)
		g.endFill();
		target.mask = g
	}
	masking(sprite)


	// animate0()
	// function animate0() {
	// 	renderer.render(stage)
	// 	requestAnimationFrame(animate0)
	// }

	// 生成图片
	$('li').each((i, e) => {
		// if (i > 3) return false// 是要3个

		let className = e.querySelector('i').classList[1]
		let point = points[className]
		if (point) {
			// log(i, className, point)

			sprite.x = point.x
			sprite.y = point.y
			renderer.render(stage)

			base64 = renderer.view.toDataURL('image/png')
			// base64 = renderer.plugins.extract.base64(sprite)// 根据sprite的大小保存图片，尺寸为100x100

			// log(className, base64===renderer.view.toDataURL())

			$('<img>').attr({ title: className, src: base64 }).appendTo(document.body)
			icons[className.slice(6)] = base64.slice(22)

			if (base64.indexOf(/'|"/) !== -1) warn(className)
		} else {
			log(i, className, point)
		}
	})
	log(icons)
})




{
	let button = document.createElement('button')
	button.innerText = 'download';
	document.body.appendChild(button)
	button.onmousedown = function (e) {
		downloadFile('icons.json', JSON.stringify(icons,null,2))
	}



}

function downloadFile(filename, content) {
	var a = document.createElement('a');
	var blob = new Blob([content]);
	var url = window.URL.createObjectURL(blob);
	// filename = filename + formatName(location.search) + '_' + Date.now() + '.txt';
	filename += '.txt'

	a.href = url;
	a.download = filename;
	a.click();
	window.URL.revokeObjectURL(url);
}