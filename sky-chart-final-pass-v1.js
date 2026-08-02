// Final Sky Chart functional pass. Extends the approved controllers without replacing them.
(function(){
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyFinalPassV1) return;
  window.__relphiSkyFinalPassV1 = true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const HOUSE_SYSTEMS={
    'whole-sign':'Whole Sign','equal-house':'Equal House','porphyry':'Porphyry','placidus':'Placidus',
    'alcabitius':'Alcabitius','regiomontanus':'Regiomontanus','campanus':'Campanus','koch':'Koch'
  };
  const ASPECT_LABELS={
    all:'All',conjunction:'Conjunction','semi-sextile':'Semi-Sextile',octile:'Octile',sextile:'Sextile',
    quintile:'Quintile',square:'Square',trine:'Trine','tri-octile':'Tri-Octile','bi-quintile':'Bi-Quintile',
    quincunx:'Quincunx',opposition:'Opposition'
  };
  const PRESERVE=['Part of Fortune','Vertex','Chiron','Lilith','North Node','South Node'];
  const remembered={A:{},B:{}};
  const filters={aspect:'all',placement:'all',houseA:'all',houseB:'all'};
  let queued=false;

  function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function dispatch(slot){
    try{window.dispatchEvent(new StorageEvent('storage',{key:KEYS[slot],newValue:localStorage.getItem(KEYS[slot]),storageArea:localStorage}))}
    catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:KEYS[slot]});window.dispatchEvent(event)}
  }
  function save(slot,value,emit=true){localStorage.setItem(KEYS[slot],JSON.stringify(value));if(emit)dispatch(slot)}
  function norm(value){return ((Number(value)%360)+360)%360}
  function panel(slot){return document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB')}
  function placementMap(value){return value?.placements&&typeof value.placements==='object'?value.placements:{}}
  function find(source,names){
    const normalized=names.map(name=>String(name).toLowerCase().replace(/\s+/g,''));
    return Object.entries(source||{}).find(([key,item])=>normalized.includes(String(item?.name||key).toLowerCase().replace(/\s+/g,'')))?.[1]||null;
  }
  function placement(name,longitude){
    const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),mf=(within-degree)*60,minute=Math.floor(mf),second=Math.round((mf-minute)*60);
    return {name,longitude:value,sign:signs[signIndex],degree,minute,second};
  }
  function meanNodeLongitude(date){
    const jd=date.getTime()/86400000+2440587.5,T=(jd-2451545.0)/36525;
    return norm(125.04452-1934.136261*T+0.0020708*T*T+(T*T*T)/450000);
  }
  function remember(slot){
    const source=placementMap(read(slot));remembered[slot]={};
    PRESERVE.forEach(name=>{const item=find(source,[name]);if(item)remembered[slot][name]=item});
  }
  function houseFor(value,cusps){
    for(let index=0;index<12;index+=1){const start=cusps[index],span=norm(cusps[(index+1)%12]-start)||30;if(norm(value-start)<span)return index+1}
    return 12;
  }
  function completeRecord(slot){
    const value=read(slot);if(!value)return;
    value.placements=value.placements&&typeof value.placements==='object'?value.placements:{};
    const source=value.placements,profile=value.calcProfile||{};
    const asc=find(source,['Ascendant','ASC','Rising']),mc=find(source,['Midheaven','MC']);
    const sun=find(source,['Sun']),moon=find(source,['Moon']);
    if(asc&&Number.isFinite(Number(asc.longitude)))source.Descendant=placement('Descendant',Number(asc.longitude)+180);
    if(mc&&Number.isFinite(Number(mc.longitude)))source.IC=placement('IC',Number(mc.longitude)+180);
    const instant=new Date(profile.instant||profile.dateTime||Date.now());
    if(!find(source,['North Node']))source['North Node']=placement('North Node',meanNodeLongitude(instant));
    if(!find(source,['South Node']))source['South Node']=placement('South Node',Number(source['North Node'].longitude)+180);
    PRESERVE.forEach(name=>{if(!find(source,[name])&&remembered[slot][name])source[name]=remembered[slot][name]});
    if(!find(source,['Part of Fortune'])&&asc&&sun&&moon){
      let isDay=true;
      try{if(window.SunCalc&&Number.isFinite(Number(profile.latitude))&&Number.isFinite(Number(profile.longitude)))isDay=window.SunCalc.getPosition(instant,Number(profile.latitude),Number(profile.longitude)).altitude>0}catch(_){}
      source['Part of Fortune']=placement('Part of Fortune',isDay?Number(asc.longitude)+Number(moon.longitude)-Number(sun.longitude):Number(asc.longitude)+Number(sun.longitude)-Number(moon.longitude));
    }
    const cusps=profile.houseCusps||profile.cusps||value.houseCusps;
    if(Array.isArray(cusps)&&cusps.length===12)Object.values(source).forEach(item=>{if(Number.isFinite(Number(item?.longitude)))item.house=houseFor(Number(item.longitude),cusps)});
    save(slot,value,false);
  }

  function addHeaderActions(slot){
    const actions=panel(slot)?.querySelector('.sky-where-when-actions');if(!actions)return;
    if(!actions.querySelector('[data-final-now]')){
      const button=document.createElement('button');button.type='button';button.className='sky-where-when-action';button.dataset.finalNow=slot;button.textContent='Update to Now';
      button.addEventListener('click',()=>updateToNow(slot,button));actions.prepend(button);
    }
  }
  function currentPosition(){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation)return reject(new Error('Current location is unavailable in this browser.'));
      navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
    });
  }
  async function currentLocationPacket(){
    const position=await currentPosition(),latitude=position.coords.latitude,longitude=position.coords.longitude;
    const [placeResponse,zoneResponse]=await Promise.all([
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=10&addressdetails=1`,{headers:{Accept:'application/json'}}),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&timezone=auto&current=temperature_2m`,{headers:{Accept:'application/json'}})
    ]);
    const place=placeResponse.ok?await placeResponse.json():{},zone=zoneResponse.ok?await zoneResponse.json():{},address=place.address||{};
    const canonical=place.display_name||[address.city||address.town||address.village||address.county,address.state,address.country].filter(Boolean).join(', ')||`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    const timezone=String(zone.timezone||'');
    if(!timezone)throw new Error('The current location did not resolve to an IANA time zone.');
    return{query:'My current location',canonical,latitude,longitude,timezone};
  }
  function selectCurrentLocation(slot,packet){
    const results=panel(slot)?.querySelector('.sky-location-results');if(!results)return false;
    const choice=document.createElement('button');choice.type='button';choice.className='sky-location-result';choice.dataset.wwAction='select-location';choice.innerHTML=`<strong>${packet.canonical}</strong><span>${packet.latitude.toFixed(5)}, ${packet.longitude.toFixed(5)} · ${packet.timezone}</span>`;choice.__locationPacket=packet;
    results.replaceChildren(choice);choice.click();return true;
  }
  async function updateToNow(slot,button){
    const originalLabel=button?.textContent||'Update to Now';
    if(button){button.disabled=true;button.textContent='Finding Here and Now…'}
    try{
      remember(slot);panel(slot)?.querySelector('[data-ww-action="edit"]')?.click();
      await new Promise(resolve=>setTimeout(resolve,0));
      const packet=await currentLocationPacket();
      if(!selectCurrentLocation(slot,packet))throw new Error('The Where and When editor is unavailable.');
      const now=window.luxon?.DateTime?.now().setZone(packet.timezone);
      if(!now?.isValid)throw new Error('The current local time could not be resolved.');
      const card=panel(slot),date=card?.querySelector('[data-ww-field="date"]'),time=card?.querySelector('[data-ww-field="time"]');
      if(date)date.value=now.toFormat('yyyy-MM-dd');if(time)time.value=now.toFormat('HH:mm');
      card?.querySelector('.sky-where-when-editor')?.requestSubmit();
    }catch(error){
      console.error(error);
      const statusNode=panel(slot)?.querySelector('.sky-where-when-status');
      if(statusNode){statusNode.textContent=error?.code===1?'Location permission was denied.':error.message||'Here and Now could not be set.';statusNode.classList.add('is-error')}
    }finally{
      if(button?.isConnected){button.disabled=false;button.textContent=originalLabel}
    }
  }

  function addEditorControls(slot){
    const card=panel(slot),where=card?.querySelector('.sky-where-when-section'),advanced=card?.querySelector('.sky-where-when-advanced-body');
    advanced?.querySelector('[data-house-system]')?.remove();
    if(where&&!where.querySelector('[data-current-location]')){
      const button=document.createElement('button');button.type='button';button.className='sky-where-when-button secondary';button.dataset.currentLocation=slot;button.textContent='My current location';
      button.addEventListener('click',()=>useCurrentLocation(slot,button));where.querySelector('.sky-where-search-row')?.insertAdjacentElement('afterend',button);
    }
  }
  async function useCurrentLocation(slot,button){
    button.disabled=true;button.textContent='Requesting location…';
    try{selectCurrentLocation(slot,await currentLocationPacket())}
    catch(error){console.error(error);button.textContent=error?.code===1?'Location permission denied':'My current location'}
    finally{button.disabled=false;if(button.textContent==='Requesting location…')button.textContent='My current location'}
  }

  function calculateHouseSystem(slot,system){
    const value=read(slot);if(!value)throw new Error(`Sky ${slot} is empty.`);
    const profile=value.calcProfile||{},source=placementMap(value),asc=find(source,['Ascendant','ASC','Rising']),mc=find(source,['Midheaven','MC']);
    if(!asc||!mc)throw new Error(`Sky ${slot} needs Ascendant and Midheaven before changing house system.`);
    if(!window.RelphiHouseSystems||!window.Astronomy)throw new Error('The house calculation engine is unavailable.');
    const instant=new Date(profile.instant||profile.dateTime||Date.now()),longitude=Number(profile.longitude),latitude=Number(profile.latitude);
    if(!Number.isFinite(longitude)||!Number.isFinite(latitude))throw new Error(`Sky ${slot} needs resolved coordinates.`);
    const siderealDegrees=norm(window.Astronomy.SiderealTime(instant)*15+longitude),obliquityDegrees=Number(window.Astronomy.e_tilt(instant).tobl);
    const result=window.RelphiHouseSystems.calculateCusps({system,ascendant:Number(asc.longitude),midheaven:Number(mc.longitude),siderealDegrees,obliquityDegrees,latitude});
    value.calcProfile={...profile,houseSystem:result.system,houseCusps:result.cusps,cusps:result.cusps,houseSystemNote:result.note};
    value.houseCusps=result.cusps;
    Object.values(source).forEach(item=>{if(Number.isFinite(Number(item?.longitude)))item.house=houseFor(Number(item.longitude),result.cusps)});
    save(slot,value,true);
  }
  function changeHouseSystem(select){
    try{calculateHouseSystem('A',select.value);calculateHouseSystem('B',select.value);select.setCustomValidity('')}
    catch(error){console.error(error);select.setCustomValidity(error.message);select.reportValidity()}
  }

  function addFilters(){
    const relationshipPanel=document.getElementById('skyFoundationRelationships');if(!relationshipPanel)return;
    let bar=relationshipPanel.querySelector('.sky-chart-filter-bar');
    if(!bar){bar=document.createElement('div');bar.className='sky-chart-filter-bar';relationshipPanel.insertBefore(bar,relationshipPanel.querySelector('#skyFoundationRelationshipList'))}
    if(bar.dataset.finalFilterOwner==='true')return;
    bar.dataset.finalFilterOwner='true';
    const aspectOptions=Object.entries(ASPECT_LABELS).map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
    const houses=['all',...Array.from({length:12},(_,i)=>String(i+1))].map(value=>`<option value="${value}">${value==='all'?'All':value}</option>`).join('');
    const current=read('A')?.calcProfile?.houseSystem||read('B')?.calcProfile?.houseSystem||'whole-sign';
    const systems=Object.entries(HOUSE_SYSTEMS).map(([value,label])=>`<option value="${value}"${value===current?' selected':''}>${label}</option>`).join('');
    bar.innerHTML=`<label>Aspects<select data-filter="aspect">${aspectOptions}</select></label><label>Placements<select data-filter="placement"><option value="all">All</option></select></label><label>Sky A House<select data-filter="houseA">${houses}</select></label><label>Sky B House<select data-filter="houseB">${houses}</select></label><label>House System<select data-house-system-filter>${systems}</select></label>`;
    bar.addEventListener('change',event=>{
      if(event.target.matches('[data-house-system-filter]')){changeHouseSystem(event.target);return}
      if(!event.target.dataset.filter)return;filters[event.target.dataset.filter]=event.target.value;applyFilters();
    });
    refreshPlacementFilter();
  }
  function refreshPlacementFilter(){
    const select=document.querySelector('[data-filter="placement"]');if(!select)return;
    const values=new Map();document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{
      [[row.dataset.leftPlacement,row.querySelector('.sky-foundation-relationship-copy')?.childNodes?.[0]?.textContent],[row.dataset.rightPlacement,row.querySelectorAll('.sky-foundation-relationship-copy')?.[1]?.childNodes?.[0]?.textContent]].forEach(([id,label])=>{if(id)values.set(id,String(label||id).trim())});
    });
    const entries=[...values.entries()].sort((a,b)=>a[1].localeCompare(b[1])),signature=JSON.stringify(entries);if(select.dataset.finalPlacementOptions===signature)return;
    const previous=select.value;select.innerHTML='<option value="all">All</option>';entries.forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option)});select.value=[...select.options].some(option=>option.value===previous)?previous:'all';select.dataset.finalPlacementOptions=signature;
  }
  function applyFilters(){
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{
      const label=String(row.getAttribute('aria-label')||'').toLowerCase();
      const visible=(filters.aspect==='all'||label.includes(filters.aspect))&&(filters.placement==='all'||row.dataset.leftPlacement===filters.placement||row.dataset.rightPlacement===filters.placement)&&(filters.houseA==='all'||row.dataset.leftHouse===filters.houseA)&&(filters.houseB==='all'||row.dataset.rightHouse===filters.houseB);
      row.classList.toggle('sky-chart-filter-hidden',!visible);
      document.querySelectorAll(`[data-layer="aspects"] [data-relation-index="${row.dataset.relationIndex}"]`).forEach(node=>node.classList.toggle('sky-chart-filter-hidden',!visible));
    });
  }
  function labelAxes(){
    const svg=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');if(!svg)return;
    const labels={asc:'Ascendant',dsc:'Descendant',mc:'MC · Midheaven',ic:'IC'};
    const desired=[];svg.querySelectorAll('[data-layer="placements"] > g[data-placement]').forEach(group=>{
      const id=String(group.dataset.placement||'').toLowerCase();if(!labels[id])return;
      const match=(group.getAttribute('transform')||'').match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)/);if(!match)return;
      desired.push({x:String(Number(match[1])+20),y:String(Number(match[2])-18),fill:group.dataset.sky==='A'?'#c9211e':'#2462d0',label:labels[id]});
    });
    const signature=JSON.stringify(desired);if(svg.dataset.finalAxisLabels===signature)return;
    svg.querySelectorAll('.sky-axis-label').forEach(node=>node.remove());desired.forEach(item=>{const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x',item.x);text.setAttribute('y',item.y);text.setAttribute('class','sky-axis-label');text.setAttribute('fill',item.fill);text.textContent=item.label;svg.appendChild(text)});svg.dataset.finalAxisLabels=signature;
  }
  function hideAspectBoxes(){document.querySelectorAll('.sky-foundation-aspect-hit,[data-layer="aspects"] rect').forEach(node=>{node.setAttribute('fill','transparent');node.setAttribute('stroke','transparent');node.style.outline='none'})}
  function refresh(){
    queued=false;['A','B'].forEach(slot=>{addHeaderActions(slot);addEditorControls(slot);completeRecord(slot)});
    addFilters();refreshPlacementFilter();applyFilters();labelAxes();hideAspectBoxes();
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(refresh)}
  function start(){
    const root=document.getElementById('skyFoundationRoot');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    window.addEventListener('relphi:sky-foundation-ready',schedule);window.addEventListener('relphi:sky-foundation-interactions-ready',schedule);window.addEventListener('storage',schedule);schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
