<?php
// header("Content-Type: text/html; charset=UTF-8");

// //第一种利用curl：
// function translate($text,$language='en|zh-cn'){
// 	if(empty($text))return false;
// 		@set_time_limit(0);
// 		$html = "";
// 		$url = "https://translate.google.com/translate_t?langpair=".urlencode($language)."&text=".urlencode($text);
// 		$ch=curl_init();
// 		curl_setopt($ch,CURLOPT_HEADER,0);
// 		curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
// 		curl_setopt($ch,CURLOPT_URL,$url);
// 		curl_setopt($ch,CURLOPT_FOLLOWLOCATION,1);
// 		$html=curl_exec($ch);
// 		if(curl_errno($ch))$html = "";
// 		curl_close($ch);
// 		if(!empty($html)){
// 		$x=explode("</span></span></div></div>",$html);
// 		$x=explode("onmouseout=\"this.style.backgroundColor='#fff'\">",$x[0]);
// 		return $x[1];
// 	}else{
// 		return false;
// 	}
// }

// print translate('hello');
//---------------

//第二种：利用get方式   (要有语言对应的编码表才能实现。)
// function googleTran($text){
// if(empty($text)) return "";
// //反间碟
// $wf=@file_get_contents('http://translate.google.cn/translate_t?sl=ko&tl=zh-cn&text='.$text.'#');
// if (false===$wf||empty($wf)){
// return false;
// }

// //截取相关信息
// $return = "";

// $star="style.backgroundColor='\#fff'\">";

// $end="</span></span></div>";
// $p = "#{$star}(.*){$end}#iU";//i表示忽略大小写，U禁止贪婪匹配
// if(preg_match_all($p,$wf,$rs))
// { print_r($rs);
// return $rs[1][0];}

// }
// echo '<pre>';
// print googleTran('안녕');
//---------------
// error_reporting(E_ALL ^ E_NOTICE);
// header("Content-Type: text/html; charset=UTF-8");
// header('Content-Type: application/json');
require_once '../headers.php';
aonun_allow();

$get=array_merge( $_GET, $_POST );
if(empty($get['q'])) exit('{"error":"검색 단어를 입력 하세요"}');


// function ajax_google_search($text, $language='auto|zh-cn')
// {
// 	$url = "https://translate.google.com/translate_t?langpair=".urlencode($language)."&text=".urlencode($text);
// 	$ch=curl_init();
// 	curl_setopt($ch,CURLOPT_HEADER,0);
// 	curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
// 	curl_setopt($ch,CURLOPT_URL,$url);
// 	curl_setopt($ch,CURLOPT_FOLLOWLOCATION,1);
// 	$data=curl_exec($ch);
// 	preg_match_all("/charset=(\S*)\" http-equiv/", $data, $match);
// 	//print_r($match[1][0]);
// 	$html = iconv($match[1][0], 'utf-8', $data);
// 	curl_close($ch);
// 	if(!empty($html)){
// 		$x=explode("</span></span></div></div>",$html);
// 		$x=explode("onmouseout=\"this.style.backgroundColor='#fff'\">",$x[0]);
// 		$html = $x[1];
// 	}
// 	return $html;
// }


function ajax_google_search($text, $language='auto|zh-CN')
{
	$url = "https://translate.google.com/translate_t?langpair=".urlencode($language)."&text=".urlencode($text);
	require 'phpQuery.php';
	$data = file_get_contents($url);
	preg_match_all("/charset=(\S*)\" http-equiv/", $data, $match); //print_r($match[1][0]);
	$data = iconv($match[1][0], 'utf-8', $data);
	phpQuery::newDocumentHtml($data);
	//phpQuery::newDocumentFile($url);
	$arr = [];
	$cont = pq("#result_box");
	$items = $cont->find("span");
	$arr[0][]= $GLOBALS['get']['q'];
	$arr[0][]=  pq($items)->text();
	if(count($items) > 1 ){
		foreach ($items as $item) {
			if($i==null) $i=count($arr);
			$arr[$i][]= pq($item)->attr('title');
			$arr[$i][]= pq($item)->text();
			$i++;
		}
	}
	return $arr;
}


if(!empty($get['q'])){
	$sourceLang = empty($get['s']) ? 'auto' : $get['s'] ;
	$targetLang = empty($get['t']) ? 'zh-cn' : $get['t'] ;
	if($targetLang=='jp') $targetLang = 'ja';//일본어
	else if($targetLang=='zh-cn') $targetLang='zh-CN';
	else if($targetLang=='zh-tw') $targetLang='zh-TW';
	else if($targetLang=='kr') $targetLang='ko';

	$rs=ajax_google_search($get['q'], $sourceLang.'|'.$targetLang);
	//echo json_encode(array($rs), JSON_UNESCAPED_UNICODE);
	echo json_encode(array('result'=>$rs), JSON_PRETTY_PRINT+JSON_UNESCAPED_UNICODE);

}
//test    http://localhost:8888/demo/translate/google/?q=%EB%82%98%EB%AC%B4%EA%BE%BC%EC%9D%98%20%EC%88%B2&t=en
