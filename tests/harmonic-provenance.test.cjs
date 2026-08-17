const assert=require('assert');
const core=require('../relphi-collective-harmonics-core-v1.js');
const provenance=require('../relphi-harmonic-provenance-v1.js');
const records=longitudes=>longitudes.map((longitude,index)=>({id:`p${index}`,name:`P${index}`,longitude}));

const triangle=core.metric(records([0,120,240]),3,1);
const tri=provenance.analyze(triangle,'single');
assert.strictEqual(tri.recognizedCount,3,'triangle should expose three primitive threefold links');
assert.strictEqual(tri.participantCount,3,'triangle should involve three placements');
assert.strictEqual(tri.componentCount,1,'triangle should be one connected component');
assert.strictEqual(tri.cycleRank,1,'triangle should contain one independent loop');
assert.strictEqual(tri.hub.degree,2,'each triangle placement should participate in two links');

const left=records([0,90]);
const right=records([0,90]);
const cross=core.crossMetric(left,right,4,1);
const anatomy=provenance.analyze(cross,'cross');
assert.strictEqual(anatomy.recognizedCount,2,'cross-field square family should expose two primitive cross-links');
assert.strictEqual(anatomy.participantCount,4,'two disjoint cross-links should involve four side-qualified placements');
assert.strictEqual(anatomy.componentCount,2,'two disjoint cross-links should remain separate components');
assert.strictEqual(anatomy.isolatedLinks,2,'both components should be isolated links');
assert.strictEqual(anatomy.cycleRank,0,'disjoint cross-links should not create a loop');

console.log('harmonic provenance topology controls: pass');
