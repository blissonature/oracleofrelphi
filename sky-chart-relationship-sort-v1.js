// Relationship sorting: exactitude, aspect taxonomy, strength/valence, duration, and phase-end timing.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipSortV1)return;
window.__relphiRelationshipSortV1=true;

const MODES=Object.freeze({
  exact:'exact',
  aspect:'aspect',
  strongest:'strongest',
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

// The ranking model is deliberately scope-agnostic: A↔B, A↔A, and B↔B use
// the same score. Sky A/B may be natal, event, or current; neither is privileged.
//
// Harmonic order is charged once, through phase error. Aspect prominence is only
// the intrinsic prominence of the geometric operation; it is not a second harmonic penalty.
const EXACTNESS_HALF_PHASE=3;
const EXACTNESS_EXPONENT=1.75;
const ASPECT_PROMINENCE=Object.freeze({
  conjunction:1,
  opposition:.98,
  square:.96,
  trine:.94,
  sextile:.92,
  quincunx:.88,
  'tri-octile':.87,
  octile:.86,
  quintile:.86,
  'bi-quintile':.85,
  'semi-sextile':.84
});
const ASPECT_VALENCE=Object.freeze({
  trine:.8,
  sextile:.65,
  quintile:.25,
  'bi-quintile':.25,
  'semi-sextile':.1,
  conjunction:0,
  quincunx:-.45,
  octile:-.4,
  'tri-octile':-.45,
  opposition:-.7,
  square:-.75
});
const HARMONIC_ORDER=Object.freeze({
  conjunction:1,
  opposition:2,
  trine:3,
  square:4,
  quintile:5,
  'bi-quintile':5,
  sextile:6,
  octile:8,
  'tri-octile':8,
  quincunx:12,
  'semi-sextile':12
});

// Active bodies have agency. Sensitive anchors are locations/points that can be struck.
// Chiron remains an active astronomical body, but with lower authority than a planet.
const ACTIVE_AUTHORITY=Object.freeze({
  sun:1.1,moon:1.1,
  mercury:1,venus:1,mars:1,jupiter:1,saturn:1,uranus:1,neptune:1,pluto:1,
  chiron:.85
});
const ANCHOR_SENSITIVITY=Object.freeze({
  asc:1.1,dsc:1.1,mc:1.1,ic:1.1,
  'north-node':.85,'south-node':.85,
  'part-of-fortune':.8,
  lilith:.7,vertex:.7
});
const PLANETARY_NATURE=Object.freeze({
  jupiter:.25,venus:.22,
  sun:0,moon:0,mercury:0,
  mars:-.22,saturn:-.25,
  uranus:0,neptune:0,pluto:0,chiron:0
});
const SCORE_MODEL=Object.freeze({
  exactnessHalfPhase:EXACTNESS_HALF_PHASE,
  exactnessExponent:EXACTNESS_EXPONENT,
  aspectProminence:ASPECT_PROMINENCE,
  aspectValence:ASPECT_VALENCE,
  activeAuthority:ACTIVE_AUTHORITY,
  anchorSensitivity:ANCHOR_SENSITIVITY,
  planetaryNature:PLANETARY_NATURE
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
function activeAuthority(id){return ACTIVE_AUTHORITY[normalizedPoint(id)]??null}
function anchorSensitivity(id){return ANCHOR_SENSITIVITY[normalizedPoint(id)]??null}
function isActive(id){return activeAuthority(id)!=null}
function phaseError(row){
  const stored=number(row,'phaseError',NaN);
  if(Number.isFinite(stored))return Math.max(0,stored);
  const orb=number(row,'sourceOrb',0);
  const aspectId=String(row?.dataset?.aspect||'');
  const harmonic=number(row,'harmonicOrder',HARMONIC_ORDER[aspectId]??1);
  return Math.max(0,orb)*Math.max(1,harmonic);
}
function exactness(row){
  const ratio=phaseError(row)/EXACTNESS_HALF_PHASE;
  return 1/(1+Math.pow(Math.max(0,ratio),EXACTNESS_EXPONENT));
}
function contactAuthority(left,right){
  const leftActive=activeAuthority(left),rightActive=activeAuthority(right);
  const leftAnchor=anchorSensitivity(left),rightAnchor=anchorSensitivity(right);
  if(leftActive!=null&&rightActive!=null)return (leftActive+rightActive)/2;
  if(leftActive!=null&&rightAnchor!=null)return (leftActive+rightAnchor)/2;
  if(rightActive!=null&&leftAnchor!=null)return (rightActive+leftAnchor)/2;
  if(leftAnchor!=null&&rightAnchor!=null)return .55*((leftAnchor+rightAnchor)/2);
  // Unknown endpoints remain visible but do not receive special authority.
  if(leftActive!=null||rightActive!=null)return .8;
  if(leftAnchor!=null||rightAnchor!=null)return .55;
  return .5;
}
function natureAdjustment(left,right){
  const active=[];
  if(isActive(left))active.push(PLANETARY_NATURE[normalizedPoint(left)]??0);
  if(isActive(right))active.push(PLANETARY_NATURE[normalizedPoint(right)]??0);
  if(!active.length)return 0;
  return active.reduce((sum,value)=>sum+value,0)/active.length;
}
function relationshipScore(row){
  if(!row)return Object.freeze({strength:0,valence:0,signed:0,challenge:0,support:0,exactness:0,contactAuthority:0,phaseError:Infinity});
  const cached=scoreCache.get(row);
  if(cached)return cached;

  const aspectId=String(row.dataset.aspect||'');
  const left=normalizedPoint(row.dataset.leftPlacement);
  const right=normalizedPoint(row.dataset.rightPlacement);
  const prominence=ASPECT_PROMINENCE[aspectId]??.8;
  const precision=exactness(row);
  const authority=contactAuthority(left,right);
  const strength=prominence*precision*authority;
  const nature=natureAdjustment(left,right);
  const geometricValence=ASPECT_VALENCE[aspectId]??0;
  const valence=clamp(
    aspectId==='conjunction' ? nature*1.5 : geometricValence+nature,
    -1,
    1
  );
  const signed=strength*valence;
  const result=Object.freeze({
    strength,
    valence,
    signed,
    challenge:strength*Math.max(-valence,0),
    support:strength*Math.max(valence,0),
    exactness:precision,
    contactAuthority:authority,
    phaseError:phaseError(row)
  });
  scoreCache.set(row,result);
  row.dataset.relationshipStrength=strength.toFixed(6);
  // Backward-compatible alias for the first scoring draft.
  row.dataset.relationshipIntensity=strength.toFixed(6);
  row.dataset.relationshipValence=valence.toFixed(6);
  row.dataset.relationshipSignedScore=signed.toFixed(6);
  row.dataset.relationshipChallengeScore=result.challenge.toFixed(6);
  row.dataset.relationshipSupportScore=result.support.toFixed(6);
  row.dataset.relationshipExactness=precision.toFixed(6);
  row.dataset.relationshipContactAuthority=authority.toFixed(6);
  return result;
}
function invalidateScores(){scoreCache=new WeakMap()}
function compareStrength(a,b){
  const as=relationshipScore(a),bs=relationshipScore(b);
  return bs.strength-as.strength || compareExact(a,b);
}
function compareValence(a,b,kind){
  const as=relationshipScore(a),bs=relationshipScore(b);
  const av=kind==='challenge'?as.challenge:as.support;
  const bv=kind==='challenge'?bs.challenge:bs.support;
  return bv-av || bs.strength-as.strength || compareExact(a,b);
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
  if(mode===MODES.strongest)return compareStrength(a,b);
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
      [MODES.strongest,'Strongest First'],
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
  model:SCORE_MODEL,
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
