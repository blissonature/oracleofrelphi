// Relationship sorting: preserve Most Exact First as the default and add Aspect Type / transit-length modes.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipSortV1)return;
window.__relphiRelationshipSortV1=true;

const MODES=Object.freeze({
  exact:'exact',
  aspect:'aspect',
  longest:'transit-longest',
  shortest:'transit-shortest'
});
const ASPECT_ORDER=Object.freeze([
  'conjunction','opposition','trine','square','sextile',
  'quincunx','semi-sextile','quintile','bi-quintile','octile','tri-octile'
]);
const ASPECT_RANK=new Map(ASPECT_ORDER.map((id,index)=>[id,index]));
let mode=MODES.exact;
let calculationGeneration=0;
let busy=false;

function number(row,key,fallback=Infinity){
  const value=Number(row?.dataset?.[key]);
  return Number.isFinite(value)?value:fallback;
}
function relationOrdinal(row){
  const raw=String(row?.dataset?.relationIndex||'');
  const match=raw.match(/(\d+)(?!.*\d)/);
  return match?Number(match[1]):Infinity;
}
function compareExact(a,b){
  return number(a,'phaseError')-number(b,'phaseError') ||
    number(a,'harmonicOrder')-number(b,'harmonicOrder') ||
    number(a,'sourceOrb')-number(b,'sourceOrb') ||
    relationOrdinal(a)-relationOrdinal(b);
}
function compareAspect(a,b){
  const ar=ASPECT_RANK.get(String(a?.dataset?.aspect||''))??999;
  const br=ASPECT_RANK.get(String(b?.dataset?.aspect||''))??999;
  return ar-br||compareExact(a,b);
}
function transitDuration(row){
  const value=Number(row?.dataset?.transitDurationDays);
  return Number.isFinite(value)?value:null;
}
function compareTransit(a,b,direction){
  const ad=transitDuration(a),bd=transitDuration(b);
  if(ad!=null&&bd!=null)return direction*(ad-bd)||compareExact(a,b);
  if(ad!=null)return-1;
  if(bd!=null)return 1;
  return compareExact(a,b);
}
function compareRows(a,b){
  if(mode===MODES.aspect)return compareAspect(a,b);
  if(mode===MODES.longest)return compareTransit(a,b,-1);
  if(mode===MODES.shortest)return compareTransit(a,b,1);
  return compareExact(a,b);
}
function currentMode(){return mode}
function dispatch(){
  document.documentElement.dataset.skyRelationshipSort=mode;
  window.dispatchEvent(new CustomEvent('relphi:relationship-sort-changed',{detail:{mode}}));
}
function installStyles(){
  if(document.getElementById('skyRelationshipSortV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyRelationshipSortV1Styles';
  style.textContent=`
.sky-relationship-sort-control{display:flex;align-items:center;min-width:0}
.sky-relationship-sort-select{appearance:auto;-webkit-appearance:menulist;box-sizing:border-box;width:142px;max-width:142px;height:29px;margin:0;padding:0 6px;border:1px solid rgba(31,27,24,.18);border-radius:999px;background:#fff;color:#332e2a;font:800 .64rem/1 system-ui,sans-serif;cursor:pointer}
.sky-relationship-sort-select:hover,.sky-relationship-sort-select:focus-visible{border-color:#6b625a;outline:0;background:#fffdfa}
.sky-relationship-sort-select[aria-busy="true"]{cursor:progress;opacity:.66}
@media(max-width:620px){.sky-relationship-sort-select{width:126px;max-width:126px;height:27px;padding-inline:5px;font-size:.59rem}}
`;
  document.head.appendChild(style);
}
function ensureControl(){
  installStyles();
  const heading=document.querySelector('#skyFoundationRelationships .sky-foundation-relationships-heading');
  if(!heading)return null;
  let actions=heading.querySelector(':scope>.sky-relationship-heading-actions');
  if(!actions){
    actions=document.createElement('span');
    actions.className='sky-relationship-heading-actions';
    const clear=heading.querySelector('#skyFoundationClearIsolation');
    heading.insertBefore(actions,clear||null);
  }
  let control=actions.querySelector(':scope>.sky-relationship-sort-control');
  if(!control){
    control=document.createElement('label');
    control.className='sky-relationship-sort-control';
    const select=document.createElement('select');
    select.className='sky-relationship-sort-select';
    select.dataset.relationshipSort='true';
    select.setAttribute('aria-label','Sort relationships');
    select.title='Sort relationships';
    [
      [MODES.exact,'Most Exact First'],
      [MODES.aspect,'Aspect Type'],
      [MODES.longest,'Longest Transit First'],
      [MODES.shortest,'Shortest Transit First']
    ].forEach(([value,label])=>{
      const option=document.createElement('option');
      option.value=value;
      option.textContent=label;
      select.appendChild(option);
    });
    select.value=mode;
    select.addEventListener('change',()=>setMode(select.value));
    control.appendChild(select);
    actions.prepend(control);
  }
  const select=control.querySelector('select');
  if(select&&select.value!==mode)select.value=mode;
  if(select){
    select.setAttribute('aria-busy',busy?'true':'false');
    select.title=busy?'Calculating transit lengths…':'Sort relationships';
  }
  return select;
}
function idle(){
  return new Promise(resolve=>{
    if('requestIdleCallback'in window)requestIdleCallback(resolve,{timeout:80});
    else setTimeout(()=>resolve({timeRemaining:()=>8,didTimeout:true}),0);
  });
}
async function prepareTransitSort(){
  const generation=++calculationGeneration;
  const api=window.RelphiRelationshipTransitMeta;
  if(!api?.durationDaysForRow){
    busy=false;
    ensureControl();
    dispatch();
    return;
  }
  busy=true;
  ensureControl();
  const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
  let index=0;
  while(index<rows.length){
    const deadline=await idle();
    if(generation!==calculationGeneration)return;
    let processed=0;
    while(index<rows.length&&(processed<1||deadline.timeRemaining()>4)){
      api.durationDaysForRow(rows[index]);
      index+=1;
      processed+=1;
    }
  }
  if(generation!==calculationGeneration)return;
  busy=false;
  ensureControl();
  dispatch();
}
function setMode(next){
  if(!Object.values(MODES).includes(next))next=MODES.exact;
  mode=next;
  calculationGeneration+=1;
  busy=false;
  ensureControl();
  if(mode===MODES.longest||mode===MODES.shortest){
    prepareTransitSort();
    return;
  }
  dispatch();
}
function refreshForRows(){
  ensureControl();
  if(mode===MODES.longest||mode===MODES.shortest){
    prepareTransitSort();
    return;
  }
  if(mode!==MODES.exact)dispatch();
}
function invalidateTransit(){
  window.RelphiRelationshipTransitMeta?.clearDurationCache?.();
  if(mode===MODES.longest||mode===MODES.shortest)prepareTransitSort();
}
window.RelphiRelationshipSort=Object.freeze({
  compareRows,
  mode:currentMode,
  setMode
});

function start(){
  ensureControl();
  [
    'relphi:sky-foundation-ready',
    'relphi:sky-foundation-interactions-ready',
    'relphi:sky-intrasky-relationships-ready',
    'relphi:sky-intrasky-b-relationships-ready'
  ].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(refreshForRows)));
  [
    'relphi:sky-harmonic-window-visibility-changed',
    'relphi:sky-live-origin-changed'
  ].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(invalidateTransit)));
  const root=document.getElementById('skyFoundationRoot');
  if(root)new MutationObserver(()=>requestAnimationFrame(ensureControl)).observe(root,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();