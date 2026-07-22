// Sky Chart preview: one non-destructive final geometry and glyph pass.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

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
  const OPTICAL_Y = { '☊':0.4, '☋':0.4, '⊗':0.2, '⚸':0.8, ASC:0.4, DSC:0.4, MC:0.4, IC:0.4, VX:0.4 };
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
      text.setAttribute('y', (cy + (OPTICAL_Y[normalized] ?? OPTICAL_Y[value] ?? 0)).toFixed(2));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.style.setProperty('font-family', isSymbol ? 'Arial Unicode MS, Noto Sans Symbols 2, Noto Sans Symbols, serif' : 'system-ui, sans-serif', 'important');
      text.style.setProperty('font-size', isSymbol ? '25px' : (isAngle ? '12.5px' : '24px'), 'important');
      text.style.setProperty('font-weight', isSymbol ? '600' : (isAngle ? '650' : '700'), 'important');
      text.style.setProperty('letter-spacing', isAngle ? '-0.35px' : '0', 'important');
      text.style.setProperty('opacity', '1', 'important');
    }

    const inline = group.querySelector('svg.relphi-bold-inline-glyph');
    if (inline) {
      inline.setAttribute('x', (cx - PLANET_GLYPH_SIZE / 2).toFixed(2));
      inline.setAttribute('y', (cy - PLANET_GLYPH_SIZE / 2).toFixed(2));
      inline.setAttribute('width', String(PLANET_GLYPH_SIZE));
      inline.setAttribute('height', String(PLANET_GLYPH_SIZE));
      inline.style.setProperty('opacity', '1', 'important');
    }
  }

  function centerAnchor(group) {
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
      // Run after the authoritative layout renderer without modifying child order.
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