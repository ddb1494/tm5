/* 
使用方法
let x = ss(‘body')

x.set('background', 'red', true)      // x
x.get('background')                   // 'red'
x.value('background')                 // 'red!important'
x.isImportant('background')           // true
x.remove('background')                // x
 */
function ss(selector) {
	let styleSheets = document.styleSheets
	let lenStyleSheets = styleSheets.length
	let styleSheet, rules, rule, style, rs = []
	if(lenStyleSheets===0) {
		// html中没有style或link
		document.body.appendChild(document.createElement('style'))
		document.styleSheets.item(0)
		lenStyleSheets = 1
	}
	for (let iStyleSheets = 0; iStyleSheets < lenStyleSheets; iStyleSheets++) {
		styleSheet = styleSheets.item(iStyleSheets)// StyleSheetList
		rules = styleSheet.rules// CSSRuleList
		for (let iRules = 0, lenRules = rules.length; iRules < lenRules; iRules++) {
			rule = rules.item(iRules)// CSSRule
			if (selector === rule.selectorText) {
				let item = { styleSheet: styleSheet, rules, rule }
				// console.debug('item', rule.selectorText)
				rs.push(item)
			}
		}
	}
	// console.debug('rs.length', rs.length)
	if(rs.length) {
		rs = rs.pop()
		styleSheet = rs.styleSheet
		rules = rs.rules
		rule = rs.rule
	}else{
		let i = rules.length
		styleSheet.addRule(selector)
		rule = rules.item(i)
	}
	style = rule.style
	// ss将返回一个Chain实例
	class Chain {
		constructor() {
			this.selector = selector
			this.style = style
			this.rule = rule
			this.rules = rules
			this.styleSheet = styleSheet
		}
		get(k) {
			return this.style.getPropertyValue(k)
		}
		isImportant(k) {
			return Boolean(this.style.getPropertyPriority(k))
		}
		set(k, v, d) {
			let p = d ? 'important' : undefined
			this.style.setProperty(k, v, p)
			return this
		}
		value(k) {
			let v = this.get(k)
			if(v) {
				let p = this.isImportant(k)
				if(p) {
					v += '!important'
				}
			}
			return v
		}
		remove(k) {
			return this.style.removeProperty(k)// 效果相同 this.style.setProperty(k,'')
		}
	}
	return new Chain(style)
}