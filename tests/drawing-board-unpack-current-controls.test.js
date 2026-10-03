const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

const row = js.match(/function surfaceComposerRowMarkup\(row,index,rows\) \{[\s\S]*?\n  \}/);
assert.ok(row,'surfaceComposerRowMarkup must exist');
assert.match(row[0],/data-surface-edit-options/);
assert.match(row[0],/surfaceComposerAdvancedSummary\(row\)/);
assert.doesNotMatch(row[0],/data-surface-pack|data-surface-card-count|data-surface-link|data-surface-reversals|data-surface-repeats/);

const controller = js.match(/function surfaceQuestionControllerMarkup\(rows,target,defaults\) \{[\s\S]*?\n  \}/);
assert.ok(controller,'surfaceQuestionControllerMarkup must exist');
assert.match(controller[0],/data-surface-controller-pack/);
assert.match(controller[0],/data-surface-controller-create-subpack/);
assert.match(controller[0],/data-surface-controller-card-count/);
assert.match(controller[0],/data-surface-controller-link/);
assert.match(controller[0],/data-surface-controller-reversals/);
assert.match(controller[0],/data-surface-controller-repeats/);
assert.match(controller[0],/New question defaults/);

assert.match(js,/const defaults=\{/);
assert.match(js,/controllerTarget='defaults'/);
assert.match(js,/applyControllerPatch/);
assert.match(js,/allowReversals:derived\.reversals!==false/);
assert.match(js,/allowRepeats:!!derived\.repeats/);
assert.match(js,/linkTo:String\(derived\.linkTo\?\?''\)/);
assert.match(js,/cardCount:Math\.max\(1,Number\(derived\.questionCardCount\)\|\|1\)/);
assert.match(css,/\.relphi-surface-question-controller/);
assert.match(css,/\.relphi-surface-options-summary/);

console.log('See What Surfaces Next uses one visible card-options controller with defaults and per-question summaries.');
