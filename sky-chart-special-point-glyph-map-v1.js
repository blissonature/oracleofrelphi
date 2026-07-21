// Canonical special-point glyph mapping for the Sky Chart preview renderer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const GLYPH_BY_NAME = {
    'north node':'☊',
    'south node':'☋',
    'part of fortune':'⊗',
    'fortune':'⊗',
    'lilith':'⚸',
    'vertex':'Vx',
    'rising':'ASC',
    'ascendant':'ASC',
    'dsc':'DSC',
    'descendant':'DSC',
    'mc':'MC',
    'midheaven':'MC',
    'ic':'IC',
    'imum coeli':'IC'
  };

  const GLYPH_BY_STALE = { NO:'☊', SO:'☋', PA:'⊗', DS:'DSC', V:'Vx' };

  function normalizeGroup(group) {
    const text = group.querySelector('.chart-wheel-marker-glyph');
    if (!text) return;
    const name = String(
      group.querySelector('.chart-wheel-marker-name')?.textContent ||
      group.dataset.body || group.dataset.placement || ''
    ).trim().toLowerCase();
    const stale = String(text.textContent || '').replace(/[\uFE0E\uFE0F]/g, '').trim().toUpperCase();
    const glyph = GLYPH_BY_NAME[name] || GLYPH_BY_STALE[stale];
    if (glyph) text.textContent = glyph;
  }

  function normalize(root) {
    if (root?.matches?.('.chart-wheel-placement-stick')) normalizeGroup(root);
    root?.querySelectorAll?.('.chart-wheel-placement-stick').forEach(normalizeGroup);
  }

  function install() {
    normalize(document);
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.from(record.addedNodes || []).forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) normalize(node);
        });
      });
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();