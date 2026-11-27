import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const window={};const document={readyState:'loading',addEventListener(){}};vm.runInNewContext(fs.readFileSync(new URL('../sky-chart-coordinate-precision-v1.js',import.meta.url),'utf8'),{window,document,location:{pathname:'/sky-chart.html'}});const {format,longitude}=window.RelphiSkyCoordinatePrecision;
test('coordinates retain arcseconds and unrounded longitude remains authoritative',()=>{const mars=167+52/60+59/3600,asc=168+22/60+1/3600,venus=169+53/60+13/3600;assert.equal(format(mars).text,'17°52′59″');assert.equal(format(asc).text,'18°22′01″');assert.equal(format(venus).text,'19°53′13″');assert.equal((asc-mars).toFixed(2),'0.48');assert.equal((venus-asc).toFixed(2),'1.52');assert.equal((venus-mars).toFixed(2),'2.00');assert.equal(longitude({longitude:mars,sign:'Aries',degree:0,minute:0}),mars);assert.ok(Math.abs(longitude({sign:'Virgo',degree:17,minute:52,second:59})-mars)<1e-10);});
test('minute carry, sign boundary and zero',()=>{assert.equal(format(10+59/60+59.8/3600).text,'10°59′59″');assert.equal(format(29.999999).full,'29°59′59″ Aries');assert.equal(format(30).full,'0°00′00″ Taurus');assert.equal(format(360).full,'0°00′00″ Aries');assert.equal(format(10+12/60+59.8/3600).text,'10°13′00″');});
