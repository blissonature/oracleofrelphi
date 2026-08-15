// House medallion v7: one real rainbow house marker, fixed to a stable coordinate column.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseMedallionV7)return;
window.__relphiSkyHouseMedallionV7=true;
window.__relphiSkyHouseMedallionV6=true;
window.__relphiSkyHouseMedallionV5=true;
window.__relphiSkyHouseMedallionV4=true;
window.__relphiSkyHouseMedallionV3=true;
window.__relphiSkyHouseMedallionV2=true;
window.__relphiSkyHouseMedallionV1=true;

const STYLE_ID='skyHouseMedallionV7Styles';
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
const HOUSE_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];

function installStyles(){
  ['skyHouseMedallionV1Styles','skyHouseMedallionV2Styles','skyHouseMedallionV3Styles','skyHouseMedallionV4Styles','skyHouseMedallionV5Styles','skyHouseMedallionV6Styles'].forEach(id=>document.getElementById(id)?.remove());
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .sky-foundation-relationship-copy small.relphi-house-coordinate{
      display:grid!important;
      grid-template-columns:3.15rem 14px!important;
      grid-auto-flow:column!important;
      grid-auto-columns:max-content!important;
      align-items:center!important;
      justify-content:center!important;
      column-gap:4px!important;
      row-gap:0!important;
      width:100%!important;
      height:16px!important;
      margin:0!important;
      padding:0!important;
      text-align:center!important;
      white-space:nowrap!important;
    }
    .relphi-house-medallion{
      --house-color:#777;
      display:inline-grid!important;
      place-items:center;
      align-self:center!important;
      justify-self:center!important;
      flex:0 0 14px;
      width:14px;
      height:14px;
      box-sizing:border-box;
      margin:0!important;
      padding:0!important;
      border:1.4px solid var(--house-color)!important;
      border-radius:50%!important;
      background:color-mix(in srgb,var(--house-color) 18%,#fffdfa)!important;
      color:#2f2a26!important;
      font:900 .52rem/1 system-ui,sans-serif!important;
      font-variant-numeric:tabular-nums;
      text-align:center;
      vertical-align:middle;
      transform:none!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.48);
    }
    .relphi-house-medallion[data-house="10"],
    .relphi-house-medallion[data-house="11"],
    .relphi-house-medallion[data-house="12"]{font-size:.44rem!important;letter-spacing:-.035em}
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-copy small.relphi-house-coordinate{
      grid-template-columns:3.15rem 16px!important;
    }
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
      .sky-foundation-relationship-copy small.relphi-house-coordinate{
        grid-template-columns:3rem 14px!important;
        column-gap:3px!important;
      }
      .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-copy small.relphi-house-coordinate{
        grid-template-columns:3rem 16px!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function validHouse(value){const n=Number(value);return Number.isFinite(n)&&n>=1&&n<=12?Math.trunc(n):0}
function medallion(house,field,interactive=false,existing=null){
  const n=validHouse(house);if(!n)return null;
  const node=existing instanceof HTMLElement?existing:document.createElement('span'),label=String(n);
  node.className='relphi-house-medallion';
  node.dataset.house=label;
  node.textContent=label;
  node.style.setProperty('--house-color',HOUSE_COLORS[n-1]);
  node.setAttribute('aria-label',HOUSE_NAMES[n]);
  node.setAttribute('title',interactive?`Reveal ${HOUSE_NAMES[n]}`:HOUSE_NAMES[n]);
  if(interactive&&field)node.dataset.inlineProgressiveGlyph=field;else delete node.dataset.inlineProgressiveGlyph;
  return node;
}
function decorateCoordinate(small,coordinate,house,field,interactive=false){
  if(!(small instanceof HTMLElement))return null;
  const n=validHouse(house);if(!n)return null;
  const text=String(coordinate||'').trim();
  small.dataset.relationshipCoordinate=text;
  small.classList.add('relphi-house-coordinate');
  let marker=small.querySelector(':scope>.relphi-house-medallion');
  marker=medallion(n,field,interactive,marker);
  const correct=small.childNodes.length===2&&small.firstChild?.nodeType===Node.TEXT_NODE&&small.firstChild.textContent===text&&small.lastChild===marker;
  if(!correct)small.replaceChildren(document.createTextNode(text),marker);
  return marker;
}

installStyles();
window.RelphiHouseMedallion=Object.freeze({colors:Object.freeze(HOUSE_COLORS.slice()),names:Object.freeze(HOUSE_NAMES.slice()),create:medallion,decorateCoordinate});
})();