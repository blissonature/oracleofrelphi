import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source=readFileSync('tarot-cards.js','utf8');
const context={window:{}};
runInNewContext(source,context);
const cards=Array.from(context.window.RELPHI_TAROT_CARDS||[]);
const byId=id=>cards.find(card=>card.card_id===id);

test('The Lovers and Art have matching full-card harmonic union passage',()=>{
  const lovers=byId('the_lovers'),art=byId('temperance');
  assert.ok(lovers&&art);
  const passage=lovers.relphi?.harmonic_union_reflection;
  assert.equal(art.relphi?.harmonic_union_reflection,passage);
  assert.match(passage,/Self and other can cease to be opposites without ceasing to be themselves/);
  assert.match(passage,/two musical notes/);
  assert.match(passage,/doesn't require either note to lose its pitch/);
  assert.match(passage,/neither is distinguishable/);
  assert.equal(lovers.astrology.sign,'Gemini');
  assert.equal(art.astrology.sign,'Sagittarius');
});
test('The Art spiral-torus idea is labeled as an observation, not historical certainty',()=>{
  const note=byId('temperance').relphi?.toroidal_visual_observation;
  assert.match(note,/Visual hypothesis/);
  assert.match(note,/spiral tori/);
  assert.match(note,/not a confirmed identification/);
  assert.equal(byId('the_lovers').relphi?.toroidal_visual_observation,undefined);
});
test('The canonical full-card renderer displays both fields via the existing Relphi layer',()=>{
  const app=readFileSync('tarot-app.js','utf8');
  const layer=app.slice(app.indexOf('function relphiLayerHtml(card)'),app.indexOf('function systemNamesHtml(card)'));
  assert.match(layer,/field\('Harmonic union · individuality preserved', rel.harmonic_union_reflection\)/);
  assert.match(layer,/field\('Art background · visual hypothesis', rel.toroidal_visual_observation\)/);
  assert.match(app,/\$\{relphiLayerHtml\(card\)\}/);
});
