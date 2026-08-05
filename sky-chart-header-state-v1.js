// Keep Sky A and Sky B headers aligned and make "Update to Now" names truthful.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyHeaderStateV1)return;
  window.__relphiSkyHeaderStateV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};

  function installStyles(){
    if(document.getElementById('skyHeaderStateStyles'))return;
    const style=document.createElement('style');
    style.id='skyHeaderStateStyles';
    style.textContent=`
      #skyFoundationA>.sky-foundation-heading,
      #skyFoundationB>.sky-foundation-heading{
        display:grid!important;
        grid-template-columns:auto minmax(0,1fr)!important;
        grid-template-rows:44px auto!important;
        align-items:center!important;
        min-height:92px!important;
        padding:0!important;
      }
      #skyFoundationA>.sky-foundation-heading>.sky-foundation-slot,
      #skyFoundationB>.sky-foundation-heading>.sky-foundation-slot{
        grid-column:1!important;
        grid-row:1!important;
        align-self:stretch!important;
        display:flex!important;
        align-items:center!important;
      }
      #skyFoundationA>.sky-foundation-heading>.sky-foundation-name,
      #skyFoundationB>.sky-foundation-heading>.sky-foundation-name{
        grid-column:2!important;
        grid-row:1!important;
        min-width:0!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
        line-height:1.2!important;
        padding-inline:.65rem!important;
      }
      #skyFoundationA>.sky-foundation-heading>.sky-where-when-actions,
      #skyFoundationB>.sky-foundation-heading>.sky-where-when-actions{
        grid-column:1/-1!important;
        grid-row:2!important;
        min-height:48px!important;
        align-self:stretch!important;
      }
    `;
    document.head.appendChild(style);
  }

  function read(slot){
    try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}
  }
  function write(slot,value){
    try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}
  }
  function slotFrom(node){
    const panel=node?.closest?.('#skyFoundationA,#skyFoundationB');
    return panel?.id==='skyFoundationA'?'A':panel?.id==='skyFoundationB'?'B':null;
  }
  function isUpdateNow(button){
    return /update\s+to\s+now/i.test(String(button?.textContent||'').replace(/\s+/g,' ').trim());
  }
  function currentName(){return 'Current sky'}
  function applyDisplay(slot){
    const panel=document.getElementById(`skyFoundation${slot}`);
    const name=panel?.querySelector(':scope > .sky-foundation-heading .sky-foundation-name');
    if(name){name.textContent=currentName();name.title=currentName()}
  }
  function renamePayload(slot){
    const value=read(slot);if(!value||typeof value!=='object')return false;
    const name=currentName();
    value.name=name;
    value.title=name;
    value.displayName=name;
    value.skyName=name;
    value.metadata=value.metadata&&typeof value.metadata==='object'?value.metadata:{};
    value.metadata.name=name;
    value.metadata.title=name;
    value.calcProfile=value.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    value.calcProfile.name=name;
    value.calcProfile.title=name;
    return write(slot,value);
  }
  function reconcile(slot,attempt){
    renamePayload(slot);
    applyDisplay(slot);
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:currentName(),source:'update-to-now'}}));
    if(attempt<6)setTimeout(()=>reconcile(slot,attempt+1),attempt<2?180:420);
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button||!isUpdateNow(button))return;
    const slot=slotFrom(button);if(!slot)return;
    setTimeout(()=>reconcile(slot,0),0);
  },true);

  function align(){installStyles()}
  new MutationObserver(align).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',align,{once:true});else align();
})();
