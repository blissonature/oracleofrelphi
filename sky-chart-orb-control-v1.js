// Harmonic phase-window control. Renderers hold a stable maximum candidate set;
// this control only changes which relationships are visible at the chosen phase window.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyOrbControlV11)return;
  window.__relphiSkyOrbControlV11=true;
  window.__relphiSkyOrbControlV10=true;window.__relphiSkyOrbControlV9=true;window.__relphiSkyOrbControlV8=true;window.__relphiSkyOrbControlV7=true;window.__relphiSkyOrbControlV6=true;window.__relphiSkyOrbControlV5=true;window.__relphiSkyOrbControlV4=true;window.__relphiSkyOrbControlV3=true;window.__relphiSkyOrbControlV2=true;window.__relphiSkyOrbControlV1=true;

  let queued=false,wheelIndexes=null,wheelState=null,installQueued=false,filterObserver=null,lastApplied=null;
  const model=()=>window.RelphiHarmonicOrb;
  const whereWhenEditing=()=>document.documentElement.dataset.skyWhereWhenEditing==='true';

  function initialWindow(){
    return model()?.getWindow?.()??model()?.defaultWindow??7;
  }

  function phaseFromRow(row){
    const explicit=Number(row.dataset.phaseError);
    if(Number.isFinite(explicit))return explicit;
    const orb=Number(row.dataset.sourceOrb??row.dataset.orb),harmonic=Number(row.dataset.harmonicOrder);
    return Number.isFinite(orb)&&Number.isFinite(harmonic)&&harmonic>0?Math.abs(orb*harmonic):NaN;
  }

  function metricsFor(phase,limit){
    const fraction=limit>0?phase/limit:(phase===0?0:Infinity);
    const coherence=phase===0&&limit===0?1:(limit>0&&phase<=limit?Math.cos(Math.min(1,fraction)*Math.PI/2)**2:0);
    return{fraction,coherence};
  }

  function setSvgVisibility(node,visible){
    node.hidden=!visible;
    node.classList.toggle('sky-chart-orb-hidden',!visible);
    node.setAttribute('aria-hidden',visible?'false':'true');
    if(visible){node.style.removeProperty('display');node.style.removeProperty('pointer-events')}
    else{node.style.setProperty('display','none','important');node.style.setProperty('pointer-events','none','important')}
  }

  function relationshipSlots(row){
    const left=String(row?.dataset?.leftSky||'').toUpperCase(),right=String(row?.dataset?.rightSky||'').toUpperCase(),mode=String(row?.dataset?.relationshipMode||'').toUpperCase();
    return{
      left:left==='A'||left==='B'?left:mode==='B-B'?'B':'A',
      right:right==='A'||right==='B'?right:mode==='A-A'?'A':'B'
    };
  }

  function relationshipKey(node){return `${String(node?.dataset?.relationshipMode||'A-B').toUpperCase()}::${String(node?.dataset?.relationIndex||'')}`}
  function reconcilePlacementIsolation(rows,visibleIndexes){
    // The foundation interaction controller owns live hover highlighting.
    // This reconciliation is reserved for persistent selections.
    if(wheelState?.kind!=='placement'||wheelState?.mode==='hover')return;
    const target=`${wheelState.sky}:${wheelState.value}`,kept=new Set([target]);
    rows.forEach(row=>{
      if(!visibleIndexes.has(relationshipKey(row)))return;
      const slots=relationshipSlots(row),left=`${slots.left}:${row.dataset.leftPlacement}`,right=`${slots.right}:${row.dataset.rightPlacement}`;
      if(left!==target&&right!==target)return;
      kept.add(left);kept.add(right);
    });
    document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="placement"],#skyFoundationWheelMount [data-focus-piece="leader"]').forEach(node=>node.classList.toggle('is-kept',kept.has(`${node.dataset.sky}:${node.dataset.placement}`)));
  }

  function nextRevealWindow(rows,current,max){
    const candidates=rows.filter(row=>row.dataset.bySignOnly!=='true'&&!row.classList.contains('sky-chart-filter-hidden')&&!row.classList.contains('sky-chart-multiselect-hidden')&&!row.classList.contains('sky-chart-house-multiselect-hidden')&&!row.classList.contains('sky-chart-aspect-multiselect-hidden')&&!row.classList.contains('sky-chart-sign-filter-hidden')&&!row.classList.contains('sky-foundation-single-sky-cross-hidden')&&(!wheelIndexes||wheelIndexes.has(String(row.dataset.relationIndex))))
      .map(phaseFromRow).filter(phase=>Number.isFinite(phase)&&phase>current+1e-8&&phase<=max+1e-8);
    if(!candidates.length)return null;
    return Math.min(max,Math.max(Math.floor(current)+1,Math.ceil(Math.min(...candidates)-1e-8)));
  }

  function ensureShowMoreRow(){
    const list=document.getElementById('skyFoundationRelationshipList');if(!list)return null;
    let button=list.querySelector('[data-harmonic-show-more]');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='sky-foundation-harmonic-show-more';
      button.dataset.harmonicShowMore='true';
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        const m=model(),current=Number(m?.getWindow?.()??m?.defaultWindow??7),max=Number(m?.maxWindow??12);
        const rows=[...document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]')];
        const next=nextRevealWindow(rows,current,max);
        if(next!==null&&next>current)m?.setWindow?.(next);
        schedule();
      });
      list.appendChild(button);
    }
    // Relationship scope/sort controller alone owns helper ordering.
    return button;
  }
  function apply(){
    queued=false;
    // Sky A/B edits are drafts. The committed comparison-wheel aspect lines
    // must not be rewritten by Harmonic Window while Where and When is open.
    if(whereWhenEditing())return;
    const limit=Number(model()?.getWindow?.()??model()?.defaultWindow??7);
    if(!Number.isFinite(limit))return;
    const visibleIndexes=new Set(),lineVisibleKeys=new Set(),rows=[...document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]')],identity=relationshipKey,rowsByIndex=new Map(rows.map(row=>[identity(row),row]));
    let hiddenByHarmonicWindow=0;
    rows.forEach(row=>{
      const phase=phaseFromRow(row),hiddenByOrb=row.dataset.bySignOnly!=='true'&&Number.isFinite(phase)&&phase>limit,hiddenByWheel=wheelIndexes&&!wheelIndexes.has(String(row.dataset.relationIndex));
      const hiddenByOther=row.classList.contains('sky-chart-filter-hidden')||row.classList.contains('sky-chart-multiselect-hidden')||row.classList.contains('sky-chart-house-multiselect-hidden')||row.classList.contains('sky-chart-aspect-multiselect-hidden')||row.classList.contains('sky-chart-sign-filter-hidden')||row.classList.contains('sky-foundation-single-sky-cross-hidden');
      if(hiddenByOrb&&!hiddenByWheel&&!hiddenByOther)hiddenByHarmonicWindow+=1;
      // A wheel focus dims nonmatching aspect lines. It must never hide them:
      // users need to be able to tap a different line to replace the focus.
      // Selection/hover must not make the SVG layer disappear. A line's
      // visibility is determined by filters and harmonic window alone, never
      // by a selected relationship or whether its row is temporarily hidden.
      const lineEligible=!hiddenByOrb&&!hiddenByOther;
      if(lineEligible)lineVisibleKeys.add(identity(row));
      // Wheel focus must not hide relationship tiles; it only highlights one.
      const visible=lineEligible;
      row.classList.toggle('sky-chart-orb-hidden',hiddenByOrb);row.hidden=!visible;
      // Focused rows are CSS-hidden, too; do not expose them to screen readers.
      const temporarilyExcluded=row.classList.contains('is-wheel-selection-excluded');
      row.setAttribute('aria-hidden',visible&&!temporarilyExcluded?'false':'true');
      if(Number.isFinite(phase)&&row.dataset.bySignOnly!=='true'){
        const dynamic=metricsFor(phase,limit);
        row.dataset.harmonicWindow=limit.toFixed(6);
        row.dataset.windowFraction=Number.isFinite(dynamic.fraction)?dynamic.fraction.toFixed(6):String(dynamic.fraction);
        row.dataset.harmonicCoherence=dynamic.coherence.toFixed(8);
      }
      if(visible)visibleIndexes.add(identity(row));
    });

    document.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect').forEach(line=>{
      const index=String(line.dataset.relationIndex||''),key=identity(line);
      // Some SVG relation indexes differ from the reordered list indexes.
      // Use canonical endpoint identity as fallback. A focus click must not
      // turn the entire aspect layer off merely because no row key matched.
      const counterpart=rowsByIndex.get(key);
      const eligible=counterpart?lineVisibleKeys.has(key):
        !['sky-chart-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden',
          'sky-chart-aspect-multiselect-hidden','sky-chart-sign-filter-hidden','sky-foundation-single-sky-cross-hidden']
          .some(name=>line.classList.contains(name)) &&
        (line.dataset.bySignOnly==='true'||!Number.isFinite(Number(line.dataset.phaseError))||
          Number(line.dataset.phaseError)<=limit);
      setSvgVisibility(line,eligible);
      const row=index?rowsByIndex.get(key):null;
      if(row){line.dataset.harmonicWindow=row.dataset.harmonicWindow||'';line.dataset.harmonicCoherence=row.dataset.harmonicCoherence||''}
    });

    // No placement or leader highlighting here: Harmonic Window owns only
    // relationship rows and aspect-line visibility.
    // Keep the same temporarily focused count when Harmonic Window reruns.
    // These CSS-excluded tiles are still in the DOM and must not be counted.
    const displayedIndexes=new Set(rows.filter(row=>visibleIndexes.has(identity(row))&&
      !row.classList.contains('is-wheel-selection-excluded')).map(identity));
    const displayedCount=displayedIndexes.size;
    const count=document.getElementById('skyFoundationRelationshipCount'),empty=document.getElementById('skyFoundationRelationshipEmpty');
    if(count){
      count.textContent=String(displayedCount);
      count.dataset.matchCount=String(displayedCount);
      count.dataset.countLabel='matches';
      count.setAttribute('aria-label',displayedCount+' matching relationships');
    }
    if(empty)empty.hidden=displayedCount!==0||(wheelState?.mode!=='selected'&&hiddenByHarmonicWindow>0);
    const more=ensureShowMoreRow(),max=Number(model()?.maxWindow??12);
    if(more){
      const next=nextRevealWindow(rows,limit,max);
      const canReveal=next!==null&&next>limit&&hiddenByHarmonicWindow>0;
      more.hidden=!canReveal;
      more.textContent=canReveal?`${hiddenByHarmonicWindow} more beyond ${Number(limit.toFixed(2))}° · Increase to ${next}°`:'';
      more.setAttribute('aria-label',canReveal?`Increase Harmonic Window to ${next} degrees to reveal additional relationships`:'Show more relationships');
    }
    document.documentElement.dataset.skyHarmonicWindow=String(limit);

    if(lastApplied!==limit){
      lastApplied=limit;
      window.dispatchEvent(new CustomEvent('relphi:sky-harmonic-window-visibility-changed',{detail:{harmonicWindow:limit,visible:visibleIndexes.size,total:rows.length}}));
    }
  }

  function schedule(){if(queued||whereWhenEditing())return;queued=true;requestAnimationFrame(apply)}

  function normalizeOnCommit(input){
    const max=model()?.maxWindow??12,raw=input.value.trim().replace(',','.'),value=Number(raw);
    if(!Number.isFinite(value))return;
    input.value=String(Math.max(0,Math.min(max,value)));
  }
  function driveFromInput(input,commit=false){
    if(commit)normalizeOnCommit(input);
    const max=model()?.maxWindow??12,raw=input.value.trim().replace(',','.'),value=Number(raw);
    const valid=raw!==''&&Number.isFinite(value)&&value>=0&&value<=max;
    input.setCustomValidity(valid?'':`Enter a harmonic phase window from 0 to ${max} degrees.`);
    input.setAttribute('aria-invalid',valid?'false':'true');
    if(!valid)return;
    input.setAttribute('aria-valuenow',String(value));
    model()?.setWindow?.(value,input);
    schedule();
  }

  function install(){
    const slot=document.querySelector('#skyFoundationFocus .sky-focus-heading-controls');
    if(!slot)return false;
    let field=document.querySelector('[data-orb-field="true"]');
    const display=slot.querySelector(':scope>[data-relationship-display-control]');
    const wheelActions=slot.querySelector(':scope>.sky-export-wheel-slot');
    if(field&&field.parentElement!==slot)slot.insertBefore(field,wheelActions||null);
    if(field){
      field.style.order='20';
      if(display&&field.previousElementSibling!==display)slot.insertBefore(field,display.nextSibling);
      return true;
    }
    field=document.createElement('label');field.className='sky-orb-number-field';field.dataset.orbField='true';
    const caption=document.createElement('span');caption.textContent='Harmonic Window';
    const input=document.createElement('input'),m=model();
    input.type='text';input.inputMode='decimal';input.autocomplete='off';input.value=String(initialWindow());
    input.dataset.harmonicWindowInput='true';input.dataset.orbMode='harmonic-phase';
    input.setAttribute('role','spinbutton');input.setAttribute('aria-valuemin','0');input.setAttribute('aria-valuemax',String(m?.maxWindow??12));input.setAttribute('aria-valuenow',input.value);
    input.setAttribute('aria-label',`Master harmonic phase window in degrees, maximum ${m?.maxWindow??12}`);
    field.append(caption,input);field.style.order='20';
    if(display)slot.insertBefore(field,display.nextSibling);
    else slot.insertBefore(field,wheelActions||null);
    input.addEventListener('input',()=>driveFromInput(input,false));
    input.addEventListener('change',()=>driveFromInput(input,true));
    input.addEventListener('blur',()=>driveFromInput(input,true));
    schedule();return true;
  }

  function ensureInstalled(){if(installQueued)return;installQueued=true;requestAnimationFrame(()=>{installQueued=false;install();schedule()})}

  function observeFilterBay(){
    const host=document.getElementById('skyFoundationRelationships')||document.getElementById('skyFoundationComparison')||document.body;
    if(filterObserver||!host)return;
    filterObserver=new MutationObserver(records=>{if(records.some(record=>record.type==='childList'&&(record.addedNodes.length||record.removedNodes.length)))ensureInstalled()});
    filterObserver.observe(host,{childList:true,subtree:true});
  }

  function start(){
    // Preserve the user's explicit Harmonic Window across reloads.
    model()?.setWindow?.(model()?.getWindow?.()??model()?.defaultWindow??7);
    ensureInstalled();observeFilterBay();
    window.addEventListener('relphi:sky-foundation-filter-changed',event=>{
      const nextState=event.detail?.state||null;
      const hover=nextState?.mode==='hover'||(!nextState&&wheelState?.mode==='hover');
      if(hover){
        wheelState=nextState;
        wheelIndexes=null;
        return;
      }
      wheelState=nextState;
      wheelIndexes=wheelState?.mode==='selected'?new Set((event.detail.relationshipIndexes||[]).map(String)):null;
      schedule();
    });
    ['relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:selected-relationship-rendered','relphi:sky-foundation-ready'].forEach(name=>window.addEventListener(name,ensureInstalled));
    ['relphi:sky-configuration-selection-changed','relphi:sky-configurations-detected','relphi:sky-aspect-visibility-applied'].forEach(name=>window.addEventListener(name,()=>{ensureInstalled();schedule()}));
    window.addEventListener('relphi:sky-harmonic-window-model-changed',schedule);
    window.addEventListener('relphi:sky-where-when-edit-state-changed',event=>{
      if(event.detail?.active===false)schedule();
    });
    document.getElementById('skyFoundationRelationships')?.addEventListener('change',schedule);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();