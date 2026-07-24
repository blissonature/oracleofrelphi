// Sky Chart preview: grouped marker units, optical centering, and center-anchored leaders.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const SVG_SELECTOR = '.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg';
  const PLANET_GLYPH_SIZE = 30;
  const TEXT_GLYPHS = {
    NO:'☊', SO:'☋', PA:'⊗',
    'NORTH NODE':'☊', 'SOUTH NODE':'☋',
    'PART OF FORTUNE':'⊗', FORTUNE:'⊗',
    LILITH:'⚸', DS:'DSC', DSC:'DSC', V:'Vx', VX:'Vx', AC:'ASC'
  };
  const SYMBOLS = new Set(['☊','☋','⊗','⚸']);
  const ANGLES = new Set(['ASC','DSC','MC','IC','VX']);
  let queued = false;

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
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

  function canonicalText(group, text) {
    const visible = bare(text.textContent);
    const name = bare(group.querySelector('.chart-wheel-marker-name')?.textContent).toUpperCase();
    const key = name || visible.toUpperCase();
    return TEXT_GLYPHS[key] || TEXT_GLYPHS[visible.toUpperCase()] || visible;
  }

  function ensureMarkerUnit(group) {
    let unit = group.querySelector(':scope > g.relphi-marker-unit');
    if (!unit) {
      unit = document.createElementNS(NS, 'g');
      unit.classList.add('relphi-marker-unit');
      const leader = group.querySelector(':scope > line.chart-wheel-stick');
      if (leader?.nextSibling) group.insertBefore(unit, leader.nextSibling);
      else group.appendChild(unit);
    }

    [
      group.querySelector(':scope > circle.chart-wheel-stick-knob'),
      group.querySelector(':scope > .chart-wheel-marker-glyph'),
      group.querySelector(':scope > svg.relphi-bold-inline-glyph'),
      group.querySelector(':scope > svg.relphi-colored-glyph'),
      group.querySelector(':scope > image.relphi-bubble-glyph-image')
    ].filter(Boolean).forEach(function (node) {
      unit.appendChild(node);
    });
    return unit;
  }

  function clearOpticalTransform(node) {
    const transform = node.getAttribute('transform') || '';
    node.setAttribute('transform', transform.replace(/\s*translate\([^)]*\)\s*$/, '').trim());
  }

  function opticalCenter(node, artwork, knob, cx, cy) {
    if (!node || !artwork || typeof artwork.getBBox !== 'function') return;
    clearOpticalTransform(node);
    let box;
    try { box = artwork.getBBox(); }
    catch (_) { return; }
    if (!box || !Number.isFinite(box.width) || !Number.isFinite(box.height)) return;

    const artCenter = toRoot(artwork, box.x + box.width / 2, box.y + box.height / 2);
    const bubbleCenter = toRoot(knob, cx, cy);
    const parent = node.parentNode;
    if (!(parent instanceof SVGElement)) return;
    const origin = fromRoot(parent, artCenter);
    const target = fromRoot(parent, bubbleCenter);
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const base = node.getAttribute('transform') || '';
    node.setAttribute('transform', (base + ' translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')').trim());
  }

  function standardizeGlyph(group, knob) {
    const cx = number(knob.getAttribute('cx'));
    const cy = number(knob.getAttribute('cy'));
    if (![cx, cy].every(Number.isFinite)) return;

    const text = group.querySelector('.chart-wheel-marker-glyph');
    if (text) {
      const value = canonicalText(group, text);
      text.textContent = value;
      const normalized = value.toUpperCase();
      const isSymbol = SYMBOLS.has(value);
      const isAngle = ANGLES.has(normalized);
      text.setAttribute('x', cx.toFixed(2));
      text.setAttribute('y', cy.toFixed(2));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.style.setProperty('font-family', isSymbol ? 'Arial Unicode MS, Noto Sans Symbols 2, Noto Sans Symbols, serif' : 'system-ui, sans-serif', 'important');
      text.style.setProperty('font-size', isSymbol ? '27px' : (isAngle ? '12.5px' : '25px'), 'important');
      text.style.setProperty('font-weight', isSymbol ? '600' : (isAngle ? '650' : '700'), 'important');
      text.style.setProperty('letter-spacing', isAngle ? '-0.35px' : '0', 'important');
      text.style.setProperty('opacity', '1', 'important');
      opticalCenter(text, text, knob, cx, cy);
    }

    const inline = group.querySelector('svg.relphi-bold-inline-glyph');
    if (inline) {
      inline.setAttribute('x', (cx - PLANET_GLYPH_SIZE / 2).toFixed(2));
      inline.setAttribute('y', (cy - PLANET_GLYPH_SIZE / 2).toFixed(2));
      inline.setAttribute('width', String(PLANET_GLYPH_SIZE));
      inline.setAttribute('height', String(PLANET_GLYPH_SIZE));
      inline.style.setProperty('opacity', '1', 'important');
      opticalCenter(inline, inline.querySelector('path') || inline, knob, cx, cy);
    }
  }

  function centerAnchor(group) {
    ensureMarkerUnit(group);
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    const leader = group.querySelector('line.chart-wheel-stick');
    if (!knob || !contact || !leader) return;

    standardizeGlyph(group, knob);

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

    knob.style.setProperty('fill', '#fff', 'important');
    knob.style.setProperty('fill-opacity', '1', 'important');
    group.style.setProperty('opacity', '1', 'important');
    leader.style.setProperty('opacity', '1', 'important');
  }

  function apply() {
    queued = false;
    document.querySelectorAll(PLACEMENT).forEach(centerAnchor);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      requestAnimationFrame(apply);
    });
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