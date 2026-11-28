// Canonical storage boundary: working Sky Chart state is tab-scoped; the Saved Skies library remains browser-shared.
(function(){
  'use strict';
  if(window.RelphiSkyWorkingStorage)return;
  const keys=new Set(['relphiSkyChartA','relphiSkyChartB','relphiSkyChartLastModeV1','relphiSkyLiveAgeAnchorA','relphiSkyLiveAgeAnchorB','relphiTarotChart','relphiCurrentSky','relphiSkyChartV2:chart','relphiSkyChartV2:currentSky','relphiSkyChartV2:active']);
  const isWorking=key=>keys.has(String(key));
  const migration='relphiSkyTabMigrationV1';
  // Import the old single-browser workspace once; no other tab inherits live changes.
  // Keep old snapshots untouched for manual recovery if a user needs them.
  try{
    if(!sessionStorage.getItem(migration)){
      if(localStorage.getItem(migration)!=='done'){
        for(const key of keys){
          const old=localStorage.getItem(key);
          if(old!==null&&sessionStorage.getItem(key)===null)sessionStorage.setItem(key,old);
        }
        localStorage.setItem(migration,'done');
      }
      sessionStorage.setItem(migration,'done');
    }
  }catch(error){console.warn('Sky Chart workspace migration could not be completed',error)}
  const RECOVERY='relphiSkyRecoveryV1',CAPACITY=14;
  const clean=x=>String(x==null?'':x).trim();
  function recovery(){
    try{const parsed=JSON.parse(localStorage.getItem(RECOVERY)||'{}');return {recent:Array.isArray(parsed.recent)?parsed.recent:[],eviction:Array.isArray(parsed.eviction)?parsed.eviction:[]}}
    catch(_){return{recent:[],eviction:[]}}
  }
  function signature(sky){
    const p=sky?.calcProfile||sky?.profile||{},lat=Number(p.latitude??sky?.latitude),lon=Number(p.longitude??sky?.longitude),date=clean(p.dateTime||sky?.dateTime);
    return date&&Number.isFinite(lat)&&Number.isFinite(lon)?JSON.stringify([date,lat.toFixed(5),lon.toFixed(5),clean(p.timeZone||sky?.timeZone),!!p.timeUnknown]):'';
  }
  function isUnsavedSky(sky){
    if(!sky||sky?.metadata?.savedSkyId||!signature(sky))return false;
    const placements=sky.placements||sky.positions||sky.points||sky.bodies;
    return !!placements&&typeof placements==='object'&&Object.keys(placements).length>0;
  }
  function saveRecovery(state){
    try{localStorage.setItem(RECOVERY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('relphi:sky-recovery-changed'));return true}
    catch(error){console.warn('Sky Recovery could not retain a working sky',error);window.dispatchEvent(new CustomEvent('relphi:sky-recovery-error',{detail:{message:'Browser storage is full; save this sky permanently.'}}));return false}
  }
  function remember(value){
    let sky;try{sky=typeof value==='string'?JSON.parse(value):value}catch(_){return}
    if(!isUnsavedSky(sky))return;
    const key=signature(sky),state=recovery(),existing=[...state.recent,...state.eviction].find(x=>x.signature===key);
    state.recent=state.recent.filter(x=>x.signature!==key);state.eviction=state.eviction.filter(x=>x.signature!==key);
    state.recent.unshift({id:existing?.id||'recover-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),signature:key,sky,lastUsedAt:new Date().toISOString(),firstSeenAt:existing?.firstSeenAt||new Date().toISOString()});
    while(state.recent.length>CAPACITY)state.eviction.unshift(state.recent.pop());
    saveRecovery(state);
  }
  function loadRecovery(id){
    const state=recovery(),entry=[...state.recent,...state.eviction].find(x=>x.id===id);
    if(!entry)return null;
    remember(entry.sky);return JSON.parse(JSON.stringify(entry.sky));
  }
  function releaseRecovery(sky){
    const key=signature(sky);if(!key)return;
    const state=recovery();state.recent=state.recent.filter(x=>x.signature!==key);state.eviction=state.eviction.filter(x=>x.signature!==key);saveRecovery(state);
  }
  const area=key=>isWorking(key)?sessionStorage:localStorage;
  window.RelphiSkyWorkingStorage=Object.freeze({
    getItem(key){return area(key).getItem(key)},
    setItem(key,value){area(key).setItem(key,value);if(key==='relphiSkyChartA'||key==='relphiSkyChartB')remember(value)},
    removeItem(key){area(key).removeItem(key)},
    recovery,loadRecovery,releaseRecovery,remember
  });
})();
