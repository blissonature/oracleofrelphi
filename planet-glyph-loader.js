// Restores the original Houses and Signs presentation, uses the approved
// planetary SVG set everywhere, and supplies the mobile layout/controls for
// Astrology Foundations without changing the desktop presentation.
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
      .planet-glyph-approved { object-fit: contain; }

      /* Mobile: every control stays inside the viewport. */
      @media (max-width: 560px) {
        .foundation-page {
          width: 100%;
          max-width: none;
          margin: 1.25rem auto .75rem;
          padding: 0 .55rem;
          box-sizing: border-box;
          overflow-x: hidden;
        }
        .foundation-panel {
          width: 100%;
          padding: .65rem;
          box-sizing: border-box;
          overflow: hidden;
        }
        .foundation-tabs {
          gap: .38rem;
          margin-bottom: .8rem;
        }
        .foundation-tabs button {
          padding: .46rem .62rem;
          font-size: .86rem;
        }
        .matrix-scroll {
          width: 100%;
          overflow: visible;
          padding: 0;
        }
        .house-matrix {
          min-width: 0 !important;
          width: 100%;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: .42rem;
        }
        .house-matrix .flip-tile {
          height: 4.15rem;
          min-width: 0;
        }
        .house-matrix .flip-front .label {
          font-size: clamp(1.7rem, 10vw, 2.4rem) !important;
        }
        .planet-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .planet-grid .flip-tile {
          height: 4.55rem;
        }

        .moon-tool-shell {
          display: grid;
          grid-template-columns: 1fr;
          gap: .6rem;
          width: 100%;
        }
        .moon-tool-card,
        .moon-info-card {
          min-width: 0;
          padding: .65rem;
          border-radius: .9rem;
        }
        .moon-tool-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 8.75rem;
          gap: .55rem;
          align-items: center;
        }
        .moon-controls {
          min-width: 0;
          margin: 0;
          gap: .5rem;
        }
        .moon-controls-row {
          min-height: 1.25rem;
          margin: 0;
        }
        .moon-controls label {
          min-width: 0;
          font-size: .88rem;
        }
        .moon-controls input[type="range"] {
          display: block;
          width: 100%;
          min-width: 0;
          margin: .15rem 0 0;
        }
        .moon-range-note {
          margin: 0;
          font-size: .7rem;
          line-height: 1.25;
        }
        .moon-tool-card .moon-display {
          width: 8.75rem;
          padding: 0;
        }
        .moon-orbit {
          width: 8.75rem !important;
          max-width: 8.75rem;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }
        #moonOrbitStage,
        #moonOrbitStage * {
          touch-action: none;
        }
        .moon-orbit-hit {
          stroke-width: 38 !important;
        }
        .moon-orbit-handle-hit {
          r: 22;
        }
        .moon-info-card {
          display: grid;
          grid-template-columns: 6.75rem minmax(0, 1fr);
          column-gap: .65rem;
          align-items: center;
        }
        .moon-info-card > .moon-display {
          grid-row: 1 / span 3;
          width: 6.75rem;
          padding: 0;
        }
        .moon-phase-disc {
          width: 6.75rem !important;
          max-width: 6.75rem;
        }
        .moon-info-card h3 {
          margin: 0 0 .3rem;
          font-size: 1rem;
          line-height: 1.15;
        }
        .moon-info-card .mini-fields {
          margin: 0;
          font-size: .78rem;
        }
        .moon-info-card .mini-fields th,
        .moon-info-card .mini-fields td {
          padding: .28rem .32rem;
        }
        .moon-info-card .mini-fields th {
          width: 5rem;
        }
        .moon-calendar-drawer {
          margin-top: .6rem;
        }
      }

      @media (max-width: 350px) {
        .house-matrix,
        .planet-grid {
          grid-template-columns: 1fr !important;
        }
        .moon-tool-card {
          grid-template-columns: 1fr 7.7rem;
        }
        .moon-tool-card .moon-display,
        .moon-orbit {
          width: 7.7rem !important;
          max-width: 7.7rem;
        }
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

  function installMoonDragFix(grid) {
    let draggingPointer = null;

    function setPhaseFromPointer(event) {
      const stage = document.getElementById('moonOrbitStage');
      const slider = document.getElementById('moonPhaseSlider');
      if (!stage || !slider) return;

      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width * 220;
      const y = (event.clientY - rect.top) / rect.height * 220;
      const angle = Math.atan2(y - 110, x - 110);
      let phase = (angle + Math.PI / 2) / (Math.PI * 2);
      phase = ((phase % 1) + 1) % 1;

      slider.value = String(Math.round(phase * 1000));
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }

    grid.addEventListener('pointerdown', function (event) {
      if (!event.target.closest('#moonOrbitStage')) return;
      draggingPointer = event.pointerId;
      event.preventDefault();
      event.stopImmediatePropagation();
      setPhaseFromPointer(event);
    }, true);

    window.addEventListener('pointermove', function (event) {
      if (draggingPointer !== event.pointerId) return;
      event.preventDefault();
      setPhaseFromPointer(event);
    }, { passive: false });

    function stop(event) {
      if (draggingPointer === event.pointerId) draggingPointer = null;
    }
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  }

  function start() {
    const grid = document.getElementById('foundationGrid');
    if (!grid) return;

    installRestorationStyles();
    installMoonDragFix(grid);
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
