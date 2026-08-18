// Update-to-Now owns the active sky identity change. Header layout and ordinary identity
// presentation live in their owner stylesheet/controller and do not require mutation polling.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyHeaderStateV1)return;
  window.__relphiSkyHeaderStateV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function write(slot,value){try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}}
  function slotFrom(node){const panel=node?.closest?.('#skyFoundationA,#skyFoundationB');return panel?.id==='skyFoundationA'?'A':panel?.id==='skyFoundationB'?'B':null}
  function isUpdateNow(button){return /update\s+to\s+now/i.test(String(button?.textContent||'').replace(/\s+/g,' ').trim())}
  function applyHeaderState(slot,name){
    const root=document.documentElement,container=document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading>.sky-foundation-name`);
    root.style.setProperty(`--sky-${slot.toLowerCase()}-header-name`,JSON.stringify(name));
    root.dataset[`sky${slot}HasIdentity`]='true';
    if(container)container.textContent=name;
  }
  function renamePayload(slot){
    const value=read(slot);if(!value||typeof value!=='object')return false;const name='Now';
    value.name=name;value.title=name;value.displayName=name;value.skyName=name;
    value.metadata=value.metadata&&typeof value.metadata==='object'?value.metadata:{};
    delete value.metadata.savedSkyId;delete value.metadata.savedSkyName;delete value.metadata.savedSkyLoadedAt;
    value.metadata.name=name;value.metadata.title=name;
    value.calcProfile=value.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    value.calcProfile.name=name;value.calcProfile.title=name;
    if(!write(slot,value))return false;
    applyHeaderState(slot,name);
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name,source:'update-to-now'}}));
    return true;
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||!isUpdateNow(button))return;
    const slot=slotFrom(button);if(!slot)return;
    // Let the Where and When calculation commit first, then rename the resulting active sky once.
    setTimeout(()=>renamePayload(slot),0);
  },true);
})();
