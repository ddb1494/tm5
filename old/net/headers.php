<?php

function aonun_allow( $pattern='/^(http|https|ws|wss)\:\/\/((\w+\.)?aonun.com|x)$/i' ) {
	$host='';
	if(!empty($_SERVER['HTTP_ORIGIN'])) $host = $_SERVER['HTTP_ORIGIN'];
	else if(!empty($_SERVER['HTTP_REFERER'])) $host = $_SERVER['HTTP_REFERER'];

	$b = preg_match($pattern, $host);

	$s = 'Access-Control-Allow-Origin: '.$host;

	if($b) {
		header($s);
		header('Access-Control-Allow-Methods: GET, POST');
	}

	//1、隐藏X-Powered-By  :  修改 php.ini 文件。添加或修改 expose_php = Off

	header('X-Powered-By: asp.net');//可以误导别人以为是 .net 开发的

	//2、apache 隐藏 server : 修改httpd.conf 设置  ServerTokens Prod

	//3、nginx 隐藏 server : 修改nginx.conf  在http里面设置  server_tokens off;



	// header('Access-Control-Allow-Origin: *');

	// header('Access-Control-Allow-Credentials: true');

	// header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');

	// header('Access-Control-Max-Age: 1000');

	// header('Access-Control-Allow-Headers: Content-Type, X-Requested-With,  Content-Range, Content-Disposition, Content-Description');



	header('content-type:application/json;charset=utf8');


	return $b;

}

