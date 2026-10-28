// A new/removed working sky has no valid relationships of its own.
// Purge its A↔A/B↔B and cross-sky A↔B rows AND wheel segments immediately,
// even while Where and When is open and a foundation redraw is deferred.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiWorkingSkyRelationshipClearV1)return;
window.__relphiWorkingSkyRelationshipClearV1=true;

const HIDDEN=['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden',
 'sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden',
 'sky-chart-aspect-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-semantic-hidden'];

function belongsTo(node,slot){
 const mode=String(node.dataset.relationshipMode||'').toUpperCase();
 const left=String(node.dataset.leftSky||'').toUpperCase();
 const right=String(node.dataset.rightSky||'').toUpperCase();
 if(left===slot||right===slot)return true;
 if(mode==='A-B'||mode===slot+'-'+slot)return true;
 if(node.classList.contains('sky-foundation-single-sky-row')||
    node.classList.contains('sky-foundation-single-sky-aspect'))return slot==='A';
 if(node.classList.contains('sky-intrasky-b-generated'))return slot==='B';
 if(node.classList.contains('sky-intrasky-generated'))return slot==='A';
 return false;
}
function updateCount(){
 const rows=[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')];
 const visible=rows.filter(row=>!row.hidden&&!HIDDEN.some(name=>row.classList.contains(name))&&getComputedStyle(row).display!=='none').length;
 const count=document.getElementById('skyFoundationRelationshipCount');
 if(count){
  count.textContent=rows.length?visible+'/'+rows.length:'0/0';
  count.dataset.total=String(rows.length);
  count.dataset.matchCount=String(visible);
 }
 const empty=document.getElementById('skyFoundationRelationshipEmpty');
 if(empty)empty.hidden=visible!==0;
}
function clearSelection(){
 // Cancel the wheel's locked aspect, house or placement focus before deleting
 // its endpoints, so no old selection can remain pinned in the detail panel.
 window.RelphiSkyFoundationInteractions?.restoreFocus?.({
  lockedState:null,rowLockedState:null,selectionOrigin:null,wheelOnlyExternal:false
 });
 window.RelphiInlineRelationship?.collapse?.();
 document.querySelectorAll('.sky-foundation-relationship-row[aria-current],.sky-foundation-relationship-row.is-selected')
  .forEach(row=>{row.removeAttribute('aria-current');row.classList.remove('is-selected')});
 document.querySelectorAll('.sky-foundation-aspect[data-selected-relation]')
  .forEach(line=>delete line.dataset.selectedRelation);
 const selected=document.getElementById('skySelectedRelationship');
 if(selected){selected.hidden=true;selected.removeAttribute('data-relation-index')}
 window.dispatchEvent(new CustomEvent('relphi:sky-foundation-clear-selection',{detail:{source:'working-sky-reset'}}));
}
function clear(slot){
 if(slot!=='A'&&slot!=='B')return;
 clearSelection();
 const list=document.getElementById('skyFoundationRelationshipList');
 list?.querySelectorAll(':scope > .sky-foundation-relationship-row')
  .forEach(row=>{if(belongsTo(row,slot))row.remove()});
 // Include both visible aspect strokes and transparent hit targets. Prevent
 // remaining interactive segments referring to a deleted sky.
 document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > *')
  .forEach(line=>{if(belongsTo(line,slot))line.remove()});
 const wheel=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
 if(wheel)wheel.classList.remove('has-isolation');
 document.documentElement.dataset.skyRelationshipResetSlot=slot;
 updateCount();
 // Follow-up renderers are data-driven and will only regenerate relationships
 // from the new empty payload; the count can be recomputed after their flush.
 requestAnimationFrame(updateCount);
}
window.addEventListener('relphi:sky-working-slot-cleared',event=>clear(String(event.detail?.slot||'').toUpperCase()));
window.RelphiSkyWorkingSkyRelationshipClear=Object.freeze({clear});
})();
