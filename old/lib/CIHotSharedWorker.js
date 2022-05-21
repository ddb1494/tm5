class CIHotSharedWorker extends SharedWorker {
  constructor(url, autoStart = true) {
    super(url)
    this.port.addEventListener('message', function (event) {
      let { data } = event
      console.log('[sharedworker_message]', data, event)
    })
    if (autoStart) {
      this.port.start()
    }
    window.addEventListener('beforeunload', function () {
      //可尝试不耗时的异步代码
      this.port.postMessage({ action: 'disconnecting' })
    })
    window.addEventListener('unload', function () {
      //不等待异步代码
      this.port.postMessage({ action: 'disconnect' })
    })
  }
  start() {
    this.port.start()
    return this
  }
  stop() {
    this.port.close()
    return this
  }
  emit(type, data) {

  }
  send(data, id) {
    /* 
    data  any
    id    undefined | number | 
    */
    this.port.postMessage({ data, id })
    return this
  }
  on(type, handle, options) {
    this.port.addEventListener(type, handle, options)
    return this
  }
}
