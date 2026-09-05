// Placement foreground interaction v2: raise the actual SVG placement and its leader in paint order.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementForegroundV2)return;
window.__relphiSkyPlacementForegroundV1=true;
window.__relphiSkyPlacementForegroundV2=true;

let pinnedKey='';

function placementFrom(node){return node?.closest?.('[data-layer="placements"]>g[data-sky][data-placement]')||null}
function wheel(){return document.querySelector('#skyFoundationWheelMount>svg.sky-foundation-wheel')}
function layers(){const w=wheel();return{placements:w?.querySelector('[data-layer="placements"]')||null,leaders:w?.querySelector('[data-layer="leaders"]')||null}}
function keyOf(node){return node?`${node.dataset.sky||''}:${node.dataset.placement||''}`:''}
function leaderFor(node,leaders){
  if(!node||!leaders)return null;
  const sky=node.dataset.sky,placement=node.dataset.placement,exact=Number(node.dataset.exactLongitude);
  const candidates=[...leaders.querySelectorAll(`:scope>line[data-sky="${CSS.escape(String(sky||''))}"][data-placement="${CSS.escape(String(placement||''))}"]`)];
  if(Number.isFinite(exact)){
    const exactMatch=candidates.find(line=>Math.abs(Number(line.dataset.exactLongitude)-exact)<1e-5);if(exactMatch)return exactMatch;
  }
  return candidates[0]||null;
}
function resolve(key){
  if(!key)return null;const split=String(key).split(':'),sky=split.shift(),placement=split.join(':');
  const {placements}=layers();return placements?.querySelector(`:scope>g[data-sky="${CSS.escape(sky)}"][data-placement="${CSS.escape(placement)}"]`)||null;
}
function raise(node){
  if(!node?.isConnected)return;
  const {placements,leaders}=layers();if(!placements)return;
  const leader=leaderFor(node,leaders);
  if(leader&&leaders)leaders.appendChild(leader);
  placements.appendChild(node);
  node.dataset.placementForeground='true';
}
function clearMarks(){document.querySelectorAll('[data-layer="placements"]>g[data-placement-foreground]').forEach(node=>delete node.dataset.placementForeground)}
function raisePinned(){const node=resolve(pinnedKey);if(node){clearMarks();raise(node)}}
function cycleAtPoint(event){
  const {placements}=layers();if(!placements)return null;
  const seen=new Set(),candidates=[];
  for(const element of document.elementsFromPoint(event.clientX,event.clientY)){
    const node=placementFrom(element);if(!node||node.parentElement!==placements)continue;
    const key=keyOf(node);if(seen.has(key))continue;seen.add(key);candidates.push(node);
  }
  if(!candidates.length)return placementFrom(event.target);
  const currentIndex=candidates.findIndex(node=>keyOf(node)===pinnedKey);
  return candidates[(currentIndex+1+candidates.length)%candidates.length]||candidates[0];
}
function start(){
  const mount=document.getElementById('skyFoundationWheelMount');if(!mount)return;
  mount.addEventListener('pointerover',event=>{
    const node=placementFrom(event.target);if(!node)return;
    clearMarks();raise(node);
  },true);
  mount.addEventListener('focusin',event=>{
    const node=placementFrom(event.target);if(!node)return;
    clearMarks();raise(node);
  },true);
  mount.addEventListener('click',event=>{
    const target=cycleAtPoint(event);
    if(target){pinnedKey=keyOf(target);clearMarks();raise(target);return}
    if(event.target.closest?.('.sky-foundation-wheel')){pinnedKey='';clearMarks()}
  },true);
  new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'))requestAnimationFrame(raisePinned);
  }).observe(mount,{childList:true,subtree:false});
  ['relphi:sky-foundation-ready','relphi:sky-b-removed','relphi:sky-b-restored','relphi:saved-sky-loaded','relphi:sky-where-when-committed'].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(raisePinned)));
}

window.RelphiSkyPlacementForeground=Object.freeze({raiseByKey:key=>{pinnedKey=String(key||'');raisePinned()},clear:()=>{pinnedKey='';clearMarks()}});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
