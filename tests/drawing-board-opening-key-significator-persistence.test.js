const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-crowley-harmonic-v1.js','utf8');

assert.match(js,/const SIGNIFICATOR_KEY='relphiOpeningKeySignificatorV1'/);
assert.match(js,/function storedSignificator\(\)/);
assert.match(js,/localStorage\.getItem\(SIGNIFICATOR_KEY\)/);
assert.match(js,/function rememberSignificator\(id\)/);
assert.match(js,/localStorage\.setItem\(SIGNIFICATOR_KEY,significatorId\)/);
assert.match(js,/id="crowleyChangeSignificator"/);
assert.match(js,/rememberSignificator\(''\)/);
assert.match(js,/significatorId=storedSignificator\(\)/);
assert.doesNotMatch(js,/function start\(\)\{[\s\S]*?significatorId=''/);
assert.match(js,/function resetAttemptControls\(box\)[\s\S]*?#crowleyInvocationStep/);
assert.match(js,/if\(invocation\)invocation\.hidden=false/);
assert.match(js,/if\(invoke\)invoke\.disabled=false/);
assert.match(js,/Opening abandoned\. Significator retained\./);

console.log('Opening of the Key retains the Significator until explicitly changed and resets invocation controls for a fresh attempt.');
