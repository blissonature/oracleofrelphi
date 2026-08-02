// Compact the expanded placement menu: one header row, then unlabeled checkbox columns.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyPlacementCompactV1) return;
  window.__relphiSkyPlacementCompactV1 = true;

  let queued = false;

  function makeHeader() {
    const header = document.createElement('div');
    header.className = 'sky-chart-placement-list-header';
    header.dataset.placementListHeader = 'true';

    const placement = document.createElement('span');
    placement.className = 'sky-chart-placement-list-header-label';
    placement.textContent = 'Placement';

    const choices = document.createElement('div');
    choices.className = 'sky-chart-placement-list-header-choices';
    ['All', 'A', 'B'].forEach((text, index) => {
      const label = document.createElement('span');
      label.className = `sky-chart-placement-list-header-choice sky-chart-placement-list-header-choice-${index === 0 ? 'all' : text.toLowerCase()}`;
      label.textContent = text;
      choices.appendChild(label);
    });

    header.append(placement, choices);
    return header;
  }

  function compactList() {
    const list = document.querySelector('[data-placement-list="combined"]');
    if (!list) return;

    if (!list.querySelector(':scope > [data-placement-list-header]')) {
      list.prepend(makeHeader());
    }

    list.dataset.compactPlacementList = 'true';
    list.querySelectorAll('.sky-chart-placement-list-item .sky-chart-placement-choice span').forEach(span => {
      span.hidden = true;
      span.setAttribute('aria-hidden', 'true');
    });
  }

  function positionMenu() {
    const menu = document.getElementById('skyChartPlacementPopover');
    const head = document.querySelector('[data-placement-filter="combined"] .sky-chart-placement-filter-head');
    if (!menu?.classList.contains('is-portaled') || !head) return;

    const margin = window.innerWidth <= 410 ? 8 : 10;
    const maximum = window.innerWidth <= 410 ? 330 : 350;
    const rect = head.getBoundingClientRect();
    const width = Math.min(maximum, window.innerWidth - margin * 2);
    const left = Math.min(
      window.innerWidth - width - margin,
      Math.max(margin, rect.left + rect.width / 2 - width / 2)
    );

    menu.style.setProperty('width', `${width}px`, 'important');
    menu.style.setProperty('left', `${left}px`, 'important');
  }

  function run() {
    queued = false;
    compactList();
    positionMenu();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  const observer = new MutationObserver(schedule);
  function start() {
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    ['relphi:sky-placement-multiselect-changed', 'relphi:sky-foundation-ready'].forEach(name => window.addEventListener(name, schedule));
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
