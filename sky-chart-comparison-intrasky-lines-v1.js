// In comparison mode, every canonical A↔A / B↔B relationship row needs a wheel line.
// The comparison renderer itself only creates A↔B lines; preserve those untouched.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiComparisonIntraskyLinesV1)return;
window.__relphiComparisonIntraskyLinesV1=true;
const NS='http://www.w3.org/2000/svg';
const COLORS={conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'};
const FILTER_CLASSES=['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-semantic-hidden'];
let queued=false,updating=false;
const norm=v=>((Number(v)%360)+360)%360;
function chart(){const svg=document.querySelector('#skyFoundationWheelMount>svg.sky-foundation-wheel');return svg&&!svg.dataset.singleSky&&document.documentElement.dataset.skyBPresent==='true'?svg:null}
function point(longitude){const spec=window.RelphiSkyWheelSpec?.comparison;const c=spec?.center||{x:600,y:600},radius=Number(spec?.inner?.inner)||166;const angle=(norm(longitude)-180)*Math.PI/180;return{x:c.x+radius*Math.cos(angle),y:c.y+radius*Math.sin(angle)}}
function match(row,line){return line.dataset.relationshipMode===row.dataset.relationshipMode&&line.dataset.relationIndex===row.dataset.relationIndex}
function syncAttrs(line,row){
  for(const key of ['relationshipMode','relationIndex','aspect','leftSky','rightSky','leftPlacement','rightPlacement','leftHouse','rightHouse','leftSign','rightSign','harmonicOrder','harmonicNumerator','phaseError','harmonicCoherence','bySignOnly']){
    if(row.dataset[key]!==undefined)line.dataset[key]=row.dataset[key];
    else delete line.dataset[key];
  }
  line.dataset.orb=row.dataset.sourceOrb||'';
  line.dataset.interactive='aspect';line.dataset.focusPiece='aspect';
  for(const name of FILTER_CLASSES)line.classList.toggle(name,row.classList.contains(name));
  // Preserve selected-row isolation as a highlighting state, not a line visibility filter.
  line.hidden=FILTER_CLASSES.some(name=>row.classList.contains(name))||row.hidden&&row.classList.contains('sky-chart-orb-hidden');
}
function render(){
  queued=false;if(updating)return;
  const svg=chart(),layer=svg?.querySelector('[data-layer="aspects"]');if(!layer)return;
  const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-intrasky-generated[data-relation-index][data-left-longitude][data-right-longitude]')];
  const existing=[...layer.querySelectorAll('line.sky-comparison-intrasky-aspect')];
  updating=true;
  try{
    const keep=new Set();
    for(const row of rows){
      const x=Number(row.dataset.leftLongitude),y=Number(row.dataset.rightLongitude);
      if(!Number.isFinite(x)||!Number.isFinite(y))continue;
      let line=existing.find(candidate=>match(row,candidate));
      if(!line){
        // Another owner may already have created this relationship.
        line=[...layer.querySelectorAll('line.sky-foundation-aspect:not(.sky-comparison-intrasky-aspect)')].find(candidate=>match(row,candidate));
        if(line)continue;
        line=document.createElementNS(NS,'line');
        line.classList.add('sky-foundation-aspect','sky-foundation-interactive','sky-comparison-intrasky-aspect');
        line.setAttribute('tabindex','0');line.setAttribute('role','button');
        line.style.pointerEvents='stroke';layer.appendChild(line);
      }
      const a=point(x),b=point(y);
      for(const [key,value] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))line.setAttribute(key,String(value));
      line.setAttribute('stroke',COLORS[row.dataset.aspect]||'#7655aa');
      line.setAttribute('aria-label',row.getAttribute('aria-label')||'Intrasky aspect');
      syncAttrs(line,row);
      keep.add(line);
    }
    existing.forEach(line=>{if(!keep.has(line))line.remove()});
  }finally{updating=false}
}
function schedule(){if(queued||updating)return;queued=true;requestAnimationFrame(render)}
function start(){
  const list=document.getElementById('skyFoundationRelationshipList');
  if(list)new MutationObserver(records=>{if(updating)return;if(records.some(r=>r.type==='childList'||r.type==='attributes'))schedule()}).observe(list,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  const mount=document.getElementById('skyFoundationWheelMount');
  if(mount)new MutationObserver(records=>{if(!updating&&records.some(r=>r.type==='childList'))schedule()}).observe(mount,{childList:true});
  for(const event of ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-aspect-visibility-applied','relphi:sky-harmonic-window-visibility-changed','relphi:sky-placement-multiselect-changed','relphi:sky-b-restored','relphi:sky-b-removed'])window.addEventListener(event,schedule);
  window.addEventListener('resize',schedule);schedule();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
