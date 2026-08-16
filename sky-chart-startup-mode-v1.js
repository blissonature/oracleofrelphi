// Resolve exact-preview routes and the last Sky Chart working mode before first paint.
(function(){
'use strict';

const params=new URLSearchParams(location.search);
const previewRef=String(params.get('ref')||'').trim();
const previewPath=/(^|\/)sky-chart-preview\/sky-chart\.html$/.test(location.pathname);
const exactPreview=/^[0-9a-f]{40}$/i.test(previewRef);
const tarotPreviewRequested=previewPath&&exactPreview&&params.get('view')==='tarot';

function previewAssetBase(){
  return `https://cdn.jsdelivr.net/gh/blissonature/oracleofrelphi@${previewRef}/`;
}
function exactTarotPreviewUrl(cardId){
  const url=new URL('tarot.html',previewAssetBase());
  const id=String(cardId||'').trim();
  if(id)url.searchParams.set('card',id);
  return url.toString();
}

// Do not transplant Tarot Ledger into the Sky Chart preview document. That left
// the Ledger running inside the wrong document lifecycle and pathname. Navigate
// to the exact revision as its own real tarot.html document instead.
if(tarotPreviewRequested){
  location.replace(exactTarotPreviewUrl(params.get('card')));
  return;
}

if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyStartupModeV1)return;
window.__relphiSkyStartupModeV1=true;

const MODE_KEY='relphiSkyChartLastModeV1';
const SKY_B_KEY='relphiSkyChartB';
const html=document.documentElement;
const nativeGetItem=Storage.prototype.getItem;
const nativeSetItem=Storage.prototype.setItem;

function rawGet(key){
  try{return nativeGetItem.call(localStorage,key)}catch(_){return null}
}
function readMode(){
  return rawGet(MODE_KEY)==='comparison'?'comparison':'single';
}
function writeMode(mode){
  const next=mode==='comparison'?'comparison':'single';
  try{nativeSetItem.call(localStorage,MODE_KEY,next)}catch(_){}
  html.dataset.skyLastMode=next;
  return next;
}
function hasStoredSkyB(){
  return !!rawGet(SKY_B_KEY);
}
function syncRoot(){
  let mode=readMode();
  if(mode==='comparison'&&!hasStoredSkyB()&&html.dataset.skyBEditing!=='true')mode=writeMode('single');
  else html.dataset.skyLastMode=mode;
  html.dataset.skyBPresent=mode==='comparison'&&hasStoredSkyB()?'true':'false';
}
function previewTarotHref(cardId){
  return exactTarotPreviewUrl(cardId);
}
function rewritePreviewTarotLinks(root){
  if(!previewPath||!exactPreview)return;
  const links=[];
  if(root?.matches?.('[data-inline-ledger]'))links.push(root);
  root?.querySelectorAll?.('[data-inline-ledger]')?.forEach(link=>links.push(link));
  links.forEach(link=>{
    const cardId=String(link.dataset.inlineLedger||'').trim();
    if(!cardId)return;
    link.href=previewTarotHref(cardId);
  });
}

// Stored Sky B data is not itself permission to enter comparison mode.
Storage.prototype.getItem=function(key){
  if(this===localStorage&&key===SKY_B_KEY&&readMode()!=='comparison'&&html.dataset.skyBEditing!=='true')return null;
  return nativeGetItem.call(this,key);
};

// Fail closed into the ordinary single-sky view before the body can paint.
syncRoot();

if(previewPath&&exactPreview){
  new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===1)rewritePreviewTarotLinks(node);
    }));
  }).observe(html,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>rewritePreviewTarotLinks(document),{once:true});
}

document.addEventListener('click',event=>{
  const target=event.target?.closest?.('[data-add-sky-b],[data-remove-sky-b]');
  if(!target)return;
  if(target.matches('[data-add-sky-b]'))writeMode('comparison');
  if(target.matches('[data-remove-sky-b]'))writeMode('single');
  syncRoot();
},true);

window.addEventListener('storage',event=>{
  if(event.storageArea&&event.storageArea!==localStorage)return;
  if(event.key===SKY_B_KEY&&!hasStoredSkyB())writeMode('single');
  if(event.key===SKY_B_KEY||event.key===MODE_KEY)syncRoot();
});

new MutationObserver(records=>{
  if(records.some(record=>record.attributeName==='data-sky-b-editing'))syncRoot();
}).observe(html,{attributes:true,attributeFilter:['data-sky-b-editing']});
})();