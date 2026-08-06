// Standardizes planetary and zodiac glyphs in SVG wheels on Planetary Hours and Tarot Ledger.
// Geometry comes only from https://oracleofrelphi.com/glyphs-unified-preview.html.
(function () {
  'use strict';

  if (!/(^|\/)(planetaryhours|tarot)\.html$/.test(location.pathname)) return;
  if (window.__relphiCanonicalWheelStandardizerV1) return;
  window.__relphiCanonicalWheelStandardizerV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const IDENTITIES = Object.freeze({
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto',
    'PL':'pluto','Pl':'pluto','pl':'pluto','♈':'aries','♉':'taurus','♊':'gemini','♋':'cancer',
    '♌':'leo','♍':'virgo','♎':'libra','♏':'scorpio','♐':'sagittarius','♑':'capricorn',
    '♒':'aquarius','♓':'pisces'
  });
  let queued = false;

  const bare = value => String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();

  function looksLikeWheel(svg) {
    const marker = ((svg.id || '') + ' ' + (svg.getAttribute('class') || '')).toLowerCase();
    if (/zodiac|wheel|chart|astro|sky/.test(marker)) return true;
    let count = 0;
    svg.querySelectorAll('text').forEach(node => { if (IDENTITIES[bare(node.textContent)]) count += 1; });
    return count >= 4;
  }

  function renderCanonical(svg, id, color, circled) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(id) || registry.resolve(id));
    if (!entry || !component?.createBubble) return;
    const bubble = component.createBubble(svg, entry.id, { radius:19, padding:1, color:color || 'currentColor' });
    bubble.circle.style.opacity = circled ? '1' : '0';
    bubble.circle.setAttribute('aria-hidden', 'true');
    bubble.root.dataset.masterGlyphSource = 'https://oracleofrelphi.com/glyphs-unified-preview.html';
    Promise.resolve(bubble.ready).catch(() => svg.replaceChildren());
  }

  function nestedSvgForText(node, id) {
    const x = Number(node.getAttribute('x') || 0);
    const y = Number(node.getAttribute('y') || 0);
    const computed = parseFloat(getComputedStyle(node).fontSize) || 18;
    const size = Math.max(18, Math.min(38, computed));
    const nested = document.createElementNS(NS, 'svg');
    Array.from(node.attributes).forEach(attribute => {
      if (!['x','y','dx','dy','text-anchor','font-family','font-size','font-weight'].includes(attribute.name)) nested.setAttribute(attribute.name, attribute.value);
    });
    nested.setAttribute('x', String(x - size / 2));
    nested.setAttribute('y', String(y - size / 2));
    nested.setAttribute('width', String(size));
    nested.setAttribute('height', String(size));
    nested.setAttribute('viewBox', '-19 -19 38 38');
    nested.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    nested.setAttribute('aria-label', id);
    nested.dataset.canonicalGlyphId = id;
    node.replaceWith(nested);
    renderCanonical(nested, id, node.getAttribute('fill') || getComputedStyle(node).fill || 'currentColor', false);
  }

  function standardizeSvg(svg) {
    if (!looksLikeWheel(svg)) return;
    svg.querySelectorAll('text').forEach(node => {
      const id = IDENTITIES[bare(node.textContent)];
      if (id) nestedSvgForText(node, id);
    });
  }

  function inlineSvg(node, id) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-19 -19 38 38');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.width = '1.15em';
    svg.style.height = '1.15em';
    svg.style.verticalAlign = '-0.16em';
    svg.dataset.canonicalGlyphId = id;
    node.replaceChildren(svg);
    renderCanonical(svg, id, getComputedStyle(node).color || 'currentColor', false);
  }

  function standardizeHtmlGlyphs(root) {
    (root || document).querySelectorAll('[data-planet], .planet-glyph, .glyph').forEach(node => {
      if (node.closest('svg') || node.querySelector('svg[data-canonical-glyph-id]')) return;
      const id = IDENTITIES[bare(node.textContent)];
      if (id) inlineSvg(node, id);
    });
  }

  function run(root) {
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent?.createBubble) return;
    (root || document).querySelectorAll('svg').forEach(standardizeSvg);
    standardizeHtmlGlyphs(root || document);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; run(document); });
  }

  function start() {
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent?.createBubble) {
      setTimeout(start, 40);
      return;
    }
    run(document);
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
