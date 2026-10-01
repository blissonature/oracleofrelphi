const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(js, /function cardCountOptions\(value\)/);
assert.match(js, /count===1\?'':'s'/);
assert.match(js, /<label>Cards<select class="relphi-select" data-position-card-count=/);
assert.doesNotMatch(js, /<label>Cards<input type="number"/);
assert.match(js, /id="relphiCopyBespokeQuestions" class="relphi-button relphi-question-copy"/);
assert.match(js, /function bespokeQuestionsClipboardText\(draft\)/);
assert.match(js, /Sub-pack:/);
assert.match(js, /Cards:/);
assert.match(js, /Share card with:/);
assert.match(js, /Reversals:/);
assert.match(js, /Repeats:/);
assert.match(js, /writeDrawingBoardClipboard\(text\)/);
assert.match(js, /function bespokeLaunchDraftFromSelection\(root,draft\)/);
assert.match(js, /if\(session\.path==='bespoke'\)draft=bespokeLaunchDraftFromSelection\(root,draft\)/);
assert.match(js, /querySelectorAll\?\.\('\[data-question-select\]:checked'\)/);
assert.match(js, /indexMap\.has\(linkedOriginal\)/);
assert.match(js, /\.join\('\\n'\)/);
assert.match(js, /\.join\('\\n\\n'\)/);
assert.doesNotMatch(js, /\.join\('\\\\n'\)/);
assert.match(css, /#relphiCopyBespokeQuestions/);
assert.match(css, /select\[data-position-card-count\]/);

console.log('Bespoke card selector and copy contract verified.');
