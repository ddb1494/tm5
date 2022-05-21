importScripts('/lib/diff_match_patch.js')


function collector(dicts) {
  if (!Array.isArray(dicts)) return false;
  let dmp = new diff_match_patch()
  let s = collector.s = {}
  let len = dicts.length

  let now = Date.now()
  dicts.forEach(function (dict, index) {
    let { source, target, similar } = dict
    console.log(Math.floor(100 * index / len))
    dicts.forEach((e, i, a) => {
      if (index === i) return;
      let sd = dmp.diff_main(source, e.source)
      let td = dmp.diff_main(target, e.target)
      let sa = { '-1': new Set(), '1': new Set(), '0': new Set() }
      let ta = { '-1': new Set(), '1': new Set(), '0': new Set() }
      sd.forEach(e => sa[e[0]].add(e[1]))
      td.forEach(e => ta[e[0]].add(e[1]))
      let f = function (k) {
        if (sa[k].size === 1 && ta[k].size === 1) {
          let st = Array.from(sa[k])[0]
          let tt = Array.from(ta[k])[0]
          if (!s[st]) s[st] = {}
          if (!s[st][tt]) s[st][tt] = 0
          s[st][tt] += 1
        }
      }
      f('-1')
      f('0')
      f('1')
    })
  })
  // collector.r = collectorTips()
  return s
}
function collectorTips() {
  let s = collector.s, r = []
  if (s) {
    for (let k in s) {
      let v, count = 0
      Object.keys(s[k]).forEach(t => {
        if (s[k][t] > count) v = t
      })
      r.push([k, v])
    }
  }
  return r
}

this.addEventListener('message', (e) => {
  let o = e.data
  if (o.type == 'set') {
    console.log('collection', o.data)
    collector(o.data)
    console.log(collector.s)
    this.postMessage({ type: 'set', ok: 1 })
  } else if (o.type === 'get' || o == 'get') {
    this.postMessage(collector)
  } else if (o.type == 's' || o === 's') {
    this.postMessage(collector.s)
  } else if (o.type == 'r' || o === 'r') {
    this.postMessage(collector.r)
  } else if (o.type === 'init') {
    collector.s = o.data
  }
})