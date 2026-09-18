import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('sky-chart.html');
const foundation=read('sky-chart-foundation-v2.js');
const interactions=read('sky-chart-foundation-interactions-v2.js');
const relationships=read('sky-chart-relationship-list-layout-v2.js');
const inline=read('sky-chart-inline-relationship-v5.js');
const heptagram=read('sky-chart-heptagram-canonical-v1.js');
const registry=read('relphi-glyph-registry-v1.js');
const component=read('relphi-glyph-component-v1.js');
const menu=read('menu.js');
const navloader=read('navloader.js');

test('Sky Chart loads one current canonical runtime and current relationship owners',()=>{
  assert.match(html,/relphi-glyph-registry-v1\.js/);
  assert.match(html,/relphi-glyph-component-v1\.js/);
  assert.match(html,/relphi-glyph-source-integrity-v1\.js/);
  assert.match(html,/sky-chart-foundation-v2\.js/);
  assert.match(html,/sky-chart-relationship-list-layout-v2\.js/);
  assert.match(html,/sky-chart-inline-relationship-v5\.js/);
  assert.doesNotMatch(html,/sky-chart-selected-relationship-v4|sky-chart-progressive-comparison-v1|relphi-canonical-glyph-state-v1/);
});

test('foundation v2 reads the shared wheel spec and canonical component',()=>{
  assert.match(foundation,/function spec\(\)\{return window\.RelphiSkyWheelSpec/);
  assert.match(foundation,/function geometry\(slot\)\{return spec\(\)\?\.role/);
  assert.match(foundation,/component\.draw\(/);
  assert.match(foundation,/component\.createBubble\(/);
  assert.match(foundation,/data-wheel-spec':'relphi-sky-wheel-v1'/);
});

test('relationship glyphs have one lazy renderer owner and use canonical templates',()=>{
  assert.match(relationships,/OWNER='relationship-layout-v35'/);
  assert.match(relationships,/VIEWBOX='-32 -32 64 64'/);
  assert.match(relationships,/RADIUS=19/);
  assert.match(relationships,/component\.createBubble\(/);
  assert.match(relationships,/data-relationship-canonical-host/);
  assert.match(relationships,/slot\.replaceChildren\(clone\)/);
  assert.match(relationships,/new IntersectionObserver/);
  assert.doesNotMatch(inline,/createBubble\(|RelphiCanonicalGlyphState/);
});

test('relationship rows remain three equal centered columns and do not filter on expansion',()=>{
  assert.match(relationships,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(relationships,/"left aspect right" "left orb right"/);
  assert.match(inline,/classList\.add\('is-inline-expanded'/);
  assert.match(inline,/classList\.remove\('is-inline-expanded'/);
  assert.doesNotMatch(inline,/sky-chart-filter-hidden|relationship-filter-hidden/);
});

test('foundation interaction controller creates semantic relationship rows but does not paint their glyphs',()=>{
  assert.doesNotMatch(interactions,/component\.createBubble\(|RelphiGlyphComponent\.createBubble|RelphiCanonicalGlyphState/);
  assert.match(interactions,/sky-foundation-relationship-row/);
});

test('Planetary Hours heptagram uses canonical bubbles with separate day and hour state',()=>{
  assert.match(heptagram,/MASTER_RADIUS = 19/);
  assert.match(heptagram,/MASTER_SCALE = DISPLAY_RADIUS \/ MASTER_RADIUS/);
  assert.match(heptagram,/component\.createBubble/);
  assert.match(heptagram,/day-and-hour-ruler/);
  assert.match(heptagram,/DAY_RING_INNER_RADIUS = 23/);
  assert.match(heptagram,/DAY_RING_OUTER_RADIUS = 27/);
  assert.doesNotMatch(heptagram,/RelphiCanonicalGlyphState/);
});

test('static masters and exact text/symbol treatments stay centralized in the registry',()=>{
  for(const id of ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','lilith','part-of-fortune']){
    assert.match(registry,new RegExp(`\\['${id}'[^\\n]+?,1,0,0,null,'static-master'\\]`));
  }
  for(const snippet of ["['chiron','Chiron'","['north-node','North Node'","['south-node','South Node'","['vertex','Vertex'","['asc','Ascendant'","['dsc','Descendant'","['mc','Midheaven'","['ic','Imum Coeli'"])assert.ok(registry.includes(snippet));
  assert.match(component,/if \(entry\.fitMode === 'static-master'\) return true;/);
});

test('menu and navloader use the local current glyph runtime without mutation wrappers',()=>{
  for(const source of [menu,navloader]){
    assert.match(source,/relphi-glyph-registry-v1\.js/);
    assert.match(source,/relphi-glyph-component-v1\.js/);
    assert.match(source,/relphi-glyph-source-integrity-v1\.js/);
    assert.doesNotMatch(source,/relphi-moon-stroke-preservation-v1|relphi-neptune-cross-connection-v1/);
  }
});
