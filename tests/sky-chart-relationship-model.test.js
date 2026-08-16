const assert=require('node:assert/strict');
const engine=require('../sky-chart-harmonic-engine-v1.js');
const modelApi=require('../sky-chart-relationship-model-v1.js');

const placement=(id,value,sign,house,velocity)=>({id,value,sign,house,velocity,entry:{id,name:id.toUpperCase()}});
const model=modelApi.build({
  leftPlacements:[placement('mars',0,0,1,1)],
  rightPlacements:[placement('saturn',90,3,7,0)],
  phaseWindow:engine.maxWindow
});

const square=model.relationships.find(relationship=>relationship.aspect.id==='square');
assert.ok(square,'the finite model must contain the exact square');
assert.equal(square.id,'A:mars|square|B:saturn');
assert.equal(model.byId.get(square.id),square);
assert.equal(square.continuous.directedSeparation,90);
assert.equal(square.interval.targetAngle,90);
assert.equal(square.harmonic.order,4);
assert.equal(square.harmonic.numerator,1);
assert.equal(square.harmonic.denominator,4);
assert.equal(square.harmonic.phaseError,0);
assert.equal(square.context.leftHouse,1);
assert.equal(square.context.rightHouse,7);
assert.equal(square.representations.angular.aspectId,'square');
assert.equal(square.representations.musical,null);
assert.equal(square.representations.spectral,null);
assert.equal(square.evidence.geometry,'mathematical');
assert.equal(square.evidence.eventPrediction,'empirically-unsupported');
assert.equal(square.temporal.available,true);
assert.equal(model.constitution.finite,true);
assert.ok(model.constitution.aspectIds.length>0);
assert.ok(Object.isFrozen(square));
assert.ok(Object.isFrozen(square.harmonic));

const internal=modelApi.build({
  leftPlacements:[placement('mars',0,0,1,1),placement('saturn',90,3,7,0),placement('mc',180,6,10,0)],
  mode:'internal',
  leftSky:'A',
  rightSky:'A',
  phaseWindow:engine.maxWindow,
  pairFilter:(left,right)=>left.id!=='mc'&&right.id!=='mc'
});
const internalSquare=internal.relationships.find(relationship=>relationship.aspect.id==='square');
assert.equal(internal.mode,'internal');
assert.equal(internalSquare.id,'A:mars|square|A:saturn');
assert.equal(internalSquare.left.sky,'A');
assert.equal(internalSquare.right.sky,'A');
assert.ok(internal.relationships.every(relationship=>relationship.left.id!==relationship.right.id));
assert.ok(internal.relationships.every(relationship=>relationship.left.id!=='mc'&&relationship.right.id!=='mc'));

console.log('Sky Chart relationship model contract passed.');
