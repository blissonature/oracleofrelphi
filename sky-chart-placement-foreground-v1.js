// Placement foreground interaction v3: direct interaction surfaces dimmed placements and cycles overlaps geometrically.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementForegroundV3)return;
window.__relphiSkyPlacementForegroundV1=true;
window.__relphiSkyPlacementForegroundV2=true;
window.__relphiSkyPlacementForegroundV3=true;

const STYLE_ID='skyPlacementForegroundV3Style';
let pinnedKey='',hoverKey='',focusKey='';

function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent=`
#skyFoundationWheelMount>.sky-foundation-wheel [data-layer="placements"]>g[data-placement-foreground="true"]{
  opacity:1!important;
  visibility:visible!important;
  filter:brightness(1.08) saturate(1.12) drop-shadow(0 0 3px rgba(255,255,255,.98)) drop-shadow(0 0 6px rgba(40,40,40,.18))!important;
}
#skyFoundationWheelMount>.sky-foundation-wheel [data-layer="leaders"]>line[data-placement-foreground="true"]{
  opacity:1!important;
  visibility:visible!important;
}
`;
  document.head.appendChild(style);
}
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
function clearMarks(){
  document.querySelectorAll('[data-layer="placements"]>g[data-placement-foreground]').forEach(node=>delete node.dataset.placementForeground);
  document.querySelectorAll('[data-layer="leaders"]>line[data-placement-foreground]').forEach(node=>delete node.dataset.placementForeground);
}
function activeKey(){return hoverKey||focusKey||pinnedKey}
function surface(node){
  if(!node?.isConnected)return;
  const {placements,leaders}=layers();if(!placements||node.parentElement!==placements)return;
  const leader=leaderFor(node,leaders);
  if(leader&&leaders){leaders.appendChild(leader);leader.dataset.placementForeground='true'}
  placements.appendChild(node);
  node.dataset.placementForeground='true';
}
function refreshSurface(){
  clearMarks();const node=resolve(activeKey());if(node)surface(node);
}
function visiblePlacementNodes(){
  const {placements}=layers();if(!placements)return[];
  return [...placements.querySelectorAll(':scope>g[data-sky][data-placement]')].filter(node=>{
    const style=getComputedStyle(node),rect=node.getBoundingClientRect();
    return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
  });
}
function geometryCandidates(x,y,pad=5){
  return visiblePlacementNodes().map(node=>{
    const rect=node.getBoundingClientRect();
    const inside=x>=rect.left-pad&&x<=rect.right+pad&&y>=rect.top-pad&&y<=rect.bottom+pad;
    if(!inside)return null;
    const cx=(rect.left+rect.right)/2,cy=(rect.top+rect.bottom)/2;
    return{node,key:keyOf(node),distance:Math.hypot(x-cx,y-cy)};
  }).filter(Boolean).sort((a,b)=>a.distance-b.distance||a.key.localeCompare(b.key));
}
function cycleAtPoint(event){
  const candidates=geometryCandidates(event.clientX,event.clientY);
  if(!candidates.length)return placementFrom(event.target);
  const direct=placementFrom(event.target),directKey=keyOf(direct);
  if(directKey){const index=candidates.findIndex(item=>item.key===directKey);if(index>0){const [item]=candidates.splice(index,1);candidates.unshift(item)}}
  const currentIndex=candidates.findIndex(item=>item.key===pinnedKey);
  return candidates[(currentIndex+1+candidates.length)%candidates.length]?.node||candidates[0]?.node||null;
}
function pointerCandidate(event){
  const direct=placementFrom(event.target);if(direct)return direct;
  return geometryCandidates(event.clientX,event.clientY,2)[0]?.node||null;
}
function start(){
  installStyle();
  const mount=document.getElementById('skyFoundationWheelMount');if(!mount)return;
  mount.addEventListener('pointerover',event=>{
    const node=pointerCandidate(event);if(!node)return;
    hoverKey=keyOf(node);refreshSurface();
  },true);
  mount.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    const node=pointerCandidate(event),next=keyOf(node);
    if(next===hoverKey)return;hoverKey=next;refreshSurface();
  },true);
  mount.addEventListener('pointerout',event=>{
    const node=placementFrom(event.target);if(node&&keyOf(node)!==hoverKey)return;
    const related=placementFrom(event.relatedTarget);hoverKey=keyOf(related);refreshSurface();
  },true);
  mount.addEventListener('focusin',event=>{const node=placementFrom(event.target);if(node){focusKey=keyOf(node);refreshSurface()}},true);
  mount.addEventListener('focusout',event=>{const node=placementFrom(event.target);if(node&&keyOf(node)===focusKey){focusKey='';refreshSurface()}},true);
  mount.addEventListener('click',event=>{
    const target=cycleAtPoint(event);
    if(target){pinnedKey=keyOf(target);hoverKey='';focusKey='';refreshSurface();return}
    if(event.target.closest?.('.sky-foundation-wheel')){pinnedKey='';hoverKey='';focusKey='';refreshSurface()}
  },true);
  new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'))requestAnimationFrame(refreshSurface);
  }).observe(mount,{childList:true,subtree:false});
  ['relphi:sky-foundation-ready','relphi:sky-b-removed','relphi:sky-b-restored','relphi:saved-sky-loaded','relphi:sky-where-when-committed'].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(refreshSurface)));
}

window.RelphiSkyPlacementForeground=Object.freeze({
  raiseByKey:key=>{pinnedKey=String(key||'');hoverKey='';focusKey='';refreshSurface()},
  clear:()=>{pinnedKey='';hoverKey='';focusKey='';refreshSurface()}
});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
