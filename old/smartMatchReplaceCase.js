/* 
已知：（记忆文）
蓝色忍者武器65(单刃)	희귀 닌자 무기65(외날검)
紫色	영웅
蓝色	희귀
蓝莓	블루베리
紫菜	김

得出：（任务文）
紫色游侠武器65(弓)	


过程：
dmp对比后得出“蓝”和“紫”不同。（但是词库中有“蓝色”和“紫色”，没有“蓝”和“紫”）
任务文搜索“紫色”和“紫菜”，结果“紫色”被保留，“紫菜”被流放。
记忆文搜索“蓝色”和“蓝莓”，结果“蓝色”被保留，“蓝莓”被流放。
由于记忆候选和任务候选都只有一项，所以记忆文的译文需要替换。
*/
let { log } = console
let dict = `
蓝色忍者武器65(单刃)	희귀 닌자 무기65(외날검)
紫色	영웅
蓝色	희귀
蓝莓	블루베리
紫菜	김
`
dict = dict.trim().split('\n').map((e) => {
	return e.split('\t').map((e) => {
		return e.trim()
	})
})

let dmpResult = {
	'-1': '蓝',
	'1': '紫',
}

let source = 紫色游侠武器65(弓)
function smartMatchReplaceOfCase(source, dmpResult, dict) {
	let { '-1':del, '1':ins } = dmpResult
	
}


smartMatchReplaceOfCase(source, dmpResult, dict)