// House medallion v1: one rainbow-wheel-derived house marker for compact relationship tiles
// and the expanded dual-card header. In expanded rows the same marker owns the house reveal chain.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseMedallionV1)return;
window.__relphiSkyHouseMedallionV1=true;

const STYLE_ID='skyHouseMedallionV1Styles';
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
let houseColors=[],observer=null,observedList=null,queued=false;

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .sky-foundation-relationship-copy small.relphi-house-coordinate{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:4px!important;
    }
    .relphi-house-medallion{
      --house-color:#777;
      display:inline-grid;
      place-items:center;
      flex:0 0 14px;
      width:14px;
      height:14px;
      box-sizing:border-box;
      padding:0!important;
      border:1.4px solid var(--house-color)!important;
      border-radius:50%!important;
      background:#fffdfa;
      background:color-mix(in srgb,var(--house-color) 18%,#fffdfa)!important;
      color:#2f2a26!important;
      font:900 .52rem/1 system-ui,sans-serif!important;
      font-variant-numeric:tabular-nums;
      text-align:center;
      vertical-align:middle;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.48);
    }
    .relphi-house-medallion[data-house="10"],
    .relphi-house-medallion[data-house="11"],
    .relphi-house-medallion[data-house="12"]{font-size:.44rem!important;letter-spacing:-.035em}
    .sky-foundation-relationship-row.is-inline-expanded .relphi-house-medallion{
      flex-basis:16px;
      width:16px;
      height:16px;
      cursor:pointer;
    }
    .sky-foundation-relationship-row.is-inline-expanded .relphi-house-medallion:hover{
      background:color-mix(in srgb,var(--house-color) 28%,#fffdfa)!important;
    }
    @media(max-width:620px){
      .sky-foundation-relationship-copy small.relphi-house-coordinate{gap:3px!important}
    }
  `;
  document.head.appendChild(style);
}

function readRainbowPalette(){
  const layers=['a-houses','b-houses'];
  for(const layerName of layers){
    const paths=[...document.querySelectorAll(`[data-layer="${layerName}"] > path`)];
    if(paths.length>=12){
      const colors=paths.slice(0,12).map(path=>path.getAttribute('fill')||getComputedStyle(path).fill).filter(Boolean);
      if(colors.length===12)return colors;
    }
  }
  return houseColors;
}
function refreshPalette(){const next=readRainbowPalette();if(next.length===12)houseColors=next}
function rowHouse(row,side){const value=Number(row.dataset[side==='left'?'leftHouse':'rightHouse']);return Number.isFinite(value)&&value>=1&&value<=12?value:0}
function coordinateText(small){
  const stored=String(small?.dataset?.relationshipCoordinate||'').trim();
  if(stored)return stored;
  const match=String(small?.textContent||'').match(/\d{1,2}°\d{2}′/);
  return match?.[0]||String(small?.textContent||'').split('·')[0].trim();
}
function sideSmall(row,side){return row.querySelector(`.sky-foundation-relationship-placement--${side} .sky-foundation-relationship-copy small`)}
function medallionFor(small,field){
  return small.querySelector('.relphi-house-medallion')||small.querySelector(`[data-inline-progressive-glyph="${field}"]`)||small.querySelector('.inline-rel-house-trigger');
}
function decorateSide(row,side){
  const small=sideSmall(row,side),house=rowHouse(row,side);if(!small||!house)return;
  const field=`${side}-house`,expanded=row.classList.contains('is-inline-expanded'),coordinate=coordinateText(small);
  let medallion=medallionFor(small,field);
  if(!medallion)medallion=document.createElement('span');
  medallion.classList.add('relphi-house-medallion');
  medallion.dataset.house=String(house);
  medallion.textContent=String(house);
  medallion.style.setProperty('--house-color',houseColors[house-1]||'#777');
  medallion.setAttribute('aria-label',HOUSE_NAMES[house]);
  medallion.dataset.houseColorSource=houseColors[house-1]?'rainbow-wheel':'pending-rainbow-wheel';
  if(expanded){
    medallion.classList.add('inline-rel-house-trigger');
    medallion.dataset.inlineProgressiveGlyph=field;
    medallion.setAttribute('title',`Reveal ${HOUSE_NAMES[house]}`);
  }else{
    medallion.classList.remove('inline-rel-house-trigger');
    delete medallion.dataset.inlineProgressiveGlyph;
    medallion.setAttribute('title',HOUSE_NAMES[house]);
  }
  small.dataset.relationshipCoordinate=coordinate;
  small.classList.add('relphi-house-coordinate');
  const correctStructure=small.childNodes.length===2&&small.firstChild?.nodeType===Node.TEXT_NODE&&small.firstChild.textContent===coordinate&&small.lastChild===medallion;
  if(!correctStructure)small.replaceChildren(document.createTextNode(coordinate),medallion);
}
function decorateRow(row){if(!(row instanceof HTMLElement))return;decorateSide(row,'left');decorateSide(row,'right')}
function reconcile(){queued=false;refreshPalette();document.querySelectorAll('.sky-foundation-relationship-row').forEach(decorateRow)}
function schedule(){if(queued)return;queued=true;queueMicrotask(reconcile)}
function ensureObserver(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;
  observer=new MutationObserver(schedule);
  observer.observe(list,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  schedule();
}
function start(){
  installStyles();ensureObserver();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed'].forEach(name=>window.addEventListener(name,()=>{refreshPalette();ensureObserver();schedule()}));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
