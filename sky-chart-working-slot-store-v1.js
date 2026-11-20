// The single storage owner for *working* Sky Chart slots. Named Saved Skies,
// filter preferences and other account-wide choices still use localStorage.
// sessionStorage belongs to one browser tab and survives reloading that tab.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.RelphiSkyWorkingSlotStore)return;
  const KEYS=new Set([
    'relphiSkyChartA','relphiSkyChartB','relphiSkyChartLastModeV1',
    'relphiSkyLiveAgeAnchorA','relphiSkyLiveAgeAnchorB'
  ]);
  const SKY_KEYS=new Set(['relphiSkyChartA','relphiSkyChartB']);
  const MIGRATED='relphiSkyTabWorkingSlotsMigratedV1';
  const enrichers=[];

  // Adopt pre-existing working charts once, without deleting the legacy data.
  // Never replay another tab's changes over this tab's unsaved working slots.
  if(sessionStorage.getItem(MIGRATED)!=='yes'){
    for(const key of KEYS){
      if(sessionStorage.getItem(key)!==null)continue;
      const previous=localStorage.getItem(key);
      if(previous!==null)sessionStorage.setItem(key,previous);
    }
    sessionStorage.setItem(MIGRATED,'yes');
  }

  function getItem(key){
    key=String(key);
    return (KEYS.has(key)?sessionStorage:localStorage).getItem(key);
  }
  function setItem(key,value){
    key=String(key);value=String(value);
    if(!KEYS.has(key)){localStorage.setItem(key,value);return}
    if(enrichers.length&&SKY_KEYS.has(key)){
      try{
        let next=JSON.parse(value);
        const prior=JSON.parse(sessionStorage.getItem(key)||'null');
        // The later final-pass completion runs before the earlier angle
        // normalization, preserving the established source execution order.
        for(let i=enrichers.length-1;i>=0;i--)next=enrichers[i](next,prior);
        value=JSON.stringify(next);
      }catch(_){/* Keep the source's original value if it is not a sky JSON packet. */}
    }
    sessionStorage.setItem(key,value);
  }
  function removeItem(key){
    key=String(key);
    (KEYS.has(key)?sessionStorage:localStorage).removeItem(key);
  }
  function addSlotEnricher(callback){
    if(typeof callback!=='function')throw new TypeError('A working-sky enrichment function is required.');
    enrichers.push(callback);
  }
  window.RelphiSkyWorkingSlotStore=Object.freeze({
    getItem,setItem,removeItem,addSlotEnricher,isTabScoped:key=>KEYS.has(String(key))
  });
})();