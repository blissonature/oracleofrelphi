// Compact the expanded placement menu without owning popover geometry.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyPlacementCompactV1) return;
  window.__relphiSkyPlacementCompactV1 = true;

  let queued = false;
  let observer = null;
  let observedMenu = null;

  function compactList() {
    const list = document.querySelector('[data-placement-list="combined"]');
    if (!list) return;

    // The placement controller already renders the canonical header. Reuse it rather
    // than inserting a second header and letting another cleanup pass remove one later.
    const header = list.querySelector(':scope > .sky-chart-placement-list-header');
    if (header) header.dataset.placementListHeader = 'true';

    if (list.dataset.compactPlacementList !== 'true') list.dataset.compactPlacementList = 'true';
    list.querySelectorAll('.sky-chart-placement-list-item .sky-chart-placement-choice span').forEach(span => {
      if (!span.hidden) span.hidden = true;
      if (span.getAttribute('aria-hidden') !== 'true') span.setAttribute('aria-hidden', 'true');
    });
  }

  function bindMenuObserver() {
    const menu = document.getElementById('skyChartPlacementPopover');
    if (menu === observedMenu) return;
    observer?.disconnect();
    observedMenu = menu;
    if (!menu) return;
    observer = new MutationObserver(schedule);
    observer.observe(menu, {
      childList: true,
      subtree: true
    });
  }

  function run() {
    queued = false;
    bindMenuObserver();
    compactList();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  function start() {
    bindMenuObserver();
    ['relphi:sky-placement-multiselect-changed', 'relphi:sky-foundation-ready'].forEach(name => window.addEventListener(name, schedule));
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
