// Sky Chart preview: leaders terminate at each final placement-circle center.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const SVG_SELECTOR = '.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg';
  let queued = false;

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function toRoot(node, x, y) {
    const matrix = node.getCTM?.();
    return matrix ? new DOMPoint(x, y).matrixTransform(matrix) : new DOMPoint(x, y);
  }

  function fromRoot(node, point) {
    const matrix = node.getCTM?.();
    if (!matrix) return point;
    try { return point.matrixTransform(matrix.inverse()); }
    catch (_) { return point; }
  }

  function centerAnchor(group) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    const leader = group.querySelector('line.chart-wheel-stick');
    if (!knob || !contact || !leader) return;

    const cx = number(knob.getAttribute('cx'));
    const cy = number(knob.getAttribute('cy'));
    const ax = number(contact.getAttribute('cx'));
    const ay = number(contact.getAttribute('cy'));
    if (![cx, cy, ax, ay].every(Number.isFinite)) return;

    const bubbleCenter = toRoot(knob, cx, cy);
    const contactCenter = toRoot(contact, ax, ay);
    const localBubble = fromRoot(leader, bubbleCenter);
    const localContact = fromRoot(leader, contactCenter);

    const x1 = number(leader.getAttribute('x1'));
    const y1 = number(leader.getAttribute('y1'));
    const x2 = number(leader.getAttribute('x2'));
    const y2 = number(leader.getAttribute('y2'));
    const firstRoot = toRoot(leader, x1, y1);
    const secondRoot = toRoot(leader, x2, y2);
    const firstIsContact = Math.hypot(firstRoot.x - contactCenter.x, firstRoot.y - contactCenter.y) <=
      Math.hypot(secondRoot.x - contactCenter.x, secondRoot.y - contactCenter.y);

    if (firstIsContact) {
      leader.setAttribute('x1', localContact.x.toFixed(2));
      leader.setAttribute('y1', localContact.y.toFixed(2));
      leader.setAttribute('x2', localBubble.x.toFixed(2));
      leader.setAttribute('y2', localBubble.y.toFixed(2));
    } else {
      leader.setAttribute('x2', localContact.x.toFixed(2));
      leader.setAttribute('y2', localContact.y.toFixed(2));
      leader.setAttribute('x1', localBubble.x.toFixed(2));
      leader.setAttribute('y1', localBubble.y.toFixed(2));
    }

    // Keep the opaque bubble and its glyph above the line segment hidden beneath it.
    group.appendChild(leader);
    group.appendChild(knob);
    const glyph = group.querySelector('svg.relphi-bold-inline-glyph, .chart-wheel-marker-glyph');
    if (glyph) group.appendChild(glyph);
  }

  function apply() {
    queued = false;
    document.querySelectorAll(PLACEMENT).forEach(centerAnchor);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  function install() {
    schedule();
    new MutationObserver(function (records) {
      if (records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE &&
            (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT) || node.matches?.(SVG_SELECTOR));
        });
      })) schedule();
    }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('resize', schedule, { passive:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
