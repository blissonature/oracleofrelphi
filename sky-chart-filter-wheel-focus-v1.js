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
    'sky-chart-sign-filter-hidden'
  ]);
  const ORB_HIDDEN_CLASSES=new Set(['sky-chart-orb-hidden','sky-orb-filter-hidden']);
  let queued=false;
  let observer=null;
  let observedList=null;
  let hiddenNearest=new Map();
  let popup=null;

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
      // Aspect-type checkboxes govern which strokes are drawn; they must not
      // dim houses, signs or placements. Only other semantic filters focus.
      if(className==='sky-chart-aspect-multiselect-hidden')continue;
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

  function phase(row){
    const explicit=row.dataset.phaseError;
    if(explicit!==undefined&&explicit!==''){
      const n=Number(explicit);if(Number.isFinite(n))return n;
    }
    const orb=Number(row.dataset.sourceOrb??row.dataset.orb);
    const order=Number(row.dataset.harmonicOrder);
    return Number.isFinite(orb)&&Number.isFinite(order)&&order>0?Math.abs(orb*order):NaN;
  }
  function endpoints(row){
    const slots=relationshipSlots(row);
    return [row.dataset.leftPlacement?`${slots.left}:${row.dataset.leftPlacement}`:null,
      row.dataset.rightPlacement?`${slots.right}:${row.dataset.rightPlacement}`:null].filter(Boolean);
  }
  // A-A and B-B wheel lines can be enumerated in a different order from
  // their relationship rows. Match the actual aspect endpoints, not just the
  // render-local relationIndex (which can be stale during a redraw).
  function relationshipIdentity(node){
    const left=String(node?.dataset?.leftPlacement||'').trim();
    const right=String(node?.dataset?.rightPlacement||'').trim();
    const aspect=String(node?.dataset?.aspect||'').trim();
    if(!left||!right||!aspect)return '';
    const slots=relationshipSlots(node);
    if(slots.left===slots.right){
      const [first,second]=[left,right].sort();
      return `${slots.left}:${first}|${aspect}|${slots.right}:${second}`;
    }
    return `${slots.left}:${left}|${aspect}|${slots.right}:${right}`;
  }

  function closePopup(){popup?.remove();popup=null}
  function openPopup(marker,key,required){
    closePopup();
    const current=Number(window.RelphiHarmonicOrb?.getWindow?.()??7);
    const max=Number(window.RelphiHarmonicOrb?.maxWindow??12);
    const target=Math.min(max,Math.max(Math.ceil(required-1e-8),Math.floor(current)+1));
    if(!Number.isFinite(target)||target<=current)return;
    const panel=document.createElement('div');
    panel.className='sky-focus-hidden-aspect-popover';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','Reveal qualifying relationship');
    const label=document.createElement('p');
    const rawName=key.split(':').slice(1).join(':').replace(/[-_]/g,' ');
    const placementName=rawName.replace(/\b[a-z]/g,letter=>letter.toUpperCase());
    label.textContent=`${placementName} has a matching relationship beyond your current ${Number(current.toFixed(2))}° Harmonic Window. Increase to ${target}° to reveal it.`;
    const actions=document.createElement('div');actions.className='sky-focus-hidden-aspect-actions';
    const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Dismiss';
    const increase=document.createElement('button');increase.type='button';increase.textContent=`Increase to ${target}°`;
    dismiss.addEventListener('click',closePopup);
    increase.addEventListener('click',()=>{
      closePopup();
      window.RelphiHarmonicOrb?.setWindow?.(target);
      const input=document.querySelector('[data-harmonic-window-input]');
      if(input){input.value=String(target);input.setAttribute('aria-valuenow',String(target))}
      window.dispatchEvent(new CustomEvent('relphi:sky-harmonic-window-model-changed',{detail:{harmonicWindow:target}}));
      schedule();
    });
    actions.append(dismiss,increase);panel.append(label,actions);
    document.body.appendChild(panel);popup=panel;
    const rect=marker.getBoundingClientRect();
    const bounds=panel.getBoundingClientRect(),width=bounds.width,height=bounds.height;
    const margin=12,viewportWidth=window.innerWidth,viewportHeight=window.innerHeight;
    const left=Math.max(margin,Math.min(viewportWidth-width-margin,rect.left+rect.width/2-width/2));
    // Prefer below the selected orb, then above it. Stay inside the viewport.
    const below=rect.bottom+12,above=rect.top-height-12;
    let top=below+height<=viewportHeight-margin?below:above>=margin?above:Math.max(margin,Math.min(viewportHeight-height-margin,below));
    panel.style.left=`${left}px`;
    panel.style.top=`${top}px`;
    dismiss.focus();
  }
  function onPlacementClick(event){
    const marker=event.target.closest?.('#skyFoundationWheelMount [data-layer="placements"] [data-sky][data-placement]');
    if(!marker||!marker.classList.contains('is-filter-intermediate'))return;
    const key=`${marker.dataset.sky}:${marker.dataset.placement}`;
    const required=hiddenNearest.get(key);
    if(!Number.isFinite(required))return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    openPopup(marker,key,required);
  }

  function clearMarks(wheel){
    wheel?.classList.remove('has-filter-focus');
    wheel?.querySelectorAll('.is-filter-kept').forEach(node=>node.classList.remove('is-filter-kept'));
    hiddenNearest.clear();closePopup();
    wheel?.querySelectorAll('.is-filter-intermediate').forEach(node=>node.classList.remove('is-filter-intermediate'));
    document.documentElement.removeAttribute('data-sky-filter-wheel-focus');
  }

  function sync(){
    queued=false;
    observeRows();
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if(!wheel)return;

    // Never dismiss the reveal dialog merely because wheel state recalculates.
    wheel.querySelectorAll('.is-filter-kept,.is-filter-intermediate').forEach(node=>node.classList.remove('is-filter-kept','is-filter-intermediate'));

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

    const relations=new Set(),identities=new Set(),placements=new Set(),hiddenCandidates=new Map();
    const currentWindow=Number(window.RelphiHarmonicOrb?.getWindow?.()??7);
    matched.forEach(row=>{
      const index=String(row.dataset.relationIndex||'');
      if(index)relations.add(index);
      const identity=relationshipIdentity(row);
      if(identity)identities.add(identity);
      const keys=endpoints(row),value=phase(row);
      // Only already-visible relationship lines establish full emphasis.
      const shown=!row.hidden&&!row.classList.contains('sky-chart-orb-hidden')&&
        !row.classList.contains('sky-orb-filter-hidden');
      if(shown)keys.forEach(key=>placements.add(key));
      else if(Number.isFinite(value)&&value>currentWindow)keys.forEach(key=>{
        hiddenCandidates.set(key,Math.min(value,hiddenCandidates.get(key)??Infinity));
      });
    });
    // Emphasis belongs to BOTH ends of every matching relationship, not
    // exclusively to the placement category selected in the Focus menu.
    wheel.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect').forEach(node=>{
      const identity=relationshipIdentity(node);
      // A matching identity takes precedence over a possibly recycled index.
      // Index-only fallback remains for older aspect nodes without endpoints.
      const kept=identity?identities.has(identity):relations.has(String(node.dataset.relationIndex||''));
      node.classList.toggle('is-filter-kept',kept);
    });
    hiddenNearest=new Map([...hiddenCandidates].filter(([key])=>!placements.has(key)));
    wheel.querySelectorAll('[data-layer="placements"] [data-sky][data-placement], [data-layer="leaders"] [data-sky][data-placement]').forEach(node=>{
      const key=`${node.dataset.sky}:${node.dataset.placement}`;
      node.classList.toggle('is-filter-kept',placements.has(key));
      node.classList.toggle('is-filter-intermediate',hiddenNearest.has(key));
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
    // Capture pointer activation before the foundation wheel's own click handler
    // can lock an orb or trigger a competing focus refresh.
    document.addEventListener('pointerdown',onPlacementClick,true);
    document.addEventListener('click',onPlacementClick,true);
    document.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      const marker=event.target.closest?.('#skyFoundationWheelMount [data-layer="placements"] [data-sky][data-placement].is-filter-intermediate');
      if(!marker)return;
      event.preventDefault();event.stopImmediatePropagation();
      const key=`${marker.dataset.sky}:${marker.dataset.placement}`,required=hiddenNearest.get(key);
      if(Number.isFinite(required))openPopup(marker,key,required);
    },true);
    document.addEventListener('pointerdown',event=>{if(popup&&!event.target.closest?.('.sky-focus-hidden-aspect-popover')&&!event.target.closest?.('.is-filter-intermediate'))closePopup()},true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closePopup()});
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
