// Persistent Sky-card title contract: every present Sky keeps the same Load/Save menu trigger.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardTitleIntegrityV5)return;
  window.__relphiSkyCardTitleIntegrityV1=true;
  window.__relphiSkyCardTitleIntegrityV2=true;
  window.__relphiSkyCardTitleIntegrityV3=true;
  window.__relphiSkyCardTitleIntegrityV4=true;
  window.__relphiSkyCardTitleIntegrityV5=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','new sky','where and when']);
  const STYLE_ID='skyCardStableTitleV4';
  const STEP_MS=5*60*1000;
  let queued=false,timer=0;

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    document.querySelectorAll('[id^="skyCardStableTitleV"]').forEach(node=>node.remove());
    const style=document.createElement('style');style.id=STYLE_ID;
    style.textContent=`
      #skyFoundationA>.sky-foundation-heading>.sky-foundation-name,
      #skyFoundationB>.sky-foundation-heading>.sky-foundation-name{display:none!important}
      #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable,
      #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable{
        grid-column:2!important;grid-row:1!important;display:block!important;min-width:0!important;
        overflow:hidden!important;padding:0 .25rem 0 .8rem!important;margin:0!important
      }
      #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable>.sky-saved-name-trigger,
      #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable>.sky-saved-name-trigger{
        width:100%!important;min-width:0!important
      }
    `;
    document.head.appendChild(style);
  }

  function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
  function metadata(value){return value?.metadata&&typeof value.metadata==='object'?value.metadata:{}}
  function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
  function saved(value){const m=metadata(value);return!!String(m.savedSkyId||m.savedSkyName||'').trim()}
  function hasPlacements(value){
    if(!value||typeof value!=='object')return false;
    const source=[value.placements,value.positions,value.points,value.bodies].find(candidate=>candidate&&typeof candidate==='object'&&!Array.isArray(candidate));
    return!!source&&Object.values(source).some(item=>item&&typeof item==='object'&&!Array.isArray(item)&&(Number.isFinite(Number(item.longitude))||String(item.sign||item.zodiac||'').trim()));
  }
  function liveOrigin(value){
    const m=metadata(value),p=profile(value),origin=String(m.liveNowOrigin||p.liveNowOrigin||'');
    if(['here-and-now','update-to-now','use-now'].includes(origin))return origin;
    return window.RelphiSkyLiveOriginMigration?.legacyOrigin?.(value)||'';
  }
  function liveAnchorMs(value){
    const m=metadata(value),p=profile(value);
    for(const raw of [m.liveAgeAnchorAt,m.liveNowAt,p.liveNowAt,p.instant,p.dateTime,value?.instant,value?.dateTime]){
      const ms=Date.parse(String(raw||''));if(Number.isFinite(ms))return ms;
    }
    return NaN;
  }
  function liveAgeLabel(value,now=Date.now()){
    const at=liveAnchorMs(value);if(!Number.isFinite(at))return'Now';
    const minutes=Math.floor(Math.max(0,Number(now)-at)/STEP_MS)*5;
    return minutes<5?'Now':`${minutes} minutes ago`;
  }
  function manualWhereWhen(value){
    const m=metadata(value),p=profile(value);
    return m.liveNowDisabled===true||m.liveNowDisabledReason==='custom-where-when'||String(p.source||'')==='where-when-v2';
  }
  function editingWhereWhen(slot){
    try{if(window.RelphiSkyWhereWhenTransaction?.slots?.().includes(slot))return true}catch(_){}
    const slots=String(document.documentElement.dataset.skyWhereWhenEditingSlots||'').split(',').map(value=>value.trim()).filter(Boolean);
    if(slots.includes(slot))return true;
    return!!document.querySelector(`#skyFoundation${slot} .sky-where-when-editor[data-slot="${slot}"]`);
  }
  function nearNow(value){
    const p=profile(value),raw=p.instant||p.dateTime||value?.instant||value?.dateTime;
    if(!raw)return false;const date=new Date(raw);return!Number.isNaN(date.getTime())&&Math.abs(Date.now()-date.getTime())<10*60*1000;
  }
  function resolvedSavedIdentity(slot){
    try{return window.RelphiSkySavedSkyIdentity?.identity?.(slot)||null}catch(_){return null}
  }
  function nameFor(slot,value){
    if(editingWhereWhen(slot))return'Where and When';
    if(!hasPlacements(value))return'Where and When';
    const matched=resolvedSavedIdentity(slot);
    if(matched?.saved&&matched.name)return matched.name;
    const m=metadata(value),p=profile(value),savedName=String(m.savedSkyName||'').trim();
    if(savedName)return savedName;
    if(manualWhereWhen(value))return'Where and When';
    if(liveOrigin(value))return liveAgeLabel(value);
    if(nearNow(value))return'Now';
    for(const candidate of [value?.name,value?.displayName,value?.skyName,value?.title,p.name,p.title,m.name,m.title]){
      const name=String(candidate||'').trim(),norm=normalize(name);
      if(name&&!GENERIC.has(norm))return name;
    }
    return'Where and When';
  }

  function heading(slot){return document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading`)}
  function ensureHost(slot){
    const head=heading(slot),source=head?.querySelector(':scope > .sky-foundation-name');if(!head||!source)return null;
    let host=head.querySelector(':scope > .sky-card-title-stable');
    if(!host){host=document.createElement('span');host.className='sky-card-title-stable';head.insertBefore(host,source)}
    host.removeAttribute('data-live-header-owned');
    return host;
  }
  function ensureTrigger(slot){
    const host=ensureHost(slot);if(!host)return null;
    let button=host.querySelector(':scope > [data-saved-sky-trigger]');
    if(!button){
      host.replaceChildren();button=document.createElement('button');button.type='button';button.className='sky-saved-name-trigger';button.dataset.savedSkyTrigger=slot;
      button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
      const label=document.createElement('span');label.className='sky-saved-name-label';
      const chevron=document.createElement('span');chevron.className='sky-saved-name-chevron';chevron.setAttribute('aria-hidden','true');
      button.append(label,chevron);host.appendChild(button);
    }
    return button;
  }
  function ensure(slot){
    const button=ensureTrigger(slot);if(!button)return;
    const value=read(slot),matched=resolvedSavedIdentity(slot),name=nameFor(slot,value),label=button.querySelector('.sky-saved-name-label');
    const isSaved=!editingWhereWhen(slot)&&((matched?.saved===true)||saved(value));
    if(label&&label.textContent!==name)label.textContent=name;
    button.classList.toggle('is-saved',isSaved);
    button.classList.toggle('is-dirty',!!matched?.dirty);
    button.title=`${name} · open Sky menu`;
    button.setAttribute('aria-label',`${name}. Open Sky menu for Sky ${slot}.`);
  }
  function nextLiveDelay(){
    const now=Date.now();let soon=Infinity;
    for(const slot of ['A','B']){
      const value=read(slot),matched=resolvedSavedIdentity(slot);
      if(!value||editingWhereWhen(slot)||matched?.saved||saved(value)||manualWhereWhen(value)||!liveOrigin(value))continue;
      const at=liveAnchorMs(value);if(!Number.isFinite(at))continue;
      const elapsed=Math.max(0,now-at),next=(Math.floor(elapsed/STEP_MS)+1)*STEP_MS;
      soon=Math.min(soon,next-elapsed+40);
    }
    return Number.isFinite(soon)?Math.max(1000,Math.min(STEP_MS,soon)):0;
  }
  function plan(){clearTimeout(timer);const delay=nextLiveDelay();if(delay)timer=setTimeout(schedule,delay)}
  function run(){queued=false;installStyle();ensure('A');ensure('B');plan()}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){
    run();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key)||event.key==='relphiSkyLibraryV1')schedule()});
    ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed','relphi:sky-live-origin-changed','relphi:sky-b-restored','relphi:sky-session-recovered','relphi:sky-where-when-edit-state-changed','relphi:sky-where-when-committed'].forEach(name=>window.addEventListener(name,schedule));
  }
  window.RelphiSkyCardTitle=Object.freeze({refresh:schedule,nameFor,liveAgeLabel});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();

// Saved Skies picker polish: keep the title on one line and keep New Sky as the first row.
(function(){
  'use strict';
  if(window.__relphiSavedSkiesPickerPolishV1)return;
  window.__relphiSavedSkiesPickerPolishV1=true;
  let queued=false,observer=null;

  function installStyle(){
    if(document.getElementById('relphiSavedSkiesPickerPolishV1Style'))return;
    const style=document.createElement('style');
    style.id='relphiSavedSkiesPickerPolishV1Style';
    style.textContent=`
      #skySavedSkiesPopover .sky-saved-subview-head{
        display:flex!important;
        grid-template-columns:none!important;
        align-items:center!important;
        min-height:38px!important;
        padding:0 12px!important;
        gap:0!important;
        white-space:nowrap!important;
      }
      #skySavedSkiesPopover .sky-saved-subview-head .sky-saved-back{display:none!important}
      #skySavedSkiesPopover .sky-saved-subview-head strong{
        display:block!important;
        width:100%!important;
        min-width:0!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        line-height:1.1!important;
      }
      #skySavedSkiesPopover .sky-create-new-row{display:block!important}
    `;
    document.head.appendChild(style);
  }

  function ensureNewSky(){
    queued=false;
    installStyle();
    const popover=document.getElementById('skySavedSkiesPopover');
    if(!popover||popover.hidden)return;
    const heading=popover.querySelector('.sky-saved-subview-head strong');
    if(heading&&heading.textContent!=='Saved Skies')heading.textContent='Saved Skies';
    const list=popover.querySelector('.sky-saved-list');
    if(!list)return;
    let row=list.querySelector('[data-sky-create-new]');
    if(!row){
      row=document.createElement('div');
      row.className='sky-create-new-row';
      row.dataset.skyCreateNew='true';
      list.prepend(row);
    }
    let button=row.querySelector('button');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      row.appendChild(button);
    }
    if(!button.classList.contains('sky-create-new-button'))button.classList.add('sky-create-new-button');
    button.removeAttribute('data-sky-command');
    button.dataset.skyCreateNewButton='true';
    if(button.getAttribute('aria-label')!=='Create a new blank sky')button.setAttribute('aria-label','Create a new blank sky');
    let plus=button.querySelector('.sky-create-new-plus');
    if(!plus){plus=document.createElement('span');plus.className='sky-create-new-plus';plus.setAttribute('aria-hidden','true');button.prepend(plus)}
    if(plus.textContent!=='+')plus.textContent='+';
    let label=button.querySelector('.sky-create-new-label');
    if(!label){
      label=Array.from(button.children).find(node=>node!==plus&&node.tagName==='SPAN')||document.createElement('span');
      label.classList.add('sky-create-new-label');
      if(!label.parentElement)button.appendChild(label);
    }
    if(label.textContent!=='New Sky')label.textContent='New Sky';
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(ensureNewSky)}
  function start(){
    installStyle();
    const attach=()=>{
      const popover=document.getElementById('skySavedSkiesPopover');
      if(!popover){requestAnimationFrame(attach);return}
      if(!observer){observer=new MutationObserver(schedule);observer.observe(popover,{childList:true,subtree:true})}
      schedule();
    };
    attach();
    document.addEventListener('click',event=>{if(event.target.closest?.('[data-saved-sky-trigger]'))requestAnimationFrame(schedule)},true);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();