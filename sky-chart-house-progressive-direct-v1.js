// House progressive disclosure v1: the ordinal House label is the first level;
// tapping it reveals the house referent directly. There is no duplicate spelled-out house-name level.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiHouseProgressiveDirectV1)return;
window.__relphiHouseProgressiveDirectV1=true;

let observer=null,observedList=null,queued=false;
let fastPointerTarget=null,fastPointerAt=0;

function modeLevel(){
  let mode=String(document.documentElement.dataset.relationshipDisplay||'');
  if(!mode){try{mode=localStorage.getItem('relphiSkyRelationshipDisplayV1')||'glyphs'}catch(_){mode='glyphs'}}
  return mode==='referents'?2:mode==='names'?1:0;
}
function houseToken(row,field){return row?.querySelector?.(`[data-inline-progressive-token="${field}"]`)||null}
function isHouseField(field){return field==='left-house'||field==='right-house'}
function applyToken(token){
  if(!(token instanceof HTMLElement))return;
  token.dataset.inlineHouseDirect='true';
  const level=modeLevel(),manual=token.dataset.inlineHouseManualOpen==='true',show=level>=2||manual;
  const name=token.querySelector(':scope > [data-inline-progressive-level="name"]');
  const referent=token.querySelector(':scope > [data-inline-progressive-level="referent"]');
  token.dataset.inlineProgressiveStage=show?'2':String(level>=1?1:0);
  token.hidden=!show;
  if(name){name.hidden=true;name.setAttribute('aria-hidden','true');name.tabIndex=-1}
  if(referent){referent.hidden=!show;referent.setAttribute('aria-hidden',show?'false':'true');referent.tabIndex=show?0:-1}
}
function reconcile(){
  queued=false;
  document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row.is-inline-expanded').forEach(row=>{
    ['left-house','right-house'].forEach(field=>applyToken(houseToken(row,field)));
  });
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(reconcile))}
function bind(){
  const list=document.getElementById('skyFoundationRelationshipList');
  if(list&&list!==observedList){
    observer?.disconnect();observedList=list;
    observer=new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length||record.removedNodes.length))schedule()});
    observer.observe(list,{childList:true,subtree:true});
  }
  schedule();
}
function targetInfo(target){
  if(!(target instanceof Element))return null;
  const marker=target.closest('.relphi-house-medallion[data-inline-progressive-glyph]');
  if(marker){
    const field=String(marker.dataset.inlineProgressiveGlyph||'');
    const row=marker.closest('.sky-foundation-relationship-row.is-inline-expanded');
    if(row&&isHouseField(field))return{row,field,marker,token:houseToken(row,field),kind:'base'};
  }
  const token=target.closest('[data-inline-progressive-token="left-house"],[data-inline-progressive-token="right-house"]');
  if(token){
    const row=token.closest('.sky-foundation-relationship-row.is-inline-expanded'),field=String(token.dataset.inlineProgressiveToken||'');
    if(row&&isHouseField(field))return{row,field,token,kind:'detail'};
  }
  return null;
}
function activate(info,event){
  if(!info?.token)return false;
  event?.preventDefault?.();event?.stopImmediatePropagation?.();
  const global=modeLevel();
  if(global<2){
    const open=info.token.dataset.inlineHouseManualOpen==='true';
    if(info.kind==='base')info.token.dataset.inlineHouseManualOpen=open?'false':'true';
    else info.token.dataset.inlineHouseManualOpen='false';
  }
  applyToken(info.token);
  return true;
}
function handlePointerUp(event){
  if(event.pointerType!=='touch'&&event.pointerType!=='pen')return;
  const info=targetInfo(event.target);if(!info||!activate(info,event))return;
  fastPointerTarget=event.target;fastPointerAt=performance.now();
}
function handleClick(event){
  const info=targetInfo(event.target);if(!info)return;
  if(fastPointerTarget&&performance.now()-fastPointerAt<800){
    const same=event.target===fastPointerTarget||fastPointerTarget.contains?.(event.target)||event.target.contains?.(fastPointerTarget);
    if(same){event.preventDefault();event.stopImmediatePropagation();fastPointerTarget=null;return}
  }
  activate(info,event);
}
function start(){
  bind();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:relationship-display-changed'].forEach(name=>window.addEventListener(name,bind));
}

// Window capture runs before the general progressive controller's document capture,
// regardless of script registration order, so the house remains a two-level chain.
window.addEventListener('pointerup',handlePointerUp,true);
window.addEventListener('click',handleClick,true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();