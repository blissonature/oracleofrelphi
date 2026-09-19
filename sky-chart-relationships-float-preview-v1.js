// Prototype only: float the existing Relationships panel in the same document.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipsFloatPreview)return;
window.__relphiRelationshipsFloatPreview=true;

const VIEW_ATTR='data-sky-relationships-view';
let drag=null;

function panel(){return document.getElementById('skyFoundationRelationships')}
function heading(){return panel()?.querySelector(':scope>.sky-foundation-relationships-heading')||null}
function active(){return document.documentElement.getAttribute(VIEW_ATTR)==='float'}

function actionsHost(){
  const head=heading();
  if(!head)return null;
  let host=head.querySelector(':scope>.sky-relationship-heading-actions');
  if(!host){
    host=document.createElement('span');
    host.className='sky-relationship-heading-actions';
    head.appendChild(host);
  }
  return host;
}

function ensureButton(){
  const host=actionsHost();
  if(!host)return null;
  let button=document.getElementById('skyRelationshipsFloatPreviewButton');
  if(!button){
    button=document.createElement('button');
    button.id='skyRelationshipsFloatPreviewButton';
    button.type='button';
    button.className='sky-relationships-float-button';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      setActive(!active());
    });
  }
  if(button.parentElement!==host)host.appendChild(button);
  syncButton();
  return button;
}

function syncButton(){
  const button=document.getElementById('skyRelationshipsFloatPreviewButton');
  if(!button)return;
  const isActive=active();
  button.textContent=isActive?'Dock':'Float';
  button.setAttribute('aria-pressed',isActive?'true':'false');
  button.setAttribute('aria-label',isActive?'Return Relationships below the wheel':'Float Relationships over the Sky Chart');
  button.title=isActive?'Return Relationships below the wheel':'Float Relationships';
}

function resetInlinePosition(){
  const p=panel();
  if(!p)return;
  ['left','right','top','bottom'].forEach(prop=>p.style.removeProperty(prop));
}

function setActive(value){
  if(value){
    document.documentElement.setAttribute(VIEW_ATTR,'float');
  }else{
    document.documentElement.removeAttribute(VIEW_ATTR);
    resetInlinePosition();
  }
  syncButton();
  window.dispatchEvent(new CustomEvent('relphi:sky-relationships-view-changed',{detail:{view:value?'float':'below'}}));
}

function dragStart(event){
  if(!active()||event.button!==0)return;
  if(event.target.closest('button,input,select,textarea,a,label,summary,details'))return;
  const p=panel(),head=heading();
  if(!p||!head)return;
  const rect=p.getBoundingClientRect();
  p.style.left=rect.left+'px';
  p.style.top=rect.top+'px';
  p.style.right='auto';
  p.style.bottom='auto';
  drag={pointerId:event.pointerId,dx:event.clientX-rect.left,dy:event.clientY-rect.top};
  head.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function dragMove(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  const p=panel();
  if(!p)return;
  const rect=p.getBoundingClientRect();
  const maxLeft=Math.max(8,innerWidth-rect.width-8);
  const maxTop=Math.max(8,innerHeight-rect.height-8);
  const left=Math.min(maxLeft,Math.max(8,event.clientX-drag.dx));
  const top=Math.min(maxTop,Math.max(8,event.clientY-drag.dy));
  p.style.left=left+'px';
  p.style.top=top+'px';
}

function dragEnd(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  heading()?.releasePointerCapture?.(event.pointerId);
  drag=null;
}

function bindDrag(){
  const head=heading();
  if(!head||head.dataset.floatPreviewDragBound==='true')return;
  head.dataset.floatPreviewDragBound='true';
  head.addEventListener('pointerdown',dragStart);
  head.addEventListener('pointermove',dragMove);
  head.addEventListener('pointerup',dragEnd);
  head.addEventListener('pointercancel',dragEnd);
}

function reconcile(){
  ensureButton();
  bindDrag();
}

function start(){
  reconcile();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(reconcile)));
  new MutationObserver(()=>requestAnimationFrame(reconcile)).observe(document.body,{childList:true,subtree:true});
  if(new URLSearchParams(location.search).get('relationships')==='float'){
    requestAnimationFrame(()=>setActive(true));
  }
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
