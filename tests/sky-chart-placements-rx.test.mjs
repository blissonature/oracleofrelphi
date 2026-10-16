import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const js=fs.readFileSync('sky-chart-foundation-v2.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
test('Sky Card retrograde marker uses explicit motion or stored-instant fallback',()=>{
 assert.match(js,/function recordRetrograde\(record,payload\)/);
 assert.match(js,/typeof item\.retrograde==='boolean'/);
 assert.match(js,/typeof item\.isRetrograde==='boolean'/);
 assert.match(js,/function retrogradeAtInstant\(record,payload\)/);
 assert.match(js,/profile\(payload\)\.instant/);
 assert.match(js,/GeoVector\(name,date,true\)/);
 assert.match(js,/recordRetrograde\(record,payload\)/);
 assert.ok(html.includes('sky-chart-foundation-v2.js?v=36'));
});

test('Sky A and Sky B placement rows interpolate the canonical Retrograde SVG rather than printing template syntax',()=>{
 assert.match(js,/function retrogradeMark\(\)\{[\s\S]*?assets\/planet-glyphs\/retrograde\.svg/);
 assert.match(js,/recordRetrograde\(record,payload\)\?\` <span class="sky-placement-rx">\$\{retrogradeMark\(\)\}<\/span>\`:''/);
 assert.doesNotMatch(js,/recordRetrograde\(record,payload\)\?' <span class="sky-placement-rx">/);
 assert.match(js,/function renderCard\(slot,payload,list,cusps\)/);
 assert.match(js,/renderCard\('A'/);
 assert.match(js,/renderCard\('B'/);
});

test('Placement Retrograde image is scaled for readable lettering while preserving its canonical artboard',()=>{
 const css=fs.readFileSync('sky-chart-foundation-v1.css','utf8');
 assert.match(css,/\.sky-foundation-row-name \.sky-placement-rx\{[^}]*width:1\.8em;height:1\.8em/);
 assert.match(css,/\.sky-foundation-row-name \.sky-rx-master\{[^}]*width:100%;height:100%/);
 assert.ok(html.includes('sky-chart-foundation-v1.css?v=19'));
});
