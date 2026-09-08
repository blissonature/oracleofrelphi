// Relationship sorting: exactitude, aspect taxonomy, valence, duration, and phase-end timing.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipSortV1)return;
window.__relphiRelationshipSortV1=true;

const MODES=Object.freeze({
  exact:'exact',
  aspect:'aspect',
  challenging:'most-challenging',
  supportive:'most-supportive',
  longest:'duration-longest',
  shortest:'duration-shortest',
  beganMostRecently:'began-most-recently',
  endsSoonest:'ends-soonest',
  endsLast:'ends-last'
});
const ASPECT_ORDER=Object.freeze([
  'conjunction','opposition','trine','square','sextile',
  'quincunx','semi-sextile','quintile','bi-quintile','octile','tri-octile'
]);
const ASPECT_RANK=new Map(ASPECT_ORDER.map((id,index)=>[id,index]));

// Valence is intentionally scope-agnostic: A↔B, A↔A, and B↔B use the same score.
// Sky A/B may be natal, event, or current; neither side is privileged here.
const ASPECT_PROFILE=Object.freeze({
  conjunction:Object.freeze({valence:0,intensity:1}),
  opposition:Object.freeze({valence:-1,intensity:1}),
  trine:Object.freeze({valence:.8,intensity:.82}),
  square:Object.freeze({valence:-1,intensity:.95}),
  sextile:Object.freeze({valence:.62,intensity:.68}),
  quincunx:Object.freeze({valence:-.58,intensity:.72}),
  'semi-sextile':Object.freeze({valence:.18,intensity:.4}),
  quintile:Object.freeze({valence:.45,intensity:.52}),
  'bi-quintile':Object.freeze({valence:.42,intensity:.5}),
  octile:Object.freeze({valence:-.52,intensity:.6}),
  'tri-octile':Object.freeze({valence:-.58,intensity:.64})
});
const POINT_TONE=Object.freeze({
  sun:.25,moon:.15,mercury:.1,venus:.7,mars:-.7,jupiter:.8,saturn:-.8,
  uranus:-.55,neptune:-.45,pluto:-.8,chiron:-.5,
  'north-node':0,'south-node':0,lilith:-.2,'part-of-fortune':.35,vertex:0,
  asc:0,dsc:0,mc:0,ic:0
});
const POINT_IMPORTANCE=Object.freeze({
  sun:1.25,moon:1.25,asc:1.25,dsc:1.25,mc:1.25,ic:1.25,
  mercury:1.12,venus:1.12,mars:1.12,jupiter:1.08,saturn:1.08,
  uranus:1.05,neptune:1.05,pluto:1.05,chiron:1.05,
  'north-node':.95,'south-node':.95,vertex:.95,'part-of-fortune':.9,lilith:.9
});
const PAIR_VALENCE=Object.freeze({
  'jupiter|venus':.75,
  'jupiter|moon':.5,
  'jupiter|sun':.48,
  'jupiter|mercury':.42,
  'sun|venus':.38,
  'moon|venus':.42,
  'mercury|venus':.3,
  'mars|pluto':-.9,
  'mars|uranus':-.85,
  'mars|saturn':-.75,
  'moon|pluto':-.85,
  'pluto|sun':-.65,
  'mercury|pluto':-.48,
  'pluto|venus':-.35,
  'pluto|saturn':-.55,
  'saturn|uranus':-.6,
  'neptune|saturn':-.35,
  'chiron|sun':-.65,
  'chiron|moon':-.55,
  'chiron|mars':-.5,
  'mercury|neptune':-.45,
  'moon|neptune':-.35,
  'saturn|sun':-.45,
  'moon|saturn':-.6,
  'saturn|venus':-.25
});
let scoreCache=new WeakMap();
let mode=MODES.exact;
let calculationGeneration=0;
let busy=false,transitTimer=0;
function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}

function number(row,key,fallback=Infinity){
  const value=Number(row?.dataset?.[key]);
  return Number.isFinite(value)?value:fallback;
}
function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
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
function normalizedPoint(id){return String(id||'').trim().toLowerCase()}
function pairKey(left,right){return [normalizedPoint(left),normalizedPoint(right)].sort().join('|')}
function exactness(row){
  const error=number(row,'phaseError',number(row,'sourceOrb',0));
  const window=number(row,'harmonicWindow',NaN);
  if(Number.isFinite(window)&&window>0){
    const remaining=1-clamp(error/window,0,1);
    return .35+.65*remaining;
  }
  return 1/(1+Math.max(0,error)/1.5);
}
function relationshipScore(row){
  if(!row)return Object.freeze({valence:0,intensity:0,signed:0,challenge:0,support:0});
  const cached=scoreCache.get(row);
  if(cached)return cached;

  const aspectId=String(row.dataset.aspect||'');
  const profile=ASPECT_PROFILE[aspectId]||Object.freeze({valence:0,intensity:.45});
  const left=normalizedPoint(row.dataset.leftPlacement);
  const right=normalizedPoint(row.dataset.rightPlacement);
  const leftTone=POINT_TONE[left]??0,rightTone=POINT_TONE[right]??0;
  const meanTone=(leftTone+rightTone)/2;
  const adjustment=PAIR_VALENCE[pairKey(left,right)]??0;

  let valence;
  if(aspectId==='conjunction')valence=adjustment*.7+meanTone*.75;
  else valence=profile.valence*.65+adjustment*.65+meanTone*.15;
  valence=clamp(valence,-1,1);

  const endpointImportance=((POINT_IMPORTANCE[left]??1)+(POINT_IMPORTANCE[right]??1))/2;
  const pairIntensity=1+.25*Math.abs(adjustment);
  const intensity=profile.intensity*exactness(row)*endpointImportance*pairIntensity;
  const signed=valence*intensity;
  const result=Object.freeze({
    valence,
    intensity,
    signed,
    challenge:Math.max(0,-signed),
    support:Math.max(0,signed)
  });
  scoreCache.set(row,result);
  row.dataset.relationshipValence=valence.toFixed(6);
  row.dataset.relationshipIntensity=intensity.toFixed(6);
  row.dataset.relationshipSignedScore=signed.toFixed(6);
  return result;
}
function invalidateScores(){scoreCache=new WeakMap()}
function compareValence(a,b,kind){
  const as=relationshipScore(a),bs=relationshipScore(b);
  const av=kind==='challenge'?as.challenge:as.support;
  const bv=kind==='challenge'?bs.challenge:bs.support;
  return bv-av || bs.intensity-as.intensity || compareExact(a,b);
}
function timingValue(row,key){
  const value=Number(row?.dataset?.[key]);
  return Number.isFinite(value)?value:null;
}
function compareTiming(a,b,key,direction){
  const av=timingValue(a,key),bv=timingValue(b,key);
  if(av!=null&&bv!=null)return direction*(av-bv)||compareExact(a,b);
  if(av!=null)return-1;
  if(bv!=null)return 1;
  return compareExact(a,b);
}
function compareRows(a,b){
  if(mode===MODES.aspect)return compareAspect(a,b);
  if(mode===MODES.challenging)return compareValence(a,b,'challenge');
  if(mode===MODES.supportive)return compareValence(a,b,'support');
  if(mode===MODES.longest)return compareTiming(a,b,'transitDurationDays',-1);
  if(mode===MODES.shortest)return compareTiming(a,b,'transitDurationDays',1);
  if(mode===MODES.beganMostRecently)return compareTiming(a,b,'transitStartedDaysAgo',1);
  if(mode===MODES.endsSoonest)return compareTiming(a,b,'transitEndsInDays',1);
  if(mode===MODES.endsLast)return compareTiming(a,b,'transitEndsInDays',-1);
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
@media(min-width:621px){
  #skyFoundationRelationships .sky-chart-filter-bar>.sky-relationship-sort-control{grid-column:8/span 5!important;grid-row:2!important}
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
      [MODES.challenging,'Most Challenging First'],
      [MODES.supportive,'Most Supportive First'],
      [MODES.longest,'Longest Duration'],
      [MODES.shortest,'Shortest Duration'],
      [MODES.beganMostRecently,'Began Most Recently'],
      [MODES.endsSoonest,'Ends Soonest'],
      [MODES.endsLast,'Ends Last']
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
    select.title=busy?'Calculating relationship timing…':'Sort relationships';
  }
  return select;
}
async function prepareTransitSort(){
  transitTimer=0;
  if(whereWhenEditing())return;
  const generation=++calculationGeneration;
  const api=window.RelphiRelationshipTransitMeta;
  if(!api?.estimatedTimingForRow){
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
  for(let index=0;index<rows.length;index+=1){
    if(generation!==calculationGeneration)return;
    api.estimatedTimingForRow(rows[index]);
    if(index%4===3)await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(generation!==calculationGeneration)return;
  busy=false;
  ensureControl();
  dispatch();
}
function scheduleTransitSort(delay=90){
  calculationGeneration+=1;
  clearTimeout(transitTimer);
  transitTimer=setTimeout(()=>prepareTransitSort(),Math.max(0,Number(delay)||0));
}
function setMode(next){
  if(!Object.values(MODES).includes(next))next=MODES.exact;
  mode=next;
  calculationGeneration+=1;
  busy=false;
  ensureControl();
  if([MODES.longest,MODES.shortest,MODES.beganMostRecently,MODES.endsSoonest,MODES.endsLast].includes(mode)){
    scheduleTransitSort(0);
    return;
  }
  dispatch();
}
function refreshForRows(){
  invalidateScores();
  if(whereWhenEditing())return;
  ensureControl();
  if([MODES.longest,MODES.shortest,MODES.beganMostRecently,MODES.endsSoonest,MODES.endsLast].includes(mode)){
    scheduleTransitSort(110);
    return;
  }
  if(mode!==MODES.exact)dispatch();
}
function invalidateTransit(){
  invalidateScores();
  calculationGeneration+=1;
  if(whereWhenEditing()){busy=false;return;}
  busy=false;
  window.RelphiRelationshipTransitMeta?.clearDurationCache?.();
  if([MODES.longest,MODES.shortest,MODES.beganMostRecently,MODES.endsSoonest,MODES.endsLast].includes(mode))scheduleTransitSort(110);
}
window.RelphiRelationshipSort=Object.freeze({
  compareRows,
  mode:currentMode,
  scoreRow:relationshipScore,
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
