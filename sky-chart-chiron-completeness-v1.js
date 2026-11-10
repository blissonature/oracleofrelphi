// Recover a missing Chiron for dated working skies from the bundled JPL ephemeris.
// Imported Chiron entries are authoritative and are never replaced.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyChironCompletenessV1)return;
window.__relphiSkyChironCompletenessV1=true;
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
let repairing=false,queued=false;
function restore(slot,notify=false){
 const ephemeris=window.RelphiChironEphemeris;
 if(!ephemeris?.calculate||!ephemeris?.instantFor||!ephemeris?.hasChiron)return false;
 const key=KEYS[slot];
 let payload;
 try{payload=JSON.parse(localStorage.getItem(key)||'null')}catch(_){return false}
 if(!payload||ephemeris.hasChiron(payload.placements))return false;
 const instant=ephemeris.instantFor(payload);
 if(!(instant instanceof Date)||!Number.isFinite(instant.getTime()))return false;
 let point;
 try{point=ephemeris.calculate(instant)}
 catch(error){
  if(!/outside the local ephemeris range|ephemeris data are unavailable/.test(String(error?.message||'')))
   console.warn('[Sky Chart] Could not restore Chiron:',error);
  return false;
 }
 if(!payload.placements||typeof payload.placements!=='object'||Array.isArray(payload.placements))return false;
 payload.placements.Chiron=point;
 const profile=payload.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
 payload.calcProfile={...profile,extraPoints:{...(profile.extraPoints||{}),chiron:'calculated',chironSource:'NASA/JPL Horizons local ephemeris',...(profile.timeUnknown===true?{chironTiming:'approximate-local-noon'}:{})}};
 localStorage.setItem(key,JSON.stringify(payload));
 if(notify){
  try{window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key),storageArea:localStorage}))}
  catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:key});window.dispatchEvent(event)}
 }
 return true;
}
function repairAll(notify=false){
 if(repairing)return;
 repairing=true;
 try{restore('A',notify);restore('B',notify)}finally{repairing=false}
}
function schedule(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;repairAll(true)});
}
// Sync startup repair runs before the foundation reads its chart payload.
repairAll(false);
window.addEventListener('storage',event=>{
 if(!repairing&&(!event.key||Object.values(KEYS).includes(event.key)))schedule();
});
['relphi:saved-sky-active-changed','relphi:sky-foundation-ready','relphi:sky-b-restored'].forEach(name=>window.addEventListener(name,schedule));
window.RelphiSkyChironCompleteness=Object.freeze({restore,repairAll});
})();
