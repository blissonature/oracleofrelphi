const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const board = fs.readFileSync(path.join(root, 'drawing-board-workflow-v2.js'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'tests/drawing-board-runtime.test.js'), 'utf8');

assert.match(board, /id="relphiBulkQuestions"/);
assert.match(board, /function parseBulkQuestions\(value\)/);
assert.match(board, /split\(','\)/);
assert.match(board, /Separate multiple questions with commas\./);
assert.match(runtime, /comma-separated questions should stage three positions/);
assert.match(runtime, /comma-separated questions should become board position labels/);

console.log('Drawing Board bulk question checks passed.');
