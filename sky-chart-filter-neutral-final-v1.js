// Final neutral filter behavior: keep the placement popover compact after its portal positioning runs.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyFilterNeutralFinalV1) return;
  window.__relphiSkyFilterNeutralFinalV1 = true;

  let queued = false;
  let fitting = false;

  function fitPlacementMenu() {
    queued = false;
    if (fitting) return;
    const menu = document.getElementById('skyChartPlacementPopover');
    const head = document.querySelector('[data-placement-filter="combined"] .sky-chart-placement-filter-head');
    if (!menu?.classList.contains('is-portaled') || menu.hidden || !head) return;

    const margin = window.innerWidth <= 410 ? 8 : 10;
    const maximum = window.innerWidth <= 410 ? 330 : 350;
    const width = Math.min(maximum, Math.max(280, window.innerWidth - margin * 2));
    const rect = head.getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - width - margin,
      Math.max(margin, rect.left + rect.width / 2 - width / 2)
    );
    const widthValue = `${width}px`;
    const maximumValue = `${window.innerWidth - margin * 2}px`;
    const leftValue = `${left}px`;

    if (
      menu.style.getPropertyValue('width') === widthValue &&
      menu.style.getPropertyPriority('width') === 'important' &&
      menu.style.getPropertyValue('max-width') === maximumValue &&
      menu.style.getPropertyPriority('max-width') === 'important' &&
      menu.style.getPropertyValue('left') === leftValue &&
      menu.style.getPropertyPriority('left') === 'important'
    ) return;

    fitting = true;
    menu.style.setProperty('width', widthValue, 'important');
    menu.style.setProperty('max-width', maximumValue, 'important');
    menu.style.setProperty('left', leftValue, 'important');
    fitting = false;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(fitPlacementMenu);
  }

  function start() {
    document.addEventListener('click', event => {
      if (!event.target.closest?.('[data-placement-filter-toggle]')) return;
      fitPlacementMenu();
      schedule();
    });

    const observer = new MutationObserver(() => {
      fitPlacementMenu();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style']
    });

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('relphi:sky-placement-multiselect-changed', fitPlacementMenu);
    window.addEventListener('relphi:sky-foundation-ready', schedule);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
