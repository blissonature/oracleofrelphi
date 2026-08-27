// Astrology Foundations glyph consumer. Geometry comes only from the Master Glyph List runtime.
(function () {
  'use strict';
  if (!/(^|\/)astrology-foundations\.html$/.test(location.pathname)) return;
  if (window.__relphiAstrologyFoundationsCanonicalGlyphsV1) return;
  window.__relphiAstrologyFoundationsCanonicalGlyphsV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const PLANETS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  let queued = false;

  function canonicalSvg(id, className, circled) {
    const svg = document.createElementNS(NS, 'svg');
    svg.className.baseVal = className || '';
    // Match the Master Glyph List host exactly; only the surrounding tool layout changes.
    svg.setAttribute('viewBox', '-32 -32 64 64');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.dataset.canonicalGlyphId = id;
    svg.dataset.masterGlyphSource = 'glyphs-unified-preview.html';
    if ((className || '').split(/\s+/).includes('front-glyph')) {
      Object.assign(svg.style, {
        width:'64px',
        height:'64px',
        maxWidth:'82%',
        maxHeight:'82%',
        display:'block',
        overflow:'visible'
      });
    }
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(id) || registry.resolve(id));
    if (!entry || !component?.createBubble) return svg;
    try {
      const bubble = component.createBubble(svg, entry.id, { radius:19, padding:1, color:'currentColor' });
      bubble.circle.style.opacity = circled ? '1' : '0';
      bubble.circle.setAttribute('aria-hidden', 'true');
      Promise.resolve(bubble.ready).catch(() => svg.replaceChildren());
    } catch (_) {
      svg.replaceChildren();
    }
    return svg;
  }

  function planetId(node) {
    return PLANETS.find(id => node.classList.contains('planet-svg-' + id)) || null;
  }

  function replacePlanetGlyphs(root) {
    const selector = PLANETS.map(id => '.planet-svg-' + id).join(',');
    (root || document).querySelectorAll(selector).forEach(node => {
      const id = planetId(node);
      if (!id || node.dataset.canonicalGlyphId === id) return;
      const classes = Array.from(node.classList).join(' ');
      node.replaceWith(canonicalSvg(id, classes, false));
    });
  }

  function replaceSignGlyphs(root) {
    (root || document).querySelectorAll('.foundation-matrix [class*="sign-"]').forEach(tile => {
      const signClass = Array.from(tile.classList).find(name => name.startsWith('sign-'));
      const id = signClass && signClass.slice(5);
      if (!SIGNS.includes(id)) return;
      const old = tile.querySelector('.front-glyph');
      if (!old || old.dataset.canonicalGlyphId === id) return;
      const classes = Array.from(old.classList).join(' ');
      old.replaceWith(canonicalSvg(id, classes, false));
    });
  }

  function synchronize(root) {
    replacePlanetGlyphs(root);
    replaceSignGlyphs(root);
  }

  function schedule(root) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      synchronize(root || document);
    });
  }

  function start() {
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent) {
      setTimeout(start, 40);
      return;
    }
    const root = document.getElementById('foundationGrid') || document;
    synchronize(root);
    new MutationObserver(() => schedule(root)).observe(root, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
