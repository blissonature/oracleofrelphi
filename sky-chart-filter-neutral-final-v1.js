// Final neutral filter behavior: keep the placement popover compact, synchronize its settled selection state,
// and make each wheel aspect line share the final visibility of its relationship row.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyFilterNeutralFinalV1) return;
  window.__relphiSkyFilterNeutralFinalV1 = true;

  let menuQueued = false;
  let fitting = false;
  let placementSyncTimer = 0;
  let relationshipVisibilityQueued = false;
  let synchronizingRelationshipVisibility = false;
  let relationshipObserver = null;
  let observedRelationships = null;
  let hoverFilterActive = false;

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
    menuQueued = false;
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

  function scheduleMenu() {
    if (menuQueued) return;
    menuQueued = true;
    requestAnimationFrame(fitPlacementMenu);
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

  function relationshipRowVisible(row) {
    if (!row || row.hidden) return false;
    if (FILTER_HIDDEN_CLASSES.some(className => row.classList.contains(className))) return false;
    return getComputedStyle(row).display !== 'none';
  }

  function synchronizeRelationshipVisibility() {
    relationshipVisibilityQueued = false;
    if (synchronizingRelationshipVisibility) return;
    synchronizingRelationshipVisibility = true;

    const rows = new Map(
      Array.from(document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]'))
        .map(row => [row.dataset.relationIndex, row])
    );

    let visibleLines = 0;
    let totalLines = 0;
    document.querySelectorAll('[data-layer="aspects"] > .sky-foundation-aspect[data-relation-index]').forEach(line => {
      totalLines += 1;
      const row = rows.get(line.dataset.relationIndex);
      const visible = relationshipRowVisible(row);
      const nextDisplay = visible ? '' : 'none';
      if (line.hidden === visible) line.hidden = !visible;
      if (line.style.display !== nextDisplay) line.style.display = nextDisplay;
      line.classList.toggle('sky-chart-relationship-filter-hidden', !visible);
      if (line.getAttribute('aria-hidden') !== (visible ? 'false' : 'true')) line.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (visible) visibleLines += 1;
    });

    document.documentElement.dataset.skyVisibleRelationshipLines = `${visibleLines}/${totalLines}`;
    synchronizingRelationshipVisibility = false;
  }

  function scheduleRelationshipVisibility() {
    if (relationshipVisibilityQueued) return;
    relationshipVisibilityQueued = true;
    requestAnimationFrame(synchronizeRelationshipVisibility);
  }

  function observeRelationships() {
    const root = document.getElementById('skyFoundationRelationships');
    if (root === observedRelationships) return;
    relationshipObserver?.disconnect();
    observedRelationships = root;
    if (!root) return;
    relationshipObserver = new MutationObserver(records => {
      if (synchronizingRelationshipVisibility) return;
      if (records.some(record => {
        if (record.type === 'childList') return record.addedNodes.length || record.removedNodes.length;
        return record.target?.matches?.('.sky-foundation-relationship-row[data-relation-index]');
      })) scheduleRelationshipVisibility();
    });
    relationshipObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style']
    });
  }

  function scheduleStructural() {
    observeRelationships();
    scheduleMenu();
    scheduleRelationshipVisibility();
  }

  function isHoverFilterEvent(event) {
    const state = event.detail?.state || null;
    const hover = state?.mode === 'hover' || (!state && hoverFilterActive);
    hoverFilterActive = state?.mode === 'hover';
    return hover;
  }

  function start() {
    observeRelationships();
    document.addEventListener('click', event => {
      if (!event.target.closest?.('[data-placement-filter-toggle]')) return;
      fitPlacementMenu();
      scheduleMenu();
    });
    document.addEventListener('change', event => {
      if (event.target.closest?.('[data-placement-choice]')) schedulePlacementStateSync();
      if (event.target.closest?.('.sky-chart-filter-bar')) scheduleRelationshipVisibility();
    });

    window.addEventListener('resize', scheduleStructural);
    window.addEventListener('scroll', scheduleMenu, true);
    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-single-sky-aspects-rendered'].forEach(name => window.addEventListener(name, scheduleStructural));
    window.addEventListener('relphi:sky-foundation-filter-changed', event => {
      if (!isHoverFilterEvent(event)) scheduleStructural();
    });
    scheduleStructural();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
