// House medallion v4: shared house-number marker for relationship tiles and expanded dual-card headers.
// Compact rows are decorated one frame after row layout; only top-level row additions are observed.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseMedallionV4)return;
window.__relphiSkyHouseMedallionV4=true;
window.__relphiSkyHouseMedallionV3=true;
window.__relphiSkyHouseMedallionV2=true;
window.__relphiSkyHouseMedallionV1=true;

const STYLE_ID='skyHouseMedallionV4Styles';
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
const HOUSE_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
let observer=null,observedList=null,raf=0;
const pendingRows=new Set();

function houseInk(hex){const value=String(hex||'').replace('#','');if(value.length!==6)return'#fff';const r=parseInt(value.slice(0,2),16),g=parseInt(value.slice(2,4),16),b=parseInt(value.slice(4,6),16),luma=.299*r+.587*g+.114*b;return luma>160?'#211d1a':'#fff'}
function installStyles(){
  ['skyHouseMedallionV1Styles','skyHouseMedallionV2Styles','skyHouseMedallionV3Styles'].forEach(id=>document.getElementById(id)?.remove());
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .sky-foundation-relationship-copy small.relphi-house-coordinate{
      display:grid!important;
      grid-template-columns:50px 18px!important;
      align-items:center!important;
      justify-content:center!important;
      column-gap:4px!important;
      height:18px!important;
      line-height:18px!important;
      overflow:visible!important;
    }
    .relphi-house-coordinate-value{
      display:block;
      width:50px;
      min-width:50px;
      text-align:right;
      white-space:nowrap;
      line-height:18px;
    }
    .relphi-house-medallion{
      --house-color:#777;
      --house-ink:#fff;
      display:inline-grid;
      place-items:center;
      justify-self:start;
      width:18px;
      height:18px;
      box-sizing:border-box;
      padding:0!important;
      border:0!important;
      border-radius:50%!important;
      background:var(--house-color)!important;
      color:var(--house-ink)!important;
      font:900 .58rem/1 system-ui,sans-serif!important;
      font-variant-numeric:tabular-nums;
      text-align:center;
      vertical-align:middle;
      box-shadow:0 1px 2px rgba(0,0,0,.16);
    }
    .relphi-house-medallion[data-house="10"],
    .relphi-house-medallion[data-house="11"],
    .relphi-house-medallion[data-house="12"]{font-size:.49rem!important;letter-spacing:-.035em}
    .sky-foundation-relationship-row.is-inline-expanded .relphi-house-medallion{cursor:pointer}
    .sky-foundation-relationship-row.is-inline-expanded .relphi-house-medallion:hover{
      filter:brightness(.92);
      box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 0 3px var(--house-color);
    }
    @media(max-width:620px){
      .sky-foundation-relationship-copy small.relphi-house-coordinate{grid-template-columns:48px 18px!important;column-gap:3px!important}
      .relphi-house-coordinate-value{width:48px;min-width:48px}
    }
  `;
  document.head.appendChild(style);
}

function validHouse(value){const n=Number(value);return Number.isFinite(n)&&n>=1&&n<=12?Math.trunc(n):0}
function medallion(house,field,interactive=false,existing=null){
  const n=validHouse(house);if(!n)return null;
  const node=existing instanceof HTMLElement?existing:document.createElement('span'),label=String(n),color=HOUSE_COLORS[n-1];
  if(node.className!=='relphi-house-medallion')node.className='relphi-house-medallion';
  if(node.dataset.house!==label)node.dataset.house=label;
  if(node.textContent!==label)node.textContent=label;
  if(node.style.getPropertyValue('--house-color')!==color)node.style.setProperty('--house-color',color);
  const ink=houseInk(color);if(node.style.getPropertyValue('--house-ink')!==ink)node.style.setProperty('--house-ink',ink);
  if(node.getAttribute('aria-label')!==HOUSE_NAMES[n])node.setAttribute('aria-label',HOUSE_NAMES[n]);
  const title=interactive?`Reveal ${HOUSE_NAMES[n]}`:HOUSE_NAMES[n];
  if(node.getAttribute('title')!==title)node.setAttribute('title',title);
  if(interactive&&field){if(node.dataset.inlineProgressiveGlyph!==field)node.dataset.inlineProgressiveGlyph=field}
  else if(node.dataset.inlineProgressiveGlyph)delete node.dataset.inlineProgressiveGlyph;
  return node;
}
function decorateCoordinate(small,coordinate,house,field,interactive=false){
  if(!(small instanceof HTMLElement))return null;
  const n=validHouse(house);if(!n)return null;
  const existingMarker=small.querySelector('.relphi-house-medallion');
  const marker=medallion(n,field,interactive,existingMarker);
  const text=String(coordinate||'').trim();
  if(small.dataset.relationshipCoordinate!==text)small.dataset.relationshipCoordinate=text;
  if(!small.classList.contains('relphi-house-coordinate'))small.classList.add('relphi-house-coordinate');
  let value=small.querySelector('.relphi-house-coordinate-value');
  if(!value){value=document.createElement('span');value.className='relphi-house-coordinate-value'}
  if(value.textContent!==text)value.textContent=text;
  const correct=small.children.length===2&&small.firstElementChild===value&&small.lastElementChild===marker;
  if(!correct)small.replaceChildren(value,marker);
  return marker;
}
function coordinateText(small){
  const stored=String(small?.dataset?.relationshipCoordinate||'').trim();if(stored)return stored;
  const match=String(small?.textContent||'').match(/\d{1,2}°\d{2}′/);return match?.[0]||'';
}
function decorateCompactSide(row,side){
  const house=validHouse(row.dataset[side==='left'?'leftHouse':'rightHouse']);if(!house)return;
  const small=row.querySelector(`.sky-foundation-relationship-placement--${side} .sky-foundation-relationship-copy small`);if(!small)return;
  const coordinate=coordinateText(small);if(!coordinate)return;
  decorateCoordinate(small,coordinate,house,`${side}-house`,false);
}
function decorateCompactRow(row){
  if(!(row instanceof HTMLElement)||!row.matches('.sky-foundation-relationship-row')||row.classList.contains('is-inline-expanded'))return;
  decorateCompactSide(row,'left');decorateCompactSide(row,'right');
}
function flushCompactRows(){
  raf=0;
  const rows=[...pendingRows];pendingRows.clear();
  rows.forEach(row=>{if(row.isConnected)decorateCompactRow(row)});
}
function queueCompactRow(row){
  if(!(row instanceof HTMLElement)||!row.matches('.sky-foundation-relationship-row'))return;
  pendingRows.add(row);
  if(!raf)raf=requestAnimationFrame(flushCompactRows);
}
function queueAllCompactRows(){
  document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row').forEach(queueCompactRow);
}
function ensureObserver(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list)return;
  if(list!==observedList){
    observer?.disconnect();observedList=list;
    observer=new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes)queueCompactRow(node);
    });
    observer.observe(list,{childList:true,subtree:false});
  }
  queueAllCompactRows();
}
function sync(){installStyles();ensureObserver()}

installStyles();
window.RelphiHouseMedallion=Object.freeze({colors:Object.freeze(HOUSE_COLORS.slice()),names:Object.freeze(HOUSE_NAMES.slice()),create:medallion,decorateCoordinate,refreshCompact:queueAllCompactRows});
['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed'].forEach(name=>window.addEventListener(name,sync));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();