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
  const area=key=>isWorking(key)?sessionStorage:localStorage;
  window.RelphiSkyWorkingStorage=Object.freeze({
    getItem(key){return area(key).getItem(key)},
    setItem(key,value){area(key).setItem(key,value)},
    removeItem(key){area(key).removeItem(key)}
  });
})();
