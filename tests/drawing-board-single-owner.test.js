const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const nav = read('navloader.js');
const board = read('drawing-board-workflow-v2.js');
const css = read('drawing-board-workflow-v2.css');
const app = read('tarot-app.js');

assert.match(nav, /drawing-board-workflow-v2\.js\?v=76/);
[
  'drawing-board-interactions-v1.js',
  'drawing-board-template-lifecycle-v1.js',
  'drawing-board-spread-prefabs-v1.js',
  'drawing-board-options-transactional-v1.js',
  'drawing-board-render-geometry-v1.js',
  'drawing-board-chrome-ownership-v1.js'
].forEach(name => assert.doesNotMatch(nav, new RegExp(name.replaceAll('.', '\\.'))));
assert.doesNotMatch(nav, /relphi-drawing-board-ui-ready|relphi-drawing-board-ui-stable/);

['MutationObserver','getBoundingClientRect','relphi-drawing-board-ui-ready','relphi-drawing-board-ui-stable','Close Options'].forEach(needle => {
  assert.ok(!board.includes(needle), `unified Drawing Board must not contain ${needle}`);
});
['repair','reconcile','rehydrate','settling'].forEach(needle => {
  assert.ok(!board.toLowerCase().includes(needle), `unified Drawing Board must not use ${needle} lifecycle machinery`);
});

assert.match(app, /rowEnvelopeLayout:/);
assert.match(app, /rowCardTransforms:/);
assert.match(app, /rowActiveLayout:/);
assert.match(app, /window\.RelphiDrawingBoardPrefabsBridge/);
assert.match(app, /window\.RelphiDrawingBoardOptionsBridge/);
assert.match(app, /window\.RelphiTarotLedgerBridge/);
assert.match(app, /document\.dispatchEvent\(new CustomEvent\('relphi:drawing-board-rendered'/);

assert.match(board, /Zoom Extents/);
assert.match(board, /zoomCardRowExtents/);
assert.match(board, /relphi-tool-trigger/);
assert.match(board, /data-tool="snaps"/);
assert.match(board, /data-tool="background"/);
assert.match(board, /drawing-board-post-export/);
assert.match(board, /snapshotCardRowArrangement/);
assert.match(board, /downloadRowHtml/);
assert.match(board, /downloadRowTextHtml/);
assert.match(board, /downloadRowJson/);
assert.match(board, /printCardRowImage/);
assert.match(board, /relphi-reading-options-drawer/);
assert.match(board, /relphi-options-body/);
assert.match(board, /relphi-options-commitbar/);
assert.match(board, /relphiResetBoard/);
assert.match(board, /relphiCancelOptions/);
assert.match(board, /relphiApplyOptions/);
assert.match(board, /celtic-cross-10/);
assert.match(board, /six-polarities-houses-12/);
assert.match(board, /relphi-focus-reader/);
assert.match(board, /relphi-focus-art-pane/);
assert.match(board, /relphi-focus-entry/);
assert.match(board, /renderCardEntry/);
assert.match(board, /pointerdown/);
assert.match(board, /pointerup/);
assert.match(board, /focusCardIsReversed/);
assert.match(css, /\.relphi-focus-main/);
assert.match(css, /grid-template-columns:minmax\(16rem,.82fr\) minmax\(0,1.45fr\)/);
assert.match(css, /\.relphi-focus-art/);
assert.match(css, /object-fit:contain/);
assert.match(css, /\.relphi-focus-entry/);
assert.match(css, /@media\(max-width:700px\)/);
assert.match(css, /\.relphi-focus-main\{display:block/);
assert.match(css, /\.card-row-board-empty\{display:none!important\}/);

console.log('Drawing Board single-owner checks passed.');
