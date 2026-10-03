// Shared Chiron ephemeris service for calculated Sky Chart payloads.
// Chiron is propagated locally with Astronomy Engine's GravitySimulator.
// The seed orbit is JPL Small-Body Database solution data, not Swiss Ephemeris.
(function(){
'use strict';
if(window.RelphiChironEphemeris)return;

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const DAY=86400000;
const STEP_DAYS=10;
const ANCHOR_DAYS=365.25;
const EPOCH=new Date('2026-06-08T00:00:00Z');
// JPL SBDB osculating elements for (2060) Chiron at JD 2461200.5 TDB.
// Values retrieved from the 2026 JPL solution: a=13.68426761 au,
// e=.37976563, i=6.93057447°, node=209.29612586131°,
// peri=339.28783265897°, M=216.71989660181°.
// These are converted once to an EQJ heliocentric state vector, then Astronomy
// Engine supplies Sun/planet perturbations during propagation.
const ELEMENTS=Object.freeze({
  a:13.68426761,e:.37976563,i:6.93057447,node:209.29612586131,
  peri:339.28783265897,M:216.71989660181
});
const SOURCE='JPL SBDB + Astronomy Engine GravitySimulator';
const anchorCache=new Map();

const norm=value=>((Number(value)%360)+360)%360;
const rad=value=>Number(value)*Math.PI/180;
function astronomy(){
  const A=window.Astronomy;
  if(!A?.GravitySimulator||!A?.StateVector||!A?.Rotation_ECL_EQJ||!A?.RotateState||!A?.Ecliptic)throw new Error('Astronomy Engine GravitySimulator is unavailable.');
  return A;
}
function validateDate(date){
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw new Error('Chiron requires a valid chart instant.');
  const year=date.getUTCFullYear();
  if(year<1800||year>=2400)throw new Error('Chiron calculation currently requires a chart date from 1800 through 2399.');
}
function eccentricAnomaly(mean,e){
  let E=mean;
  for(let i=0;i<16;i+=1){
    const delta=(E-e*Math.sin(E)-mean)/(1-e*Math.cos(E));
    E-=delta;
    if(Math.abs(delta)<1e-14)break;
  }
  return E;
}
function rotateOrbital(x,y,z,node,i,peri){
  const cw=Math.cos(peri),sw=Math.sin(peri),ci=Math.cos(i),si=Math.sin(i),cO=Math.cos(node),sO=Math.sin(node);
  const x1=cw*x-sw*y,y1=sw*x+cw*y,z1=z;
  const x2=x1,y2=ci*y1-si*z1,z2=si*y1+ci*z1;
  return{x:cO*x2-sO*y2,y:sO*x2+cO*y2,z:z2};
}
function seedState(){
  const A=astronomy(),a=ELEMENTS.a,e=ELEMENTS.e,E=eccentricAnomaly(rad(ELEMENTS.M),e);
  const root=Math.sqrt(1-e*e),n=.01720209895/Math.pow(a,1.5),dEdt=n/(1-e*Math.cos(E));
  const position=rotateOrbital(a*(Math.cos(E)-e),a*root*Math.sin(E),0,rad(ELEMENTS.node),rad(ELEMENTS.i),rad(ELEMENTS.peri));
  const velocity=rotateOrbital(-a*Math.sin(E)*dEdt,a*root*Math.cos(E)*dEdt,0,rad(ELEMENTS.node),rad(ELEMENTS.i),rad(ELEMENTS.peri));
  const ecl=new A.StateVector(position.x,position.y,position.z,velocity.x,velocity.y,velocity.z,EPOCH);
  return A.RotateState(A.Rotation_ECL_EQJ(),ecl);
}
function cloneState(state,date){
  const A=astronomy();
  return new A.StateVector(state.x,state.y,state.z,state.vx,state.vy,state.vz,date);
}
function anchorDate(index){return new Date(EPOCH.getTime()+index*ANCHOR_DAYS*DAY)}
function propagate(state,startDate,endDate){
  const A=astronomy(),sim=new A.GravitySimulator(A.Body.Sun,startDate,[cloneState(state,startDate)]);
  const direction=endDate>=startDate?1:-1;
  let cursor=startDate.getTime(),last=sim.Update(startDate)[0];
  while(direction*(endDate.getTime()-cursor)>1){
    const remaining=Math.abs(endDate.getTime()-cursor)/DAY;
    const days=Math.min(STEP_DAYS,remaining);
    cursor+=direction*days*DAY;
    last=sim.Update(new Date(cursor))[0];
  }
  return{state:last,sim};
}
function ensureAnchor(index){
  if(anchorCache.has(index))return anchorCache.get(index);
  if(!anchorCache.size)anchorCache.set(0,Object.freeze({date:EPOCH,state:seedState()}));
  const direction=index>0?1:-1;
  let current=0;
  while(current!==index){
    const next=current+direction;
    if(!anchorCache.has(next)){
      const from=anchorCache.get(current),date=anchorDate(next),result=propagate(from.state,from.date,date);
      anchorCache.set(next,Object.freeze({date,state:result.state}));
    }
    current=next;
  }
  return anchorCache.get(index);
}
function stateAt(date){
  validateDate(date);
  const index=Math.round((date.getTime()-EPOCH.getTime())/(ANCHOR_DAYS*DAY));
  const anchor=ensureAnchor(index);
  return propagate(anchor.state,anchor.date,date);
}
function geocentricLongitude(date){
  const A=astronomy(),result=stateAt(date),chiron=result.state,earth=result.sim.SolarSystemBodyState(A.Body.Earth);
  const vector=new A.Vector(chiron.x-earth.x,chiron.y-earth.y,chiron.z-earth.z,date);
  const ecliptic=A.Ecliptic(vector);
  if(!Number.isFinite(Number(ecliptic?.elon)))throw new Error('Astronomy Engine did not return a Chiron longitude.');
  return norm(ecliptic.elon);
}
function placementObject(longitude){
  const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);
  return{name:'Chiron',id:'chiron',glyphId:'chiron',longitude:value,sign:SIGNS[signIndex],degree,minute,second,source:'jpl-sbdb-astronomy-engine'};
}
function source(payload){
  if(!payload||typeof payload!=='object')return null;
  if(payload.placements&&typeof payload.placements==='object'&&!Array.isArray(payload.placements))return payload.placements;
  payload.placements={};return payload.placements;
}
function hasChiron(placements){
  return Object.entries(placements||{}).some(([key,item])=>String(item?.name||item?.label||item?.id||key).toLowerCase().replace(/[^a-z0-9]/g,'')==='chiron');
}
function instantFor(payload){
  const p=payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{},raw=p.instant||p.dateTime||payload?.instant||payload?.dateTime;
  if(!raw)return null;
  const date=new Date(raw);
  return Number.isFinite(date.getTime())?date:null;
}
function calculateSync(date){validateDate(date);return placementObject(geocentricLongitude(date))}
async function calculate(date){return calculateSync(date)}
async function ready(){astronomy();ensureAnchor(0);return true}
async function completePayload(payload){
  const placements=source(payload);
  if(!placements||hasChiron(placements))return false;
  const instant=instantFor(payload);
  if(!instant)return false;
  placements.Chiron=calculateSync(instant);
  const profile=payload.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
  profile.extraPoints={...(profile.extraPoints||{}),chiron:'calculated',chironSource:SOURCE};
  payload.calcProfile=profile;
  return true;
}

window.RelphiChironEphemeris=Object.freeze({calculate,calculateSync,ready,isReady:()=>true,completePayload,hasChiron,source:SOURCE});
})();
