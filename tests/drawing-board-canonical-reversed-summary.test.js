const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('tarot-app.js', 'utf8');
const canonical = fs.readFileSync('tarot-reversed-copy-v1.js', 'utf8');
const workflow = fs.readFileSync('drawing-board-workflow-v2.js', 'utf8');

const orientation = app.match(/function layerInterpretationForOrientation\(card, reversed = false\) \{([\s\S]*?)\n  \}/)?.[1];
assert.ok(orientation, 'Drawing Board must have an orientation-aware interpreter');
assert.match(orientation, /if \(!reversed\) return layerInterpretation\(card\)/);
assert.match(orientation, /RelphiTarotReversedMeanings\?\.meaningFor\?\.\(card\?\.card_id\)/,
  'reversed summary must prefer the canonical card-specific Relphi interpretation');
assert.match(canonical, /wheel_of_fortune: 'Jupiterian increase becomes inflation or repetition/);
assert.match(app, /interpretation:rowCardInterpretation\(card,index\)/);
assert.match(workflow, /ledgerBridge\(\)\?\.drawingBoardReadingEntries\?\.\(\)/);
console.log('Drawing Board canonical reversed-summary contract passed');
