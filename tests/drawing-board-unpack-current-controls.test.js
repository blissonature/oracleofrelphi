const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

const row = js.match(/function surfaceComposerRowMarkup\(row,index,rows\) \{[\s\S]*?\n  \}/);
assert.ok(row,'surfaceComposerRowMarkup must exist');
assert.match(row[0],/data-surface-pack/);
assert.match(row[0],/data-surface-create-subpack/);
assert.match(row[0],/data-surface-card-count/);
assert.match(row[0],/data-surface-link/);
assert.match(row[0],/data-surface-reversals/);
assert.match(row[0],/data-surface-repeats/);
assert.doesNotMatch(row[0],/data-surface-advanced/);

const sync = js.match(/const syncRow=\(article,index\)=>\{[\s\S]*?\n      \};/);
assert.ok(sync,'Unpack composer syncRow must exist');
assert.match(sync[0],/row\.reversals=article\.querySelector\('\[data-surface-reversals\]'\)/);
assert.match(sync[0],/row\.repeats=!!article\.querySelector\('\[data-surface-repeats\]'\)/);

assert.match(js,/allowReversals:derived\.reversals!==false/);
assert.match(js,/allowRepeats:!!derived\.repeats/);
assert.match(js,/linkTo:String\(derived\.linkTo\?\?''\)/);
assert.match(js,/cardCount:Math\.max\(1,Number\(derived\.questionCardCount\)\|\|1\)/);
assert.match(css,/\.relphi-surface-composer-controls/);

console.log('Unpack this Card exposes and persists current sub-pack, card-count, linking, reversal, and repeat controls.');
