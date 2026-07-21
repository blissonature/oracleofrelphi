// Preview-only cleanup: remove duplicate source glyphs, close leader gaps, and raise hovered placements.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const BUBBLE_RADIUS = 17.5;
  const STROKE_OVERLAP = 1.5;
  let queued = false;

  function appendOnce(src) {
    const base = src.split('?')[0];
    if (document.querySelector('script[src^="' + base + '"]')) return;
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    document.body.appendChild(script);
  }

  function num(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : NaN;
  }

  function rootPoint(node, x, y) {
    const matrix = node.getCTM && node.getCTM();
    if (!matrix) return { x:x, y:y };
    const point = new DOMPoint(x, y).matrixTransform(matrix);
    return { x:point.x, y:point.y };
  }

  function localPoint(node, point) {
    const matrix = node.getCTM && node.getCTM();
    if (!matrix) return point;
    try {
      const local = new DOMPoint(point.x, point.y).matrixTransform(matrix.inverse());
      return { x:local.x, y:local.y };
    } catch (_) {
      return point;
    }
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

  function connectLeader(group) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    const leader = group.querySelector('line.chart-wheel-stick');
    if (!knob || !contact || !leader) return;

    const cx = num(knob.getAttribute('cx'));
    const cy = num(knob.getAttribute('cy'));
    const ax = num(contact.getAttribute('cx'));
    const ay = num(contact.getAttribute('cy'));
    if (![cx,cy,ax,ay].every(Number.isFinite)) return;

    const bubbleRoot = rootPoint(knob, cx, cy);
    const anchorRoot = rootPoint(contact, ax, ay);
    const vx = bubbleRoot.x - anchorRoot.x;
    const vy = bubbleRoot.y - anchorRoot.y;
    const length = Math.hypot(vx, vy) || 1;

    const edgeRoot = {
      x:bubbleRoot.x - vx / length * (BUBBLE_RADIUS - STROKE_OVERLAP),
      y:bubbleRoot.y - vy / length * (BUBBLE_RADIUS - STROKE_OVERLAP)
    };
    const anchorLocal = localPoint(leader, anchorRoot);
    const edgeLocal = localPoint(leader, edgeRoot);

    leader.setAttribute('x1', anchorLocal.x.toFixed(2));
    leader.setAttribute('y1', anchorLocal.y.toFixed(2));
    leader.setAttribute('x2', edgeLocal.x.toFixed(2));
    leader.setAttribute('y2', edgeLocal.y.toFixed(2));
    leader.style.strokeLinecap = 'round';
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
      connectLeader(group);
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
    appendOnce('sky-chart-calculated-points-v1.js?v=1');
    schedule();
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    window.addEventListener('relphi:extra-points-updated', schedule);
    window.addEventListener('resize', schedule, { passive:true });
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
