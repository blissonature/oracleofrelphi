// Aspect scope matrix v3: the sole owner of per-aspect visibility across A↔A, B↔B, and A↔B.
// The legacy aspect controller remains responsible only for generating intrasky B relationships and its control shell.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyAspectScopeMatrixV2)return;
window.__relphiSkyAspectScopeMatrixV1=true;window.__relphiSkyAspectScopeMatrixV2=true;

const ASPECTS=Object.freeze([
  {id:'conjunction',label:'Conjunction'},
  {id:'semi-sextile',label:'Semi-Sextile'},
  {id:'octile',label:'Octile'},
  {id:'sextile',label:'Sextile'},
  {id:'quintile',label:'Quintile'},
  {id:'square',label:'Square'},
  {id:'trine',label:'Trine'},
  {id:'tri-octile',label:'Tri-Octile'},
  {id:'bi-quintile',label:'Bi-Quintile'},
  {id:'quincunx',label:'Quincunx'},
  {id:'opposition',label:'Opposition'}
]);
const IDS=Object.freeze(ASPECTS.map(item=>item.id));
const SCOPES=Object.freeze([
  {id:'A-A',label:'A↔A'},
  {id:'B-B',label:'B↔B'},
  {id:'A-B',label:'A↔B'}
]);
const state=Object.fromEntries(SCOPES.map(scope=>[scope.id,new Set(IDS)]));
let queued=false;
let applying=false;
let menuObserver=null;

function normalize(value){
  const key=String(value||'').trim().toLowerCase().replace(/[ _]+/g,'-');
  return({semisextile:'semi-sextile','semi-sextile':'semi-sextile',semisquare:'octile','semi-square':'octile',sesquisquare:'tri-octile','sesqui-square':'tri-octile',sesquiquadrate:'tri-octile',biquintile:'bi-quintile',inconjunct:'quincunx'})[key]||key;
}
function bActive(){
  const html=document.documentElement;
  return html.dataset.skyBEditing==='true'||html.dataset.skyBPresent==='true'||html.dataset.skyLastMode==='comparison';
}
function activeScopes(){return bActive()?SCOPES.map(scope=>scope.id):['A-A']}
function control(){return document.querySelector('[data-aspect-filter="combined"]')}
function popover(){return document.getElementById('skyChartAspectPopover')}
function relationshipMode(node){
  const explicit=String(node?.dataset?.relationshipMode||'').toUpperCase();
  if(explicit==='A-A'||explicit==='B-B'||explicit==='A-B')return explicit;
  if(explicit==='B-A')return'A-B';
  const left=String(node?.dataset?.leftSky||'').toUpperCase(),right=String(node?.dataset?.rightSky||'').toUpperCase();
  if(left&&right)return left===right?`${left}-${right}`:'A-B';
  const single=String(node?.dataset?.singleSky||'').toUpperCase();
  if(single==='A'||single==='B')return`${single}-${single}`;
  return'A-B';
}
function cells(scope,aspect){
  const scopes=scope==='all'?activeScopes():activeScopes().includes(scope)?[scope]:[];
  const aspects=aspect==='all'?IDS:IDS.includes(aspect)?[aspect]:[];
  const out=[];
  scopes.forEach(scopeId=>aspects.forEach(aspectId=>out.push([scopeId,aspectId])));
  return out;
}
function cellState(scope,aspect){
  const target=cells(scope,aspect);
  const selected=target.filter(([scopeId,aspectId])=>state[scopeId].has(aspectId)).length;
  return{available:target.length,selected,checked:target.length>0&&selected===target.length,indeterminate:selected>0&&selected<target.length};
}
function setCells(scope,aspect,checked){cells(scope,aspect).forEach(([scopeId,aspectId])=>checked?state[scopeId].add(aspectId):state[scopeId].delete(aspectId))}
function choice(scope,aspect,labelText,summary=false){
  const label=document.createElement('label');
  label.className=`sky-chart-aspect-matrix-choice${summary?' sky-chart-aspect-matrix-choice-summary':''}`;
  const input=document.createElement('input');
  input.type='checkbox';input.dataset.aspectMatrixScope=scope;input.dataset.aspectMatrixAspect=aspect;input.setAttribute('aria-label',labelText);
  const text=document.createElement('span');
  text.textContent=scope==='all'?'All':SCOPES.find(item=>item.id===scope)?.label||scope;
  label.append(input,text);return label;
}
function matrixRow(aspect,labelText,master=false){
  const row=document.createElement('div');
  row.className=`sky-chart-aspect-list-item${master?' sky-chart-aspect-list-item-master':''}`;row.dataset.aspectMatrixRow=aspect;
  const label=document.createElement('strong');label.className='sky-chart-aspect-list-label';label.textContent=labelText;
  const choices=document.createElement('div');choices.className='sky-chart-aspect-list-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label',labelText);
  choices.append(choice('all',aspect,`${labelText}: all relationship scopes`),...SCOPES.map(scope=>choice(scope.id,aspect,`${labelText}: ${scope.label}`)));
  row.append(label,choices);return row;
}
function renderPopover(){
  const body=popover()?.querySelector('.sky-chart-aspect-filter-body');if(!body)return;
  const list=document.createElement('div');list.className='sky-chart-aspect-list sky-chart-aspect-matrix-list';list.dataset.aspectList='matrix';
  const header=document.createElement('div');header.className='sky-chart-aspect-list-header';
  const title=document.createElement('strong');title.textContent='Aspect';
  const cols=document.createElement('div');cols.className='sky-chart-aspect-list-header-choices';
  ['All','A↔A','B↔B','A↔B'].forEach(text=>{const span=document.createElement('span');span.textContent=text;cols.appendChild(span)});
  header.append(title,cols);list.append(header,matrixRow('all','All aspects',true));ASPECTS.forEach(aspect=>list.appendChild(matrixRow(aspect.id,aspect.label)));
  body.replaceChildren(list);
}
function renderClosedSummary(owner){
  const head=owner?.querySelector('.sky-chart-aspect-filter-head');if(!head)return;
  head.querySelector('.sky-chart-aspect-filter-value')?.remove();
  let summary=head.querySelector('.sky-chart-aspect-summary-choices');
  if(!summary){
    summary=document.createElement('div');summary.className='sky-chart-aspect-summary-choices';summary.setAttribute('role','group');summary.setAttribute('aria-label','All aspects by relationship scope');
    summary.append(choice('all','all','All aspects in all relationship scopes',true),...SCOPES.map(scope=>choice(scope.id,'all',`All aspects in ${scope.label}`,true)));
    const toggle=head.querySelector('[data-aspect-filter-toggle]');head.insertBefore(summary,toggle||null);
  }
}
function updateInputs(){
  document.querySelectorAll('[data-aspect-matrix-scope][data-aspect-matrix-aspect]').forEach(input=>{
    const current=cellState(input.dataset.aspectMatrixScope,input.dataset.aspectMatrixAspect);
    input.checked=current.checked;input.indeterminate=current.indeterminate;input.disabled=current.available===0;
  });
}
function updateCount(){
  requestAnimationFrame(()=>{
    const rows=[...document.querySelectorAll('.sky-foundation-relationship-row')].filter(row=>!row.classList.contains('sky-foundation-single-sky-cross-hidden'));
    const shown=rows.filter(row=>!row.hidden&&!row.classList.contains('sky-chart-filter-hidden')&&!row.classList.contains('sky-chart-orb-hidden')&&!row.classList.contains('sky-orb-filter-hidden')&&!row.classList.contains('sky-chart-multiselect-hidden')&&!row.classList.contains('sky-chart-house-multiselect-hidden')&&!row.classList.contains('sky-chart-aspect-multiselect-hidden')&&!row.classList.contains('sky-chart-sign-filter-hidden')&&!row.classList.contains('sky-chart-semantic-hidden')).length;
    const count=document.getElementById('skyFoundationRelationshipCount'),empty=document.getElementById('skyFoundationRelationshipEmpty');
    if(count)count.textContent=`${shown}/${rows.length}`;if(empty)empty.hidden=shown!==0;
  });
}
function visible(node){const aspect=normalize(node?.dataset?.aspect||'');if(!aspect)return true;return!!state[relationshipMode(node)]?.has(aspect)}
function applyMatrix({announce=true}={}){
  applying=true;
  document.querySelectorAll('.sky-foundation-relationship-row,[data-layer="aspects"]>.sky-foundation-aspect').forEach(node=>node.classList.toggle('sky-chart-aspect-multiselect-hidden',!visible(node)));
  updateInputs();
  const matrix=Object.fromEntries(SCOPES.map(scope=>[scope.id,IDS.filter(id=>state[scope.id].has(id))]));
  const scopes=SCOPES.filter(scope=>state[scope.id].size>0).map(scope=>scope.id);
  const selected=IDS.filter(id=>SCOPES.some(scope=>state[scope.id].has(id)));
  document.documentElement.dataset.skyAspectMatrix='ready';
  document.documentElement.dataset.skyAspectMultiselect='ready';
  document.documentElement.dataset.skyAspectSelection=`${selected.length}/${IDS.length}`;
  document.documentElement.dataset.skyRelationshipScopeSelection=scopes.join(',');
  updateCount();
  if(announce)window.dispatchEvent(new CustomEvent('relphi:sky-aspect-multiselect-changed',{detail:{selected,scopes,matrix}}));
  applying=false;
}
function positionPopover(){
  const owner=control(),menu=popover(),head=owner?.querySelector('.sky-chart-aspect-filter-head');
  if(!owner?.classList.contains('is-open')||!menu?.classList.contains('is-portaled')||menu.hidden||!head)return;
  const rect=head.getBoundingClientRect(),margin=10,width=Math.min(400,Math.max(0,window.innerWidth-margin*2));
  const left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left+rect.width/2-width/2));
  const below=window.innerHeight-rect.bottom-margin,above=rect.top-margin,maxHeight=Math.max(220,Math.min(520,Math.max(below,above)));
  const top=below<260&&above>below?Math.max(margin,rect.top-maxHeight-6):Math.min(window.innerHeight-maxHeight-margin,rect.bottom+6);
  menu.style.left=`${left}px`;menu.style.top=`${Math.max(margin,top)}px`;menu.style.maxHeight=`${maxHeight}px`;
}
function ensureMenuObserver(){
  const menu=popover();if(!menu||menu.dataset.aspectMatrixObserved==='true')return;
  menu.dataset.aspectMatrixObserved='true';menuObserver?.disconnect();menuObserver=new MutationObserver(()=>requestAnimationFrame(positionPopover));menuObserver.observe(menu,{attributes:true,attributeFilter:['class','hidden']});
}
function ensureUI(){
  const owner=control();if(!owner)return false;
  renderClosedSummary(owner);if(!popover()?.querySelector('[data-aspect-list="matrix"]'))renderPopover();ensureMenuObserver();updateInputs();return true;
}
function handleChange(event){
  const input=event.target.closest?.('[data-aspect-matrix-scope][data-aspect-matrix-aspect]');if(!input)return;
  setCells(input.dataset.aspectMatrixScope,input.dataset.aspectMatrixAspect,input.checked);applyMatrix();
}
function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}
function refresh(){queued=false;if(whereWhenEditing()||!ensureUI())return;applyMatrix({announce:false});positionPopover()}
function schedule(){if(queued||applying||whereWhenEditing())return;queued=true;requestAnimationFrame(refresh)}
function handleLegacyAspectPass(event){
  if(event.detail?.matrix)return;
  schedule();
}
function start(){
  schedule();document.addEventListener('change',handleChange);
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-single-sky-aspects-rendered','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-foundation-filter-changed','relphi:sky-where-when-committed'].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener('relphi:sky-aspect-multiselect-changed',handleLegacyAspectPass);
  window.addEventListener('storage',event=>{if(!event.key||event.key==='relphiSkyChartB')schedule()});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-sky-b-present','data-sky-last-mode','data-sky-b-editing']});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-aspect-filter-toggle]'))requestAnimationFrame(positionPopover)});
  window.addEventListener('resize',positionPopover);window.addEventListener('scroll',positionPopover,true);window.visualViewport?.addEventListener('resize',positionPopover);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();