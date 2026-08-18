// Make the Planetary Hours heptagram the privacy-preserving face of a Sky card's exact moment.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyMomentDisclosureV1)return;
  window.__relphiSkyMomentDisclosureV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const PLANETS={
    saturn:{name:'Saturn',color:'#8c7a42'},
    jupiter:{name:'Jupiter',color:'#41752f'},
    mars:{name:'Mars',color:'#c9211e'},
    sun:{name:'Sun',color:'#d08a00'},
    venus:{name:'Venus',color:'#b23b79'},
    mercury:{name:'Mercury',color:'#277390'},
    moon:{name:'Moon',color:'#58628a'}
  };
  const openState={A:false,B:false};
  let queued=false;

  function slotFor(node){return node?.closest?.('#skyFoundationA')?'A':node?.closest?.('#skyFoundationB')?'B':''}
  function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function profile(slot){const value=read(slot);return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
  function planetKey(group){if(!group)return'';return Object.keys(PLANETS).find(key=>group.classList.contains(`sky-ph-${key}`))||''}
  function rulerKey(svg,kind){const className=kind==='day'?'is-day-ruler':'is-hour-ruler',legacy=kind==='day'?'.sky-ph-node.day':'.sky-ph-node.hour';return planetKey(svg?.querySelector(`.sky-ph-planet.${className}`)||svg?.querySelector(legacy)?.closest('.sky-ph-planet'))}
  function advancedSettings(slot){
    const p=profile(slot),details=document.createElement('details');details.className='sky-moment-advanced';
    const summary=document.createElement('summary');summary.textContent='Advanced settings';
    const list=document.createElement('dl');list.className='sky-moment-advanced-list';
    [['Time zone',p.timeZone||'Unavailable'],['Latitude',Number.isFinite(Number(p.latitude))?Number(p.latitude).toFixed(5):'Unavailable'],['Longitude',Number.isFinite(Number(p.longitude))?Number(p.longitude).toFixed(5):'Unavailable']].forEach(([term,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=value;list.append(dt,dd)});
    details.append(summary,list);return details;
  }
  function ensureEditButton(facts){
    let button=facts.querySelector('[data-ww-summary-edit]');if(button){button.remove();button.textContent='Edit';return button}
    button=document.createElement('button');button.type='button';button.className='sky-where-when-button secondary';button.dataset.wwAction='edit';button.dataset.wwSummaryEdit='true';button.textContent='Edit';return button;
  }
  function syncHeaderNow(slot){
    document.querySelectorAll(`#skyFoundation${slot} > .sky-foundation-heading .sky-where-when-actions > [data-final-now]`).forEach(button=>{button.classList.add('sky-moment-header-now-source');button.hidden=true;button.tabIndex=-1;button.setAttribute('aria-hidden','true')});
  }
  function updateRulers(section){
    const svg=section.querySelector('.sky-ph-heptagram');if(!svg)return;
    const dayKey=rulerKey(svg,'day'),hourKey=rulerKey(svg,'hour'),trigger=section.querySelector('[data-moment-toggle]');if(!trigger)return;
    if(dayKey)trigger.dataset.dayRuler=dayKey;else delete trigger.dataset.dayRuler;
    if(hourKey)trigger.dataset.hourRuler=hourKey;else delete trigger.dataset.hourRuler;
    if(dayKey&&hourKey){trigger.setAttribute('aria-label',`${PLANETS[dayKey].name} day ruler. ${PLANETS[hourKey].name} hour ruler. ${trigger.getAttribute('aria-expanded')==='true'?'Hide':'Show'} exactly where and when.`);trigger.title=trigger.getAttribute('aria-expanded')==='true'?'Hide exactly where and when':'Show exactly where and when'}
  }
  function announceReady(slot,section){window.dispatchEvent(new CustomEvent('relphi:sky-moment-disclosure-ready',{detail:{slot,section,open:!!openState[slot]}}))}
  function transform(section){
    const slot=slotFor(section);if(!slot)return;syncHeaderNow(slot);
    if(section.dataset.momentDisclosureV1==='true'){updateRulers(section);announceReady(slot,section);return}
    const jump=section.querySelector(':scope > .sky-ph-jump'),facts=section.querySelector(':scope > .sky-where-when-facts');if(!jump||!facts)return;
    const href=jump.getAttribute('href')||'#',svg=jump.querySelector('.sky-ph-heptagram'),sourceSummary=jump.querySelector('.sky-ph-summary');if(!svg)return;

    const panelId=`skyMomentDetails${slot}`,trigger=document.createElement('button');
    trigger.type='button';trigger.className='sky-ph-jump sky-moment-trigger';trigger.dataset.momentToggle=slot;trigger.setAttribute('aria-controls',panelId);
    jump.querySelector('.sky-ph-jump-title')?.remove();trigger.appendChild(svg);
    const hint=document.createElement('span');hint.className='sky-moment-disclosure-hint';hint.dataset.momentDisclosureHint='true';trigger.appendChild(hint);jump.replaceWith(trigger);

    const details=document.createElement('div');details.id=panelId;details.className='sky-moment-details';
    facts.classList.add('sky-moment-exact-facts');const edit=ensureEditButton(facts);details.appendChild(facts);
    if(sourceSummary){sourceSummary.remove();sourceSummary.classList.add('sky-moment-source-summary');details.appendChild(sourceSummary)}
    const actions=document.createElement('div');actions.className='sky-moment-actions';actions.appendChild(edit);
    const now=document.createElement('button');now.type='button';now.className='sky-where-when-button secondary';now.dataset.finalNow=slot;now.dataset.momentUpdateNow='true';now.textContent='Update to Now';actions.appendChild(now);details.appendChild(actions);
    details.appendChild(advancedSettings(slot));
    const link=document.createElement('a');link.className='sky-moment-planetary-link';link.href=href;link.textContent='Jump to this time in Planetary Hours';details.appendChild(link);

    const opening=!!openState[slot];details.hidden=!opening;trigger.setAttribute('aria-expanded',opening?'true':'false');hint.textContent=opening?'Hide exactly where and when':'Show exactly where and when';trigger.setAttribute('aria-label',hint.textContent);trigger.title=hint.textContent;
    section.appendChild(details);section.dataset.momentDisclosureV1='true';updateRulers(section);announceReady(slot,section);
  }
  function scan(){queued=false;document.querySelectorAll('.sky-where-when-confirmed').forEach(transform);['A','B'].forEach(syncHeaderNow)}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(scan)}
  function toggle(button){
    const slot=button.dataset.momentToggle,id=button.getAttribute('aria-controls'),details=id?document.getElementById(id):null;if(!details||!slot)return;
    const opening=details.hidden;openState[slot]=opening;details.hidden=!opening;button.setAttribute('aria-expanded',opening?'true':'false');
    const hint=button.querySelector('[data-moment-disclosure-hint]');if(hint)hint.textContent=opening?'Hide exactly where and when':'Show exactly where and when';button.title=opening?'Hide exactly where and when':'Show exactly where and when';
    announceReady(slot,button.closest('.sky-where-when-confirmed'));
  }
  function start(){
    scan();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length||record.removedNodes.length))schedule()}).observe(root,{childList:true,subtree:true});
    ['relphi:sky-heptagram-source-ready','relphi:sky-foundation-ready','relphi:sky-name-updated'].forEach(name=>window.addEventListener(name,schedule));
    window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))schedule()});
  }

  document.addEventListener('click',event=>{const button=event.target.closest?.('[data-moment-toggle]');if(!button)return;event.preventDefault();toggle(button)},true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const details=event.target.closest?.('.sky-moment-details');if(!details||details.hidden)return;
    const section=details.closest('.sky-where-when-confirmed'),trigger=section?.querySelector('[data-moment-toggle]'),slot=trigger?.dataset.momentToggle;
    if(slot)openState[slot]=false;details.hidden=true;trigger?.setAttribute('aria-expanded','false');
    const hint=trigger?.querySelector('[data-moment-disclosure-hint]');if(hint)hint.textContent='Show exactly where and when';if(trigger)trigger.title='Show exactly where and when';trigger?.focus({preventScroll:true});
  },true);

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
