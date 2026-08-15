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
function injectPreviewBase(html){
  const base=`<base href="${previewAssetBase()}">`;
  const marker='<script>window.__relphiTarotPreviewDocument=true;<\/script>';
  if(/<head[^>]*>/i.test(html))return html.replace(/<head([^>]*)>/i,`<head$1>${base}${marker}`);
  return base+marker+html;
}
function showTarotPreviewFailure(error){
  window.__relphiTarotPreviewPending=false;
  document.documentElement.style.visibility='';
  const render=()=>{
    document.body.innerHTML='<main style="max-width:42rem;margin:12vh auto;padding:1.25rem;font:16px/1.45 system-ui,sans-serif"><h1>Tarot Ledger preview could not open.</h1><p id="relphiTarotPreviewError"></p></main>';
    const note=document.getElementById('relphiTarotPreviewError');
    if(note)note.textContent=error?.message||String(error||'Unknown preview error');
  };
  if(document.body)render();else document.addEventListener('DOMContentLoaded',render,{once:true});
}
async function openExactTarotPreview(){
  window.__relphiTarotPreviewPending=true;
  document.documentElement.style.visibility='hidden';
  try{
    const response=await fetch(previewAssetBase()+'tarot.html',{cache:'no-store'});
    if(!response.ok)throw new Error(`Exact Tarot Ledger revision returned ${response.status}.`);
    const html=injectPreviewBase(await response.text());
    document.open();
    document.write(html);
    document.close();
  }catch(error){
    showTarotPreviewFailure(error);
  }
}

if(tarotPreviewRequested){
  openExactTarotPreview();
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
  const url=new URL(location.href);
  url.search='';
  url.hash='';
  url.searchParams.set('ref',previewRef);
  url.searchParams.set('view','tarot');
  url.searchParams.set('card',cardId);
  return url.toString();
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