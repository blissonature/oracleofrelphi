// Prototype only: float the existing Relationships panel in the same document.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipsFloatPreview)return;
window.__relphiRelationshipsFloatPreview=true;

const VIEW_ATTR='data-sky-relationships-view';
let drag=null;
let dragFrame=0;
let dragPoint=null;

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
  drag={pointerId:event.pointerId,dx:event.clientX-rect.left,dy:event.clientY-rect.top,width:rect.width,height:rect.height};
  head.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function dragMove(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  dragPoint={x:event.clientX,y:event.clientY};
  if(dragFrame)return;
  dragFrame=requestAnimationFrame(()=>{
    dragFrame=0;
    if(!drag||!dragPoint)return;
    const p=panel();
    if(!p)return;
    const maxLeft=Math.max(8,innerWidth-drag.width-8);
    const maxTop=Math.max(8,innerHeight-drag.height-8);
    const left=Math.min(maxLeft,Math.max(8,dragPoint.x-drag.dx));
    const top=Math.min(maxTop,Math.max(8,dragPoint.y-drag.dy));
    p.style.left=left+'px';
    p.style.top=top+'px';
  });
}

function dragEnd(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  heading()?.releasePointerCapture?.(event.pointerId);
  drag=null;
  dragPoint=null;
  if(dragFrame){cancelAnimationFrame(dragFrame);dragFrame=0;}
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

function visibleRelationshipRows(list){
  return Array.from(list.querySelectorAll(':scope>.sky-foundation-relationship-row'))
    .filter(row=>!row.hidden&&getComputedStyle(row).display!=='none'&&getComputedStyle(row).visibility!=='hidden');
}

function adjacentRelationshipRow(current,key,list){
  const rows=visibleRelationshipRows(list);
  if(!rows.includes(current)||rows.length<2)return null;
  const from=current.getBoundingClientRect();
  const fx=from.left+from.width/2,fy=from.top+from.height/2;
  const direction={
    ArrowLeft:{axis:'x',sign:-1},
    ArrowRight:{axis:'x',sign:1},
    ArrowUp:{axis:'y',sign:-1},
    ArrowDown:{axis:'y',sign:1}
  }[key];
  if(!direction)return null;
  let best=null,bestPrimary=Infinity,bestSecondary=Infinity,bestDistance=Infinity;
  for(const row of rows){
    if(row===current)continue;
    const rect=row.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const dx=x-fx,dy=y-fy;
    const primary=direction.axis==='x'?dx*direction.sign:dy*direction.sign;
    if(primary<=1)continue;
    const secondary=Math.abs(direction.axis==='x'?dy:dx);
    const distance=Math.hypot(dx,dy);
    // Favor the same visual row/column first, then the nearest item in that direction.
    const laneTolerance=direction.axis==='x'?Math.max(8,from.height*.55):Math.max(8,from.width*.55);
    const lanePenalty=secondary<=laneTolerance?0:1;
    const scorePrimary=lanePenalty*100000+primary;
    if(scorePrimary<bestPrimary-0.5||
       (Math.abs(scorePrimary-bestPrimary)<=0.5&&secondary<bestSecondary-0.5)||
       (Math.abs(scorePrimary-bestPrimary)<=0.5&&Math.abs(secondary-bestSecondary)<=0.5&&distance<bestDistance)){
      best=row;bestPrimary=scorePrimary;bestSecondary=secondary;bestDistance=distance;
    }
  }
  return best;
}

function bindListNavigation(){
  const list=document.getElementById('skyFoundationRelationshipList');
  if(!list||list.dataset.floatPreviewArrowNavBound==='true')return;
  list.dataset.floatPreviewArrowNavBound='true';
  list.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    const row=event.target.closest?.('.sky-foundation-relationship-row');
    if(!row||!list.contains(row))return;
    const next=adjacentRelationshipRow(row,event.key,list);
    if(!next)return;
    event.preventDefault();
    event.stopPropagation();
    next.focus({preventScroll:true});
    next.scrollIntoView({block:'nearest',inline:'nearest'});
  });
}

function reconcile(){
  ensureButton();
  bindDrag();
  bindListNavigation();
}

function start(){
  reconcile();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(reconcile)));
  if(new URLSearchParams(location.search).get('relationships')==='float'){
    requestAnimationFrame(()=>setActive(true));
  }
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
