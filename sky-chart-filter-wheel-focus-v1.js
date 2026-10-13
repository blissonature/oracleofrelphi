// Let explicit semantic filters drive wheel focus without treating Harmonic Window or relationship scope as isolation.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFilterWheelFocusV3)return;
  window.__relphiSkyFilterWheelFocusV3=true;
  window.__relphiSkyFilterWheelFocusV2=true;
  window.__relphiSkyFilterWheelFocusV1=true;

  const EXPLICIT_HIDDEN_CLASSES=new Set([
    'sky-chart-filter-hidden',
    'sky-chart-multiselect-hidden',
    'sky-chart-house-multiselect-hidden',
    'sky-chart-aspect-multiselect-hidden',
    'sky-chart-sign-filter-hidden'
  ]);
  const ORB_HIDDEN_CLASSES=new Set(['sky-chart-orb-hidden','sky-orb-filter-hidden']);
  let queued=false;
  let observer=null;
  let observedList=null;

  function relationshipSlots(row){
    const mode=row.dataset.relationshipMode||document.documentElement.dataset.skyRelationshipMode||'A-B';
    return{
      left:row.dataset.leftSky||(mode==='B-B'?'B':'A'),
      right:row.dataset.rightSky||(mode==='A-A'?'A':'B')
    };
  }

  function relationshipMode(row){
    const declared=String(row?.dataset?.relationshipMode||'').toUpperCase();
    if(declared==='A-A'||declared==='B-B'||declared==='A-B')return declared;
    const slots=relationshipSlots(row);
    return slots.left===slots.right?`${slots.left}-${slots.right}`:'A-B';
  }

  function scopeEligible(row){
    const raw=String(document.documentElement.dataset.skyRelationshipScopeSelection||'').trim();
    if(!raw)return true;
    const selected=new Set(raw.split(',').map(value=>value.trim().toUpperCase()).filter(Boolean));
    return selected.has(relationshipMode(row));
  }

  // Keep broad candidate eligibility separate from actual visible matches.
  // Explicit aspect, placement, house and sign filters determine visual focus.
  // Harmonic Window is a relationship visibility control only.
  function excludedByExplicitFilter(row){
    if(row.classList.contains('sky-foundation-single-sky-cross-hidden'))return true;
    for(const className of row.classList){
      if(ORB_HIDDEN_CLASSES.has(className))continue;
      if(EXPLICIT_HIDDEN_CLASSES.has(className))return true;
      if(className.includes('multiselect-hidden'))return true;
      if(className.includes('filter-hidden'))return true;
    }
    return false;
  }

  function eligibleRows(){
    return Array.from(document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]'))
      .filter(row=>!row.classList.contains('sky-foundation-single-sky-cross-hidden'))
      .filter(scopeEligible);
  }

  function explicitRows(rows){return rows.filter(row=>!excludedByExplicitFilter(row))}

  function clearMarks(wheel){
    wheel?.classList.remove('has-filter-focus');
    wheel?.querySelectorAll('.is-filter-kept').forEach(node=>node.classList.remove('is-filter-kept'));
    document.documentElement.removeAttribute('data-sky-filter-wheel-focus');
  }

  function sync(){
    queued=false;
    observeRows();
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if(!wheel)return;

    wheel.querySelectorAll('.is-filter-kept').forEach(node=>node.classList.remove('is-filter-kept'));

    // Aspect selection owns whether aspect geometry is present, not whether
    // the rest of the chart is visually isolated. Zero selected aspects is a
    // neutral wheel state even before row-hidden classes finish propagating.
    const matrixSelection=String(document.documentElement.dataset.skyAspectSelection||'');
    if(matrixSelection.startsWith('0/')){
      clearMarks(wheel);
      window.dispatchEvent(new CustomEvent('relphi:sky-filter-wheel-focus-changed',{detail:{active:false,visible:0,total:eligibleRows().length,relationshipIndexes:[]}}));
      return;
    }

    const rows=eligibleRows();
    if(!rows.length){clearMarks(wheel);return}
    const explicitlyMatched=explicitRows(rows);
    // Only explicit filter choices can change wheel brightness. The
    // Harmonic Window hides aspect relationships, never planetary placements.
    // row.hidden and orb-hidden classes are deliberately excluded here.
    const matched=explicitlyMatched;
    // If nothing matches, leave the neutral empty-result presentation unchanged.
    const active=matched.length>0&&matched.length<rows.length;
    wheel.classList.toggle('has-filter-focus',active);
    if(!active){
      clearMarks(wheel);
      window.dispatchEvent(new CustomEvent('relphi:sky-filter-wheel-focus-changed',{detail:{active:false,visible:matched.length,total:rows.length,relationshipIndexes:[]}}));
      return;
    }

    const relations=new Set();
    matched.forEach(row=>{
      const index=String(row.dataset.relationIndex||'');
      if(index)relations.add(index);
    });
    // Focus-menu filters may emphasize eligible aspects, but never set
    // planetary, leader, house, or sign visual-focus markers.
    wheel.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect[data-relation-index]').forEach(node=>{
      node.classList.toggle('is-filter-kept',relations.has(String(node.dataset.relationIndex)));
    });

    document.documentElement.dataset.skyFilterWheelFocus=`${matched.length}/${rows.length}`;
    window.dispatchEvent(new CustomEvent('relphi:sky-filter-wheel-focus-changed',{detail:{active:true,visible:matched.length,total:rows.length,relationshipIndexes:Array.from(relations)}}));
  }

  function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}

  function schedule(){
    if(queued||whereWhenEditing())return;
    queued=true;
    requestAnimationFrame(sync);
  }

  function observeRows(){
    const list=document.getElementById('skyFoundationRelationshipList');
    if(!list||list===observedList)return;
    observer?.disconnect();
    observedList=list;
    observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='childList'))schedule();
    });
    observer.observe(list,{subtree:true,childList:true});
  }

  function start(){
    observeRows();
    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-interactions-ready',
      'relphi:sky-single-sky-aspects-rendered',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-aspect-multiselect-changed',
      'relphi:sky-zodiac-filter-changed',
      'relphi:sky-configuration-selection-changed',
      'relphi:sky-aspect-visibility-applied',
      'relphi:sky-harmonic-window-visibility-changed'
    ].forEach(name=>window.addEventListener(name,schedule));
    document.addEventListener('change',event=>{
      if(event.target.closest?.('#skyFoundationFocus .sky-chart-filter-bar,#skyFoundationRelationships .sky-chart-filter-bar')&&!event.target.matches?.('[data-harmonic-window-input]'))schedule();
    },true);
    window.addEventListener('storage',schedule);
    schedule();
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
