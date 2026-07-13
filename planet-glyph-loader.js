// Restores the original Houses and Signs presentation and uses the approved
// planetary SVG set everywhere Astrology Foundations displays a planet glyph.
(function () {
  'use strict';

  if (!/(^|\/)astrology-foundations\.html$/.test(window.location.pathname)) return;

  const names = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const selector = names.map(function (name) { return `.planet-svg-${name}`; }).join(',');
  const signGlyphs = {
    aries: '\u2648\uFE0E',
    taurus: '\u2649\uFE0E',
    gemini: '\u264A\uFE0E',
    cancer: '\u264B\uFE0E',
    leo: '\u264C\uFE0E',
    virgo: '\u264D\uFE0E',
    libra: '\u264E\uFE0E',
    scorpio: '\u264F\uFE0E',
    sagittarius: '\u2650\uFE0E',
    capricorn: '\u2651\uFE0E',
    aquarius: '\u2652\uFE0E',
    pisces: '\u2653\uFE0E'
  };

  function approvedImage(name) {
    const image = document.createElement('img');
    image.className = `planet-svg planet-svg-${name} planet-glyph-approved`;
    image.src = `assets/planet-glyphs/${name}.svg`;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.decoding = 'async';
    return image;
  }

  function installRestorationStyles() {
    if (document.getElementById('astrology-foundations-restoration')) return;
    const style = document.createElement('style');
    style.id = 'astrology-foundations-restoration';
    style.textContent = `
      .house-matrix .flip-front .label {
        color: #111 !important;
        -webkit-text-fill-color: #111 !important;
      }
      .foundation-matrix [class*="sign-"] .front-glyph {
        font-family: "Segoe UI Symbol", "Noto Sans Symbols 2", "Noto Sans Symbols", "DejaVu Sans", sans-serif !important;
        font-variant-emoji: text !important;
        font-weight: 760 !important;
        text-shadow: none !important;
      }
      .foundation-matrix [class*="sign-"] .front-glyph.element-fire {
        color: #dc1f18 !important;
        -webkit-text-fill-color: #dc1f18 !important;
      }
      .foundation-matrix [class*="sign-"] .front-glyph.element-water {
        color: #1e88e5 !important;
        -webkit-text-fill-color: #1e88e5 !important;
      }
      .foundation-matrix [class*="sign-"] .front-glyph.element-air {
        color: #c99700 !important;
        -webkit-text-fill-color: #c99700 !important;
      }
      .foundation-matrix [class*="sign-"] .front-glyph.element-earth {
        color: #2e7d32 !important;
        -webkit-text-fill-color: #2e7d32 !important;
      }
      .planet-glyph-approved {
        object-fit: contain;
      }
    `;
    document.head.appendChild(style);
  }

  function restoreHouseNumbers(root) {
    (root || document).querySelectorAll('.house-matrix .flip-front .label').forEach(function (label) {
      label.style.color = '#111';
      label.style.webkitTextFillColor = '#111';
    });
  }

  function restoreSignGlyphs(root) {
    (root || document).querySelectorAll('.foundation-matrix [class*="sign-"]').forEach(function (tile) {
      const signClass = Array.from(tile.classList).find(function (className) {
        return className.indexOf('sign-') === 0;
      });
      if (!signClass) return;
      const sign = signClass.slice(5);
      const glyph = signGlyphs[sign];
      const node = tile.querySelector('.front-glyph');
      if (node && glyph && node.textContent !== glyph) node.textContent = glyph;
    });
  }

  function replacePlanetGlyphs(root) {
    (root || document).querySelectorAll(selector).forEach(function (oldGlyph) {
      if (oldGlyph.tagName === 'IMG' && oldGlyph.classList.contains('planet-glyph-approved')) return;
      const name = names.find(function (candidate) {
        return oldGlyph.classList.contains(`planet-svg-${candidate}`);
      });
      if (name) oldGlyph.replaceWith(approvedImage(name));
    });
  }

  function syncPlanetaryOrderVisual(root) {
    const scope = root || document;
    const symbolBox = scope.querySelector('.order-grid .carousel-symbol');
    if (!symbolBox || symbolBox.querySelector('#heptagramStage')) return;

    const heading = scope.querySelector('.order-planet-card h3');
    const name = heading ? heading.textContent.trim().toLowerCase() : '';
    if (!names.includes(name)) return;

    const existing = symbolBox.querySelector(`img.planet-glyph-approved.planet-svg-${name}`);
    if (existing && symbolBox.children.length === 1) return;

    symbolBox.replaceChildren(approvedImage(name));
  }

  function synchronize(root) {
    restoreHouseNumbers(root);
    restoreSignGlyphs(root);
    replacePlanetGlyphs(root);
    syncPlanetaryOrderVisual(root);
  }

  function start() {
    const grid = document.getElementById('foundationGrid');
    if (!grid) return;

    installRestorationStyles();
    synchronize(grid);

    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        synchronize(grid);
      });
    }).observe(grid, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
