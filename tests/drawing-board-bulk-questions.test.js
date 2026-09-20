const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const board = fs.readFileSync(path.join(root, 'drawing-board-workflow-v2.js'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'tests/drawing-board-runtime.test.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'tarot-app.js'), 'utf8');
const prefabs = fs.readFileSync(path.join(root, 'drawing-board-spread-prefabs-v1.js'), 'utf8');

assert.doesNotMatch(board, /relphiBulkQuestions/);
assert.match(board, /function parseBulkQuestions\(value\)/);
assert.match(board, /const MAX_POSITIONS = 50;/);
assert.match(board, /const MAX_QUESTION_LENGTH = 1000;/);
assert.match(board, /maxlength="\$\{MAX_QUESTION_LENGTH\}"/);
assert.doesNotMatch(board, /slice\(0,90\)|maxlength="90"/);
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
assert.match(app, /const DRAWING_BOARD_QUESTION_MAX = 1000;/);
assert.doesNotMatch(app, /shortListPositionLabels[^\n]{0,180}slice\(0,\s*(?:90|96)\)/);
assert.match(prefabs, /const MAX_QUESTION_LENGTH = 1000;/);
assert.doesNotMatch(prefabs, /label:[^\n]{0,160}slice\(0,\s*90\)/);

console.log('Drawing Board comma-list and long-question checks passed.');
