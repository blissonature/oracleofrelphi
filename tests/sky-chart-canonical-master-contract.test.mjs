import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const read=path=>readFileSync(path,'utf8');
const registrySource=read('relphi-glyph-registry-v1.js');
const manifest=JSON.parse(read('assets/inscribed-glyphs/v1/manifest.json'));
const component=read('relphi-glyph-component-v1.js');
const foundation=read('sky-chart-foundation-v2.js');
const bundleSource=read('relphi-inscribed-glyph-masters-v1.js');
const registryContext={window:{}};
vm.runInNewContext(registrySource,registryContext);
const registry=registryContext.window.RelphiGlyphRegistry;
const bundleContext={window:{}};
vm.runInNewContext(bundleSource,bundleContext);
const assets=bundleContext.window.RelphiInscribedGlyphMastersV1;
const ids=registry.entries.map(x=>x.id);

test('all canonical identities have one complete static inscribed SVG',()=>{
  assert.deepEqual(Object.keys(manifest.identities).sort(),ids.slice().sort());
  assert.deepEqual(Object.keys(assets).sort(),ids.slice().sort());
  assert.equal(manifest.count,ids.length);
  for(const entry of registry.entries){
    const info=manifest.identities[entry.id];
    const bytes=read('assets/inscribed-glyphs/v1/'+info.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),info.sha256,entry.id);
    assert.equal(bytes.trim(),assets[entry.id],entry.id);
    assert.match(bytes,/<svg [^>]*viewBox="-32 -32 64 64"/,entry.id);
    assert.match(bytes,/<g class="relphi-glyph-bubble"[^>]*><circle cx="0" cy="0" r="19"/,entry.id);
    assert.match(bytes,new RegExp('data-canonical-glyph-id="'+entry.id+'"'),entry.id);
    assert.doesNotMatch(bytes,/<script|<foreignObject|<image/i,entry.id);
  }
});

test('shared component imports authored artboards and never constructs circles or refits artwork',()=>{
  assert.match(component,/RelphiInscribedGlyphMastersV1/);
  assert.match(component,/importNode\(templateFor\(entry\),true\)/);
  assert.match(component,/scale\('\+\(radius\/MASTER_RADIUS\)\+'\)'/);
  assert.doesNotMatch(component,/createElementNS|getBBox|function fit\(|textGlyph\(|createElement\(['"]circle/);
  assert.match(component,/canonicalSource:'approved-inscribed-svg'/);
});

test('angle letterforms and frames share the placement scale',()=>{
  for(const [id,letter] of Object.entries({asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'}))
    assert.match(assets[id],new RegExp('>'+letter+'<\\/text>'),id);
  assert.match(foundation,/frameScale=inscribedPlacementRadius\(isComparison\)\/frameRadius/);
  assert.match(foundation,/scale\(\$\{frameScale\}\) rotate\(\$\{tangent\}\)/);
  assert.match(foundation,/data-angle-frame-scale/);
});

test('every direct consumer loads the master bundle before the component',()=>{
  for(const file of ['glyphs-unified-preview.html','glyphs.html','sky-chart.html',
    'planetaryhours.html','part1/sky-chart.html','part2/sky-chart.html']){
    const html=read(file),bundle=html.indexOf('relphi-inscribed-glyph-masters-v1.js'),
      componentAt=html.indexOf('relphi-glyph-component-v1.js');
    assert.ok(bundle>=0&&componentAt>bundle,file);
  }
  const nav=read('navloader.js');
  assert.ok(nav.indexOf("appendScript('relphi-inscribed-glyph-masters-v1.js")<
    nav.indexOf("appendScript('relphi-glyph-component-v1.js"));
});
