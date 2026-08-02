// Keep every Sky A placement glyph red and every Sky B placement glyph blue.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyColorsV1) return;
  window.__relphiSkyColorsV1 = true;

  const COLORS = Object.freeze({ A:'#c9211e', B:'#2462d0' });
  const PAINTED = '[fill],[stroke],text';
  let timer = 0;
  let stabilityTimer = 0;

  function paintNode(node, color) {
    const tag = node.localName;
    const fill = node.getAttribute('fill');
    const stroke = node.getAttribute('stroke');

    if (tag === 'text' || (fill && fill !== 'none' && !fill.startsWith('url('))) {
      node.setAttribute('fill', color);
      node.style.setProperty('fill', color, 'important');
    }
    if (stroke && stroke !== 'none' && !stroke.startsWith('url(')) {
      node.setAttribute('stroke', color);
      node.style.setProperty('stroke', color, 'important');
    }
  }

  function paintArt(art, slot) {
    const color = COLORS[slot];
    if (!art || !color) return false;
    if (art.matches(PAINTED)) paintNode(art, color);
    art.querySelectorAll(PAINTED).forEach(node => paintNode(node, color));
    art.dataset.skyPlacementColor = slot;
    art.dataset.skyPlacementPaint = color;
    return true;
  }

  function artFrom(host) {
    const root = host?.querySelector?.('.relphi-glyph-bubble');
    return root ? Array.from(root.children).find(node => node.classList?.contains('relphi-canonical-glyph')) : null;
  }

  function apply(host, slot) {
    const art = artFrom(host);
    if (!art) return false;
    return paintArt(art, slot);
  }

  function scan() {
    timer = 0;
    let expected = 0;
    let painted = 0;

    document.querySelectorAll('#skyFoundationA .sky-foundation-row > svg').forEach(host => {
      expected += 1;
      if (apply(host, 'A')) painted += 1;
    });
    document.querySelectorAll('#skyFoundationB .sky-foundation-row > svg').forEach(host => {
      expected += 1;
      if (apply(host, 'B')) painted += 1;
    });
    document.querySelectorAll('[data-layer="placements"] > g[data-sky="A"]').forEach(host => {
      expected += 1;
      if (apply(host, 'A')) painted += 1;
    });
    document.querySelectorAll('[data-layer="placements"] > g[data-sky="B"]').forEach(host => {
      expected += 1;
      if (apply(host, 'B')) painted += 1;
    });
    document.querySelectorAll('[data-selected-graphic-a]').forEach(host => {
      expected += 1;
      if (apply(host, 'A')) painted += 1;
    });
    document.querySelectorAll('[data-selected-graphic-b]').forEach(host => {
      expected += 1;
      if (apply(host, 'B')) painted += 1;
    });

    const passed = expected > 0 && painted === expected;
    document.documentElement.dataset.skyPlacementColors = passed ? 'passed' : 'pending';
    document.documentElement.dataset.skyPlacementColorCount = `${painted}/${expected}`;
    return { passed, painted, expected };
  }

  function runAfterLayout() {
    requestAnimationFrame(() => requestAnimationFrame(scan));
  }

  function schedule(delay = 40) {
    clearTimeout(timer);
    timer = setTimeout(runAfterLayout, delay);
  }

  function scheduleStabilityPasses() {
    clearTimeout(stabilityTimer);
    [0, 80, 220, 500, 1000].forEach(delay => setTimeout(() => schedule(0), delay));
    stabilityTimer = setTimeout(() => schedule(0), 1600);
  }

  window.RelphiSkyColors = Object.freeze({ scan, colors:COLORS, schedule:scheduleStabilityPasses });

  const observer = new MutationObserver(records => {
    const relevant = records.some(record => {
      if (record.type !== 'childList') return false;
      const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
      return !!target?.closest?.(
        '#skyFoundationA,#skyFoundationB,[data-layer="placements"],#skySelectedRelationship'
      );
    });
    if (relevant) schedule(25);
  });

  function start() {
    observer.observe(document.documentElement, { childList:true, subtree:true });
    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-interactions-ready',
      'relphi:selected-relationship-rendered',
      'relphi:sky-angle-placements-ready',
      'relphi:sky-glyph-audit-complete'
    ].forEach(name => window.addEventListener(name, scheduleStabilityPasses));
    scheduleStabilityPasses();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
