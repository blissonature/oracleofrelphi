// Aspect scope matrix v4: the sole owner of per-aspect visibility and popover geometry across A↔A, B↔B, and A↔B.
// The legacy aspect controller remains responsible only for generating intrasky B relationships and its control shell.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyAspectScopeMatrixV2)return;
window.__relphiSkyAspectScopeMatrixV1=true;window.__relphiSkyAspectScopeMatrixV2=true;

const catalogue=window.RelphiHarmonicAspectCatalog;
if(!catalogue)throw new Error('Canonical harmonic aspect catalogue is unavailable.');
const ASPECTS=catalogue.aspects;
const IDS=Object.freeze(catalogue.legacyIds);
const SIGN_ASPECTS=Object.freeze(['conjunction','semi-sextile','sextile','square','trine','quincunx','opposition']);
const SIGN_STEPS=Object.freeze({conjunction:0,'semi-sextile':1,sextile:2,square:3,trine:4,quincunx:5,opposition:6});
// New By Sign preferences start disabled; preserve choices only after explicit selection in this version.
const SIGN_STORAGE='relphiSkyAspectBySignV2';
const signSelected=new Set();
try{const saved=JSON.parse(localStorage.getItem(SIGN_STORAGE)||'[]');if(Array.isArray(saved))saved.filter(id=>SIGN_ASPECTS.includes(id)).forEach(id=>signSelected.add(id))}catch(_){}
window.RelphiSkyBySign={selected:signSelected,steps:SIGN_STEPS,enabled:id=>signSelected.has(id)};
const GROUPS=Object.freeze([
  {id:'major',label:'Major',aspects:['conjunction','opposition','trine','square','sextile']},
  {id:'minor',label:'Minor',aspects:['semi-sextile','octile','tri-octile','quincunx']},
  {id:'harmonic',label:'Fifth Harmonic',aspects:['quintile','bi-quintile']},
  // Extended harmonic orders are explored in Relationships, not listed here.
]);
const GROUP_MAP=new Map(GROUPS.map(group=>[group.id,group]));
const SCOPES=Object.freeze([
  {id:'A-A',label:'A↔A'},
  {id:'B-B',label:'B↔B'},
  {id:'A-B',label:'A↔B'}
]);
const STORAGE_KEY='relphiSkyAspectMatrixV1';
const state=Object.fromEntries(SCOPES.map(scope=>[scope.id,new Set(catalogue.legacyIds)]));
(function loadPersistedState(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!saved||typeof saved!=='object')return;SCOPES.forEach(scope=>{if(Array.isArray(saved[scope.id]))state[scope.id]=new Set(saved[scope.id].filter(id=>IDS.includes(id)))})}catch(_){}})();
let queued=false;
let applying=false;
let menuObserver=null;
let lastScopeSignature='';
let openGeometry=null;

function normalize(value){
  const key=String(value||'').trim().toLowerCase().replace(/[ _]+/g,'-');
  return(catalogue.byId(key)?.id||({semisextile:'semi-sextile','semi-sextile':'semi-sextile',semisquare:'octile','semi-square':'octile',sesquisquare:'tri-octile','sesqui-square':'tri-octile',sesquiquadrate:'tri-octile',biquintile:'bi-quintile',inconjunct:'quincunx'})[key]||key);
}
function bActive(){
  try{window.RelphiSkyStartupMode?.syncRoot?.()}catch(_){}
  const html=document.documentElement;
  return html.dataset.skyBEditing==='true'||html.dataset.skyBPresent==='true';
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
  const groupId=String(aspect||'').startsWith('group:')?String(aspect).slice(6):'';
  const aspects=aspect==='all'?IDS:GROUP_MAP.has(groupId)?GROUP_MAP.get(groupId).aspects:IDS.includes(aspect)?[aspect]:[];
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
function matrixRow(aspect,labelText,master=false,angle=null){
  const row=document.createElement('div');
  row.className=`sky-chart-aspect-list-item${master?' sky-chart-aspect-list-item-master':''}`;
  row.dataset.aspectMatrixRow=aspect;
  row.dataset.aspectListItem=aspect;
  const label=document.createElement('strong');label.className='sky-chart-aspect-list-label';
  if(Number.isFinite(angle)){
    const degree=document.createElement('span');
    degree.className='sky-chart-aspect-degree';
    degree.setAttribute('aria-hidden','true');
    const value=document.createElement('span');value.className='sky-chart-aspect-degree-value';value.textContent=Number(angle.toFixed(2)).toString();
    const mark=document.createElement('span');mark.className='sky-chart-aspect-degree-mark';mark.textContent='°';
    degree.append(value,mark);
    label.appendChild(degree);
  }
  const name=document.createElement('span');name.className='sky-chart-aspect-name';name.textContent=labelText;label.appendChild(name);
  const choices=document.createElement('div');choices.className='sky-chart-aspect-list-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label',Number.isFinite(angle)?`${labelText}, ${angle} degrees`:labelText);
  const scopes=SCOPES.filter(scope=>activeScopes().includes(scope.id));
  choices.append(choice('all',aspect,`${labelText}: all relationship scopes`),...scopes.map(scope=>choice(scope.id,aspect,`${labelText}: ${scope.label}`)));
  row.append(label,choices);return row;
}
function signChoice(id){
  const wrap=document.createElement('label');wrap.className='sky-chart-by-sign-choice';
  const input=document.createElement('input');input.type='checkbox';input.dataset.skyBySign=id;
  input.setAttribute('aria-label',id==='all'?'By Sign: all seven aspects':`By Sign: ${id}`);
  wrap.append(input);return wrap;
}
function renderPopover(){
  const body=popover()?.querySelector('.sky-chart-aspect-filter-body');if(!body)return;
  const list=document.createElement('div');list.className='sky-chart-aspect-list sky-chart-aspect-matrix-list';list.dataset.aspectList='matrix';
  const header=document.createElement('div');header.className='sky-chart-aspect-list-header';
  const title=document.createElement('strong');title.textContent='Aspect';
  const cols=document.createElement('div');cols.className='sky-chart-aspect-list-header-choices';
  const labels=bActive()?['All','A↔A','B↔B','A↔B']:['All','A↔A'];
  labels.forEach(text=>{const span=document.createElement('span');span.textContent=text;cols.appendChild(span)});
  const signHeader=document.createElement('span');signHeader.className='sky-chart-by-sign-heading';signHeader.textContent='By Sign';
  header.append(title,signHeader,cols);list.append(header,matrixRow('all','All aspects',true));
  const master=list.lastElementChild;master.insertBefore(signChoice('all'),master.querySelector('.sky-chart-aspect-list-choices'));
  GROUPS.forEach(group=>{
    const groupRow=matrixRow('group:'+group.id,group.label,true);
    groupRow.classList.add('sky-chart-aspect-category-row');
    groupRow.dataset.aspectCategory=group.id;
    if(group.id==='major'||group.id==='minor')groupRow.insertBefore(signChoice('group:'+group.id),groupRow.querySelector('.sky-chart-aspect-list-choices'));
    const isExpandedByDefault=!group.id.startsWith('order-');
    if(!isExpandedByDefault){
      const expand=document.createElement('button');expand.type='button';
      expand.dataset.harmonicExpand=group.id;expand.textContent='Show';
      expand.setAttribute('aria-expanded','false');
      expand.setAttribute('aria-label','Show '+group.label+' aspect choices');
      groupRow.querySelector('.sky-chart-aspect-list-label')?.appendChild(expand);
    }
    list.appendChild(groupRow);
    group.aspects.forEach(id=>{
      const aspect=ASPECTS.find(item=>item.id===id);
      if(aspect){
        const row=matrixRow(aspect.id,aspect.label,false,Math.round(aspect.angle*1000)/1000);
        if(!isExpandedByDefault){row.dataset.harmonicGroupItem=group.id;row.style.display='none'}
        if(SIGN_ASPECTS.includes(aspect.id))row.insertBefore(signChoice(aspect.id),row.querySelector('.sky-chart-aspect-list-choices'));
        list.appendChild(row);
      }
    });
  });
  body.replaceChildren(list);
  window.dispatchEvent(new Event('relphi:sky-aspect-filter-rendered'));
}
function renderClosedSummary(owner){
  const head=owner?.querySelector('.sky-chart-aspect-filter-head');if(!head)return;
  head.querySelector('.sky-chart-aspect-filter-value')?.remove();
  let summary=head.querySelector('.sky-chart-aspect-summary-choices');
  if(!summary){
    summary=document.createElement('div');summary.className='sky-chart-aspect-summary-choices';summary.setAttribute('role','group');summary.setAttribute('aria-label','All aspects by relationship scope');
    const toggle=head.querySelector('[data-aspect-filter-toggle]');head.insertBefore(summary,toggle||null);
  }
  const scopes=SCOPES.filter(scope=>activeScopes().includes(scope.id));
  summary.replaceChildren(choice('all','all','All aspects in all relationship scopes',true),...scopes.map(scope=>choice(scope.id,'all',`All aspects in ${scope.label}`,true)));
}
function updateInputs(){
  document.querySelectorAll('[data-sky-by-sign]').forEach(input=>{
    const id=input.dataset.skyBySign;
    const ids=id==='all'?SIGN_ASPECTS:id.startsWith('group:')?(GROUP_MAP.get(id.slice(6))?.aspects||[]).filter(value=>SIGN_ASPECTS.includes(value)):[id];
    const count=ids.filter(value=>signSelected.has(value)).length;
    input.checked=ids.length>0&&count===ids.length;
    input.indeterminate=count>0&&count<ids.length;
  });
  document.querySelectorAll('[data-aspect-matrix-scope][data-aspect-matrix-aspect]').forEach(input=>{
    const current=cellState(input.dataset.aspectMatrixScope,input.dataset.aspectMatrixAspect);
    input.checked=current.checked;input.indeterminate=current.indeterminate;input.disabled=current.available===0;
  });
}
function updateCount(){
  requestAnimationFrame(()=>{
    const active=new Set(activeScopes());
    const rows=[...document.querySelectorAll('.sky-foundation-relationship-row')].filter(row=>!row.classList.contains('sky-foundation-single-sky-cross-hidden')&&active.has(relationshipMode(row)));
    const shown=rows.filter(row=>!row.hidden&&!row.classList.contains('sky-chart-filter-hidden')&&!row.classList.contains('sky-chart-orb-hidden')&&!row.classList.contains('sky-orb-filter-hidden')&&!row.classList.contains('sky-chart-multiselect-hidden')&&!row.classList.contains('sky-chart-house-multiselect-hidden')&&!row.classList.contains('sky-chart-aspect-multiselect-hidden')&&!row.classList.contains('sky-chart-sign-filter-hidden')&&!row.classList.contains('sky-chart-semantic-hidden')).length;
    const count=document.getElementById('skyFoundationRelationshipCount'),empty=document.getElementById('skyFoundationRelationshipEmpty');
    if(count)count.textContent=`${shown}/${rows.length}`;if(empty)empty.hidden=shown!==0;
  });
}
function visible(node){const mode=relationshipMode(node);if(!activeScopes().includes(mode))return false;const aspect=normalize(node?.dataset?.aspect||'');const explorer=window.RelphiHarmonicExplorer;if(explorer?.enabled())return explorer.matches(aspect)&&state[mode]?.size>0;if(node?.dataset?.bySignOnly==='true')return signSelected.has(aspect);if(!aspect)return true;const anySelected=activeScopes().some(scope=>state[scope]?.size>0);if(!anySelected)return false;return!!state[mode]?.has(aspect)}
function applyMatrix({announce=true}={}){
  applying=true;
  document.querySelectorAll('.sky-foundation-relationship-row,[data-layer="aspects"]>.sky-foundation-aspect').forEach(node=>node.classList.toggle('sky-chart-aspect-multiselect-hidden',!visible(node)));
  updateInputs();
  const matrix=Object.fromEntries(SCOPES.map(scope=>[scope.id,IDS.filter(id=>state[scope.id].has(id))]));
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(matrix))}catch(_){}
  const active=new Set(activeScopes());
  const scopes=SCOPES.filter(scope=>active.has(scope.id)&&(state[scope.id].size>0||signSelected.size>0)).map(scope=>scope.id);
  const selected=window.RelphiHarmonicExplorer?.enabled()?ASPECTS.filter(a=>window.RelphiHarmonicExplorer.matches(a.id)).map(a=>a.id):IDS.filter(id=>signSelected.has(id)||SCOPES.some(scope=>active.has(scope.id)&&state[scope.id].has(id)));
  document.documentElement.dataset.skyAspectMatrix='ready';
  document.documentElement.dataset.skyAspectMultiselect='ready';
  document.documentElement.dataset.skyAspectSelection=`${selected.length}/${IDS.length}`;
  document.documentElement.dataset.skyRelationshipScopeSelection=scopes.join(',');
  updateCount();
  if(announce)window.dispatchEvent(new CustomEvent('relphi:sky-aspect-multiselect-changed',{detail:{selected,scopes,matrix}}));
  window.dispatchEvent(new CustomEvent('relphi:sky-aspect-visibility-applied',{detail:{selected,scopes,matrix}}));
  applying=false;
}
function positionPopover({reset=false}={}){
  const owner=control(),menu=popover(),head=owner?.querySelector('.sky-chart-aspect-filter-head');
  if(!owner?.classList.contains('is-open')||!menu?.classList.contains('is-portaled')||menu.hidden||!head){openGeometry=null;return}
  if(reset||!openGeometry){
    const rect=head.getBoundingClientRect(),margin=10;
    const measuredWidth=menu.getBoundingClientRect().width;
    const width=measuredWidth>0?measuredWidth:Math.min(400,Math.max(0,window.innerWidth-margin*2));
    const left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left+rect.width/2-width/2));
    const below=window.innerHeight-rect.bottom-margin,above=rect.top-margin,maxHeight=Math.max(220,Math.min(520,Math.max(below,above)));
    const top=below<260&&above>below?Math.max(margin,rect.top-maxHeight-6):Math.min(window.innerHeight-maxHeight-margin,rect.bottom+6);
    openGeometry={left,top:Math.max(margin,top),maxHeight};
  }
  menu.style.setProperty('--sky-aspect-popover-left',`${openGeometry.left}px`);
  menu.style.setProperty('--sky-aspect-popover-top',`${openGeometry.top}px`);
  menu.style.setProperty('--sky-aspect-popover-max-height',`${openGeometry.maxHeight}px`);
}
function ensureMenuObserver(){
  const menu=popover();if(!menu||menu.dataset.aspectMatrixObserved==='true')return;
  menu.dataset.aspectMatrixObserved='true';menuObserver?.disconnect();menuObserver=new MutationObserver(()=>requestAnimationFrame(positionPopover));menuObserver.observe(menu,{attributes:true,attributeFilter:['class','hidden']});
}
function ensureUI(){
  const owner=control();if(!owner)return false;
  renderClosedSummary(owner);if(!popover()?.querySelector('[data-aspect-list="matrix"]'))renderPopover();ensureMenuObserver();updateInputs();return true;
}
function handleHarmonicExpand(event){
  const button=event.target.closest?.('[data-harmonic-expand]');if(!button)return;
  const group=button.dataset.harmonicExpand;
  const expanded=button.getAttribute('aria-expanded')!=='true';
  button.setAttribute('aria-expanded',String(expanded));
  button.setAttribute('aria-label',(expanded?'Hide ':'Show ')+group+' aspect choices');
  button.textContent=expanded?'Hide':'Show';
  document.querySelectorAll('[data-harmonic-group-item]').forEach(row=>{
    if(row.dataset.harmonicGroupItem===group)row.style.display=expanded?'':'none';
  });
  requestAnimationFrame(positionPopover);
}
function handleChange(event){
  const signInput=event.target.closest?.('[data-sky-by-sign]');
  if(signInput){
    const id=signInput.dataset.skyBySign;
    const ids=id==='all'?SIGN_ASPECTS:id.startsWith('group:')?(GROUP_MAP.get(id.slice(6))?.aspects||[]).filter(value=>SIGN_ASPECTS.includes(value)):[id];
    ids.forEach(value=>signInput.checked?signSelected.add(value):signSelected.delete(value));
    try{localStorage.setItem(SIGN_STORAGE,JSON.stringify([...signSelected]))}catch(_){}
    applyMatrix();window.dispatchEvent(new CustomEvent('relphi:sky-by-sign-changed',{detail:{selected:[...signSelected]}}));return;
  }
  const input=event.target.closest?.('[data-aspect-matrix-scope][data-aspect-matrix-aspect]');if(!input)return;
  setCells(input.dataset.aspectMatrixScope,input.dataset.aspectMatrixAspect,input.checked);applyMatrix();
}
function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}
function refresh(){queued=false;if(whereWhenEditing())return;const scopeSignature=bActive()?'A+B':'A',scopeChanged=scopeSignature!==lastScopeSignature;lastScopeSignature=scopeSignature;if(!ensureUI())return;if(scopeChanged)renderPopover();renderClosedSummary(control());updateInputs();applyMatrix({announce:false});positionPopover()}
function schedule(){if(queued||applying||whereWhenEditing())return;queued=true;requestAnimationFrame(refresh)}
function handleLegacyAspectPass(event){
  if(event.detail?.matrix)return;
  schedule();
}
function start(){
  schedule();document.addEventListener('change',handleChange);document.addEventListener('click',handleHarmonicExpand);
  window.addEventListener('relphi:harmonic-explorer-changed',()=>applyMatrix());
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-single-sky-aspects-rendered','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-foundation-filter-changed','relphi:sky-b-removed','relphi:sky-b-restored','relphi:sky-configuration-selection-changed','relphi:sky-configurations-detected'].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener('relphi:sky-aspect-multiselect-changed',handleLegacyAspectPass);
  window.addEventListener('storage',event=>{if(!event.key||event.key==='relphiSkyChartB')schedule()});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-sky-b-present','data-sky-b-editing']});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-aspect-filter-toggle],[data-aspect-filter-value]'))requestAnimationFrame(()=>positionPopover({reset:true}))});
  window.addEventListener('resize',()=>positionPopover({reset:true}));window.addEventListener('scroll',positionPopover,true);window.visualViewport?.addEventListener('resize',()=>positionPopover({reset:true}));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();