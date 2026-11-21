import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const js=fs.readFileSync('sky-chart-foundation-v2.js','utf8');
const css=fs.readFileSync('sky-chart-foundation-v1.css','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
test('Placement Retrograde uses explicit motion or stored-instant fallback',()=>{
  assert.match(js,/function recordRetrograde\(record,payload\)/);
  assert.match(js,/typeof item\.retrograde==='boolean'/);
  assert.match(js,/typeof item\.isRetrograde==='boolean'/);
  assert.match(js,/function retrogradeAtInstant\(record,payload\)/);
  assert.match(js,/profile\(payload\)\.instant/);
  assert.match(js,/GeoVector\(name,date,true\)/);
  assert.match(js,/recordRetrograde\(record,payload\)/);
  assert.match(html,/sky-chart-foundation-v2\.js\?v=\d+/);
});
test('Both Sky Card Placements lists render Retrograde through the shared glyph component',()=>{
  assert.match(js,/class="sky-placement-rx" role="img" aria-label="Retrograde"/);
  assert.match(js,/drawCanonical\(rxHost,'retrograde',\{radius:19,padding:1,color:'currentColor'\}\)/);
  assert.doesNotMatch(js,/function retrogradeMark\(|<img class="sky-rx-master"/);
  assert.match(js,/function renderCard\(slot,payload,list,cusps\)/);
  assert.match(js,/renderCard\('A'/);
  assert.match(js,/renderCard\('B'/);
});
test('Placements reserve a readable annotation space rather than scaling the glyph master',()=>{
  assert.match(css,/\.sky-foundation-row-name \.sky-placement-rx\{[^}]*width:\.9em;height:1em/);
  assert.match(css,/\.sky-foundation-row-name \.sky-placement-rx>svg\{[^}]*width:3\.6em;height:3\.6em/);
  assert.match(css,/margin-left:\.62em;vertical-align:-\.133em/);
  assert.doesNotMatch(css,/\.sky-rx-master/);
  assert.match(html,/sky-chart-foundation-v1\.css\?v=\d+/);
});
