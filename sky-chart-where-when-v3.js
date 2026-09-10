// Where and When source owner. Final markup, transaction state, and commit lifecycle live here.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenV3)return;
window.__relphiSkyWhereWhenV3=true;
window.__relphiSkyWhereWhenV2=true;
window.__relphiSkyWhereWhenV1=true;

const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SHARED_HOUSE_KEY='relphiSkySharedHouseSystemV1';
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const BODIES=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const CHALDEAN=['saturn','jupiter','mars','sun','venus','mercury','moon'];
const WEEK_PATH=['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
const WEEKDAY_RULERS={1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn',7:'sun'};
const PLANETS={saturn:{color:'#8c7a42'},jupiter:{color:'#41752f'},mars:{color:'#c9211e'},sun:{color:'#d08a00'},venus:{color:'#b23b79'},mercury:{color:'#277390'},moon:{color:'#58628a'}};
const INFERENCE_MARKER='Inferred from pasted placements';
const cardState={A:{selected:null,busy:false,summarySignature:'',rendering:false,rerender:false},B:{selected:null,busy:false,summarySignature:'',rendering:false,rerender:false}};
const transactionState={editing:new Set(),committed:new Set()};

function installStyles(){
  if(document.getElementById('skyWhereWhenV3OwnedStyles'))return;
  const style=document.createElement('style');
  style.id='skyWhereWhenV3OwnedStyles';
  style.textContent=`
    .sky-where-when-editor{display:grid;grid-template-rows:minmax(0,1fr) auto;min-height:0}
    .sky-where-when-scroll-body{min-height:0;overflow:auto;padding-bottom:.2rem}
    .sky-where-when-here-now-row{display:flex;align-items:center;padding:.62rem .62rem .18rem}
    .sky-where-when-here-now{border-radius:999px}
    .sky-inferred-location-value{font-weight:800}
    .sky-where-when-footer{position:relative;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto!important;gap:.5rem!important;width:100%;padding:.45rem .62rem .62rem!important;box-sizing:border-box;background:#fffdf8;border-top:1px solid rgba(31,27,24,.12);z-index:2}
    .sky-where-when-footer-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:.48rem;width:100%}
    .sky-where-when-footer-actions .sky-where-when-button{width:100%;min-width:0;margin:0}
    @media(max-width:620px){.sky-where-when-here-now-row{padding:.55rem .55rem .14rem}.sky-where-when-footer{padding:.42rem .55rem .55rem!important}}
  `;
  document.head.appendChild(style);
}
function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
function payload(slot){return readJson(SLOT_KEYS[slot],null)}
function profileFor(slot){const value=payload(slot);return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function completeProfile(p){return!!(p&&p.dateTime&&p.location&&p.timeZone&&Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)))}
function panel(slot){return document.getElementById(`skyFoundation${slot}`)}
function shell(slot){return window.RelphiSkyCardShell?.ensure?.(slot,payload(slot))||null}
function formFor(slot){return shell(slot)?.editor?.querySelector('.sky-where-when-editor')||null}
function eventSlot(target){return target?.closest('#skyFoundationA')?'A':target?.closest('#skyFoundationB')?'B':null}
function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function norm(value){return((Number(value)%360)+360)%360}
function displayCoordinate(value){return Number.isFinite(Number(value))?Number(value).toFixed(5):''}
function status(slot,message,error=false){const node=panel(slot)?.querySelector('.sky-where-when-status');if(!node)return;node.textContent=message||'';node.classList.toggle('is-error',!!error)}
function setBusy(slot,busy){cardState[slot].busy=!!busy;const editor=formFor(slot);if(!editor)return;editor.querySelectorAll('button,input,select,textarea').forEach(node=>{if(node.classList.contains('sky-where-when-cancel'))return;node.disabled=!!busy})}

function publishTransactionState(){
  const slots=[...transactionState.editing].sort();
  document.documentElement.dataset.skyWhereWhenEditing=slots.length?'true':'false';
  document.documentElement.dataset.skyWhereWhenEditingSlots=slots.join(',');
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-edit-state-changed',{detail:{active:slots.length>0,slots}}));
}
function beginWhereWhen(slot){if(!SLOT_KEYS[slot]||transactionState.editing.has(slot))return;transactionState.editing.add(slot);publishTransactionState()}
function finishWhereWhen(slot,committed){
  if(!SLOT_KEYS[slot])return;
  if(committed)transactionState.committed.add(slot);
  transactionState.editing.delete(slot);
  publishTransactionState();
  if(transactionState.editing.size||!transactionState.committed.size)return;
  const slots=[...transactionState.committed].sort();
  transactionState.committed.clear();
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-committed',{detail:{slots}}));
}
function reconcileWhereWhenTransaction(){
  [...transactionState.editing].forEach(slot=>{
    const editor=document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`),mount=editor?.closest?.('[data-ww-editor-mount]');
    if(!editor?.isConnected||mount?.hidden)transactionState.editing.delete(slot);
  });
  publishTransactionState();
}
window.RelphiSkyWhereWhenTransaction=Object.freeze({begin:beginWhereWhen,commit:slot=>finishWhereWhen(slot,true),cancel:slot=>finishWhereWhen(slot,false),active:()=>transactionState.editing.size>0,slots:()=>[...transactionState.editing],reconcile:reconcileWhereWhenTransaction});

function selectedSource(slot,p){
  const metadata=payload(slot)?.metadata||{},source=String(metadata.whereWhenSource||p.whereWhenSource||'').trim();
  if(source==='placement-inference'||p.locationQuery===INFERENCE_MARKER)return'placement-inference';
  return source||'saved';
}
function currentSelection(slot,p){
  if(!completeProfile(p))return null;
  const source=selectedSource(slot,p);
  return{source,query:source==='placement-inference'?'':String(p.locationQuery||p.location||''),canonical:p.location,latitude:Number(p.latitude),longitude:Number(p.longitude),timezone:p.timeZone};
}
function confirmationMarkup(selected){
  if(!selected)return'<div class="sky-location-confirmation" hidden></div>';
  if(selected.source==='placement-inference')return`<div class="sky-location-confirmation" data-location-source="placement-inference"><p><strong>Location inferred from pasted placements</strong></p><p class="sky-inferred-location-value">${escapeHtml(selected.canonical)}</p></div>`;
  return`<div class="sky-location-confirmation" data-location-source="${escapeHtml(selected.source||'search')}"><p><strong>You searched:</strong> ${escapeHtml(selected.query||selected.canonical)}</p><p><strong>Location found:</strong> ${escapeHtml(selected.canonical)}</p></div>`;
}
function editorMarkup(slot,p){
  const selected=currentSelection(slot,p);
  cardState[slot].selected=selected;
  const dateTime=String(p.dateTime||''),date=dateTime.slice(0,10),time=dateTime.slice(11,16),disabled=selected?'':' disabled';
  return `<form class="sky-where-when-editor" data-slot="${slot}">
    <div class="sky-where-when-scroll-body">
      <div class="sky-where-when-here-now-row"><button class="sky-where-when-button primary sky-where-when-here-now" type="button" data-ww-action="here-and-now">Here and Now</button></div>
      <fieldset class="sky-where-when-section"><legend>Where</legend><div class="sky-where-search-row"><label class="sky-where-when-label">Search for a location<input class="sky-where-when-input" data-ww-field="location-query" type="search" autocomplete="off" value="${escapeHtml(selected?.query||'')}" placeholder="Ex. City, State or Country"></label><button class="sky-where-when-button secondary" type="button" data-ww-action="search-location">Search</button></div><div class="sky-location-results" aria-live="polite"></div>${confirmationMarkup(selected)}</fieldset>
      <fieldset class="sky-where-when-section" data-ww-when${disabled}><legend>When</legend><div class="sky-where-when-now-row"><button class="sky-where-when-button secondary sky-use-now-button" type="button" data-ww-action="use-now">Current local time</button><span>Use the current instant at this location.</span></div><div class="sky-where-when-grid"><label class="sky-where-when-label">Date<input class="sky-where-when-input" data-ww-field="date" type="date" value="${escapeHtml(date)}"${disabled}></label><label class="sky-where-when-label">Local time<input class="sky-where-when-input" data-ww-field="time" type="time" value="${escapeHtml(time)}"${disabled}></label></div></fieldset>
      <details class="sky-where-when-advanced"><summary>Advanced settings</summary><div class="sky-where-when-advanced-body"><label class="sky-where-when-label">Time zone<input class="sky-where-when-input" data-ww-field="timezone" type="text" readonly value="${escapeHtml(selected?.timezone||p.timeZone||'')}"></label><div class="sky-where-when-coordinate-grid"><label class="sky-where-when-label">Latitude<input class="sky-where-when-input" data-ww-field="latitude" type="number" step="0.00001" min="-90" max="90" value="${escapeHtml(displayCoordinate(selected?.latitude??p.latitude))}"></label><label class="sky-where-when-label">Longitude<input class="sky-where-when-input" data-ww-field="longitude" type="number" step="0.00001" min="-180" max="180" value="${escapeHtml(displayCoordinate(selected?.longitude??p.longitude))}"></label></div><div data-ww-paste-inference-host></div></div></details>
      <p class="sky-where-when-status" data-update-now-status aria-live="polite"></p>
    </div>
    <div class="sky-where-when-footer"><div class="sky-where-when-heptagram-slot" data-ww-heptagram-slot="${slot}"></div><div class="sky-where-when-footer-actions"><button class="sky-where-when-button secondary sky-where-when-cancel" type="button" data-ww-action="cancel">Cancel</button><button class="sky-where-when-button primary" type="submit"${disabled}>Use This Where and When</button></div></div>
  </form>`;
}
function moveHeptagramIntoEditor(slot){
  const refs=shell(slot),mount=refs?.editor?.querySelector(`[data-ww-heptagram-slot="${slot}"]`),frame=refs?.root?.querySelector(`[data-sky-heptagram-frame="${slot}"]`);
  if(mount&&frame)mount.prepend(frame);
}
function restoreHeptagram(slot){const refs=shell(slot),frame=refs?.root?.querySelector(`[data-sky-heptagram-frame="${slot}"]`);if(refs?.summary&&frame&&!refs.summary.contains(frame))refs.summary.prepend(frame)}
function openEditor(slot,focus=false){
  const refs=shell(slot);if(!refs)return;
  beginWhereWhen(slot);
  refs.editor.innerHTML=editorMarkup(slot,profileFor(slot));
  moveHeptagramIntoEditor(slot);
  window.RelphiSkyCardShell.setEditorExpanded(slot,true);
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-editor-ready',{detail:{slot,form:formFor(slot)}}));
  if(focus)requestAnimationFrame(()=>formFor(slot)?.querySelector('[data-ww-field="location-query"]')?.focus());
}
function clearEditor(slot){const refs=shell(slot);if(!refs)return;restoreHeptagram(slot);window.RelphiSkyCardShell.setEditorExpanded(slot,false);refs.editor.replaceChildren();cardState[slot].busy=false}
function closeEditor(slot){if(!transactionState.editing.has(slot))return;clearEditor(slot);finishWhereWhen(slot,false)}

function localDateTimeToInstant(date,time,timeZone){
  if(!window.luxon?.DateTime)throw new Error('Time-zone conversion is unavailable.');
  const dt=window.luxon.DateTime.fromISO(`${date}T${time}`,{zone:timeZone,setZone:true});
  if(!dt.isValid)throw new Error(dt.invalidExplanation||'That local date and time is not valid in the selected time zone.');
  return dt;
}
function astronomyLongitude(bodyName,date){const A=window.Astronomy;if(!A)throw new Error('Astronomy Engine is unavailable.');if(bodyName==='Moon'&&typeof A.EclipticGeoMoon==='function')return norm(A.EclipticGeoMoon(date).lon);return norm(A.Ecliptic(A.GeoVector(bodyName,date,true)).elon)}
function siderealDegrees(date,longitude){return norm(window.Astronomy.SiderealTime(date)*15+Number(longitude||0))}
function obliquity(date){return Number(window.Astronomy.e_tilt(date).tobl)}
function ascendantLongitude(date,latitude,longitude){const theta=siderealDegrees(date,longitude)*Math.PI/180,phi=Number(latitude)*Math.PI/180,epsilon=obliquity(date)*Math.PI/180;return norm(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(epsilon)+Math.tan(phi)*Math.sin(epsilon))*180/Math.PI+180)}
function midheavenLongitude(date,longitude){const theta=siderealDegrees(date,longitude)*Math.PI/180,epsilon=obliquity(date)*Math.PI/180;return norm(Math.atan2(Math.sin(theta),Math.cos(theta)*Math.cos(epsilon))*180/Math.PI)}
function placementObject(name,longitude){const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);return{name,longitude:value,sign:SIGNS[signIndex],degree,minute,second}}
function calculateSky(slot,selected,date,time,options={}){
  const supplied=String(options.instant||'').trim();
  const dt=supplied?window.luxon?.DateTime?.fromISO(supplied,{setZone:true})?.setZone(selected.timezone):localDateTimeToInstant(date,time,selected.timezone);
  if(!dt?.isValid)throw new Error('The current instant could not be converted to the selected location.');
  const instant=dt.toUTC().toJSDate(),placements={};
  BODIES.forEach(name=>{placements[name]=placementObject(name,astronomyLongitude(name,instant))});
  const asc=ascendantLongitude(instant,selected.latitude,selected.longitude),mc=midheavenLongitude(instant,selected.longitude);
  placements.Ascendant=placementObject('Ascendant',asc);placements.Midheaven=placementObject('Midheaven',mc);
  const houseSystem=localStorage.getItem(SHARED_HOUSE_KEY)||profileFor(slot).houseSystem||'whole-sign';
  const houses=window.RelphiHouseSystems.calculateCusps({system:houseSystem,ascendant:asc,midheaven:mc,siderealDegrees:siderealDegrees(instant,selected.longitude),obliquityDegrees:obliquity(instant),latitude:selected.latitude});
  const existing=payload(slot)||{},metadata=existing.metadata&&typeof existing.metadata==='object'?{...existing.metadata}:{},priorProfile=existing.calcProfile&&typeof existing.calcProfile==='object'?{...existing.calcProfile}:{},liveOrigin=String(options.liveOrigin||'');
  delete metadata.savedSkyId;delete metadata.savedSkyName;delete metadata.savedSkyLoadedAt;
  metadata.whereWhenSource=selected.source||'manual';
  if(liveOrigin==='use-now'){
    delete metadata.liveNowDisabled;delete metadata.liveNowDisabledReason;delete metadata.liveNowMigrated;
    metadata.name='Now';metadata.title='Now';metadata.liveNowOrigin='use-now';metadata.liveNowAt=dt.toUTC().toISO();metadata.liveAgeAnchorAt=metadata.liveNowAt;metadata.liveNowLatitude=String(selected.latitude);metadata.liveNowLongitude=String(selected.longitude);
    return{...existing,name:'Now',title:'Now',displayName:'Now',skyName:'Now',saved:false,placements,houseCusps:houses.cusps,metadata,calcProfile:{...priorProfile,name:'Now',title:'Now',dateTime:dt.toFormat("yyyy-MM-dd'T'HH:mm"),instant:metadata.liveNowAt,latitude:String(selected.latitude),longitude:String(selected.longitude),location:selected.canonical,locationQuery:selected.query||selected.canonical,timeZone:selected.timezone,whereWhenSource:selected.source||'manual',houseSystem:houses.system||houseSystem,houseCusps:houses.cusps,cusps:houses.cusps,houseSystemNote:houses.note,source:'where-when-v3',liveNowOrigin:'use-now',liveNowAt:metadata.liveNowAt},savedAt:new Date().toISOString()};
  }
  delete metadata.liveNowOrigin;delete metadata.liveNowAt;delete metadata.liveAgeAnchorAt;delete metadata.liveNowLatitude;delete metadata.liveNowLongitude;delete metadata.liveNowMigrated;
  metadata.liveNowDisabled=true;metadata.liveNowDisabledReason='custom-where-when';
  delete priorProfile.liveNowOrigin;delete priorProfile.liveNowAt;
  return{...existing,name:existing.name||`Sky ${slot}`,saved:false,placements,houseCusps:houses.cusps,metadata,calcProfile:{...priorProfile,dateTime:`${date}T${time}`,instant:dt.toUTC().toISO(),latitude:String(selected.latitude),longitude:String(selected.longitude),location:selected.canonical,locationQuery:selected.query||selected.canonical,timeZone:selected.timezone,whereWhenSource:selected.source||'manual',houseSystem:houses.system||houseSystem,houseCusps:houses.cusps,cusps:houses.cusps,houseSystemNote:houses.note,source:'where-when-v3'},savedAt:new Date().toISOString()};
}
function dispatchSlotChange(slot){try{window.dispatchEvent(new StorageEvent('storage',{key:SLOT_KEYS[slot],newValue:localStorage.getItem(SLOT_KEYS[slot]),storageArea:localStorage}))}catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:SLOT_KEYS[slot]});window.dispatchEvent(event)}}
function normalizePacket(packet){
  if(!packet||typeof packet!=='object')return null;
  const next={...packet},inferred=next.source==='placement-inference'||String(next.query||'').trim()===INFERENCE_MARKER;
  if(inferred){next.source='placement-inference';next.query=''}else if(!next.source)next.source='search';
  return next;
}
async function searchLocation(slot){
  const card=panel(slot),input=card?.querySelector('[data-ww-field="location-query"]'),resultsNode=card?.querySelector('.sky-location-results'),query=input?.value.trim()||'';
  if(!query){status(slot,'Type a location first.',true);input?.focus();return}
  status(slot,`Searching for ${query}…`);resultsNode?.replaceChildren();
  try{
    const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.searchParams.set('name',query);url.searchParams.set('count','7');url.searchParams.set('language','en');url.searchParams.set('format','json');
    const response=await fetch(url.toString(),{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Location search returned ${response.status}.`);
    const data=await response.json(),results=Array.isArray(data.results)?data.results:[];if(!results.length)throw new Error('No matching location was found. Try a city plus state, region, or country.');
    const fragment=document.createDocumentFragment();
    results.forEach((result,index)=>{
      const canonical=[result.name,result.admin1,result.country].map(v=>String(v||'').trim()).filter((v,i,list)=>v&&list.indexOf(v)===i).join(','+' '),button=document.createElement('button');
      button.type='button';button.className='sky-location-result';button.dataset.wwAction='select-location';button.dataset.locationIndex=String(index);button.innerHTML=`<strong>${escapeHtml(canonical)}</strong><span>${displayCoordinate(result.latitude)}, ${displayCoordinate(result.longitude)} · ${escapeHtml(result.timezone||'Time zone unavailable')}</span>`;
      button.__locationPacket={source:'search',query,canonical,latitude:Number(result.latitude),longitude:Number(result.longitude),timezone:String(result.timezone||'')};fragment.appendChild(button);
    });
    resultsNode.appendChild(fragment);status(slot,'Choose the canonical location that matches what you meant.');
  }catch(error){status(slot,error.message||'Location search failed.',true)}
}
function selectLocation(slot,source){
  const packet=normalizePacket(source?.__locationPacket||source);
  if(!packet||!Number.isFinite(Number(packet.latitude))||!Number.isFinite(Number(packet.longitude))||!packet.timezone){status(slot,'That result did not include a complete coordinate and time-zone packet.',true);return false}
  packet.latitude=Number(packet.latitude);packet.longitude=Number(packet.longitude);cardState[slot].selected=packet;
  const card=panel(slot),queryInput=card?.querySelector('[data-ww-field="location-query"]');if(queryInput)queryInput.value=packet.query||'';
  card?.querySelector('.sky-location-results')?.replaceChildren();
  const confirmation=card?.querySelector('.sky-location-confirmation');
  if(confirmation){confirmation.hidden=false;confirmation.dataset.locationSource=packet.source||'search';confirmation.innerHTML=packet.source==='placement-inference'?`<p><strong>Location inferred from pasted placements</strong></p><p class="sky-inferred-location-value">${escapeHtml(packet.canonical)}</p>`:`<p><strong>You searched:</strong> ${escapeHtml(packet.query||packet.canonical)}</p><p><strong>Location found:</strong> ${escapeHtml(packet.canonical)}</p>`}
  card.querySelector('[data-ww-field="timezone"]').value=packet.timezone;card.querySelector('[data-ww-field="latitude"]').value=displayCoordinate(packet.latitude);card.querySelector('[data-ww-field="longitude"]').value=displayCoordinate(packet.longitude);
  const when=card.querySelector('[data-ww-when]');when.disabled=false;when.querySelectorAll('input').forEach(node=>{node.disabled=false});card.querySelector('button[type="submit"]').disabled=false;
  status(slot,packet.source==='placement-inference'?'Inferred location ready. Review the date and time, then confirm.':'Location confirmed. Enter the local date and time, or use Current local time.');
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-location-selected',{detail:{slot,packet:{...packet}}}));
  window.RelphiSkyWhereWhenDraftHeptagram?.render?.(slot,0);
  return true;
}
async function reversePacket(latitude,longitude){
  const reverseUrl=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');reverseUrl.searchParams.set('latitude',String(latitude));reverseUrl.searchParams.set('longitude',String(longitude));reverseUrl.searchParams.set('localityLanguage','en');
  const zoneUrl=new URL('https://api.open-meteo.com/v1/forecast');zoneUrl.searchParams.set('latitude',String(latitude));zoneUrl.searchParams.set('longitude',String(longitude));zoneUrl.searchParams.set('timezone','auto');zoneUrl.searchParams.set('forecast_days','1');
  const[reverseResponse,zoneResponse]=await Promise.all([fetch(reverseUrl.toString(),{headers:{Accept:'application/json'}}),fetch(zoneUrl.toString(),{headers:{Accept:'application/json'}})]);
  if(!reverseResponse.ok||!zoneResponse.ok)throw new Error('Current coordinates could not be resolved.');
  const reverse=await reverseResponse.json(),zone=await zoneResponse.json(),canonical=[reverse.locality||reverse.city,reverse.principalSubdivision,reverse.countryName].map(v=>String(v||'').trim()).filter((v,i,list)=>v&&list.indexOf(v)===i).join(', ');
  return{canonical,timezone:String(zone.timezone||'UTC')};
}
function currentPosition(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('Current location is unavailable in this browser.'));navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:0})})}
async function currentLocationPacket(){
  const shared=window.RelphiSkyLocationSearch?.currentLocationPacket;
  if(typeof shared==='function'){const packet=await shared();return{...packet,source:'current-location'}}
  const position=await currentPosition(),latitude=Number(position.coords.latitude),longitude=Number(position.coords.longitude),resolved=await reversePacket(latitude,longitude);
  return{source:'current-location',query:'My current location',canonical:resolved.canonical||`${displayCoordinate(latitude)}, ${displayCoordinate(longitude)}`,latitude,longitude,timezone:resolved.timezone||'UTC'};
}
function finishCommitted(slot,detail={}){
  clearEditor(slot);
  dispatchSlotChange(slot);
  finishWhereWhen(slot,true);
  window.dispatchEvent(new CustomEvent('relphi:sky-working-copy-updated',{detail:{slot,source:detail.source||'where-when',dateTime:detail.dateTime||'',location:detail.location||''}}));
  scheduleSummary(slot,true);
  requestAnimationFrame(()=>window.RelphiSkyCardShell?.openDrawer?.(slot,'placements'));
}
async function submitCalculated(slot,form,options={}){
  const selected=cardState[slot].selected,date=form.querySelector('[data-ww-field="date"]')?.value||'',time=form.querySelector('[data-ww-field="time"]')?.value||'';
  if(!selected)return status(slot,'Choose a canonical location first.',true);
  if(!date||!time)return status(slot,'Enter both the local date and local time.',true);
  setBusy(slot,true);status(slot,'Calculating placements and Planetary Hours…');
  try{
    const nextPayload=calculateSky(slot,selected,date,time,options);
    if(!window.RelphiChironEphemeris)throw new Error('The Chiron ephemeris service is unavailable.');
    await window.RelphiChironEphemeris.completePayload(nextPayload);
    if(!window.RelphiChironEphemeris.hasChiron(nextPayload.placements))throw new Error('Chiron could not be calculated for this sky.');
    writeJson(SLOT_KEYS[slot],nextPayload);
    const committed=payload(slot),profile=committed?.calcProfile||{};
    if(String(profile.location||'')!==String(selected.canonical||''))throw new Error('The new Where and When did not persist.');
    finishCommitted(slot,{source:'where-when',dateTime:`${date}T${time}`,location:selected.canonical});
    if(options.liveOrigin==='use-now'){
      try{localStorage.setItem(`relphiSkyLiveAgeAnchor${slot}`,JSON.stringify({origin:'use-now',at:nextPayload.metadata.liveNowAt}))}catch(_){}
      window.dispatchEvent(new CustomEvent('relphi:sky-live-origin-changed',{detail:{slot,origin:'use-now',at:nextPayload.metadata.liveNowAt}}));
      window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:'Now',source:'use-now'}}));
    }
  }catch(error){setBusy(slot,false);status(slot,error.message||'The Sky could not be calculated.',true)}
}
async function submitForm(slot,form,options={}){
  const pasted=window.RelphiSkyWhereWhenPasteInference;
  if(pasted?.hasPaste?.(form)){
    const handled=await pasted.commit(form,{requestedLiveOrigin:options.liveOrigin||''});
    if(handled)return;
  }
  await submitCalculated(slot,form,options);
}
async function currentLocalTime(slot){
  const selected=cardState[slot].selected,form=formFor(slot);if(!selected||!form)return status(slot,'Choose a location first.',true);
  const now=window.luxon?.DateTime?.now(),local=now?.isValid?now.setZone(selected.timezone):null;if(!local?.isValid)return status(slot,'The current instant could not be converted to that location.',true);
  form.querySelector('[data-ww-field="date"]').value=local.toFormat('yyyy-MM-dd');form.querySelector('[data-ww-field="time"]').value=local.toFormat('HH:mm');window.RelphiSkyWhereWhenDraftHeptagram?.render?.(slot,0);
  await submitForm(slot,form,{liveOrigin:'use-now',instant:now.toUTC().toISO()});
}
async function hereAndNow(slot){
  const form=formFor(slot);if(!form)return;setBusy(slot,true);status(slot,'Using your current location and the current instant…');
  try{
    const packet=await currentLocationPacket();selectLocation(slot,packet);
    const now=window.luxon?.DateTime?.now(),local=now?.isValid?now.setZone(packet.timezone):null;if(!local?.isValid)throw new Error('The current instant could not be converted to your location.');
    form.querySelector('[data-ww-field="date"]').value=local.toFormat('yyyy-MM-dd');form.querySelector('[data-ww-field="time"]').value=local.toFormat('HH:mm');setBusy(slot,false);
    await submitForm(slot,form,{liveOrigin:'use-now',instant:now.toUTC().toISO()});
  }catch(error){setBusy(slot,false);status(slot,error?.code===1?'Location permission was denied.':error?.message||'Here and Now could not be resolved.',true)}
}

function weekdayRuler(instant,timeZone){return WEEKDAY_RULERS[window.luxon.DateTime.fromJSDate(instant).setZone(timeZone).weekday]||'sun'}
function solarNoonDate(localDate,timeZone){return window.luxon.DateTime.fromISO(`${localDate}T12:00`,{zone:timeZone}).toJSDate()}
function solarFrame(instant,latitude,longitude,timeZone){
  if(!window.SunCalc)throw new Error('Sunrise and sunset calculation is unavailable.');
  const local=window.luxon.DateTime.fromJSDate(instant).setZone(timeZone),todayDate=local.toFormat('yyyy-MM-dd'),previousDate=local.minus({days:1}).toFormat('yyyy-MM-dd'),nextDate=local.plus({days:1}).toFormat('yyyy-MM-dd'),today=SunCalc.getTimes(solarNoonDate(todayDate,timeZone),latitude,longitude),previous=SunCalc.getTimes(solarNoonDate(previousDate,timeZone),latitude,longitude),next=SunCalc.getTimes(solarNoonDate(nextDate,timeZone),latitude,longitude),valid=value=>value instanceof Date&&!Number.isNaN(value.getTime());
  if(![today.sunrise,today.sunset,previous.sunrise,previous.sunset,next.sunrise].every(valid))throw new Error('Planetary hours are unavailable for this date or latitude.');
  return instant>=today.sunrise?{start:today.sunrise,sunrise:today.sunrise,sunset:today.sunset,end:next.sunrise}:{start:previous.sunrise,sunrise:previous.sunrise,sunset:previous.sunset,end:today.sunrise};
}
function rotateHours(dayKey){const start=CHALDEAN.indexOf(dayKey);return Array.from({length:24},(_,index)=>CHALDEAN[(start+index)%7])}
function planetaryHourRows(frame,dayKey){const sequence=rotateHours(dayKey),daylight=frame.sunset-frame.sunrise,night=frame.end-frame.sunset,brightLength=daylight/12,darkLength=night/12;return Array.from({length:24},(_,index)=>{const bright=index<12,start=bright?frame.sunrise.getTime()+index*brightLength:frame.sunset.getTime()+(index-12)*darkLength;return{ruler:sequence[index],start:new Date(start),end:new Date(start+(bright?brightLength:darkLength))}})}
function heptagramPoint(key,radius){const index=CHALDEAN.indexOf(key),angle=(-90+index*(360/7))*Math.PI/180;return{x:180+Math.cos(angle)*radius,y:180+Math.sin(angle)*radius}}
function svgElement(name,attrs){const node=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function line(parent,a,b,className){parent.appendChild(svgElement('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}))}
function partialLine(parent,a,b,fraction,className){const value=Math.max(0,Math.min(1,fraction));line(parent,a,{x:a.x+(b.x-a.x)*value,y:a.y+(b.y-a.y)*value},className)}
async function drawHeptagram(svg,p){
  if(!window.RelphiSkyHeptagramGeometry?.correct||!window.RelphiSkyHeptagramCanonical?.correct)throw new Error('The final heptagram rendering pipeline is unavailable.');
  const dt=window.luxon.DateTime.fromISO(p.instant||p.dateTime,{zone:p.timeZone,setZone:true}),instant=dt.toUTC().toJSDate(),frame=solarFrame(instant,Number(p.latitude),Number(p.longitude),p.timeZone),dayKey=weekdayRuler(frame.start,p.timeZone),rows=planetaryHourRows(frame,dayKey),currentIndex=Math.max(0,rows.findIndex(row=>instant>=row.start&&instant<row.end)),current=rows[currentIndex]||rows[0],weekIndex=Math.max(0,WEEK_PATH.indexOf(dayKey)),dayFraction=Math.max(0,Math.min(1,(instant-frame.start)/(frame.end-frame.start))),hourFraction=Math.max(0,Math.min(1,(instant-current.start)/(current.end-current.start)));
  svg.replaceChildren();svg.appendChild(svgElement('circle',{cx:180,cy:180,r:118,class:'sky-ph-circle'}));svg.appendChild(svgElement('circle',{cx:180,cy:180,r:78,class:'sky-ph-guide'}));
  for(let index=0;index<7;index++){const from=heptagramPoint(WEEK_PATH[index],118),to=heptagramPoint(WEEK_PATH[index+1],118);line(svg,from,to,`sky-ph-week-segment ${index<weekIndex?'past':'future'}`);if(index===weekIndex)partialLine(svg,from,to,dayFraction,'sky-ph-week-segment current')}
  rows.forEach((row,index)=>{const from=heptagramPoint(row.ruler,78),to=heptagramPoint(rows[(index+1)%rows.length].ruler,78);line(svg,from,to,`sky-ph-hour-segment ${index<currentIndex?'past':'future'}`);if(index===currentIndex)partialLine(svg,from,to,hourFraction,'sky-ph-hour-segment current')});
  CHALDEAN.forEach(key=>{const point=heptagramPoint(key,118),group=svgElement('g',{class:`sky-ph-planet sky-ph-${key}${key===dayKey?' is-day-ruler':''}${key===current.ruler?' is-hour-ruler':''}`,style:`color:${PLANETS[key].color}`});group.append(svgElement('circle',{cx:point.x,cy:point.y,r:18,class:`sky-ph-node${key===dayKey?' day':''}${key===current.ruler?' hour':''}`}),svgElement('g',{transform:`translate(${point.x} ${point.y})`,class:'sky-ph-node-glyph'}));svg.appendChild(group)});
  window.RelphiSkyHeptagramGeometry.correct(svg);await window.RelphiSkyHeptagramCanonical.correct(svg);svg.dataset.canonicalSourceReady='true';window.dispatchEvent(new CustomEvent('relphi:sky-heptagram-source-ready',{detail:{svg}}));
}
function planetaryHoursHref(p){const params=new URLSearchParams();params.set('phShare','1');params.set('lat',String(p.latitude));params.set('lon',String(p.longitude));params.set('tz',String(p.timeZone||''));if(p.location)params.set('loc',String(p.location));let instant='';if(p.instant){const date=new Date(p.instant);if(Number.isFinite(date.getTime()))instant=date.toISOString()}if(!instant&&p.dateTime&&window.luxon?.DateTime){const dt=window.luxon.DateTime.fromISO(String(p.dateTime),{zone:String(p.timeZone||'UTC'),setZone:true});if(dt.isValid)instant=dt.toUTC().toISO()}if(instant)params.set('dt',instant);return'planetaryhours.html#'+params.toString()}
function summarySignature(p){return[p.instant||p.dateTime,p.latitude,p.longitude,p.timeZone].join('|')}
async function renderSummary(slot,force=false){
  const state=cardState[slot];if(state.rendering){state.rerender=true;return}state.rendering=true;
  try{do{state.rerender=false;const p=profileFor(slot),refs=shell(slot);if(!refs)break;if(!completeProfile(p)){refs.summary.hidden=true;state.summarySignature='';break}refs.summary.hidden=false;const frame=refs.heptagram?.closest?.('[data-sky-heptagram-frame]');if(frame){frame.href=planetaryHoursHref(p);frame.title='Open this Sky in Planetary Hours'}const signature=summarySignature(p);if(!force&&signature===state.summarySignature&&refs.heptagram.dataset.canonicalSourceReady==='true')continue;state.summarySignature=signature;refs.heptagram.setAttribute('viewBox',window.matchMedia?.('(max-width:620px)')?.matches?'0 -8 360 368':'0 0 360 360');try{await drawHeptagram(refs.heptagram,p)}catch(error){state.summarySignature='';console.error(error)}}while(state.rerender)}finally{state.rendering=false}
}
function scheduleSummary(slot,force=false){const state=cardState[slot];if(state.rendering){state.rerender=true;return}void renderSummary(slot,force)}

window.RelphiSkyWhereWhen=Object.freeze({
  form:formFor,
  selectPacket:(slot,packet)=>selectLocation(slot,packet),
  finishExternalCommit:(slot,detail)=>finishCommitted(slot,detail),
  status,
  setBusy,
  profile:profileFor
});

document.addEventListener('click',event=>{
  const actionNode=event.target.closest?.('[data-ww-action]');if(!actionNode)return;const slot=eventSlot(actionNode);if(!slot)return;const action=actionNode.dataset.wwAction;
  if(action==='cancel')closeEditor(slot);else if(action==='search-location')void searchLocation(slot);else if(action==='select-location')selectLocation(slot,actionNode);else if(action==='use-now')void currentLocalTime(slot);else if(action==='here-and-now')void hereAndNow(slot);
});
document.addEventListener('submit',event=>{const form=event.target.closest?.('.sky-where-when-editor');if(!form)return;event.preventDefault();void submitForm(form.dataset.slot,form)});
document.addEventListener('keydown',event=>{if(event.key!=='Enter')return;const input=event.target.closest?.('[data-ww-field="location-query"]');if(!input)return;event.preventDefault();const slot=eventSlot(input);if(slot)void searchLocation(slot)});
window.addEventListener('relphi:sky-drawer-preparing',event=>{const{slot,drawer}=event.detail||{};if(drawer==='where'&&SLOT_KEYS[slot])openEditor(slot,false)});
window.addEventListener('relphi:sky-drawer-opened',event=>{const{slot,drawer}=event.detail||{};if(drawer==='where'&&SLOT_KEYS[slot]&&!transactionState.editing.has(slot))openEditor(slot,false)});
window.addEventListener('relphi:sky-drawer-closed',event=>{const{slot,drawer}=event.detail||{};if(drawer==='where'&&SLOT_KEYS[slot]&&transactionState.editing.has(slot))closeEditor(slot)});
window.addEventListener('storage',event=>{if(!event.key||Object.values(SLOT_KEYS).includes(event.key)){['A','B'].forEach(slot=>{window.RelphiSkyCardShell?.sync?.(slot,payload(slot));scheduleSummary(slot)})}});
window.addEventListener('relphi:sky-foundation-ready',()=>{scheduleSummary('A');scheduleSummary('B')});
window.addEventListener('relphi:sky-name-updated',event=>{const slot=event.detail?.slot;if(SLOT_KEYS[slot]){window.RelphiSkyCardShell?.sync?.(slot,payload(slot));scheduleSummary(slot,true)}});
window.addEventListener('resize',()=>{['A','B'].forEach(slot=>{const svg=shell(slot)?.heptagram;if(svg&&svg.dataset.canonicalSourceReady==='true')svg.setAttribute('viewBox',window.matchMedia?.('(max-width:620px)')?.matches?'0 -8 360 368':'0 0 360 360')})},{passive:true});
function recoverWhereWhen(){reconcileWhereWhenTransaction();['A','B'].forEach(slot=>{window.RelphiSkyCardShell?.ensure?.(slot,payload(slot));scheduleSummary(slot,true)})}
function start(){installStyles();['A','B'].forEach(slot=>{shell(slot);scheduleSummary(slot)})}
window.addEventListener('relphi:sky-session-recovered',recoverWhereWhen);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();