function inputFiles(event) {
	let files = event.target.files
	// 逐一读取文件
	void async function read() {
		let works = document.querySelector('#works')
		for (let file of files) {
			try {
				let o = await readFileAsText(file)
				let { type, name, text } = o
				let tbody = createTMToolTBody(text)
				if(tbody) {
					works.appendChild(tbody)
				}else{
					console.error('tbody')
				}


			} catch (err) {
				console.error(err)
			}
		}
	}()
}

function readFileAsText(file) {
	return new Promise((resolve, reject) => {
		log('读取', file.name)
		let fr = new FileReader()// 读文件数据
		fr.file = file
		fr.name = file.name
		fr.onload = function (e) {
			let { target } = e
			resolve({
				type: 'tmtool',
				name: target.name,
				text: target.result,
				file: target.file
			})
		}
		fr.onerror = function (e) {
			reject(e)
		}
		fr.readAsText(file)
	})
}

function toWorks(type, name, text, file) {
	let table = function () {
		let table = ao.tmstringToTable(data)
		let tbody = document.createElement('tbody')
		tbody.setAttribute('datatype', type)
		tbody.setAttribute('dataname', name)
		tbody.setAttribute('class', table.getAttribute('class'))
		tbody.innerHTML = table.innerHTML
		return tbody
	}()

	// log('-'.repeat(32))
	// log(name)
	// log(type)
	log(data)
	log(table)

	$(table).find('.target').end().attr({ dataType: type, dataName: name })

	$(table).find('.source').each(function (i, e) {
		$(e).text($(e).text().replace(/\{\\r\\n\}/g, '\\n'))
	})

	if (type === 'tmtool') table.classList.add('tmtoolfile')
	$('#works').append(table)
}

function createTMToolTBody(text) {
	let rows = stringToArray(text, 6)
	let tbody
	if (rows.length) {
		let tbody = cElem('tbody')
		rows.forEach((row, i) => {
			let [textKey, target, targetComment, season, revision, source, sourceComment] = row
			// tr = $('<tr>').appendTo(tbody)
			// if (!source) source = ''
			// if (!sourceComment) sourceComment = ''
			// $('<td>').text(i).appendTo(tr).addClass('no')
			// $('<td>').text(source).appendTo(tr).addClass('source')
			// $('<td>').text(target).appendTo(tr).addClass('target').attr('contentEditable', 'plaintext-only')
			// $('<td>').text(textKey).appendTo(tr).addClass('textKey').attr({ title: textKey })
			// $('<td>').text(sourceComment).appendTo(tr).addClass('sourceComment').attr({ title: sourceComment })
			// $('<td>').text(targetComment).appendTo(tr).addClass('targetComment')
			// $('<td>').text(season).appendTo(tr).addClass('season').attr({ title: season })
			log(row)
			let tr = cElem('tr')
			tr.appendChild(cElem('td', i, 'no'))
			tr.appendChild(cElem('td', source, 'source'))
			tr.appendChild(cElem('td', source === target ? '' : target, 'target'))
			tr.appendChild(cElem('td', sourceComment, 'sourceComment'))
			tr.appendChild(cElem('td', targetComment, 'targetComment'))
			tr.appendChild(cElem('td', textKey, 'textKey'))
			// tr.appendChild(cElem('td', season, 'season'))
			// tr.appendChild(cElem('td', revision, 'revision'))
			tbody.appendChild(tr)
		})
	}
	return tbody

}
function cElem(tagName, text, classes, attrs) {
	let e = document.createElement(tagName)
	if (text) e.textContent = text
	if (typeof classes == 'string') {
		e.classList.add(classes)
	} else if (classes) {
		for (let className of classes) {
			e.classList.add(className)
		}
	}
	for (let attrName in attrs) {
		e.setAttribute(attrName, attrs[attrName])
	}
	return e
}