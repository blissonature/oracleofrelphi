import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const focus=fs.readFileSync('sky-chart-filter-wheel-focus-v1.js','utf8');
const css=fs.readFileSync('sky-chart-filter-wheel-focus-v1.css','utf8');
const harmonic=fs.readFileSync('sky-chart-orb-control-v1.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
test('visible endpoints, hidden qualifying endpoints, and secondary endpoints have three states',()=>{
 assert.match(focus,/if\(shown\)keys\.forEach\(key=>placements\.add\(key\)\)/);
 assert.match(focus,/hiddenCandidates\.set\(key,Math\.min\(value/);
 assert.match(focus,/hiddenNearest=new Map/);
 assert.match(focus,/classList\.toggle\('is-filter-intermediate',hiddenNearest\.has\(key\)\)/);
 assert.match(css,/is-filter-intermediate\{\s*opacity:\.7!important/);
 assert.match(css,/opacity:\.4!important/);
 assert.match(css,/is-filter-kept\{\s*opacity:1!important/);
});
test('reveal is explicit, whole-degree, and never exceeds model maximum',()=>{
 assert.match(focus,/Math\.ceil\(required-1e-8\)/);
 assert.match(focus,/Math\.floor\(current\)\+1/);
 assert.match(focus,/setWindow\?\.\(target\)/);
 assert.match(focus,/Increase to \$\{target\}°/);
 assert.match(focus,/dismiss\.addEventListener\('click',closePopup\)/);
 assert.match(harmonic,/Math\.min\(max,Math\.floor\(current\)\+1\)/);
 assert.doesNotMatch(harmonic,/setWindow\?\.\(m\?\.maxWindow\?\?12\)/);
});
test('preview loads updated implementations',()=>{
 for(const suffix of ['sky-chart-filter-wheel-focus-v1.js?v=24','sky-chart-filter-wheel-focus-v1.css?v=5','sky-chart-orb-control-v1.js?v=29'])assert.ok(html.includes(suffix));
});

test('intermediate placement popup survives wheel refresh without intercepting selection',()=>{
 const sync=focus.slice(focus.indexOf('function sync()'),focus.indexOf('function whereWhenEditing()'));
 assert.doesNotMatch(sync,/closePopup\(\)/);
 assert.match(focus,/addEventListener\('pointerdown',onPlacementClick,true\)/);
 assert.match(focus,/addEventListener\('click',onPlacementClick,true\)/);
 assert.match(focus,/event\.stopImmediatePropagation\(\)/);
 assert.match(focus,/event\.key==='Escape'/);
});

test('revealed placement name is title cased and popover stays anchored in viewport',()=>{
 assert.match(focus,/rawName\.replace\(\/\\b\[a-z\]\/g,letter=>letter\.toUpperCase\(\)\)/);
 assert.match(focus,/rect\.bottom\+12/);
 assert.match(focus,/rect\.top-height-12/);
 assert.match(focus,/panel\.style\.left/);
 assert.match(focus,/panel\.style\.top/);
 assert.match(css,/text-align:left!important/);
});
