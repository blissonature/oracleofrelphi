// Expanded relationship header v1: preserve the original two-tier compact tiles,
// but make only the open dual-card relationship header a single-line symbolic sentence.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiInlineExpandedHeaderV1)return;
window.__relphiInlineExpandedHeaderV1=true;
const STYLE_ID='skyInlineExpandedHeaderV1';
let observer=null,observedList=null,queued=false;

function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
    .sky-foundation-relationship-row.is-inline-expanded{
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
      grid-template-areas:"left aspect right" "detail detail detail"!important;
      grid-template-rows:38px auto!important;
      min-height:46px!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-placement{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      align-self:center!important;
      width:100%!important;
      height:38px!important;
      min-width:0!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-symbol-pair{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:auto!important;
      max-width:100%!important;
      height:38px!important;
      min-width:0!important;
      gap:4px!important;
      white-space:nowrap;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-copy{
      display:inline-grid!important;
      place-items:center!important;
      flex:0 0 auto!important;
      width:auto!important;
      height:38px!important;
      margin:0!important;
      overflow:visible!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-copy small{
      display:inline-flex!important;
      align-items:center!important;
      width:auto!important;
      height:auto!important;
      min-width:0!important;
      white-space:nowrap!important;
    }
    .sky-inline-expanded-aspect-pair{
      grid-area:aspect;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:4px;
      min-width:0;
      height:38px;
      white-space:nowrap;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-inline-expanded-aspect-pair .sky-foundation-relationship-glyph--aspect,
    .sky-foundation-relationship-row.is-inline-expanded .sky-inline-expanded-aspect-pair .sky-foundation-relationship-orb{
      grid-area:auto!important;
      align-self:center!important;
      justify-self:auto!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-inline-expanded-aspect-pair .sky-foundation-relationship-orb{min-width:0!important}
    @media(max-width:620px){
      .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-symbol-pair,
      .sky-inline-expanded-aspect-pair{gap:2px!important}
    }
  `;document.head.appendChild(style);
}
function moveSideInline(row,side){
  const group=row.querySelector(`:scope>.sky-foundation-relationship-placement--${side}`);if(!group)return;
  const pair=group.querySelector(':scope>.sky-foundation-relationship-symbol-pair');
  const copy=group.querySelector(':scope>.sky-foundation-relationship-copy')||pair?.querySelector(':scope>.sky-foundation-relationship-copy');
  if(pair&&copy&&copy.parentElement!==pair)pair.appendChild(copy);
}
function moveAspectInline(row){
  let pair=row.querySelector(':scope>.sky-inline-expanded-aspect-pair');
  const glyph=row.querySelector(':scope>.sky-foundation-relationship-glyph--aspect, :scope>.sky-inline-expanded-aspect-pair>.sky-foundation-relationship-glyph--aspect');
  const orb=row.querySelector(':scope>.sky-foundation-relationship-orb, :scope>.sky-inline-expanded-aspect-pair>.sky-foundation-relationship-orb');
  if(!glyph||!orb)return;
  if(!pair){pair=document.createElement('span');pair.className='sky-inline-expanded-aspect-pair';row.appendChild(pair)}
  if(glyph.parentElement!==pair)pair.appendChild(glyph);
  if(orb.parentElement!==pair)pair.appendChild(orb);
}
function apply(row){
  if(!row.classList.contains('is-inline-expanded'))return restore(row);
  moveSideInline(row,'left');moveSideInline(row,'right');moveAspectInline(row);row.dataset.inlineExpandedHeader='true';
}
function restoreSide(row,side){
  const group=row.querySelector(`:scope>.sky-foundation-relationship-placement--${side}`);if(!group)return;
  const pair=group.querySelector(':scope>.sky-foundation-relationship-symbol-pair');const copy=pair?.querySelector(':scope>.sky-foundation-relationship-copy');
  if(copy)group.appendChild(copy);
}
function restore(row){
  if(row.dataset.inlineExpandedHeader!=='true'&&!row.querySelector(':scope>.sky-inline-expanded-aspect-pair'))return;
  restoreSide(row,'left');restoreSide(row,'right');
  const pair=row.querySelector(':scope>.sky-inline-expanded-aspect-pair');if(pair){const glyph=pair.querySelector(':scope>.sky-foundation-relationship-glyph--aspect'),orb=pair.querySelector(':scope>.sky-foundation-relationship-orb');if(glyph)row.appendChild(glyph);if(orb)row.appendChild(orb);pair.remove()}
  delete row.dataset.inlineExpandedHeader;
}
function reconcile(){queued=false;document.querySelectorAll('.sky-foundation-relationship-row').forEach(apply)}
function schedule(){if(queued)return;queued=true;queueMicrotask(reconcile)}
function ensureObserver(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;observer=new MutationObserver(schedule);observer.observe(list,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});schedule();
}
function start(){installStyle();ensureObserver();['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed'].forEach(name=>window.addEventListener(name,()=>{ensureObserver();schedule()}));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
