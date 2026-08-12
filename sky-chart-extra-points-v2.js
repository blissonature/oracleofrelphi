// Complete derived chart points without replacing imported ephemeris values.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyExtraPointsV2)return;
  window.__relphiSkyExtraPointsV2=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  let running=false,queued=false;
  const norm=value=>((Number(value)%360)+360)%360;
  const rad=value=>Number(value)*Math.PI/180;
  const deg=value=>Number(value)*180/Math.PI;
  const signedDifference=(a,b)=>((Number(a)-Number(b)+540)%360)-180;
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
  function placement(name,longitude,source){
    const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),minutes=(within-degree)*60,minute=Math.floor(minutes),second=Math.round((minutes-minute)*60);
    return{name,longitude:value,sign:SIGNS[signIndex],degree,minute,second,source};
  }
  function sourceOf(payload){
    if(!payload||typeof payload!=='object')return{};
    if(payload.placements&&typeof payload.placements==='object'&&!Array.isArray(payload.placements))return payload.placements;
    payload.placements={};return payload.placements;
  }
  function findEntry(source,names){
    const wanted=names.map(name=>String(name).toLowerCase().replace(/[^a-z0-9]/g,''));
    return Object.entries(source).find(([key,item])=>wanted.includes(String(item?.name||item?.label||key).toLowerCase().replace(/[^a-z0-9]/g,'')))||null;
  }
  function find(source,names){return findEntry(source,names)?.[1]||null}
  function julianCenturies(date){return((date.getTime()/86400000+2440587.5)-2451545)/36525}
  function meanNode(date){const T=julianCenturies(date);return norm(125.04452-1934.136261*T+0.0020708*T*T+(T*T*T)/450000)}
  function meanLilith(date){
    const T=julianCenturies(date);
    const perigee=83.3532465+4069.0137287*T-0.01032*T*T-(T*T*T)/80053+(T*T*T*T)/18999000;
    return norm(perigee+180);
  }

  // Standard tropical Vertex geometry, equivalent to Swiss Ephemeris' Vertex construction:
  // use local ARMC minus 90 degrees with the complementary geographic latitude.
  // The earlier implementation intersected the local-north plane with the ecliptic and
  // selected the intersection nearest the Descendant; that produced the wrong point.
  function vertexLongitude(date,latitude,longitude){
    if(!window.Astronomy)return NaN;
    const lat=Number(latitude),lon=Number(longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))return NaN;
    const armc=norm(window.Astronomy.SiderealTime(date)*15+lon);
    const epsilon=Number(window.Astronomy.e_tilt(date).tobl);
    if(!Number.isFinite(armc)||!Number.isFinite(epsilon))return NaN;

    const x=norm(armc-90);
    const poleLatitude=lat>=0?90-lat:-90-lat;
    const numerator=Math.sin(rad(x));
    const denominator=Math.cos(rad(epsilon))*Math.cos(rad(x))-Math.sin(rad(epsilon))*Math.tan(rad(poleLatitude));
    let vertex=norm(deg(Math.atan2(numerator,denominator)));

    // At tropical latitudes Swiss Ephemeris keeps the Vertex on the western hemisphere.
    if(Math.abs(lat)<=epsilon){
      const mc=norm(deg(Math.atan2(Math.sin(rad(armc)),Math.cos(rad(armc))*Math.cos(rad(epsilon)))));
      if(signedDifference(vertex,mc)>0)vertex=norm(vertex+180);
    }
    return vertex;
  }

  function houseFor(value,cusps){for(let index=0;index<12;index++){const start=norm(cusps[index]),span=norm(cusps[(index+1)%12]-start)||30;if(norm(Number(value)-start)<span)return index+1}return 12}
  function enrich(payload){
    if(!payload)return false;
    const before=JSON.stringify(payload),placements=sourceOf(payload),profile=payload.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
    const asc=find(placements,['Ascendant','ASC','Rising']),mc=find(placements,['Midheaven','Medium Coeli','MC']),sun=find(placements,['Sun']),moon=find(placements,['Moon']);
    const explicitInstantRaw=profile.instant||profile.dateTime||payload.instant||payload.dateTime;
    const explicitInstant=explicitInstantRaw?new Date(explicitInstantRaw):null;
    const hasExplicitInstant=!!(explicitInstant&&!Number.isNaN(explicitInstant.getTime()));
    const instant=hasExplicitInstant?explicitInstant:new Date();
    if(asc&&Number.isFinite(Number(asc.longitude))&&!find(placements,['Descendant','DSC']))placements.Descendant=placement('Descendant',Number(asc.longitude)+180,'derived-angle');
    if(mc&&Number.isFinite(Number(mc.longitude))&&!find(placements,['IC','Imum Coeli']))placements['Imum Coeli']=placement('Imum Coeli',Number(mc.longitude)+180,'derived-angle');
    if(!find(placements,['North Node','True Node','Mean Node']))placements['North Node']=placement('North Node',meanNode(instant),'mean-node');
    if(!find(placements,['South Node']))placements['South Node']=placement('South Node',Number(find(placements,['North Node']).longitude)+180,'mean-node-opposition');

    // Lilith is time-dependent. Never silently use Date.now() for a sky that has no chart instant,
    // and always refresh values that this module previously derived as the mean lunar apogee.
    const lilithEntry=findEntry(placements,['Lilith','Black Moon Lilith']);
    const lilith=lilithEntry?.[1]||null;
    const lilithWasDerived=!!(lilith&&(lilith.source==='mean-lunar-apogee'||profile.extraPoints?.lilith==='mean'));
    if(hasExplicitInstant&&(!lilith||lilithWasDerived)){
      const key=lilithEntry?.[0]||'Lilith';
      placements[key]=placement('Lilith',meanLilith(explicitInstant),'mean-lunar-apogee');
    }else if(!hasExplicitInstant&&lilithWasDerived&&lilithEntry){
      delete placements[lilithEntry[0]];
    }

    // Vertex is fully determined by the chart instant and geographic coordinates.
    // Recalculate it whenever those inputs are available so an old derived Vertex cannot survive
    // a change of date/location. If the required inputs disappear, remove only our own derived value.
    const vertexEntry=findEntry(placements,['Vertex']);
    const vertex=vertexEntry?.[1]||null;
    const vertexWasDerived=!!(vertex&&['prime-vertical','prime-vertical-swiss'].includes(vertex.source));
    const latitude=Number(profile.latitude),longitude=Number(profile.longitude);
    const hasVertexInputs=hasExplicitInstant&&Number.isFinite(latitude)&&Number.isFinite(longitude)&&!!window.Astronomy;
    if(hasVertexInputs){
      const value=vertexLongitude(explicitInstant,latitude,longitude);
      if(Number.isFinite(value)){
        const key=vertexEntry?.[0]||'Vertex';
        placements[key]=placement('Vertex',value,'prime-vertical-swiss');
      }
    }else if(vertexWasDerived&&vertexEntry){
      delete placements[vertexEntry[0]];
    }

    if(!find(placements,['Part of Fortune'])&&asc&&sun&&moon){
      let day=true;try{if(window.SunCalc&&Number.isFinite(Number(profile.latitude))&&Number.isFinite(Number(profile.longitude)))day=window.SunCalc.getPosition(instant,Number(profile.latitude),Number(profile.longitude)).altitude>0}catch(_){}
      placements['Part of Fortune']=placement('Part of Fortune',day?Number(asc.longitude)+Number(moon.longitude)-Number(sun.longitude):Number(asc.longitude)+Number(sun.longitude)-Number(moon.longitude),day?'day-fortune':'night-fortune');
    }
    const cusps=profile.houseCusps||profile.cusps||payload.houseCusps;if(Array.isArray(cusps)&&cusps.length===12)Object.values(placements).forEach(item=>{if(Number.isFinite(Number(item?.longitude)))item.house=houseFor(Number(item.longitude),cusps)});
    const finalLilith=find(placements,['Lilith','Black Moon Lilith']);
    const finalVertex=find(placements,['Vertex']);
    profile.extraPoints={
      nodes:'mean',
      lilith:finalLilith?(finalLilith.source==='mean-lunar-apogee'?'mean':'provided'):'not-provided',
      vertex:finalVertex?(finalVertex.source==='prime-vertical-swiss'?'calculated':'provided'):'not-provided',
      partOfFortune:'calculated',
      chiron:find(placements,['Chiron'])?'provided':'not-provided'
    };
    payload.calcProfile=profile;
    return before!==JSON.stringify(payload);
  }
  function run(){
    queued=false;if(running)return;running=true;
    try{let changed=false;Object.values(KEYS).forEach(key=>{const payload=read(key);if(payload&&enrich(payload)){write(key,payload);changed=true}});if(changed)window.dispatchEvent(new Event('storage'))}finally{running=false}
  }
  function schedule(){if(queued||running)return;queued=true;requestAnimationFrame(run)}
  function start(){window.addEventListener('relphi:sky-foundation-ready',schedule);window.addEventListener('storage',schedule);schedule()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();