void function (g) {
	let codes = {
		ArrowLeft: "left",
		ArrowUp: "up",
		ArrowRight: "right",
		ArrowDown: "down",
		AltLeft: "alt",
		AltRight: "alt",
		Backquote: "`",
		Backspace: "back",
		BracketLeft: "[",
		BracketRight: "]",
		Backslash: "\\",
		ControlLeft: "ctrl",
		ControlRight: "ctrl",
		ContextMenu: "contextmenu",
		CapsLock: "capslock",
		Comma: ",",
		Delete: "delete",
		Digit1: "1",
		Digit2: "2",
		Digit3: "3",
		Digit4: "4",
		Digit5: "5",
		Digit6: "6",
		Digit7: "7",
		Digit8: "8",
		Digit9: "9",
		Digit0: "0",
		Numpad1: "1",
		Numpad2: "2",
		Numpad3: "3",
		Numpad4: "4",
		Numpad5: "5",
		Numpad6: "6",
		Numpad7: "7",
		Numpad8: "8",
		Numpad9: "9",
		Numpad0: "0",
		Escape: "escape",
		End: "end",
		Equal: "=",
		Enter: "enter",
		F5: "f5",
		F1: "f1",
		F2: "f2",
		F3: "f3",
		F4: "f4",
		F6: "f6",
		F7: "f7",
		F8: "f8",
		F9: "f9",
		F10: "f10",
		F11: "f11",
		F12: "f12",
		Home: "home",
		Insert: "insert",
		KeyA: "a",
		KeyB: "b",
		KeyC: "c",
		KeyD: "d",
		KeyE: "e",
		KeyF: "f",
		KeyG: "g",
		KeyH: "h",
		KeyI: "i",
		KeyJ: "j",
		KeyK: "k",
		KeyL: "l",
		KeyM: "m",
		KeyN: "n",
		KeyO: "o",
		KeyP: "p",
		KeyQ: "q",
		KeyR: "r",
		KeyS: "s",
		KeyT: "t",
		KeyU: "u",
		KeyV: "v",
		KeyW: "w",
		KeyX: "x",
		KeyY: "y",
		KeyZ: "z",
		Lang1: "lang1",
		Lang2: "lang2",
		MetaLeft: "win",
		MetaRight: "win",
		Minus: "-",
		Pause: "pause",
		PageUp: "pageup",
		PageDown: "pagedown",
		Period: ".",
		Quote: "'",
		ScrollLock: "scrolllock",
		ShiftLeft: "shift",
		ShiftRight: "shift",
		Space: "space",
		Semicolon: ";",
		Slash: "/",
		Tab: "tab",
		PrintScreen: 'printscreen',
	}

	// let lefts = new Set(['ControlLeft', 'ShiftLeft', 'AltLeft', 'MetaLeft'])
	// let rights = new Set(['ControlRight', 'ShiftRight', 'AltRight', 'MetaRight'])

	function hotkey(event, joiner = '+') {
		if (!(event instanceof KeyboardEvent)) return '';// 刷新页面时会自动进入Event，导致下行报错。

		let { code, ctrlKey, shiftKey, altKey, metaKey, _hotkey } = event
		if (_hotkey) return _hotkey

		let keySet = new Set()
		if (ctrlKey) keySet.add('ctrl')
		if (shiftKey) keySet.add('shift')
		if (altKey) keySet.add('alt')
		if (metaKey) keySet.add('win')
		keySet.add(codes[code] || code)

		return event.hotkey = Array.from(keySet).join(joiner)
	}

	g.hotkey = hotkey
	hotkey.codes = codes
}(window)
