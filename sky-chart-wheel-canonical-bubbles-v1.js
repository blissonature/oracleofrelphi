// Sky Chart: preserve native marker positions and render planets as one canonical circled bubble.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const PLANETS = {
    SUN: 'sun', MOON: 'moon', MERCURY: 'mercury', VENUS: 'venus', MARS: 'mars',
    JUPITER: 'jupiter', SATURN: 'saturn', URANUS: 'uranus', NEPTUNE: 'neptune', PLUTO: 'pluto',
    '☉': 'sun', '⊙': 'sun', '☽': 'moon', '☾': 'moon', '☿': 'mercury', '♀': 'venus',
    '♂': 'mars', '♃': 'jupiter', '♄': 'saturn', '♅': 'uranus', '⛢': 'uranus',
    '♆': 'neptune', '♇': 'pluto', '⯓': 'pluto'
  };

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function identityFor(group, text) {
    const candidates = [
      group.dataset.body,
      group.dataset.name,
      group.dataset.placement,
      group.getAttribute('data-body'),
      group.getAttribute('data-name'),
      group.querySelector('.chart-wheel-marker-name')?.textContent,
      group.getAttribute('aria-label'),
      text?.textContent
    ];
    for (const candidate of candidates) {
      const value = bare(candidate);
      if (!value) continue;
      const upper = value.toUpperCase();
      if (PLANETS[upper]) return PLANETS[upper];
      if (PLANETS[value]) return PLANETS[value];
      const first = upper.split(/[·,\s]/)[0];
      if (PLANETS[first]) return PLANETS[first];
    }
    return '';
  }

  function markerColor(group, knob) {
    const explicit = knob && (knob.getAttribute('stroke') || getComputedStyle(knob).stroke);
    if (explicit && explicit !== 'none' && explicit !== 'rgba(0, 0, 0, 0)') return explicit;
    return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18';
  }

  function numeric(node, name, fallback) {
    const value = parseFloat(node?.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  }

  function cleanLegacy(group) {
    group.querySelectorAll(
      'g.relphi-canonical-marker-bubble, g.relphi-marker-unit, .relphi-approved-glyph, .relphi-wheel-planet-glyph, ' +
      'svg.relphi-colored-glyph, svg.relphi-bold-inline-glyph, image.relphi-bubble-glyph-image, .relphi-pluto-vector'
    ).forEach(function (node) { node.remove(); });
  }

  function render(group) {
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent) return;

    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const text = group.querySelector('text.chart-wheel-marker-glyph');
    if (!knob && !text) return;

    const identity = identityFor(group, text);
    if (!identity) return;

    const signature = [
      identity,
      knob?.getAttribute('cx') || '',
      knob?.getAttribute('cy') || '',
      knob?.getAttribute('stroke') || '',
      group.classList.contains('sky-b') ? 'b' : 'a'
    ].join('|');
    if (group.dataset.relphiCanonicalBubbleSignature === signature && group.querySelector('g.relphi-canonical-marker-bubble')) return;

    const cx = numeric(knob, 'cx', numeric(text, 'x', 0));
    const cy = numeric(knob, 'cy', numeric(text, 'y', 0));
    const radius = Math.max(12, numeric(knob, 'r', 17.5));
    const strokeWidth = Math.max(1.8, numeric(knob, 'stroke-width', 2.35));
    const color = markerColor(group, knob);

    cleanLegacy(group);

    const host = document.createElementNS(NS, 'g');
    host.classList.add('relphi-canonical-marker-bubble');
    host.dataset.glyphId = identity;
    host.setAttribute('transform', 'translate(' + cx + ' ' + cy + ')');
    group.appendChild(host);

    const bubble = window.RelphiGlyphComponent.createBubble(host, identity, {
      radius: radius,
      padding: 1,
      strokeWidth: strokeWidth,
      color: color,
      fill: '#ffffff'
    });

    if (knob) {
      knob.style.setProperty('display', 'none', 'important');
      knob.setAttribute('aria-hidden', 'true');
    }
    if (text) {
      text.textContent = '';
      text.style.setProperty('display', 'none', 'important');
      text.setAttribute('aria-hidden', 'true');
    }

    group.dataset.relphiCanonicalBubbleSignature = signature;
    bubble.ready.catch(function (error) {
      console.error(error);
      host.remove();
      delete group.dataset.relphiCanonicalBubbleSignature;
      if (knob) knob.style.removeProperty('display');
      if (text) text.style.removeProperty('display');
    });
  }

  function scan(root) {
    if (root?.matches?.(PLACEMENT)) render(root);
    root?.querySelectorAll?.(PLACEMENT).forEach(render);
  }

  function start() {
    scan(document);
    window.addEventListener('relphi:sky-builder-v4-loaded', function () { scan(document); });
    let queued = false;
    const pending = new Set();
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (!(node instanceof Element)) return;
          if (node.matches?.(PLACEMENT)) pending.add(node);
          node.querySelectorAll?.(PLACEMENT).forEach(function (group) { pending.add(group); });
        });
      });
      if (queued || !pending.size) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        pending.forEach(render);
        pending.clear();
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
