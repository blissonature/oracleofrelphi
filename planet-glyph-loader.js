// Replaces Astrology Foundations' constructed planet glyphs with the approved SVG artwork.
(function () {
  'use strict';

  if (!/(^|\/)astrology-foundations\.html$/.test(window.location.pathname)) return;

  const names = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const selector = names.map(name => `.planet-svg-${name}`).join(',');

  function replacePlanetGlyphs(root) {
    (root || document).querySelectorAll(selector).forEach(function (oldGlyph) {
      if (oldGlyph.tagName === 'IMG') return;
      const name = names.find(function (candidate) {
        return oldGlyph.classList.contains(`planet-svg-${candidate}`);
      });
      if (!name) return;

      const image = document.createElement('img');
      image.className = `planet-svg planet-svg-${name} planet-glyph-approved`;
      image.src = `assets/planet-glyphs/${name}.svg`;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.decoding = 'async';
      oldGlyph.replaceWith(image);
    });
  }

  function start() {
    const grid = document.getElementById('foundationGrid');
    if (!grid) return;

    replacePlanetGlyphs(grid);
    new MutationObserver(function () {
      replacePlanetGlyphs(grid);
    }).observe(grid, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
