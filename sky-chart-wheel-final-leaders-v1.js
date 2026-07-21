// Preview-only final leader geometry. Uses actual rendered circle centers and radii.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const OVERLAP = 1.25;
  let frame = 0;

  function rootPoint(node, x, y) {
    const matrix = node.getCTM && node.getCTM();
    if (!matrix) return new DOMPoint(x, y);
    return new DOMPoint(x, y).matrixTransform(matrix);
  }

  function localPoint(node, point) {
    const matrix = node.getCTM && node.getCTM();
    if (!matrix) return point;
    try { return point.matrixTransform(matrix.inverse()); }
    catch (_) { return point; }
  }

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  function repair(group) {
    const bubble = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    const leader = group.querySelector('line.chart-wheel-stick');
    if (!bubble || !contact || !leader) return;

    const cx = finite(bubble.getAttribute('cx'));
    const cy = finite(bubble.getAttribute('cy'));
    const radius = finite(bubble.getAttribute('r')) || 16.5;
    const ax = finite(contact.getAttribute('cx'));
    const ay = finite(contact.getAttribute('cy'));
    if (![cx, cy, radius, ax, ay].every(Number.isFinite)) return;

    const center = rootPoint(bubble, cx, cy);
    const radiusPoint = rootPoint(bubble, cx + radius, cy);
    const renderedRadius = Math.hypot(radiusPoint.x - center.x, radiusPoint.y - center.y) || radius;
    const anchor = rootPoint(contact, ax, ay);
    const dx = center.x - anchor.x;
    const dy = center.y - anchor.y;
    const distance = Math.hypot(dx, dy) || 1;
    const edge = new DOMPoint(
      center.x - dx / distance * Math.max(0, renderedRadius - OVERLAP),
      center.y - dy / distance * Math.max(0, renderedRadius - OVERLAP)
    );

    const start = localPoint(leader, anchor);
    const end = localPoint(leader, edge);
    leader.setAttribute('x1', start.x.toFixed(2));
    leader.setAttribute('y1', start.y.toFixed(2));
    leader.setAttribute('x2', end.x.toFixed(2));
    leader.setAttribute('y2', end.y.toFixed(2));
    leader.style.strokeLinecap = 'round';
  }

  function run() {
    frame = 0;
    document.querySelectorAll(PLACEMENT).forEach(repair);
  }

  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(function () {
      frame = requestAnimationFrame(run);
    });
  }

  window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
  window.addEventListener('relphi:extra-points-updated', schedule);
  window.addEventListener('resize', schedule, { passive:true });
  new MutationObserver(function (records) {
    if (records.some(function (record) {
      return Array.from(record.addedNodes || []).some(function (node) {
        return node.nodeType === Node.ELEMENT_NODE &&
          (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT));
      });
    })) schedule();
  }).observe(document.body, { childList:true, subtree:true });
  schedule();
})();