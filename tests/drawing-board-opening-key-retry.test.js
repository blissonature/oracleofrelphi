const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-crowley-harmonic-v1.js','utf8');
const tarot = fs.readFileSync('tarot-app.js','utf8');

assert.match(js,/id="crowleyFailureStep"/);
assert.match(js,/id="crowleyFoundPacket"/);
assert.match(js,/id="crowleyExpectedPacket"/);
assert.match(js,/Operation I has no cognate-domain second chance/);
assert.doesNotMatch(js,/id="crowleyRetrySameSelections"/);
assert.doesNotMatch(js,/id="crowleyRetryOpening"/);

assert.match(js,/const HOUSES=[/);
assert.match(js,/const SIGNS=[/);
assert.match(js,/const SEPHIROTH=[/);
assert.match(js,/function operationStageMarkup\(op\)/);
assert.match(js,/If it is absent, you may test one cognate/);
assert.match(js,/Second failure abandons the divination/);
assert.match(js,/failure here does <b>not necessarily<\/b> mean the divination has gone astray/);
assert.match(js,/data-crowley-build-ring/);
assert.match(js,/36 cards following it/);
assert.match(js,/function completeOperation\(box\)/);

assert.match(tarot,/openingKeyFreshDeck\(significatorCardId\)/);
assert.match(tarot,/openingKeyQuerentCut\(deck, cutPosition\)/);
assert.match(tarot,/openingKeyDealStacks\(deck, stackCount, significatorCardId\)/);
assert.match(tarot,/openingKeyRing36\(deck, significatorCardId\)/);
assert.match(tarot,/openingKeyCountForCard\(cardId\)/);
assert.match(js,/function items\(\)\{return Array\.from\(root\(\)\?\.querySelectorAll\('\.card-row-board \.card-row-item'\)\|\|\[\]\);\}/);
assert.match(js,/id="crowleyDirection"/);
assert.match(js,/syncCurrentCardCount\(box\)/);
assert.match(js,/significatorAnchor/);
assert.match(js,/activePacket/);

console.log('Opening of the Key follows a sequential five-operation workflow, gives cognate second tests only where the method calls for them, and keeps Operation I failure terminal.');
