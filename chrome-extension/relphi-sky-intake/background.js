// Chrome MV3 launch owner. Calculation stays with Sky Chart's Where and When owner.
importScripts('recognizer.js');
const recognizer=globalThis.RelphiSkyRecognizer;
const defaults={linkDates:false,linkAddresses:false,dateOrder:'unambiguous'};
function reviewURL(text,reason=''){
  return chrome.runtime.getURL('review.html')+'#'+new URLSearchParams({text:String(text||'').slice(0,5000),reason}).toString();
}
async function launch(input,kind='selection'){
  const text=String(input||'').slice(0,5000),settings=await chrome.storage.local.get(defaults);
  const data=recognizer.candidate(kind,text,settings);
  await chrome.tabs.create({url:data.hasAny&&!data.errors.length?recognizer.skyURL(data):reviewURL(text,data.errors.join('; '))});
  return data;
}
async function selection(tabId){
  const items=await chrome.scripting.executeScript({target:{tabId},func:()=>String(window.getSelection()?.toString()||'').slice(0,5000)});
  return String(items[0]?.result||'');
}
chrome.action.onClicked.addListener(tab=>{
  void selection(tab.id).then(text=>launch(text)).catch(e=>chrome.tabs.create({url:reviewURL('',String(e?.message||e))}));
});
chrome.runtime.onInstalled.addListener(()=>{
  chrome.contextMenus.create({id:'relphi-selection',title:'Open highlighted Where and When in Relphi',contexts:['selection']});
  chrome.contextMenus.create({id:'relphi-address',title:'Use selection as a Relphi location',contexts:['selection']});
  chrome.contextMenus.create({id:'relphi-date',title:'Use selection as a Relphi date',contexts:['selection']});
  chrome.contextMenus.create({id:'relphi-options',title:'Relphi linking preferences',contexts:['action']});
});
chrome.contextMenus.onClicked.addListener(info=>{
  if(info.menuItemId==='relphi-options'){void chrome.runtime.openOptionsPage();return}
  const kind={'relphi-selection':'selection','relphi-address':'address','relphi-date':'date'}[info.menuItemId];
  if(kind)void launch(info.selectionText,kind).catch(e=>chrome.tabs.create({url:reviewURL(info.selectionText,String(e))}));
});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message?.action!=='openCandidate'||!['date','address','selection'].includes(message.kind))return false;
  launch(message.text,message.kind).then(data=>respond({ok:data.hasAny&&!data.errors.length}))
    .catch(e=>respond({ok:false,error:String(e?.message||e)}));
  return true;
});
