const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html','utf8');
const tarot = fs.readFileSync('tarot.html','utf8');

assert.doesNotMatch(index,/http-equiv="refresh"/i);
assert.doesNotMatch(index,/location\.replace\(['"]tarot\.html/);
assert.match(index,/What Relphi is/);
assert.match(index,/Reference first\. Relationship second\. Reading follows\./);
assert.match(index,/href="tarot\.html"/);

assert.match(tarot,/<title>Tarot Ledger · Oracle of Relphi<\/title>/);
assert.match(tarot,/id="tarotLedgerTitle"/);
assert.match(tarot,/class="tarot-hero compact relphi-ledger-tool-header"/);
assert.match(tarot,/class="tarot-ledger-page"/);
assert.match(tarot,/Search Tarot Ledger/);
assert.doesNotMatch(tarot,/architecture-hero/);
assert.doesNotMatch(tarot,/anniversary-kicker/);
assert.doesNotMatch(tarot,/class="relphi-home-content"/);
assert.doesNotMatch(tarot,/id="relphiHomeTitle"/);

console.log('Homepage and Tarot Ledger remain separate entry surfaces.');
