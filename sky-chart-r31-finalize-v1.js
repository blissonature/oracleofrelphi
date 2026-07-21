// Preview-only final pass for canonical special-point glyphs and exact leader attachment.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const SLOT_KEYS = ['relphiSkyChartA', 'relphiSkyChartB'];
  const SYMBOLS = {
    'north node':'☊', 'no':'☊',
    'south node':'☋', 'so':'☋',
    'part of fortune':'⊗', 'fortune':'⊗', 'pof':'⊗', 'pa':'⊗',
    'lilith':'⚸',
    'dsc':'DSC', 'descendant':'DSC', 'ds':'DSC',
    'vertex':'Vx', 'vx':'Vx', 'v':'Vx',
    'rising':'ASC', 'ascendant':'ASC', 'asc':'ASC',
    'mc':'MC', 'ic':'IC'
  };
  const TEXT_POINTS = new Set(['DSC','Vx','ASC','MC','IC']);
  let queued = false;

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function canonicalizeStoredData() {
    let changed = false;
    SLOT_KEYS.forEach(function (storageKey) {
      let payload;
      try { payload = JSON.parse(localStorage.getItem(storageKey) || 'null'); }
      catch (_) { return; }
      if (!payload || typeof payload !== 'object') return;
      const map = payload.placements || payload;
      if (!map || typeof map !== 'object') return;

      const expected = {
        'North Node':'☊', 'South Node':'☋', 'Part of Fortune':'⊗', 'Lilith':'⚸',
        'Dsc':'DSC', 'DSC':'DSC', 'Vertex':'Vx', 'Rising':'ASC', 'MC':'MC', 'IC':'IC'
      };
      Object.keys(expected).forEach(function (name) {
        const key = Object.keys(map).find(function (candidate) {
          return candidate.toLowerCase() === name.toLowerCase();
        });
        if (!key || !map[key] || typeof map[key] !== 'object') return;
        if (map[key].glyph !== expected[name]) {
          map[key].glyph = expected[name];
          changed = true;
        }
      });
      if (changed) {
        try { localStorage.setItem(storageKey, JSON.stringify(payload)); } catch (_) {}
      }
    });
    return changed;
  }

  function groupKey(group) {
    const candidates = [
      group.querySelector('.chart-wheel-marker-name')?.textContent,
      group.dataset.body,
      group.dataset.placement,
      group.querySelector('.chart-wheel-marker-glyph')?.textContent
    ];
    for (const candidate of candidates) {
      const key = bare(candidate).toLowerCase();
      if (SYMBOLS[key]) return key;
    }
    return '';
  }

  function applyGlyph(group) {
    const key = groupKey(group);
    if (!key) return;
    const glyph = SYMBOLS[key];
    const text = group.querySelector('.chart-wheel-marker-glyph');
    if (!text) return;
    text.textContent = glyph;
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.style.setProperty('font-family', '"Segoe UI Symbol","Noto Sans Symbols 2","Arial Unicode MS",sans-serif', 'important');
    text.style.setProperty('font-size', TEXT_POINTS.has(glyph) ? (glyph === 'DSC' ? '11.5px' : '12.5px') : (glyph === '⚸' ? '20px' : '19px'), 'important');
    text.style.setProperty('font-weight', TEXT_POINTS.has(glyph) ? '600' : '500', 'important');
    text.style.setProperty('letter-spacing', '0', 'important');
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function toRoot(node, x, y) {
    const matrix = node.getCTM && node.getCTM();
    return matrix ? new DOMPoint(x, y).matrixTransform(matrix) : new DOMPoint(x, y);
  }

  function fromRoot(node, point) {
    const matrix = node.getCTM && node.getCTM();
    if (!matrix) return point;
    try { return point.matrixTransform(matrix.inverse()); }
    catch (_) { return point; }
  }

  function attachLeader(group) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    const leader = group.querySelector('line.chart-wheel-stick');
    if (!knob || !contact || !leader) return;

    const cx = number(knob.getAttribute('cx'));
    const cy = number(knob.getAttribute('cy'));
    const ax = number(contact.getAttribute('cx'));
    const ay = number(contact.getAttribute('cy'));
    const radius = number(knob.getAttribute('r')) || 16.5;
    if (![cx, cy, ax, ay, radius].every(Number.isFinite)) return;

    const center = toRoot(knob, cx, cy);
    const anchor = toRoot(contact, ax, ay);
    const dx = center.x - anchor.x;
    const dy = center.y - anchor.y;
    const length = Math.hypot(dx, dy) || 1;
    // Tuck the leader 1.25 SVG units beneath the circle stroke so no white gap can show.
    const edge = new DOMPoint(
      center.x - dx / length * Math.max(0, radius - 1.25),
      center.y - dy / length * Math.max(0, radius - 1.25)
    );
    const localAnchor = fromRoot(leader, anchor);
    const localEdge = fromRoot(leader, edge);
    leader.setAttribute('x1', localAnchor.x.toFixed(2));
    leader.setAttribute('y1', localAnchor.y.toFixed(2));
    leader.setAttribute('x2', localEdge.x.toFixed(2));
    leader.setAttribute('y2', localEdge.y.toFixed(2));
    leader.style.strokeLinecap = 'round';
  }

  function run() {
    queued = false;
    document.querySelectorAll(PLACEMENT).forEach(function (group) {
      applyGlyph(group);
      attachLeader(group);
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  function install() {
    const changed = canonicalizeStoredData();
    schedule();
    if (changed && !sessionStorage.getItem('relphi-r31-canonical-reload')) {
      sessionStorage.setItem('relphi-r31-canonical-reload', '1');
      setTimeout(function () {
        document.getElementById('loadChart')?.click();
        document.getElementById('loadCurrentSky')?.click();
      }, 0);
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
