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
console.log('Configuration Harmonic Window and house geometry guards passed.');
