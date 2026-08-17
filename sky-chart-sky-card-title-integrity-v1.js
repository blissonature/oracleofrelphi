// Keep the visible interactive Sky-card title outside the foundation renderer's owned name node.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardTitleIntegrityV2)return;
  window.__relphiSkyCardTitleIntegrityV1=true;
  window.__relphiSkyCardTitleIntegrityV2=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC=new Set(['','now','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky']);
  const STYLE_ID='skyCardStableTitleV2';
  const FIVE_MINUTES=5*60*1000;
  const NOW_CREATION_TOLERANCE=2*60*1000;
  let queued=false;
  let ageTimer=0;

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #skyFoundationA>.sky-foundation-heading>.sky-foundation-name,
      #skyFoundationB>.sky-foundation-heading>.sky-foundation-name{
        display:none!important;
      }
      #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable,
      #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable{
        grid-column:2!important;
        grid-row:1!important;
        display:block!important;
        min-width:0!important;
        overflow:hidden!important;
        padding:0 .45rem 0 .8rem!important;
        margin:0!important;
      }
      #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable>.sky-saved-name-trigger,
      #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable>.sky-saved-name-trigger{
        width:100%!important;
        min-width:0!important;
      }
    `;
    document.head.appendChild(style);
  }
  function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
  function time(value){const date=new Date(value);return Number.isNaN(date.getTime())?NaN:date.getTime()}
  function saved(value){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    return!!String(metadata.savedSkyId||metadata.savedSkyName||'').trim();
  }
  function instantFor(value){
    const profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    return time(profile.instant||profile.dateTime||value?.instant||value?.dateTime);
  }
  function wasCreatedAsNow(value){
    if(!value||saved(value))return false;
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    const profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    const instant=instantFor(value),created=time(value?.savedAt||metadata.savedAt||metadata.createdAt);
    if(!Number.isFinite(instant)||!Number.isFinite(created)||Math.abs(created-instant)>NOW_CREATION_TOLERANCE)return false;
    const names=[metadata.name,metadata.title,value?.name,value?.displayName,value?.skyName,value?.title,profile.name,profile.title].map(normalize).filter(Boolean);
    return names.includes('now')||names.every(name=>GENERIC.has(name));
  }
  function nowAgeLabel(value){
    const instant=instantFor(value);
    if(!Number.isFinite(instant))return'Now';
    const age=Math.max(0,Date.now()-instant);
    if(age<FIVE_MINUTES)return'Now';
    const minutes=Math.floor(age/60000);
    return`${Math.floor(minutes/5)*5} minutes ago`;
  }
  function nameFor(slot){
    const value=read(slot),metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{},profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    if(saved(value)){
      const savedName=String(metadata.savedSkyName||'').trim();
      if(savedName)return savedName;
    }
    if(wasCreatedAsNow(value))return nowAgeLabel(value);
    for(const candidate of [metadata.savedSkyName,value?.name,value?.displayName,value?.skyName,value?.title,profile.name,profile.title]){
      const name=String(candidate||'').trim();
      if(name&&!GENERIC.has(normalize(name)))return name;
    }
    return'Unsaved sky';
  }
  function ensure(slot){
    const panel=document.getElementById(`skyFoundation${slot}`),heading=panel?.querySelector(':scope > .sky-foundation-heading');
    const source=heading?.querySelector(':scope > .sky-foundation-name');
    if(!heading||!source)return;
    installStyle();

    // The foundation renderer owns `source` and may replace its text at any time.
    // The visible title therefore lives in a sibling host that the renderer never queries or rewrites.
    let host=heading.querySelector(':scope > .sky-card-title-stable');
    if(!host){
      host=document.createElement('span');
      host.className='sky-card-title-stable';
      heading.insertBefore(host,source);
    }
    let button=host.querySelector(':scope > [data-saved-sky-trigger]');
    if(!button){
      host.replaceChildren();
      button=document.createElement('button');
      button.type='button';
      button.className='sky-saved-name-trigger';
      button.dataset.savedSkyTrigger=slot;
      button.setAttribute('aria-haspopup','dialog');
      button.setAttribute('aria-expanded','false');
      const label=document.createElement('span');label.className='sky-saved-name-label';
      const chevron=document.createElement('span');chevron.className='sky-saved-name-chevron';chevron.setAttribute('aria-hidden','true');
      button.append(label,chevron);host.appendChild(button);
    }

    const value=read(slot),name=nameFor(slot),label=button.querySelector('.sky-saved-name-label');
    if(label&&label.textContent!==name)label.textContent=name;
    button.classList.toggle('is-saved',saved(value));
    button.title=saved(value)?name:`${name} · open Saved skies`;
    button.setAttribute('aria-label',`${name}. Open Saved skies for Sky ${slot}.`);
  }
  function run(){queued=false;ensure('A');ensure('B')}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function nextAgeDelay(){
    const now=Date.now();
    let delay=FIVE_MINUTES;
    Object.keys(KEYS).forEach(slot=>{
      const value=read(slot);
      if(!wasCreatedAsNow(value))return;
      const instant=instantFor(value);
      if(!Number.isFinite(instant))return;
      const age=Math.max(0,now-instant);
      const nextBoundary=age<FIVE_MINUTES?FIVE_MINUTES:(Math.floor(age/FIVE_MINUTES)+1)*FIVE_MINUTES;
      delay=Math.min(delay,Math.max(0,nextBoundary-age));
    });
    return Math.max(50,delay+25);
  }
  function armAgeTimer(){
    if(ageTimer)clearTimeout(ageTimer);
    ageTimer=window.setTimeout(()=>{ageTimer=0;run();armAgeTimer()},nextAgeDelay());
  }
  function refresh(){schedule();armAgeTimer()}
  function start(){
    installStyle();run();armAgeTimer();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(records=>{
      if(records.some(record=>{
        const heading=record.target?.closest?.('#skyFoundationA > .sky-foundation-heading,#skyFoundationB > .sky-foundation-heading');
        if(heading)return true;
        return[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&node.closest?.('#skyFoundationA > .sky-foundation-heading,#skyFoundationB > .sky-foundation-heading'));
      }))schedule();
    }).observe(root,{childList:true,subtree:true});
    window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))refresh()});
    ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,refresh));
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
