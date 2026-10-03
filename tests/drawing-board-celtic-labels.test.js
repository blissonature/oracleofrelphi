const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const labels = js.match(/const CELTIC_LABELS = \[([\s\S]*?)\n  \];/);
assert.ok(labels,'Celtic Cross labels must exist');
assert.doesNotMatch(labels[1],/'\d+ · /);
assert.match(labels[1],/'What covers you'/);
assert.match(labels[1],/'What crosses you'/);
assert.match(labels[1],/'What crowns you'/);
assert.match(labels[1],/'What is beneath you'/);
assert.match(labels[1],/'What is behind you'/);
assert.match(labels[1],/'What is before you'/);
assert.match(labels[1],/'Yourself'/);
assert.match(labels[1],/'Your house'/);
assert.match(labels[1],/'Your hopes or fears'/);
assert.match(labels[1],/'What will come'/);

console.log('Celtic Cross labels rely on draw order for numbering and contain no duplicate ordinals.');
