// Preview-only cleanup: remove duplicate source glyphs and raise hovered placements.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  let queued = false;

  function appendOnce(src) {
    const base = src.split('?')[0];
    if (document.querySelector('script[src^="' + base + '"]')) return;
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    document.body.appendChild(script);
  }

  function removeDuplicateGlyphs(group) {
    if (!group.querySelector('svg.relphi-bold-inline-glyph')) return;
    group.querySelectorAll(
      '.chart-wheel-marker-glyph, image.relphi-bubble-glyph-image, image.relphi-angle-glyph-image, svg.relphi-colored-glyph, .relphi-wheel-planet-glyph'
    ).forEach(function (node) {
      if (node.matches('svg.relphi-bold-inline-glyph')) return;
      node.remove();
    });
  }

  function raise(group) {
    if (group.dataset.relphiRaised === 'true') return;
    const parent = group.parentNode;
    if (!parent) return;
    const marker = document.createComment('relphi-placement-order');
    parent.insertBefore(marker, group);
    group.__relphiOrderMarker = marker;
    group.dataset.relphiRaised = 'true';
    parent.appendChild(group);
  }

  function restore(group) {
    const marker = group.__relphiOrderMarker;
    if (marker?.parentNode) marker.parentNode.replaceChild(group, marker);
    delete group.__relphiOrderMarker;
    delete group.dataset.relphiRaised;
  }

  function wireForeground(group) {
    if (group.dataset.relphiForegroundWired) return;
    group.dataset.relphiForegroundWired = 'true';
    group.addEventListener('pointerenter', function () { raise(group); });
    group.addEventListener('pointerleave', function () { restore(group); });
    group.addEventListener('focusin', function () { raise(group); });
    group.addEventListener('focusout', function () { restore(group); });
  }

  function run() {
    queued = false;
    document.querySelectorAll(PLACEMENT).forEach(function (group) {
      removeDuplicateGlyphs(group);
      wireForeground(group);
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(run);
  }

  function install() {
    appendOnce('sky-chart-extra-points-support-v1.js?v=1');
    appendOnce('sky-chart-calculated-points-v1.js?v=2');
    appendOnce('sky-chart-wheel-solid-hover-v1.js?v=1');
    appendOnce('sky-chart-r31-finalize-v1.js?v=1');
    schedule();
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    window.addEventListener('relphi:extra-points-updated', schedule);
    new MutationObserver(function (records) {
      if (records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE &&
            (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT) || node.matches?.('svg.relphi-bold-inline-glyph'));
        });
      })) schedule();
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
