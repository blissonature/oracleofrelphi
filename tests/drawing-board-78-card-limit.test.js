const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/const MAX_POSITIONS = 78;/);
assert.match(js,/78-card board limit/);
assert.doesNotMatch(js,/50-card board limit/);
assert.match(js,/if\(total>MAX_POSITIONS\)return \{draft:null,total\}/);

console.log('Drawing Board allows up to one full 78-card tarot deck.');
