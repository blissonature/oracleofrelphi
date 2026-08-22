export const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
export const SIGN_IDS=SIGNS.map(value=>value.toLowerCase());
export const BODY_ORDER=['Sun','Moon','Ascendant','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','North Node','South Node','Lilith','Part of Fortune','Vertex','Midheaven','Descendant','Imum Coeli','Chiron'];
export const ANGLES=new Set(['Ascendant','Descendant','Midheaven','Imum Coeli']);
export const PLACEMENT_GROUPS=Object.freeze({
  luminaries:['Sun','Moon'],
  planets:['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'],
  angles:['Ascendant','Descendant','Midheaven','Imum Coeli'],
  points:['North Node','South Node','Lilith','Part of Fortune','Vertex','Chiron']
});
export const ASPECTS=[
  {id:'conjunction',label:'Conjunction',angle:0},
  {id:'semi-sextile',label:'Semi-sextile',angle:30},
  {id:'octile',label:'Octile',angle:45},
  {id:'sextile',label:'Sextile',angle:60},
  {id:'quintile',label:'Quintile',angle:72},
  {id:'square',label:'Square',angle:90},
  {id:'trine',label:'Trine',angle:120},
  {id:'tri-octile',label:'Tri-octile',angle:135},
  {id:'bi-quintile',label:'Bi-quintile',angle:144},
  {id:'quincunx',label:'Quincunx',angle:150},
  {id:'opposition',label:'Opposition',angle:180}
];

const CANONICAL_ALIASES=new Map([
  ['asc','Ascendant'],['ascendant','Ascendant'],['rising','Ascendant'],
  ['dsc','Descendant'],['desc','Descendant'],['descendant','Descendant'],
  ['mc','Midheaven'],['midheaven','Midheaven'],['medium coeli','Midheaven'],
  ['ic','Imum Coeli'],['imum coeli','Imum Coeli'],['imumcoeli','Imum Coeli'],
  ['north node','North Node'],['true node','North Node'],['mean node','North Node'],['node','North Node'],
  ['south node','South Node'],['black moon lilith','Lilith'],['lilith','Lilith'],
  ['fortune','Part of Fortune'],['part of fortune','Part of Fortune'],['pof','Part of Fortune'],['vertex','Vertex']
]);

export const norm=value=>((Number(value)%360)+360)%360;
export const signedDifference=(a,b)=>((Number(a)-Number(b)+540)%360)-180;
export const separation=(a,b)=>Math.abs(signedDifference(a,b));
export const normalizeName=value=>String(value??'').trim().toLowerCase().replace(/\s+/g,' ');

export function canonicalName(value){
  const raw=String(value??'').trim();
  if(!raw)return'';
  return CANONICAL_ALIASES.get(raw.toLowerCase())||raw;
}

export function canonicalId(value){
  return canonicalName(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

export function isAngle(value){return ANGLES.has(canonicalName(typeof value==='string'?value:value?.name||value?.id||''))}

export function longitudeOf(item){
  if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
  const sign=SIGNS.findIndex(value=>value.toLowerCase()===String(item?.sign||item?.zodiac||'').trim().toLowerCase());
  if(sign<0)return NaN;
  return norm(sign*30+Number(item?.degree??item?.degrees??0)+Number(item?.minute??item?.minutes??0)/60+Number(item?.second??item?.seconds??0)/3600);
}

export function placement(name,longitude,extra={}){
  const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30;
  const degree=Math.floor(within),minutes=(within-degree)*60,minute=Math.floor(minutes),second=Math.round((minutes-minute)*60);
  return{...extra,name:canonicalName(name),longitude:value,sign:SIGNS[signIndex],degree,minute,second};
}

export function placementSource(payload){
  if(!payload||typeof payload!=='object')return{};
  const source=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'&&!Array.isArray(value));
  if(source)return source;
  return Object.fromEntries(Object.entries(payload).filter(([key,value])=>value&&typeof value==='object'&&!Array.isArray(value)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(value.longitude))||value.sign||value.zodiac)));
}

export function placementEntries(payload){
  const result=[];
  for(const [key,item] of Object.entries(placementSource(payload))){
    const longitude=longitudeOf(item);
    if(!Number.isFinite(longitude))continue;
    const name=canonicalName(item?.name||item?.label||item?.body||item?.planet||item?.point||key);
    result.push({...item,name,id:canonicalId(name),longitude});
  }
  return result.sort((a,b)=>{
    const left=BODY_ORDER.indexOf(a.name),right=BODY_ORDER.indexOf(b.name);
    return(left<0?999:left)-(right<0?999:right)||a.longitude-b.longitude;
  });
}

export function houseFor(longitude,cusps){
  if(!Array.isArray(cusps)||cusps.length!==12)return null;
  const value=norm(longitude);
  for(let index=0;index<12;index++){
    const start=norm(cusps[index]),span=norm(cusps[(index+1)%12]-start)||30;
    if(norm(value-start)<span)return index+1;
  }
  return 12;
}

export function skyCusps(payload){
  const profile=payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
  for(const candidate of [profile.houseCusps,profile.cusps,payload?.houseCusps,payload?.cusps]){
    if(Array.isArray(candidate)&&candidate.length===12&&candidate.every(value=>Number.isFinite(Number(value))))return candidate.map(norm);
  }
  return null;
}

export function normalizeSky(payload){
  if(!payload||typeof payload!=='object')return null;
  const source=placementEntries(payload);
  if(!source.length)return null;
  const placements=Object.fromEntries(source.map(item=>[item.name,placement(item.name,item.longitude,item)]));
  const profile=payload.calcProfile&&typeof payload.calcProfile==='object'?{...payload.calcProfile}:{};
  const metadata=payload.metadata&&typeof payload.metadata==='object'?{...payload.metadata}:{};
  const name=String(payload.name||payload.displayName||payload.skyName||payload.title||metadata.savedSkyName||'Unsaved sky').trim()||'Unsaved sky';
  const cusps=skyCusps(payload);
  if(cusps){profile.houseCusps=cusps;profile.cusps=cusps}
  return{...payload,name,title:name,displayName:name,skyName:name,placements,metadata,calcProfile:profile,houseCusps:cusps||payload.houseCusps||null};
}

export function skySignature(payload){
  const sky=normalizeSky(payload);if(!sky)return'';
  const profile=sky.calcProfile||{};
  return JSON.stringify({
    placements:placementEntries(sky).map(item=>[normalizeName(item.name),Number(item.longitude.toFixed(7)),!!item.retrograde]),
    instant:String(profile.instant||sky.instant||''),
    latitude:String(profile.latitude??sky.latitude??''),longitude:String(profile.longitude??sky.longitude??''),
    timeZone:String(profile.timeZone??sky.timeZone??''),location:String(profile.location??sky.location??''),
    houseSystem:String(profile.houseSystem??sky.houseSystem??''),cusps:skyCusps(sky)?.map(value=>Number(value.toFixed(7)))||null
  });
}

export function coordinateText(longitude){
  const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60+1e-9);
  return`${degree}°${String(minute).padStart(2,'0')}′ ${SIGNS[signIndex]}`;
}

export function aspectBetween(left,right,orbLimit=3){
  const distance=separation(left.longitude,right.longitude);
  let best=null;
  for(const aspect of ASPECTS){
    const orb=Math.abs(distance-aspect.angle);
    if(orb<=orbLimit&&(!best||orb<best.orb))best={...aspect,orb,distance};
  }
  return best;
}

function relation(leftSlot,left,rightSlot,right,aspect,scope){
  const aspectId=aspect.id;
  return{...aspect,aspectId,id:`${leftSlot}:${left.id}|${rightSlot}:${right.id}|${aspectId}`,scope,left:{slot:leftSlot,...left},right:{slot:rightSlot,...right}};
}
function withinRelationships(sky,slot,orbLimit){
  const entries=placementEntries(sky),result=[];
  for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
    const aspect=aspectBetween(entries[i],entries[j],orbLimit);if(aspect)result.push(relation(slot,entries[i],slot,entries[j],aspect,`${slot}-${slot}`));
  }
  return result;
}
function betweenRelationships(skyA,skyB,orbLimit){
  const a=placementEntries(skyA),b=placementEntries(skyB),result=[];
  for(const left of a)for(const right of b){const aspect=aspectBetween(left,right,orbLimit);if(aspect)result.push(relation('A',left,'B',right,aspect,'A-B'))}
  return result;
}
const sortRelationships=result=>result.sort((x,y)=>x.orb-y.orb||x.angle-y.angle||x.left.name.localeCompare(y.left.name)||x.right.name.localeCompare(y.right.name));

export function calculateRelationshipPool(skyA,skyB,orbLimit=3){
  if(!skyA)return[];
  const result=[...withinRelationships(skyA,'A',orbLimit)];
  if(skyB)result.push(...betweenRelationships(skyA,skyB,orbLimit),...withinRelationships(skyB,'B',orbLimit));
  return sortRelationships(result);
}

export function calculateRelationships(skyA,skyB,orbLimit=3){
  if(!skyA)return[];
  return sortRelationships(skyB?betweenRelationships(skyA,skyB,orbLimit):withinRelationships(skyA,'A',orbLimit));
}
