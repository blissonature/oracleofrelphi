// Keep the interactive Sky-card title control intact when the foundation renderer refreshes a card.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardTitleIntegrityV1)return;
  window.__relphiSkyCardTitleIntegrityV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky']);
  let queued=false;

  function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
  function nameFor(slot){
    const value=read(slot),metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{},profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    for(const candidate of [metadata.savedSkyName,value?.name,value?.displayName,value?.skyName,value?.title,profile.name,profile.title]){
      const name=String(candidate||'').trim();
      if(name&&!GENERIC.has(normalize(name)))return name;
    }
    const raw=profile.instant||profile.dateTime||value?.instant||value?.dateTime;
    if(raw){const date=new Date(raw);if(!Number.isNaN(date.getTime())&&Math.abs(Date.now()-date.getTime())<10*60*1000)return'Now'}
    return'Unsaved sky';
  }
  function saved(value){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    return!!String(metadata.savedSkyId||metadata.savedSkyName||'').trim();
  }
  function ensure(slot){
    const panel=document.getElementById(`skyFoundation${slot}`),container=panel?.querySelector(':scope > .sky-foundation-heading > .sky-foundation-name');
    if(!container)return;
    const value=read(slot),name=nameFor(slot);
    let button=container.querySelector('[data-saved-sky-trigger]');
    if(!button){
      container.replaceChildren();
      button=document.createElement('button');
      button.type='button';
      button.className='sky-saved-name-trigger';
      button.dataset.savedSkyTrigger=slot;
      button.setAttribute('aria-haspopup','dialog');
      button.setAttribute('aria-expanded','false');
      const label=document.createElement('span');label.className='sky-saved-name-label';
      const chevron=document.createElement('span');chevron.className='sky-saved-name-chevron';chevron.setAttribute('aria-hidden','true');
      button.append(label,chevron);container.appendChild(button);
    }
    const label=button.querySelector('.sky-saved-name-label');
    if(label&&label.textContent!==name)label.textContent=name;
    button.classList.toggle('is-saved',saved(value));
    button.title=saved(value)?name:`${name} · open Saved skies`;
    button.setAttribute('aria-label',`${name}. Open Saved skies for Sky ${slot}.`);
  }
  function run(){queued=false;ensure('A');ensure('B')}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){
    run();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(records=>{
      if(records.some(record=>record.target?.closest?.('#skyFoundationA > .sky-foundation-heading,#skyFoundationB > .sky-foundation-heading')||[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&node.closest?.('#skyFoundationA > .sky-foundation-heading,#skyFoundationB > .sky-foundation-heading'))))schedule();
    }).observe(root,{childList:true,subtree:true});
    window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))schedule()});
    ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,schedule));
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
