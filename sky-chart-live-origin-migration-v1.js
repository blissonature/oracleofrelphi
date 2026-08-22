// Backfill live-origin metadata for legacy Now skies created before staleness tracking existed.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLiveOriginMigrationV1)return;
window.__relphiSkyLiveOriginMigrationV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const LIVE_ORIGINS=new Set(['here-and-now','update-to-now']);

function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}}
function norm(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}

function instantMs(value){
  const data=profile(value);
  if(data.instant){const parsed=Date.parse(data.instant);if(Number.isFinite(parsed))return parsed}
  const dateTime=String(data.dateTime||'').trim();
  if(!dateTime)return NaN;
  const zone=String(data.timeZone||'').trim();
  try{
    if(window.luxon?.DateTime&&zone){
      const parsed=window.luxon.DateTime.fromISO(dateTime,{zone,setZone:true});
      if(parsed?.isValid)return parsed.toUTC().toMillis();
    }
  }catch(_){}
  const fallback=Date.parse(dateTime);
  return Number.isFinite(fallback)?fallback:NaN;
}

function hasSavedIdentity(value){
  const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
  return !!(metadata.savedSkyId||metadata.savedSkyName||metadata.savedSkyLoadedAt);
}

function isNamedNow(value){
  const data=profile(value);
  const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
  return [value?.name,value?.title,value?.displayName,value?.skyName,data.name,data.title,metadata.name,metadata.title]
    .some(candidate=>norm(candidate)==='now');
}

function legacyOrigin(value){
  if(!value||typeof value!=='object'||hasSavedIdentity(value)||!isNamedNow(value))return'';
  const metadata=value.metadata&&typeof value.metadata==='object'?value.metadata:{};
  if(LIVE_ORIGINS.has(String(metadata.liveNowOrigin||'')))return'';
  const data=profile(value);
  const timestamp=instantMs(value);
  if(!Number.isFinite(timestamp))return'';

  // Old live flows did not persist an explicit origin marker. Their reliable surviving
  // signature is an unsaved sky named Now whose calculation profile says it used the
  // device's current location. Do not use savedAt/updatedAt here: other Sky Chart layers
  // legitimately rewrite those bookkeeping timestamps long after the sky was calculated.
  const query=norm(data.locationQuery);
  const location=norm(data.location);
  const source=norm(data.source);
  const updateSignature=source==='where-when-v1'&&query==='my current location';
  const hereNowSignature=query==='current location'||location==='current location';
  if(updateSignature)return'update-to-now';
  if(hereNowSignature)return'here-and-now';
  return'';
}

function migrate(slot){
  const value=read(slot);
  const origin=legacyOrigin(value);
  if(!origin)return false;
  const timestamp=instantMs(value);
  const data=profile(value);
  const metadata=value.metadata&&typeof value.metadata==='object'?{...value.metadata}:{};
  metadata.liveNowOrigin=origin;
  metadata.liveNowAt=new Date(timestamp).toISOString();
  metadata.liveNowLatitude=String(data.latitude??'');
  metadata.liveNowLongitude=String(data.longitude??'');
  metadata.liveNowMigrated='legacy-v2';
  value.metadata=metadata;
  if(!write(slot,value))return false;
  window.dispatchEvent(new CustomEvent('relphi:sky-live-origin-changed',{detail:{slot,origin,migrated:true}}));
  return true;
}

function run(){migrate('A');migrate('B')}
window.RelphiSkyLiveOriginMigration={legacyOrigin,migrate,run};
run();
window.addEventListener('relphi:sky-foundation-ready',run);
})();
