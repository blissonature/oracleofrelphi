importScripts('parser.js');
const SITE='https://raw.githack.com/blissonature/oracleofrelphi/4f71eed51169a2369c586342e251a3d48d90ae01/sky-chart.html';
const MENU_ROOT='relphi-sky-root',MENU_COMPARE='relphi-compare-two-dates';
function menus(){
  chrome.contextMenus.removeAll(()=>{
    chrome.contextMenus.create({id:MENU_ROOT,title:'Oracle of Relphi',contexts:['selection']});
    chrome.contextMenus.create({id:'relphi-open-selection',parentId:MENU_ROOT,title:'Open highlighted Where and When in Relphi',contexts:['selection']});
    chrome.contextMenus.create({id:'relphi-location',parentId:MENU_ROOT,title:'Use selection as a Relphi location',contexts:['selection']});
    chrome.contextMenus.create({id:'relphi-date',parentId:MENU_ROOT,title:'Use selection as a Relphi date',contexts:['selection']});
    chrome.contextMenus.create({id:MENU_COMPARE,parentId:MENU_ROOT,title:'Compare two dates',contexts:['selection']});
  });
}
chrome.runtime.onInstalled.addListener(menus);
chrome.runtime.onStartup.addListener(menus);
function openError(error){
  const url=chrome.runtime.getURL('error.html')+'?message='+encodeURIComponent(error.message||String(error));
  chrome.tabs.create({url});
}
chrome.contextMenus.onClicked.addListener((info)=>{
  const selected=(info.selectionText||'').trim();
  if(!selected)return;
  try{
    const url=new URL(SITE);
    if(info.menuItemId===MENU_COMPARE){
      const events=RelphiSelectionParser.parse(selected);
      url.searchParams.set('relphiCompare',JSON.stringify({version:1,events}));
    }else if(info.menuItemId==='relphi-open-selection'){
      const event=RelphiSelectionParser.parseSingle(selected);
      url.searchParams.set('relphiSingle',JSON.stringify({version:1,event}));
    }else if(info.menuItemId==='relphi-location'){
      url.searchParams.set('relphiDraft',JSON.stringify({version:1,kind:'location',value:selected}));
    }else if(info.menuItemId==='relphi-date'){
      const date=RelphiSelectionParser.parseDate(selected);
      url.searchParams.set('relphiDraft',JSON.stringify({version:1,kind:'date',value:date}));
    }else return;
    chrome.tabs.create({url:url.href});
  }catch(error){openError(error)}
});
chrome.action.onClicked.addListener(()=>chrome.tabs.create({url:SITE}));