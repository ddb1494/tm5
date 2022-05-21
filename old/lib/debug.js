'use strict';
let x = 1;
let y = 2;
let size = 9;
let nameRegExp = /2$/;
const debug = new Proxy(console.debug, {
	get(target, name) {
		if(typeof name=='string' && name.length>2) {
			if(target.hasOwnProperty(name)) {
				return target[name];
			}else{
				if(nameRegExp.test(name)) {
					name = name.slice(0,-1);
					return console.debug.bind(null, `%c★`, `color:${name};padding:0px ${y}px;box-sizing:border-box;font-family:consolas;font-size:${size}px;`);
				}else{
					return console.debug.bind(null, `%c★`, `color:#fff;background:${name};padding:0px ${x + y}px;box-sizing:border-box;font-family:consolas;font-size:${size}px;`);
				}
			}
		}else{
			return console.debug;
		}
	}
});

const colors = {
	blue: '007bff',
	indigo: '6610f2',
	purple: '6f42c1',
	pink: 'e83e8c',
	red: 'dc3545',
	orange: 'fd7e14',
	yellow: 'ffc107',
	green: '28a745',
	teal: '20c997',
	cyan: '17a2b8',
	white: 'fff',
	gray: '6c757d',
	graydark: '343a40',
	primary: '007bff',
	secondary: '6c757d',
	success: '28a745',
	info: '17a2b8',
	warning: 'ffc107',
	danger: 'dc3545',
	light: 'f8f9fa',
	dark: '343a40',
};

debug.handles = {};

for (let k in colors) {
	let color = colors[k];
	if (debug.handles[color]) {
		debug[k] = debug.handles[color][1];
		debug[k + 2] = debug.handles[color][2];
	} else {
		debug.handles[color] = {};
		debug[k] = debug.handles[color][1] = console.debug.bind(null, `%c★`, `color:#fff;background:#${color};padding:0px ${x + y}px;box-sizing:border-box;font-family:consolas;font-size:${size}px;`);
		debug[k + 2] = debug.handles[color][2] = console.debug.bind(null, `%c★`, `color:#${color};padding:0px ${y}px;box-sizing:border-box;font-family:consolas;font-size:${size}px;`);
	}
};

debug.time = function (func, count=1) {
	let label = 'time-'+debug.time.i;
	console.time(label);
	while(count-->0) {
		func.call(this);
	}
	console.timeEnd(label);
	debug.time.i++;
};
debug.time.i = 0;

delete debug.handles;

debug.colors = colors;

export default debug;
