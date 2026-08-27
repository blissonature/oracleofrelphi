// Diagnostic-only runtime trace for relationship aspect-scope filtering.
// This module does not mutate filter state, relationship rows, counters, or headers.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyAspectScopeDiagnosticV1)return;
window.__relphiSkyAspectScopeDiagnosticV1=true;

const START=performance.now();
const MAX=42;
const lines=[];
let panel=null,pre=null,listObserver=null,observedList=null,mutationQueued=false,lastMutationSignature='';

function mode(node){
  const explicit=String(node?.dataset?.relationshipMode||'').toUpperCase();
  if(explicit==='A-A'||explicit==='B-B'||explicit==='A-B')return explicit;
  if(explicit==='B-A')return'A-B';
  const left=String(node?.dataset?.leftSky||'').toUpperCase();
  const right=String(node?.dataset?.rightSky||'').toUpperCase();
  if(left&&right)return left===right?`${left}-${right}`:'A-B';
  return'A-B';
}
function matrixState(scope){
  const inputs=[...document.querySelectorAll(`[data-aspect-matrix-scope="${scope}"][data-aspect-matrix-aspect="all"]`)];
  if(!inputs.length)return'-';
  return inputs.map(input=>input.indeterminate?'~':input.checked?'1':'0').join('');
}
function family(scope){
  const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].filter(row=>mode(row)===scope);
  const classHidden=rows.filter(row=>row.classList.contains('sky-chart-aspect-multiselect-hidden')).length;
  const attrHidden=rows.filter(row=>row.hidden).length;
  const first=rows[0]||null;
  const display=first?getComputedStyle(first).display:'-';
  const firstClass=first?.classList.contains('sky-chart-aspect-multiselect-hidden')?'C':'-';
  const firstHidden=first?.hidden?'H':'-';
  const heading=document.querySelector(`#skyFoundationRelationshipList>.sky-relationship-scope-heading[data-relationship-scope-heading="${scope}"]`);
  const headingState=!heading?'-':heading.hidden?'H':getComputedStyle(heading).display==='none'?'D':'V';
  return `${scope}:n${rows.length}/c${classHidden}/h${attrHidden}/d${display}/1${firstClass}${firstHidden}/head${headingState}`;
}
function snapshot(){
  const count=document.getElementById('skyFoundationRelationshipCount')?.textContent?.trim()||'-';
  return `count=${count} M[${matrixState('A-A')},${matrixState('B-B')},${matrixState('A-B')}] ${family('A-A')} ${family('B-B')} ${family('A-B')}`;
}
function render(){
  if(!pre)return;
  pre.textContent=lines.join('\n');
  pre.scrollTop=pre.scrollHeight;
}
function write(label,extra=''){
  const t=(performance.now()-START).toFixed(1).padStart(7,' ');
  lines.push(`${t} ${label}${extra?' '+extra:''}\n  ${snapshot()}`);
  while(lines.length>MAX)lines.shift();
  window.__relphiScopeDiagnosticTrace=lines.slice();
  render();
}
function detailFor(name,event){
  const d=event?.detail||{};
  if(name==='relphi:sky-aspect-multiselect-changed')return `matrix=${d.matrix?'yes':'no'} scopes=${Array.isArray(d.scopes)?d.scopes.join(','):'-'}`;
  if(name==='relphi:sky-house-multiselect-changed')return `A=${d.A?.length??'-'} B=${d.B?.length??'-'}`;
  if(name==='relphi:sky-placement-multiselect-changed')return `A=${d.A?.length??'-'} B=${d.B?.length??'-'} source=${d.source||'-'}`;
  if(name==='relphi:sky-foundation-filter-changed')return `mode=${d.state?.mode||'none'} kind=${d.state?.kind||'-'}`;
  if(name==='relphi:sky-harmonic-window-visibility-changed')return `visible=${d.visible??'-'}/${d.total??'-'}`;
  return'';
}
function installPanel(){
  if(panel)return;
  panel=document.createElement('aside');
  panel.id='skyScopeDiagnostic';
  panel.setAttribute('aria-label','Aspect scope diagnostic trace');
  panel.innerHTML='<div class="sky-scope-diagnostic-head"><strong>Scope trace · diagnostic only</strong><button type="button" data-scope-trace-clear>Clear</button></div><pre></pre>';
  const style=document.createElement('style');
  style.textContent=`
#skyScopeDiagnostic{position:fixed;z-index:2147483647;left:8px;right:8px;bottom:8px;max-height:38vh;box-sizing:border-box;border:1px solid rgba(255,255,255,.28);border-radius:10px;background:rgba(20,20,20,.96);color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.35);font:600 10px/1.28 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden}
#skyScopeDiagnostic .sky-scope-diagnostic-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.18)}
#skyScopeDiagnostic .sky-scope-diagnostic-head strong{font:800 11px/1.2 system-ui,sans-serif}
#skyScopeDiagnostic button{min-height:26px;padding:3px 8px;border:1px solid rgba(255,255,255,.35);border-radius:7px;background:#2d2d2d;color:#fff;font:700 11px/1 system-ui,sans-serif}
#skyScopeDiagnostic pre{max-height:calc(38vh - 39px);margin:0;padding:7px 8px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;color:#fff;background:transparent;font:inherit}
`;
  document.head.appendChild(style);
  document.body.appendChild(panel);
  pre=panel.querySelector('pre');
  panel.querySelector('[data-scope-trace-clear]').addEventListener('click',()=>{lines.length=0;lastMutationSignature='';write('TRACE CLEARED')});
}
function bindListObserver(){
  const list=document.getElementById('skyFoundationRelationshipList');
  if(!list||list===observedList)return;
  listObserver?.disconnect();
  observedList=list;
  listObserver=new MutationObserver(records=>{
    const relevant=records.some(record=>{
      if(record.type==='childList')return true;
      const target=record.target;
      return target?.matches?.('.sky-foundation-relationship-row,.sky-relationship-scope-heading,.sky-relationship-family-heading');
    });
    if(!relevant||mutationQueued)return;
    mutationQueued=true;
    queueMicrotask(()=>{
      mutationQueued=false;
      const sig=snapshot();
      if(sig===lastMutationSignature)return;
      lastMutationSignature=sig;
      write('LIST MUTATION');
    });
  });
  listObserver.observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});
}
function phases(){
  queueMicrotask(()=>write('CHANGE microtask'));
  requestAnimationFrame(()=>{
    write('CHANGE raf1');
    requestAnimationFrame(()=>write('CHANGE raf2'));
  });
  setTimeout(()=>write('CHANGE t+0'),0);
  setTimeout(()=>write('CHANGE t+50'),50);
  setTimeout(()=>write('CHANGE t+250'),250);
  setTimeout(()=>write('CHANGE t+600'),600);
}
function start(){
  installPanel();
  bindListObserver();
  write('TRACE READY');
  document.addEventListener('change',event=>{
    const input=event.target.closest?.('[data-aspect-matrix-scope][data-aspect-matrix-aspect]');
    if(!input)return;
    write('CHANGE capture',`${input.dataset.aspectMatrixScope}/${input.dataset.aspectMatrixAspect} checked=${input.checked}`);
    phases();
  },true);
  const events=[
    'relphi:sky-aspect-multiselect-changed',
    'relphi:sky-house-multiselect-changed',
    'relphi:sky-placement-multiselect-changed',
    'relphi:sky-foundation-filter-changed',
    'relphi:sky-foundation-interactions-ready',
    'relphi:sky-intrasky-relationships-ready',
    'relphi:sky-intrasky-b-relationships-ready',
    'relphi:sky-harmonic-window-visibility-changed'
  ];
  events.forEach(name=>window.addEventListener(name,event=>{
    bindListObserver();
    write('EVENT '+name.replace('relphi:',''),detailFor(name,event));
  }));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();