// Relationship semantics: preserve structural axes without letting them dominate the default list.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipSemanticsV1)return;
window.__relphiSkyRelationshipSemanticsV1=true;

const ANGLES=new Set(['asc','dsc','mc','ic']);
const NODES=new Set(['north-node','south-node']);
const STRUCTURAL_IDS=new Set([...ANGLES,...NODES]);
const CONSTITUTIVE=new Map([
  ['asc|dsc',{name:'Horizon axis',type:'angle'}],
  ['ic|mc',{name:'Meridian axis',type:'angle'}],
  ['north-node|south-node',{name:'Nodal axis',type:'node'}]
]);
let interactionIntent=null;
let wheelSelectionIndexes=null;
let wheelSelectionState=null;
let queued=false;
let observer=null;
let observedList=null;
let syncingFilter=false;
const autoSelected=new Set();
const explicitNodeFilters=new Set();

const canonical=value=>String(value||'').trim().toLowerCase();
const pairKey=(a,b)=>[canonical(a),canonical(b)].sort().join('|');
const selectionKey=(slot,id)=>`${slot}:${canonical(id)}`;
function isSingleSkyRow(row){return row?.dataset.relationshipMode==='A-A'||document.documentElement.dataset.skyRelationshipMode==='A-A'}
function endpointSlots(row){return isSingleSkyRow(row)?{left:'A',right:'A'}:{left:'A',right:'B'}}
function constitutiveMeta(row){if(!isSingleSkyRow(row))return null;return CONSTITUTIVE.get(pairKey(row.dataset.leftPlacement,row.dataset.rightPlacement))||null}
function rowHasAngle(row){return ANGLES.has(canonical(row.dataset.leftPlacement))||ANGLES.has(canonical(row.dataset.rightPlacement))}
function placementInput(slot,id){return document.querySelector(`[data-placement-option="${canonical(id)}"][data-slot="${slot}"]`)}
function filterSelected(slot,id){const input=placementInput(slot,id);return input?input.checked:true}
function interactionMatchesEndpoint(slot,id){return!!interactionIntent&&interactionIntent.slot===slot&&interactionIntent.id===canonical(id)}
function interactionMatchesRow(row){
  if(!interactionIntent)return false;
  const slots=endpointSlots(row);
  return interactionMatchesEndpoint(slots.left,row.dataset.leftPlacement)||interactionMatchesEndpoint(slots.right,row.dataset.rightPlacement);
}
function angleFilterMatchesRow(row){
  const slots=endpointSlots(row),left=canonical(row.dataset.leftPlacement),right=canonical(row.dataset.rightPlacement);
  return(ANGLES.has(left)&&filterSelected(slots.left,left))||(ANGLES.has(right)&&filterSelected(slots.right,right));
}
function nodeFilterMatchesRow(row){
  const slots=endpointSlots(row),left=canonical(row.dataset.leftPlacement),right=canonical(row.dataset.rightPlacement);
  return(NODES.has(left)&&explicitNodeFilters.has(selectionKey(slots.left,left)))||(NODES.has(right)&&explicitNodeFilters.has(selectionKey(slots.right,right)));
}
function semanticVisible(row){
  const meta=constitutiveMeta(row);
  if(meta)return interactionMatchesRow(row)||(meta.type==='angle'?angleFilterMatchesRow(row):nodeFilterMatchesRow(row));
  if(rowHasAngle(row))return interactionMatchesRow(row)||angleFilterMatchesRow(row);
  return true;
}
function ensureBadge(row,meta){
  let badge=row.querySelector(':scope > .sky-chart-structure-badge');
  if(!meta){badge?.remove();return}
  if(!badge){badge=document.createElement('span');badge.className='sky-chart-structure-badge';badge.setAttribute('aria-hidden','true');row.appendChild(badge)}
  badge.textContent=meta.name;
  row.dataset.axisName=meta.name;
}
function missingPlacementEndpoints(row){
  const slots=endpointSlots(row),endpoints=[{slot:slots.left,id:canonical(row.dataset.leftPlacement)},{slot:slots.right,id:canonical(row.dataset.rightPlacement)}];
  return endpoints.filter(endpoint=>!filterSelected(endpoint.slot,endpoint.id));
}
function reconcilePlacementFilter(row,meta){
  if(!row.classList.contains('sky-chart-multiselect-hidden'))return;
  if(meta&&semanticVisible(row)){row.classList.remove('sky-chart-multiselect-hidden');return}
  if(!interactionMatchesRow(row))return;
  const missing=missingPlacementEndpoints(row);
  // Intentional axis focus may open another quiet chart angle, but it must not override
  // an ordinary placement the user deliberately filtered out.
  if(missing.length&&missing.every(endpoint=>ANGLES.has(endpoint.id)))row.classList.remove('sky-chart-multiselect-hidden');
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
  reconcilePlacementFilter(row,meta);
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
    line.classList.toggle('sky-chart-multiselect-hidden',row.classList.contains('sky-chart-multiselect-hidden'));
  });
}
function isDisplayed(row){
  if(row.hidden||row.classList.contains('sky-chart-semantic-hidden'))return false;
  const style=getComputedStyle(row);return style.display!=='none'&&style.visibility!=='hidden';
}
function harmonicWindowLabel(){
  const raw=document.querySelector('[data-harmonic-window-input]')?.value??document.documentElement.dataset.skyHarmonicWindow??'';
  const numeric=Number(String(raw).trim().replace(',','.'));
  return Number.isFinite(numeric)?String(numeric):String(raw||'').trim();
}
function updateCount(rows){
  const semanticallyEligible=rows.filter(row=>!row.classList.contains('sky-chart-semantic-hidden'));
  const scoped=wheelSelectionIndexes
    ?semanticallyEligible.filter(row=>wheelSelectionIndexes.has(String(row.dataset.relationIndex||'')))
    :semanticallyEligible;
  const visible=scoped.filter(isDisplayed).length;
  const count=document.getElementById('skyFoundationRelationshipCount');
  const empty=document.getElementById('skyFoundationRelationshipEmpty');
  if(count){
    count.textContent=`${visible}/${scoped.length}`;
    count.dataset.total=String(scoped.length);
    count.dataset.semanticTotal=String(semanticallyEligible.length);
    count.dataset.scope=wheelSelectionIndexes?'wheel-selection':'all-relationships';
  }
  if(empty){
    empty.hidden=visible!==0;
    if(!empty.hidden){
      if(wheelSelectionIndexes&&scoped.length){
        const allOutsideWindow=scoped.every(row=>row.classList.contains('sky-chart-orb-hidden'));
        const windowLabel=harmonicWindowLabel();
        empty.textContent=allOutsideWindow&&windowLabel
          ?`No relationships involving this selection fall within Harmonic Window ${windowLabel}.`
          :'No relationships involving this selection match the current filters.';
      }else if(wheelSelectionIndexes){
        empty.textContent='No candidate relationships involve this selection.';
      }else{
        empty.textContent='No relationships match the current filters.';
      }
    }
  }
}
function exposeState(){
  const root=document.documentElement;
  if(!interactionIntent){delete root.dataset.skyStructuralFocus}else root.dataset.skyStructuralFocus=`${interactionIntent.slot}:${interactionIntent.id}`;
  if(wheelSelectionState){
    root.dataset.skyWheelRelationshipScope=`${wheelSelectionState.kind}:${wheelSelectionState.sky??''}:${wheelSelectionState.value}`;
    root.dataset.skyWheelRelationshipCandidates=String(wheelSelectionIndexes?.size||0);
  }else{
    delete root.dataset.skyWheelRelationshipScope;
    delete root.dataset.skyWheelRelationshipCandidates;
  }
}
function ensureObserver(){
  const list=document.getElementById('skyFoundationRelationshipList');
  if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;observer=new MutationObserver(schedule);observer.observe(list,{childList:true,subtree:false});
}
function apply(){
  queued=false;ensureObserver();
  const rows=[...document.querySelectorAll('.sky-foundation-relationship-row')];
  rows.forEach(annotateRow);
  annotateLines(rows);
  updateCount(rows);
  exposeState();
  document.documentElement.dataset.skyRelationshipSemantics='ready';
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
function dispatchPlacementChange(input,checked,remember){
  if(!input||input.checked===checked)return;
  input.checked=checked;
  if(remember)autoSelected.add(selectionKey(input.dataset.slot,input.value||input.dataset.placementTarget));
  syncingFilter=true;
  try{input.dispatchEvent(new Event('change',{bubbles:true}))}finally{syncingFilter=false}
}
function clearAutoSelections(){
  const keys=[...autoSelected];autoSelected.clear();
  keys.forEach(key=>{const split=key.indexOf(':'),slot=key.slice(0,split),id=key.slice(split+1),input=placementInput(slot,id);dispatchPlacementChange(input,false,false)});
}
function setInteractionIntent(slot,id){
  clearAutoSelections();
  const target=canonical(id),input=placementInput(slot,target);
  if(input&&!input.checked)dispatchPlacementChange(input,true,true);
  interactionIntent={slot,id:target};schedule();
}
function clearInteractionIntent(){
  if(!interactionIntent&&!autoSelected.size)return;
  interactionIntent=null;clearAutoSelections();schedule();
}
function placementFromInteractive(target){
  const node=target?.closest?.('[data-interactive="placement"][data-placement], [data-layer="placements"] [data-placement], .sky-foundation-row[data-placement]');
  if(!node)return null;
  return{node,id:canonical(node.dataset.placement),slot:(node.dataset.sky||'A').toUpperCase()};
}
function handlePlacementActivation(target){
  const hit=placementFromInteractive(target);
  if(!hit)return;
  if(STRUCTURAL_IDS.has(hit.id)){
    if(interactionIntent?.slot===hit.slot&&interactionIntent?.id===hit.id)clearInteractionIntent();
    else setInteractionIntent(hit.slot,hit.id);
  }else clearInteractionIntent();
}
document.addEventListener('click',event=>{
  if(event.target.closest('#skyFoundationClearIsolation')){clearInteractionIntent();return}
  handlePlacementActivation(event.target);
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  handlePlacementActivation(event.target);
});
document.addEventListener('change',event=>{
  if(syncingFilter)return;
  const input=event.target.closest('[data-placement-choice]');
  if(!input)return;
  const scope=canonical(input.dataset.placementScope),target=canonical(input.dataset.placementTarget),choice=canonical(input.dataset.placementChoice);
  if(scope==='group'&&target==='chart-angles'){
    // A direct filter gesture takes ownership from any temporary wheel/card selection.
    autoSelected.clear();interactionIntent=null;schedule();return;
  }
  if(scope==='placement'&&STRUCTURAL_IDS.has(target)){
    const slots=choice==='all'?(document.documentElement.dataset.skyBPresent==='false'?['A']:['A','B']):[choice.toUpperCase()];
    autoSelected.clear();interactionIntent=null;
    if(NODES.has(target))slots.forEach(slot=>{const key=selectionKey(slot,target);input.checked?explicitNodeFilters.add(key):explicitNodeFilters.delete(key)});
    schedule();
  }
});
window.addEventListener('relphi:sky-foundation-filter-changed',event=>{
  const state=event.detail?.state||null;
  if(state?.mode==='selected'){
    wheelSelectionState=state;
    wheelSelectionIndexes=new Set((event.detail?.relationshipIndexes||[]).map(String));
  }else{
    wheelSelectionState=null;
    wheelSelectionIndexes=null;
  }
  schedule();
});
[
  'relphi:sky-foundation-ready',
  'relphi:sky-foundation-interactions-ready',
  'relphi:sky-single-sky-aspects-rendered',
  'relphi:sky-orb-limit-changed',
  'relphi:sky-harmonic-window-visibility-changed',
  'relphi:sky-placement-multiselect-changed',
  'relphi:sky-house-multiselect-changed',
  'relphi:sky-aspect-multiselect-changed',
  'relphi:sky-zodiac-filter-changed'
].forEach(name=>window.addEventListener(name,schedule));
function start(){ensureObserver();schedule()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
