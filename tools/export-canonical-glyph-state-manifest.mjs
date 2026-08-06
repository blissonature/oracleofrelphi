import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL = 'https://oracleofrelphi.com/glyphs-unified-preview.html';
const EXPECTED_GLYPHS = 93;
const outputPath = path.resolve(process.argv[2] || 'relphi-canonical-glyph-manifest-v1.js');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text());
});

try {
  await page.goto(SOURCE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(expected => {
    const status = document.getElementById('ugStatus')?.textContent || '';
    return document.querySelectorAll('.ug-card').length === expected && /canonical glyph masters loaded/i.test(status);
  }, EXPECTED_GLYPHS, { timeout: 60000 });

  const withCircles = page.locator('[data-circle="true"]');
  if (await withCircles.count()) {
    await withCircles.click();
    await page.waitForFunction(expected => document.querySelectorAll('.ug-card').length === expected, EXPECTED_GLYPHS);
  }

  const payload = await page.evaluate(({ sourceUrl, expectedGlyphs }) => {
    const serializer = new XMLSerializer();
    const normalize = value => String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim().toLowerCase();

    function canonicalizePaint(svg) {
      const blackValues = new Set(['#111', '#111111', 'rgb(17, 17, 17)']);
      svg.querySelectorAll('*').forEach(node => {
        ['fill', 'stroke'].forEach(attribute => {
          const value = node.getAttribute(attribute);
          if (value && blackValues.has(value.trim().toLowerCase())) node.setAttribute(attribute, 'currentColor');
        });
        ['fill', 'stroke'].forEach(property => {
          const value = node.style?.getPropertyValue(property);
          if (value && blackValues.has(value.trim().toLowerCase())) node.style.setProperty(property, 'currentColor');
        });
      });
    }

    function serializeSvg(svg) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      return serializer.serializeToString(svg);
    }

    const cards = Array.from(document.querySelectorAll('.ug-card'));
    if (cards.length !== expectedGlyphs) throw new Error(`Expected ${expectedGlyphs} glyph cards; found ${cards.length}.`);

    const registry = window.RelphiGlyphRegistry;
    if (!registry || registry.entries.length !== expectedGlyphs) {
      throw new Error(`Expected ${expectedGlyphs} registry entries; found ${registry?.entries?.length || 0}.`);
    }

    const glyphs = {};
    const aliases = {};
    let ringMarkup = null;
    let ringViewBox = null;

    cards.forEach(card => {
      const id = card.querySelector('.ug-id')?.textContent?.trim();
      const name = card.querySelector('.ug-name')?.textContent?.trim();
      const rendered = card.querySelector('.ug-stage > svg');
      if (!id || !name || !rendered) throw new Error('Master Glyph List card is missing id, name, or SVG.');

      const base = rendered.cloneNode(true);
      const bubble = base.querySelector(':scope > .relphi-glyph-bubble');
      const ring = bubble?.querySelector(':scope > circle');
      if (!bubble || !ring) throw new Error(`Canonical ring was not found for ${id}.`);

      const overlaySvg = rendered.cloneNode(false);
      overlaySvg.removeAttribute('aria-label');
      const overlayRoot = bubble.cloneNode(false);
      overlayRoot.removeAttribute('data-glyph-id');
      overlayRoot.appendChild(ring.cloneNode(true));
      overlaySvg.appendChild(overlayRoot);
      canonicalizePaint(overlaySvg);
      const candidateRingMarkup = serializeSvg(overlaySvg);
      const candidateRingViewBox = overlaySvg.getAttribute('viewBox');

      if (ringMarkup === null) {
        ringMarkup = candidateRingMarkup;
        ringViewBox = candidateRingViewBox;
      } else if (candidateRingMarkup !== ringMarkup || candidateRingViewBox !== ringViewBox) {
        throw new Error(`Outer-ring geometry differs for ${id}; export stopped.`);
      }

      ring.remove();
      base.setAttribute('aria-label', name);
      canonicalizePaint(base);
      const viewBox = base.getAttribute('viewBox');
      if (!viewBox) throw new Error(`Canonical canvas is missing for ${id}.`);

      glyphs[id] = Object.freeze({
        id,
        name,
        viewBox,
        markup: serializeSvg(base)
      });
    });

    registry.entries.forEach(entry => {
      [entry.id, entry.name, ...(entry.aliases || [])].forEach(alias => {
        const key = normalize(alias);
        if (key) aliases[key] = entry.id;
      });
    });

    return {
      source: sourceUrl,
      exportedAt: new Date().toISOString(),
      glyphs,
      aliases,
      layers: {
        ring: {
          id: 'ring',
          viewBox: ringViewBox,
          markup: ringMarkup
        }
      },
      states: {
        plain: [],
        circled: ['ring']
      }
    };
  }, { sourceUrl: SOURCE_URL, expectedGlyphs: EXPECTED_GLYPHS });

  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
  if (Object.keys(payload.glyphs).length !== EXPECTED_GLYPHS) {
    throw new Error(`Export produced ${Object.keys(payload.glyphs).length} glyphs instead of ${EXPECTED_GLYPHS}.`);
  }

  const source = [
    '// Generated only from https://oracleofrelphi.com/glyphs-unified-preview.html.',
    '// Do not hand-edit geometry, viewBoxes, transforms, paths, whitespace, or state overlays.',
    '(function () {',
    "  'use strict';",
    `  const manifest = ${JSON.stringify(payload, null, 2)};`,
    '  window.RelphiCanonicalGlyphManifestV1 = Object.freeze(manifest);',
    '  if (!window.RelphiCanonicalGlyphState) throw new Error(\'Canonical glyph state contract must load before the manifest.\');',
    '  window.RelphiCanonicalGlyphState.registerManifest(manifest);',
    '})();',
    ''
  ].join('\n');

  await fs.writeFile(outputPath, source, 'utf8');
  console.log(`Exported ${EXPECTED_GLYPHS} canonical glyphs to ${outputPath}`);
} finally {
  await browser.close();
}
