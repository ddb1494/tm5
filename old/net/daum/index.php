<?php
//테스트 http://localhost:8888/demo/translate/daum/?q=%EB%82%98%EB%AC%B4%EA%BE%BC%EC%9D%98%20%EC%88%B2
//테스트 http://zun.aonun.com/tm/daum/?q=%EB%82%98%EB%AC%B4%EA%BE%BC%EC%9D%98%20%EC%88%B2
// header("Content-Type: text/html; charset=UTF-8");
// header('Content-Type: application/json');
error_reporting(E_ALL ^ E_NOTICE);
require_once '../headers.php'; aonun_allow();
$get=array_merge( $_GET, $_POST );
if(empty($get['q'])) exit('{"error":"검색 단어를 입력 하세요"}');
require 'phpQuery.php';

$text = $get['q'];
//$text = '무적';
//$text = '무적의 용사가 싸움에서 이기다';
$lang = empty($get['t']) ? 'zh-cn' : strtolower($get['t']);
if( $lang == 'zh-cn') {
	$url = 'http://alldic.daum.net/search.do?q='. urlencode($text) .'&dic=ch';
}else{
	$url = 'http://alldic.daum.net/search.do?q='. urlencode($text) .'&dic='.$lang;
}
//$url = 'http://alldic.daum.net/search.do?q='. urlencode($text) ;
//$url = 'http://alldic.daum.net/search.do?q='. urlencode($text) .'&dic=eng';
//$url ='http://alldic.daum.net/search.do?q='. urlencode($text) .'&dic=eng&search_first=Y';
// $html = file_get_contents($url);
// phpQuery::newDocumentHtml($html);
phpQuery::newDocumentFile($url);
// phpQuery::newDocumentFile('test.xml');
// echo pq("#container")->html();
$cont = pq("#mArticle");

$rs = [];
$rs2 = [];


if( $lang == 'zh-cn') {
	//단어/숙어 검색결과
	$items1 = $cont->find('div[data-target=word] div');
	foreach ($items1 as  $item) {
		$obj = pq($item)->find(' .kokc_type');
		foreach ($obj as $k => $sc) {
			$rs['word_result']['origin'][] = trim(pq($sc)->find('.txt_emph1')->text());
			$rs['word_result']['mean1'][] = trim(pq($sc)->find('.sub_txt')->text());
			$rs['word_result']['mean2'][] = preg_replace('/[\t ]/','',pq($sc)->find('.list_search')->text());
		}
	}
	//뜻 검색결과
	$items2= $cont->find('div[data-target=mean] .search_box');
	foreach ($items2 as  $k =>$item) {
		$obj = pq($item)->find('.txt_searchword');
		foreach ($obj as $k => $sc) {
			$rs['mean_result'][$k][] = trim(pq($sc)->text());
		}
		$obj = pq($item)->find('.txt_pronounce');
		foreach ($obj as $k => $sc) {
			$rs['mean_result'][$k][] = trim(pq($sc)->text());
		}
		$obj = pq($item)->find('.list_search');
		foreach ($obj as $k => $sc) {
			$rs['mean_result'][$k][] = preg_replace('/[\t ]/','',pq($sc)->text());
		}
	}
	if($rs['word_result'] != null){
		foreach ($rs['word_result']['origin'] as $k => $v) {
			//$rs2[] = array( $v, $rs['word_result']['mean1'][$k] );
			$rs2[] = array( $v, preg_replace('/[\n ]/' , ' ' , $rs['word_result']['mean2'][$k]));
		}
	}
	if($rs['mean_result'] != null){
		foreach ($rs['mean_result'] as $v) {
			$rs2[] = array( preg_replace('/[\n ]/' , ' ' , $v[2]) , $v[0] );
		}
	}

}else{
	exit('{"error":"제작중 입니다."}');
}



// echo '<textarea style="width:800px;height:500px;">';
// //print_r($rs);
// print_r($rs2);
// echo '</textarea>';
//echo json_encode($rs2,JSON_UNESCAPED_UNICODE);
echo json_encode(array('result'=>$rs2), JSON_PRETTY_PRINT+JSON_UNESCAPED_UNICODE);
// echo json_encode(array('result'=>$rs), JSON_PRETTY_PRINT+JSON_UNESCAPED_UNICODE);
