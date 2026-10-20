// Wheel selections are owned exclusively by sky-chart-foundation-interactions-v2.
// House focus is an exploration state, not an implicit edit to the Houses filter.
// The Houses checklist remains controlled by its own input change handlers.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseFocusBridgeV2)return;
  window.__relphiSkyHouseFocusBridgeV1=true;
  window.__relphiSkyHouseFocusBridgeV2=true;
  let previous=null;
  window.addEventListener('relphi:sky-foundation-filter-changed',event=>{
    const state=event.detail?.state;
    const next=state?.mode==='selected'&&state.kind==='house'?{slot:state.sky,house:Number(state.value)}:null;
    if(previous?.slot===next?.slot&&previous?.house===next?.house)return;
    previous=next;
    window.dispatchEvent(new CustomEvent('relphi:sky-house-focus-bridge-changed',{
      detail:{slot:next?.slot||null,house:next?.house||null,active:!!next,source:'comparison-wheel'}
    }));
  });
})();
