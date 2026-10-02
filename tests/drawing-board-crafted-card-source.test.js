const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/function sacredCardSourceMarkup\(session,disabled=false\)/);
assert.match(js,/>Drawing method<\/legend>/);
assert.match(js,/value="digital" data-sacred-card-source/);
assert.match(js,/>Digital<\/strong>/);
assert.match(js,/value="physical" data-sacred-card-source/);
assert.match(js,/>Manual<\/strong>/);
assert.match(js,/physical deck, then enter the card and orientation/);
assert.match(js,/function appendToOuterPathPanel\(markup,addition\)/);
assert.match(js,/session\.path==='bespoke'.*appendToOuterPathPanel/s);
assert.match(js,/session\.path==='templates'.*appendToOuterPathPanel/s);
assert.match(js,/session\.path==='blocks'.*\+source\+/s);
assert.match(js,/session\.path==='surface'.*\+source\+/s);
assert.match(js,/session\.path==='astro'.*appendToOuterPathPanel/s);
assert.match(js,/drawer\.querySelectorAll\('\[data-sacred-card-source\]'\)/);
assert.match(js,/session\.sacredCardSource=input\.value==='physical'\?'physical':'digital'/);
assert.match(js,/stampSacredCardSource\(sacredCardSource,root\)/);

console.log('Every Crafted path exposes and persists Digital vs Manual drawing method.');
