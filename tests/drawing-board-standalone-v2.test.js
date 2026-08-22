const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const host = read('drawing-board/tarot.html');
const standalone = read('drawing-board-standalone-v2.js');
const firstPaint = read('drawing-board-first-paint-v1.js');
const noBoard = read('tarot-ledger-no-board-v1.js');
const navloader = read('navloader.js');
const nav = read('nav.html');
const tools = read('tools.html');
const home = read('index.html');
const materializer = read('scripts/materialize-drawing-board.py');

// Page-specific scripts must parse before browser integration work happens.
assert.doesNotThrow(() => new Function(standalone));
assert.doesNotThrow(() => new Function(firstPaint));
assert.doesNotThrow(() => new Function(noBoard));
assert.doesNotThrow(() => new Function(navloader));

// Drawing Board is a real, generated document derived from Tarot Ledger's shell.
// It must identify as Drawing Board in the source itself and never runtime-fetch Tarot Ledger.
assert.doesNotMatch(host, /fetch\('\.\.\/tarot\.html'/);
assert.match(host, /<base href="\.\.\/">/);
assert.match(host, /<title>Drawing Board · Oracle of Relphi<\/title>/);
assert.match(host, /<body class="relphi-drawing-board-page">/);
assert.match(host, /<h1>Drawing <span class="red">Board<\/span><\/h1>/);
assert.match(host, /class="tarot-app-shell"/);
assert.match(host, /class="tarot-hero compact"/);
assert.match(host, /id="shortListPanel" class="short-list-panel" aria-label="Drawing Board"/);
assert.match(host, /id="drawingBoardBootStatus"/);
assert.match(host, /class="tarot-entry-panel" hidden/);
assert.match(host, /class="tarot-mode-bar" hidden/);
assert.match(materializer, /Path\('tarot\.html'\)/);
assert.match(materializer, /Path\('drawing-board\/tarot\.html'\)/);

// The two routes must boot different feature layers.
assert.match(navloader, /function isStandaloneDrawingBoardContext/);
assert.match(navloader, /function isTarotLedgerContext/);
assert.match(navloader, /tarot-ledger-no-board-v1\.js\?v=1/);
assert.match(navloader, /drawing-board-standalone-v2\.js\?v=1/);
assert.match(navloader, /if \(isStandaloneDrawingBoardContext\(\)\)[\s\S]*drawing-board-workflow-v2\.js\?v=24[\s\S]*drawing-board-interactions-v1\.js\?v=5[\s\S]*drawing-board-spread-prefabs-v1\.js\?v=10/);

// Tarot Ledger must not expose Drawing Board controls or add-to-board buttons.
assert.match(noBoard, /landingOpenBoard/);
assert.match(noBoard, /#shortListPanel\{display:none!important\}/);
assert.match(noBoard, /\[data-shortlist\]\{display:none!important\}/);
assert.match(noBoard, /Search, draw, or browse the deck\./);
assert.doesNotMatch(noBoard, /drawing-board-standalone-v2/);

// Drawing Board must use the existing Ledger layout classes and provide the requested interaction model.
assert.match(standalone, /hero\.innerHTML = 'Drawing <span class="red">Board<\/span>'/);
assert.match(standalone, /or-card-layer\.relphi-info-layer/);
assert.match(standalone, /data-relphi-placeholder-search/);
assert.match(standalone, /placeholder="Search a card…"/);
assert.match(standalone, /inspector\.id = 'drawingBoardInspector'/);
assert.match(standalone, /inspector\.className = 'tarot-layout'/);
assert.match(standalone, /class="tarot-list-panel"/);
assert.match(standalone, /id="drawingBoardSelectedCardEntry" class="tarot-detail"/);
assert.match(standalone, /Cards in this Drawing/);
assert.match(standalone, /function selectCard\(cardId, scroll\)/);
assert.match(standalone, /function revealFullEntry\(cardId\)/);
assert.match(standalone, /event\.target\.closest\?\.\(PANEL \+ ' \.card-row-board \[data-row-card\]'\)/);
assert.match(standalone, /event\.stopImmediatePropagation\(\)/);
assert.match(firstPaint, /drawingBoardBootStatus/);

// Navigation and the public tool index must present Drawing Board as its own instrument.
assert.match(nav, /href="drawing-board\/tarot\.html"><span>Drawing Board<\/span>/);
assert.match(tools, /<h2>Tarot Ledger<\/h2>/);
assert.match(tools, /<h2>Drawing Board<\/h2>/);
assert.match(tools, /href="drawing-board\/tarot\.html">Open Drawing Board<\/a>/);
assert.doesNotMatch(tools, /Tarot Ledger \+ Drawing Board/);
assert.doesNotMatch(home, /Tarot Ledger \+ Drawing Board/);

console.log('Standalone Drawing Board v2 separation checks passed.');
