import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('relphi-house-systems.js','utf8');
const scope={window:{},console,Math};vm.runInNewContext(source,scope);
const engine=scope.window.RelphiHouseSystems;
for(const name of ['whole-sign','equal-house','porphyry']){
 const result=engine.calculateCusps({system:name,ascendant:168,midheaven:75});
 assert.equal(result.cusps.length,12,name+' produces twelve cusps');
}
const config=readFileSync('sky-chart-aspect-configurations-v1.js','utf8');
assert.match(config,/Math\.min\(INEVITABLE_MAX_PHASE,harmonicWindow\(\)\)/,'Completion is bound by Harmonic Window');
assert.match(config,/rawPhase!=null&&rawPhase!==''/,'Missing phase is not treated as zero');
assert.match(source,/out-of-order house cusps/,'Invalid house geometry must fail');
// Independent Placidus reference from Swiss Ephemeris 2.10.03:
// 2026-10-20 12:00 UTC, 40.76 N, -111.89 E (Salt Lake City).
// Ecliptic obliquity, ARMC, ASC and MC are provided explicitly so this
// checks the house cusp calculation rather than astronomical time setup.
const swiss={asc:185.6123306926794,mc:96.4962701406903,armc:97.07479420939391,eps:23.438019716219927,
 cusps:[185.612331,212.092063,242.788891,276.49627,309.968743,340.062832,
   5.612331,32.092063,62.788891,96.49627,129.968743,160.062832]};
const placidus=engine.calculateCusps({system:'placidus',ascendant:swiss.asc,midheaven:swiss.mc,
 siderealDegrees:swiss.armc,obliquityDegrees:swiss.eps,latitude:40.76});
for(let i=0;i<12;i++){
 const delta=Math.abs((placidus.cusps[i]-swiss.cusps[i]+540)%360-180);
 assert.ok(delta<0.12,'Placidus cusp '+(i+1)+' differs from reference by '+delta+'°');
}
assert.ok(((placidus.cusps[1]-placidus.cusps[0]+360)%360)>15,'House 1 must not collapse to a spurious narrow sliver at this latitude');
console.log('Configuration Harmonic Window and house geometry guards passed.');
