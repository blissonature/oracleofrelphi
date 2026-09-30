// Degree-range Focus view for Sky Chart.
// Presentation-only: changes wheel emphasis without changing relationship eligibility.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFocusDegreeRangeV1)return;
window.__relphiSkyFocusDegreeRangeV1=true;

const STORAGE_KEY='relphiSkyFocusDegreeRangeV1';
const DEFAULT_STATE=Object.freeze({start:0,end:360});
let state=readState(),queued=false,observer=null;

const clamp=value=>Math.max(0,Math.min(360,Number.isFinite(Number(value))?Number(value):0));
const norm=value=>((Number(value)%360)+360)%360;

function roundQuarter(value){return Math.round(clamp(value)*4)/4}
function readState(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(raw&&Number.isFinite(Number(raw.start))&&Number.isFinite(Number(raw.end))){
      return{start:roundQuarter(raw.start),end:roundQuarter(raw.end)};
    }
  }catch(_){}
  return{...DEFAULT_STATE};
}
function writeState(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(_){}
}
function fullRange(){return state.start===0&&state.end===360}
function focusSegments(){
  if(fullRange())return[[0,360]];
  const start=clamp(state.start),end=clamp(state.end);
  if(start<end)return[[start,end]];
  if(start>end)return[[start,360],[0,end]];
  return[[start,start]];
}
function intervalSegments(start,end){
  const a=norm(start),span=norm(end-start);
  const width=span===0?360:span;
  const b=a+width;
  return b<=360?[[a,b]]:[[a,360],[0,b-360]];
}
function overlaps(a,b){return a[0]<=b[1]+1e-9&&b[0]<=a[1]+1e-9}
function intervalInFocus(start,end){
  const focus=focusSegments(),segments=intervalSegments(start,end);
  return segments.some(segment=>focus.some(target=>overlaps(segment,target)));
}
function degreeInFocus(value){
  if(fullRange())return true;
  const v=norm(value);
  return focusSegments().some(([a,b])=>{
    if(a===b)return Math.abs(v-a)<1e-7||Math.abs(v-a+360)<1e-7||Math.abs(v-a-360)<1e-7;
    if(b===360&&v===0)return a===0;
    return v>=a-1e-9&&v<=b+1e-9;
  });
}
function payload(slot){
  try{return JSON.parse(localStorage.getItem(slot==='B'?'relphiSkyChartB':'relphiSkyChartA')||'null')}catch(_){return null}
}
function cuspArray(slot){
  const value=payload(slot),profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
  for(const raw of [profile.houseCusps,profile.cusps,value?.houseCusps,value?.cusps,value?.houses]){
    if(!raw)continue;
    const list=(Array.isArray(raw)?raw:Object.values(raw))
      .map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item))
      .slice(0,12);
    if(list.length===12&&list.every(Number.isFinite))return list.map(norm);
  }
  return[];
}
function placementLongitudeMap(wheel){
  const map=new Map();
  wheel.querySelectorAll('[data-layer="placements"] [data-sky][data-placement][data-exact-longitude]').forEach(node=>{
    const value=Number(node.dataset.exactLongitude);
    if(Number.isFinite(value))map.set(node.dataset.sky+':'+node.dataset.placement,norm(value));
  });
  return map;
}
function toggle(node,keep){
  if(!(node instanceof Element))return;
  node.classList.toggle('is-focus-range-kept',!!keep);
  node.classList.toggle('is-focus-range-muted',!keep);
}
function applyPlacements(wheel){
  wheel.querySelectorAll('[data-layer="placements"] [data-sky][data-placement],[data-layer="leaders"] [data-sky][data-placement]').forEach(node=>{
    const value=Number(node.dataset.exactLongitude??node.dataset.displayLongitude);
    toggle(node,Number.isFinite(value)&&degreeInFocus(value));
  });
}
function applySigns(wheel){
  const sectors=[...wheel.querySelectorAll('.sky-foundation-sign-sector[data-sign]')];
  sectors.forEach(node=>{
    const sign=Number(node.dataset.sign),keep=Number.isFinite(sign)&&intervalInFocus(sign*30,(sign+1)*30);
    toggle(node,keep);
  });
  wheel.querySelectorAll('.sky-foundation-sign-glyph[data-zodiac-sign]').forEach((node,index)=>toggle(node,intervalInFocus(index*30,(index+1)*30)));
}
function applyHouses(wheel){
  ['A','B'].forEach(slot=>{
    const layer=wheel.querySelector('[data-layer="'+(slot==='A'?'a-houses':'b-houses')+'"]');
    if(!layer)return;
    const cusps=cuspArray(slot),sectors=[...layer.querySelectorAll('.sky-foundation-house-sector')],numbers=[...layer.querySelectorAll('.sky-foundation-house-number')];
    sectors.forEach((node,index)=>{
      const keep=cusps.length===12?intervalInFocus(cusps[index],cusps[(index+1)%12]):true;
      toggle(node,keep);toggle(numbers[index],keep);
    });
  });
}
function applyTicks(wheel){
  [...wheel.querySelectorAll('[data-layer="ticks"] .sky-foundation-tick')].forEach((node,index)=>toggle(node,degreeInFocus(index)));
}
function applyAspects(wheel,placements){
  wheel.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect').forEach(node=>{
    const leftSky=String(node.dataset.leftSky||'A'),rightSky=String(node.dataset.rightSky||((node.dataset.relationshipMode||'')==='A-A'?'A':'B'));
    const left=placements.get(leftSky+':'+String(node.dataset.leftPlacement||''));
    const right=placements.get(rightSky+':'+String(node.dataset.rightPlacement||''));
    const keep=(Number.isFinite(left)&&degreeInFocus(left))||(Number.isFinite(right)&&degreeInFocus(right));
    toggle(node,keep||(!Number.isFinite(left)&&!Number.isFinite(right)));
  });
}
function clearClasses(wheel){
  wheel.querySelectorAll('.is-focus-range-kept,.is-focus-range-muted').forEach(node=>{
    node.classList.remove('is-focus-range-kept','is-focus-range-muted');
  });
}
function apply(){
  queued=false;
  const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
  syncControl();
  if(!wheel)return;
  wheel.classList.toggle('has-degree-focus-range',!fullRange());
  wheel.dataset.focusRangeStart=String(state.start);
  wheel.dataset.focusRangeEnd=String(state.end);
  if(fullRange()){clearClasses(wheel);return}
  const placements=placementLongitudeMap(wheel);
  applyPlacements(wheel);
  applySigns(wheel);
  applyHouses(wheel);
  applyTicks(wheel);
  applyAspects(wheel,placements);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}

function installStyles(){
  if(document.getElementById('skyFocusDegreeRangeV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyFocusDegreeRangeV1Styles';
  style.textContent=`
#skyFoundationFocus .sky-focus-degree-range{
  display:inline-flex;align-items:center;gap:4px;height:29px;box-sizing:border-box;padding:0 7px;
  border:1px solid rgba(31,27,24,.18);border-radius:9px;background:#fff;color:#332e2a;
  font:800 .67rem/1 system-ui,sans-serif;white-space:nowrap;order:30
}
#skyFoundationFocus .sky-focus-degree-range-label{color:#5a524b}
#skyFoundationFocus .sky-focus-degree-range input{
  width:48px;min-width:48px;height:23px;box-sizing:border-box;margin:0;padding:0 4px;
  border:0;border-radius:5px;background:#f8f5f0;color:#332e2a;font:800 .67rem/1 system-ui,sans-serif;
  text-align:center;font-variant-numeric:tabular-nums
}
#skyFoundationFocus .sky-focus-degree-range input:hover,
#skyFoundationFocus .sky-focus-degree-range input:focus-visible{outline:1px solid rgba(31,27,24,.28);background:#fff}
#skyFoundationFocus .sky-focus-degree-range-sep{color:#857b72;font-weight:700}
#skyFoundationFocus .sky-focus-degree-range-reset{
  appearance:none;height:21px;margin-left:2px;padding:0 5px;border:0;border-radius:5px;background:transparent;color:#6a625b;
  font:850 .58rem/1 system-ui,sans-serif;cursor:pointer
}
#skyFoundationFocus .sky-focus-degree-range-reset:hover,
#skyFoundationFocus .sky-focus-degree-range-reset:focus-visible{background:#f1ece5;outline:none}
.sky-foundation-wheel.has-degree-focus-range .is-focus-range-muted{opacity:.12}
@media(max-width:620px){
  #skyFoundationFocus .sky-focus-degree-range{grid-column:1/-1;justify-self:stretch;width:100%;justify-content:center}
}
`;
  document.head.appendChild(style);
}
function ensureControl(){
  const slot=document.querySelector('#skyFoundationFocus .sky-focus-heading-controls');
  if(!slot)return null;
  let control=slot.querySelector('[data-focus-degree-range]');
  if(control)return control;
  control=document.createElement('label');
  control.className='sky-focus-degree-range';
  control.dataset.focusDegreeRange='true';
  control.innerHTML='<span class="sky-focus-degree-range-label">Range</span><input type="number" min="0" max="360" step="0.25" inputmode="decimal" data-focus-range-start aria-label="Focus range start in degrees"><span class="sky-focus-degree-range-sep">→</span><input type="number" min="0" max="360" step="0.25" inputmode="decimal" data-focus-range-end aria-label="Focus range end in degrees"><span class="sky-focus-degree-range-sep">°</span><button type="button" class="sky-focus-degree-range-reset" data-focus-range-reset title="Reset to full 0°–360°">Full</button>';
  const exportSlot=slot.querySelector('.sky-export-wheel-slot');
  slot.insertBefore(control,exportSlot||null);
  const start=control.querySelector('[data-focus-range-start]'),end=control.querySelector('[data-focus-range-end]');
  const commit=()=>{
    const nextStart=roundQuarter(start.value),nextEnd=roundQuarter(end.value);
    start.value=String(nextStart);end.value=String(nextEnd);
    state={start:nextStart,end:nextEnd};writeState();schedule();
    window.dispatchEvent(new CustomEvent('relphi:sky-focus-range-changed',{detail:{...state}}));
  };
  start.addEventListener('change',commit);end.addEventListener('change',commit);
  start.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();start.blur()}});
  end.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();end.blur()}});
  control.querySelector('[data-focus-range-reset]').addEventListener('click',event=>{
    event.preventDefault();state={...DEFAULT_STATE};writeState();syncControl();schedule();
    window.dispatchEvent(new CustomEvent('relphi:sky-focus-range-changed',{detail:{...state}}));
  });
  return control;
}
function syncControl(){
  installStyles();
  const control=ensureControl();if(!control)return;
  const start=control.querySelector('[data-focus-range-start]'),end=control.querySelector('[data-focus-range-end]');
  if(start&&document.activeElement!==start)start.value=String(state.start);
  if(end&&document.activeElement!==end)end.value=String(state.end);
  control.dataset.fullRange=fullRange()?'true':'false';
}
function start(){
  syncControl();schedule();
  [
    'relphi:sky-foundation-ready',
    'relphi:sky-foundation-interactions-ready',
    'relphi:sky-b-removed',
    'relphi:sky-b-restored',
    'relphi:saved-sky-loaded'
  ].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener('storage',event=>{
    if(event.key===STORAGE_KEY){state=readState();schedule();return}
    if(!event.key||event.key==='relphiSkyChartA'||event.key==='relphiSkyChartB')schedule();
  });
  observer=new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'))schedule();
  });
  observer.observe(document.getElementById('skyFoundationComparison')||document.body,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();