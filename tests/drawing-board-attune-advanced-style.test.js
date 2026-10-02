const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(css,/\.relphi-attune-advanced\{/);
assert.match(css,/\.relphi-attune-advanced>summary\{/);
assert.match(css,/\.relphi-attune-advanced>div\{/);
assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto auto/);
assert.match(css,/\.relphi-attune-advanced input\[type="checkbox"\]\{/);
assert.match(css,/width:1rem!important/);
assert.match(css,/accent-color:#b81712!important/);

console.log('Attune Advanced uses compact framed controls parallel to Orientation.');
