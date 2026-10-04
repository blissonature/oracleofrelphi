const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-crowley-harmonic-v1.js','utf8');

assert.match(js,/const DOMAINS=\[/);
assert.match(js,/id:'Yod'[\s\S]*?core:'Work · business · enterprise'/);
assert.match(js,/id:'Heh'[\s\S]*?core:'Love · marriage · pleasure'/);
assert.match(js,/id:'Vav'[\s\S]*?core:'Trouble · loss · scandal · quarrelling'/);
assert.match(js,/id:'Heh-final'[\s\S]*?core:'Money · goods · material matters'/);
assert.match(js,/id="crowleyDomainSearch"/);
assert.match(js,/function domainMatches\(query\)/);
assert.match(js,/split\(\/\[,;\]\+\|\\s\+or\\s\+\//);
assert.match(js,/data-crowley-domain/);
assert.match(js,/Search in ordinary language/);
assert.doesNotMatch(js,/Expected domain<select/);

console.log('Opening of the Key domain gate explains IHVH and filters ordinary-language concepts into the four domains.');
