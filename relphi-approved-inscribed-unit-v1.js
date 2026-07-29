// Preserves the approved glyphs-unified-preview inscribed unit as one atomic master.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const REFERENCE_RADIUS = 19;
  const REFERENCE_PADDING = 1;
  const REFERENCE_STROKE = 2.35;
  const NS = 'http://www.w3.org/2000/svg';

  function install(attempt) {
    if (window.__relphiApprovedInscribedUnitV1) return;
    const component = window.RelphiGlyphComponent;
    if (!component || typeof component.createBubble !== 'function') {
      if (attempt < 200) setTimeout(function () { install(attempt + 1); }, 50);
      return;
    }

    const originalCreateBubble = component.createBubble.bind(component);

    function createBubble(parent, identity, options) {
      const requestedRadius = Number(options?.radius || REFERENCE_RADIUS);
      const scale = requestedRadius / REFERENCE_RADIUS;
      const unit = document.createElementNS(NS, 'g');
      unit.classList.add('relphi-approved-inscribed-unit');
      unit.dataset.masterSource = 'glyphs-unified-preview@0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
      unit.dataset.masterRadius = String(REFERENCE_RADIUS);
      unit.setAttribute('transform', 'scale(' + scale.toFixed(6) + ')');
      parent.appendChild(unit);

      const rendered = originalCreateBubble(unit, identity, {
        radius: REFERENCE_RADIUS,
        padding: REFERENCE_PADDING,
        color: options?.color || '#111111',
        fill: options?.fill || '#ffffff',
        strokeWidth: REFERENCE_STROKE
      });

      return {
        root: unit,
        circle: rendered.circle,
        entry: rendered.entry,
        ready: rendered.ready.then(function () {
          unit.dataset.ready = 'true';
          return unit;
        })
      };
    }

    window.RelphiGlyphComponent = Object.freeze({
      ...component,
      createBubble
    });
    window.__relphiApprovedInscribedUnitV1 = true;

    document.querySelectorAll('.relphi-canonical-marker-layer,.relphi-canonical-zodiac-ring').forEach(function (node) {
      node.remove();
    });
    document.querySelectorAll('.relphi-canonical-ready,.relphi-canonical-fallback').forEach(function (svg) {
      svg.classList.remove('relphi-canonical-ready', 'relphi-canonical-fallback');
    });
    window.dispatchEvent(new Event('relphi:extra-points-updated'));
  }

  install(0);
})();