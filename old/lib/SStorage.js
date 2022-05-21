class SStorage {
  constructor(prefix = location.pathname) {
    this.prefix = prefix
  }
  get(k) {
    let v = sessionStorage.getItem(this.prefix + k)
    try {
      if (typeof v === 'string') {
        return JSON.parse(v)
      } else if (v === null) {
        return undefined
      } else {
        return v
      }
    } catch (err) {
      console.error('JSON解析错误', v)
      console.error(err)
      return undefined
    }
  }
  set(k, v) {
    sessionStorage.setItem(this.prefix + k, v)
    return this
  }
  each(callback) {
    for (let i = 0, len = sessionStorage.length; i < len; i++) {
      let k = sessionStorage.key(i)
      if (k.indexOf(this.prefix) === 0) {
        let v = sessionStorage.getItem(k)
        if (callback(v, k) === true) break
      }
    }
    return this
  }
  remove(k) {
    sessionStorage.removeItem(this.prefix + k)
    return this
  }
  get length() {
    let count = 0
    for (let i = 0, len = sessionStorage.length; i < len; i++) {
      let k = sessionStorage.key(i)
      if (k.indexOf(this.prefix) === 0) count++
    }
    return count
  }
}
