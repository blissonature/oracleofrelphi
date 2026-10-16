import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const header=fs.readFileSync('sky-chart-inline-expanded-header-v1.js','utf8');
const progressive=fs.readFileSync('sky-chart-inline-progressive-contract-v3.js','utf8');
const transit=fs.readFileSync('sky-chart-relationship-transit-meta-v4.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');

test('expanded relationship timing shares aspect referent token rather than header row',()=>{
  assert.match(header,/grid-template-areas:"left aspect right" "left orb right" "detail detail detail"/);
  assert.doesNotMatch(header,/grid-area:timing!important/);
  assert.match(header,/const aspect=detail\?\.querySelector\('\.inline-rel-progressive-strip \[data-inline-progressive-token="aspect"\]'\)/);
  assert.match(header,/if\(slot&&aspect&&slot\.parentElement!==aspect\)aspect\.appendChild\(slot\)/);
  assert.match(header,/\[data-inline-progressive-token="aspect"\]>\[data-inline-relationship-timing\]/);
  assert.match(progressive,/\$\{tokenMarkup\(row,'aspect'\)\}/);
  assert.match(transit,/row\.querySelector\(':scope>\.inline-rel-detail \[data-inline-relationship-timing\]'\)/);
});

test('compact layout removes timing band and moves Copy to available header space',()=>{
  assert.match(header,/grid-template-rows:38px 18px auto!important/);
  assert.match(header,/padding-top:8px!important/);
  assert.match(header,/\.inline-rel-tile-copy\{[\s\S]*?top:-34px;/);
  assert.match(header,/\[data-inline-progressive-token="aspect"\] \.inline-rel-transit-window/);
  assert.ok(html.includes('sky-chart-inline-expanded-header-v1.js?v=12'));
});
