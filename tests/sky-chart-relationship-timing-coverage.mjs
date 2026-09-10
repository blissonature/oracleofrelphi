import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const DAY=86400000;
const center=new Date('2026-09-10T18:00:00Z');
const daysFromCenter=date=>(new Date(date).getTime()-center.getTime())/DAY;
const payload={
  calcProfile:{instant:center.toISOString(),latitude:40.7608,longitude:-111.8910},
  placements:{
    Venus:{name:'Venus',glyphId:'venus',longitude:210.3},
    Chiron:{name:'Chiron',glyphId:'chiron',longitude:30.3},
    Sun:{name:'Sun',glyphId:'sun',longitude:170},
    Moon:{name:'Moon',glyphId:'moon',longitude:260},
    Fortune:{name:'Part of Fortune',glyphId:'part-of-fortune',longitude:350}
  }
};
const storage=new Map([
  ['relphiSkyChartA','null'],
  ['relphiSkyChartB',JSON.stringify(payload)]
]);
const names={venus:'Venus',chiron:'Chiron',sun:'Sun',moon:'Moon','part-of-fortune':'Part of Fortune'};
const registry={
  resolve(id){const key=String(id||'').trim().toLowerCase();return key?{id:key,name:names[key]||key}:null},
  get(id){return this.resolve(id)}
};
const bodyBase={Sun:170,Venus:210.3};
const bodySpeed={Sun:.9856,Venus:1.2};
const Astronomy={
  Body:{Sun:'Sun',Moon:'Moon',Mercury:'Mercury',Venus:'Venus',Mars:'Mars',Jupiter:'Jupiter',Saturn:'Saturn',Uranus:'Uranus',Neptune:'Neptune',Pluto:'Pluto'},
  GeoVector(body,date){return{body,date:new Date(date)}},
  Ecliptic(vector){const base=bodyBase[vector.body]??0,speed=bodySpeed[vector.body]??.5;return{elon:base+speed*daysFromCenter(vector.date)}},
  EclipticGeoMoon(date){return{lon:260+13.1764*daysFromCenter(date)}},
  SiderealTime(date){const hours=10+24.0657098244*daysFromCenter(date);return((hours%24)+24)%24},
  e_tilt(){return{tobl:23.4393}}
};
const documentStub={
  readyState:'loading',
  addEventListener(){},
  querySelector(){return null},
  querySelectorAll(){return[]},
  getElementById(){return null},
  createElement(){return{style:{},append(){},appendChild(){},setAttribute(){},replaceChildren(){}}},
  head:{appendChild(){}}
};
const context={
  console,Date,Math,Number,String,Object,Array,Set,Map,WeakMap,JSON,Intl,
  location:{pathname:'/sky-chart.html'},
  localStorage:{getItem:key=>storage.get(key)??null},
  document:documentStub,
  MutationObserver:class{observe(){} disconnect(){}},
  requestAnimationFrame:()=>0,
  setTimeout:()=>0,
  clearTimeout:()=>{},
  performance:{now:()=>0}
};
context.window=context;
context.window.Astronomy=Astronomy;
context.window.SunCalc={getPosition(){return{altitude:1}}};
context.window.RelphiGlyphRegistry=registry;
context.window.RelphiHarmonicOrb={defaultWindow:6,byId:id=>id==='opposition'?{harmonic:2}:null};
context.window.RelphiHarmonicOrb.byId={opposition:{harmonic:2}};
context.window.RelphiChironEphemeris={
  calculateSync(date){return{longitude:30.3+.05*daysFromCenter(date)}},
  ready:async()=>true
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('sky-chart-relationship-transit-meta-v4.js','utf8'),context,{filename:'sky-chart-relationship-transit-meta-v4.js'});
const api=context.window.RelphiRelationshipTransitMeta;
assert.ok(api?.exportTimingForRow,'timing API should install');

function row(left,right){return{
  isConnected:true,
  dataset:{
    relationshipMode:'B-B',
    relationIndex:`${left}-${right}`,
    aspect:'opposition',
    harmonicOrder:'2',
    leftPlacement:left,
    rightPlacement:right,
    leftSky:'B',
    rightSky:'B'
  }
}}

const chironTiming=api.exportTimingForRow(row('venus','chiron'));
assert.equal(chironTiming.kind,'dynamic',`Venus–Chiron timing should be dynamic, got ${JSON.stringify(chironTiming)}`);
assert.ok(Number.isFinite(chironTiming.startMs)&&Number.isFinite(chironTiming.endMs)&&chironTiming.endMs>chironTiming.startMs,'Venus–Chiron should have a bounded activation window');

const fortuneTiming=api.exportTimingForRow(row('part-of-fortune','sun'));
assert.equal(fortuneTiming.kind,'dynamic',`Part of Fortune timing should be dynamic, got ${JSON.stringify(fortuneTiming)}`);
assert.ok(Number.isFinite(fortuneTiming.startMs)&&Number.isFinite(fortuneTiming.endMs)&&fortuneTiming.endMs>fortuneTiming.startMs,'Part of Fortune should have a bounded activation window');

console.log('relationship timing coverage passed for Chiron and Part of Fortune');
