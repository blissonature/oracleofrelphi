// Resolve exact-preview routes and the last Sky Chart working mode before first paint.
(function(){
'use strict';

const params=new URLSearchParams(location.search);
const previewRef=String(params.get('ref')||'').trim();
const previewPath=/(^|\/)sky-chart-preview\/sky-chart\.html$/.test(location.pathname);
const exactPreview=/^[0-9a-f]{40}$/i.test(previewRef);
const tarotPreviewRequested=previewPath&&exactPreview&&params.get('view')==='tarot';
let tarotPreviewHtmlPromise=null;
let tarotPreviewOpening=false;
let tarotWarmStarted=false;

function previewAssetBase(){
  return `https://cdn.jsdelivr.net/gh/blissonature/oracleofrelphi@${previewRef}/`;
}
function loadExactTarotHtml(){
  if(tarotPreviewHtmlPromise)return tarotPreviewHtmlPromise;
  tarotPreviewHtmlPromise=fetch(previewAssetBase()+'tarot.html',{cache:'force-cache'}).then(response=>{
    if(!response.ok)throw new Error(`Exact Tarot Ledger revision returned ${response.status}.`);
    return response.text();
  });
  return tarotPreviewHtmlPromise;
}
function warmExactTarotPreview(){
  if(!previewPath||!exactPreview)return;
  loadExactTarotHtml().catch(()=>{});
  if(tarotWarmStarted)return;
  tarotWarmStarted=true;
  [
    'style.css?v=346',
    'navloader.js?v=56',
    'tarot-cards.js',
    'relphi-locked-interpretations.js?v=207',
    'relphi-card-senses.js?v=321',
    'relphi-rising-sign-house-offset-effects.js?v=219',
    'vendor/astronomy-engine/astronomy.browser.min.js',
    'relphi-house-systems.js?v=317',
    'tarot-app.js?v=366'
  ].forEach(path=>{
    const href=new URL(path,previewAssetBase()).href;
    if(document.querySelector(`link[data-relphi-tarot-warm="${CSS.escape(href)}"]`))return;
    const link=document.createElement('link');
    link.rel='prefetch';
    link.href=href;
    link.dataset.relphiTarotWarm=href;
    document.head.appendChild(link);
  });
}
function requestedPreviewCardId(){
  return String(new URLSearchParams(location.search).get('card')||'').trim();
}
function previewCardBridgeScript(){
  return '<script>(function(){\'use strict\';var cardId=String(window.__relphiTarotRequestedCard||new URLSearchParams(location.search).get(\'card\')||\'\').trim();if(!cardId)return;function esc(value){if(window.CSS&&CSS.escape)return CSS.escape(value);return String(value).replace(/["\\\\]/g,\'\\\\$&\')}function alignList(){var browse=document.getElementById(\'browsePanel\'),list=document.getElementById(\'cardList\');if(!browse||!list)return;var target=list.querySelector(\'.or-card[data-id="\'+esc(cardId)+\'"]\')||list.querySelector(\'[data-card-id="\'+esc(cardId)+\'"]\');if(!target)return;var scroller=null;for(var node=target.parentElement;node&&browse.contains(node);node=node.parentElement){var style=getComputedStyle(node),overflow=style.overflowY;if((overflow===\'auto\'||overflow===\'scroll\')&&node.scrollHeight>node.clientHeight+1){scroller=node;break}if(node===browse)break}if(!scroller){var panel=browse.querySelector(\'.tarot-list-panel\');if(panel&&panel.scrollHeight>panel.clientHeight+1)scroller=panel}if(scroller){var nr=target.getBoundingClientRect(),sr=scroller.getBoundingClientRect(),top=scroller.scrollTop+(nr.top-sr.top)-(scroller.clientHeight-nr.height)/2;scroller.scrollTop=Math.max(0,Math.min(Math.max(0,scroller.scrollHeight-scroller.clientHeight),top))}}function finish(){var detail=document.getElementById(\'cardDetail\'),browse=document.getElementById(\'browsePanel\');var ready=!!(browse&&!browse.hidden&&detail&&detail.textContent.trim());if(!ready&&window.RelphiTarotLedger&&window.RelphiTarotLedger.openFullEntry)window.RelphiTarotLedger.openFullEntry(cardId,\'ledger\');requestAnimationFrame(function(){requestAnimationFrame(function(){alignList();detail=document.getElementById(\'cardDetail\');if(detail&&detail.textContent.trim()){var top=Math.max(0,detail.getBoundingClientRect().top+window.scrollY-12);window.scrollTo({top:top,behavior:\'auto\'})}if(window.__relphiPreviewOriginalScrollIntoView){Element.prototype.scrollIntoView=window.__relphiPreviewOriginalScrollIntoView;delete window.__relphiPreviewOriginalScrollIntoView}document.getElementById(\'relphi-exact-tarot-gate\')?.remove();document.documentElement.style.visibility=\'visible\'})})}if(document.readyState===\'loading\')document.addEventListener(\'DOMContentLoaded\',finish,{once:true});else finish()})();<\/script>';
}
function injectPreviewBase(html){
  const cardId=requestedPreviewCardId();
  const safeCard=JSON.stringify(cardId).replace(/</g,'\\u003c');
  const base=`<base href="${previewAssetBase()}">`;
  const gate='<style id="relphi-exact-tarot-gate">html{visibility:hidden!important}</style>';
  const marker=`<script>window.__relphiTarotPreviewDocument=true;window.__relphiTarotPreviewPending=false;window.__relphiTarotRequestedCard=${safeCard};window.__relphiPreviewOriginalScrollIntoView=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(arg){if(window.__relphiTarotRequestedCard&&arg&&typeof arg==='object')arg=Object.assign({},arg,{behavior:'auto'});return window.__relphiPreviewOriginalScrollIntoView.call(this,arg)};<\/script>`;
  const bridge=previewCardBridgeScript();
  let out=/<head[^>]*>/i.test(html)?html.replace(/<head([^>]*)>/i,`<head$1>${base}${gate}${marker}`):base+gate+marker+html;
  if(/<\/body>/i.test(out))out=out.replace(/<\/body>/i,`${bridge}</body>`);
  else out+=bridge;
  return out;
}
function showTarotPreviewFailure(error){
  tarotPreviewOpening=false;
  window.__relphiTarotPreviewPending=false;
  const message=String(error?.message||error||'Unknown preview error');
  document.open();
  document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tarot Ledger preview unavailable</title></head><body><main style="max-width:42rem;margin:12vh auto;padding:1.25rem;font:16px/1.45 system-ui,sans-serif"><h1>Tarot Ledger preview could not open.</h1><p></p></main></body></html>`);
  document.close();
  const note=document.querySelector('main p');
  if(note)note.textContent=message;
}
function replaceWithExactTarot(html){
  document.open();
  document.write(injectPreviewBase(html));
  document.close();
}
function openExactTarotPreview(options={}){
  if(tarotPreviewOpening)return;
  tarotPreviewOpening=true;
  window.__relphiTarotPreviewPending=true;
  const showLoading=options.showLoading===true;
  if(showLoading){
    document.open();
    document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening Tarot Ledger…</title></head><body><main style="max-width:42rem;margin:12vh auto;padding:1.25rem;font:16px/1.45 system-ui,sans-serif">Opening Tarot Ledger…</main></body></html>');
    document.close();
  }
  loadExactTarotHtml().then(replaceWithExactTarot).catch(showTarotPreviewFailure);
}

// A directly opened exact Tarot preview has no live Sky Chart to preserve.
if(tarotPreviewRequested){
  openExactTarotPreview({showLoading:true});
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
  url.searchParams.set('card',String(cardId||'').trim());
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
function read(key){
  if(key===SKY_B_KEY&&readMode()!=='comparison'&&html.dataset.skyBEditing!=='true')return null;
  return rawGet(key);
}
window.RelphiSkyStartupMode=Object.freeze({read,readMode,writeMode,syncRoot});

// Fail closed into the ordinary single-sky view before the body can paint.
syncRoot();

if(previewPath&&exactPreview)document.addEventListener('DOMContentLoaded',()=>rewritePreviewTarotLinks(document),{once:true});

// Warm the exact Tarot document and its heavy first-paint dependencies as soon
// as the user shows intent to open one of the inline cards.
document.addEventListener('pointerover',event=>{
  if(!previewPath||!exactPreview)return;
  if(event.target?.closest?.('[data-inline-ledger]'))warmExactTarotPreview();
},true);
document.addEventListener('focusin',event=>{
  if(!previewPath||!exactPreview)return;
  if(event.target?.closest?.('[data-inline-ledger]'))warmExactTarotPreview();
},true);

// Exact-preview card clicks stay in this document lifecycle. Keep the current
// Sky visible while Tarot Ledger prepares, update the address without reloading,
// and replace the document only once the exact Tarot HTML is ready.
document.addEventListener('click',event=>{
  if(!previewPath||!exactPreview)return;
  const link=event.target?.closest?.('[data-inline-ledger]');
  if(!link)return;
  const cardId=String(link.dataset.inlineLedger||'').trim();
  if(!cardId)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const next=previewTarotHref(cardId);
  warmExactTarotPreview();
  history.pushState({relphiView:'tarot',cardId},'',next);
  openExactTarotPreview({showLoading:false});
},true);

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

})();
