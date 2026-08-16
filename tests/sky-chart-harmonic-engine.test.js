const assert=require('node:assert/strict');
const engine=require('../sky-chart-harmonic-engine-v1.js');

const close=(actual,expected,tolerance=1e-9,message='values differ')=>assert.ok(Math.abs(actual-expected)<=tolerance,`${message}: ${actual} !== ${expected}`);
const aspect=(id,angle,numerator,denominator)=>({id,angle,numerator,denominator,harmonic:denominator});

assert.equal(engine.normalizeAngle(-1),359);
assert.equal(engine.normalizeAngle(361),1);
assert.equal(engine.smallestCircularSeparation(359,1),2);
assert.equal(engine.smallestCircularSeparation(1,359),2);
assert.deepEqual(engine.reduceFraction(2,8),{numerator:1,denominator:4});
assert.deepEqual(engine.reduceFraction(3,8),{numerator:3,denominator:8});

for(const [id,angle,order,numerator] of [
  ['conjunction',0,1,0],['opposition',180,2,1],['trine',120,3,1],['square',90,4,1],
  ['quintile',72,5,1],['bi-quintile',144,5,2],['octile',45,8,1],['tri-octile',135,8,3],
  ['semi-sextile',30,12,1],['quincunx',150,12,5]
]){
  const definition=engine.byId(id);
  assert.equal(definition.denominator,order,`${id} fundamental denominator`);
  assert.equal(definition.numerator,numerator,`${id} numerator/mode`);
  const exact=engine.metrics(angle,definition,6);
  assert.equal(exact.phaseError,0,`${id} exact phase`);
  assert.equal(exact.coherence,1,`${id} exact coherence`);
}

for(const [name,numerator] of [['septile',1],['biseptile',2],['triseptile',3]]){
  const definition=aspect(name,360*numerator/7,numerator,7);
  const exact=engine.metrics(definition.angle,definition,6);
  assert.equal(exact.harmonicOrder,7);
  assert.equal(exact.harmonicNumerator,numerator);
  assert.equal(exact.phaseError,0);
}

const square=engine.byId('square');
assert.equal(engine.metrics(60,'semi-sextile',6).admitted,false,'finite aspects must not alias after phase scaling');
assert.equal(engine.metrics(60,'semi-sextile',6).phaseError,360);
close(engine.metrics(91,square,6).phaseError,4);
close(engine.metrics(89,square,6).signedPhaseError,-4);
assert.equal(engine.metrics(91.5,square,6).admitted,true,'admission boundary');
assert.equal(engine.metrics(91.5-1e-6,square,6).admitted,true,'just inside boundary');
assert.equal(engine.metrics(91.5+1e-6,square,6).admitted,false,'just outside boundary');

close(engine.metrics(90.375,square,6).coherence,Math.cos(Math.PI/8)**2,1e-9,'quarter-window coherence');
close(engine.metrics(90.75,square,6).coherence,.5,1e-9,'mid-window coherence');
close(engine.metrics(91.125,square,6).coherence,Math.cos(3*Math.PI/8)**2,1e-9,'three-quarter coherence');
close(engine.metrics(91.5,square,6).coherence,0,1e-9,'edge coherence');

const squareError=engine.metrics(91,square,12);
const applying=engine.motion(squareError,0,-1);
assert.equal(applying.applying,true);
assert.equal(applying.separating,false);
close(applying.timeToExactitudeDays,1,1e-9,'time-to-exactitude invariance');
const separating=engine.motion(squareError,0,1);
assert.equal(separating.applying,false);
assert.equal(separating.separating,true);
close(separating.timeToExactitudeDays,1,1e-9,'separating time-to-exactitude invariance');

console.log('Sky Chart harmonic engine contract passed.');
