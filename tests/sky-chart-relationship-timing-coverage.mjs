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
    Mars:{name:'Mars',glyphId:'mars',longitude:208.2968846},
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
const names={venus:'Venus',mars:'Mars',chiron:'Chiron',sun:'Sun',moon:'Moon','part-of-fortune':'Part of Fortune'};
const registry={
  resolve(id){const key=String(id||'').trim().toLowerCase();return key?{id:key,name:names[key]||key}:null},
  get(id){return this.resolve(id)}
};
const bodyBase={Sun:170,Venus:210.3,Mars:208.2968846};
const bodySpeed={Sun:.9856,Venus:1.2,Mars:.6};
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
  querySelector(selector){return selector==='[data-harmonic-window-input]'&&context.testHarmonicWindow!=null?{value:String(context.testHarmonicWindow)}:null},
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
context.window.RelphiChironEphemeris={
  longitudeAt(date){return 30.3+.05*daysFromCenter(date)}
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

// A six-decimal Harmonic Window must agree with the six-decimal phase used
// by the relationship row. The underlying saved coordinates intentionally carry
// another four ten-millionths of a degree beyond that rendered precision.
context.testHarmonicWindow=2.003115;
const boundaryRow=row('venus','mars');
boundaryRow.dataset.aspect='conjunction';
boundaryRow.dataset.harmonicOrder='1';
boundaryRow.dataset.phaseError='2.003115';
const boundaryTiming=api.exportTimingForRow(boundaryRow);
assert.equal(boundaryTiming.kind,'dynamic',
  'Boundary conjunction shown at 2.003115° must be timed within Harmonic Window 2.003115°');
assert.ok(boundaryTiming.startMs<=center.getTime()&&boundaryTiming.endMs>=center.getTime(),
  'The chart moment must fall inside the returned timing interval');
context.testHarmonicWindow=2.003114;
const excludedTiming=api.exportTimingForRow(boundaryRow);
assert.equal(excludedTiming.kind,'unavailable',
  'An actually smaller window must exclude the conjunction');
assert.equal(excludedTiming.reason,'Outside the current Harmonic Window.',
  'The outside-window message remains valid for genuine exclusions');

console.log('relationship timing coverage passed for Chiron, Part of Fortune, and six-decimal conjunction boundaries');
