// Where and When viewport density and sizing. Source and transaction semantics belong to the controller.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenViewportV3)return;
window.__relphiSkyWhereWhenViewportV3=true;
window.__relphiSkyWhereWhenViewportV2=true;

let queued=false;
function installStyle(){
  if(document.getElementById('skyWhereWhenViewportV3Style'))return;
  const style=document.createElement('style');style.id='skyWhereWhenViewportV3Style';
  style.textContent=`
    .sky-where-when-editor{row-gap:0!important}
    .sky-where-when-scroll-body{scrollbar-gutter:stable;padding-bottom:0}
    .sky-where-when-here-now-row{padding:0 .62rem .8rem}
    .sky-location-confirmation:not([data-location-source="placement-inference"]) p:first-child{display:none}
    .sky-where-when-status:empty{display:none}
    .sky-where-when-grid{grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr)}
    .sky-where-search-row{align-items:end}
    @media(max-width:620px){
      .sky-where-when-grid{grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr)}
      .sky-where-when-here-now-row{padding:0 .55rem .69rem}
      .sky-where-when-scroll-body{scrollbar-gutter:auto}
    }
  `;document.head.appendChild(style);
}
function numberPx(value){const parsed=parseFloat(value);return Number.isFinite(parsed)?parsed:0}
function sizeEditor(form){
  const body=form?.querySelector('.sky-where-when-scroll-body'),footer=form?.querySelector('.sky-where-when-footer');if(!body||!footer)return;
  const viewport=window.visualViewport?.height||window.innerHeight||800,rect=form.getBoundingClientRect(),formStyle=getComputedStyle(form),footerHeight=footer.getBoundingClientRect().height;
  const chrome=numberPx(formStyle.paddingTop)+numberPx(formStyle.paddingBottom)+numberPx(formStyle.rowGap)+4;
  const available=Math.max(220,viewport-Math.max(0,rect.top)-footerHeight-chrome);
  body.style.maxHeight=`${Math.floor(available)}px`;
}
function sizeAll(){queued=false;document.querySelectorAll('.sky-where-when-editor').forEach(sizeEditor)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(sizeAll)}
function start(){installStyle();sizeAll();window.addEventListener('relphi:sky-where-when-editor-ready',schedule);window.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
