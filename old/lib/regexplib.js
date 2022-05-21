'use strict';
(function(g){
var cn='[\\u4e00-\\u9fff\\uf900-\\ufaff]';
var CN='[^\\u4e00-\\u9fff\\uf900-\\ufaff]';
var kr='[\\u3131-\\u314e\\u314f-\\u3163\\uac00-\\ud7a3]';
var KR='[^\\u3131-\\u314e\\u314f-\\u3163\\uac00-\\ud7a3]';
g.RegExpLib = { cn,CN,kr,KR };
})(this);