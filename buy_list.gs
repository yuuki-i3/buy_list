var CHANNEL_ACCESS_TOKEN = '******'
var USER_ID = '******'
 
/*
//トーク開始
*/
function doPost(e) {
var reply_token= JSON.parse(e.postData.contents).events[0].replyToken;
if (typeof reply_token === 'undefined') {
return;
}
  
//メッセージ取得
var com = JSON.parse(e.postData.contents).events[0].message.text;
  
//スプレッドシート設定
var ss = SpreadsheetApp.openById('******');//買い物リスト用スプレッドシート名
var ss1 = ss.getSheets()[0];

var flag = ss.getRange('F1').getValue();//状態フラグ
  
//変数設定-返信
var reply_messages;
 
//フラグで状態を判断
if(flag == 1){//「買った」を言った後
  
reply_messages = set_item_purchased_(com, ss1);
  
}else if(flag == 2){//「追加」を言った後
  
reply_messages = set_item_purchase_list_(com, ss1);
  
}else{//それ以外
  
reply_messages = command_list(com, ss1, flag);
  
}
  
//返信設定
var url = 'https://api.line.me/v2/bot/message/reply';
UrlFetchApp.fetch(url, {
'headers': {
'Content-Type': 'application/json; charset=UTF-8',
'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
},
'method': 'post',
'payload': JSON.stringify({
'replyToken': reply_token,
'messages': [{
'type': 'text',
'text': reply_messages,
}],
}),
});
return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}
  
/*
//コマンド分岐
*/
function command_list(com, ss1, flag)
{
   
Logger.log(String(com));
  
//コマンド識別
if (String(com) == '買い物リスト'){
  
return get_purchase_list_(ss1);
  
}else if(String(com) == '買った') {
  
ss1.getRange('F1').setValue(1);//状態フラグ1に
return　'何買ってきてくれたの～';
  
}else if (String(com) == '追加'){
  
ss1.getRange('F1').setValue(2);//状態フラグ2に
return　'何が欲しいん？';
  
}else if (String(com) == 'キャンセル'){

return 'キャンセルしました';

}else {
return 'じゃがりこ欲しいな～';
}  
}

//--------------買い物リスト通知----------------------------------------------
function remainList(e)
{
  
  
  //スプレッドシート設定
  var ss = SpreadsheetApp.openById('1BVv9Q5UUxLg18AWKtJLPCoNFHaiX5pK7bbG-8--hAGw');//買い物リスト用スプレッドシート名
  var ss1 = ss.getSheets()[0];

  var flag = ss.getRange('F1').getValue();//状態フラグ
  
  //変数設定-返信
  var reminMessages;
  
  var lastRow = ss1.getLastRow(); //最終行
  var items = ss1.getRange("A1:B" + lastRow).getValues();//登録された品目
  
  // 買い出しリストに登録がなければ後続処理を実行しない
  if (items.length < 1){
  
    ss1.getRange('F1').setValue(1);
    reminMessages =  '今日の買い忘れはありません';
  
  }
  
  var text = '買い忘れていませんか？\n\n';
  var item_not_exist_flg = true;
  
  //済がついていない品目を表示する
  items.forEach(function(item){//item配列
    if (item[1] != '済')
    {
      item_not_exist_flg = false;
      text = text + String(item) + '\n';
    }
  });
  
  // 全て購入済ならリストに記載項目がない旨を返却
  if (item_not_exist_flg) {
  
    ss1.getRange('F1').setValue(0);
    reminMessages = '今日の買い忘れはありません';
    
  
  } 
  
  ss1.getRange('F1').setValue(0);
  reminMessages = text;
  
    var postData = {
    "to": USER_ID,
    "messages": [{
      "type": "text",
      "text": reminMessages,
    }]
  };

  var url = "https://api.line.me/v2/bot/message/push";
  var headers = {
    "Content-Type": "application/json",
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  };

  var options = {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(postData)
  };
  var response = UrlFetchApp.fetch(url, options);
  
}

//--------------買い物リスト----------------------------------------------
/*
//処理：追加
*/
function set_item_purchase_list_(items, ss1)//items = com
{
//キャンセル用
if(String(items) == 'キャンセル'){
ss1.getRange('F1').setValue(0);
return 'キャンセルしました';
}

ss1.getRange('F1').setValue(0);
  
//スプレッドシートの最終行を取得
var lastRow = ss1.getLastRow() + 1;

// もし改行があったら分割して登録
if( items.match(/[\n\r]/g) ){
  
var item = items.split(/\r\n|\r|\n/);//配列に格納
  
for (i = 0; i < item.length; i++) {
ss1.setActiveCell('A' + lastRow).setValue(item[i]);
lastRow = lastRow + 1;
}
  
}else{//改行なし
  
ss1.setActiveCell('A' + lastRow).setValue(items);
  
}
  
return '追加したよん\nリストの内容を見るには「買い物リスト」って言ってね';
}
  
/*
//処理：買い物リスト
*/
function get_purchase_list_(ss1)
{
var lastRow = ss1.getLastRow(); //最終行
var items = ss1.getRange("A1:B" + lastRow).getValues();//登録された品目
  
// 買い出しリストに登録がなければ後続処理を実行しない
if (items.length < 1){
  
ss1.getRange('F1').setValue(1);
return 'いま買ってほしいものはないよ～\nほしいものがあったら「追加」で教えてね！';
  
}
  
var text = '買い物リスト\n\n';
var item_not_exist_flg = true;
  
//済がついていない品目を表示する
items.forEach(function(item){//item配列
if (item[1] != '済')
{
item_not_exist_flg = false;
text = text + String(item) + '\n';
}
});
  
// 全て購入済ならリストに記載項目がない旨を返却
if (item_not_exist_flg) {
  
ss1.getRange('F1').setValue(0);
return 'いま買ってほしものはないよ～\nほしいものがあったら「追加」で教えてね！';
  
}
  
text = text + '\n買い出しが終わったら「買った」で教えてね！';
  
ss1.getRange('F1').setValue(0);
return text;
}
  
/*
//処理：買った
*/
function set_item_purchased_(purchased_items, ss1)//purchased_items = com
{
//キャンセル用
if(String(purchased_items) == 'キャンセル'){
ss1.getRange('F1').setValue(0);
return 'キャンセルしました';
}

ss1.getRange('F1').setValue(0);
  
//スプレッドシートの最終行を取得
var lastRow = ss1.getLastRow();
var items = ss1.getRange("A1:B" + lastRow).getValues();
  
//品目数
var cnt = 0;
  
//そもそもリストがなかった時の処理
if (purchased_items.length < 1 || items.length < 1) {
  
return 'これはリストにないよ！\n「買い物リスト」でリストにある品目を確認してね';
  
}
  
// もし改行があったら分割して済にする
if( purchased_items.match(/[\n\r]/g) ){
  
var tarItem = purchased_items.split(/\r\n|\r|\n/);
  
for (j = 0; j < tarItem.length; j++) {
  
//改行：あったときに済にする
for(var i=1 ;i <= lastRow; i++){
  
var item = ss1.getRange('A'+ i).getValue();
  
if(tarItem[j] == item && ss1.getRange('B'+i).getValue() == "" ){
  
ss1.getRange('B'+ i).setValue('済');
cnt = cnt + 1;
  
}
  
  
}//for(i)
  
}//for(j)
  
}else{
  
//通常：あったときに済にする
for(var i=1 ;i <= lastRow; i++){
  
var item = ss1.getRange('A'+ i).getValue();
  
if(purchased_items == item && ss1.getRange('B'+i).getValue() == "" ){
  
ss1.getRange('B'+ i).setValue('済');
cnt = 1;
  
}
  
}//比較for
  
}//分割分岐
  
//該当する品目がない
if (cnt == 0){
  
return 'これはリストにないよ！\n「買い物リスト」でリストにある品目を確認してね';
  
}else{
  
return 'リストから削除したよ！\n「買い物リスト」でリストにある品目を確認してね';
  
}
  
}
