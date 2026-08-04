// Keeps the Moon's approved geometry scale from increasing its visible line weight.
(function () {
  'use strict';

  const INSTALL_FLAG = '__relphiMoonStrokePreservationInstalled';
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  function moonEntry(identity) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    return entry && entry.id === 'moon' ? entry : null;
  }

  function preserveStroke(art, identity) {
    const entry = moonEntry(identity);
    if (!art || !entry || art.dataset.relphiMoonStrokePreserved === 'true') return art;

    const geometryScale = Math.max(0.1, Number(entry.scale) || 1);
    if (geometryScale === 1) return art;

    const stroked = [];
    if (art.hasAttribute && art.hasAttribute('stroke-width')) stroked.push(art);
    art.querySelectorAll('[stroke-width]').forEach(node => stroked.push(node));
    stroked.forEach(node => {
      const source = parseFloat(node.getAttribute('stroke-width'));
      if (Number.isFinite(source)) node.setAttribute('stroke-width', String(source / geometryScale));
    });

    art.dataset.relphiMoonStrokePreserved = 'true';
    return art;
  }

  function wrap(base) {
    if (!base || base.moonStrokePreserved) return base;

    async function draw(parent, identity, options) {
      return preserveStroke(await base.draw(parent, identity, options), identity);
    }

    function createBubble(parent, identity, options) {
      const bubble = base.createBubble(parent, identity, options);
      return Object.assign({}, bubble, {
        ready: Promise.resolve(bubble.ready).then(art => preserveStroke(art, identity))
      });
    }

    return Object.freeze({
      draw,
      createBubble,
      fit: base.fit,
      recolor: base.recolor,
      canonicalSource: base.canonicalSource,
      moonStrokePreserved: true
    });
  }

  let current = window.RelphiGlyphComponent;
  if (current) {
    window.RelphiGlyphComponent = wrap(current);
    return;
  }

  try {
    Object.defineProperty(window, 'RelphiGlyphComponent', {
      configurable: true,
      enumerable: true,
      get: function () { return current; },
      set: function (value) { current = wrap(value); }
    });
  } catch (_) {
    const timer = setInterval(function () {
      if (!window.RelphiGlyphComponent) return;
      clearInterval(timer);
      window.RelphiGlyphComponent = wrap(window.RelphiGlyphComponent);
    }, 25);
    setTimeout(function () { clearInterval(timer); }, 10000);
  }
})();
