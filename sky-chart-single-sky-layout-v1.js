// Single-sky wheel spacing: keep house numbers in their own radial lane.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySingleSkyLayoutV1)return;
window.__relphiSkySingleSkyLayoutV1=true;
const CENTER=300;
const HOUSE_NUMBER_RADIUS=146;
let queued=false;
function apply(){queued=false;const wheel=document.querySelector('#skyFoundationWheelMount>.sky-foundation-single-wheel');if(!wheel)return;wheel.querySelectorAll('[data-layer="a-houses"] .sky-placement-mini-house-number').forEach(node=>{const x=Number(node.getAttribute('x')),y=Number(node.getAttribute('y')),dx=x-CENTER,dy=y-CENTER,length=Math.hypot(dx,dy);if(!Number.isFinite(length)||length===0)return;node.setAttribute('x',(CENTER+dx/length*HOUSE_NUMBER_RADIUS).toFixed(3));node.setAttribute('y',(CENTER+dy/length*HOUSE_NUMBER_RADIUS).toFixed(3));node.dataset.houseNumberLane='protected'});wheel.dataset.singleSkySpacing='ready'}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}
['relphi:sky-single-sky-aspects-rendered','relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();