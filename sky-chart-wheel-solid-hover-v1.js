// Preview-only: normalize placement opacity and make surfaced placements fully solid.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const SOLID_SELECTORS = [
    '.chart-wheel-stick-knob',
    '.chart-wheel-marker-glyph',
    'svg.relphi-bold-inline-glyph',
    '.chart-wheel-stick'
  ].join(',');

  function setSolid(group, solid) {
    group.querySelectorAll(SOLID_SELECTORS).forEach(function (node) {
      if (solid) {
        if (node.dataset.relphiBaseOpacity == null) {
          node.dataset.relphiBaseOpacity = node.style.opacity || '';
          node.dataset.relphiBaseFillOpacity = node.style.fillOpacity || '';
          node.dataset.relphiBaseStrokeOpacity = node.style.strokeOpacity || '';
        }
        node.style.setProperty('opacity', '1', 'important');
        node.style.setProperty('fill-opacity', '1', 'important');
        node.style.setProperty('stroke-opacity', '1', 'important');
      } else {
        const opacity = node.dataset.relphiBaseOpacity;
        const fillOpacity = node.dataset.relphiBaseFillOpacity;
        const strokeOpacity = node.dataset.relphiBaseStrokeOpacity;
        if (opacity) node.style.opacity = opacity; else node.style.removeProperty('opacity');
        if (fillOpacity) node.style.fillOpacity = fillOpacity; else node.style.removeProperty('fill-opacity');
        if (strokeOpacity) node.style.strokeOpacity = strokeOpacity; else node.style.removeProperty('stroke-opacity');
      }
    });
  }

  function normalize(group) {
    const knob = group.querySelector('.chart-wheel-stick-knob');
    if (knob) {
      knob.style.setProperty('fill-opacity', '1', 'important');
      knob.style.setProperty('stroke-opacity', '1', 'important');
    }
  }

  function wire(group) {
    if (group.dataset.relphiSolidHoverWired === 'true') return;
    group.dataset.relphiSolidHoverWired = 'true';
    normalize(group);
    group.addEventListener('pointerenter', function () { setSolid(group, true); });
    group.addEventListener('pointerleave', function () { setSolid(group, false); normalize(group); });
    group.addEventListener('focusin', function () { setSolid(group, true); });
    group.addEventListener('focusout', function () { setSolid(group, false); normalize(group); });
  }

  function run() {
    document.querySelectorAll(PLACEMENT).forEach(wire);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once:true });
  else run();
  window.addEventListener('relphi:sky-builder-v4-loaded', run);
  window.addEventListener('relphi:extra-points-updated', run);
})();