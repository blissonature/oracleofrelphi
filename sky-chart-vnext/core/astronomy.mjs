import{norm,placement,houseFor}from'./model.mjs';

const BODIES=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const rad=value=>Number(value)*Math.PI/180;
const deg=value=>Number(value)*180/Math.PI;
const signedDifference=(a,b)=>((Number(a)-Number(b)+540)%360)-180;

export function astronomyLongitude(A,bodyName,date){
  if(bodyName==='Moon'&&typeof A.EclipticGeoMoon==='function')return norm(A.EclipticGeoMoon(date).lon);
  return norm(A.Ecliptic(A.GeoVector(bodyName,date,true)).elon);
}
export function siderealDegrees(A,date,longitude){return norm(A.SiderealTime(date)*15+Number(longitude||0))}
export function obliquity(A,date){return Number(A.e_tilt(date).tobl)}
export function ascendantLongitude(A,date,latitude,longitude){
  const theta=rad(siderealDegrees(A,date,longitude)),phi=rad(latitude),epsilon=rad(obliquity(A,date));
  return norm(deg(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(epsilon)+Math.tan(phi)*Math.sin(epsilon)))+180);
}
export function midheavenLongitude(A,date,longitude){
  const theta=rad(siderealDegrees(A,date,longitude)),epsilon=rad(obliquity(A,date));
  return norm(deg(Math.atan2(Math.sin(theta),Math.cos(theta)*Math.cos(epsilon))));
}
export function solarAltitudeFromGeometry(sunLongitude,obliquityDegrees,localSiderealDegrees,latitude){
  const lambda=rad(sunLongitude),epsilon=rad(obliquityDegrees),phi=rad(latitude);
  const rightAscension=norm(deg(Math.atan2(Math.sin(lambda)*Math.cos(epsilon),Math.cos(lambda))));
  const declination=Math.asin(Math.sin(epsilon)*Math.sin(lambda));
  const hourAngle=rad(signedDifference(localSiderealDegrees,rightAscension));
  const sineAltitude=Math.sin(phi)*Math.sin(declination)+Math.cos(phi)*Math.cos(declination)*Math.cos(hourAngle);
  return deg(Math.asin(Math.max(-1,Math.min(1,sineAltitude))));
}
export function solarAltitudeDegrees(A,date,latitude,longitude,sunLongitude){
  return solarAltitudeFromGeometry(sunLongitude,obliquity(A,date),siderealDegrees(A,date,longitude),latitude);
}
export function julianCenturies(date){return((date.getTime()/86400000+2440587.5)-2451545)/36525}
export function meanNode(date){const T=julianCenturies(date);return norm(125.04452-1934.136261*T+0.0020708*T*T+(T*T*T)/450000)}
export function meanLilith(date){
  const T=julianCenturies(date),perigee=83.3532465+4069.0137287*T-0.01032*T*T-(T*T*T)/80053+(T*T*T*T)/18999000;
  return norm(perigee+180);
}
export function vertexLongitude(A,date,latitude,longitude){
  const lat=Number(latitude),lon=Number(longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon))return NaN;
  const armc=norm(A.SiderealTime(date)*15+lon),epsilon=obliquity(A,date),x=norm(armc-90),poleLatitude=lat>=0?90-lat:-90-lat;
  const numerator=Math.sin(rad(x)),denominator=Math.cos(rad(epsilon))*Math.cos(rad(x))-Math.sin(rad(epsilon))*Math.tan(rad(poleLatitude));
  let vertex=norm(deg(Math.atan2(numerator,denominator)));
  if(Math.abs(lat)<=epsilon){
    const mc=norm(deg(Math.atan2(Math.sin(rad(armc)),Math.cos(rad(armc))*Math.cos(rad(epsilon)))));
    if(signedDifference(vertex,mc)>0)vertex=norm(vertex+180);
  }
  return vertex;
}

function requireEngines(){
  const A=window.Astronomy,H=window.RelphiHouseSystems;
  if(!A)throw new Error('Astronomy Engine is unavailable.');
  if(!H?.calculateCusps)throw new Error('House calculation engine is unavailable.');
  return{A,H};
}

export function calculateSky({name='Unsaved sky',instant,localDateTime='',latitude,longitude,location='',timeZone='',houseSystem='whole-sign',source='vnext'}){
  const{A,H}=requireEngines(),date=instant instanceof Date?instant:new Date(instant),lat=Number(latitude),lon=Number(longitude);
  if(Number.isNaN(date.getTime()))throw new Error('The chart instant is invalid.');
  if(!Number.isFinite(lat)||lat<-90||lat>90)throw new Error('Latitude must be between −90 and 90.');
  if(!Number.isFinite(lon)||lon<-180||lon>180)throw new Error('Longitude must be between −180 and 180.');
  const placements={};
  for(const body of BODIES)placements[body]=placement(body,astronomyLongitude(A,body,date),{source:'astronomy-engine'});
  const asc=ascendantLongitude(A,date,lat,lon),mc=midheavenLongitude(A,date,lon);
  placements.Ascendant=placement('Ascendant',asc,{source:'calculated-angle'});
  placements.Descendant=placement('Descendant',asc+180,{source:'derived-angle'});
  placements.Midheaven=placement('Midheaven',mc,{source:'calculated-angle'});
  placements['Imum Coeli']=placement('Imum Coeli',mc+180,{source:'derived-angle'});
  placements['North Node']=placement('North Node',meanNode(date),{source:'mean-node'});
  placements['South Node']=placement('South Node',placements['North Node'].longitude+180,{source:'mean-node-opposition'});
  placements.Lilith=placement('Lilith',meanLilith(date),{source:'mean-lunar-apogee'});
  const vertex=vertexLongitude(A,date,lat,lon);if(Number.isFinite(vertex))placements.Vertex=placement('Vertex',vertex,{source:'prime-vertical-swiss'});

  const houses=H.calculateCusps({system:houseSystem,ascendant:asc,midheaven:mc,siderealDegrees:siderealDegrees(A,date,lon),obliquityDegrees:obliquity(A,date),latitude:lat});
  const cusps=Array.isArray(houses?.cusps)&&houses.cusps.length===12?houses.cusps.map(norm):Array.from({length:12},(_,i)=>norm(Math.floor(asc/30)*30+i*30));
  const day=solarAltitudeDegrees(A,date,lat,lon,placements.Sun.longitude)>0;
  placements['Part of Fortune']=placement('Part of Fortune',day?asc+placements.Moon.longitude-placements.Sun.longitude:asc+placements.Sun.longitude-placements.Moon.longitude,{source:day?'day-fortune':'night-fortune'});
  for(const item of Object.values(placements))item.house=houseFor(item.longitude,cusps);

  const cleanName=String(name||'Unsaved sky').trim()||'Unsaved sky';
  return{
    name:cleanName,title:cleanName,displayName:cleanName,skyName:cleanName,placements,houseCusps:cusps,
    metadata:{name:cleanName,title:cleanName},
    calcProfile:{
      name:cleanName,title:cleanName,dateTime:localDateTime,instant:date.toISOString(),latitude:String(lat),longitude:String(lon),location,timeZone,
      houseSystem:houses?.system||houseSystem,houseCusps:cusps,cusps,houseSystemNote:houses?.note||'',source,
      extraPoints:{nodes:'mean',lilith:'mean',vertex:'calculated',partOfFortune:'calculated',chiron:'not-provided'}
    }
  };
}

function parseLocalDateTime(value){
  const match=String(value||'').trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if(!match)throw new Error('Choose an exact date and time.');
  const parts={year:Number(match[1]),month:Number(match[2]),day:Number(match[3]),hour:Number(match[4]),minute:Number(match[5]),second:Number(match[6]||0)};
  const stamp=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second);
  const check=new Date(stamp);
  if(check.getUTCFullYear()!==parts.year||check.getUTCMonth()+1!==parts.month||check.getUTCDate()!==parts.day||check.getUTCHours()!==parts.hour||check.getUTCMinutes()!==parts.minute||check.getUTCSeconds()!==parts.second)throw new Error('The date and time are invalid.');
  return{...parts,stamp};
}
function zoneFormatter(timeZone){
  try{return new Intl.DateTimeFormat('en-US-u-ca-gregory',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'})}
  catch{throw new Error('Enter a valid IANA time zone, such as America/Denver.')}
}
function zonedParts(formatter,date){
  const values={};
  for(const part of formatter.formatToParts(date))if(part.type!=='literal')values[part.type]=Number(part.value);
  return{year:values.year,month:values.month,day:values.day,hour:values.hour,minute:values.minute,second:values.second};
}
function sameLocal(left,right){return left.year===right.year&&left.month===right.month&&left.day===right.day&&left.hour===right.hour&&left.minute===right.minute&&left.second===right.second}
export function exactInstant(localDateTime,timeZone){
  const desired=parseLocalDateTime(localDateTime),zone=String(timeZone||'').trim();
  if(!zone)throw new Error('Enter an IANA time zone, such as America/Denver.');
  const formatter=zoneFormatter(zone),target=desired.stamp;
  let instant=target;
  for(let pass=0;pass<4;pass++){
    const shown=zonedParts(formatter,new Date(instant));
    const shownStamp=Date.UTC(shown.year,shown.month-1,shown.day,shown.hour,shown.minute,shown.second);
    const delta=target-shownStamp;
    if(delta===0)break;
    instant+=delta;
  }
  const result=new Date(instant),verified=zonedParts(formatter,result);
  if(!sameLocal(desired,verified))throw new Error('That local clock time does not exist in the selected time zone because of a daylight-saving transition.');
  return result;
}

function currentPosition(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('Current location is unavailable in this browser.'));
    navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  });
}
export async function currentLocationPacket(){
  const position=await currentPosition(),latitude=Number(position.coords.latitude),longitude=Number(position.coords.longitude);
  const [placeResult,zoneResult]=await Promise.allSettled([
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=10&addressdetails=1`,{headers:{Accept:'application/json'}}).then(response=>response.ok?response.json():{}),
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&timezone=auto&current=temperature_2m`,{headers:{Accept:'application/json'}}).then(response=>response.ok?response.json():{})
  ]);
  const place=placeResult.status==='fulfilled'?placeResult.value:{},zone=zoneResult.status==='fulfilled'?zoneResult.value:{},address=place.address||{};
  const location=place.display_name||[address.city||address.town||address.village||address.county,address.state,address.country].filter(Boolean).join(', ')||`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  const timeZone=String(zone.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'');
  if(!timeZone)throw new Error('The current location did not resolve to a time zone.');
  return{latitude,longitude,location,timeZone};
}
export async function calculateHereNow(houseSystem='whole-sign'){
  const packet=await currentLocationPacket(),instant=new Date(),formatter=new Intl.DateTimeFormat('sv-SE',{timeZone:packet.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
  const localDateTime=formatter.format(instant).replace(' ','T');
  return calculateSky({name:'Now',instant,localDateTime,...packet,houseSystem,source:'here-now-vnext'});
}
