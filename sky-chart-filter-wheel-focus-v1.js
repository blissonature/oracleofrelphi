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
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
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

  // Harmonic Window and relationship-scope switches are deliberately excluded here.
  // They control tolerance/which relationship families are present; neither should dim
  // unrelated placements, houses, or signs or visually thicken the surviving aspects.
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

  function signNumber(node){
    if(node.dataset.sign!==undefined&&node.dataset.sign!=='')return Number(node.dataset.sign);
    const id=String(node.dataset.zodiacSign||'').toLowerCase();
    return SIGNS.indexOf(id);
  }

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

    const rows=eligibleRows();
    if(!rows.length){clearMarks(wheel);return}
    const matched=explicitRows(rows);
    const active=matched.length<rows.length;
    wheel.classList.toggle('has-filter-focus',active);
    if(!active){
      document.documentElement.removeAttribute('data-sky-filter-wheel-focus');
      return;
    }

    const relations=new Set();
    const placements=new Set();
    const houses=new Set();
    const signs=new Set();

    matched.forEach(row=>{
      const index=String(row.dataset.relationIndex||'');
      if(index)relations.add(index);
      const slots=relationshipSlots(row);
      const left=String(row.dataset.leftPlacement||'');
      const right=String(row.dataset.rightPlacement||'');
      if(left)placements.add(`${slots.left}:${left}`);
      if(right)placements.add(`${slots.right}:${right}`);
      if(row.dataset.leftHouse)houses.add(`${slots.left}:${row.dataset.leftHouse}`);
      if(row.dataset.rightHouse)houses.add(`${slots.right}:${row.dataset.rightHouse}`);
      if(row.dataset.leftSign!=='')signs.add(Number(row.dataset.leftSign));
      if(row.dataset.rightSign!=='')signs.add(Number(row.dataset.rightSign));
    });

    wheel.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect[data-relation-index]').forEach(node=>{
      node.classList.toggle('is-filter-kept',relations.has(String(node.dataset.relationIndex)));
    });

    wheel.querySelectorAll('[data-layer="placements"] [data-sky][data-placement], [data-layer="leaders"] [data-sky][data-placement]').forEach(node=>{
      node.classList.toggle('is-filter-kept',placements.has(`${node.dataset.sky}:${node.dataset.placement}`));
    });

    wheel.querySelectorAll('.sky-foundation-house-sector[data-sky][data-house],[data-focus-piece="house"][data-sky][data-house]').forEach(node=>{
      node.classList.toggle('is-filter-kept',houses.has(`${node.dataset.sky}:${node.dataset.house}`));
    });

    wheel.querySelectorAll('.sky-foundation-sign-sector,.sky-foundation-sign-glyph').forEach(node=>{
      const sign=signNumber(node);
      node.classList.toggle('is-filter-kept',Number.isInteger(sign)&&signs.has(sign));
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
      'relphi:sky-zodiac-filter-changed'
    ].forEach(name=>window.addEventListener(name,schedule));
    document.addEventListener('change',event=>{
      if(event.target.closest?.('#skyFoundationRelationships .sky-chart-filter-bar')&&!event.target.matches?.('[data-harmonic-window-input]'))schedule();
    },true);
    window.addEventListener('storage',schedule);
    schedule();
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
