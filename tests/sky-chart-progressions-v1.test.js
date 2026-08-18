const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../sky-chart-progressions-core-v1.js');

test('secondary progression maps one tropical year of life to one ephemeris day',()=>{
  const epoch=Date.UTC(2000,0,1,12),target=epoch+core.YEAR;
  assert.ok(Math.abs(core.secondaryProgressedMs(epoch,target)-(epoch+core.DAY))<1);
});

test('secondary progression maps thirty years to thirty ephemeris days',()=>{
  const epoch=Date.UTC(1990,5,1,0),target=epoch+30*core.YEAR;
  assert.ok(Math.abs(core.secondaryProgressedMs(epoch,target)-(epoch+30*core.DAY))<1);
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
