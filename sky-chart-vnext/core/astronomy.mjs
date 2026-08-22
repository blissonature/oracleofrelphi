import{SIGNS,norm,placement,houseFor}from'./model.mjs';

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
  const sunHouse=houseFor(placements.Sun.longitude,cusps),day=Number(sunHouse)>=7;
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

let luxonPromise=null;
async function ensureLuxon(){
  if(window.luxon?.DateTime)return window.luxon;
  if(!luxonPromise)luxonPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js';script.async=true;
    script.onload=()=>window.luxon?.DateTime?resolve(window.luxon):reject(new Error('Date-time library did not initialize.'));
    script.onerror=()=>reject(new Error('Date-time library could not be loaded.'));document.head.appendChild(script);
  });
  return luxonPromise;
}
export async function exactInstant(localDateTime,timeZone){
  const raw=String(localDateTime||'').trim(),zone=String(timeZone||'').trim();
  if(!raw)throw new Error('Choose an exact date and time.');
  if(!zone)throw new Error('Enter an IANA time zone, such as America/Denver.');
  const{DateTime}=await ensureLuxon(),value=DateTime.fromISO(raw,{zone,setZone:true});
  if(!value.isValid)throw new Error(value.invalidExplanation||'The date, time, or time zone is invalid.');
  return value.toUTC().toJSDate();
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
