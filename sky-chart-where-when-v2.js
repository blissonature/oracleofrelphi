// Native Where and When controller. The Sky-card shell owns structure; this module owns Where/When content and calculation.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenV2)return;
window.__relphiSkyWhereWhenV2=true;
window.__relphiSkyWhereWhenV1=true;

const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SHARED_HOUSE_KEY='relphiSkySharedHouseSystemV1';
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const BODIES=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const SLOW_BODIES=['Sun','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const CHALDEAN=['saturn','jupiter','mars','sun','venus','mercury','moon'];
const WEEK_PATH=['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
const WEEKDAY_RULERS={1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn',7:'sun'};
const PLANETS={
  saturn:{name:'Saturn',color:'#8c7a42'},jupiter:{name:'Jupiter',color:'#41752f'},
  mars:{name:'Mars',color:'#c9211e'},sun:{name:'Sun',color:'#d08a00'},
  venus:{name:'Venus',color:'#b23b79'},mercury:{name:'Mercury',color:'#277390'},moon:{name:'Moon',color:'#58628a'}
};
const cardState={
  A:{query:'',selected:null,inference:null,busy:false,summarySignature:'',rendering:false,rerender:false},
  B:{query:'',selected:null,inference:null,busy:false,summarySignature:'',rendering:false,rerender:false}
};

const transactionState={editing:new Set(),committed:new Set()};
function publishTransactionState(){
  const slots=[...transactionState.editing].sort();
  document.documentElement.dataset.skyWhereWhenEditing=slots.length?'true':'false';
  document.documentElement.dataset.skyWhereWhenEditingSlots=slots.join(',');
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-edit-state-changed',{detail:{active:slots.length>0,slots}}));
}
function beginWhereWhen(slot){
  if(!SLOT_KEYS[slot])return;
  transactionState.editing.add(slot);
  publishTransactionState();
}
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
    const editor=document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`);
    const mount=editor?.closest?.('[data-ww-editor-mount]');
    if(!editor?.isConnected||mount?.hidden)transactionState.editing.delete(slot);
  });
  publishTransactionState();
}
window.RelphiSkyWhereWhenTransaction=Object.freeze({
  begin:beginWhereWhen,
  commit:slot=>finishWhereWhen(slot,true),
  cancel:slot=>finishWhereWhen(slot,false),
  active:()=>transactionState.editing.size>0,
  slots:()=>[...transactionState.editing],
  reconcile:reconcileWhereWhenTransaction
});

function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
function payload(slot){return readJson(SLOT_KEYS[slot],null)}
function norm(value){return((Number(value)%360)+360)%360}
function signedLongitude(value){const n=norm(value);return n>180?n-360:n}
function angularDistance(a,b){return Math.abs(((Number(a)-Number(b)+180)%360+360)%360-180)}
function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function canonicalName(result){return[result.name,result.admin1,result.country].map(v=>String(v||'').trim()).filter((v,i,list)=>v&&list.indexOf(v)===i).join(', ')}
function displayCoordinate(value){return Number.isFinite(Number(value))?Number(value).toFixed(5):''}
function completeProfile(p){return!!(p&&p.dateTime&&p.location&&p.timeZone&&Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)))}
function profileFor(slot){const value=payload(slot);return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function panel(slot){return document.getElementById(`skyFoundation${slot}`)}
function shell(slot){return window.RelphiSkyCardShell?.ensure?.(slot,payload(slot))||null}
function eventSlot(target){return target?.closest('#skyFoundationA')?'A':target?.closest('#skyFoundationB')?'B':null}
function status(slot,message,error){const node=panel(slot)?.querySelector('.sky-where-when-status');if(!node)return;node.textContent=message||'';node.classList.toggle('is-error',!!error)}
function setBusy(slot,busy){cardState[slot].busy=!!busy;const editor=shell(slot)?.editor?.querySelector('.sky-where-when-editor');if(!editor)return;editor.querySelectorAll('button,input,select').forEach(node=>{if(node.classList.contains('sky-where-when-cancel'))return;node.disabled=!!busy})}

function placementEntries(value){const source=value&&(value.placements||value.positions||value.points||value.bodies||value);if(!source||typeof source!=='object')return[];return Object.entries(source).filter(([,item])=>item&&typeof item==='object'&&!Array.isArray(item))}
function itemLongitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const signName=String(item?.sign||item?.zodiac||'').trim().toLowerCase(),signIndex=SIGNS.findIndex(sign=>sign.toLowerCase()===signName);return signIndex<0?NaN:norm(signIndex*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600)}
function placementMap(value){const result=new Map();placementEntries(value).forEach(([key,item])=>{const name=String(item.name||item.label||item.body||item.planet||key).trim(),longitude=itemLongitude(item);if(Number.isFinite(longitude))result.set(name.toLowerCase().replace(/\s+/g,''),{name,longitude,item})});return result}
function findPlacement(map,names){for(const name of names){const normalized=String(name).toLowerCase().replace(/\s+/g,'');if(map.has(normalized))return map.get(normalized)}return null}

function currentSelection(slot,p){
  if(!completeProfile(p))return null;
  return{query:p.locationQuery||p.location,canonical:p.location,latitude:Number(p.latitude),longitude:Number(p.longitude),timezone:p.timeZone};
}
function editorMarkup(slot,p){
  const selected=currentSelection(slot,p);
  cardState[slot].selected=selected;
  cardState[slot].query=selected?.query||'';
  const dateTime=String(p.dateTime||''),date=dateTime.slice(0,10),time=dateTime.slice(11,16),disabled=selected?'':' disabled';
  const confirmation=selected?`<div class="sky-location-confirmation"><p><strong>You searched:</strong> ${escapeHtml(selected.query||selected.canonical)}</p><p><strong>Location found:</strong> ${escapeHtml(selected.canonical)}</p></div>`:'<div class="sky-location-confirmation" hidden></div>';
  return `<form class="sky-where-when-editor" data-slot="${slot}">
    <fieldset class="sky-where-when-section"><legend>Where</legend><div class="sky-where-search-row"><label class="sky-where-when-label">Search for a location<input class="sky-where-when-input" data-ww-field="location-query" type="search" autocomplete="off" value="${escapeHtml(cardState[slot].query)}" placeholder="Ex. City, State or Country"></label><button class="sky-where-when-button secondary" type="button" data-ww-action="search-location">Search</button></div><div class="sky-where-when-inline-actions sky-where-current-location-actions"><button class="sky-where-when-button secondary" type="button" data-ww-action="use-current-location">Use current location</button></div><div class="sky-location-results" aria-live="polite"></div>${confirmation}</fieldset>
    <fieldset class="sky-where-when-section" data-ww-when${disabled}><legend>When</legend><div class="sky-where-when-now-row"><button class="sky-where-when-button secondary sky-use-now-button" type="button" data-ww-action="use-now">Use Now</button><span>Use the current instant at this location.</span></div><div class="sky-where-when-grid"><label class="sky-where-when-label">Date<input class="sky-where-when-input" data-ww-field="date" type="date" value="${escapeHtml(date)}"${disabled}></label><label class="sky-where-when-label">Local time<input class="sky-where-when-input" data-ww-field="time" type="time" value="${escapeHtml(time)}"${disabled}></label></div></fieldset>
    <details class="sky-where-when-advanced"><summary>Advanced settings</summary><div class="sky-where-when-advanced-body"><label class="sky-where-when-label">Time zone<input class="sky-where-when-input" data-ww-field="timezone" type="text" readonly value="${escapeHtml(selected?.timezone||p.timeZone||'')}"></label><div class="sky-where-when-coordinate-grid"><label class="sky-where-when-label">Latitude<input class="sky-where-when-input" data-ww-field="latitude" type="number" step="0.00001" min="-90" max="90" value="${escapeHtml(displayCoordinate(selected?.latitude??p.latitude))}"></label><label class="sky-where-when-label">Longitude<input class="sky-where-when-input" data-ww-field="longitude" type="number" step="0.00001" min="-180" max="180" value="${escapeHtml(displayCoordinate(selected?.longitude??p.longitude))}"></label></div><div class="sky-where-when-inline-actions"><button class="sky-where-when-button secondary" type="button" data-ww-action="resolve-coordinates">Resolve Coordinates</button><button class="sky-where-when-button secondary" type="button" data-ww-action="infer">Infer Place and Time from Placements</button></div><div class="sky-inference-card" hidden></div></div></details>
    <div class="sky-where-when-heptagram-slot" data-ww-heptagram-slot="${slot}" hidden></div>
    <p class="sky-where-when-status" data-update-now-status aria-live="polite"></p>
    <div class="sky-where-when-footer"><button class="sky-where-when-button secondary sky-update-now-editor" type="button" data-final-now="${slot}">Update to Now</button><button class="sky-where-when-button secondary sky-where-when-cancel" type="button" data-ww-action="cancel">Cancel</button><button class="sky-where-when-button primary" type="submit"${disabled}>Use This Where and When</button></div>
  </form>`;
}
function moveHeptagramIntoEditor(slot){
  const refs=shell(slot),mount=refs?.editor?.querySelector('[data-ww-heptagram-slot]'),frame=refs?.root?.querySelector(`[data-sky-heptagram-frame="${slot}"]`);
  if(!mount)return;
  if(!completeProfile(profileFor(slot))||!frame){mount.hidden=true;return}
  mount.hidden=false;mount.replaceChildren(frame);
}
function restoreHeptagram(slot){
  const refs=shell(slot),frame=refs?.root?.querySelector(`[data-sky-heptagram-frame="${slot}"]`);
  if(refs?.summary&&frame&&!refs.summary.contains(frame))refs.summary.prepend(frame);
}
function openEditor(slot,focus=true){const refs=shell(slot);if(!refs)return;beginWhereWhen(slot);refs.editor.innerHTML=editorMarkup(slot,profileFor(slot));moveHeptagramIntoEditor(slot);window.RelphiSkyCardShell.setEditorExpanded(slot,true);if(focus)requestAnimationFrame(()=>refs.editor.querySelector('[data-ww-field="location-query"]')?.focus())}
function clearEditor(slot){const refs=shell(slot);if(!refs)return;restoreHeptagram(slot);window.RelphiSkyCardShell.setEditorExpanded(slot,false);refs.editor.replaceChildren();cardState[slot].inference=null;cardState[slot].busy=false}
function closeEditor(slot){clearEditor(slot);finishWhereWhen(slot,false)}

function localDateTimeToInstant(date,time,timeZone){if(!window.luxon?.DateTime)throw new Error('Time-zone conversion is unavailable.');const dt=window.luxon.DateTime.fromISO(`${date}T${time}`,{zone:timeZone,setZone:true});if(!dt.isValid)throw new Error(dt.invalidExplanation||'That local date and time is not valid in the selected time zone.');return dt}
function astronomyLongitude(bodyName,date){const A=window.Astronomy;if(!A)throw new Error('Astronomy Engine is unavailable.');if(bodyName==='Moon'&&typeof A.EclipticGeoMoon==='function')return norm(A.EclipticGeoMoon(date).lon);return norm(A.Ecliptic(A.GeoVector(bodyName,date,true)).elon)}
function siderealDegrees(date,longitude){return norm(window.Astronomy.SiderealTime(date)*15+Number(longitude||0))}
function obliquity(date){return Number(window.Astronomy.e_tilt(date).tobl)}
function ascendantLongitude(date,latitude,longitude){const theta=siderealDegrees(date,longitude)*Math.PI/180,phi=Number(latitude)*Math.PI/180,epsilon=obliquity(date)*Math.PI/180;return norm(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(epsilon)+Math.tan(phi)*Math.sin(epsilon))*180/Math.PI+180)}
function midheavenLongitude(date,longitude){const theta=siderealDegrees(date,longitude)*Math.PI/180,epsilon=obliquity(date)*Math.PI/180;return norm(Math.atan2(Math.sin(theta),Math.cos(theta)*Math.cos(epsilon))*180/Math.PI)}
function placementObject(name,longitude){const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);return{name,longitude:value,sign:SIGNS[signIndex],degree,minute,second}}
function calculateSky(slot,selected,date,time,options={}){
  const supplied=String(options.instant||'').trim(),dt=supplied?window.luxon?.DateTime?.fromISO(supplied,{setZone:true})?.setZone(selected.timezone):localDateTimeToInstant(date,time,selected.timezone);
  if(!dt?.isValid)throw new Error('The current instant could not be converted to the selected location.');
  const instant=dt.toUTC().toJSDate(),placements={};
  BODIES.forEach(name=>{placements[name]=placementObject(name,astronomyLongitude(name,instant))});
  const asc=ascendantLongitude(instant,selected.latitude,selected.longitude),mc=midheavenLongitude(instant,selected.longitude);
  placements.Ascendant=placementObject('Ascendant',asc);placements.Midheaven=placementObject('Midheaven',mc);
  const houseSystem=localStorage.getItem(SHARED_HOUSE_KEY)||profileFor(slot).houseSystem||'whole-sign';
  const houses=window.RelphiHouseSystems.calculateCusps({system:houseSystem,ascendant:asc,midheaven:mc,siderealDegrees:siderealDegrees(instant,selected.longitude),obliquityDegrees:obliquity(instant),latitude:selected.latitude});
  const existing=payload(slot)||{};
  const metadata=existing.metadata&&typeof existing.metadata==='object'?{...existing.metadata}:{};
  const priorProfile=existing.calcProfile&&typeof existing.calcProfile==='object'?{...existing.calcProfile}:{};
  const liveOrigin=String(options.liveOrigin||'');
  if(liveOrigin==='use-now'){
    delete metadata.savedSkyId;delete metadata.savedSkyName;delete metadata.savedSkyLoadedAt;
    delete metadata.liveNowDisabled;delete metadata.liveNowDisabledReason;delete metadata.liveNowMigrated;
    metadata.name='Now';metadata.title='Now';
    metadata.liveNowOrigin='use-now';metadata.liveNowAt=dt.toUTC().toISO();metadata.liveAgeAnchorAt=metadata.liveNowAt;
    metadata.liveNowLatitude=String(selected.latitude);metadata.liveNowLongitude=String(selected.longitude);
    return{...existing,name:'Now',title:'Now',displayName:'Now',skyName:'Now',saved:false,placements,houseCusps:houses.cusps,metadata,calcProfile:{...priorProfile,name:'Now',title:'Now',dateTime:dt.toFormat("yyyy-MM-dd'T'HH:mm"),instant:metadata.liveNowAt,latitude:String(selected.latitude),longitude:String(selected.longitude),location:selected.canonical,locationQuery:selected.query||selected.canonical,timeZone:selected.timezone,houseSystem:houses.system||houseSystem,houseCusps:houses.cusps,cusps:houses.cusps,houseSystemNote:houses.note,source:'where-when-v2',liveNowOrigin:'use-now',liveNowAt:metadata.liveNowAt},savedAt:new Date().toISOString()};
  }
  delete metadata.liveNowOrigin;delete metadata.liveNowAt;delete metadata.liveAgeAnchorAt;delete metadata.liveNowLatitude;delete metadata.liveNowLongitude;delete metadata.liveNowMigrated;
  // Changing Where and When edits the active working sky. A Saved Skies record is
  // immutable until the user explicitly chooses to update it from the sky-name dropdown.
  delete metadata.savedSkyId;delete metadata.savedSkyName;delete metadata.savedSkyLoadedAt;
  metadata.liveNowDisabled=true;metadata.liveNowDisabledReason='custom-where-when';
  delete priorProfile.liveNowOrigin;delete priorProfile.liveNowAt;
  return{...existing,name:existing.name||`Sky ${slot}`,saved:false,placements,houseCusps:houses.cusps,metadata,calcProfile:{...priorProfile,dateTime:`${date}T${time}`,instant:dt.toUTC().toISO(),latitude:String(selected.latitude),longitude:String(selected.longitude),location:selected.canonical,locationQuery:selected.query||selected.canonical,timeZone:selected.timezone,houseSystem:houses.system||houseSystem,houseCusps:houses.cusps,cusps:houses.cusps,houseSystemNote:houses.note,source:'where-when-v2'},savedAt:new Date().toISOString()};
}
function dispatchSlotChange(slot){try{window.dispatchEvent(new StorageEvent('storage',{key:SLOT_KEYS[slot],newValue:localStorage.getItem(SLOT_KEYS[slot]),storageArea:localStorage}))}catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:SLOT_KEYS[slot]});window.dispatchEvent(event)}}

async function searchLocation(slot){
  const card=panel(slot),input=card?.querySelector('[data-ww-field="location-query"]'),resultsNode=card?.querySelector('.sky-location-results'),query=input?.value.trim()||'';cardState[slot].query=query;
  if(!query){status(slot,'Type a location first.',true);input?.focus();return}
  status(slot,`Searching for ${query}…`);resultsNode?.replaceChildren();
  try{const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.searchParams.set('name',query);url.searchParams.set('count','7');url.searchParams.set('language','en');url.searchParams.set('format','json');const response=await fetch(url.toString(),{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Location search returned ${response.status}.`);const data=await response.json(),results=Array.isArray(data.results)?data.results:[];if(!results.length){status(slot,'No matching location was found. Try a city plus state, region, or country.',true);return}const fragment=document.createDocumentFragment();results.forEach((result,index)=>{const canonical=canonicalName(result),button=document.createElement('button');button.type='button';button.className='sky-location-result';button.dataset.wwAction='select-location';button.dataset.locationIndex=String(index);button.innerHTML=`<strong>${escapeHtml(canonical)}</strong><span>${displayCoordinate(result.latitude)}, ${displayCoordinate(result.longitude)} · ${escapeHtml(result.timezone||'Time zone unavailable')}</span>`;button.__locationPacket={query,canonical,latitude:Number(result.latitude),longitude:Number(result.longitude),timezone:String(result.timezone||'')};fragment.appendChild(button)});resultsNode.appendChild(fragment);status(slot,'Choose the canonical location that matches what you meant.')}catch(error){status(slot,error.message||'Location search failed.',true)}
}
function selectLocation(slot,button){const packet=button?.__locationPacket;if(!packet||!Number.isFinite(packet.latitude)||!Number.isFinite(packet.longitude)||!packet.timezone){status(slot,'That result did not include a complete coordinate and time-zone packet.',true);return}cardState[slot].selected=packet;cardState[slot].query=packet.query||packet.canonical;const card=panel(slot),queryInput=card?.querySelector('[data-ww-field="location-query"]');if(queryInput)queryInput.value=cardState[slot].query;card.querySelector('.sky-location-results')?.replaceChildren();const confirmation=card.querySelector('.sky-location-confirmation');confirmation.hidden=false;confirmation.innerHTML=`<p><strong>You searched:</strong> ${escapeHtml(packet.query)}</p><p><strong>Location found:</strong> ${escapeHtml(packet.canonical)}</p>`;card.querySelector('[data-ww-field="timezone"]').value=packet.timezone;card.querySelector('[data-ww-field="latitude"]').value=displayCoordinate(packet.latitude);card.querySelector('[data-ww-field="longitude"]').value=displayCoordinate(packet.longitude);const when=card.querySelector('[data-ww-when]');when.disabled=false;when.querySelectorAll('input').forEach(node=>{node.disabled=false});card.querySelector('button[type="submit"]').disabled=false;status(slot,'Location confirmed. Enter the local date and time, or use Now.')}
function currentPosition(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('Current location is unavailable in this browser.'));navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:0})})}
async function currentLocationPacket(){
  const shared=window.RelphiSkyLocationSearch?.currentLocationPacket;
  if(typeof shared==='function')return shared();
  const position=await currentPosition(),latitude=Number(position.coords.latitude),longitude=Number(position.coords.longitude),resolved=await reversePacket(latitude,longitude);
  return{query:'My current location',canonical:resolved.canonical||`${displayCoordinate(latitude)}, ${displayCoordinate(longitude)}`,latitude,longitude,timezone:resolved.timezone||'UTC'};
}
async function useCurrentLocation(slot){
  setBusy(slot,true);status(slot,'Using your current location…');
  try{const packet=await currentLocationPacket();selectLocation(slot,{__locationPacket:packet});status(slot,'Current location selected. Choose the local date and time, or use Now.')}catch(error){status(slot,error?.code===1?'Location permission was denied.':error?.message||'Current location could not be resolved.',true)}finally{setBusy(slot,false)}
}
async function useNow(slot){
  const selected=cardState[slot].selected,form=shell(slot)?.editor?.querySelector('.sky-where-when-editor');
  if(!selected||!form)return status(slot,'Choose a location first.',true);
  const now=window.luxon?.DateTime?.now();
  const local=now?.isValid?now.setZone(selected.timezone):null;
  if(!local?.isValid)return status(slot,'The current instant could not be converted to that location.',true);
  const date=local.toFormat('yyyy-MM-dd'),time=local.toFormat('HH:mm');
  const dateInput=form.querySelector('[data-ww-field="date"]'),timeInput=form.querySelector('[data-ww-field="time"]');
  if(dateInput)dateInput.value=date;if(timeInput)timeInput.value=time;
  status(slot,`Using now in ${selected.canonical}: ${date} ${time}.`);
  await submit(slot,form,{liveOrigin:'use-now',instant:now.toUTC().toISO()});
}
async function resolveCoordinates(slot){
  const card=panel(slot),latitude=Number(card?.querySelector('[data-ww-field="latitude"]')?.value),longitude=Number(card?.querySelector('[data-ww-field="longitude"]')?.value);if(!Number.isFinite(latitude)||latitude<-90||latitude>90||!Number.isFinite(longitude)||longitude<-180||longitude>180){status(slot,'Enter valid latitude and longitude values.',true);return}status(slot,'Resolving the canonical place and time zone…');
  try{const reverseUrl=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');reverseUrl.searchParams.set('latitude',String(latitude));reverseUrl.searchParams.set('longitude',String(longitude));reverseUrl.searchParams.set('localityLanguage','en');const zoneUrl=new URL('https://api.open-meteo.com/v1/forecast');zoneUrl.searchParams.set('latitude',String(latitude));zoneUrl.searchParams.set('longitude',String(longitude));zoneUrl.searchParams.set('timezone','auto');zoneUrl.searchParams.set('forecast_days','1');const[reverseResponse,zoneResponse]=await Promise.all([fetch(reverseUrl.toString(),{headers:{Accept:'application/json'}}),fetch(zoneUrl.toString(),{headers:{Accept:'application/json'}})]);if(!reverseResponse.ok||!zoneResponse.ok)throw new Error('Coordinate resolution did not return a complete result.');const reverse=await reverseResponse.json(),zone=await zoneResponse.json(),canonical=[reverse.locality||reverse.city,reverse.principalSubdivision,reverse.countryName].map(v=>String(v||'').trim()).filter((v,i,list)=>v&&list.indexOf(v)===i).join(', '),timezone=String(zone.timezone||'');if(!canonical||!timezone)throw new Error('Coordinates resolved without a canonical place name or IANA time zone.');cardState[slot].selected={query:`${displayCoordinate(latitude)}, ${displayCoordinate(longitude)}`,canonical,latitude,longitude,timezone};cardState[slot].query=cardState[slot].selected.query;card.querySelector('[data-ww-field="location-query"]').value=cardState[slot].query;selectLocation(slot,{__locationPacket:cardState[slot].selected});status(slot,'Coordinates resolved. Confirm the location, then enter the local date and time.')}catch(error){status(slot,error.message||'Coordinates could not be resolved.',true)}
}

function weekdayRuler(instant,timeZone){const weekday=window.luxon.DateTime.fromJSDate(instant).setZone(timeZone).weekday;return WEEKDAY_RULERS[weekday]||'sun'}
function solarNoonDate(localDate,timeZone){return window.luxon.DateTime.fromISO(`${localDate}T12:00`,{zone:timeZone}).toJSDate()}
function solarFrame(instant,latitude,longitude,timeZone){if(!window.SunCalc)throw new Error('Sunrise and sunset calculation is unavailable.');const local=window.luxon.DateTime.fromJSDate(instant).setZone(timeZone),todayDate=local.toFormat('yyyy-MM-dd'),previousDate=local.minus({days:1}).toFormat('yyyy-MM-dd'),nextDate=local.plus({days:1}).toFormat('yyyy-MM-dd'),today=SunCalc.getTimes(solarNoonDate(todayDate,timeZone),latitude,longitude),previous=SunCalc.getTimes(solarNoonDate(previousDate,timeZone),latitude,longitude),next=SunCalc.getTimes(solarNoonDate(nextDate,timeZone),latitude,longitude),valid=value=>value instanceof Date&&!Number.isNaN(value.getTime());if(![today.sunrise,today.sunset,previous.sunrise,previous.sunset,next.sunrise].every(valid))throw new Error('Planetary hours are unavailable for this date or latitude because a complete sunrise-to-sunrise frame could not be calculated.');return instant>=today.sunrise?{start:today.sunrise,sunrise:today.sunrise,sunset:today.sunset,end:next.sunrise}:{start:previous.sunrise,sunrise:previous.sunrise,sunset:previous.sunset,end:today.sunrise}}
function rotateHours(dayKey){const start=CHALDEAN.indexOf(dayKey);return Array.from({length:24},(_,index)=>CHALDEAN[(start+index)%7])}
function planetaryHourRows(frame,dayKey){const sequence=rotateHours(dayKey),daylight=frame.sunset.getTime()-frame.sunrise.getTime(),night=frame.end.getTime()-frame.sunset.getTime(),brightLength=daylight/12,darkLength=night/12;return Array.from({length:24},(_,index)=>{const bright=index<12,start=bright?frame.sunrise.getTime()+index*brightLength:frame.sunset.getTime()+(index-12)*darkLength,end=start+(bright?brightLength:darkLength);return{index,ruler:sequence[index],start:new Date(start),end:new Date(end),bright}})}
function heptagramPoint(key,radius){const index=CHALDEAN.indexOf(key),angle=(-90+index*(360/7))*Math.PI/180;return{x:180+Math.cos(angle)*radius,y:180+Math.sin(angle)*radius}}
function svgElement(name,attrs){const node=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function line(parent,a,b,className){parent.appendChild(svgElement('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}))}
function partialLine(parent,a,b,fraction,className){const value=Math.max(0,Math.min(1,fraction));line(parent,a,{x:a.x+(b.x-a.x)*value,y:a.y+(b.y-a.y)*value},className)}
async function drawHeptagram(svg,p){
  if(!window.RelphiSkyHeptagramGeometry?.correct||!window.RelphiSkyHeptagramCanonical?.correct)throw new Error('The final heptagram rendering pipeline is unavailable.');
  svg.dataset.canonicalSourceReady='pending';delete svg.dataset.canonicalHeptagramReady;delete svg.dataset.canonicalHeptagramConsumer;delete svg.dataset.heptagramGeometryV6;delete svg.dataset.heptagramGeometryV7;delete svg.dataset.glyphPresentation;
  const dt=window.luxon.DateTime.fromISO(p.instant||p.dateTime,{zone:p.timeZone,setZone:true}),instant=dt.toUTC().toJSDate(),frame=solarFrame(instant,Number(p.latitude),Number(p.longitude),p.timeZone),dayKey=weekdayRuler(frame.start,p.timeZone),rows=planetaryHourRows(frame,dayKey),currentIndex=Math.max(0,rows.findIndex(row=>instant>=row.start&&instant<row.end)),current=rows[currentIndex]||rows[0],weekIndex=Math.max(0,WEEK_PATH.indexOf(dayKey)),dayFraction=Math.max(0,Math.min(1,(instant.getTime()-frame.start.getTime())/(frame.end.getTime()-frame.start.getTime()))),hourFraction=Math.max(0,Math.min(1,(instant.getTime()-current.start.getTime())/(current.end.getTime()-current.start.getTime())));
  svg.replaceChildren();svg.appendChild(svgElement('circle',{cx:180,cy:180,r:118,class:'sky-ph-circle'}));svg.appendChild(svgElement('circle',{cx:180,cy:180,r:78,class:'sky-ph-guide'}));
  for(let index=0;index<7;index+=1){const from=heptagramPoint(WEEK_PATH[index],118),to=heptagramPoint(WEEK_PATH[index+1],118);line(svg,from,to,`sky-ph-week-segment ${index<weekIndex?'past':'future'}`);if(index===weekIndex)partialLine(svg,from,to,dayFraction,'sky-ph-week-segment current')}
  const hourPoints=rows.map((row,index)=>({row,base:heptagramPoint(row.ruler,78),next:heptagramPoint(rows[(index+1)%rows.length].ruler,78)}));hourPoints.forEach((entry,index)=>{line(svg,entry.base,entry.next,`sky-ph-hour-segment ${index<currentIndex?'past':'future'}`);if(index===currentIndex)partialLine(svg,entry.base,entry.next,hourFraction,'sky-ph-hour-segment current')});
  CHALDEAN.forEach(key=>{const point=heptagramPoint(key,118),group=svgElement('g',{class:`sky-ph-planet sky-ph-${key}${key===dayKey?' is-day-ruler':''}${key===current.ruler?' is-hour-ruler':''}`,style:`color:${PLANETS[key].color}`}),circle=svgElement('circle',{cx:point.x,cy:point.y,r:18,class:`sky-ph-node${key===dayKey?' day':''}${key===current.ruler?' hour':''}`}),glyph=svgElement('g',{transform:`translate(${point.x} ${point.y})`,class:'sky-ph-node-glyph'});group.append(circle,glyph);svg.appendChild(group)});
  window.RelphiSkyHeptagramGeometry.correct(svg);
  await window.RelphiSkyHeptagramCanonical.correct(svg);
  svg.dataset.canonicalSourceReady='true';
  window.dispatchEvent(new CustomEvent('relphi:sky-heptagram-source-ready',{detail:{svg}}));
  return{dayKey,hourKey:current.ruler,hourNumber:currentIndex+1,start:current.start,end:current.end};
}
function planetaryHoursHref(p){
  const params=new URLSearchParams();params.set('phShare','1');params.set('lat',String(p.latitude));params.set('lon',String(p.longitude));params.set('tz',String(p.timeZone||''));if(p.location)params.set('loc',String(p.location));
  let instant='';
  if(p.instant){const date=new Date(p.instant);if(Number.isFinite(date.getTime()))instant=date.toISOString()}
  if(!instant&&p.dateTime&&window.luxon?.DateTime){const dt=window.luxon.DateTime.fromISO(String(p.dateTime),{zone:String(p.timeZone||'UTC'),setZone:true});if(dt.isValid)instant=dt.toUTC().toISO()}
  if(instant)params.set('dt',instant);
  return 'planetaryhours.html#'+params.toString();
}
function summarySignature(p){return[p.instant||p.dateTime,p.latitude,p.longitude,p.timeZone].join('|')}
async function renderSummary(slot,force=false){
  const state=cardState[slot];if(state.rendering){state.rerender=true;return}state.rendering=true;
  try{do{state.rerender=false;const p=profileFor(slot),refs=shell(slot);if(!refs)break;if(!completeProfile(p)){refs.summary.hidden=true;state.summarySignature='';break}refs.summary.hidden=false;const frame=refs.heptagram?.closest?.('[data-sky-heptagram-frame]');if(frame){frame.href=planetaryHoursHref(p);frame.title='Open this Sky in Planetary Hours'}const signature=summarySignature(p);if(!force&&signature===state.summarySignature&&refs.heptagram.dataset.canonicalSourceReady==='true'&&refs.heptagram.dataset.canonicalHeptagramReady==='true')continue;state.summarySignature=signature;refs.heptagram.setAttribute('viewBox',window.matchMedia?.('(max-width:620px)')?.matches?'0 -8 360 368':'0 0 360 360');try{await drawHeptagram(refs.heptagram,p)}catch(error){state.summarySignature='';refs.heptagram.dataset.canonicalSourceReady='error';console.error(error)}}while(state.rerender)}finally{state.rendering=false}
}
function scheduleSummary(slot,force=false){const state=cardState[slot];if(state.rendering){state.rerender=true;return}void renderSummary(slot,force)}

function inferenceCard(slot,result){const node=panel(slot)?.querySelector('.sky-inference-card');if(!node)return;cardState[slot].inference=result;node.hidden=false;node.innerHTML=`<p><strong>Estimated where:</strong> ${escapeHtml(result.canonical||`${displayCoordinate(result.latitude)}, ${displayCoordinate(result.longitude)}`)}</p><p><strong>Estimated when:</strong> ${escapeHtml(result.dateTime||'Unavailable')}</p><p><strong>Time zone:</strong> ${escapeHtml(result.timezone||'UTC')}</p><p><strong>Confidence:</strong> ${escapeHtml(result.confidence)}</p><button class="sky-where-when-button secondary" type="button" data-ww-action="apply-inference">Apply inference</button>`}
function extractRecoveredInference(slot){const value=payload(slot),p=profileFor(slot);if(completeProfile(p))return{query:p.locationQuery||p.location,canonical:p.location,latitude:Number(p.latitude),longitude:Number(p.longitude),timezone:p.timeZone,dateTime:p.dateTime,confidence:'High — recovered from the saved Sky record.'};const notes=String(value?.notes||''),instantMatch=notes.match(/Motion state sampled around\s+(\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?Z)/i),coordinates=notes.match(/latitude\s+(-?\d+(?:\.\d+)?)\s+and longitude\s+(-?\d+(?:\.\d+)?)/i),timezone=notes.match(/Time zone:\s*([^\.]+)\./i)?.[1]?.trim()||'',location=notes.match(/Location:\s*(.+?)\.\s*Time zone:/i)?.[1]?.trim()||'';if(instantMatch&&coordinates){const instant=new Date(instantMatch[1]),zone=timezone||'UTC',dt=window.luxon.DateTime.fromJSDate(instant).setZone(zone);return{query:location||'Recovered coordinates',canonical:location||`${coordinates[1]}, ${coordinates[2]}`,latitude:Number(coordinates[1]),longitude:Number(coordinates[2]),timezone:zone,dateTime:dt.toFormat("yyyy-MM-dd'T'HH:mm"),confidence:'Medium — recovered from calculation notes.'}}return null}
async function inferDateFromPlacements(slot){const value=payload(slot),map=placementMap(value),sun=findPlacement(map,['Sun']),usable=SLOW_BODIES.map(name=>findPlacement(map,[name])).filter(Boolean);if(!sun||usable.length<3)throw new Error('Inference needs the Sun and at least two slower planetary placements.');const yearNow=new Date().getUTCFullYear(),startYear=Math.max(1900,yearNow-120),endYear=Math.min(2100,yearNow+20);let best=null;for(let year=startYear;year<=endYear;year+=1){const marchEquinox=Date.UTC(year,2,20,12,0,0),estimate=marchEquinox+(sun.longitude/.98564736)*86400000;for(let offset=-4;offset<=4;offset+=.5){const date=new Date(estimate+offset*86400000);let score=0;usable.forEach(record=>{const predicted=astronomyLongitude(record.name,date),weight=record.name==='Sun'?4:1;score+=Math.pow(angularDistance(predicted,record.longitude)*weight,2)});if(!best||score<best.score)best={date,score}}if((year-startYear)%12===0)await new Promise(resolve=>requestAnimationFrame(resolve))}const allTargets=BODIES.map(name=>findPlacement(map,[name])).filter(Boolean);let refined=best;for(let hours=-48;hours<=48;hours+=1){const date=new Date(best.date.getTime()+hours*3600000);let score=0;allTargets.forEach(record=>{const predicted=astronomyLongitude(record.name,date),weight=record.name==='Moon'?2.5:record.name==='Sun'?2:1;score+=Math.pow(angularDistance(predicted,record.longitude)*weight,2)});if(!refined||score<refined.score)refined={date,score}}const asc=findPlacement(map,['Ascendant','ASC','Rising']),mc=findPlacement(map,['Midheaven','MC']);let latitude=0,longitude=0;if(mc){const epsilon=obliquity(refined.date);let bestLst={value:0,error:Infinity};for(let lst=0;lst<360;lst+=.25){const theta=lst*Math.PI/180,eps=epsilon*Math.PI/180,candidate=norm(Math.atan2(Math.sin(theta),Math.cos(theta)*Math.cos(eps))*180/Math.PI),error=angularDistance(candidate,mc.longitude);if(error<bestLst.error)bestLst={value:lst,error}}longitude=signedLongitude(bestLst.value-window.Astronomy.SiderealTime(refined.date)*15);if(asc){let bestLatitude={value:0,error:Infinity};for(let lat=-66;lat<=66;lat+=.5){const theta=bestLst.value*Math.PI/180,phi=lat*Math.PI/180,eps=epsilon*Math.PI/180,candidate=norm(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps))*180/Math.PI+180),error=angularDistance(candidate,asc.longitude);if(error<bestLatitude.error)bestLatitude={value:lat,error}}latitude=bestLatitude.value}}const rms=Math.sqrt(refined.score/Math.max(1,allTargets.length));return{date:refined.date,latitude,longitude,confidence:rms<4?'Medium — close planetary fit; place remains an estimate.':'Low — broad planetary fit only; review before applying.'}}
async function reversePacket(latitude,longitude){const reverseUrl=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');reverseUrl.searchParams.set('latitude',String(latitude));reverseUrl.searchParams.set('longitude',String(longitude));reverseUrl.searchParams.set('localityLanguage','en');const zoneUrl=new URL('https://api.open-meteo.com/v1/forecast');zoneUrl.searchParams.set('latitude',String(latitude));zoneUrl.searchParams.set('longitude',String(longitude));zoneUrl.searchParams.set('timezone','auto');zoneUrl.searchParams.set('forecast_days','1');const[reverseResponse,zoneResponse]=await Promise.all([fetch(reverseUrl.toString(),{headers:{Accept:'application/json'}}),fetch(zoneUrl.toString(),{headers:{Accept:'application/json'}})]);if(!reverseResponse.ok||!zoneResponse.ok)throw new Error('The estimated coordinates could not be matched to a canonical place.');const reverse=await reverseResponse.json(),zone=await zoneResponse.json(),canonical=[reverse.locality||reverse.city,reverse.principalSubdivision,reverse.countryName].map(v=>String(v||'').trim()).filter((v,i,list)=>v&&list.indexOf(v)===i).join(', ');return{canonical,timezone:String(zone.timezone||'UTC')}}
async function infer(slot){const recovered=extractRecoveredInference(slot);if(recovered){inferenceCard(slot,recovered);status(slot,'Recovered a Where and When estimate. Review it before applying.');return}setBusy(slot,true);status(slot,'Estimating date, time, and place from planetary placements…');try{const estimate=await inferDateFromPlacements(slot);let packet={canonical:'',timezone:'UTC'};try{packet=await reversePacket(estimate.latitude,estimate.longitude)}catch(_){}const dt=window.luxon.DateTime.fromJSDate(estimate.date).setZone(packet.timezone||'UTC');inferenceCard(slot,{query:'Placement inference',canonical:packet.canonical||`${displayCoordinate(estimate.latitude)}, ${displayCoordinate(estimate.longitude)}`,latitude:estimate.latitude,longitude:estimate.longitude,timezone:packet.timezone||'UTC',dateTime:dt.toFormat("yyyy-MM-dd'T'HH:mm"),confidence:estimate.confidence});status(slot,'Inference complete. Nothing changes until you choose Apply inference.')}catch(error){status(slot,error.message||'The placements did not contain enough information for an estimate.',true)}finally{setBusy(slot,false)}}
function applyInference(slot){const result=cardState[slot].inference;if(!result)return;cardState[slot].selected={query:result.query||'Placement inference',canonical:result.canonical,latitude:Number(result.latitude),longitude:Number(result.longitude),timezone:result.timezone||'UTC'};cardState[slot].query=cardState[slot].selected.query;const card=panel(slot);card.querySelector('[data-ww-field="location-query"]').value=cardState[slot].query;card.querySelector('[data-ww-field="timezone"]').value=result.timezone||'UTC';card.querySelector('[data-ww-field="latitude"]').value=displayCoordinate(result.latitude);card.querySelector('[data-ww-field="longitude"]').value=displayCoordinate(result.longitude);const[date,time]=String(result.dateTime||'').split('T');card.querySelector('[data-ww-field="date"]').value=date||'';card.querySelector('[data-ww-field="time"]').value=(time||'').slice(0,5);const when=card.querySelector('[data-ww-when]');when.disabled=false;when.querySelectorAll('input').forEach(node=>{node.disabled=false});card.querySelector('button[type="submit"]').disabled=false;const confirmation=card.querySelector('.sky-location-confirmation');confirmation.hidden=false;confirmation.innerHTML=`<p><strong>You searched:</strong> ${escapeHtml(cardState[slot].selected.query)}</p><p><strong>Location found:</strong> ${escapeHtml(cardState[slot].selected.canonical)}</p>`;status(slot,'Inference applied to the form. Review it, then confirm.')}
async function submit(slot,form,options={}){const selected=cardState[slot].selected,date=form.querySelector('[data-ww-field="date"]')?.value||'',time=form.querySelector('[data-ww-field="time"]')?.value||'';if(!selected)return status(slot,'Choose a canonical location first.',true);if(!date||!time)return status(slot,'Enter both the local date and local time.',true);setBusy(slot,true);status(slot,'Calculating placements and Planetary Hours…');try{const nextPayload=calculateSky(slot,selected,date,time,options);status(slot,'Calculating Chiron…');if(!window.RelphiChironEphemeris)throw new Error('The Chiron ephemeris service is unavailable.');await window.RelphiChironEphemeris.completePayload(nextPayload);if(!window.RelphiChironEphemeris.hasChiron(nextPayload.placements))throw new Error('Chiron could not be calculated for this sky.');writeJson(SLOT_KEYS[slot],nextPayload);const committed=payload(slot),profile=committed?.calcProfile||{};if(String(profile.dateTime||'')!==`${date}T${time}`||String(profile.location||'')!==String(selected.canonical||''))throw new Error('The new Where and When did not persist.');if(options.liveOrigin==='use-now'){try{localStorage.setItem(`relphiSkyLiveAgeAnchor${slot}`,JSON.stringify({origin:'use-now',at:nextPayload.metadata.liveNowAt}))}catch(_){}window.dispatchEvent(new CustomEvent('relphi:sky-live-origin-changed',{detail:{slot,origin:'use-now',at:nextPayload.metadata.liveNowAt}}));window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:'Now',source:'use-now'}}))}clearEditor(slot);dispatchSlotChange(slot);finishWhereWhen(slot,true);window.dispatchEvent(new CustomEvent('relphi:sky-working-copy-updated',{detail:{slot,source:'where-when',dateTime:`${date}T${time}`,location:selected.canonical}}));scheduleSummary(slot,true);requestAnimationFrame(()=>window.RelphiSkyCardShell?.openDrawer?.(slot,'placements'))}catch(error){setBusy(slot,false);status(slot,error.message||'The Sky could not be calculated.',true)}}

document.addEventListener('click',event=>{
  const disclosure=event.target.closest('[data-ww-disclosure]');if(disclosure){const slot=disclosure.dataset.wwDisclosure;if(!SLOT_KEYS[slot])return;event.preventDefault();event.stopPropagation();if(disclosure.getAttribute('aria-expanded')==='true')closeEditor(slot);else openEditor(slot,true);return}
  const actionNode=event.target.closest('[data-ww-action]');if(!actionNode)return;const slot=eventSlot(actionNode);if(!slot)return;const action=actionNode.dataset.wwAction;if(action==='cancel')closeEditor(slot);else if(action==='search-location')searchLocation(slot);else if(action==='select-location')selectLocation(slot,actionNode);else if(action==='use-current-location')useCurrentLocation(slot);else if(action==='use-now')useNow(slot);else if(action==='resolve-coordinates')resolveCoordinates(slot);else if(action==='infer')infer(slot);else if(action==='apply-inference')applyInference(slot)
});
document.addEventListener('submit',event=>{const form=event.target.closest('.sky-where-when-editor');if(!form)return;event.preventDefault();submit(form.dataset.slot,form)});
document.addEventListener('keydown',event=>{if(event.key!=='Enter')return;const input=event.target.closest('[data-ww-field="location-query"]');if(!input)return;event.preventDefault();const slot=eventSlot(input);if(slot)searchLocation(slot)});
window.addEventListener('relphi:sky-drawer-opened',event=>{const{slot,drawer}=event.detail||{};if(drawer!=='where'||!SLOT_KEYS[slot])return;openEditor(slot,false)});
window.addEventListener('relphi:sky-drawer-closed',event=>{const{slot,drawer}=event.detail||{};if(drawer!=='where'||!SLOT_KEYS[slot])return;if(transactionState.editing.has(slot))closeEditor(slot)});
window.addEventListener('storage',event=>{if(!event.key||Object.values(SLOT_KEYS).includes(event.key)){['A','B'].forEach(slot=>{window.RelphiSkyCardShell?.sync?.(slot,payload(slot));scheduleSummary(slot)})}});
window.addEventListener('relphi:sky-foundation-ready',()=>{scheduleSummary('A');scheduleSummary('B')});
window.addEventListener('relphi:sky-name-updated',event=>{const slot=event.detail?.slot;if(SLOT_KEYS[slot]){closeEditor(slot);window.RelphiSkyCardShell?.sync?.(slot,payload(slot));scheduleSummary(slot,true)}});
window.addEventListener('resize',()=>{['A','B'].forEach(slot=>{const svg=shell(slot)?.heptagram;if(svg&&svg.dataset.canonicalSourceReady==='true')svg.setAttribute('viewBox',window.matchMedia?.('(max-width:620px)')?.matches?'0 -8 360 368':'0 0 360 360')})},{passive:true});
function recoverWhereWhen(){
  reconcileWhereWhenTransaction();
  ['A','B'].forEach(slot=>{
    window.RelphiSkyCardShell?.ensure?.(slot,payload(slot));
    scheduleSummary(slot,true);
  });
}
function start(){['A','B'].forEach(slot=>{shell(slot);scheduleSummary(slot)})}
window.addEventListener('relphi:sky-session-recovered',recoverWhereWhen);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
