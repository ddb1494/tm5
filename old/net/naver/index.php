<?php
//테스트 http://localhost:8888/demo/translate/naver/?q=%EB%AC%B4%EC%A0%81%EC%9D%98%20%EC%9A%A9%EC%82%AC
//테스트 http://zun.aonun.com/tm/naver/?q=%EB%AC%B4%EC%A0%81%EC%9D%98%20%EC%9A%A9%EC%82%AC
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
	$url = 'http://cndic.naver.com/search/all?q='. urlencode($text) .'&direct=false'; //중국어 사전.
}else if($lang == 'en'){
	$url = 'http://endic.naver.com/search.nhn?sLn=en&isOnlyViewEE=N&query='. urlencode($text) ;//영어사전
}else if($lang == 'jp'){
	$url = 'http://jpdic.naver.com/search.nhn?dic_where=jpdic&query='. urlencode($text) ;//일본어 사전
	//$url2 = 'http://jpdic.naver.com/search.nhn?range=all&q='.urlencode($text).'&sm=jpd_hty';
}else if($lang == 'kr'){
	$url = 'http://krdic.naver.com/search.nhn?dic_where=krdic&query='. urlencode($text) ;//국어사전
}

else if($lang=='fr' or 		//프랑스어
	$lang=='sp' or 	//스페인어
	$lang=='de' )		//독일어
{
	$url = 'http://'. $lang .'dic.naver.com/#/search?query='. urlencode($text).'&range=all';//
}

else if($lang == 'vn' or 	//베트남
	$lang=='id' or 	//인도네시아
	$lang=='th' or 	//태국어
	$lang=='ar' or 	//아랍어
	$lang=='mn' or 	//몽골어
	$lang=='hi' or 	//힌디어
	$lang=='fa' or 	//페르시아어
	$lang=='ne' or 	//네팔어
	$lang=='sw' or 	//스와힐리어
	$lang=='ru' or 	//러시아어
	$lang=='it' or 		//이탈리아어
	$lang=='ge' or 	//조지아어
	$lang=='ro' )		//루마니아
{
	$url = 'http://'. $lang .'dic.naver.com/#/search?query='. urlencode($text);//
}

// else if($lang == 'test'){
// 	//[["en","英语"],["zh-CN","中文（简体）"],["zh-TW","中文（繁体）"],["ja","日语"],["es","西班牙语"],["fr","法语"],["id","印度尼西亚语"],["th","泰国语"],["vi","越南语"]]
// 	$url = 'http://endic.naver.com/search.nhn?sLn=en&isOnlyViewEE=N&query=Hi.%20Good%20to%20see%20you.';//영어사전
// 	$url = 'http://krdic.naver.com/search.nhn?dic_where=krdic&query=%EC%95%88%EB%85%95';//국어사전
// 	$url = 'http://hanja.naver.com/search?query=%EC%95%88%EB%85%95';//한자사전
// 	$url = 'http://cndic.naver.com/search/all?q=%EC%95%88%EB%85%95';//중국어 사전
// 	$url = 'http://jpdic.naver.com/search.nhn?dic_where=jpdic&query=%EC%95%88%EB%85%95';//일본어 사전

// 	//------아시아/아프리카
// 	$url = 'http://vndic.naver.com/#/search?query=%EC%95%88%EB%85%95';//베트남어 사전
// 	$url = 'http://iddic.naver.com/#/search?query=%EC%95%88%EB%85%95';//인도네시아
// 	$url = 'http://thdic.naver.com/#/search?query=%EC%95%88%EB%85%95';//태국어 
// 	$url = 'http://ardic.naver.com/#/search?query=%EC%95%88%EB%85%95';//아랍어
// 	$url = 'http://mndic.naver.com/#/search?query=%EC%95%88%EB%85%95';//몽골어
// 	$url = 'http://hidic.naver.com/#/search?query=%EC%95%88%EB%85%95';//힌디어
// 	$url = 'http://fadic.naver.com/#/search?query=%EC%95%88%EB%85%95';//페르시아어 
// 	$url = 'http://nedic.naver.com/#/search?query=%EC%95%88%EB%85%95';//네팔어
// 	$url = 'http://swdic.naver.com/#/search?query=%EC%95%88%EB%85%95';//스와힐리어
// 	// $url = 'http://uzdic.naver.com/#/userEntry/kouz/79e59cb55e1fa3ab3c593733c241d161';//우즈베크어 사전
// 	// $url = 'http://khdic.naver.com/#/entry/kokm/155756';//캄보디아어
// 	//------유럽/아메리카
// 	$url = 'http://frdic.naver.com/#/search?query=%EC%95%88%EB%85%95&range=all';//프랑스어 사전
// 	$url = 'http://spdic.naver.com/#/search?query=%EC%95%88%EB%85%95&range=all';//스페인어 사전
// 	$url = 'http://dedic.naver.com/#/search?query=%EC%95%88%EB%85%95&range=all';//독일어 사전
// 	$url = 'http://rudic.naver.com/#/search?query=%EC%95%88%EB%85%95';//러시아어
// 	$url = 'http://itdic.naver.com/#/search?query=%EC%95%88%EB%85%95';//이탈리아어
// 	$url = 'http://gedic.naver.com/#/search?query=%EC%95%88%EB%85%95';//조지아어
// 	$url = 'http://rodic.naver.com/#/search?query=%EC%95%88%EB%85%95';//루마니아어
// 	// $url = 'http://ladic.naver.com/#/userEntry/kola/0a59adf189554f78c85afeb1d821828a';//라틴어
// 	// $url = 'http://ptdic.naver.com/#/entry/kopt/1607085';//포르투갈어
// 	// $url = 'http://trdic.naver.com/#/entry/kotr/1344397';//터키어
// 	// $url = 'http://aldic.naver.com/#/userEntry/kosq/756568c2299ece557ec8f29dfe836e50';//알바니아어
// 	// $url = 'http://uadic.naver.com/#/userEntry/kouk/2233038cf650027343d1fb0507a3b7a8';//우크라이나어
// 	// $url = 'http://nldic.naver.com/#/entry/konl/1006720';//네덜란드어
// 	// $url = 'http://svdic.naver.com/#/entry/kosv/897663';//스웨덴어
// 	// $url = 'http://hudic.naver.com/#/entry/kohu/971148';//헝가리어
// 	// $url = 'http://pldic.naver.com/#/userEntry/kopl/601b993cff71d435a786945cc506f7d9';//폴란드어
// 	// $url = 'http://csdic.naver.com/#/userEntry/kocs/2fb8b5acfd7e0c8a76760e8338201d24';//체코어

// 	$url = 'http://englishdictionary.naver.com/#/search?range=all&query=%EC%95%88%EB%85%95';//영영사전 

// }





$html = file_get_contents($url);
phpQuery::newDocumentHtml($html);
// phpQuery::newDocumentFile($url);
// phpQuery::newDocumentFile('test.xml');
// echo pq("#container")->html();

$rs = [];
$rs2 = [];

if( $lang == 'zh-cn') {
	$cont = pq("#container");

	//번역결과
	$items = $cont->find(".trans_result .sc"); 
	foreach ($items as $item) {
	    $rs['trans_result'][] = pq($item)->text();
	}


	//단어 검색결과
	//$url2 = 'http://dict-channelgw.naver.com/cndic/zh/kozh/entry/[uid]/detail.dict';
	$items2 = $cont->find('.word_result');
	foreach ($items2 as  $item) {

		//$href = pq($item)->find('a.kr');
		// foreach ($href as $v) {
		// 	$rs['papago']['href'][] =pq($v)->attr('href');
		// }
		// for ($i=0, $leng=count($rs['papago']['href']); $i < $leng; $i++) { 
		// 	$rs['papago']['uid'][$i] = explode('=', $rs['papago']['href'][$i])[1];
		// 	$rs['papago']['url'][$i] = str_replace('[uid]', $rs['papago']['uid'][$i], $url2);
		// 	phpQuery::newDocumentFile($rs['papago']['url'][$i]);
		// 	$arr=json_decode(pq('')->html(),1)['data'];
		// 	$rs['papago']['json2'][$i]['entryName']= $arr['entryName'];
		// 	foreach ($arr['means'] as  $v) {
		// 		$rs['papago']['json2'][$i]['mean'][] = $v['mean'];
		// 		$rs['papago']['json2'][$i]['part'][] = $v['part'];
		// 		foreach($v['exams'] as $o){
		// 			$rs['papago']['json2'][$i]['exams'][] = $o['example'];
		// 			$rs['papago']['json2'][$i]['transl'][] = $o['translationList'][0]['mean'];
		// 		}
		// 	}
		// }
		// unset($rs['papago']['href']);
		// unset($rs['papago']['url']);


		$obj = pq($item)->find('a.kr');
		foreach ($obj as $sc) {
			$rs['word_result']['origin'][] = pq($sc)->text();
		}
		$obj = pq($item)->find('dd');
		foreach ($obj as $sc) {
			$obj2 = pq($sc)->find('span.sc');
			$a= '';
			$i= 1;
			foreach ($obj2 as $k => $v) {
				$a .= $i .'. '. pq($obj2)->text();
				$i++;
			}
			$rs['word_result']['trans'][] = $a;
		}
	}
	if(!empty($rs['word_result']['origin'])){
		$rs['word_result']['unique'] = array_unique($rs['word_result']['origin']);//分词
	}


	//본문 검색결과
	$items3 = $cont->find('.search_result dl');
	foreach ($items3 as  $item) {
		$obj = pq($item)->find('a.sc');
		foreach ($obj as $sc) {
			$rs['search_result']['origin'][] = trim(pq($sc)->text());
		}
		$obj = pq($item)->find('dd');
		foreach ($obj as $sc) {
			$rs['search_result']['trans'][] = trim(pq($sc)->text());
		}
	}

	//예문 검색결과
	$items4 = $cont->find('.term_result_list');
	foreach ($items4 as  $item) {
		$obj = pq($item)->find('dt>span.sc');
		foreach ($obj as $sc) {
			$rs['term_result']['origin'][] = trim(pq($sc)->text());
		}
		$obj = pq($item)->find('dd');
		foreach ($obj as $sc) {
			$rs['term_result']['trans'][] = trim(pq($sc)->text());
		}
	}


	//-------------

	$rs2[] = $rs['trans_result'];
	foreach ($rs['word_result']['origin'] as $k => $v) {
		$rs2[] = array( $v, $rs['word_result']['trans'][$k]);
	}
	if($rs['search_result'] != null){
		foreach ($rs['search_result']['trans'] as $k => $v) {
			$rs2[] = array( $v, $rs['search_result']['origin'][$k]);
		}
	}
	foreach ($rs['term_result']['trans'] as $k => $v) {
		$rs2[] = array( $v, $rs['term_result']['origin'][$k]);
	}

}else if($lang == 'en'){
	$cont = pq(".word_num");
	$items = $cont->find(".list_e2:eq(0) dt");
	foreach ($items as $k=> $item) {
		$rs[0][$k][0]= trim(pq($item)->find('.fnt_e30')->text());
	}
	$items = $cont->find(".list_e2:eq(0) dd"); 
	foreach ($items as $k=> $item) {
		$rs[0][$k][1]= trim(pq($item)->find('.fnt_k05')->text());
		$rs[1][$k][0]= trim(pq($item)->find('.fnt_e07')->text());
		if($rs[1][$k][0] == '') unset($rs[1][$k] );
		else $rs[1][$k][1]= trim(pq($item)->find('.fnt_k10')->text());
	}

	$items = $cont->find(".list_e2:eq(1) dd"); 
	foreach ($items as $k=> $item) {
		$rs[2][$k][0]= trim(pq($item)->find('.fnt_k05')->text());
		$rs[3][$k][0]= trim(pq($item)->find('.fnt_k10')->text());
		if($rs[3][$k][0] == '') unset($rs[3][$k] );
		else $rs[3][$k][1]= trim(pq($item)->find('.fnt_e07')->text());
	}
	$items = $cont->find(".list_e2:eq(1) dt");
	foreach ($items as $k=> $item) {
		$rs[2][$k][1]= trim(pq($item)->find('.fnt_e30')->text());
	}

	$items = $cont->find(".list_a li"); 
	foreach ($items as $k=> $item) {
		$rs[4][$k][0]= trim(pq($item)->find('.fnt_k10 a')->text());
		if($rs[4][$k][0] == '') unset($rs[4][$k] );
		else  $rs[4][$k][1]= trim(pq($item)->find('.fnt_e09')->text());

	}
	if($rs[0] != null) foreach ($rs[0] as  $v) { $rs2[] = $v; }
	if($rs[1] != null) foreach ($rs[1] as  $v) { $rs2[] = $v; }
	if($rs[2] != null) foreach ($rs[2] as  $v) { $rs2[] = $v; }
	if($rs[3] != null) foreach ($rs[3] as  $v) { $rs2[] = $v; }
	if($rs[4] != null) foreach ($rs[4] as  $v) { $rs2[] = $v; }
	// $rs2 = array_merge($rs[0], $rs[1], $rs[2], $rs[3], $rs[4]);

}else if($lang == 'kr'){
	$cont = pq(".lst3");
	$items = $cont->find(">li");
	foreach ($items as $k=> $item) {
		$rs2[$k][]= trim(pq($item)->find('.fnt15')->text());
		$rs2[$k][]= trim(pq($item)->find('>p:not(".syn"),li')->text());
	}

}else if($lang == 'jp'){
	$cont = pq("#content");
	$items = $cont->find(".section_word .srch_box");
	foreach ($items as $k=> $item) {
		$rs[0][$k][]= pq($item)->find('.entry')->text();
		$rs[0][$k][]= preg_replace('/[\t]/','', trim(pq($item)->find('.lst_txt')->text()));
	}
	$items = $cont->find(".section_article .srch_box");
	foreach ($items as $k=> $item) {
		$rs[1][$k][]= preg_replace('/[\t\n]/','', pq($item)->find('.pin2')->text());
		$rs[1][$k][]= pq($item)->find('p')->text();
	}
	$items = $cont->find(".section_example .inner_lst");
	foreach ($items as $k=> $item) {
		$rs[2][$k][0]= pq($item)->find('p:eq(1)')->text();
		if($rs[2][$k][0] == '') unset($rs[2][$k] );
		else $rs[2][$k][1]= preg_replace('/[\t ]/','', pq($item)->find('p:eq(0)>span:eq(0)')->text());
	}
	$items = $cont->find(".section_sptrans .lst_p");
	foreach ($items as $k=> $item) {
		$rs[3][$k][]= pq($item)->find('span:eq(0)')->text();
		$rs[3][$k][]= pq($item)->find('span:eq(1)')->text();
	}
	if($rs[3] != null) foreach ($rs[3] as  $v) { $rs2[] = $v; }
	if($rs[0] != null) foreach ($rs[0] as  $v) { $rs2[] = $v; }
	if($rs[1] != null) foreach ($rs[1] as  $v) { $rs2[] = $v; }
	if($rs[2] != null) foreach ($rs[2] as  $v) { $rs2[] = $v; }
	//$rs2 = array_merge($rs[3], $rs[0], $rs[1], $rs[2]);//null -> error
}

else if($lang=='fr' or 		//프랑스어
	$lang=='sp' or 	//스페인어
	$lang=='de' or	//독일어
	$lang=='vn' or 	//베트남
	$lang=='id' or 	//인도네시아
	$lang=='th' or 	//태국어
	$lang=='ar' or 	//아랍어
	$lang=='mn' or 	//몽골어
	$lang=='hi' or 	//힌디어
	$lang=='fa' or 	//페르시아어
	$lang=='ne' or 	//네팔어
	$lang=='sw' or 	//스와힐리어
	$lang=='ru' or 	//러시아어
	$lang=='it' or 		//이탈리아어
	$lang=='ge' or 	//조지아어
	$lang=='ro' )		//루마니아
{
	exit('{"error":"해당 언어는 네이버 사전에 있는 언어 입니다. 추가가 필요할시 관리자 한테 문의해주세요."}');
}


else{
	exit('{"error":"사용할수 없는 언어 유형입니다."}');
}


if($rs2==null)  exit('{"error":"데이터를 찾지 못했습니다."}');




// echo '<textarea style="width:800px;height:500px;">';
// print_r($rs);
// print_r($rs2);
// echo '</textarea>';
//echo json_encode($rs2,JSON_UNESCAPED_UNICODE);
echo json_encode(array('result'=>$rs2), JSON_PRETTY_PRINT+JSON_UNESCAPED_UNICODE);
// echo json_encode(array('result'=>$rs), JSON_PRETTY_PRINT+JSON_UNESCAPED_UNICODE);
