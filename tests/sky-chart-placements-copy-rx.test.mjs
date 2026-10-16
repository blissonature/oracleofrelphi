import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const js=fs.readFileSync('sky-chart-quick-copy-v2.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');

test('Placements Copy includes Rx only for rows displaying the canonical retrograde marker',()=>{
 assert.match(js,/function placementMarkdown\(view\)/);
 assert.match(js,/nameNode\?\.querySelector\('\.sky-placement-rx'\)\?' Rx':''/);
 assert.match(js,/const nameNode=row.querySelector\('\.sky-foundation-row-name'\)/);
 assert.match(js,/\[coordinate,house\]\.filter\(Boolean\)\.join\(' · '\)/);
 assert.ok(html.includes('sky-chart-quick-copy-v2.js?v=2'));
});
