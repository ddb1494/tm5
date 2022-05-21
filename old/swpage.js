if (window.navigator && navigator.serviceWorker) {
  const baseURL = location.href.slice(0, location.href.lastIndexOf("/"));
  const baseScriptURL = baseURL + "/sw.js";
  const CACHE_NAME = location.pathname.slice(
    0,
    location.pathname.lastIndexOf("/") + 1
  );
  const RED = "color:crimson";
  const BLUE = "color:royalblue";
  const GRAY = "color:gray";

  let baseScriptIsRun = false;
  navigator.serviceWorker.getRegistrations().then(async (regs) => {
    for (let i = 0, len = regs.length; i < len; i++) {
      let reg = regs[i];
      //active.onstatechange = console.log.bind(reg, active.scriptURL);
      //active.onerror = console.log.bind(reg, active.scriptURL);
      //active.onmessage = console.log.bind(reg, active.scriptURL);
      //active.postMessage({ msg: 123, a: 1 });
      //更新
      //reg.update().then((reg) => {
      //	console.debug('%c[UPDATE]', GRAY, reg.active.scriptURL, reg.active.state);//activated
      //});
      if (reg.active && reg.active.scriptURL !== baseScriptURL) {
        reg.unregister().then((b) => {
          if (b) {
            console.debug('%c[SW] unregister', RED, reg.active.scriptURL);
          }
        });
      }
      let isSame = reg.active.scriptURL === baseScriptURL;
      //if (!isSame) {
      //	//注销缓存服务
      //	reg
      //		.unregister()
      //		.then((isUnregister) => {
      //			let msg = isUnregister ? '[OK]' : '[NG]';
      //			msg += ' unregister';
      //			if (reg.active) {
      //				msg += ' - ' + reg.active.scriptURL;
      //			}
      //			console.debug('%c' + msg, RED);
      //			console.debug(reg.active);
      //		});
      //}
      baseScriptIsRun = baseScriptIsRun || isSame;
    }
    if (!baseScriptIsRun) {
      console.debug("注册");
      navigator.serviceWorker
        .register(baseScriptURL)
        //.register(baseScriptURL, { scope: '/tm4/' })
        .then((reg) => {
          console.debug("%c[SW] register ", BLUE, reg.scope);
        });
    }
  });
}
