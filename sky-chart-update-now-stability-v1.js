// Update a Sky to the device's Here and Now without opening or focusing the Where and When editor.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyUpdateNowStabilityV1)return;
  window.__relphiSkyUpdateNowStabilityV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const VIEW_KEY='relphiSkyWhereWhenViewV1';
  const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const BODIES=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];

  const norm=value=>((Number(value)%360)+360)%360;
  const read=slot=>{try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}};
  const panel=slot=>document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');

  function dispatch(slot){
    try{window.dispatchEvent(new StorageEvent('storage',{key:KEYS[slot],newValue:localStorage.getItem(KEYS[slot]),storageArea:localStorage}))}
    catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:KEYS[slot]});window.dispatchEvent(event)}
  }

  function currentPosition(){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation)return reject(new Error('Current location is unavailable in this browser.'));
      navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:0});
    });
  }

  async function currentLocationPacket(){
    const position=await currentPosition();
    const latitude=Number(position.coords.latitude),longitude=Number(position.coords.longitude);
    const [placeResponse,zoneResponse]=await Promise.all([
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=10&addressdetails=1`,{headers:{Accept:'application/json'}}),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&timezone=auto&current=temperature_2m`,{headers:{Accept:'application/json'}})
    ]);
    const place=placeResponse.ok?await placeResponse.json():{};
    const zone=zoneResponse.ok?await zoneResponse.json():{};
    const address=place.address||{};
    const canonical=place.display_name||[
      address.city||address.town||address.village||address.county,
      address.state,address.country
    ].filter(Boolean).join(', ')||`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    const timezone=String(zone.timezone||'');
    if(!timezone)throw new Error('The current location did not resolve to an IANA time zone.');
    return{query:'My current location',canonical,latitude,longitude,timezone};
  }

  function astronomyLongitude(bodyName,date){
    const A=window.Astronomy;
    if(!A)throw new Error('Astronomy Engine is unavailable.');
    if(bodyName==='Moon'&&typeof A.EclipticGeoMoon==='function')return norm(A.EclipticGeoMoon(date).lon);
    return norm(A.Ecliptic(A.GeoVector(bodyName,date,true)).elon);
  }
  function siderealDegrees(date,longitude){return norm(window.Astronomy.SiderealTime(date)*15+Number(longitude||0))}
  function obliquity(date){return Number(window.Astronomy.e_tilt(date).tobl)}
  function ascendantLongitude(date,latitude,longitude){
    const theta=siderealDegrees(date,longitude)*Math.PI/180;
    const phi=Number(latitude)*Math.PI/180;
    const epsilon=obliquity(date)*Math.PI/180;
    return norm(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(epsilon)+Math.tan(phi)*Math.sin(epsilon))*180/Math.PI+180);
  }
  function midheavenLongitude(date,longitude){
    const theta=siderealDegrees(date,longitude)*Math.PI/180;
    const epsilon=obliquity(date)*Math.PI/180;
    return norm(Math.atan2(Math.sin(theta),Math.cos(theta)*Math.cos(epsilon))*180/Math.PI);
  }
  function placementObject(name,longitude){
    const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);
    return{name,longitude:value,sign:SIGNS[signIndex],degree,minute,second};
  }

  function calculate(slot,packet,now){
    if(!window.RelphiHouseSystems||!window.Astronomy)throw new Error('The Sky calculation engine is unavailable.');
    const existing=read(slot)||{};
    const instant=now.toUTC().toJSDate();
    const placements={};
    BODIES.forEach(name=>{placements[name]=placementObject(name,astronomyLongitude(name,instant))});
    const asc=ascendantLongitude(instant,packet.latitude,packet.longitude);
    const mc=midheavenLongitude(instant,packet.longitude);
    placements.Ascendant=placementObject('Ascendant',asc);
    placements.Midheaven=placementObject('Midheaven',mc);

    const priorProfile=existing.calcProfile&&typeof existing.calcProfile==='object'?existing.calcProfile:{};
    const requestedSystem=priorProfile.houseSystem||'whole-sign';
    const houses=window.RelphiHouseSystems.calculateCusps({
      system:requestedSystem,ascendant:asc,midheaven:mc,
      siderealDegrees:siderealDegrees(instant,packet.longitude),
      obliquityDegrees:obliquity(instant),latitude:packet.latitude
    });
    const name='Now';
    const metadata=existing.metadata&&typeof existing.metadata==='object'?{...existing.metadata}:{};
    delete metadata.savedSkyId;delete metadata.savedSkyName;delete metadata.savedSkyLoadedAt;
    metadata.name=name;metadata.title=name;

    return{
      ...existing,
      name,title:name,displayName:name,skyName:name,
      placements,
      houseCusps:houses.cusps,
      metadata,
      calcProfile:{
        ...priorProfile,
        name,title:name,
        dateTime:now.toFormat("yyyy-MM-dd'T'HH:mm"),
        instant:now.toUTC().toISO(),
        latitude:String(packet.latitude),longitude:String(packet.longitude),
        location:packet.canonical,locationQuery:packet.query,
        timeZone:packet.timezone,
        houseSystem:houses.system||requestedSystem,
        houseCusps:houses.cusps,cusps:houses.cusps,
        houseSystemNote:houses.note,
        source:'where-when-v1'
      },
      savedAt:new Date().toISOString()
    };
  }

  function setConfirmedView(slot){
    try{
      const state=JSON.parse(sessionStorage.getItem(VIEW_KEY)||'{}');
      state[slot]='confirmed';
      sessionStorage.setItem(VIEW_KEY,JSON.stringify(state));
    }catch(_){}
  }

  function announceError(slot,error){
    const card=panel(slot);
    let node=card?.querySelector('[data-update-now-status]');
    if(!node&&card){
      node=document.createElement('span');
      node.dataset.updateNowStatus='true';
      node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.hidden=true;
      card.querySelector('.sky-where-when-actions')?.appendChild(node);
    }
    if(node)node.textContent=error?.code===1?'Location permission was denied.':error?.message||'Here and Now could not be set.';
  }

  async function update(slot,button){
    if(button.dataset.updateNowBusy==='true')return;
    button.dataset.updateNowBusy='true';button.disabled=true;button.setAttribute('aria-busy','true');
    try{
      const packet=await currentLocationPacket();
      const now=window.luxon?.DateTime?.now().setZone(packet.timezone);
      if(!now?.isValid)throw new Error('The current local time could not be resolved.');
      const next=calculate(slot,packet,now);
      setConfirmedView(slot);
      localStorage.setItem(KEYS[slot],JSON.stringify(next));
      dispatch(slot);
      window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:'Now',source:'update-to-now-stable'}}));
    }catch(error){console.error(error);announceError(slot,error)}
    finally{
      delete button.dataset.updateNowBusy;
      if(button.isConnected){button.disabled=false;button.removeAttribute('aria-busy')}
    }
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-final-now]');
    if(!button)return;
    const slot=button.dataset.finalNow;
    if(!KEYS[slot])return;
    // This controller owns Update to Now before the legacy target listener can open/focus the editor.
    event.preventDefault();event.stopImmediatePropagation();
    update(slot,button);
  },true);
})();
