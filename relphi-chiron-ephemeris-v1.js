// Shared Chiron ephemeris service for calculated Sky Chart payloads.
// Uses Swiss Ephemeris asteroid data; it never approximates Chiron from orbital shortcuts.
(function(){
'use strict';
if(window.RelphiChironEphemeris)return;

const MODULE_URL='https://cdn.jsdelivr.net/npm/@swisseph/browser@1.3.1/dist/swisseph-browser.js';
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
let enginePromise=null;

const norm=value=>((Number(value)%360)+360)%360;
function placementObject(longitude){
  const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);
  return{name:'Chiron',id:'chiron',glyphId:'chiron',longitude:value,sign:SIGNS[signIndex],degree,minute,second,source:'swiss-ephemeris-chiron'};
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
async function engine(){
  if(enginePromise)return enginePromise;
  enginePromise=(async()=>{
    const mod=await import(MODULE_URL);
    const swe=new mod.SwissEphemeris();
    await swe.init();
    // Chiron is asteroid 15 and requires the Swiss asteroid ephemeris file.
    await swe.loadStandardEphemeris();
    return{swe,Asteroid:mod.Asteroid,CalculationFlag:mod.CalculationFlag};
  })().catch(error=>{enginePromise=null;throw error});
  return enginePromise;
}
async function calculate(date){
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw new Error('Chiron requires a valid chart instant.');
  const year=date.getUTCFullYear();
  if(year<1800||year>=2400)throw new Error('Chiron calculation currently requires a chart date from 1800 through 2399.');
  const{ swe,Asteroid,CalculationFlag }=await engine();
  const jd=swe.dateToJulianDay(date);
  const result=swe.calculatePosition(jd,Asteroid.Chiron,CalculationFlag.SwissEphemeris);
  if(!Number.isFinite(Number(result?.longitude)))throw new Error('Swiss Ephemeris did not return a Chiron longitude.');
  return placementObject(result.longitude);
}
async function completePayload(payload){
  const placements=source(payload);
  if(!placements||hasChiron(placements))return false;
  const instant=instantFor(payload);
  if(!instant)return false;
  const chiron=await calculate(instant);
  placements.Chiron=chiron;
  const profile=payload.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
  profile.extraPoints={...(profile.extraPoints||{}),chiron:'calculated',chironSource:'Swiss Ephemeris'};
  payload.calcProfile=profile;
  return true;
}

window.RelphiChironEphemeris=Object.freeze({calculate,completePayload,hasChiron});
})();