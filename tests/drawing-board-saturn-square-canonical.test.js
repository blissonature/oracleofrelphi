const assert = require('node:assert/strict');
const fs = require('node:fs');

const workflow = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const prefabs = fs.readFileSync('drawing-board-spread-prefabs-v1.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

const expected = [
  'Past Mind','Present Mind','Future Mind',
  'Past Body','Present Body','Future Body',
  'Past Spirit','Present Spirit','Future Spirit'
];
const labels = workflow.match(/const SATURN_LABELS = \[([\s\S]*?)\];/);
assert.ok(labels, 'Saturn Square labels must exist');
const actual = [...labels[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
assert.deepEqual(actual, expected, 'workflow must preserve the canonical 3x3 matrix without embedded numbers');
assert.doesNotMatch(labels[1], /The structure|The pressure|The limit|What is tested/);
for (const label of expected) {
  assert.ok(prefabs.includes("'" + label + "'"), 'prefab should agree with workflow: ' + label);
}

const pointsMatch=workflow.match(/const SATURN_POINTS = \[([\s\S]*?)\];/);
assert.ok(pointsMatch,'Saturn Square must define grid coordinates');
const coordinates=[...pointsMatch[1].matchAll(/\[([\d.]+),([\d.]+)\]/g)].map(m=>[Number(m[1]),Number(m[2])]);
assert.equal(coordinates.length,9);
assert.equal(new Set(coordinates.map(p=>p[0])).size,3,'exactly three columns');
assert.equal(new Set(coordinates.map(p=>p[1])).size,3,'exactly three rows');
assert.match(workflow,/transform\(SATURN_POINTS\[index\]\[0\],SATURN_POINTS\[index\]\[1\],\.74\)/);
const cardW=174*.74,cardH=174*866/500*.74;
const xs=[...new Set(coordinates.map(p=>p[0]*900))].sort((a,b)=>a-b);
const ys=[...new Set(coordinates.map(p=>p[1]*760))].sort((a,b)=>a-b);
assert.ok(xs[1]-xs[0]>cardW && xs[2]-xs[1]>cardW,'cards cannot overlap horizontally');
assert.ok(ys[1]-ys[0]>cardH && ys[2]-ys[1]>cardH,'cards cannot overlap vertically');
assert.ok(ys[1]-ys[0]>cardH+24 && ys[2]-ys[1]>cardH+24,'each row must clear the previous card and leave room for its own sticker');
assert.deepEqual(xs,[.245*900,.405*900,.565*900].sort((a,b)=>a-b),'Saturn columns use tighter intended spacing');
assert.deepEqual(ys,[.025*760,.405*760,.785*760].sort((a,b)=>a-b),'Saturn rows reserve more clearance');
assert.ok(xs[1]-xs[0]<.18*900,'columns must be closer than the previous grid');
assert.ok(ys[1]-ys[0]>.36*760,'rows must be farther apart than the previous grid');
assert.match(css, /card-row-item>\\.card-row-position-panel\\{[^}]*bottom:100%!important/,'stickers must be flush with the card edge');
assert.doesNotMatch(css,/bottom:calc\\(100% \\+ \\.32rem\\)!important/,'displaced sticker positioning must not return');

console.log('Canonical Saturn Square positions, size, and layout contract passed');
