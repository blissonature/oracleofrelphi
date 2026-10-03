// Local Chiron ephemeris evaluator. Data are precomputed from NASA/JPL Horizons;
// runtime calculation is interpolation only, never orbital integration or network I/O.
(function(){
'use strict';
if(window.RelphiChironLocalEphemeris)return;
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
let samples=null;
const norm=v=>((v%360)+360)%360;
function data(){const d=window.RelphiChironEphemerisData;if(!d)throw new Error('Local Chiron ephemeris data are unavailable.');if(!samples){samples=new Float64Array(d.deltas.length);let n=0;for(let i=0;i<d.deltas.length;i++){n+=d.deltas[i];samples[i]=n/d.scale;}}return d;}
function julianDay(date){return date.getTime()/86400000+2440587.5;}
function cubic(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);}
function longitudeAt(date){if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw new Error('Chiron requires a valid chart instant.');const d=data(),x=(julianDay(date)-d.startJD)/d.stepDays,i=Math.floor(x),t=x-i;if(i<1||i+2>=samples.length)throw new Error('Chiron date is outside the local ephemeris range.');return norm(cubic(samples[i-1],samples[i],samples[i+1],samples[i+2],t));}
function placementObject(longitude){const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);return{name:'Chiron',id:'chiron',glyphId:'chiron',longitude:value,sign:SIGNS[signIndex],degree,minute,second,source:'jpl-horizons-local-ephemeris'};}
function source(payload){if(!payload||typeof payload!=='object')return null;if(payload.placements&&typeof payload.placements==='object'&&!Array.isArray(payload.placements))return payload.placements;payload.placements={};return payload.placements;}
function hasChiron(placements){return Object.entries(placements||{}).some(([key,item])=>String(item?.name||item?.label||item?.id||key).toLowerCase().replace(/[^a-z0-9]/g,'')==='chiron');}
function instantFor(payload){const p=payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{},raw=p.instant||p.dateTime||payload?.instant||payload?.dateTime;if(!raw)return null;const date=new Date(raw);return Number.isFinite(date.getTime())?date:null;}
function calculate(date){return placementObject(longitudeAt(date));}
async function completePayload(payload){const placements=source(payload);if(!placements||hasChiron(placements))return false;const instant=instantFor(payload);if(!instant)return false;placements.Chiron=calculate(instant);const profile=payload.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};profile.extraPoints={...(profile.extraPoints||{}),chiron:'calculated',chironSource:'NASA/JPL Horizons local ephemeris'};payload.calcProfile=profile;return true;}
window.RelphiChironLocalEphemeris=Object.freeze({calculate,completePayload,hasChiron,longitudeAt});
})();