const assert = require('node:assert/strict');
const fs = require('node:fs');

const crowley = fs.readFileSync('drawing-board-crowley-harmonic-v1.js','utf8');
const tarot = fs.readFileSync('tarot-app.js','utf8');

assert.match(crowley,/function rehydrateDomainGate\(box\)/);
assert.match(crowley,/if\(!significatorId\)significatorId=storedSignificator\(\)/);
assert.match(crowley,/if\(!box\.hidden\)\{rehydrateDomainGate\(box\);mark\(\);\}/);
assert.match(crowley,/renderSignificatorState\(box\)/);
assert.match(crowley,/if\(domainLocked\)[\s\S]*?if\(reveal\)reveal\.hidden=false/);
assert.match(crowley,/const silent=typeof bridge\?\.drawOpeningSignificator==='function'/);
assert.match(crowley,/const card=silent \? bridge\.drawOpeningSignificator\('full'\) : bridge\?\.drawCardForBoard\?\.\('full'\)/);

const silentDraw = tarot.match(/drawOpeningSignificator\(scope = 'full'\) \{[\s\S]*?\n    \},/);
assert.ok(silentDraw,'tarot bridge must expose a dedicated Opening Significator draw');
assert.match(silentDraw[0],/rowDrawPool\(scope \|\| 'full',\{ignoreUsed:true\}\)/);
assert.doesNotMatch(silentDraw[0],/commitShortList|renderShortList|expandCardRow/);

console.log('Opening of the Key rehydrates remembered ritual state after rerenders and draws digital Significators without mutating the board.');
