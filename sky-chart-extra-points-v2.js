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
  const distance=(a,b)=>Math.abs(((Number(a)-Number(b)+180)%360+360)%360-180);
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
  function find(source,names){
    const wanted=names.map(name=>String(name).toLowerCase().replace(/[^a-z0-9]/g,''));
    return Object.entries(source).find(([key,item])=>wanted.includes(String(item?.name||item?.label||key).toLowerCase().replace(/[^a-z0-9]/g,'')))?.[1]||null;
  }
  function julianCenturies(date){return((date.getTime()/86400000+2440587.5)-2451545)/36525}
  function meanNode(date){const T=julianCenturies(date);return norm(125.04452-1934.136261*T+0.0020708*T*T+(T*T*T)/450000)}
  function meanLilith(date){
    const T=julianCenturies(date);
    const perigee=83.3532465+4069.0137287*T-0.01032*T*T-(T*T*T)/80053+(T*T*T*T)/18999000;
    return norm(perigee+180);
  }
  function vectorToLongitude(vector,obliquity){
    const yEcliptic=vector.y*Math.cos(rad(obliquity))+vector.z*Math.sin(rad(obliquity));
    return norm(deg(Math.atan2(yEcliptic,vector.x)));
  }
  function vertexLongitude(date,latitude,longitude,ascendant){
    if(!window.Astronomy)return NaN;
    const lst=norm(window.Astronomy.SiderealTime(date)*15+Number(longitude));
    const obliquity=Number(window.Astronomy.e_tilt(date).tobl);
    if(!Number.isFinite(lst)||!Number.isFinite(obliquity)||!Number.isFinite(Number(latitude)))return NaN;
    const L=rad(lst),phi=rad(Math.max(-89.999,Math.min(89.999,Number(latitude))));
    const north={x:-Math.sin(phi)*Math.cos(L),y:-Math.sin(phi)*Math.sin(L),z:Math.cos(phi)};
    const eclipticNormal={x:0,y:-Math.sin(rad(obliquity)),z:Math.cos(rad(obliquity))};
    const line={x:north.y*eclipticNormal.z-north.z*eclipticNormal.y,y:north.z*eclipticNormal.x-north.x*eclipticNormal.z,z:north.x*eclipticNormal.y-north.y*eclipticNormal.x};
    const magnitude=Math.hypot(line.x,line.y,line.z);if(magnitude<1e-9)return NaN;
    const unit={x:line.x/magnitude,y:line.y/magnitude,z:line.z/magnitude};
    const first=vectorToLongitude(unit,obliquity),second=norm(first+180),descendant=norm(Number(ascendant)+180);
    return distance(first,descendant)<=distance(second,descendant)?first:second;
  }
  function houseFor(value,cusps){for(let index=0;index<12;index++){const start=norm(cusps[index]),span=norm(cusps[(index+1)%12]-start)||30;if(norm(Number(value)-start)<span)return index+1}return 12}
  function enrich(payload){
    if(!payload)return false;
    const before=JSON.stringify(payload),placements=sourceOf(payload),profile=payload.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
    const asc=find(placements,['Ascendant','ASC','Rising']),mc=find(placements,['Midheaven','MC']),sun=find(placements,['Sun']),moon=find(placements,['Moon']);
    const instant=new Date(profile.instant||profile.dateTime||Date.now());
    if(asc&&Number.isFinite(Number(asc.longitude))&&!find(placements,['Descendant','DSC']))placements.Descendant=placement('Descendant',Number(asc.longitude)+180,'derived-angle');
    if(mc&&Number.isFinite(Number(mc.longitude))&&!find(placements,['IC','Imum Coeli']))placements.IC=placement('IC',Number(mc.longitude)+180,'derived-angle');
    if(!find(placements,['North Node','True Node','Mean Node']))placements['North Node']=placement('North Node',meanNode(instant),'mean-node');
    if(!find(placements,['South Node']))placements['South Node']=placement('South Node',Number(find(placements,['North Node']).longitude)+180,'mean-node-opposition');
    if(!find(placements,['Lilith','Black Moon Lilith']))placements.Lilith=placement('Lilith',meanLilith(instant),'mean-lunar-apogee');
    if(!find(placements,['Vertex'])&&asc&&Number.isFinite(Number(profile.latitude))&&Number.isFinite(Number(profile.longitude))){const value=vertexLongitude(instant,Number(profile.latitude),Number(profile.longitude),Number(asc.longitude));if(Number.isFinite(value))placements.Vertex=placement('Vertex',value,'prime-vertical')}
    if(!find(placements,['Part of Fortune'])&&asc&&sun&&moon){
      let day=true;try{if(window.SunCalc&&Number.isFinite(Number(profile.latitude))&&Number.isFinite(Number(profile.longitude)))day=window.SunCalc.getPosition(instant,Number(profile.latitude),Number(profile.longitude)).altitude>0}catch(_){}
      placements['Part of Fortune']=placement('Part of Fortune',day?Number(asc.longitude)+Number(moon.longitude)-Number(sun.longitude):Number(asc.longitude)+Number(sun.longitude)-Number(moon.longitude),day?'day-fortune':'night-fortune');
    }
    const cusps=profile.houseCusps||profile.cusps||payload.houseCusps;if(Array.isArray(cusps)&&cusps.length===12)Object.values(placements).forEach(item=>{if(Number.isFinite(Number(item?.longitude)))item.house=houseFor(Number(item.longitude),cusps)});
    profile.extraPoints={nodes:'mean',lilith:'mean',vertex:'calculated',partOfFortune:'calculated',chiron:find(placements,['Chiron'])?'provided':'not-provided'};payload.calcProfile=profile;
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
