import d3 from '/module/d3.js'
import sha3 from '/module/sha3.js'
import localforage from '/module/localforage.js'
import Zip from './zip.js'


let db = localforage.createInstance({ name: 'tm', storeName: 'backup' })
let textdb = localforage.createInstance({ name: 'tm', storeName: 'text' })

self.cdb = {}
self.d3 = d3
self.Zip = Zip
self.sha3 = sha3
self.texts = {}


class TM extends EventTarget {
	constructor(sourceLanguage) {
		this.sourceLanguage = sourceLanguage
		this.id = 1
		/* this.db

			[shake256] => {
				text,
				translations: {
					[language] => {
						id,
						shake256,
						time,
						user
					}
				},
				...
			}
		*/
		this.db = {}
	}

	translate(s, t, tl, sl) {
		let { db } = this
		let sk = sha3.shake256(s, 256)
		let tk = sha3.shake256(t, 256)
		if (sk in db) {
			let d = db[sk]

		} else {
			this.db
		}
	}
}



async function ready() {
	let v = sessionStorage.getItem('tm.backup')
	if (v) {
		console.time('sync')
		v = JSON.parse(v)
		cdb = v
		console.timeEnd('sync')
	} else {
		console.time('async')
		await db.iterate((v, k) => {
			cdb[k.replace(/^_+/g, '')] = v
		})
		console.timeEnd('async')
	}
}

async function analyze() {
	for (let projectName in cdb) {
		let project = cdb[projectName]
		let { dictArray } = project
		if (Array.isArray(dictArray) && dictArray.length) {
			cdb[projectName] = dictArray
			for (let i = 0, len = dictArray.length; i < len; i++) {
				let [s, t] = dictArray[i]

				async function save(text) {
					let k = sha3.shake256(text, 256)
					//await textdb.setItem(k, text)
					texts[k] = text
				}

				save(s)
				save(t)
			}
			console.log(projectName, 'done.')
		}
	}
	//let r = {}
	//let max = 0xffffff
	//for(let i=0;i<max; i++) {
	//	try{
	//		r[i]=i
	//	}catch(err) {
	//		console.log(err)
	//		console.log('last', i)
	//		break
	//	}
	//}
}


async function main() {
	await ready()
	await analyze()
}

main()

self.clear = function clear() {
	cdb = {}
	sessionStorage.clear()
}






window.addEventListener('beforeunload', function () {
	if (0 < Object.keys(cdb).length) {
		sessionStorage.setItem('tm.backup', JSON.stringify(cdb))
	}
})



