// Stable save-name dialog. It is intentionally separate from the Saved Skies popover
// so mobile virtual-keyboard viewport changes cannot destroy or replace the focused input.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySavedSkyNameDialogV1)return;
  window.__relphiSkySavedSkyNameDialogV1=true;

  const LIBRARY_KEY='relphiSkyLibraryV1';
  const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky','now']);
  let activeSlot=null;
  let overlay=null;
  let input=null;
  let status=null;

  const normalize=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
  const clone=value=>JSON.parse(JSON.stringify(value));
  function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}}
  function payload(slot){return readJson(SLOT_KEYS[slot],null)}
  function placementSource(value){
    if(!value||typeof value!=='object')return{};
    const source=[value.placements,value.positions,value.points,value.bodies].find(candidate=>candidate&&typeof candidate==='object'&&!Array.isArray(candidate))||value;
    return Object.fromEntries(Object.entries(source).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac)));
  }
  function hasPlacements(value){return Object.keys(placementSource(value)).length>0}
  function library(){const list=readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list.filter(record=>record&&String(record.name||'').trim()&&hasPlacements(record)):[]}
  function recordRef(record){return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||`legacy:${normalize(record?.name)}`)}
  function newId(){return `sky-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
  function candidateName(value){
    for(const candidate of [value?.metadata?.savedSkyName,value?.name,value?.displayName,value?.skyName,value?.title,value?.calcProfile?.name,value?.calcProfile?.title]){
      const name=String(candidate||'').trim();
      if(!GENERIC_NAMES.has(normalize(name)))return name;
    }
    return '';
  }
  function explicitRecord(value,records){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    const id=String(metadata.savedSkyId||'');
    if(id){const match=records.find(record=>recordRef(record)===id||String(record.id||'')===id);if(match)return match}
    const savedName=normalize(metadata.savedSkyName);
    return savedName?records.find(record=>normalize(record.name)===savedName)||null:null;
  }
  function applyNamedIdentity(value,name,id){
    const next=clone(value||{});
    next.name=name;next.title=name;next.displayName=name;next.skyName=name;
    next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    next.metadata.savedSkyId=id;next.metadata.savedSkyName=name;next.metadata.savedSkyLoadedAt=new Date().toISOString();next.metadata.name=name;next.metadata.title=name;
    next.calcProfile=next.calcProfile&&typeof next.calcProfile==='object'?next.calcProfile:{};
    next.calcProfile.name=name;next.calcProfile.title=name;
    return next;
  }
  function announceName(slot,name,id){
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name,source:'saved-sky'}}));
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-active-changed',{detail:{slot,name,id}}));
  }
  function saveAs(slot,name){
    const value=payload(slot);
    if(!value||!hasPlacements(value))return{ok:false,message:'There is no sky to save.'};
    const clean=String(name||'').trim();
    if(!clean)return{ok:false,message:'Give this sky a name.'};
    const records=library();
    if(records.some(record=>normalize(record.name)===normalize(clean)))return{ok:false,message:'That name is already in Saved skies.'};
    const id=newId();
    const record=applyNamedIdentity(value,clean,id);
    record.id=id;record.savedAt=new Date().toISOString();record.updatedAt=record.savedAt;
    records.push(record);
    if(!writeJson(LIBRARY_KEY,records))return{ok:false,message:'Saved skies could not be written.'};
    const active=applyNamedIdentity(value,clean,id);
    if(!writeJson(SLOT_KEYS[slot],active))return{ok:false,message:'The sky was saved, but the active card could not be renamed.'};
    try{window.dispatchEvent(new StorageEvent('storage',{key:SLOT_KEYS[slot],newValue:localStorage.getItem(SLOT_KEYS[slot]),storageArea:localStorage}))}catch(_){}
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-library-changed',{detail:{name:clean,id,action:'create'}}));
    announceName(slot,clean,id);
    return{ok:true,message:'Sky saved.'};
  }

  function installStyles(){
    if(document.getElementById('skySavedSkyNameDialogStyles'))return;
    const style=document.createElement('style');
    style.id='skySavedSkyNameDialogStyles';
    style.textContent=`
      .sky-save-name-overlay{position:fixed;inset:0;z-index:30000;display:grid;place-items:center;padding:16px;box-sizing:border-box;background:rgba(28,24,21,.28);overscroll-behavior:contain}
      .sky-save-name-overlay[hidden]{display:none!important}
      .sky-save-name-dialog{width:min(360px,calc(100vw - 32px));box-sizing:border-box;padding:16px;border:1px solid rgba(31,27,24,.18);border-radius:14px;background:#fffdf8;box-shadow:0 22px 60px rgba(31,27,24,.28);color:#211d19}
      .sky-save-name-dialog h2{margin:0 0 4px;font:900 .9rem/1.15 system-ui,sans-serif}
      .sky-save-name-dialog p{margin:0 0 12px;color:#756c64;font:650 .62rem/1.35 system-ui,sans-serif}
      .sky-save-name-dialog label{display:grid;gap:5px}
      .sky-save-name-dialog label>span{font:800 .61rem/1.1 system-ui,sans-serif}
      .sky-save-name-dialog input{width:100%;min-height:42px;box-sizing:border-box;padding:8px 10px;border:1px solid rgba(31,27,24,.28);border-radius:9px;background:#fff;color:#211d19;font:700 16px/1.2 system-ui,sans-serif}
      .sky-save-name-dialog input:focus{outline:2px solid rgba(31,27,24,.16);outline-offset:1px;border-color:rgba(31,27,24,.5)}
      .sky-save-name-status{min-height:18px;margin:6px 0 0!important;color:#8a3f35!important;font-size:.58rem!important}
      .sky-save-name-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:10px}
      .sky-save-name-actions button{appearance:none;min-height:34px;padding:0 12px;border:1px solid rgba(31,27,24,.2);border-radius:999px;background:#fff;color:#29241f;cursor:pointer;font:800 .61rem/1 system-ui,sans-serif}
      .sky-save-name-actions button[type="submit"]{background:#27221e;color:#fff;border-color:#27221e}
      .sky-save-name-actions button:focus-visible{outline:2px solid rgba(31,27,24,.2);outline-offset:2px}
      @media(max-width:620px){.sky-save-name-overlay{place-items:start center;padding-top:max(18px,env(safe-area-inset-top))}.sky-save-name-dialog{margin-top:8vh}}
    `;
    document.head.appendChild(style);
  }
  function ensureDialog(){
    if(overlay?.isConnected)return;
    overlay=document.createElement('div');overlay.className='sky-save-name-overlay';overlay.hidden=true;overlay.setAttribute('role','presentation');
    const dialog=document.createElement('form');dialog.className='sky-save-name-dialog';dialog.dataset.saveSkyNameDialog='true';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','skySaveNameTitle');
    dialog.innerHTML=`<h2 id="skySaveNameTitle">Save this sky</h2><p>Give this sky a name so you can load it again.</p><label><span>Sky name</span><input type="text" maxlength="80" autocomplete="off" enterkeyhint="done" data-save-sky-name-input></label><p class="sky-save-name-status" data-save-sky-name-status aria-live="polite"></p><div class="sky-save-name-actions"><button type="button" data-save-sky-name-cancel>Cancel</button><button type="submit">Save</button></div>`;
    overlay.appendChild(dialog);document.body.appendChild(overlay);
    input=dialog.querySelector('[data-save-sky-name-input]');status=dialog.querySelector('[data-save-sky-name-status]');
    dialog.addEventListener('submit',event=>{event.preventDefault();if(!activeSlot)return;const result=saveAs(activeSlot,input.value);status.textContent=result.message;if(result.ok)closeDialog()});
    dialog.querySelector('[data-save-sky-name-cancel]').addEventListener('click',closeDialog);
    overlay.addEventListener('pointerdown',event=>{if(event.target===overlay)event.preventDefault()});
  }
  function openDialog(slot){
    ensureDialog();activeSlot=slot;status.textContent='';input.value=candidateName(payload(slot));overlay.hidden=false;document.documentElement.dataset.skySaveNameOpen='true';
    // Do not programmatically focus on mobile. The user's tap into this stable input
    // is what should invoke the keyboard, and nothing will rebuild the node afterward.
    if(!matchMedia('(pointer:coarse)').matches)requestAnimationFrame(()=>input.focus({preventScroll:true}));
  }
  function closeDialog(){
    if(!overlay)return;overlay.hidden=true;activeSlot=null;document.documentElement.removeAttribute('data-sky-save-name-open');
    const trigger=document.querySelector('[data-saved-sky-trigger][aria-expanded="true"]');trigger?.focus?.({preventScroll:true});
  }
  function activeSlotFromPopover(){
    const trigger=document.querySelector('[data-saved-sky-trigger][aria-expanded="true"]');
    return trigger?.dataset.savedSkyTrigger||null;
  }

  installStyles();ensureDialog();
  // Register before the Saved Skies controller. This intercepts its inline naming action
  // and routes it to the stable dialog instead.
  document.addEventListener('click',event=>{
    const action=event.target.closest?.('[data-saved-as]');if(!action)return;
    const slot=activeSlotFromPopover();if(!slot)return;
    event.preventDefault();event.stopImmediatePropagation();openDialog(slot);
    const popover=document.getElementById('skySavedSkiesPopover');if(popover)popover.hidden=true;
    const trigger=document.querySelector(`[data-saved-sky-trigger="${slot}"]`);trigger?.setAttribute('aria-expanded','false');
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&activeSlot){event.preventDefault();event.stopImmediatePropagation();closeDialog()}},true);
})();