const assert = require('node:assert/strict');
const fs = require('node:fs');

const workflow = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const prefabs = fs.readFileSync('drawing-board-spread-prefabs-v1.js','utf8');

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
console.log('Canonical Saturn Square positions and single-numbering contract passed');
