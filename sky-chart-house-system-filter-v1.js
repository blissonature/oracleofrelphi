// Makes house system a live comparison-wheel setting rather than a sky-creation choice.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SETTING_KEY = 'relphiSkyChartHouseSystemViewV1';
  const SLOT_KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const SYSTEMS = [
    ['whole-sign','Whole Sign'],
    ['equal-house','Equal House'],
    ['porphyry','Porphyry'],
    ['placidus','Placidus'],
    ['alcabitius','Alcabitius'],
    ['regiomontanus','Regiomontanus'],
    ['campanus','Campanus'],
    ['koch','Koch']
  ];
  let queued = false;
  let recalculating = false;

  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function placements(payload) { const value = payload && (payload.placements || payload); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function profile(payload) { return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {}; }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function setValue(id, value) { const node=document.getElementById(id); if(!node)return; node.value=value == null ? '' : String(value); fire(node,'input'); fire(node,'change'); }
  function delay(ms) { return new Promise(function(resolve){ setTimeout(resolve,ms); }); }
  function activeSystem() {
    const stored = localStorage.getItem(SETTING_KEY);
    if (SYSTEMS.some(function(item){return item[0]===stored;})) return stored;
    const inherited = profile(read(SLOT_KEYS.skyA)).houseSystem;
    return SYSTEMS.some(function(item){return item[0]===inherited;}) ? inherited : 'whole-sign';
  }
  function saveSystem(value) { try { localStorage.setItem(SETTING_KEY,value); } catch (_) {} }
  function normalizedText(node) { return String(node?.textContent || '').trim().replace(/\s+/g,' ').toLowerCase(); }

  function houseFilterContainer() {
    const candidates = Array.from(document.querySelectorAll('details,fieldset,.filter-group,.sky-filter-group,.chart-filter-group,.sky-filter-category'));
    return candidates.find(function(node){
      const heading=node.querySelector(':scope > summary,:scope > legend,:scope > button,:scope > .filter-heading,:scope > .sky-filter-heading');
      return normalizedText(heading).startsWith('houses');
    }) || null;
  }

  function subsectionHeading(node) {
    return node?.querySelector(':scope > legend,:scope > summary,:scope > h3,:scope > h4,:scope > strong,:scope > .filter-subheading,:scope > .sky-filter-subheading');
  }

  function setsSection(root) {
    const candidates = Array.from(root.querySelectorAll('fieldset,section,details,div'));
    return candidates.find(function(node){ return normalizedText(subsectionHeading(node)) === 'sets'; }) || null;
  }

  function copyClasses(target, source) {
    if (!target || !source) return;
    source.classList.forEach(function(name){ target.classList.add(name); });
  }

  function createControl(container, panel, sets) {
    const fieldset=document.createElement('fieldset');
    fieldset.id='relphiHouseSystemFilter';
    fieldset.className='relphi-house-system-filter';
    if (sets) copyClasses(fieldset,sets);

    const legend=document.createElement('legend');
    legend.textContent='House System';
    legend.className='relphi-house-system-heading';
    copyClasses(legend,subsectionHeading(sets));
    fieldset.appendChild(legend);

    const choices=document.createElement('div');
    choices.className='relphi-house-system-choices';
    const sourceChoices=sets?.querySelector(':scope > div,:scope > ul,:scope > .filter-options,:scope > .sky-filter-options');
    copyClasses(choices,sourceChoices);
    const sourceLabel=sets?.querySelector('label');
    const selected=activeSystem();

    SYSTEMS.forEach(function(item){
      const label=document.createElement('label');
      label.className='relphi-house-system-choice';
      copyClasses(label,sourceLabel);
      const input=document.createElement('input');
      input.type='radio';
      input.name='relphi-house-system';
      input.value=item[0];
      input.checked=item[0]===selected;
      const text=document.createElement('span');
      text.textContent=item[1];
      label.append(input,text);
      choices.appendChild(label);
    });

    const status=document.createElement('p');
    status.className='relphi-house-system-status';
    status.setAttribute('aria-live','polite');
    fieldset.append(choices,status);
    if (sets && sets.parentElement) sets.parentElement.insertBefore(fieldset,sets);
    else panel.prepend(fieldset);

    fieldset.addEventListener('change',function(event){
      const input=event.target.closest('input[type="radio"]');
      if(input) changeSystem(input.value,fieldset);
    });
    return fieldset;
  }

  function installControl() {
    const container=houseFilterContainer();
    if(!container)return;
    const panel=container.querySelector(':scope > div,:scope > section,:scope > .filter-panel,:scope > .filter-options,:scope > .sky-filter-options') || container;
    const sets=setsSection(panel);
    let fieldset=document.getElementById('relphiHouseSystemFilter');
    if(!fieldset) fieldset=createControl(container,panel,sets);
    else if(sets && fieldset.nextElementSibling!==sets) sets.parentElement.insertBefore(fieldset,sets);
  }

  function hideCreationControl() {
    const select=document.getElementById('skyCalcHouseSystem');
    if (select) {
      select.value=activeSystem();
      const label=select.closest('label');
      if(label){ label.hidden=true; label.setAttribute('aria-hidden','true'); }
      select.tabIndex=-1;
    }
    document.querySelectorAll('.relphi-workspace-meta div').forEach(function(row){
      const term=normalizedText(row.querySelector('dt'));
      if(term==='houses' || term==='house system') row.remove();
    });
    document.querySelectorAll('.relphi-v4-choice-grid .choice span').forEach(function(copy){
      if(/date, time, place, or house system/i.test(copy.textContent || '')) copy.textContent='Change the date, time, or place and recalculate.';
    });
    const calcSummary=document.querySelector('.sky-calc-drawer > summary small');
    if(calcSummary && /house system/i.test(calcSummary.textContent || '')) calcSummary.textContent='Astronomy Engine · date · time · typed location';
  }

  function setBusy(fieldset,busy,message) {
    fieldset?.querySelectorAll('input').forEach(function(input){input.disabled=busy;});
    const status=fieldset?.querySelector('.relphi-house-system-status');
    if(status) status.textContent=message || '';
  }
  function requiredProfile(payload) {
    const p=profile(payload);
    return payload && p.dateTime && p.timeZone && Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude));
  }

  async function calculateSlot(slot,system) {
    const key=SLOT_KEYS[slot], payload=read(key);
    if(!payload || !Object.keys(placements(payload)).length) return {skipped:true};
    if(!requiredProfile(payload)) throw new Error((payload.name || (slot==='skyA'?'Sky A':'Sky B')) + ' does not have enough saved date, time, and location data to recalculate houses.');
    const p=profile(payload), target=slot==='skyA'?'chart':'currentSky';
    setValue('skyCalcTarget',target); setValue('skyCreatorTarget',target); setValue('skyCalcName',payload.name || '');
    setValue('skyCalcDateTime',p.dateTime); setValue('skyCalcTimeZone',p.timeZone); setValue('skyCalcLocation',p.location || '');
    setValue('skyCalcLatitude',p.latitude); setValue('skyCalcLongitude',p.longitude); setValue('skyCalcHouseSystem',system);
    const ph=document.getElementById('skyCalcUsePlanetaryHours'); if(ph){ph.checked=false;fire(ph,'change');}
    const before=JSON.stringify(placements(payload)), status=document.getElementById('skyCalcStatus'), previousStatus=normalizedText(status);
    document.getElementById('skyCalcRun')?.click();
    const started=Date.now(); let finished=false;
    while(Date.now()-started<65000){
      const text=String(status?.textContent || '').trim();
      if(/^Calculated\b/i.test(text) && (normalizedText(status)!==previousStatus || Date.now()-started>500)){finished=true;break;}
      if(/^(Could not|Enter |Choose |No location|Location search failed|Date |Time zone)/i.test(text)) throw new Error(text);
      await delay(140);
    }
    if(!finished) throw new Error('House recalculation did not finish.');
    document.getElementById(slot==='skyA'?'saveChart':'saveCurrentSky')?.click();
    const saveStarted=Date.now();
    while(Date.now()-saveStarted<10000){
      const next=read(key);
      if(next && JSON.stringify(placements(next))!==before){
        next.name=payload.name; next.notes=payload.notes || next.notes || '';
        next.calcProfile={...p,...profile(next),houseSystem:system,name:payload.name || ''}; write(key,next); return {payload:next};
      }
      await delay(120);
    }
    const next=read(key) || payload;
    next.calcProfile={...p,...profile(next),houseSystem:system,name:payload.name || ''}; write(key,next); return {payload:next};
  }

  async function changeSystem(system,fieldset) {
    if(recalculating || !SYSTEMS.some(function(item){return item[0]===system;})) return;
    recalculating=true; saveSystem(system); hideCreationControl(); setBusy(fieldset,true,'Recalculating houses for Sky A and Sky B…');
    try {
      await calculateSlot('skyA',system); await calculateSlot('skyB',system);
      document.getElementById('loadChart')?.click(); if(read(SLOT_KEYS.skyB)) document.getElementById('loadCurrentSky')?.click();
      window.RelphiCanonicalSkyWheel?.render?.(); window.dispatchEvent(new Event('relphi:extra-points-updated'));
      window.dispatchEvent(new CustomEvent('relphi:house-system-changed',{detail:{houseSystem:system}}));
      setBusy(fieldset,false,'Houses recalculated.');
      setTimeout(function(){const status=fieldset?.querySelector('.relphi-house-system-status');if(status)status.textContent='';},1800);
    } catch(error) {
      setBusy(fieldset,false,error.message || 'Houses could not be recalculated.');
      const prior=profile(read(SLOT_KEYS.skyA)).houseSystem || 'whole-sign';
      fieldset?.querySelectorAll('input').forEach(function(input){input.checked=input.value===prior;}); saveSystem(prior);
    } finally { recalculating=false; }
  }

  function styles() {
    if(document.getElementById('relphi-house-system-filter-style'))return;
    const style=document.createElement('style'); style.id='relphi-house-system-filter-style'; style.textContent=`
      .relphi-house-system-filter{display:block!important;width:100%;margin:0!important;padding:0!important;border:0!important;text-align:left!important;background:transparent!important}.relphi-house-system-heading{display:block;width:100%;margin:0 0 .35rem!important;padding:0!important;text-align:left!important;font:inherit;font-weight:800}.relphi-house-system-choices{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;width:100%!important;margin:0!important;padding:0!important}.relphi-house-system-choice{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:.5rem!important;width:100%!important;min-height:0!important;margin:0!important;padding:.3rem 0!important;text-align:left!important;font:inherit!important;font-weight:inherit!important;cursor:pointer}.relphi-house-system-choice input{flex:0 0 auto;margin:0!important;accent-color:var(--relphi-red,#dc1f18)}.relphi-house-system-choice span{display:inline!important;text-align:left!important}.relphi-house-system-status{min-height:0;margin:.35rem 0 0;padding:0;font:inherit;font-size:.8em;font-weight:700;color:var(--relphi-muted,#555)}
    `; document.head.appendChild(style);
  }

  function run(){queued=false;styles();installControl();hideCreationControl();}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(run);}
  function start(){run();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});window.addEventListener('relphi:sky-builder-v4-loaded',queue);window.addEventListener('storage',queue);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();