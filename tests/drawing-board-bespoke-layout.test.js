const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(css, /grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,8\.5rem\),1fr\)\)!important/);
assert.match(css, /\.relphi-bespoke-question-settings>label\{[\s\S]*min-width:0!important/);
assert.match(css, /\.relphi-bespoke-question-settings select,[\s\S]*width:100%!important/);
assert.match(css, /select\[data-position-card-count\]\{\s*min-width:0!important/);

console.log('Bespoke Advanced responsive no-overlap contract verified.');
