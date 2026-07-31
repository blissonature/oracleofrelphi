(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
function installStyle(){
 if(document.getElementById('relphi-house-hover-canonical-style'))return;
 const s=document.createElement('style');
 s.id='relphi-house-hover-canonical-style';
 s.textContent=`
 .scn-live-wheel [data-layer="sky-a-houses"] path[data-interactive="house"],
 .scn-live-wheel [data-layer="sky-b-houses"] path[data-interactive="house"]{
   pointer-events:all!important;cursor:pointer;transition:fill-opacity .14s ease,opacity .14s ease!important;filter:none!important;outline:none!important
 }
 .scn-live-wheel [data-layer="sky-a-houses"] path[data-interactive="house"]:hover,
 .scn-live-wheel [data-layer="sky-b-houses"] path[data-interactive="house"]:hover,
 .scn-live-wheel [data-layer="sky-a-houses"] path[data-interactive="house"].is-hovered,
 .scn-live-wheel [data-layer="sky-b-houses"] path[data-interactive="house"].is-hovered,
 .scn-live-wheel [data-layer="sky-a-houses"] path[data-interactive="house"].is-selected,
 .scn-live-wheel [data-layer="sky-b-houses"] path[data-interactive="house"].is-selected{
   fill-opacity:.86!important;filter:none!important;outline:none!important
 }
 .scn-live-wheel [data-layer="sky-a-houses"] line,
 .scn-live-wheel [data-layer="sky-b-houses"] line,
 .scn-live-wheel [data-layer="sky-a-houses"] text,
 .scn-live-wheel [data-layer="sky-b-houses"] text{pointer-events:none!important;filter:none!important}
 `;
 document.head.appendChild(s);
}
function correct(svg){
 if(!svg)return;
 installStyle();
 ['sky-a-houses','sky-b-houses'].forEach(function(layerName){
  const layer=svg.querySelector('[data-layer="'+layerName+'"]');
  if(!layer)return;
  layer.querySelectorAll('line,text').forEach(function(n){
   ['interactive','focusablePiece','sky','house','houseStart','houseEnd'].forEach(function(k){delete n.dataset[k]});
   n.removeAttribute('tabindex');
  });
  layer.querySelectorAll('path[data-house]').forEach(function(path){
   path.dataset.interactive='house';
   path.dataset.focusablePiece='house';
   path.setAttribute('tabindex','0');
   path.setAttribute('role','button');
   path.setAttribute('aria-label','Sky '+path.dataset.sky+' house '+path.dataset.house);
  });
 });
}
window.addEventListener('relphi:sky-chart-next-display-ready',function(e){correct(e.detail&&e.detail.svg)});
const run=function(){document.querySelectorAll('.scn-live-wheel[data-ready="true"]').forEach(correct)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();