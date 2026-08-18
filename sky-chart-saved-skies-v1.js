// Sky header identity is display-only. It toggles the existing moment drawer; saved-sky
// search, selection, naming, and saving live inside that drawer.
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
  function applyInitialState(slot,state){
    const root=document.documentElement,key=`sky${slot}HasIdentity`,cssName=`--sky-${slot.toLowerCase()}-header-name`;
    root.dataset[key]=state.hasIdentity?'true':'false';
    root.style.setProperty(cssName,JSON.stringify(state.name));
  }
  function syncWhereLabel(slot,state){
    const toggle=drawerToggle(slot);if(!toggle)return;
    const label=toggle.querySelector('span:first-child');if(label)label.textContent='Where and When';
    toggle.hidden=!!state.hasIdentity;
    toggle.setAttribute('aria-hidden',state.hasIdentity?'true':'false');
    toggle.tabIndex=state.hasIdentity?-1:0;
  }
  function renderIdentity(slot){
    const panel=document.getElementById(`skyFoundation${slot}`),container=panel?.querySelector(':scope > .sky-foundation-heading > .sky-foundation-name');
    const state=identity(slot);applyInitialState(slot,state);if(!container)return;
    container.dataset.savedSkyTrigger=slot;
    container.classList.toggle('is-saved',state.saved);
    container.setAttribute('role','button');container.tabIndex=0;
    const open=drawer(slot)?.classList.contains('is-open')||drawerToggle(slot)?.getAttribute('aria-expanded')==='true';
    container.setAttribute('aria-expanded',open?'true':'false');
    container.setAttribute('aria-label',`${state.name}. ${open?'Hide':'Show'} where and when for Sky ${slot}.`);
    container.title=open?'Hide where and when':'Show where and when';
    syncWhereLabel(slot,state);
  }
  function sync(){queued=false;renderIdentity('A');renderIdentity('B')}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
  function activate(trigger){
    const slot=trigger?.dataset?.savedSkyTrigger,toggle=drawerToggle(slot);if(!toggle)return;
    toggle.click();requestAnimationFrame(()=>renderIdentity(slot));
  }

  document.addEventListener('click',event=>{
    const trigger=event.target.closest?.('[data-saved-sky-trigger]');if(!trigger)return;
    event.preventDefault();event.stopPropagation();activate(trigger);
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const trigger=event.target.closest?.('[data-saved-sky-trigger]');if(!trigger)return;
    event.preventDefault();activate(trigger);
  },true);

  window.addEventListener('storage',event=>{if(!event.key||event.key===LIBRARY_KEY||Object.values(SLOT_KEYS).includes(event.key))schedule()});
  ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed','relphi:sky-drawers-ready'].forEach(name=>window.addEventListener(name,schedule));
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();
