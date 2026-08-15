// House medallion v3: shared house-number marker for relationship tiles and expanded dual-card headers.
// This module owns presentation and construction only. Row builders call it directly; it observes no DOM.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseMedallionV3)return;
window.__relphiSkyHouseMedallionV3=true;
window.__relphiSkyHouseMedallionV2=true;
window.__relphiSkyHouseMedallionV1=true;

const STYLE_ID='skyHouseMedallionV3Styles';
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
// Canonical twelve-hue sequence used by the rainbow comparison wheel.
const HOUSE_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];

function installStyles(){
  document.getElementById('skyHouseMedallionV1Styles')?.remove();
  document.getElementById('skyHouseMedallionV2Styles')?.remove();
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

function validHouse(value){const n=Number(value);return Number.isFinite(n)&&n>=1&&n<=12?Math.trunc(n):0}
function medallion(house,field,interactive=false,existing=null){
  const n=validHouse(house);if(!n)return null;
  const node=existing instanceof HTMLElement?existing:document.createElement('span'),label=String(n);
  if(node.className!=='relphi-house-medallion')node.className='relphi-house-medallion';
  if(node.dataset.house!==label)node.dataset.house=label;
  if(node.textContent!==label)node.textContent=label;
  if(node.style.getPropertyValue('--house-color')!==HOUSE_COLORS[n-1])node.style.setProperty('--house-color',HOUSE_COLORS[n-1]);
  if(node.getAttribute('aria-label')!==HOUSE_NAMES[n])node.setAttribute('aria-label',HOUSE_NAMES[n]);
  const title=interactive?`Reveal ${HOUSE_NAMES[n]}`:HOUSE_NAMES[n];if(node.getAttribute('title')!==title)node.setAttribute('title',title);
  if(interactive&&field){if(node.dataset.inlineProgressiveGlyph!==field)node.dataset.inlineProgressiveGlyph=field}else if(node.dataset.inlineProgressiveGlyph)delete node.dataset.inlineProgressiveGlyph;
  return node;
}
function decorateCoordinate(small,coordinate,house,field,interactive=false){
  if(!(small instanceof HTMLElement))return null;
  const n=validHouse(house);if(!n)return null;
  const existing=small.querySelector('.relphi-house-medallion');
  const marker=medallion(n,field,interactive,existing);
  const text=String(coordinate||'').trim();
  if(small.dataset.relationshipCoordinate!==text)small.dataset.relationshipCoordinate=text;
  if(!small.classList.contains('relphi-house-coordinate'))small.classList.add('relphi-house-coordinate');
  const correct=small.childNodes.length===2&&small.firstChild?.nodeType===Node.TEXT_NODE&&small.firstChild.textContent===text&&small.lastChild===marker;
  if(!correct)small.replaceChildren(document.createTextNode(text),marker);
  return marker;
}

installStyles();
window.RelphiHouseMedallion=Object.freeze({colors:Object.freeze(HOUSE_COLORS.slice()),names:Object.freeze(HOUSE_NAMES.slice()),create:medallion,decorateCoordinate});
})();