// Standardizes planetary and zodiac glyphs in SVG wheels on Planetary Hours and Tarot Ledger.
(function () {
  'use strict';

  const path = location.pathname;
  if (!/(^|\/)(planetaryhours|tarot)\.html$/.test(path)) return;

  const PLANETS = {
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto',
    'PL':'pluto','Pl':'pluto','pl':'pluto','⊕':'earth','♁':'earth','🜨':'earth'
  };

  const SIGNS = {
    '♈':'♈︎','♉':'♉︎','♊':'♊︎','♋':'♋︎','♌':'♌︎','♍':'♍︎',
    '♎':'♎︎','♏':'♏︎','♐':'♐︎','♑':'♑︎','♒':'♒︎','♓':'♓︎'
  };

  const SIGN_SET = new Set(Object.keys(SIGNS));
  const NS = 'http://www.w3.org/2000/svg';

  function bareText(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function looksLikeWheel(svg) {
    const marker = ((svg.id || '') + ' ' + (svg.getAttribute('class') || '')).toLowerCase();
    if (/zodiac|wheel|chart|astro|sky/.test(marker)) return true;

    let signCount = 0;
    svg.querySelectorAll('text').forEach(function (node) {
      if (SIGN_SET.has(bareText(node.textContent))) signCount += 1;
    });
    return signCount >= 4;
  }

  function copyPresentationAttributes(from, to) {
    Array.from(from.attributes).forEach(function (attribute) {
      if (!['x','y','dx','dy','text-anchor','font-family','font-size','font-weight'].includes(attribute.name)) {
        to.setAttribute(attribute.name, attribute.value);
      }
    });
  }

  function replacePlanetText(node, name) {
    const x = Number(node.getAttribute('x') || 0);
    const y = Number(node.getAttribute('y') || 0);
    const fontSize = Number(node.getAttribute('font-size') || getComputedStyle(node).fontSize.replace('px','') || 18);
    const size = Math.max(14, Math.min(32, fontSize || 18));

    const image = document.createElementNS(NS, 'image');
    copyPresentationAttributes(node, image);
    image.setAttribute('href', 'assets/planet-glyphs/' + name + '.svg?v=3');
    image.setAttribute('x', String(x - size / 2));
    image.setAttribute('y', String(y - size / 2));
    image.setAttribute('width', String(size));
    image.setAttribute('height', String(size));
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    image.setAttribute('aria-label', name.charAt(0).toUpperCase() + name.slice(1));
    image.classList.add('standardized-planet-glyph');
    node.replaceWith(image);
  }

  function standardizeSvg(svg) {
    if (!looksLikeWheel(svg)) return;

    svg.querySelectorAll('text').forEach(function (node) {
      const raw = bareText(node.textContent);
      const planet = PLANETS[raw];
      if (planet) {
        replacePlanetText(node, planet);
        return;
      }

      if (SIGN_SET.has(raw)) {
        node.textContent = SIGNS[raw];
        node.style.fontFamily = '"Segoe UI Symbol", "Noto Sans Symbols 2", "Noto Sans Symbols", "DejaVu Sans", sans-serif';
        node.style.fontVariantEmoji = 'text';
        node.style.fontWeight = '700';
      }
    });
  }

  function standardizeHtmlGlyphs(root) {
    (root || document).querySelectorAll('[data-planet], .planet-glyph, .glyph').forEach(function (node) {
      if (node.closest('svg')) return;
      const raw = bareText(node.textContent);
      const name = PLANETS[raw];
      if (!name || node.querySelector('img.standardized-planet-glyph-html')) return;

      const img = document.createElement('img');
      img.src = 'assets/planet-glyphs/' + name + '.svg?v=3';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.className = 'standardized-planet-glyph-html';
      img.style.width = '1.15em';
      img.style.height = '1.15em';
      img.style.objectFit = 'contain';
      img.style.verticalAlign = '-0.16em';
      node.replaceChildren(img);
    });
  }

  function run(root) {
    (root || document).querySelectorAll('svg').forEach(standardizeSvg);
    standardizeHtmlGlyphs(root || document);
  }

  function start() {
    run(document);
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        run(document);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
