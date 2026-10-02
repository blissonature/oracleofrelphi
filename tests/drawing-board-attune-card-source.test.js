const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

const open = js.match(/function openAttune\(index\) \{[\s\S]*?\n  \}/);
assert.ok(open,'openAttune must exist');

assert.match(open[0],/const cardSource=String\(meta\.cardSource\|\|'digital'\)==='physical'\?'physical':'digital'/);
assert.match(open[0],/reader\.dataset\.attuneCardSource=cardSource/);
assert.match(open[0],/else if\(cardSource==='physical'\)/);
assert.match(open[0],/>Enter the Card You Drew</);
assert.match(open[0],/>Use This Card</);
assert.match(open[0],/>Draw Card</);
assert.doesNotMatch(open[0],/>Just Draw</);
assert.doesNotMatch(open[0],/>Confirm</);

console.log('Attune renders one explicit draw method: digital or physical.');
