const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/function resetBoardGlobal\(root = panel\(\), \{openSettings=true\} = \{\}\)/);
assert.match(js,/resetBoardGlobal\(root,\{openSettings:false\}\)/);
assert.match(js,/writeStickerVisibility\(false\)/);
assert.match(js,/const background=boardBackgroundDefault\(\)/);
assert.match(js,/resetSnapshot\.rowTableColor=String\(background\.color/);
assert.match(js,/resetSnapshot\.rowTableImage=background\.mode==='image'/);
assert.match(js,/resetSnapshot\.rowEnvelopeArt=\{\}/);
assert.match(js,/resetSnapshot\.customCardArt=\{\}/);
assert.match(js,/if\(openSettings\)\{/);
assert.match(js,/settingsBaseline=\{[\s\S]*stickers:false/);

const conclude=js.match(/function concludeSacredReading\(root=panel\(\)\) \{[\s\S]*?\n  \}/);
assert.ok(conclude);
assert.match(conclude[0],/resetBoardGlobal\(root,\{openSettings:false\}\)/);
assert.doesNotMatch(conclude[0],/clearCraftedStructure\(root\)/);

console.log('Conclude restores the same canonical empty board state as Reset Board.');
