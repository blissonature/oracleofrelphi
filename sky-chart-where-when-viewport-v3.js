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
    /* Do not permanently reserve a scrollbar lane inside a narrow Sky card.
       The body may scroll when it genuinely needs to, but when it fits its
       fields should reclaim the full content width. */
    .sky-where-when-editor{grid-template-rows:max-content auto!important;height:auto!important;max-height:none!important}
    .sky-where-when-scroll-body{scrollbar-gutter:auto;padding-bottom:0;max-height:none!important;overflow:visible!important}
    .sky-where-when-here-now-row{padding:0 .62rem .8rem}
    .sky-location-confirmation:not([data-location-source="placement-inference"]) p:first-child{display:none}
    .sky-where-when-status:empty{display:none}
    .sky-where-when-grid{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)}
    .sky-where-when-editor [data-ww-field="time"]:disabled{background:#d8d4cf!important;background-color:#d8d4cf!important;color:#817a73!important;-webkit-text-fill-color:#817a73!important;opacity:1!important;cursor:not-allowed!important;border-color:#c7c1bb!important}
    .sky-where-when-editor [data-ww-field="time"]:disabled::-webkit-calendar-picker-indicator{opacity:.32!important;filter:grayscale(1)!important}
    .sky-where-search-row{align-items:end}
    @media(max-width:620px){
      .sky-where-when-grid{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)}
      .sky-where-when-here-now-row{padding:0 .55rem .69rem}
    }
  `;document.head.appendChild(style);
}
// The editor must grow with its content. At browser zoom a visual-viewport
// height cap shrinks the card and hides the miniheptagram behind nested scrolling.
// Let the page scroll instead of putting a scrollbar inside Where and When.
function sizeEditor(form){
  const body=form?.querySelector('.sky-where-when-scroll-body');
  if(body)body.style.removeProperty('max-height');
}
function sizeAll(){document.querySelectorAll('.sky-where-when-editor').forEach(sizeEditor)}
function start(){installStyle();sizeAll();window.addEventListener('relphi:sky-where-when-editor-ready',sizeAll)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
