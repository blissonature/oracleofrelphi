// Relationship semantics: preserve structural axes without letting them dominate the default list.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipSemanticsV1)return;
window.__relphiSkyRelationshipSemanticsV1=true;

const ANGLES=new Set(['asc','dsc','mc','ic']);
const STRUCTURAL_IDS=new Set(['asc','dsc','mc','ic','north-node','south-node']);
const CONSTITUTIVE=new Map([
  ['asc|dsc',{name:'Horizon axis',members:new Set(['asc','dsc'])}],
  ['ic|mc',{name:'Meridian axis',members:new Set(['ic','mc'])}],
  ['north-node|south-node',{name:'Nodal axis',members:new Set(['north-node','south-node'])}]
]);
let intent=null;
let queued=false;
let observer=null;

const canonical=value=>String(value||'').trim().toLowerCase();
const pairKey=(a,b)=>[canonical(a),canonical(b)].sort().join('|');
function isSingleSkyRow(row){return row?.dataset.relationshipMode==='A-A'||document.documentElement.dataset.skyRelationshipMode==='A-A'}
function endpointSlots(row){return isSingleSkyRow(row)?{left:'A',right:'A'}:{left:'A',right:'B'}}
function constitutiveMeta(row){if(!isSingleSkyRow(row))return null;return CONSTITUTIVE.get(pairKey(row.dataset.leftPlacement,row.dataset.rightPlacement))||null}
function rowHasAngle(row){return ANGLES.has(canonical(row.dataset.leftPlacement))||ANGLES.has(canonical(row.dataset.rightPlacement))}
function intentMatchesEndpoint(slot,id){
  if(!intent)return false;
  const target=canonical(id);
  if(intent.kind==='angles')return ANGLES.has(target)&&intent.slots.has(slot);
  if(intent.kind==='placement')return intent.id===target&&intent.slots.has(slot);
  return false;
}
function intentMatchesRow(row){
  if(!intent)return false;
  const slots=endpointSlots(row);
  return intentMatchesEndpoint(slots.left,row.dataset.leftPlacement)||intentMatchesEndpoint(slots.right,row.dataset.rightPlacement);
}
function semanticVisible(row){
  const constitutive=constitutiveMeta(row);
  if(constitutive)return intentMatchesRow(row);
  if(rowHasAngle(row))return intentMatchesRow(row);
  return true;
}
function ensureBadge(row,meta){
  let badge=row.querySelector(':scope > .sky-chart-structure-badge');
  if(!meta){badge?.remove();return}
  if(!badge){badge=document.createElement('span');badge.className='sky-chart-structure-badge';badge.setAttribute('aria-hidden','true');row.appendChild(badge)}
  badge.textContent=meta.name;
  row.dataset.axisName=meta.name;
}
function annotateRow(row){
  const meta=constitutiveMeta(row);
  row.dataset.relationshipKind=meta?'constitutive':rowHasAngle(row)?'axis-contingent':'contingent';
  if(meta){
    ensureBadge(row,meta);
    row.setAttribute('aria-description',`${meta.name}. This exact relationship constitutes an axis rather than arising contingently.`);
  }else{
    ensureBadge(row,null);
    row.removeAttribute('aria-description');
    delete row.dataset.axisName;
  }
  row.classList.toggle('sky-chart-semantic-hidden',!semanticVisible(row));
}
function matchingLineForRow(line,row){
  return canonical(line.dataset.leftPlacement)===canonical(row.dataset.leftPlacement)&&canonical(line.dataset.rightPlacement)===canonical(row.dataset.rightPlacement)&&canonical(line.dataset.aspect)===canonical(row.dataset.aspect);
}
function annotateLines(rows){
  const lines=[...document.querySelectorAll('[data-layer="aspects"] [data-left-placement][data-right-placement]')];
  lines.forEach(line=>{
    const row=rows.find(candidate=>matchingLineForRow(line,candidate));
    if(!row){line.classList.remove('sky-chart-semantic-hidden','sky-chart-constitutive-line');delete line.dataset.relationshipKind;return}
    const kind=row.dataset.relationshipKind;
    line.dataset.relationshipKind=kind;
    // The constitutive axis is already drawn as chart structure; do not duplicate it as an aspect chord.
    line.classList.toggle('sky-chart-constitutive-line',kind==='constitutive');
    line.classList.toggle('sky-chart-semantic-hidden',kind!=='constitutive'&&!semanticVisible(row));
  });
}
function isDisplayed(row){
  if(row.hidden||row.classList.contains('sky-chart-semantic-hidden'))return false;
  return getComputedStyle(row).display!=='none'&&getComputedStyle(row).visibility!=='hidden';
}
function updateCount(rows){
  const eligible=rows.filter(row=>!row.classList.contains('sky-chart-semantic-hidden'));
  const visible=eligible.filter(isDisplayed).length;
  const count=document.getElementById('skyFoundationRelationshipCount');
  const empty=document.getElementById('skyFoundationRelationshipEmpty');
  if(count){count.textContent=`${visible}/${eligible.length}`;count.dataset.total=String(eligible.length);count.dataset.semanticTotal=String(eligible.length)}
  if(empty)empty.hidden=visible!==0;
}
function exposeState(){
  const root=document.documentElement;
  if(!intent){delete root.dataset.skyStructuralFocus;return}
  root.dataset.skyStructuralFocus=intent.kind==='angles'?`angles:${[...intent.slots].join('')}`:`${[...intent.slots].join('')}:${intent.id}`;
}
function apply(){
  queued=false;
  const rows=[...document.querySelectorAll('.sky-foundation-relationship-row')];
  rows.forEach(annotateRow);
  annotateLines(rows);
  updateCount(rows);
  exposeState();
  document.documentElement.dataset.skyRelationshipSemantics='ready';
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
function slotsFromChoice(input){
  const choice=canonical(input?.dataset.placementChoice);
  if(choice==='a')return new Set(['A']);
  if(choice==='b')return new Set(['B']);
  return new Set(document.documentElement.dataset.skyBPresent==='false'?['A']:['A','B']);
}
function setPlacementIntent(id,slots){intent={kind:'placement',id:canonical(id),slots};schedule()}
function setAngleGroupIntent(slots){intent={kind:'angles',slots};schedule()}
function clearIntent(){if(!intent)return;intent=null;schedule()}
function placementFromInteractive(target){
  const node=target?.closest?.('[data-interactive="placement"][data-placement], [data-layer="placements"] [data-placement], .sky-foundation-row[data-placement]');
  if(!node)return null;
  return{node,id:canonical(node.dataset.placement),slot:(node.dataset.sky||'A').toUpperCase()};
}
function handlePlacementActivation(target){
  const hit=placementFromInteractive(target);
  if(!hit)return;
  if(STRUCTURAL_IDS.has(hit.id))setPlacementIntent(hit.id,new Set([hit.slot]));
  else clearIntent();
}
document.addEventListener('click',event=>{
  if(event.target.closest('#skyFoundationClearIsolation')){clearIntent();return}
  handlePlacementActivation(event.target);
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  handlePlacementActivation(event.target);
});
document.addEventListener('change',event=>{
  const input=event.target.closest('[data-placement-choice]');
  if(!input)return;
  const scope=canonical(input.dataset.placementScope),target=canonical(input.dataset.placementTarget),slots=slotsFromChoice(input);
  if(scope==='group'&&target==='chart-angles'){
    if(input.checked)setAngleGroupIntent(slots);else if(intent?.kind==='angles')clearIntent();
    return;
  }
  if(scope==='placement'&&STRUCTURAL_IDS.has(target)){
    if(input.checked)setPlacementIntent(target,slots);else if(intent?.kind==='placement'&&intent.id===target)clearIntent();
  }
});
[
  'relphi:sky-foundation-ready',
  'relphi:sky-foundation-interactions-ready',
  'relphi:sky-single-sky-aspects-rendered',
  'relphi:sky-orb-limit-changed',
  'relphi:sky-placement-multiselect-changed',
  'relphi:sky-house-multiselect-changed',
  'relphi:sky-aspect-multiselect-changed',
  'relphi:sky-zodiac-filter-changed'
].forEach(name=>window.addEventListener(name,schedule));
function start(){
  const list=document.getElementById('skyFoundationRelationshipList');
  if(list){observer=new MutationObserver(schedule);observer.observe(list,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden','class']})}
  schedule();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
