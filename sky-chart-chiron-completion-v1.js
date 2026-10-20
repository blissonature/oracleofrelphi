// Backfill Chiron into existing dated Sky Chart payloads that predate Chiron calculation.
(function(){
'use strict';
if(window.__relphiSkyChironCompletionV1)return;
window.__relphiSkyChironCompletionV1=true;
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const LIBRARY_KEY='relphiSkyLibraryV1';
let running=false,queued=false;
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function dispatch(key){try{window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key),storageArea:localStorage}))}catch(_){const e=new Event('storage');Object.defineProperty(e,'key',{value:key});window.dispatchEvent(e)}}
async function run(){
  queued=false;if(running||!window.RelphiChironEphemeris)return;running=true;
  try{
    for(const key of Object.values(KEYS)){
      const value=read(key);if(!value)continue;
      try{
        if(await window.RelphiChironEphemeris.completePayload(value)){
          localStorage.setItem(key,JSON.stringify(value));dispatch(key);
        }
      }catch(error){console.error('[Sky Chart Chiron completion]',error)}
    }
    // Previously saved skies may predate the Chiron-inclusive save transaction.
    // Repair their stored records, not just the temporary Sky A/B working copies.
    let library;
    try{library=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'[]')}catch(_){library=null}
    if(Array.isArray(library)){
      let changed=false;
      for(const record of library){
        if(!record||typeof record!=='object')continue;
        try{if(await window.RelphiChironEphemeris.completePayload(record))changed=true}
        catch(error){console.error('[Saved Sky Chiron completion]',error)}
      }
      if(changed){
        localStorage.setItem(LIBRARY_KEY,JSON.stringify(library));
        window.dispatchEvent(new CustomEvent('relphi:saved-sky-library-changed',{detail:{action:'chiron-completion'}}));
      }
    }
  }finally{running=false}
}
function schedule(){if(queued||running)return;queued=true;requestAnimationFrame(()=>void run())}
window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))schedule()});
window.addEventListener('relphi:sky-where-when-committed',schedule);
window.addEventListener('relphi:saved-sky-loaded',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();