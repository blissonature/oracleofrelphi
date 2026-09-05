// Placement foreground interaction: hover/focus/tap raises one placement without reordering canonical placement nodes.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementForegroundV1)return;
window.__relphiSkyPlacementForegroundV1=true;

const OVERLAY_ATTR='data-placement-foreground-overlay';
let hoverTarget=null,focusTarget=null,pinnedTarget=null;

function placementFrom(node){return node?.closest?.('[data-layer="placements"]>g[data-sky][data-placement]')||null}
function liveWheel(){return document.querySelector('#skyFoundationWheelMount>svg.sky-foundation-wheel')}
function placementLayer(wheel=liveWheel()){return wheel?.querySelector('[data-layer="placements"]')||null}
function ensureOverlay(){
  const layer=placementLayer();if(!layer)return null;
  let overlay=layer.querySelector(`:scope>g[${OVERLAY_ATTR}]`);
  if(!overlay){
    overlay=document.createElementNS('http://www.w3.org/2000/svg','g');
    overlay.setAttribute(OVERLAY_ATTR,'true');
    overlay.setAttribute('aria-hidden','true');
    overlay.style.pointerEvents='none';
    layer.appendChild(overlay);
  }else if(overlay!==layer.lastElementChild){
    layer.appendChild(overlay);
  }
  return overlay;
}
function keyOf(node){return node?`${node.dataset.sky||''}:${node.dataset.placement||''}`:''}
function resolveTarget(key){
  if(!key)return null;const [sky,...rest]=String(key).split(':'),placement=rest.join(':');
  const layer=placementLayer();if(!layer)return null;
  return layer.querySelector(`:scope>g[data-sky="${CSS.escape(sky)}"][data-placement="${CSS.escape(placement)}"]`);
}
function activeTarget(){
  const candidate=hoverTarget||focusTarget||resolveTarget(pinnedTarget);
  return candidate?.isConnected?candidate:null;
}
function clearOverlay(){const overlay=ensureOverlay();overlay?.replaceChildren()}
function render(){
  const overlay=ensureOverlay();if(!overlay)return;
  overlay.replaceChildren();
  const target=activeTarget();if(!target)return;
  const clone=target.cloneNode(true);
  clone.removeAttribute('tabindex');clone.removeAttribute('role');clone.removeAttribute('aria-label');clone.removeAttribute('data-interactive');
  clone.dataset.placementForeground='true';
  clone.setAttribute('aria-hidden','true');
  clone.style.pointerEvents='none';
  overlay.appendChild(clone);
  overlay.dataset.foregroundKey=keyOf(target);
}
function setHover(node){hoverTarget=node;render()}
function clearHover(node){if(!node||hoverTarget===node)hoverTarget=null;render()}
function setFocus(node){focusTarget=node;render()}
function clearFocus(node){if(!node||focusTarget===node)focusTarget=null;render()}
function pin(node){pinnedTarget=node?keyOf(node):null;render()}

function start(){
  ensureOverlay();
  const mount=document.getElementById('skyFoundationWheelMount');
  mount?.addEventListener('pointerover',event=>{
    const node=placementFrom(event.target);if(!node)return;
    const related=placementFrom(event.relatedTarget);if(related===node)return;
    setHover(node);
  });
  mount?.addEventListener('pointerout',event=>{
    const node=placementFrom(event.target);if(!node)return;
    const related=placementFrom(event.relatedTarget);if(related===node)return;
    clearHover(node);
  });
  mount?.addEventListener('focusin',event=>{const node=placementFrom(event.target);if(node)setFocus(node)});
  mount?.addEventListener('focusout',event=>{const node=placementFrom(event.target);if(node)clearFocus(node)});
  mount?.addEventListener('click',event=>{
    const node=placementFrom(event.target);
    if(node){pin(node);return}
    if(event.target.closest?.('.sky-foundation-wheel'))pin(null);
  });
  new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'))requestAnimationFrame(()=>{ensureOverlay();render()});
  }).observe(mount||document.body,{childList:true,subtree:false});
  ['relphi:sky-foundation-ready','relphi:sky-b-removed','relphi:sky-b-restored','relphi:saved-sky-loaded','relphi:sky-where-when-committed'].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(()=>{ensureOverlay();render()})));
}

window.RelphiSkyPlacementForeground=Object.freeze({render,clear:()=>{hoverTarget=null;focusTarget=null;pinnedTarget=null;clearOverlay()},pinByKey:key=>{pinnedTarget=String(key||'')||null;render()}});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
