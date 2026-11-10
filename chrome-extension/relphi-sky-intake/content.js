// Opt-in, independent date/address links. Existing links and editable page content are not modified.
(function(){
'use strict';
if(location.hostname==='oracleofrelphi.com'||location.hostname.endsWith('.oracleofrelphi.com'))return;
const recognizer=globalThis.RelphiSkyRecognizer,defaults={linkDates:false,linkAddresses:false,dateOrder:'unambiguous'};
const selector='[data-relphi-sky-link]';
const excluded='a,button,input,textarea,select,option,script,style,noscript,code,pre,svg,math,[contenteditable],[role="button"],[role="link"],[data-relphi-sky-link]';
let prefs=defaults,observer=null,queued=false,style=null;
function eligible(node){const p=node?.parentElement;return!!(p&&p.isConnected&&node.nodeValue?.trim()&&!p.closest(excluded)&&!p.closest('[aria-hidden="true"]'))}
function annotate(node){
  if(!eligible(node)||node.nodeValue.length>2000)return 0;
  const text=node.nodeValue,hits=recognizer.links(text,prefs).slice(0,30);if(!hits.length)return 0;
  const fragment=document.createDocumentFragment();let offset=0;
  for(const hit of hits){
    if(hit.start>offset)fragment.appendChild(document.createTextNode(text.slice(offset,hit.start)));
    const span=document.createElement('span');span.textContent=text.slice(hit.start,hit.end);span.dataset.relphiSkyLink=hit.kind;span.tabIndex=0;span.setAttribute('role','link');
    span.setAttribute('aria-label','Open '+hit.kind+' in Oracle of Relphi Sky Chart: '+hit.value);span.title='Open '+hit.kind+' in Sky Chart';
    fragment.appendChild(span);offset=hit.end;
  }
  if(offset<text.length)fragment.appendChild(document.createTextNode(text.slice(offset)));
  node.replaceWith(fragment);return hits.length;
}
function scan(){
  queued=false;if(!prefs.linkDates&&!prefs.linkAddresses)return;
  const root=document.body||document.documentElement,walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let scanned=0;
  while(walk.nextNode()&&scanned++<8000)if(eligible(walk.currentNode))nodes.push(walk.currentNode);
  observer?.disconnect();let links=0;
  for(const node of nodes){if(links>=400)break;links+=annotate(node)}
  observer?.observe(root,{childList:true,subtree:true});
}
function schedule(){if(queued)return;queued=true;setTimeout(scan,150)}
function clear(){observer?.disconnect();document.querySelectorAll(selector).forEach(node=>node.replaceWith(document.createTextNode(node.textContent||'')))}
function setPreferences(next){
  const updated={linkDates:!!next.linkDates,linkAddresses:!!next.linkAddresses,dateOrder:next.dateOrder||'unambiguous'};
  if(JSON.stringify(prefs)===JSON.stringify(updated))return;
  clear();prefs=updated;
  if(!style&&(prefs.linkDates||prefs.linkAddresses)){
    style=document.createElement('style');
    style.textContent='[data-relphi-sky-link]{cursor:pointer;text-decoration:underline dotted;text-underline-offset:.18em;text-decoration-color:#99564a}[data-relphi-sky-link]:hover,[data-relphi-sky-link]:focus-visible{background:rgba(167,89,72,.13);outline:1px solid #99564a;outline-offset:2px}';
    (document.head||document.documentElement).appendChild(style);
  }
  if(style&&!(prefs.linkDates||prefs.linkAddresses)){style.remove();style=null}
  schedule();
}
observer=new MutationObserver(records=>{
  if(records.some(r=>[...r.addedNodes].some(n=>(n.nodeType===1||n.nodeType===3)&&!n.closest?.(selector)&&!n.matches?.(selector))))schedule();
});
chrome.storage.local.get(defaults,setPreferences);
chrome.storage.onChanged.addListener((changes,area)=>{
  if(area==='local'&&['linkDates','linkAddresses','dateOrder'].some(k=>changes[k]))chrome.storage.local.get(defaults,setPreferences);
});
document.addEventListener('click',event=>{
  const node=event.target.closest?.(selector);if(!node)return;
  event.preventDefault();event.stopPropagation();
  chrome.runtime.sendMessage({action:'openCandidate',kind:node.dataset.relphiSkyLink,text:node.textContent});
},true);
document.addEventListener('keydown',event=>{
  if(!['Enter',' '].includes(event.key))return;
  const node=event.target.closest?.(selector);if(!node)return;
  event.preventDefault();event.stopPropagation();
  chrome.runtime.sendMessage({action:'openCandidate',kind:node.dataset.relphiSkyLink,text:node.textContent});
},true);
})();
