// Saved sky identity is display-only in the Sky header. The header toggles the existing
// moment drawer; loading, searching, naming, and saving skies live inside that drawer.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySavedSkiesV1)return;
  window.__relphiSkySavedSkiesV1=true;

  const LIBRARY_KEY='relphiSkyLibraryV1';
  const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky']);
  let queued=false;

  const normalize=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
  function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
  function payload(slot){return readJson(SLOT_KEYS[slot],null)}
  function library(){const list=readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list.filter(record=>record&&String(record.name||'').trim()):[]}
  function recordRef(record){return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||`legacy:${normalize(record?.name)}`)}
  function explicitRecord(value,records){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    const id=String(metadata.savedSkyId||'');
    if(id){const hit=records.find(record=>recordRef(record)===id||String(record.id||'')===id);if(hit)return hit}
    const name=normalize(metadata.savedSkyName);
    return name?records.find(record=>normalize(record?.name)===name)||null:null;
  }
  function candidateName(value){
    for(const candidate of [value?.name,value?.displayName,value?.skyName,value?.title,value?.calcProfile?.name,value?.calcProfile?.title]){
      const name=String(candidate||'').trim();
      if(name&&!GENERIC_NAMES.has(normalize(name)))return name;
    }
    return '';
  }
  function isNearNow(value){
    const profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    const raw=profile.instant||profile.dateTime||value?.instant||value?.dateTime;
    if(!raw)return false;
    const date=new Date(raw);return!Number.isNaN(date.getTime())&&Math.abs(Date.now()-date.getTime())<10*60*1000;
  }
  function identity(slot){
    const value=payload(slot),record=explicitRecord(value,library());
    if(record)return{name:String(record.name||'').trim(),hasIdentity:true,saved:true};
    const custom=candidateName(value);
    if(custom)return{name:custom,hasIdentity:true,saved:false};
    if(isNearNow(value))return{name:'Now',hasIdentity:true,saved:false};
    return{name:`Sky ${slot}`,hasIdentity:false,saved:false};
  }
  function drawer(slot){return document.querySelector(`#skyFoundation${slot} [data-sky-drawer="where"]`)}
  function drawerToggle(slot){return drawer(slot)?.querySelector('[data-sky-drawer-toggle="where"]')||null}
  function syncWhereLabel(slot,state){
    const toggle=drawerToggle(slot);if(!toggle)return;
    const label=toggle.querySelector('span:first-child');if(label)label.textContent='Where and When';
    // Once a sky has an identity, the header itself is the disclosure control. The empty
    // state keeps Where and When visible as the invitation to define or choose a moment.
    toggle.hidden=!!state.hasIdentity;
    toggle.setAttribute('aria-hidden',state.hasIdentity?'true':'false');
    toggle.tabIndex=state.hasIdentity?-1:0;
  }
  function renderIdentity(slot){
    const panel=document.getElementById(`skyFoundation${slot}`),container=panel?.querySelector(':scope > .sky-foundation-heading > .sky-foundation-name');
    if(!container)return;
    const state=identity(slot);
    let button=container.querySelector('[data-saved-sky-trigger]');
    if(!button){
      container.replaceChildren();
      button=document.createElement('button');button.type='button';button.className='sky-saved-name-trigger';button.dataset.savedSkyTrigger=slot;
      const label=document.createElement('span');label.className='sky-saved-name-label';button.appendChild(label);container.appendChild(button);
    }
    button.classList.toggle('is-saved',state.saved);
    button.classList.remove('is-dirty');
    const label=button.querySelector('.sky-saved-name-label');if(label&&label.textContent!==state.name)label.textContent=state.name;
    const open=drawer(slot)?.classList.contains('is-open')||drawerToggle(slot)?.getAttribute('aria-expanded')==='true';
    button.setAttribute('aria-expanded',open?'true':'false');
    button.setAttribute('aria-label',`${state.name}. ${open?'Hide':'Show'} where and when for Sky ${slot}.`);
    button.title=open?'Hide where and when':'Show where and when';
    syncWhereLabel(slot,state);
  }
  function sync(){queued=false;renderIdentity('A');renderIdentity('B')}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}

  document.addEventListener('click',event=>{
    const trigger=event.target.closest?.('[data-saved-sky-trigger]');
    if(!trigger)return;
    const slot=trigger.dataset.savedSkyTrigger,toggle=drawerToggle(slot);if(!toggle)return;
    event.preventDefault();event.stopPropagation();toggle.click();requestAnimationFrame(()=>renderIdentity(slot));
  },true);

  window.addEventListener('storage',event=>{if(!event.key||event.key===LIBRARY_KEY||Object.values(SLOT_KEYS).includes(event.key))schedule()});
  ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,schedule));
  new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length||record.removedNodes.length))schedule()}).observe(document.documentElement,{childList:true,subtree:true});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();
