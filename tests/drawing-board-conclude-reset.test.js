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
assert.match(js,/function boardResetReasons\(root=panel\(\)\)/);
assert.match(js,/const meaningfulGeometry=cards>0\|\|crafted/);
assert.match(js,/const geometryChanged=meaningfulGeometry&&\(/);
assert.match(js,/Object\.keys\(snap\.rowEnvelopeLayout\|\|\{\}\)\.length>0/);
assert.match(js,/Object\.keys\(snap\.rowCardTransforms\|\|\{\}\)\.length>0/);

const conclude=js.match(/function concludeSacredReading\(root=panel\(\)\) \{[\s\S]*?\n  \}/);
assert.ok(conclude);
assert.match(conclude[0],/resetBoardGlobal\(root,\{openSettings:false\}\)/);
assert.doesNotMatch(conclude[0],/clearCraftedStructure\(root\)/);
assert.match(conclude[0],/requestAnimationFrame\(\(\)=>requestAnimationFrame\(reconcile\)\)/);
assert.match(conclude[0],/reset\.disabled=!boardCanReset\(live\)/);

console.log('Conclude restores canonical empty state and empty scaffold geometry cannot keep Reset Board active.');
