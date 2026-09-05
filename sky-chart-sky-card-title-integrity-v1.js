// Persistent Sky-card title contract: every present Sky keeps the same Load/Save menu trigger.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardTitleIntegrityV2)return;
  window.__relphiSkyCardTitleIntegrityV1=true;
  window.__relphiSkyCardTitleIntegrityV2=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','new sky','where and when']);
  const STYLE_ID='skyCardStableTitleV4';
  let queued=false;

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
  function manualWhereWhen(value){
    const m=metadata(value),p=profile(value);
    return m.liveNowDisabled===true||m.liveNowDisabledReason==='custom-where-when'||String(p.source||'')==='where-when-v2';
  }
  function nearNow(value){
    const p=profile(value),raw=p.instant||p.dateTime||value?.instant||value?.dateTime;
    if(!raw)return false;const date=new Date(raw);return!Number.isNaN(date.getTime())&&Math.abs(Date.now()-date.getTime())<10*60*1000;
  }
  function nameFor(slot,value){
    if(!hasPlacements(value))return'Where and When';
    const m=metadata(value),p=profile(value),savedName=String(m.savedSkyName||'').trim();
    if(savedName)return savedName;
    if(liveOrigin(value)||nearNow(value))return'Now';
    const manual=manualWhereWhen(value);
    for(const candidate of [value?.name,value?.displayName,value?.skyName,value?.title,p.name,p.title,m.name,m.title]){
      const name=String(candidate||'').trim(),norm=normalize(name);
      if(name&&!GENERIC.has(norm)&&!(manual&&norm==='now'))return name;
    }
    return manual?'Unsaved sky':'Unsaved sky';
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
    const value=read(slot),name=nameFor(slot,value),label=button.querySelector('.sky-saved-name-label'),isSaved=saved(value);
    if(label&&label.textContent!==name)label.textContent=name;
    button.classList.toggle('is-saved',isSaved);
    button.title=isSaved?`${name} · open Sky menu`:`${name} · open Sky menu`;
    button.setAttribute('aria-label',`${name}. Open Sky menu for Sky ${slot}.`);
  }
  function run(){queued=false;installStyle();ensure('A');ensure('B')}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){
    run();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))schedule()});
    ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed','relphi:sky-live-origin-changed','relphi:sky-b-restored','relphi:sky-session-recovered'].forEach(name=>window.addEventListener(name,schedule));
  }
  window.RelphiSkyCardTitle=Object.freeze({refresh:schedule,nameFor});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
