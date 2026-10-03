const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const nav = js.match(/function navigateFocusTo\(nativeIndex\) \{[\s\S]*?\n  \}/);
assert.ok(nav,'navigateFocusTo must exist');
assert.match(nav[0],/if \(cardAt\(next\)\) openFocus\(next\)/);
assert.match(nav[0],/else if \(surfaceReadingSession \|\| recursionActive\(\) \|\| craftedReadingActive\) openAttune\(next\)/);
assert.match(js,/navigateFocusBy\(event\.key==='ArrowLeft' \? -1 : 1\)/);

console.log('Focus arrow navigation re-enters Attune before drawing an empty Crafted position.');
