// Explicit numeric orb filter. Wheel hover preserves the list; wheel click/tap filters it.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyOrbControlV2)return;
  window.__relphiSkyOrbControlV2=true;
  window.__relphiSkyOrbControlV1=true;

  let queued=false;
  let wheelIndexes=null;
  let wheelState=null;

  function orbFromRow(row){
    const explicit=Number(row.dataset.orb ?? row.dataset.sourceOrb);
    if(Number.isFinite(explicit))return explicit;
    const match=String(row.getAttribute('aria-label')||'').match(/orb\s+([0-9]+(?:\.[0-9]+)?)/i);
    if(!match)return NaN;
    const value=Number(match[1]);
    row.dataset.orb=String(value);
    return value;
  }

  function setSvgVisibility(node,visible){
    node.hidden=!visible;
    node.classList.toggle('sky-chart-orb-hidden',!visible);
    node.setAttribute('aria-hidden',visible?'false':'true');
    if(visible){
      node.style.removeProperty('display');
      node.style.removeProperty('pointer-events');
    }else{
      node.style.setProperty('display','none','important');
      node.style.setProperty('pointer-events','none','important');
    }
  }

  function reconcilePlacementIsolation(rows,visibleIndexes){
    if(wheelState?.kind!=='placement')return;
    const keptPlacements=new Set([`${wheelState.sky}:${wheelState.value}`]);
    rows.forEach(row=>{
      if(!visibleIndexes.has(String(row.dataset.relationIndex)))return;
      keptPlacements.add(`A:${row.dataset.leftPlacement}`);
      keptPlacements.add(`B:${row.dataset.rightPlacement}`);
    });

    document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="placement"],#skyFoundationWheelMount [data-focus-piece="leader"]').forEach(node=>{
      const key=`${node.dataset.sky}:${node.dataset.placement}`;
      node.classList.toggle('is-kept',keptPlacements.has(key));
    });
    ['A','B'].forEach(slot=>{
      const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');
      panel?.querySelectorAll('.sky-foundation-row[data-placement]').forEach(row=>{
        row.classList.toggle('is-kept',keptPlacements.has(`${slot}:${row.dataset.placement}`));
      });
    });
  }

  function apply(){
    queued=false;
    const input=document.querySelector('[data-filter="orb"]');
    if(!input)return;
    const raw=input.value.trim();
    const limit=Number(raw);
    const valid=raw!==''&&Number.isFinite(limit)&&limit>=0&&limit<=360;
    input.setCustomValidity(valid?'':'Enter an orb from 0 to 360 degrees.');
    if(!valid)return;

    const visibleIndexes=new Set();
    const rows=[...document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]')];
    rows.forEach(row=>{
      const orb=orbFromRow(row);
      const hiddenByOrb=Number.isFinite(orb)&&orb>limit;
      const hiddenByWheel=wheelIndexes&&!wheelIndexes.has(String(row.dataset.relationIndex));
      const hiddenByOther=row.classList.contains('sky-chart-filter-hidden')||
        row.classList.contains('sky-chart-multiselect-hidden')||
        row.classList.contains('sky-chart-house-multiselect-hidden')||
        row.classList.contains('sky-chart-aspect-multiselect-hidden')||
        row.classList.contains('sky-foundation-single-sky-cross-hidden');
      const visible=!hiddenByOrb&&!hiddenByWheel&&!hiddenByOther;
      row.classList.toggle('sky-chart-orb-hidden',hiddenByOrb);
      row.hidden=!visible;
      row.setAttribute('aria-hidden',visible?'false':'true');
      if(visible)visibleIndexes.add(String(row.dataset.relationIndex));
    });

    document.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect').forEach(line=>{
      const relationIndex=String(line.dataset.relationIndex||'');
      setSvgVisibility(line,relationIndex!==''&&visibleIndexes.has(relationIndex));
    });

    // The wheel interaction controller starts from the complete calculated relationship set.
    // Reconcile placement isolation against the active Orb/list filters so an endpoint cannot
    // remain illuminated when its relationship is absent from the visible Relationships list.
    reconcilePlacementIsolation(rows,visibleIndexes);

    const visible=visibleIndexes.size;
    const count=document.getElementById('skyFoundationRelationshipCount');
    if(count)count.textContent=`${visible}/${rows.length}`;
    const empty=document.getElementById('skyFoundationRelationshipEmpty');
    if(empty)empty.hidden=visible!==0;

    document.documentElement.dataset.skyOrbVisibleRows=String(visible);
    document.documentElement.dataset.skyOrbVisibleLines=String(
      document.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect[data-relation-index]:not([aria-hidden="true"])').length
    );
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}

  function install(){
    const bar=document.querySelector('.sky-chart-filter-bar');
    if(!bar||bar.querySelector('[data-filter="orb"]'))return;
    const field=document.createElement('label');
    field.className='sky-orb-number-field';
    const caption=document.createElement('span');
    caption.textContent='Orb';
    const input=document.createElement('input');
    input.type='number';
    input.min='0';
    input.max='360';
    input.step='0.1';
    input.inputMode='decimal';
    input.value='1';
    input.dataset.filter='orb';
    input.setAttribute('aria-label','Maximum orb in degrees');
    field.append(caption,input);
    bar.prepend(field);
    input.addEventListener('input',schedule);
    input.addEventListener('change',schedule);
    schedule();
  }

  function start(){
    install();
    window.addEventListener('relphi:sky-foundation-interactions-ready',()=>{install();schedule()});
    window.addEventListener('relphi:sky-foundation-filter-changed',event=>{
      wheelState=event.detail?.state||null;
      wheelIndexes=wheelState?.mode==='selected'?new Set((event.detail.relationshipIndexes||[]).map(String)):null;
      schedule();
    });
    [
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-aspect-multiselect-changed',
      'relphi:selected-relationship-rendered'
    ].forEach(name=>window.addEventListener(name,schedule));
    document.getElementById('skyFoundationRelationships')?.addEventListener('change',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
