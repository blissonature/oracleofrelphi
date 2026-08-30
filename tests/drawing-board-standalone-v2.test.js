const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const host = read('drawing-board/tarot.html');
const standalone = read('drawing-board-standalone-v2.js');
const noBoard = read('tarot-ledger-no-board-v1.js');
const navloader = read('navloader.js');
const nav = read('nav.html');
const tools = read('tools.html');
const home = read('index.html');
const materializer = read('scripts/materialize-drawing-board.py');

assert.doesNotThrow(() => new Function(standalone));
assert.doesNotThrow(() => new Function(noBoard));
assert.doesNotThrow(() => new Function(navloader));

// Drawing Board is a real document with Drawing Board identity from source.
assert.doesNotMatch(host, /fetch\('\.\.\/tarot\.html'/);
assert.match(host, /<base href="\.\.\/">/);
assert.match(host, /<title>Drawing Board · Oracle of Relphi<\/title>/);
assert.match(host, /<body class="relphi-drawing-board-page">/);
assert.match(host, /<h1>Drawing <span class="red">Board<\/span><\/h1>/);
assert.match(host, /class="tarot-app-shell"/);
assert.match(host, /id="shortListPanel" class="short-list-panel" aria-label="Drawing Board"/);
assert.match(host, /id="browsePanel"[\s\S]*class="tarot-layout"/);
assert.match(host, /id="cardList" class="tarot-card-list"/);
assert.match(host, /id="cardDetail" class="tarot-detail"/);
assert.doesNotMatch(host, /class="tarot-entry-panel"/);
assert.doesNotMatch(host, /id="landingOpenBoard"/);
assert.doesNotMatch(host, /drawing-board-direct-boot-v1\.js/);
assert.doesNotMatch(host, /drawing-board-first-paint-v1\.js/);
assert.match(materializer, /Path\('tarot\.html'\)/);
assert.match(materializer, /Path\('drawing-board\/tarot\.html'\)/);
assert.match(materializer, /Remove the Ledger landing surface entirely/);

// The two routes boot different feature layers.
assert.match(navloader, /function isStandaloneDrawingBoardContext/);
assert.match(navloader, /function isTarotLedgerContext/);
assert.match(navloader, /tarot-ledger-no-board-v1\.js\?v=1/);
assert.match(navloader, /drawing-board-standalone-v2\.js\?v=1/);
assert.match(navloader, /if \(isStandaloneDrawingBoardContext\(\)\)[\s\S]*drawing-board-workflow-v2\.js\?v=24[\s\S]*drawing-board-interactions-v1\.js\?v=5[\s\S]*drawing-board-spread-prefabs-v1\.js\?v=10/);

// Tarot Ledger itself must not expose Drawing Board controls.
assert.match(noBoard, /landingOpenBoard/);
assert.match(noBoard, /#shortListPanel\{display:none!important\}/);
assert.match(noBoard, /\[data-shortlist\]\{display:none!important\}/);
assert.match(noBoard, /Search, draw, or browse the deck\./);

// Drawing Board must use the actual Tarot Ledger browse panel at the bottom.
assert.match(standalone, /document\.getElementById\('browsePanel'\)/);
assert.match(standalone, /document\.getElementById\('cardList'\)/);
assert.match(standalone, /document\.getElementById\('cardDetail'\)/);
assert.match(standalone, /Cards in this Drawing/);
assert.match(standalone, /function syncNativeLedgerBottom\(\)/);
assert.match(standalone, /function activateLedgerCard\(cardId, scroll\)/);
assert.match(standalone, /surface\.click\(\)/);
assert.match(standalone, /data-relphi-placeholder-search/);
assert.match(standalone, /placeholder="Search a card…"/);
assert.match(standalone, /or-card-layer\.relphi-info-layer/);
assert.doesNotMatch(standalone, /drawingBoardInspector/);
assert.doesNotMatch(standalone, /drawingBoardSelectedCardEntry/);
assert.doesNotMatch(standalone, /drawing-board-list-button/);
assert.doesNotMatch(standalone, /full Tarot Ledger entry could not be rendered/i);
assert.doesNotMatch(standalone, /landingOpenBoard/);

// Navigation and public tool index present Drawing Board separately.
assert.match(nav, /href="drawing-board\/tarot\.html"><span>Drawing Board<\/span>/);
assert.match(tools, /<h2>Tarot Ledger<\/h2>/);
assert.match(tools, /<h2>Drawing Board<\/h2>/);
assert.match(tools, /href="drawing-board\/tarot\.html">Open Drawing Board<\/a>/);
assert.doesNotMatch(tools, /Tarot Ledger \+ Drawing Board/);
assert.doesNotMatch(home, /Tarot Ledger \+ Drawing Board/);

console.log('Standalone Drawing Board native Ledger checks passed.');
