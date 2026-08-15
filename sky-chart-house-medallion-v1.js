// House medallion v2: one rainbow-wheel-derived house marker for compact relationship tiles
// and the expanded dual-card header, without observing descendant DOM mutations.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseMedallionV2)return;
window.__relphiSkyHouseMedallionV2=true;
window.__relphiSkyHouseMedallionV1=true;

const STYLE_ID='skyHouseMedallionV2Styles';
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
const FALLBACK_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
let houseColors=FALLBACK_COLORS.slice(),observer=null,observedList=null;

function installStyles(){
  document.getElementById('skyHouseMedallionV1Styles')?.remove();
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
    @media(max-width:620px){.sky-foundation-relationship-copy small.relphi-house-coordinate{gap:3px!important}}
  `;
  document.head.appendChild(style);
}

function readRainbowPalette(){
  for(const layerName of ['a-houses','b-houses']){
    const paths=[...document.querySelectorAll(`[data-layer="${layerName}"] > path`)];
    if(paths.length<12)continue;
    const colors=paths.slice(0,12).map(path=>path.getAttribute('fill')||'').filter(Boolean);
    if(colors.length===12)return colors;
  }
  return null;
}
function refreshPalette(){const colors=readRainbowPalette();if(colors)houseColors=colors}
function rowHouse(row,side){const value=Number(row.dataset[side==='left'?'leftHouse':'rightHouse']);return Number.isFinite(value)&&value>=1&&value<=12?value:0}
function coordinateText(small){
  const stored=String(small?.dataset?.relationshipCoordinate||'').trim();
  if(stored)return stored;
  const match=String(small?.textContent||'').match(/\d{1,2}°\d{2}′/);
  return match?.[0]||String(small?.textContent||'').split('·')[0].trim();
}
function sideSmall(row,side){return row.querySelector(`.sky-foundation-relationship-placement--${side} .sky-foundation-relationship-copy small`)}
function decorateSide(row,side){
  const small=sideSmall(row,side),house=rowHouse(row,side);if(!small||!house)return;
  const field=`${side}-house`,coordinate=coordinateText(small);
  let medallion=small.querySelector('.relphi-house-medallion');
  if(!medallion){medallion=document.createElement('span');medallion.className='relphi-house-medallion'}
  medallion.dataset.house=String(house);
  medallion.dataset.inlineProgressiveGlyph=field;
  medallion.textContent=String(house);
  medallion.style.setProperty('--house-color',houseColors[house-1]||FALLBACK_COLORS[house-1]);
  medallion.setAttribute('aria-label',HOUSE_NAMES[house]);
  medallion.setAttribute('title',HOUSE_NAMES[house]);
  small.dataset.relationshipCoordinate=coordinate;
  small.classList.add('relphi-house-coordinate');
  const correct=small.childNodes.length===2&&small.firstChild?.nodeType===Node.TEXT_NODE&&small.firstChild.textContent===coordinate&&small.lastChild===medallion;
  if(!correct)small.replaceChildren(document.createTextNode(coordinate),medallion);
}
function decorateRow(row){if(!(row instanceof HTMLElement)||!row.matches('.sky-foundation-relationship-row'))return;decorateSide(row,'left');decorateSide(row,'right')}
function decorateAll(){document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row').forEach(decorateRow)}
function repaintColors(){document.querySelectorAll('#skyFoundationRelationshipList .relphi-house-medallion').forEach(node=>{const house=Number(node.dataset.house);if(house>=1&&house<=12)node.style.setProperty('--house-color',houseColors[house-1]||FALLBACK_COLORS[house-1])})}
function ensureObserver(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;
  observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node instanceof HTMLElement&&node.matches('.sky-foundation-relationship-row'))decorateRow(node);
      }
    }
  });
  observer.observe(list,{childList:true,subtree:false});
  decorateAll();
}
function sync(){refreshPalette();ensureObserver();decorateAll();repaintColors()}
function start(){
  installStyles();sync();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,sync));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
