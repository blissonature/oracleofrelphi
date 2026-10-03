const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

const fn=js.match(/function promptForBespokeQuestion\(\) \{[\s\S]*?\n  \}/);
assert.ok(fn,'promptForBespokeQuestion must exist');
assert.doesNotMatch(fn[0],/window\.prompt/);
assert.match(fn[0],/relphi-clarifier-modal/);
assert.match(fn[0],/Ask a clarifying question/);
assert.match(fn[0],/Add clarifier/);
assert.match(fn[0],/appendBespokeQuestion\(question\)/);
assert.match(css,/\.relphi-clarifier-modal\{/);
assert.match(css,/\.relphi-clarifier-card\{/);
assert.match(css,/\.relphi-clarifier-actions\{/);

console.log('Clarifier uses an in-app Relphi modal instead of the browser prompt.');
