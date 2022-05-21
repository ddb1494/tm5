let options = (function () {

	let ui = {
		text: {
			targetStatus: '번역완료',
		}
	};

	
	let settings = new Vue({
		el: '#settings',
		data: {
			showSettings: true,
			targetStatus: {
				done: {
					background: '#c0ffc0',
					boxShadow: 'inset -3px 0px #070!important',
				}
			},
			ui
		}
	});

	let options = {
		ui,
		vue: {
			settings
		}
	};

	return options;
}());