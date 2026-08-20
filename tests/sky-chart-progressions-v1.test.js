const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../sky-chart-progressions-core-v1.js');

test('Progressions calendar model draws the selected target date directly',()=>{
  const epoch=Date.UTC(1985,9,8,10,37),target=Date.UTC(1985,10,8,10,37);
  assert.equal(core.secondaryProgressedMs(epoch,target),target);
  assert.equal(core.calendarSkyMs(target),target);
});

test('calendar target conversion is reversible without day-for-year scaling',()=>{
  const epoch=Date.UTC(1985,9,8,10,37),target=Date.UTC(2026,7,20,8,0);
  const ephemeris=core.secondaryProgressedMs(epoch,target);
  assert.equal(core.targetMsFromProgressedMs(epoch,ephemeris),target);
});

test('ingress and egress windows respect direction of motion',()=>{
  assert.equal(core.signState(60.4,1,1).kind,'ingress');
  assert.equal(core.signState(89.4,1,1).kind,'egress');
  assert.equal(core.signState(89.4,-1,1).kind,'ingress');
  assert.equal(core.signState(60.4,-1,1).kind,'egress');
});

test('aspect error wraps correctly across zero Aries',()=>{
  assert.equal(core.aspectError(359,1,0),2);
  assert.equal(core.aspectError(10,100,90),0);
});

test('intra relationships do not duplicate endpoint pairs',()=>{
  const records=[{id:'sun',value:0},{id:'moon',value:90},{id:'mars',value:180}];
  const rows=core.activeRelationships(records,records,.01,{mode:'intra',aspects:[{id:'square',angle:90}]});
  assert.equal(rows.length,2);
  assert.deepEqual(rows.map(row=>[row.left.id,row.right.id]),[['sun','moon'],['moon','mars']]);
});
