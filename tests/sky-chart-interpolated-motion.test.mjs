import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const source=fs.readFileSync(new URL('../sky-chart-interpolated-motion-v1.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../sky-chart.html',import.meta.url),'utf8');
const STEP=30*60*1000;
function fixture(){
  const window={Astronomy:{
    EclipticGeoMoon(date){return {lon:359+2*date.getTime()/STEP}},
    GeoVector(name,date){return {name,date}},
    Ecliptic(value){return {elon:value.name==='Mercury'?12-3*value.date.getTime()/STEP:44+value.date.getTime()/STEP}}
  }};
  const document={readyState:'loading',addEventListener(){}};
  vm.runInNewContext(source,{window,document,location:{pathname:'/sky-chart.html'},localStorage:{getItem(){return null}},console,Date,Number,Math,Object,Map,Set,Intl,requestAnimationFrame(){},cancelAnimationFrame(){}},{filename:'sky-chart-interpolated-motion-v1.js'});
  return window.RelphiSkyInterpolatedMotion;
}
test('Sky Chart loads the motion module after the foundation and temporal calculation layers',()=>{
  const i=html.indexOf('sky-chart-interpolated-motion-v1.js?v=1');
  assert.ok(i>html.indexOf('sky-chart-foundation-v2.js')&&i>html.indexOf('sky-chart-temporal-motion-v1.js'));
});
test('interpolation crosses Aries zero without reversing direction or taking a 358-degree detour',()=>{
  const motion=fixture();
  assert.equal(motion.interpolateLongitude(359,1,.5),0);
  assert.equal(motion.interpolateLongitude(1,359,.5),0);
  assert.equal(motion.interpolateLongitude(359,1,.25),359.5);
  assert.equal(motion.interpolateLongitude(1,359,.25),.5);
});
test('interpolates between exact Moon samples and keeps retrograde Mercury movement',()=>{
  const motion=fixture();
  assert.equal(motion.sampledLongitude('moon',STEP*.5),0);
  assert.equal(motion.sampledLongitude('mercury',STEP*.5),10.5);
  assert.ok(Math.abs(motion.sampledLongitude('moon',STEP-1)-motion.sampledLongitude('moon',STEP+1))<.00001);
});
test('does not animate unknown-time or write to persisted sky during motion',()=>{
  assert.match(source,/p\.timeUnknown===true/);
  assert.match(source,/read\(slot\)/);
  assert.doesNotMatch(source,/localStorage\.setItem/);
  assert.match(source,/document\.addEventListener\('visibilitychange'/);
  assert.match(source,/relphi:sky-where-when-editor-ready/);
});
