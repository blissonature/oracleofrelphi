const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/className='relphi-board-document-actions'/);
assert.match(js,/className='relphi-board-document-button relphi-copy-reading'/);
assert.match(js,/take\('snapshotCardRowArrangement','Snapshot'/);
assert.match(js,/take\('downloadRowHtml','Download'/);
assert.match(js,/journal\.textContent='Save'/);
assert.doesNotMatch(js,/Copy Text Only/);
assert.match(js,/root\.querySelector\('#drawing-board-post-export'\)\?\.remove\(\)/);

console.log('Document utility strip owns Copy, Snapshot, Download, and Save without duplicate text-copy controls.');
