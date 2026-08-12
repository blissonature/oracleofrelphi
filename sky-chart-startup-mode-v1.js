// Resolve the last Sky Chart working mode before first paint.
(function(){
'use strict';
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

// Stored Sky B data is not itself permission to enter comparison mode.
Storage.prototype.getItem=function(key){
  if(this===localStorage&&key===SKY_B_KEY&&readMode()!=='comparison'&&html.dataset.skyBEditing!=='true')return null;
  return nativeGetItem.call(this,key);
};

// Fail closed into the ordinary single-sky view before the body can paint.
syncRoot();

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
