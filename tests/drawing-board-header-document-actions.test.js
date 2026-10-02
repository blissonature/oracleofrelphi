const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(js,/const commandbar=root\.querySelector\('\.relphi-board-commandbar'\)/);
assert.match(js,/if\(actions\.parentElement!==commandbar\)commandbar\.appendChild\(actions\)/);
assert.match(css,/grid-template-areas:"title title exports exports"/);
assert.match(css,/\.relphi-board-commandbar>\.relphi-reading-text-actions\{[\s\S]*?grid-area:exports!important/);

console.log('Drawing Board document actions live in the upper-right command bar instead of beside Reading Text.');
