// House medallion v8: shared numeric house marker created directly by source renderers.
// There is no observer/decorator pass for Placements or Relationships; those renderers now emit the final medallion DOM themselves.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseMedallionV8)return;
window.__relphiSkyHouseMedallionV8=true;
window.__relphiSkyHouseMedallionV7=true;
window.__relphiSkyHouseMedallionV6=true;
window.__relphiSkyHouseMedallionV5=true;
window.__relphiSkyHouseMedallionV4=true;
window.__relphiSkyHouseMedallionV3=true;
window.__relphiSkyHouseMedallionV2=true;
window.__relphiSkyHouseMedallionV1=true;

const STYLE_ID='skyHouseMedallionV8Styles';
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
const HOUSE_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const ORDINAL_SUFFIX={1:'ˢᵗ',2:'ⁿᵈ',3:'ʳᵈ'};

function validHouse(value){const n=Number(value);return Number.isFinite(n)&&n>=1&&n<=12?Math.trunc(n):0}
function ordinalHouseLabel(value){const n=validHouse(value);return n?`${n}${ORDINAL_SUFFIX[n]||'ᵗʰ'} House`:'House'}
function houseInk(hex){const value=String(hex||'').replace('#','');if(value.length!==6)return'#fff';const r=parseInt(value.slice(0,2),16),g=parseInt(value.slice(2,4),16),b=parseInt(value.slice(4,6),16),luma=.299*r+.587*g+.114*b;return luma>160?'#211d1a':'#fff'}
function installStyles(){
  ['skyHouseMedallionV1Styles','skyHouseMedallionV2Styles','skyHouseMedallionV3Styles','skyHouseMedallionV4Styles','skyHouseMedallionV5Styles','skyHouseMedallionV6Styles','skyHouseMedallionV7Styles'].forEach(id=>document.getElementById(id)?.remove());
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
      white-space:nowrap;
      box-shadow:0 1px 2px rgba(0,0,0,.16);
    }
    .relphi-house-medallion[data-house="10"],
    .relphi-house-medallion[data-house="11"],
    .relphi-house-medallion[data-house="12"]{font-size:.49rem!important;letter-spacing:-.035em}
    .sky-foundation-house.relphi-placement-house-medallion-host{
      display:grid!important;
      place-items:center!important;
      justify-self:end!important;
      width:18px!important;
      min-width:18px!important;
      height:18px!important;
      margin:0!important;
      padding:0!important;
      overflow:visible!important;
      color:inherit!important;
      font:inherit!important;
      line-height:1!important;
    }
    .sky-foundation-house.relphi-placement-house-medallion-host>.relphi-house-medallion{justify-self:center!important;margin:0!important}
    .sky-foundation-relationship-row.is-inline-expanded .relphi-house-medallion[data-inline-progressive-glyph]{cursor:pointer}
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

function medallion(house,field,interactive=false,existing=null){
  const n=validHouse(house);if(!n)return null;
  const node=existing instanceof HTMLElement?existing:document.createElement('span'),label=String(n),color=HOUSE_COLORS[n-1];
  if(node.className!=='relphi-house-medallion')node.className='relphi-house-medallion';
  if(node.dataset.house!==label)node.dataset.house=label;
  if(node.textContent!==label)node.textContent=label;
  if(node.style.getPropertyValue('--house-color')!==color)node.style.setProperty('--house-color',color);
  const ink=houseInk(color);if(node.style.getPropertyValue('--house-ink')!==ink)node.style.setProperty('--house-ink',ink);
  if(node.getAttribute('aria-label')!==HOUSE_NAMES[n])node.setAttribute('aria-label',HOUSE_NAMES[n]);
  const title=interactive?`Reveal ${ordinalHouseLabel(n)}`:HOUSE_NAMES[n];
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
function noOp(){}

installStyles();
window.RelphiHouseMedallion=Object.freeze({colors:Object.freeze(HOUSE_COLORS.slice()),names:Object.freeze(HOUSE_NAMES.slice()),ordinalHouseLabel,create:medallion,decorateCoordinate,refreshCompact:noOp,refreshPlacements:noOp});
})();