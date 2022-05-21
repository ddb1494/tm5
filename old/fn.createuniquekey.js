function createUniqueKey(len) {
    var s = [];
    var char = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var len  = char.length;
    var time = Date.now().toString(36);

    for (var i = 0; i < 36; i++) {
        s[i] = char.substr(Math.floor(Math.random() * len), 1);
    }
    var uk = s.join('');
    return time+'_'+uk;
}

// console.log(createUniqueKey());