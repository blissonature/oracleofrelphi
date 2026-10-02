const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/class="relphi-reading-text-actions"[\s\S]*?relphi-copy-reading/);
assert.match(js,/take\('snapshotCardRowArrangement','Snapshot'/);
assert.match(js,/take\('downloadRowHtml','Download HTML'/);
assert.match(js,/relphi-board-journal-button/);
assert.doesNotMatch(js,/Copy Text Only/);
assert.match(js,/root\.querySelector\('#drawing-board-post-export'\)\?\.remove\(\)/);

console.log('Reading Text owns Copy, Snapshot, HTML export, and Journal actions without a duplicate text-copy button.');
