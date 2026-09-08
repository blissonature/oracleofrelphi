// Placements House medallions: replace H1/H2/... text with the same shared
// numeric House marker used by Relationship tiles and Card Hits.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementHouseMedallionV1)return;
window.__relphiSkyPlacementHouseMedallionV1=true;

const STYLE_ID='skyPlacementHouseMedallionV1Styles';
let queued=false;

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .sky-foundation-house[data-placement-house-medallion="true"]{
      display:grid!important;
      place-items:center!important;
      width:18px!important;
      min-width:18px!important;
      height:18px!important;
      padding:0!important;
      overflow:visible!important;
      color:inherit!important;
      font:inherit!important;
      line-height:1!important;
    }
    .sky-foundation-house[data-placement-house-medallion="true"]>.relphi-house-medallion{
      justify-self:center!important;
      margin:0!important;
    }
  `;
  document.head.appendChild(style);
}

function houseNumber(host){
  const stored=Number(host?.dataset?.house);
  if(Number.isInteger(stored)&&stored>=1&&stored<=12)return stored;
  const match=String(host?.textContent||'').trim().match(/^H?\s*(1[0-2]|[1-9])$/i);
  return match?Number(match[1]):0;
}

function decorate(host){
  if(!(host instanceof HTMLElement))return;
  const house=houseNumber(host),api=window.RelphiHouseMedallion;
  if(!house||typeof api?.create!=='function')return;
  const existing=host.querySelector(':scope > .relphi-house-medallion');
  const marker=api.create(house,'',false,existing);
  if(!marker)return;
  host.dataset.house=String(house);
  host.dataset.placementHouseMedallion='true';
  if(host.children.length!==1||host.firstElementChild!==marker)host.replaceChildren(marker);
}

function hydrate(){
  queued=false;
  installStyles();
  document.querySelectorAll('#skyFoundationA .sky-foundation-row .sky-foundation-house,#skyFoundationB .sky-foundation-row .sky-foundation-house').forEach(decorate);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(hydrate)}
function start(){
  installStyles();hydrate();
  const root=document.getElementById('skyFoundationRoot')||document.body;
  new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'))schedule();
  }).observe(root,{childList:true,subtree:true});
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-drawer-opened','relphi:saved-sky-loaded'].forEach(name=>window.addEventListener(name,schedule));
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
