import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source=await readFile('sky-chart-heptagram-canonical-v1.js','utf8');
const manifest=JSON.parse(await readFile('assets/canonical-glyphs/v1/manifest.json','utf8'));

test('Sky Chart requests the canonical combined ruler identifier',()=>{
  assert.match(source,/state\.day && state\.hour\) return 'day-and-hour-ruler'/);
  assert.doesNotMatch(source,/return 'day-hour-ruler'/);
});

test('combined ruler remains explicitly unavailable without an approved overlay',()=>{
  const combined=manifest.states.find(state=>state.state==='day-and-hour-ruler');
  assert.equal(combined?.overlay_path,null);
  assert.equal(combined?.sha256,null);
  assert.match(combined?.status||'',/^blocked-/);
  assert.match(source,/mount\.dataset\.glyphUnavailable = 'true'/);
  assert.match(source,/mount\.dataset\.requestedGlyphState = requestedState/);
});
