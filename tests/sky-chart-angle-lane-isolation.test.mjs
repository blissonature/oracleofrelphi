import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const specSource=fs.readFileSync(path.join(root,'sky-chart-wheel-spec-v1.js'),'utf8');
const foundation=fs.readFileSync(path.join(root,'sky-chart-foundation-v2.js'),'utf8');
const context={window:{}};
vm.runInNewContext(specSource,context,{filename:'sky-chart-wheel-spec-v1.js'});
const spec=context.window.RelphiSkyWheelSpec;
const cmp=spec.comparison;

test('comparison wheel owns explicit non-overlapping placement and angle lanes',()=>{
  assert.deepEqual([...cmp.inner.placement],[287,299,283]);
  assert.deepEqual([...cmp.outer.placement],[450,440,460]);
  assert.deepEqual([...cmp.inner.angle],[202,220,238]);
  assert.deepEqual([...cmp.outer.angle],[540,522,504]);
  assert.equal(cmp.inner.edge,166);
  assert.equal(cmp.outer.edge,574);
  assert.equal(cmp.angleGap,17);
});

test('placement and Angle lanes remain inside their assigned annuli',()=>{
  const angleHalf=19+1.2,clearance=6;
  for(const role of [cmp.inner,cmp.outer]){
    for(const lane of role.placement)assert.ok(lane>role.inner&&lane<role.outer,`placement lane ${lane} outside annulus`);
    for(const lane of role.angle)assert.ok(lane-angleHalf-clearance>role.inner&&lane+angleHalf+clearance<role.outer,`angle lane ${lane} does not clear annulus`);
  }
});

test('foundation v2 consumes the shared lane contract and preserves exact longitude metadata',()=>{
  assert.match(foundation,/function geometry\(slot\)\{return spec\(\)\?\.role\?\.\(slot\)\|\|null\}/);
  assert.match(foundation,/for\(const lane of g\.angle\|\|\[\]\)/);
  assert.match(foundation,/'data-angle-lane':chosen\.lane/);
  assert.match(foundation,/'data-angle-longitude':record\.value\.toFixed\(8\)/);
  assert.match(foundation,/'data-exact-longitude':record\.value\.toFixed\(8\)/);
  assert.match(foundation,/'data-axis-edge-radius':g\.edge/);
  assert.match(foundation,/'data-display-longitude':record\.value\.toFixed\(8\)/);
});
