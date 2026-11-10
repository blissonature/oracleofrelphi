import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const angular=(a,b)=>Math.abs(((a-b+540)%360)-180);
const near=(a,b,tolerance=.12)=>assert.ok(angular(a,b)<tolerance, `expected ${a} to match ${b} within ${tolerance}°`);
function engine(){
 const sandbox={window:{}};
 vm.runInNewContext(read('relphi-house-systems.js'),sandbox);
 return sandbox.window.RelphiHouseSystems;
}
const natal={
 system:'placidus',ascendant:168.383341031,midheaven:76.287724834,
 latitude:42.427,obliquityDegrees:23.44319206,siderealDegrees:75.106718055
};
const swiss=[168.38,193.01,222.62,256.29,290.60,321.70,348.38,13.01,42.62,76.29,110.60,141.70];
function houseOf(lon,cusps){
 const norm=n=>((n%360)+360)%360;
 return 1+cusps.findIndex((start,i)=>norm(lon-start)<(norm(cusps[(i+1)%12]-start)||30));
}
test('1985 natal Placidus cusps match independent Swiss Ephemeris reference',()=>{
 const cusps=engine().calculateCusps(natal).cusps;
 cusps.forEach((c,i)=>near(c,swiss[i]));
 assert.equal(houseOf(195,cusps),2,'Libra 15 Sun belongs in second');
 assert.equal(houseOf(206+10/60,cusps),2,'Libra 26 Mercury belongs in second');
 assert.equal(houseOf(118+25/60,cusps),11,'Cancer 28 Moon belongs in eleventh');
 assert.equal(houseOf(307+9/60,cusps),5,'Aquarius 7 Jupiter belongs in fifth');
 assert.equal(houseOf(235+34/60,cusps),3,'Scorpio 25 Saturn belongs in third');
 assert.equal(houseOf(74+29/60,cusps),9,'Gemini 14 Chiron belongs in ninth');
});
test('Placidus house cusps follow MC even when stored sidereal metadata is stale',()=>{
 const houses=engine(),correct=houses.calculateCusps(natal).cusps;
 const stale=houses.calculateCusps({...natal,siderealDegrees:120}).cusps;
 stale.forEach((c,i)=>near(c,correct[i],1e-7));
});
test('Porphyry calculation remains independent of sidereal metadata',()=>{
 const h=engine();
 const a=h.calculateCusps({...natal,system:'porphyry'}).cusps;
 const b=h.calculateCusps({...natal,system:'porphyry',siderealDegrees:120}).cusps;
 a.forEach((value,i)=>near(value,b[i],1e-7));
});
test('missing Chiron is restored with exact chart time and existing Chiron is untouched',()=>{
 const storage=new Map();
 const A={placements:{Sun:{name:'Sun',longitude:195}},calcProfile:{instant:'1985-10-08T08:37:00.000Z'}};
 const B={placements:{Chiron:{name:'Chiron',longitude:28.4,retrograde:true,source:'imported'}},calcProfile:{instant:'2026-11-02T22:10:00.000Z'}};
 storage.set('relphiSkyChartA',JSON.stringify(A));storage.set('relphiSkyChartB',JSON.stringify(B));
 const calls=[];
 const sandbox={
  location:{pathname:'/sky-chart.html'},console,Date,JSON,Object,Number,String,
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
  requestAnimationFrame(){},addEventListener(){},
  RelphiChironEphemeris:{
   hasChiron:p=>Object.values(p||{}).some(x=>x.name==='Chiron'),
   instantFor:p=>new Date(p.calcProfile.instant),
   calculate:instant=>{calls.push(instant.toISOString());return {name:'Chiron',longitude:74.483333,retrograde:true,source:'jpl-horizons-local-ephemeris'}}
  }
 };
 sandbox.window=sandbox;
 vm.runInNewContext(read('sky-chart-chiron-completeness-v1.js'),sandbox);
 const updated=JSON.parse(storage.get('relphiSkyChartA'));
 assert.equal(updated.placements.Chiron.longitude,74.483333);
 assert.equal(updated.placements.Chiron.retrograde,true);
 assert.equal(updated.placements.Chiron.source,'jpl-horizons-local-ephemeris');
 assert.deepEqual(JSON.parse(storage.get('relphiSkyChartB')).placements.Chiron,B.placements.Chiron);
 assert.deepEqual(calls,['1985-10-08T08:37:00.000Z']);
});
