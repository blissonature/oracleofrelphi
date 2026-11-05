import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const source=fs.readFileSync(new URL('../sky-chart-unknown-day-motion-v1.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../sky-chart.html',import.meta.url),'utf8');
function fixture(){
  let altitude=1;
  const storage={};
  const astronomy={
    SiderealTime(date){return ((date.getTime()/3600000)*1.0027379)%24},
    e_tilt(){return{tobl:23.44}},
    EclipticGeoMoon(date){return{lon:(350+date.getTime()/3600000*.55)%360}},
    GeoVector(name,date){return{name,date}},
    Ecliptic({name,date}){return{elon:(name==='Sun'?15:50)+date.getTime()/3600000*.1}}
  };
  const window={
    Astronomy:astronomy,
    SunCalc:{getPosition(){return {altitude}}},
    RelphiHarmonicOrb:{
      aspects:[{id:'conjunction',angle:0,harmonic:1,color:'#f00'},{id:'opposition',angle:180,harmonic:2,color:'#00f'}],
      getWindow(){return 5},
      metrics(distance,aspect,max){const err=Math.abs(distance-aspect.angle)*aspect.harmonic;return{active:err<=max,phaseError:err,ordinaryOrb:Math.abs(distance-aspect.angle),coherence:Math.max(0,1-err/max)}}
    }
  };
  const localStorage={getItem(key){return storage[key]||null}};
  const document={readyState:'loading',addEventListener(){}};
  vm.runInNewContext(source,{window,document,localStorage,location:{pathname:'/sky-chart.html'},console,Date,Map,Set,Object,Number,Math,Intl,requestAnimationFrame(){},cancelAnimationFrame(){}},{filename:'sky-chart-unknown-day-motion-v1.js'});
  return {api:window.RelphiSkyUnknownDayMotion,storage,setAltitude:n=>{altitude=n}};
}
test('unknown-time day module loads after foundation and prior interpolator',()=>{
  const i=html.indexOf('sky-chart-unknown-day-motion-v1.js?v=1');
  assert.ok(i>html.indexOf('sky-chart-foundation-v2.js')&&i>html.indexOf('sky-chart-interpolated-motion-v1.js'));
});
test('moving Ascendant, MC and Vertex rotate; their opposites remain exact',()=>{
  const {api}=fixture();
  const morning=api.angles(0,40.7608,-111.891,15,300),afternoon=api.angles(3600000*4,40.7608,-111.891,15,300);
  assert.ok(Math.abs(morning.asc-afternoon.asc)>2);
  assert.ok(Math.abs(morning.mc-afternoon.mc)>2);
  assert.ok(Math.abs(morning.vertex-afternoon.vertex)>2);
  assert.ok(Math.abs(((morning.dsc-morning.asc+360)%360)-180)<1e-8);
  assert.ok(Math.abs(((morning['anti-vertex']-morning.vertex+360)%360)-180)<1e-8);
});
test('Fortune follows day/night formula using the time-appropriate Asc, Moon and Sun',()=>{
  const {api,setAltitude}=fixture();
  const day=api.angles(0,40.7608,-111.891,15,300);
  const expectedDay=((day.asc+300-15)%360+360)%360;
  assert.ok(Math.abs(expectedDay-day['part-of-fortune'])<1e-8);
  setAltitude(-1);
  const night=api.angles(0,40.7608,-111.891,15,300);
  const expectedNight=((night.asc+15-300)%360+360)%360;
  assert.ok(Math.abs(expectedNight-night['part-of-fortune'])<1e-8);
  assert.ok(Math.abs(day['part-of-fortune']-night['part-of-fortune'])>1);
});
test('time scrub computes actual Moon and derived points, no hypothetical instant is saved',()=>{
  const {api,storage}=fixture();
  storage.relphiSkyChartA=JSON.stringify({placements:{Sun:{longitude:15},Moon:{longitude:350}},calcProfile:{dateTime:'2026-10-21',instant:'',timeUnknown:true,latitude:'40.7608',longitude:'-111.891',timeZone:'America/Denver'}});
  const site={slot:'A',lat:40.7608,lon:-111.891};
  const before=storage.relphiSkyChartA;
  const first=api.positionAt(0,site),after=api.positionAt(3600000,site);
  for(const id of ['moon','asc','dsc','mc','ic','vertex','anti-vertex','part-of-fortune'])assert.ok(Number.isFinite(first[id]),id);
  assert.notEqual(first.moon,after.moon);
  assert.notEqual(first.asc,after.asc);
  assert.equal(storage.relphiSkyChartA,before);
  assert.doesNotMatch(source,/localStorage\.setItem/);
});
test('aspects use current harmonic window and A↔B matrix choices',()=>{
  const {api,storage}=fixture();
  storage.relphiSkyChartA=JSON.stringify({calcProfile:{timeUnknown:true},placements:{}});
  storage.relphiSkyChartB=JSON.stringify({calcProfile:{timeUnknown:false},placements:{Moon:{longitude:45}}});
  let relations=api.aspects({slot:'A'},{moon:45,asc:225});
  assert.ok(relations.some(x=>x.scope==='A-B'&&x.aspect.id==='conjunction'&&x.left==='moon'));
  storage.relphiSkyAspectMatrixV1=JSON.stringify({'A-A':['opposition'],'A-B':['opposition'],'B-B':[]});
  relations=api.aspects({slot:'A'},{moon:45,asc:225});
  assert.ok(!relations.some(x=>x.aspect.id==='conjunction'));
  assert.ok(relations.some(x=>x.aspect.id==='opposition'));
});
