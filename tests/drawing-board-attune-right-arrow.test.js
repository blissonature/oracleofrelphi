const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/const attune=document\.querySelector\('\.relphi-attune-reader'\)/);
assert.match(js,/if \(attune && !editable && event\.key==='ArrowRight'\)/);
assert.match(js,/\[data-attune-shared\], \[data-attune-random\], \[data-attune-confirm\]:not\(:disabled\)/);
assert.match(js,/action\.click\(\)/);
assert.match(js,/if \(reader && !editable && \(event\.key==='ArrowLeft' \|\| event\.key==='ArrowRight'\)\)/);

console.log('Right Arrow advances the current Attune action while Focus View keeps its existing arrow navigation.');
