// Desktop-only Relationships filmstrip presentation and keyboard/mouse-wheel scrubbing.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipFilmstripV1)return;
window.__relphiSkyRelationshipFilmstripV1=true;

const desktopQuery=window.matchMedia('(min-width:901px) and (pointer:fine)');
let expanded=false;
let currentKey='';
let wheelAccumulator=0;
let wheelDirection=0;
let lastWheelMoveAt=0;
let reconcileQueued=false;

function panel(){return document.getElementById('skyFoundationRelationships')}
function list(){return document.getElementById('skyFoundationRelationshipList')}
function root(){return document.getElementById('skyFoundationRoot')}
function comparison(){return document.getElementById('skyFoundationComparison')}
function active(){return desktopQuery.matches}

function rowKey(row){
  if(!row)return'';
  const mode=String(row.dataset.relationshipMode||'A-B').toUpperCase();
  const leftSky=String(row.dataset.leftSky|| (mode==='B-B'?'B':'A')).toUpperCase();
  const rightSky=String(row.dataset.rightSky|| (mode==='A-A'?'A':'B')).toUpperCase();
  return[
    mode,leftSky,row.dataset.leftPlacement||'',row.dataset.aspect||'',
    rightSky,row.dataset.rightPlacement||'',row.dataset.sourceOrb||row.dataset.orb||''
  ].join('|');
}

function rowVisible(row){
  if(!row||row.hidden||row.getAttribute('aria-hidden')==='true'||row.style.display==='none')return false;
  return !Array.from(row.classList).some(name=>/hidden$/.test(name));
}

function visibleRows(){
  const l=list();
  return l?Array.from(l.querySelectorAll(':scope>.sky-foundation-relationship-row[data-relation-index]')).filter(rowVisible):[];
}

function findCurrent(rows=visibleRows()){
  const focused=document.activeElement?.closest?.('.sky-foundation-relationship-row[data-relation-index]');
  if(focused&&rows.includes(focused))return focused;
  if(currentKey){
    const matched=rows.find(row=>rowKey(row)===currentKey);
    if(matched)return matched;
  }
  const aria=rows.find(row=>row.getAttribute('aria-current')==='true');
  return aria||null;
}

function markCurrent(row){
  const l=list();
  if(!l)return;
  l.querySelectorAll(':scope>.sky-foundation-relationship-row.is-filmstrip-current').forEach(node=>{
    if(node!==row)node.classList.remove('is-filmstrip-current');
  });
  if(row){
    row.classList.add('is-filmstrip-current');
    currentKey=rowKey(row);
  }
}

function reveal(row){
  if(!row)return;
  row.scrollIntoView({
    behavior:'auto',
    block:expanded?'nearest':'nearest',
    inline:expanded?'nearest':'center'
  });
}

function selectRow(row,{focus=true}={}){
  if(!row||!rowVisible(row))return false;
  markCurrent(row);
  if(focus&&document.activeElement!==row)row.focus({preventScroll:true});
  reveal(row);
  return true;
}

function moveSelection(direction,origin){
  const rows=visibleRows();
  if(!rows.length)return false;
  let current=findCurrent(rows);
  if(!current&&origin){
    const candidate=origin.closest?.('.sky-foundation-relationship-row[data-relation-index]');
    if(candidate&&rows.includes(candidate))current=candidate;
  }
  let index=current?rows.indexOf(current):(direction>0?-1:rows.length);
  index=Math.max(0,Math.min(rows.length-1,index+direction));
  return selectRow(rows[index]);
}

function actionsHost(){
  const p=panel(),heading=p?.querySelector(':scope>.sky-foundation-relationships-heading');
  if(!heading)return null;
  let host=heading.querySelector(':scope>.sky-relationship-heading-actions');
  if(!host){
    host=document.createElement('span');
    host.className='sky-relationship-heading-actions';
    const clear=heading.querySelector('#skyFoundationClearIsolation');
    heading.insertBefore(host,clear||null);
  }
  return host;
}

function ensureToggle(){
  const host=actionsHost();
  if(!host)return null;
  let button=document.getElementById('skyRelationshipFilmstripToggle');
  if(!button){
    button=document.createElement('button');
    button.id='skyRelationshipFilmstripToggle';
    button.type='button';
    button.className='sky-relationship-filmstrip-toggle';
    button.innerHTML='<span class="sky-relationship-filmstrip-chevron" aria-hidden="true"></span>';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      setExpanded(!expanded,{restoreFocus:true});
    });
  }
  if(button.parentElement!==host)host.insertBefore(button,host.firstChild);
  button.setAttribute('aria-expanded',expanded?'true':'false');
  button.setAttribute('aria-label',expanded?'Collapse Relationships to filmstrip':'Expand Relationships list');
  button.title=expanded?'Collapse Relationships':'Expand Relationships';
  return button;
}

function setExpanded(value,{restoreFocus=false}={}){
  expanded=!!value;
  const p=panel();
  if(p)p.dataset.filmstripExpanded=expanded?'true':'false';
  ensureToggle();
  if(!active())return;
  requestAnimationFrame(()=>{
    const rows=visibleRows();
    const selected=findCurrent(rows)||rows[0]||null;
    if(selected){
      markCurrent(selected);
      if(restoreFocus)selected.focus({preventScroll:true});
      reveal(selected);
    }
  });
}

function mountDesktop(){
  const p=panel(),r=root();
  if(!p||!r)return false;
  if(p.parentElement!==r)r.appendChild(p);
  document.documentElement.dataset.skyRelationshipFilmstrip='true';
  p.dataset.filmstripExpanded=expanded?'true':'false';
  ensureToggle();
  bindList();
  return true;
}

function unmountDesktop(){
  const p=panel(),c=comparison();
  document.documentElement.removeAttribute('data-sky-relationship-filmstrip');
  if(p){
    p.removeAttribute('data-filmstrip-expanded');
    p.querySelectorAll('.is-filmstrip-current').forEach(row=>row.classList.remove('is-filmstrip-current'));
    const button=document.getElementById('skyRelationshipFilmstripToggle');
    button?.remove();
    if(c&&p.parentElement!==c)c.appendChild(p);
  }
  window.dispatchEvent(new CustomEvent('relphi:sky-relationship-filmstrip-mode-changed',{detail:{active:false}}));
}

function applyMode(){
  if(active()){
    if(mountDesktop())window.dispatchEvent(new CustomEvent('relphi:sky-relationship-filmstrip-mode-changed',{detail:{active:true,expanded}}));
  }else unmountDesktop();
}

function onWheel(event){
  if(!active()||!event.target.closest?.('#skyFoundationRelationshipList'))return;
  if(event.ctrlKey||event.metaKey)return;
  const delta=Math.abs(event.deltaY)>=Math.abs(event.deltaX)?event.deltaY:event.deltaX;
  if(!delta)return;
  event.preventDefault();
  const direction=delta>0?1:-1;
  if(direction!==wheelDirection){
    wheelDirection=direction;
    wheelAccumulator=0;
  }
  wheelAccumulator+=Math.abs(delta);
  const now=performance.now();
  const threshold=event.deltaMode===1?1:34;
  if(wheelAccumulator<threshold||now-lastWheelMoveAt<62)return;
  wheelAccumulator=0;
  lastWheelMoveAt=now;
  moveSelection(direction,event.target);
}

function onKeydown(event){
  if(!active())return;
  const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
  if(!row||!list()?.contains(row))return;
  let direction=0;
  if(!expanded&&event.key==='ArrowLeft')direction=-1;
  else if(!expanded&&event.key==='ArrowRight')direction=1;
  else if(expanded&&event.key==='ArrowUp')direction=-1;
  else if(expanded&&event.key==='ArrowDown')direction=1;
  if(!direction)return;
  event.preventDefault();
  event.stopPropagation();
  moveSelection(direction,row);
}

function onFocusin(event){
  const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
  if(row&&list()?.contains(row))markCurrent(row);
}

function bindList(){
  const l=list();
  if(!l||l.dataset.relationshipFilmstripBound==='true')return;
  l.dataset.relationshipFilmstripBound='true';
  l.addEventListener('wheel',onWheel,{passive:false});
  l.addEventListener('keydown',onKeydown);
  l.addEventListener('focusin',onFocusin);
}

function reconcile(){
  reconcileQueued=false;
  applyMode();
  if(!active())return;
  const rows=visibleRows();
  if(currentKey&&!rows.some(row=>rowKey(row)===currentKey))currentKey='';
  const selected=findCurrent(rows);
  if(selected)markCurrent(selected);
}

function schedule(){
  if(reconcileQueued)return;
  reconcileQueued=true;
  requestAnimationFrame(reconcile);
}

function start(){
  schedule();
  desktopQuery.addEventListener?.('change',schedule);
  [
    'relphi:sky-foundation-ready',
    'relphi:sky-foundation-interactions-ready',
    'relphi:sky-intrasky-relationships-ready',
    'relphi:sky-intrasky-b-relationships-ready',
    'relphi:sky-aspect-multiselect-changed',
    'relphi:sky-placement-multiselect-changed',
    'relphi:sky-house-multiselect-changed',
    'relphi:sky-zodiac-filter-changed',
    'relphi:sky-harmonic-window-visibility-changed'
  ].forEach(name=>window.addEventListener(name,schedule));
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
