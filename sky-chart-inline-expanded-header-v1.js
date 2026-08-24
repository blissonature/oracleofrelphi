// Expanded relationship header v2: keep the compact two-tier relationship grammar when the dual-card view opens.
// Only the relationship row that changed is normalized; expansion no longer rescans the whole list.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiInlineExpandedHeaderV2)return;
window.__relphiInlineExpandedHeaderV1=true;
window.__relphiInlineExpandedHeaderV2=true;
const STYLE_ID='skyInlineExpandedHeaderV2';
let observer=null,observedList=null,queued=false;const dirtyRows=new Set();

function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  document.getElementById('skyInlineExpandedHeaderV1')?.remove();
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
    #skyFoundationRelationshipList{
      overscroll-behavior-y:contain;
      -webkit-overflow-scrolling:touch;
      scroll-behavior:auto!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded{
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
      grid-template-areas:"left aspect right" "left orb right" "detail detail detail"!important;
      grid-template-rows:38px 18px auto!important;
      min-height:64px!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded>.inline-rel-detail{
      grid-area:detail!important;
      grid-column:1/-1!important;
      grid-row:3!important;
      min-width:0!important;
      width:100%!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-placement{
      display:grid!important;
      grid-template-rows:38px 18px!important;
      align-items:center!important;
      justify-items:center!important;
      align-self:stretch!important;
      width:100%!important;
      height:auto!important;
      min-width:0!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-symbol-pair{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
      max-width:100%!important;
      height:38px!important;
      min-width:0!important;
      gap:4px!important;
      white-space:nowrap!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-copy{
      display:grid!important;
      place-items:center!important;
      width:100%!important;
      height:18px!important;
      margin:0!important;
      overflow:visible!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-copy small{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
      height:18px!important;
      min-width:0!important;
      line-height:18px!important;
      white-space:nowrap!important;
      overflow:visible!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded>.sky-foundation-relationship-glyph--aspect{
      grid-area:aspect!important;
      align-self:center!important;
      justify-self:center!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded>.sky-foundation-relationship-orb{
      grid-area:orb!important;
      display:grid!important;
      place-items:center!important;
      align-self:center!important;
      justify-self:center!important;
      height:18px!important;
      min-width:40px!important;
      line-height:18px!important;
    }
    @media(max-width:620px){
      #skyFoundationRelationshipList:has(> .sky-foundation-relationship-row.is-inline-expanded){
        max-height:none!important;
      }
      .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-symbol-pair{gap:2px!important}
    }
  `;document.head.appendChild(style);
}
function normalizeSide(row,side){
  const group=row.querySelector(`:scope>.sky-foundation-relationship-placement--${side}`);if(!group)return;
  const pair=group.querySelector(':scope>.sky-foundation-relationship-symbol-pair');
  const copy=pair?.querySelector(':scope>.sky-foundation-relationship-copy');
  if(copy)group.appendChild(copy);
}
function normalizeAspect(row){
  const pair=row.querySelector(':scope>.sky-inline-expanded-aspect-pair');if(!pair)return;
  const glyph=pair.querySelector(':scope>.sky-foundation-relationship-glyph--aspect');
  const orb=pair.querySelector(':scope>.sky-foundation-relationship-orb');
  if(glyph)row.appendChild(glyph);if(orb)row.appendChild(orb);pair.remove();
}
function apply(row){
  if(!row?.matches?.('.sky-foundation-relationship-row'))return;
  normalizeSide(row,'left');normalizeSide(row,'right');normalizeAspect(row);
  if(row.classList.contains('is-inline-expanded'))row.dataset.inlineExpandedHeader='two-tier';
  else delete row.dataset.inlineExpandedHeader;
}
function flush(){queued=false;const rows=[...dirtyRows];dirtyRows.clear();rows.forEach(apply)}
function queue(row){if(row?.matches?.('.sky-foundation-relationship-row'))dirtyRows.add(row);if(queued)return;queued=true;queueMicrotask(flush)}
function expansionChanged(record){
  if(record.type!=='attributes'||record.attributeName!=='class')return false;
  const row=record.target?.closest?.('.sky-foundation-relationship-row');if(!row)return false;
  const was=String(record.oldValue||'').split(/\s+/).includes('is-inline-expanded');
  const now=row.classList.contains('is-inline-expanded');
  return was!==now;
}
function queueFromRecord(record){
  if(record.type==='attributes'){
    if(expansionChanged(record))queue(record.target.closest('.sky-foundation-relationship-row'));
    return;
  }
  const targetRow=record.target?.closest?.('.sky-foundation-relationship-row');if(targetRow)queue(targetRow);
  record.addedNodes.forEach(node=>{if(node.nodeType!==1)return;if(node.matches?.('.sky-foundation-relationship-row'))queue(node);node.querySelectorAll?.('.sky-foundation-relationship-row').forEach(queue)})
}
function ensureObserver(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;observer=new MutationObserver(records=>records.forEach(queueFromRecord));observer.observe(list,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});list.querySelectorAll('.sky-foundation-relationship-row').forEach(queue);
}
function start(){installStyle();ensureObserver();['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,ensureObserver));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
