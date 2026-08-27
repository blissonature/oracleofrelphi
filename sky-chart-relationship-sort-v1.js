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
#skyFoundationRelationships .sky-chart-filter-bar>.sky-relationship-sort-control{align-self:end!important;min-width:0!important}
#skyFoundationRelationships .sky-relationship-sort-control>span{align-self:end;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--sky-filter-label-color,#4e463f);font:var(--sky-filter-label-font,800 .62rem/1.2 system-ui,sans-serif)}
#skyFoundationRelationships .sky-relationship-sort-select[aria-busy="true"]{cursor:progress!important;opacity:.66}
@media(min-width:901px){
  #skyFoundationRelationships .sky-chart-filter-bar>.sky-relationship-sort-control{grid-column:3/span 2!important}
}
`;
  document.head.appendChild(style);
}
function ensureControl(){
  installStyles();
  const relationships=document.getElementById('skyFoundationRelationships');
  const bar=relationships?.querySelector('.sky-chart-filter-bar');
  if(!bar)return null;

  const headingControl=relationships.querySelector('.sky-foundation-relationships-heading .sky-relationship-sort-control');
  headingControl?.remove();

  let control=bar.querySelector(':scope>.sky-relationship-sort-control');
  if(!control){
    control=document.createElement('label');
    control.className='sky-relationship-sort-control';

    const label=document.createElement('span');
    label.textContent='Sort';

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
    ].forEach(([value,text])=>{
      const option=document.createElement('option');
      option.value=value;
      option.textContent=text;
      select.appendChild(option);
    });
    select.value=mode;
    select.addEventListener('change',()=>setMode(select.value));
    control.append(label,select);
  }

  const display=bar.querySelector(':scope>[data-relationship-display-control]');
  if(display){
    if(control.previousElementSibling!==display)display.after(control);
  }else if(control.parentElement!==bar){
    bar.appendChild(control);
  }else if(!control.isConnected){
    bar.appendChild(control);
  }

  const select=control.querySelector('select');
  if(select&&select.value!==mode)select.value=mode;
  if(select){
    select.setAttribute('aria-busy',busy?'true':'false');
    select.title=busy?'Calculating transit lengths…':'Sort relationships';
  }
  return select;
}
async function prepareTransitSort(){
  const generation=++calculationGeneration;
  const api=window.RelphiRelationshipTransitMeta;
  if(!api?.durationDaysForRowAsync){
    busy=false;
    ensureControl();
    dispatch();
    return;
  }
  busy=true;
  ensureControl();
  const HIDDEN_CLASSES=[
    'sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden',
    'sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden',
    'sky-chart-zodiac-filter-hidden','sky-chart-semantic-hidden'
  ];
  const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')]
    .filter(row=>!HIDDEN_CLASSES.some(name=>row.classList.contains(name)));
  for(const row of rows){
    if(generation!==calculationGeneration)return;
    await api.durationDaysForRowAsync(row,()=>generation!==calculationGeneration);
    if(generation!==calculationGeneration)return;
    await new Promise(resolve=>setTimeout(resolve,0));
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
  calculationGeneration+=1;
  busy=false;
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