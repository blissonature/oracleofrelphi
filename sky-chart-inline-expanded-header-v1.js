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
      position:relative!important;
      min-width:0!important;
      width:100%!important;
      box-sizing:border-box!important;
      padding-top:8px!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .inline-rel-tile-copy{
      appearance:none;
      position:absolute;
      top:-34px;
      right:4px;
      z-index:5;
      min-height:28px;
      padding:0 10px;
      border:1px solid rgba(31,27,24,.16);
      border-radius:999px;
      background:#fff;
      color:#3f3934;
      box-shadow:0 1px 3px rgba(31,27,24,.06);
      font:850 .63rem/1 system-ui,sans-serif;
      cursor:pointer;
    }
    .sky-foundation-relationship-row.is-inline-expanded .inline-rel-tile-copy:hover,
    .sky-foundation-relationship-row.is-inline-expanded .inline-rel-tile-copy:focus-visible{
      border-color:#6b625a;
      background:#fffdfa;
      outline:none;
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
    /* The aspect's referent and its transit timing share one progressive
       text field. Do not reserve a separate timing row above the strip. */
    .sky-foundation-relationship-row.is-inline-expanded
      [data-inline-progressive-token="aspect"]>[data-inline-relationship-timing]{
      display:block!important;position:static!important;grid-area:auto!important;
      width:100%!important;min-width:0!important;margin:4px 0 0!important;
      padding:4px 0 0!important;border-top:1px solid rgba(53,47,42,.14)!important;
      pointer-events:none!important;cursor:default!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded
      [data-inline-progressive-token="aspect"] .inline-rel-transit-window{
      display:grid!important;gap:2px!important;width:100%!important;
      min-width:0!important;padding:0!important;margin:0!important;
      border:0!important;background:transparent!important;
      font-size:.49rem!important;line-height:1.24!important;
      text-align:left!important;white-space:normal!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded
      [data-inline-progressive-token="aspect"] .inline-rel-transit-row{
      display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;
      gap:2px 4px!important;align-items:start!important;text-align:left!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded
      [data-inline-progressive-token="aspect"] .inline-rel-transit-row>span{
      overflow-wrap:anywhere!important;
    }
    /* The expanded card, its aspect referent and the isolated relationship
       should be readable together without consuming a full scrolling pane. */
    .sky-foundation-relationship-row.is-inline-expanded .inline-rel-detail{
      row-gap:5px!important;
      padding-bottom:5px!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .inline-rel-visual{
      grid-template-columns:minmax(54px,70px) minmax(100px,1fr) minmax(54px,70px)!important;
      gap:7px!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .inline-rel-wheel-stage{
      width:min(100%,112px)!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .inline-rel-card-art{
      max-width:62px!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .inline-rel-progressive-strip{
      gap:5px!important;
    }
    .sky-foundation-relationship-glyph[data-sky-rx="true"]{position:relative}
    .sky-foundation-relationship-glyph[data-sky-rx-owner="A"]{color:#c9211e}
    .sky-foundation-relationship-glyph[data-sky-rx-owner="B"]{color:#2462d0}
    .sky-foundation-relationship-glyph>.sky-rx-glyph-overlay{
      position:absolute;right:-3px;bottom:0px;width:20px;height:20px;
      display:block;pointer-events:none;background-color:currentColor;
      -webkit-mask:url("${window.RelphiGlyphRegistry?.get?.('retrograde')?.asset||'none'}") center/contain no-repeat;
      mask:url("${window.RelphiGlyphRegistry?.get?.('retrograde')?.asset||'none'}") center/contain no-repeat;
    }

    @media(max-width:620px){
      #skyFoundationRelationshipList:has(> .sky-foundation-relationship-row.is-inline-expanded){
        max-height:none!important;
      }
      /* Keep Copy on its own row above the expanded art, clear of Sky B's medallion. */
      .sky-foundation-relationship-row.is-inline-expanded>.inline-rel-detail{
        padding-top:45px!important;
      }
      .sky-foundation-relationship-row.is-inline-expanded .inline-rel-tile-copy{
        top:7px!important;right:8px!important;
        min-height:30px!important;
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
function normalizeTiming(row){
  if(!row.classList.contains('is-inline-expanded'))return;
  const detail=row.querySelector(':scope>.inline-rel-detail');
  const aspect=detail?.querySelector('.inline-rel-progressive-strip [data-inline-progressive-token="aspect"]');
  const slot=row.querySelector(':scope>[data-inline-relationship-timing]')||
    detail?.querySelector('[data-inline-relationship-timing]');
  if(slot&&aspect&&slot.parentElement!==aspect)aspect.appendChild(slot);
}
function markRetrograde(row){
  for(const side of ['left','right']){
    const sky=String(row.dataset[side+'Sky']||'').toUpperCase();
    const placement=row.dataset[side+'Placement'];
    const host=row.querySelector(':scope>.sky-foundation-relationship-placement--'+side);
    const glyph=host?.querySelector('.sky-foundation-relationship-glyph--'+side);
    if(!glyph)continue;
    const isRx=!!(sky&&placement&&window.RelphiSkyRetrograde?.forPlacement?.(sky,placement));
    const overlay=glyph.querySelector(':scope>.sky-rx-glyph-overlay');
    if(isRx){
      glyph.dataset.skyRx='true';
      glyph.dataset.skyRxOwner=sky;
      if(!overlay){
        const mark=document.createElement('span');mark.className='sky-rx-glyph-overlay';
        mark.setAttribute('role','img');
        mark.setAttribute('aria-label','Retrograde');
        glyph.appendChild(mark);
      }
    }else{delete glyph.dataset.skyRx;delete glyph.dataset.skyRxOwner;overlay?.remove()}
  }
}
function apply(row){
  if(!row?.matches?.('.sky-foundation-relationship-row'))return;
  normalizeSide(row,'left');normalizeSide(row,'right');normalizeAspect(row);normalizeTiming(row);markRetrograde(row);
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
