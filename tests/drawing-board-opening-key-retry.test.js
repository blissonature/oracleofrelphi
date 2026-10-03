const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-crowley-harmonic-v1.js','utf8');

assert.match(js,/let operation=.*?attemptFailed=false, retrySameSelections=true/);
assert.match(js,/id="crowleyFailureStep"/);
assert.match(js,/id="crowleyFoundPacket"/);
assert.match(js,/id="crowleyExpectedPacket"/);
assert.match(js,/id="crowleyRetrySameSelections" type="checkbox" checked/);
assert.match(js,/id="crowleyRetryOpening"/);
assert.match(js,/Found in '\+\(found\?\.letter\|\|revealedDomain\)\+' packet\. Expected '/);
assert.match(js,/This attempt is abandoned\./);
assert.match(js,/crowleyDomainResults'\)\?\.classList\.add\('is-locked'\)/);
assert.match(js,/attemptFailed=true;[\s\S]*?operationDeck=null;[\s\S]*?retrySameSelections=true;/);
assert.match(js,/if\(retrySameSelections\)[\s\S]*?Same Significator and .*? domain retained/);
assert.match(js,/else\{[\s\S]*?expectedDomain='';domainLocked=false;/);

console.log('Opening failure names the found packet, holds the abandoned result, locks packet choices, and retries with the same selections by default.');
