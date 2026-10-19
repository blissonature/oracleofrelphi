// Final neutral filter behavior: keep the placement popover compact, synchronize its settled selection state,
// and make each wheel aspect line share the final visibility of its relationship row.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyFilterNeutralFinalV1) return;
  window.__relphiSkyFilterNeutralFinalV1 = true;

  let queued = false;
  let fitting = false;
  let placementSyncTimer = 0;

  const FILTER_HIDDEN_CLASSES = Object.freeze([
    'sky-foundation-single-sky-cross-hidden',
    'sky-chart-filter-hidden',
    'sky-chart-orb-hidden',
    'sky-orb-filter-hidden',
    'sky-chart-multiselect-hidden',
    'sky-chart-house-multiselect-hidden',
    'sky-chart-aspect-multiselect-hidden'
  ]);

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

  function selectedPlacements(slot) {
    return Array.from(document.querySelectorAll(`[data-placement-option][data-slot="${slot}"]:checked`))
      .map(input => input.value)
      .filter(Boolean);
  }

  function dispatchSettledPlacementState() {
    placementSyncTimer = 0;
    window.dispatchEvent(new CustomEvent('relphi:sky-placement-multiselect-changed', {
      detail: {
        A: selectedPlacements('A'),
        B: selectedPlacements('B'),
        source: 'neutral-final-settled-sync'
      }
    }));
  }

  function schedulePlacementStateSync() {
    clearTimeout(placementSyncTimer);
    placementSyncTimer = setTimeout(dispatchSettledPlacementState, 250);
  }

  // The relationship-state contract is the sole owner of SVG line visibility.
  // Do not mirror row visibility here: the two controllers used to overwrite
  // each other's inline display/hidden state during isolation dismissal.
  function scheduleRelationshipVisibility() {
    // Visibility is synchronized by sky-chart-relationship-state-contract-v1.js.
  }

  function schedule() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(fitPlacementMenu);
    }
    scheduleRelationshipVisibility();
  }

  function start() {
    document.addEventListener('click', event => {
      if (!event.target.closest?.('[data-placement-filter-toggle]')) return;
      fitPlacementMenu();
      schedule();
    });
    document.addEventListener('change', event => {
      if (event.target.closest?.('[data-placement-choice]')) schedulePlacementStateSync();
      if (event.target.closest?.('.sky-chart-filter-bar')) scheduleRelationshipVisibility();
    });

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-interactions-ready',
      'relphi:sky-foundation-filter-changed',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-aspect-multiselect-changed',
      'relphi:sky-single-sky-aspects-rendered'
    ].forEach(name => window.addEventListener(name, schedule));
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
