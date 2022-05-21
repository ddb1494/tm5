function cancelTag(t = '') {
	return t
		.replace(new RegExp(String.raw`{\d+>`, 'g'), '')
		.replace(new RegExp(String.raw`<\d+}`, 'g'), '')
		.replace(new RegExp(String.raw`<\d+>`, 'g'), '')
}

function cancelComment(change = true) {
	$('#works td.comment').each((i, e) => {
		let c = $(e) // comment
		if (c.text().trim().length === 0) return true

		let tr = $(e).parent()
		let s = tr.find('td.source')
		let t = tr.find('td.target')

		let st = s.text().trim()
		let tt = t.text().trim()

		let a = c
			.text()
			.split(',')
			.map((e) => e.split(':'))
		a.forEach((e) => {
			st = st.replace(e[0], e[1])
			tt = tt.replace(e[0], e[1])
		})
		if (change) {
			s.text(st)
			t.text(tt)
		}
	})
	$('#works td.source').each((i, e) => {
		$(e).text(cancelTag($(e).text()))
	})
}
