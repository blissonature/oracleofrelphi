import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const foundation = fs.readFileSync(path.join(root, 'sky-chart-foundation-v1.js'), 'utf8');

test('crowded placement and angle layouts degrade locally instead of aborting the foundation', () => {
  assert.doesNotMatch(foundation, /throw new Error\(`\[Sky Chart placement layout\] No legal ordinary-placement lane/);
  assert.doesNotMatch(foundation, /throw new Error\(`\[Sky Chart Angle layout\] No legal radial lane/);
  assert.match(foundation, /data-placement-lane-fallback/);
  assert.match(foundation, /data-angle-lane-fallback/);
  assert.match(foundation, /angleCollisionState = 'radial-fallback'/);
  assert.match(foundation, /angleCollisionState = 'crowded-fallback'/);
});

test('angle fallback preserves exact longitude and only searches radial positions', () => {
  assert.match(foundation, /const point = polar\(radius,record\.value\)/);
  assert.match(foundation, /'data-exact-longitude':record\.value\.toFixed\(8\)/);
  assert.match(foundation, /'data-angle-longitude':record\.value\.toFixed\(8\)/);
  assert.match(foundation, /for \(let radius = maximum; radius >= minimum; radius -= 2\)/);
  assert.match(foundation, /for \(let radius = minimum; radius <= maximum; radius \+= 2\)/);
});
