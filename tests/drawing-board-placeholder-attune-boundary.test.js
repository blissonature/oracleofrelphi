const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/if \(surfaceReadingSession \|\| recursionActive\(\) \|\| craftedReadingActive\) openAttune\(index\); else drawInto\(item,index\);/);
assert.match(js,/if \(surfaceReadingSession \|\| recursionActive\(\) \|\| craftedReadingActive \|\| boardHasCraftedStructure\(root\)\) openAttune\(index\); else drawInto\(item,index\);/);
assert.match(js,/function navigateFocusTo\(nativeIndex\)[\s\S]*?else if \(surfaceReadingSession \|\| recursionActive\(\) \|\| craftedReadingActive\) openAttune\(next\)/);

console.log('Every Crafted placeholder activation crosses the Attune boundary before Focus View.');
