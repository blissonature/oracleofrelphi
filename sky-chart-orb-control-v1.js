// Harmonic phase-window control. Renderers hold a stable maximum candidate set;
// this control only changes which relationships are visible at the chosen phase window.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyOrbControlV11)return;
  window.__relphiSkyOrbControlV11=true;
  window.__relphiSkyOrbControlV10=true;window.__relphiSkyOrbControlV9=true;window.__relphiSkyOrbControlV8=true;window.__relphiSkyOrbControlV7=true;window.__relphiSkyOrbControlV6=true;window.__relphiSkyOrbControlV5=true;window.__relphiSkyOrbControlV4=true;window.__relphiSkyOrbControlV3=true;window.__relphiSkyOrbControlV2=true;window.__relphiSkyOrbControlV1=true;

  let queued=false,wheelIndexes=null,wheelState=null,installQueued=false,filterObserver=null,lastApplied=null;
  let activeWindow=null;
  const model=()=>window.RelphiHarmonicOrb;
  const visibleInput=()=>document.querySelector('[data-harmonic-window-input]');

  function initialWindow(){
    const fallback=model()?.defaultWindow??6;
    return activeWindow==null?fallback:activeWindow;
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

  function reconcilePlacementIsolation(rows,visibleIndexes){
    if(wheelState?.kind!=='placement')return;
    const kept=new Set([`${wheelState.sky}:${wheelState.value}`]);
    rows.forEach(row=>{
      if(!visibleIndexes.has(String(row.dataset.relationIndex)))return;
      kept.add(`A:${row.dataset.leftPlacement}`);kept.add(`B:${row.dataset.rightPlacement}`);
    });
    document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="placement"],#skyFoundationWheelMount [data-focus-piece="leader"]').forEach(node=>node.classList.toggle('is-kept',kept.has(`${node.dataset.sky}:${node.dataset.placement}`)));
  }

  function apply(){
    queued=false;
    const input=visibleInput();if(!input)return;
    const raw=input.value.trim().replace(',','.'),limit=Number(raw),max=model()?.maxWindow??12;
    const valid=raw!==''&&Number.isFinite(limit)&&limit>=0&&limit<=max;
    input.setCustomValidity(valid?'':`Enter a harmonic phase window from 0 to ${max} degrees.`);
    input.setAttribute('aria-invalid',valid?'false':'true');
    if(!valid)return;

    activeWindow=limit;
    model()?.setWindow?.(limit);
    const visibleIndexes=new Set(),rows=[...document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]')],rowsByIndex=new Map(rows.map(row=>[String(row.dataset.relationIndex||''),row]));
    rows.forEach(row=>{
      const phase=phaseFromRow(row),hiddenByOrb=Number.isFinite(phase)&&phase>limit,hiddenByWheel=wheelIndexes&&!wheelIndexes.has(String(row.dataset.relationIndex));
      const hiddenByOther=row.classList.contains('sky-chart-filter-hidden')||row.classList.contains('sky-chart-multiselect-hidden')||row.classList.contains('sky-chart-house-multiselect-hidden')||row.classList.contains('sky-chart-aspect-multiselect-hidden')||row.classList.contains('sky-chart-sign-filter-hidden')||row.classList.contains('sky-foundation-single-sky-cross-hidden');
      const visible=!hiddenByOrb&&!hiddenByWheel&&!hiddenByOther;
      row.classList.toggle('sky-chart-orb-hidden',hiddenByOrb);row.hidden=!visible;row.setAttribute('aria-hidden',visible?'false':'true');
      if(Number.isFinite(phase)){
        const dynamic=metricsFor(phase,limit);
        row.dataset.harmonicWindow=limit.toFixed(6);
        row.dataset.windowFraction=Number.isFinite(dynamic.fraction)?dynamic.fraction.toFixed(6):String(dynamic.fraction);
        row.dataset.harmonicCoherence=dynamic.coherence.toFixed(8);
      }
      if(visible)visibleIndexes.add(String(row.dataset.relationIndex));
    });

    document.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect').forEach(line=>{
      const index=String(line.dataset.relationIndex||'');
      setSvgVisibility(line,index!==''&&visibleIndexes.has(index));
      const row=index?rowsByIndex.get(index):null;
      if(row){line.dataset.harmonicWindow=row.dataset.harmonicWindow||'';line.dataset.harmonicCoherence=row.dataset.harmonicCoherence||''}
    });

    reconcilePlacementIsolation(rows,visibleIndexes);
    const count=document.getElementById('skyFoundationRelationshipCount'),empty=document.getElementById('skyFoundationRelationshipEmpty');
    if(count)count.textContent=`${visibleIndexes.size}/${rows.length}`;
    if(empty)empty.hidden=visibleIndexes.size!==0;
    document.documentElement.dataset.skyHarmonicWindow=String(limit);

    if(lastApplied!==limit){
      lastApplied=limit;
      window.dispatchEvent(new CustomEvent('relphi:sky-harmonic-window-visibility-changed',{detail:{harmonicWindow:limit,visible:visibleIndexes.size,total:rows.length}}));
    }
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}

  function normalizeOnCommit(input){
    const max=model()?.maxWindow??12,raw=input.value.trim().replace(',','.'),value=Number(raw);
    if(!Number.isFinite(value))return;
    input.value=String(Math.max(0,Math.min(max,value)));
  }

  function install(){
    const bar=document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar')||document.querySelector('.sky-chart-filter-bar');
    if(!bar||bar.querySelector('[data-harmonic-window-input]'))return false;
    const field=document.createElement('label');field.className='sky-orb-number-field';field.dataset.orbField='true';
    const caption=document.createElement('span');caption.textContent='Harmonic Window';
    const input=document.createElement('input'),m=model();
    input.type='text';input.inputMode='decimal';input.autocomplete='off';input.value=String(initialWindow());
    input.dataset.harmonicWindowInput='true';input.dataset.orbMode='harmonic-phase';
    input.setAttribute('role','spinbutton');input.setAttribute('aria-valuemin','0');input.setAttribute('aria-valuemax',String(m?.maxWindow??12));input.setAttribute('aria-valuenow',input.value);
    input.setAttribute('aria-label',`Master harmonic phase window in degrees, maximum ${m?.maxWindow??12}`);
    field.append(caption,input);bar.prepend(field);
    input.addEventListener('input',()=>{input.setAttribute('aria-valuenow',input.value.trim().replace(',','.'));schedule()});
    input.addEventListener('change',()=>{normalizeOnCommit(input);input.setAttribute('aria-valuenow',input.value);schedule()});
    input.addEventListener('blur',()=>{normalizeOnCommit(input);input.setAttribute('aria-valuenow',input.value);schedule()});
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
    // Deliberately start a new page load at the canonical default. The previous
    // session-storage behavior preserved accidental zeroes caused by the old
    // scroll-sensitive number input.
    activeWindow=model()?.defaultWindow??6;
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
    ['relphi:sky-foundation-interactions-ready','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:selected-relationship-rendered','relphi:sky-foundation-ready'].forEach(name=>window.addEventListener(name,ensureInstalled));
    document.getElementById('skyFoundationRelationships')?.addEventListener('change',schedule);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();