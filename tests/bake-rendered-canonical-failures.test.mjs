import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';

import {
  bakeCapturedSvg,
  compareSvgPair,
  equivalencePassed
} from '../tools/bake-rendered-canonical-vectors.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const fixtures = JSON.parse(await readFile(new URL('./fixtures/bake-rendered-canonical-failures.json', import.meta.url), 'utf8'));

for (const fixture of fixtures) {
  test(`${fixture.id} retains the strict captured-authority regression`, async () => {
    const captured = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fixture.svgViewBox}" role="img" aria-label="${fixture.name}">${fixture.bubbleOuterHTML}</svg>\n`;
    const plain = captured.replace(fixture.ringOuterHTML, '');
    const baked = bakeCapturedSvg(captured, { identity:fixture.id, name:fixture.name });
    assert.equal(baked.status, 'exact-static-candidate');
    const results = await compareSvgPair(sharp, plain, baked.output, [100, 400, 1000], [1, 2]);
    assert.deepEqual(results.map(result => result.differingPixels), fixture.expectedDifferingPixels);
    assert.equal(equivalencePassed(results), false, 'a nonzero identity must remain withheld');
    for (const result of results) assert.deepEqual(result.firstVisibleBounds, result.secondVisibleBounds);
  });
}

test('preserves paint-order and clip-rule semantics', () => {
  const source = '<svg viewBox="-32 -32 64 64"><g class="relphi-glyph-bubble"><circle aria-hidden="true" r="19"/><path d="M0 0L1 1" fill-rule="evenodd" clip-rule="evenodd" paint-order="stroke fill"/></g></svg>';
  const baked = bakeCapturedSvg(source, { identity:'paint-semantics', name:'Paint semantics' });
  assert.match(baked.output, /fill-rule="evenodd"/);
  assert.match(baked.output, /clip-rule="evenodd"/);
  assert.match(baked.output, /paint-order="stroke fill"/);
});

test('preserves an axis-aligned rectangle as a rectangle', () => {
  const source = '<svg viewBox="-32 -32 64 64"><g class="relphi-glyph-bubble"><circle aria-hidden="true" r="19"/><g transform="translate(2 3) scale(2)"><rect x="-2" y="-3" width="4" height="6"/></g></g></svg>';
  const baked = bakeCapturedSvg(source, { identity:'rect-semantics', name:'Rect semantics' });
  assert.equal(baked.geometryElementCount, 1);
  assert.match(baked.output, /<rect\b/);
  assert.doesNotMatch(baked.output, /<path\b/);
});
