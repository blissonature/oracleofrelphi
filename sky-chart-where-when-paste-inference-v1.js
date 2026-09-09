// Paste AstroSeek-style placements into Advanced Where and When.
// One Infer Where and When action works from either coordinates or pasted placements.
// Pasted placements remain the chart positions when Where and When is confirmed.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenPasteInferenceV1)return;
window.__relphiSkyWhereWhenPasteInferenceV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SHARED_HOUSE_KEY='relphiSkySharedHouseSystemV1';
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_GLYPHS=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SLOW=['Sun','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const PLANETS=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const BODY_ALIASES=[
  ['Part of Fortune','Part of Fortune'],['Fortune','Part of Fortune'],['South Node','South Node'],
  ['North Node','North Node'],['True Node','North Node'],['Mean Node','North Node'],['Node','North Node'],
  ['Ascendant','Ascendant'],['Rising','Ascendant'],['Midheaven','Midheaven'],['Vertex','Vertex'],
  ['Chiron','Chiron'],['Lilith','Lilith'],['Mercury','Mercury'],['Jupiter','Jupiter'],['Neptune','Neptune'],
  ['Uranus','Uranus'],['Saturn','Saturn'],['Venus','Venus'],['Pluto','Pluto'],['Mars','Mars'],['Moon','Moon'],['Sun','Sun'],
  ['ASC','Ascendant'],['MC','Midheaven'],['☉','Sun'],['☽','Moon'],['☿','Mercury'],['♀','Venus'],['♂','Mars'],
  ['♃','Jupiter'],['♄','Saturn'],['♅','Uranus'],['♆','Neptune'],['♇','Pluto'],['⚷','Chiron'],['⚸','Lilith'],
  ['☊','North Node'],['☋','South Node'],['Vx','Vertex'],['⊗','Part of Fortune']
];
let observer=null;

const norm=value=>((Number(value)%360)+360)%360;
const signed=value=>{const n=norm(value);return n>180?n-360:n};
const angularDistance=(a,b)=>Math.abs(((Number(a)-Number(b)+180)%360+360)%360-180);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keyName=value=>String(value||'').toLowerCase().replace(/\s+/g,'');
const read=slot=>{try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}};

function installStyle(){
  if(document.getElementById('skyWhereWhenPasteInferenceV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyWhereWhenPasteInferenceV1Styles';
  style.textContent=`
    .sky-ww-paste-inference{display:grid;gap:.48rem;padding:.68rem 0 .1rem;border-top:1px solid rgba(31,27,24,.09)}
    .sky-ww-paste-inference textarea{width:100%;min-height:112px;box-sizing:border-box;resize:vertical;font:650 .72rem/1.42 ui-monospace,SFMono-Regular,Menlo,monospace}
    .sky-ww-paste-status{margin:0;color:#655d56;font:650 .62rem/1.4 system-ui,sans-serif}
    .sky-ww-paste-status.is-error{color:#991913}
    .sky-where-when-advanced [data-ww-action="infer"],
    .sky-where-when-advanced [data-ww-action="resolve-coordinates"],
    .sky-coordinate-resolve-group{display:none!important}
  `;
  document.head.appendChild(style);
}

function setPasteStatus(form,message,error=false){
  const node=form?.querySelector('.sky-ww-paste-status');
  if(!node)return;
  node.textContent=message||'';
  node.classList.toggle('is-error',!!error);
}

function canonicalBody(line){
  const source=String(line||''),lower=source.toLowerCase();
  for(const[alias,name]of BODY_ALIASES){
    if(/[^a-z0-9 ]/i.test(alias)){if(source.includes(alias))return name;continue}
    const needle=alias.toLowerCase();
    const re=new RegExp(`(^|[^a-z])${needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z]|$)`,'i');
    if(re.test(lower))return name;
  }
  return'';
}

function canonicalSign(line){
  const source=String(line||'');
  for(let i=0;i<SIGNS.length;i++){
    if(source.includes(SIGN_GLYPHS[i])||new RegExp(`(^|[^a-z])${SIGNS[i]}([^a-z]|$)`,'i').test(source))return{i,name:SIGNS[i]};
  }
  return null;
}

function placementObject(name,longitude,extra={}){
  const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within);
  const minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);
  return{name,longitude:value,sign:SIGNS[signIndex],degree,minute,second,...extra};
}

function parsePlacements(text){
  const placements={};
  String(text||'').split(/\r?\n/).forEach(raw=>{
    const line=raw.trim();
    if(!line)return;
    const name=canonicalBody(line),sign=canonicalSign(line);
    if(!name||!sign)return;
    const degreeMatch=line.match(/(\d{1,2})\s*[°º]\s*(\d{1,2})?\s*(?:[′'’]\s*(\d{1,2})?\s*(?:[″"”])?)?/);
    if(!degreeMatch)return;
    const degree=Math.min(29,Number(degreeMatch[1])||0),minute=Math.min(59,Number(degreeMatch[2])||0),second=Math.min(59,Number(degreeMatch[3])||0);
    const longitude=sign.i*30+degree+minute/60+second/3600;
    const houseMatch=line.match(/(?:house|h)\s*(\d{1,2})\b/i)||line.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+house\b/i);
    const extra={};
    if(houseMatch)extra.house=Math.max(1,Math.min(12,Number(houseMatch[1])||1));
    if(/(?:\bR\b|℞|retrograde)/i.test(line))extra.retrograde=true;
    placements[name]=placementObject(name,longitude,extra);
  });
  const map=new Map(Object.entries(placements).map(([name,item])=>[keyName(name),{name,longitude:item.longitude,item}]));
  return{placements,map,count:Object.keys(placements).length};
}

function find(map,name){return map.get(keyName(name))||null}

function astronomyLongitude(name,date){
  const A=window.Astronomy;
  if(!A)throw new Error('Astronomy Engine is unavailable.');
  if(name==='Moon'&&typeof A.EclipticGeoMoon==='function')return norm(A.EclipticGeoMoon(date).lon);
  return norm(A.Ecliptic(A.GeoVector(name,date,true)).elon);
}

function obliquity(date){return Number(window.Astronomy.e_tilt(date).tobl)}

function score(records,date,mode='fine'){
  let total=0;
  for(const record of records){
    const error=angularDistance(astronomyLongitude(record.name,date),record.longitude);
    const weight=mode==='coarse'?(record.name==='Sun'?4:1):(record.name==='Moon'?3:record.name==='Sun'?2:1);
    total+=Math.pow(error*weight,2);
  }
  return total;
}

async function inferMoment(parsed){
  const map=parsed.map,sun=find(map,'Sun'),slow=SLOW.map(name=>find(map,name)).filter(Boolean),asc=find(map,'Ascendant'),mc=find(map,'Midheaven');
  if(!sun||slow.length<3)throw new Error('Include the Sun and at least two slower planets in the paste.');
  if(!asc||!mc)throw new Error('Include ASC and MC so Sky Chart can infer the place as well as the date.');
  const yearNow=new Date().getUTCFullYear(),startYear=Math.max(1900,yearNow-120),endYear=Math.min(2100,yearNow+20);
  let best=null;
  for(let year=startYear;year<=endYear;year++){
    const base=Date.UTC(year,2,20,12)+(sun.longitude/.98564736)*86400000;
    for(let offset=-5;offset<=5;offset+=.5){
      const date=new Date(base+offset*86400000),s=score(slow,date,'coarse');
      if(!best||s<best.score)best={date,score:s};
    }
    if((year-startYear)%12===0)await new Promise(resolve=>requestAnimationFrame(resolve));
  }
  const all=PLANETS.map(name=>find(map,name)).filter(Boolean);
  let refined=best;
  for(let hours=-72;hours<=72;hours++){
    const date=new Date(best.date.getTime()+hours*3600000),s=score(all,date);
    if(s<refined.score)refined={date,score:s};
  }
  let fine=refined;
  for(let minutes=-120;minutes<=120;minutes+=5){
    const date=new Date(refined.date.getTime()+minutes*60000),s=score(all,date);
    if(s<fine.score)fine={date,score:s};
  }
  let exact=fine;
  for(let minutes=-12;minutes<=12;minutes++){
    const date=new Date(fine.date.getTime()+minutes*60000),s=score(all,date);
    if(s<exact.score)exact={date,score:s};
  }

  const eps=obliquity(exact.date)*Math.PI/180;
  let bestLst={value:0,error:Infinity};
  for(let lst=0;lst<360;lst+=.05){
    const theta=lst*Math.PI/180,candidate=norm(Math.atan2(Math.sin(theta),Math.cos(theta)*Math.cos(eps))*180/Math.PI);
    const error=angularDistance(candidate,mc.longitude);
    if(error<bestLst.error)bestLst={value:lst,error};
  }
  const longitude=signed(bestLst.value-window.Astronomy.SiderealTime(exact.date)*15);
  let bestLat={value:0,error:Infinity};
  for(let lat=-75;lat<=75;lat+=.1){
    const theta=bestLst.value*Math.PI/180,phi=lat*Math.PI/180;
    const candidate=norm(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps))*180/Math.PI+180);
    const error=angularDistance(candidate,asc.longitude);
    if(error<bestLat.error)bestLat={value:lat,error};
  }
  const rms=Math.sqrt(all.reduce((sum,r)=>sum+Math.pow(angularDistance(astronomyLongitude(r.name,exact.date),r.longitude),2),0)/Math.max(1,all.length));
  return{
    date:exact.date,
    latitude:bestLat.value,
    longitude,
    rms,
    confidence:rms<.2?'High — close planetary and angle fit.':rms<.8?'Medium — close enough to preview; review before confirming.':'Low — broad fit only.'
  };
}

async function reversePacket(latitude,longitude){
  const reverseUrl=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
  reverseUrl.searchParams.set('latitude',String(latitude));
  reverseUrl.searchParams.set('longitude',String(longitude));
  reverseUrl.searchParams.set('localityLanguage','en');
  const zoneUrl=new URL('https://api.open-meteo.com/v1/forecast');
  zoneUrl.searchParams.set('latitude',String(latitude));
  zoneUrl.searchParams.set('longitude',String(longitude));
  zoneUrl.searchParams.set('timezone','auto');
  zoneUrl.searchParams.set('forecast_days','1');
  const[reverseResponse,zoneResponse]=await Promise.all([
    fetch(reverseUrl.toString(),{headers:{Accept:'application/json'}}),
    fetch(zoneUrl.toString(),{headers:{Accept:'application/json'}})
  ]);
  if(!reverseResponse.ok||!zoneResponse.ok)throw new Error('The coordinates could not be resolved to a locality and time zone.');
  const reverse=await reverseResponse.json(),zone=await zoneResponse.json();
  const canonical=[reverse.locality||reverse.city,reverse.principalSubdivision,reverse.countryName]
    .map(v=>String(v||'').trim()).filter((v,i,list)=>v&&list.indexOf(v)===i).join(', ');
  const timezone=String(zone.timezone||'');
  if(!canonical||!timezone)throw new Error('The coordinates did not resolve to a complete locality and time zone.');
  return{canonical,timezone};
}

function fire(node,type){node?.dispatchEvent(new Event(type,{bubbles:true}))}
function displayCoordinate(value){return Number(value).toFixed(5)}

function existingPacket(form){
  const slot=form?.dataset.slot,profile=read(slot)?.calcProfile;
  if(!profile?.location||!profile?.timeZone)return null;
  const latitude=Number(profile.latitude),longitude=Number(profile.longitude);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return null;
  return{
    query:profile.locationQuery||profile.location,
    canonical:profile.location,
    latitude,
    longitude,
    timezone:profile.timeZone
  };
}

function selectPacket(form,packet){
  const results=form.querySelector('.sky-location-results'),choice=document.createElement('button');
  choice.type='button';
  choice.hidden=true;
  choice.dataset.wwAction='select-location';
  choice.__locationPacket=packet;
  results?.appendChild(choice);
  choice.click();
  choice.remove();
}

function ensurePasteState(form){
  const raw=form?.querySelector('[data-ww-paste-placements]')?.value.trim()||'';
  if(!raw){form.__relphiPasteImport=null;return null}
  const parsed=parsePlacements(raw);
  if(parsed.count<4)return null;
  const prior=form.__relphiPasteImport;
  if(prior?.raw===raw)return prior;
  const state={
    raw,
    parsed,
    packet:prior?.packet||existingPacket(form),
    whereWhenSource:prior?.whereWhenSource||'manual',
    inferredFromPlacements:false,
    confidence:null
  };
  form.__relphiPasteImport=state;
  return state;
}

async function resolveFromCoordinates(form){
  const latitude=Number(form.querySelector('[data-ww-field="latitude"]')?.value);
  const longitude=Number(form.querySelector('[data-ww-field="longitude"]')?.value);
  if(!Number.isFinite(latitude)||latitude<-90||latitude>90||!Number.isFinite(longitude)||longitude<-180||longitude>180){
    return setPasteStatus(form,'Enter valid latitude and longitude first.',true);
  }
  const button=form.querySelector('[data-ww-infer-paste]');
  if(button){button.disabled=true;button.textContent='Inferring…'}
  setPasteStatus(form,'');
  try{
    const place=await reversePacket(latitude,longitude);
    const packet={
      query:`${displayCoordinate(latitude)}, ${displayCoordinate(longitude)}`,
      canonical:place.canonical,
      latitude,
      longitude,
      timezone:place.timezone
    };
    selectPacket(form,packet);
    const state=ensurePasteState(form);
    if(state){
      state.packet=packet;
      state.whereWhenSource='coordinates';
      state.inferredFromPlacements=false;
      state.confidence=null;
    }
    const timezone=form.querySelector('[data-ww-field="timezone"]');
    fire(timezone,'input');fire(timezone,'change');
    window.RelphiSkyWhereWhenDraftHeptagram?.render?.(form.dataset.slot,0);
  }catch(error){
    setPasteStatus(form,error.message||'Where and When could not be inferred from those coordinates.',true);
  }finally{
    if(button?.isConnected){button.disabled=false;button.textContent='Infer Where and When'}
  }
}

async function inferFromPaste(form){
  const state=ensurePasteState(form),raw=state?.raw||'';
  if(!raw)return setPasteStatus(form,'Paste AstroSeek placements first.',true);
  if(!state)return setPasteStatus(form,'Not enough complete placement rows were recognized.',true);
  const button=form.querySelector('[data-ww-infer-paste]');
  if(button){button.disabled=true;button.textContent='Inferring…'}
  setPasteStatus(form,'Matching the pasted placements to an astronomical sky…');
  try{
    const estimate=await inferMoment(state.parsed);
    if(estimate.rms>1.25){
      throw new Error('These placements do not match one astronomical sky. For progressions or other derived charts, enter the Where and When manually.');
    }
    const place=await reversePacket(estimate.latitude,estimate.longitude);
    const local=window.luxon?.DateTime?.fromJSDate(estimate.date)?.setZone(place.timezone);
    if(!local?.isValid)throw new Error('The inferred instant could not be converted to the inferred time zone.');
    const packet={
      query:'Inferred from pasted placements',
      canonical:place.canonical,
      latitude:estimate.latitude,
      longitude:estimate.longitude,
      timezone:place.timezone
    };
    selectPacket(form,packet);
    const date=form.querySelector('[data-ww-field="date"]'),time=form.querySelector('[data-ww-field="time"]');
    if(date)date.value=local.toFormat('yyyy-MM-dd');
    if(time)time.value=local.toFormat('HH:mm');
    [date,time,form.querySelector('[data-ww-field="latitude"]'),form.querySelector('[data-ww-field="longitude"]'),form.querySelector('[data-ww-field="timezone"]')]
      .forEach(node=>{fire(node,'input');fire(node,'change')});
    state.packet=packet;
    state.whereWhenSource='placement-inference';
    state.inferredFromPlacements=true;
    state.confidence=estimate.confidence;
    const card=form.querySelector('.sky-inference-card');
    if(card){
      card.hidden=false;
      card.innerHTML=`<p><strong>Estimated where:</strong> ${esc(place.canonical)}</p><p><strong>Estimated when:</strong> ${esc(local.toFormat("yyyy-MM-dd'T'HH:mm"))}</p><p><strong>Confidence:</strong> ${esc(estimate.confidence)}</p><p>Preview only — use the button below to confirm.</p>`;
    }
    setPasteStatus(form,'Preview ready. Review the mini heptagram, then use “Use This Where and When.”');
    window.RelphiSkyWhereWhenDraftHeptagram?.render?.(form.dataset.slot,0);
  }catch(error){
    state.inferredFromPlacements=false;
    state.confidence=null;
    setPasteStatus(form,error.message||'Where and When could not be inferred from that paste.',true);
  }finally{
    if(button?.isConnected){button.disabled=false;button.textContent='Infer Where and When'}
  }
}

async function inferWhereWhen(form){
  if(!form)return;
  const raw=form.querySelector('[data-ww-paste-placements]')?.value.trim()||'';
  const source=form.__relphiInferenceSource;
  if(source==='coordinates')return resolveFromCoordinates(form);
  if(source==='placements')return inferFromPaste(form);
  if(raw)return inferFromPaste(form);
  return resolveFromCoordinates(form);
}

function houseFor(longitude,cusps){
  for(let i=0;i<12;i++){
    const start=norm(cusps[i]),span=norm(cusps[(i+1)%12]-start)||30;
    if(norm(longitude-start)<span)return i+1;
  }
  return 12;
}

function siderealDegrees(date,longitude){return norm(window.Astronomy.SiderealTime(date)*15+Number(longitude||0))}

function buildPastedPayload(slot,form,state){
  const existing=read(slot)||{};
  const date=form.querySelector('[data-ww-field="date"]')?.value||'';
  const time=form.querySelector('[data-ww-field="time"]')?.value||'';
  const timezone=form.querySelector('[data-ww-field="timezone"]')?.value||'';
  const latitude=Number(form.querySelector('[data-ww-field="latitude"]')?.value);
  const longitude=Number(form.querySelector('[data-ww-field="longitude"]')?.value);
  if(!date||!time||!timezone||!Number.isFinite(latitude)||!Number.isFinite(longitude))throw new Error('Where and When is incomplete.');
  const dt=window.luxon?.DateTime?.fromISO(`${date}T${time}`,{zone:timezone,setZone:true});
  if(!dt?.isValid)throw new Error('The local time is not valid.');
  const packet=state.packet||existingPacket(form);
  if(!packet?.canonical)throw new Error('Choose a locality or infer it from coordinates before confirming.');

  const placements=JSON.parse(JSON.stringify(state.parsed.placements));
  if(placements.Ascendant&&!placements.Descendant)placements.Descendant=placementObject('Descendant',placements.Ascendant.longitude+180);
  if(placements.Midheaven&&!placements.IC)placements.IC=placementObject('IC',placements.Midheaven.longitude+180);

  const system=localStorage.getItem(SHARED_HOUSE_KEY)||existing.calcProfile?.houseSystem||'whole-sign';
  const asc=placements.Ascendant?.longitude,mc=placements.Midheaven?.longitude;
  let houses=null;
  if(Number.isFinite(asc)&&Number.isFinite(mc)&&window.RelphiHouseSystems&&window.Astronomy){
    houses=window.RelphiHouseSystems.calculateCusps({
      system,
      ascendant:asc,
      midheaven:mc,
      siderealDegrees:siderealDegrees(dt.toUTC().toJSDate(),longitude),
      obliquityDegrees:obliquity(dt.toUTC().toJSDate()),
      latitude
    });
    if(Array.isArray(houses?.cusps)&&houses.cusps.length===12){
      Object.values(placements).forEach(item=>{
        if(Number.isFinite(Number(item?.longitude)))item.house=houseFor(item.longitude,houses.cusps);
      });
    }
  }

  const metadata=existing.metadata&&typeof existing.metadata==='object'?{...existing.metadata}:{};
  delete metadata.savedSkyId;delete metadata.savedSkyName;delete metadata.savedSkyLoadedAt;
  delete metadata.liveNowOrigin;delete metadata.liveNowAt;delete metadata.liveAgeAnchorAt;
  delete metadata.liveNowLatitude;delete metadata.liveNowLongitude;
  metadata.liveNowDisabled=true;
  metadata.liveNowDisabledReason='pasted-placements';
  metadata.placementSource='astroseek-paste';
  metadata.whereWhenSource=state.whereWhenSource||'manual';

  const profile=existing.calcProfile&&typeof existing.calcProfile==='object'?{...existing.calcProfile}:{};
  delete profile.liveNowOrigin;delete profile.liveNowAt;
  const calcProfile={
    ...profile,
    dateTime:`${date}T${time}`,
    instant:dt.toUTC().toISO(),
    latitude:String(latitude),
    longitude:String(longitude),
    location:packet.canonical,
    locationQuery:packet.query||packet.canonical,
    timeZone:timezone,
    houseSystem:houses?.system||system,
    houseCusps:houses?.cusps||profile.houseCusps||[],
    cusps:houses?.cusps||profile.cusps||[],
    houseSystemNote:houses?.note,
    source:state.inferredFromPlacements?'astroseek-paste-inference':'astroseek-paste',
    inferredFromPlacements:!!state.inferredFromPlacements
  };
  return{
    ...existing,
    name:existing.name||`Sky ${slot}`,
    saved:false,
    placements,
    houseCusps:houses?.cusps||existing.houseCusps||[],
    metadata,
    calcProfile,
    savedAt:new Date().toISOString()
  };
}

function restoreAndClose(slot){
  const refs=window.RelphiSkyCardShell?.get?.(slot);
  if(!refs)return;
  const frame=refs.root?.querySelector(`[data-sky-heptagram-frame="${slot}"]`);
  if(refs.summary&&frame&&!refs.summary.contains(frame))refs.summary.prepend(frame);
  window.RelphiSkyCardShell?.setEditorExpanded?.(slot,false);
  refs.editor?.replaceChildren();
}

function dispatchSlot(slot){
  try{
    window.dispatchEvent(new StorageEvent('storage',{key:KEYS[slot],newValue:localStorage.getItem(KEYS[slot]),storageArea:localStorage}));
  }catch(_){
    const event=new Event('storage');
    Object.defineProperty(event,'key',{value:KEYS[slot]});
    window.dispatchEvent(event);
  }
}

async function commitPasted(form,event){
  const raw=form.querySelector('[data-ww-paste-placements]')?.value.trim()||'';
  if(!raw)return false;
  const parsed=parsePlacements(raw);
  if(parsed.count<4){
    event.preventDefault();event.stopImmediatePropagation();
    setPasteStatus(form,'Not enough complete placement rows were recognized.',true);
    return true;
  }
  let state=form.__relphiPasteImport;
  if(!state||state.raw!==raw){
    state={
      raw,
      parsed,
      packet:existingPacket(form),
      whereWhenSource:'manual',
      inferredFromPlacements:false,
      confidence:null
    };
    form.__relphiPasteImport=state;
  }else{
    state.parsed=parsed;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  const slot=form.dataset.slot,submit=form.querySelector('button[type="submit"]');
  if(submit){submit.disabled=true;submit.textContent='Saving…'}
  try{
    const next=buildPastedPayload(slot,form,state);
    localStorage.setItem(KEYS[slot],JSON.stringify(next));
    const saved=read(slot);
    if(!saved?.calcProfile?.dateTime||!saved?.placements?.Sun)throw new Error('The pasted sky did not persist.');
    restoreAndClose(slot);
    dispatchSlot(slot);
    window.RelphiSkyWhereWhenTransaction?.commit?.(slot);
    const source=state.inferredFromPlacements?'astroseek-paste-inference':'astroseek-paste';
    window.dispatchEvent(new CustomEvent('relphi:sky-working-copy-updated',{
      detail:{slot,source,dateTime:saved.calcProfile.dateTime,location:saved.calcProfile.location}
    }));
    requestAnimationFrame(()=>window.RelphiSkyCardShell?.openDrawer?.(slot,'placements'));
  }catch(error){
    setPasteStatus(form,error.message||'The pasted sky could not be saved.',true);
    if(submit?.isConnected){submit.disabled=false;submit.textContent='Use This Where and When'}
  }
  return true;
}

function enhance(form){
  if(!form||form.querySelector('[data-ww-paste-inference]'))return;
  const advanced=form.querySelector('.sky-where-when-advanced-body');
  if(!advanced)return;

  const oldResolve=advanced.querySelector('[data-ww-action="resolve-coordinates"]');
  const oldRow=oldResolve?.closest('.sky-where-when-inline-actions');
  if(oldRow)oldRow.hidden=true;

  const block=document.createElement('div');
  block.className='sky-ww-paste-inference';
  block.dataset.wwPasteInference='true';
  block.innerHTML=`<label class="sky-where-when-label">Paste placements<textarea class="sky-where-when-input" data-ww-paste-placements rows="6" spellcheck="false" placeholder="Paste AstroSeek planet positions, including ASC and MC"></textarea></label><div class="sky-where-when-inline-actions"><button class="sky-where-when-button secondary" type="button" data-ww-infer-paste>Infer Where and When</button></div><p class="sky-ww-paste-status" aria-live="polite"></p>`;
  const inferenceCard=advanced.querySelector('.sky-inference-card');
  if(inferenceCard)advanced.insertBefore(block,inferenceCard);
  else advanced.appendChild(block);

  form.__relphiInferenceSource=null;
  form.__relphiPasteImport=null;
}

function enhanceAll(){document.querySelectorAll('.sky-where-when-editor').forEach(enhance)}

function start(){
  installStyle();
  enhanceAll();
  observer=new MutationObserver(()=>enhanceAll());
  observer.observe(document.getElementById('skyFoundationRoot')||document.body,{childList:true,subtree:true});

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-ww-infer-paste]');
    if(button){
      event.preventDefault();
      void inferWhereWhen(button.closest('.sky-where-when-editor'));
      return;
    }
    const locationChoice=event.target.closest?.('[data-ww-action="select-location"]');
    const form=locationChoice?.closest?.('.sky-where-when-editor');
    if(form&&form.__relphiPasteImport&&locationChoice.__locationPacket){
      form.__relphiPasteImport.packet=locationChoice.__locationPacket;
      form.__relphiPasteImport.whereWhenSource='location-selection';
      form.__relphiPasteImport.inferredFromPlacements=false;
    }
  },true);

  document.addEventListener('input',event=>{
    const form=event.target.closest?.('.sky-where-when-editor');
    if(!form)return;
    if(event.target.matches?.('[data-ww-paste-placements]')){
      form.__relphiInferenceSource='placements';
      const state=ensurePasteState(form);
      if(state){
        state.inferredFromPlacements=false;
        state.confidence=null;
      }
      setPasteStatus(form,'');
      return;
    }
    if(event.isTrusted&&event.target.matches?.('[data-ww-field="latitude"],[data-ww-field="longitude"]')){
      form.__relphiInferenceSource='coordinates';
      const state=ensurePasteState(form);
      if(state){
        state.whereWhenSource='coordinates';
        state.inferredFromPlacements=false;
      }
      return;
    }
    if(event.isTrusted&&event.target.matches?.('[data-ww-field="date"],[data-ww-field="time"]')){
      const state=ensurePasteState(form);
      if(state){
        state.whereWhenSource='manual';
        state.inferredFromPlacements=false;
      }
    }
  },true);

  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('.sky-where-when-editor');
    if(form?.querySelector('[data-ww-paste-placements]')?.value.trim())void commitPasted(form,event);
  },true);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();