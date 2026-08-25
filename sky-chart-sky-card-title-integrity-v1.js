// Keep the visible interactive Sky-card title outside the foundation renderer's owned name node.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardTitleIntegrityV1)return;
  window.__relphiSkyCardTitleIntegrityV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky']);
  const STYLE_ID='skyCardStableTitleV3';
  let queued=false;

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    document.getElementById('skyCardStableTitleV2')?.remove();
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
      #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable>.sky-saved-name-trigger,
      #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable>.sky-now-recovery-control,
      #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable>.sky-now-recovery-control{
        width:100%!important;
        min-width:0!important;
      }
    `;
    document.head.appendChild(style);
  }
  function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function write(slot,value){try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}}
  function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
  function manualWhereWhen(value){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    const profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    return metadata.liveNowDisabled===true||metadata.liveNowDisabledReason==='custom-where-when'||String(profile.source||'')==='where-when-v2';
  }
  function saved(value){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    return!!String(metadata.savedSkyId||metadata.savedSkyName||'').trim();
  }
  function repairManualIdentity(slot,value){
    if(!value||!manualWhereWhen(value)||saved(value))return value;
    let changed=false;
    const next={...value};
    const metadata=next.metadata&&typeof next.metadata==='object'?{...next.metadata}:{};
    const profile=next.calcProfile&&typeof next.calcProfile==='object'?{...next.calcProfile}:{};
    for(const key of ['name','title','displayName','skyName']){
      if(normalize(next[key])==='now'){delete next[key];changed=true}
    }
    for(const key of ['name','title']){
      if(normalize(profile[key])==='now'){delete profile[key];changed=true}
      if(normalize(metadata[key])==='now'){delete metadata[key];changed=true}
    }
    for(const key of ['liveNowOrigin','liveNowAt','liveNowLatitude','liveNowLongitude','liveNowMigrated','liveAgeAnchorAt']){
      if(Object.prototype.hasOwnProperty.call(metadata,key)){delete metadata[key];changed=true}
    }
    for(const key of ['liveNowOrigin','liveNowAt']){
      if(Object.prototype.hasOwnProperty.call(profile,key)){delete profile[key];changed=true}
    }
    if(metadata.liveNowDisabled!==true){metadata.liveNowDisabled=true;changed=true}
    if(metadata.liveNowDisabledReason!=='custom-where-when'){metadata.liveNowDisabledReason='custom-where-when';changed=true}
    next.metadata=metadata;next.calcProfile=profile;
    try{if(localStorage.getItem(`relphiSkyLiveAgeAnchor${slot}`)!==null){localStorage.removeItem(`relphiSkyLiveAgeAnchor${slot}`);changed=true}}catch(_){}
    if(changed)write(slot,next);
    return next;
  }
  function nameFor(slot,valueOverride){
    const value=valueOverride||read(slot),metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{},profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    const savedName=String(metadata.savedSkyName||'').trim();
    if(savedName)return savedName;

    const manual=manualWhereWhen(value);
    for(const candidate of [value?.name,value?.displayName,value?.skyName,value?.title,profile.name,profile.title]){
      const name=String(candidate||'').trim(),normalized=normalize(name);
      if(name&&!GENERIC.has(normalized)&&!(manual&&normalized==='now'))return name;
    }
    if(manual)return'Unsaved sky';

    const raw=profile.instant||profile.dateTime||value?.instant||value?.dateTime;
    if(raw){const date=new Date(raw);if(!Number.isNaN(date.getTime())&&Math.abs(Date.now()-date.getTime())<10*60*1000)return'Now'}
    return'Unsaved sky';
  }
  function refreshIcon(){
    return '<span class="sky-live-header-refresh" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M20 6v5h-5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 18v-5h5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.6 10A7 7 0 0 0 6.1 6.8L4 9" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.4 14A7 7 0 0 0 17.9 17.2L20 15" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  }
  function ensureNowRecovery(host,slot){
    let button=host.querySelector(':scope > [data-now-recovery-control]');
    if(!button){
      host.replaceChildren();
      button=document.createElement('button');
      button.type='button';
      button.className='sky-live-header-control sky-now-recovery-control';
      button.dataset.nowRecoveryControl=slot;
      button.dataset.finalNow=slot;
      button.dataset.tooltip='Update to Now';
      button.title='Update to Now';
      button.innerHTML=`<span class="sky-live-header-age">Now</span>${refreshIcon()}`;
      host.appendChild(button);
    }
    button.setAttribute('aria-label','Update to Now.');
    return button;
  }
  function ensureSavedTrigger(host,slot){
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
    return button;
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

    // A genuine live-origin sky gives this host to the freshness renderer.
    if(host.dataset.liveHeaderOwned==='true')return;

    const value=repairManualIdentity(slot,read(slot)),name=nameFor(slot,value),isSaved=saved(value),manual=manualWhereWhen(value);

    // Recovery is reserved for damaged live skies. A manual Where/When sky owns
    // a custom/non-live identity even when stale payload fields still contain Now.
    if(normalize(name)==='now'&&!isSaved&&!manual){
      ensureNowRecovery(host,slot);
      return;
    }

    const button=ensureSavedTrigger(host,slot),label=button.querySelector('.sky-saved-name-label');
    if(label&&label.textContent!==name)label.textContent=name;
    button.classList.toggle('is-saved',isSaved);
    button.title=isSaved?name:`${name} · open Saved skies`;
    button.setAttribute('aria-label',`${name}. Open Saved skies for Sky ${slot}.`);
  }
  function run(){queued=false;ensure('A');ensure('B')}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){
    installStyle();run();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(records=>{
      if(records.some(record=>{
        const heading=record.target?.closest?.('#skyFoundationA > .sky-foundation-heading,#skyFoundationB > .sky-foundation-heading');
        if(heading)return true;
        return[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&node.closest?.('#skyFoundationA > .sky-foundation-heading,#skyFoundationB > .sky-foundation-heading'));
      }))schedule();
    }).observe(root,{childList:true,subtree:true});
    window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))schedule()});
    ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed','relphi:sky-live-header-released'].forEach(name=>window.addEventListener(name,schedule));
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
