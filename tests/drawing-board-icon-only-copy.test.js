const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js', 'utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css', 'utf8');
const shared = fs.readFileSync('relphi-copy-icon-convention-v1.js', 'utf8');

assert.match(js, /copy\.className='relphi-board-document-button relphi-copy-reading';\s*\/\/ Icon-only clipboard control;[^\n]*\n\s*copy\.textContent='';/);
assert.match(js, /copy\.setAttribute\('aria-label','Copy the reading text'\)/);
assert.match(js, /if\(copy\.isConnected\)copy\.textContent='';/);

assert.match(js, /id="relphiCopyBespokeQuestions" class="relphi-button relphi-question-copy" aria-label="Copy all Bespoke questions and advanced settings"><\/button>/);
assert.match(js, /if\(!button\.isConnected\)return;\s*button\.textContent='';\s*button\.setAttribute\('aria-label','Copy all Bespoke questions and advanced settings'\)/);

assert.match(css, /#shortListPanel \.relphi-board-document-buttons > \.relphi-copy-reading\{[\s\S]*?font-size:0!important/);
assert.match(css, /#shortListPanel \.relphi-question-toolbar #relphiCopyBespokeQuestions\{[\s\S]*?font-size:0!important/);
assert.match(shared, /'\.relphi-copy-reading'/);
assert.match(shared, /'#relphiCopyBespokeQuestions'/);

console.log('Drawing Board Copy buttons are icon-only, with accessible labels and the canonical glyph.');
