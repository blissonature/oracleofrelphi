const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.doesNotMatch(js, /<details class="relphi-question-advanced">/);
assert.match(js, /function bespokeQuestionControllerMarkup\(draft\)/);
assert.match(js, /id="relphiQuestionControllerPack"/);
assert.match(js, /id="relphiQuestionControllerCards"/);
assert.match(js, /id="relphiQuestionControllerLink"/);
assert.match(js, /id="relphiQuestionControllerReversals"/);
assert.match(js, /id="relphiQuestionControllerRepeats"/);
assert.match(js, /const applyToSelected=\(patch\)=>/);
assert.match(js, /Mixed — choose to change/);
assert.match(js, /Select question \$\{index\+1\} for editing/);
assert.doesNotMatch(js, /bespokeLaunchDraftFromSelection/);
assert.match(css, /\.relphi-question-controller\{/);
assert.match(css, /\.relphi-card-count-controller>div/);

console.log('Bespoke question controller contract verified.');
