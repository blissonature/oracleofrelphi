const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(js, /function cardCountOptions\(value\)/);
assert.match(js, /count===1\?'':'s'/);
assert.match(js, /<label>Cards<select data-position-card-count=/);
assert.doesNotMatch(js, /<label>Cards<input type="number"/);
assert.match(js, /id="relphiCopyBespokeQuestions"/);
assert.match(js, /function bespokeQuestionsClipboardText\(draft\)/);
assert.match(js, /Sub-pack:/);
assert.match(js, /Cards:/);
assert.match(js, /Share card with:/);
assert.match(js, /Reversals:/);
assert.match(js, /Repeats:/);
assert.match(js, /writeDrawingBoardClipboard\(text\)/);
assert.match(css, /#relphiCopyBespokeQuestions/);
assert.match(css, /select\[data-position-card-count\]/);

console.log('Bespoke card selector and copy contract verified.');
