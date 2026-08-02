// Sky Chart glyph presentation contract.
// Every uncircled glyph is rendered from the canonical circled composition with
// only its calibration circle hidden. This preserves the approved scale, offset,
// support strokes, and optical white space in every Sky Chart context.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyGlyphFramingV1) return;
  window.__relphiSkyGlyphFramingV1 = true;

  function resolveEntry(identity) {
    const registry = window.RelphiGlyphRegistry;
    return registry && (registry.get(identity) || registry.resolve(identity));
  }

  function hideCalibrationCircle(bubble, strokeWidth) {
    if (!bubble?.root || !bubble?.circle) return;
    bubble.root.classList.add('relphi-glyph-framed');
    bubble.root.dataset.canonicalFraming = 'hidden-bubble';
    bubble.root.dataset.frameStrokeWidth = String(strokeWidth);
    bubble.circle.setAttribute('fill', 'transparent');
    bubble.circle.setAttribute('stroke', 'transparent');
    bubble.circle.setAttribute('opacity', '0');
    bubble.circle.setAttribute('aria-hidden', 'true');
    bubble.circle.style.setProperty('fill', 'transparent', 'important');
    bubble.circle.style.setProperty('stroke', 'transparent', 'important');
    bubble.circle.style.setProperty('opacity', '0', 'important');
    bubble.circle.style.pointerEvents = 'none';
  }

  function wrap(base) {
    if (!base || base.skyWhitespaceAware) return base;

    async function draw(parent, identity, options) {
      const entry = resolveEntry(identity);
      if (!entry) throw new Error('Unknown canonical glyph identity: ' + identity);
      if (!base.createBubble) return base.draw(parent, entry.id, options);

      const radius = Number(options?.radius || 18);
      const padding = Number(options?.padding ?? 1);
      const color = options?.color || '#dc1f18';
      const strokeWidth = Number(options?.frameStrokeWidth ?? options?.strokeWidth ?? 2.35);
      const bubble = base.createBubble(parent, entry.id, {
        radius,
        padding,
        color,
        fill:'transparent',
        strokeWidth
      });

      hideCalibrationCircle(bubble, strokeWidth);
      const art = await bubble.ready;
      if (art) {
        art.dataset.relphiWhitespaceAware = 'true';
        art.dataset.relphiCanonicalGlyphId = entry.id;
      }
      bubble.root.dataset.glyphId = entry.id;
      return art;
    }

    function fit(node, radius, padding, entry, bubbleStrokeWidth) {
      const frame = node?.closest?.('.relphi-glyph-framed');
      const stored = Number(frame?.dataset?.frameStrokeWidth);
      return base.fit(
        node,
        radius,
        padding,
        entry,
        Number.isFinite(stored) ? stored : bubbleStrokeWidth
      );
    }

    return Object.freeze(Object.assign({}, base, {
      draw,
      fit,
      skyWhitespaceAware:true,
      skyGlyphFramingVersion:'v1'
    }));
  }

  if (window.RelphiGlyphComponent) {
    window.RelphiGlyphComponent = wrap(window.RelphiGlyphComponent);
    return;
  }

  let current;
  try {
    Object.defineProperty(window, 'RelphiGlyphComponent', {
      configurable:true,
      enumerable:true,
      get:function () { return current; },
      set:function (value) { current = wrap(value); }
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
