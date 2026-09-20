const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const board = fs.readFileSync(path.join(root, 'drawing-board-workflow-v2.js'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'tests/drawing-board-runtime.test.js'), 'utf8');

assert.doesNotMatch(board, /relphiBulkQuestions/);
assert.match(board, /function parseBulkQuestions\(value\)/);
assert.match(board, /const MAX_POSITIONS = 50;/);
assert.match(board, /slice\(0,MAX_POSITIONS\)/);
assert.match(board, /draft\.labels\.length>=MAX_POSITIONS/);
assert.match(board, /split\(','\)/);
assert.match(board, /id="relphiPositionLabels"/);
assert.match(board, /id="relphiAddPosition"/);
assert.match(board, /const acceptCommaList=\(value\)=>/);
assert.match(board, /labelsList\?\.addEventListener\('paste'/);
assert.match(board, /labelsList\?\.addEventListener\('change'/);
assert.match(board, /pasted\.includes\(','\)/);
assert.match(board, /draft\.labels=labels/);
assert.match(runtime, /comma-separated questions should create three individual label fields/);
assert.match(runtime, /individual label fields must mirror the comma-separated first field/);
assert.match(runtime, /comma-separated questions should become board position labels/);

console.log('Drawing Board comma-list question checks passed.');
