// Sky Chart major-panel layout owner.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLayoutShellV1)return;
window.__relphiSkyLayoutShellV1=true;

const KEY='relphiSkyChartLayoutV1';
const ALLOWED=new Set(['classic','cards-left','cards-right']);

function normalize(value){return ALLOWED.has(String(value||''))?String(value):'classic'}
function requested(){
  const param=new URLSearchParams(location.search).get('layout');
  if(ALLOWED.has(param))return param;
  try{return normalize(localStorage.getItem(KEY))}catch(_){return'classic'}
}
let sizeQueued=false;
function syncPanelHeight(){
  sizeQueued=false;
  const root=document.getElementById('skyFoundationRoot');
  if(!root)return;
  const mode=normalize(document.documentElement.dataset.skyLayout);
  if(!['cards-left','cards-right'].includes(mode)||innerWidth<1380){
    root.style.removeProperty('--sky-side-panel-height');
    return;
  }
  const a=document.getElementById('skyFoundationA');
  const b=document.getElementById('skyFoundationB');
  const bPresent=document.documentElement.dataset.skyBPresent==='true'||document.documentElement.dataset.skyBEditing==='true';
  const heights=[a,bPresent?b:null].filter(Boolean).map(node=>node.getBoundingClientRect().height).filter(Number.isFinite);
  const height=Math.max(0,...heights);
  if(height>0)root.style.setProperty('--sky-side-panel-height',height+'px');
}
function scheduleSize(){
  if(sizeQueued)return;
  sizeQueued=true;
  requestAnimationFrame(()=>requestAnimationFrame(syncPanelHeight));
}
function apply(value,{persist=true}={}){
  const next=normalize(value);
  document.documentElement.dataset.skyLayout=next;
  const select=document.querySelector('[data-sky-layout-select]');
  if(select&&select.value!==next)select.value=next;
  if(persist){try{localStorage.setItem(KEY,next)}catch(_){}}
  window.dispatchEvent(new CustomEvent('relphi:sky-layout-changed',{detail:{layout:next}}));
  scheduleSize();
  requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  return next;
}
function ensureControl(){
  const heading=document.querySelector('#skyFoundationComparison>.sky-foundation-heading');
  if(!heading)return null;
  let label=heading.querySelector('.sky-layout-control');
  if(label)return label;
  label=document.createElement('label');
  label.className='sky-layout-control';
  label.innerHTML='<span>Layout</span><select data-sky-layout-select aria-label="Sky Chart layout"><option value="classic">Classic</option><option value="cards-left">Cards Left</option><option value="cards-right">Cards Right</option></select>';
  const select=label.querySelector('select');
  select.value=normalize(document.documentElement.dataset.skyLayout);
  select.addEventListener('change',()=>apply(select.value));
  heading.appendChild(label);
  return label;
}
function start(){
  apply(requested(),{persist:false});
  ensureControl();
  window.addEventListener('relphi:sky-foundation-ready',()=>{ensureControl();scheduleSize()});
  window.addEventListener('relphi:sky-where-when-committed',scheduleSize);
  window.addEventListener('relphi:sky-layout-changed',scheduleSize);
  window.addEventListener('resize',scheduleSize,{passive:true});
  scheduleSize();
}
window.RelphiSkyLayoutShell=Object.freeze({apply,current:()=>normalize(document.documentElement.dataset.skyLayout),ensureControl,syncPanelHeight});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
