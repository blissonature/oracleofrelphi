const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

const nav = js.match(/function navigateFocusTo\(nativeIndex\) \{[\s\S]*?\n  \}/);
assert.ok(nav,'navigateFocusTo must exist');
assert.match(nav[0],/if \(cardAt\(next\)\) openFocus\(next\)/);
assert.match(nav[0],/else if \(surfaceReadingSession \|\| recursionActive\(\) \|\| craftedReadingActive\) openAttune\(next\)/);
assert.match(js,/navigateFocusBy\(event\.key==='ArrowLeft' \? -1 : 1\)/);

const handoff = js.match(/function openCraftedFocusWhenReady\(index,[\s\S]*?\n  \}/);
assert.ok(handoff,'Crafted Attune must have a render-safe Focus handoff');
assert.match(handoff[0],/cardAt\(target,live\)/);
assert.match(handoff[0],/setTimeout\(reveal,delay\)/);
assert.match(handoff[0],/openFocus\(target\)/);
assert.match(handoff[0],/pendingFocusIndex=target/);

assert.match(js,/data-attune-shared[\s\S]*?openCraftedFocusWhenReady\(target\)/);
assert.match(js,/data-attune-confirm[\s\S]*?openCraftedFocusWhenReady\(target\)/);
assert.match(js,/if\(surfaceReadingSession \|\| recursionActive\(\) \|\| craftedReadingActive\)\{[\s\S]*?openCraftedFocusWhenReady\(targetIndex\)/);

console.log('All Crafted Attune paths wait for the target card before reopening Focus, preserving arrow progression.');
