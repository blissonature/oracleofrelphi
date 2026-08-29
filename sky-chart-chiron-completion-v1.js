// Backfill Chiron into existing dated Sky Chart payloads that predate Chiron calculation.
(function(){
'use strict';
if(window.__relphiSkyChironCompletionV1)return;
window.__relphiSkyChironCompletionV1=true;
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
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
  }finally{running=false}
}
function schedule(){if(queued||running)return;queued=true;requestAnimationFrame(()=>void run())}
window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))schedule()});
window.addEventListener('relphi:sky-where-when-committed',schedule);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();