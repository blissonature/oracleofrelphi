// One relationship state contract for filtered rows, wheel lines, and explicit selection.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyRelationshipStateContractV1) return;
  window.__relphiSkyRelationshipStateContractV1 = true;

  const HIDDEN_CLASSES = Object.freeze([
    'sky-foundation-single-sky-cross-hidden',
    'sky-chart-filter-hidden',
    'sky-chart-orb-hidden',
    'sky-orb-filter-hidden',
    'sky-chart-multiselect-hidden',
    'sky-chart-house-multiselect-hidden',
    'sky-chart-aspect-multiselect-hidden'
  ]);

  let explicitSelectionStarted = false;
  let queued = false;
  let applying = false;
  let relationshipObserver = null;
  let observedRelationships = null;
  let selectedObserver = null;
  let observedSelected = null;
  let hoverFilterActive = false;

  function relationshipTarget(target) {
    return target?.closest?.(
      '.sky-foundation-relationship-row[data-relation-index], .sky-foundation-aspect[data-relation-index]'
    ) || null;
  }

  function rowVisible(row) {
    if (!row || row.hidden) return false;
    if (HIDDEN_CLASSES.some(className => row.classList.contains(className))) return false;
    return getComputedStyle(row).display !== 'none';
  }

  function clearAutomaticSelection() {
    if (explicitSelectionStarted) return;

    document.querySelectorAll('.sky-foundation-relationship-row[aria-current]')
      .forEach(row => row.removeAttribute('aria-current'));
    document.querySelectorAll('.sky-foundation-aspect[data-selected-relation]')
      .forEach(line => delete line.dataset.selectedRelation);

    const panel = document.getElementById('skySelectedRelationship');
    if (panel) {
      panel.hidden = true;
      panel.removeAttribute('data-relation-index');
      panel.dataset.selectionSource = 'awaiting-explicit-user-selection';
    }

    document.getElementById('skyFoundationRoot')?.setAttribute(
      'data-relationship-selection-cleared',
      'true'
    );
  }

  function synchronize() {
    queued = false;
    if (applying) return;
    applying = true;

    const rows = new Map(
      Array.from(document.querySelectorAll(
        '.sky-foundation-relationship-row[data-relation-index]'
      )).map(row => [row.dataset.relationIndex, row])
    );

    let visibleRows = 0;
    let visibleLines = 0;

    rows.forEach(row => {
      if (rowVisible(row)) visibleRows += 1;
    });

    document.querySelectorAll(
      '.sky-foundation-aspect[data-relation-index]'
    ).forEach(line => {
      const visible = rowVisible(rows.get(line.dataset.relationIndex));
      if (line.hidden === visible) line.hidden = !visible;
      line.classList.toggle('sky-chart-relationship-filter-hidden', !visible);
      if (line.getAttribute('aria-hidden') !== (visible ? 'false' : 'true')) line.setAttribute('aria-hidden', visible ? 'false' : 'true');
      const display = visible ? '' : 'none';
      const pointerEvents = visible ? '' : 'none';
      if (line.style.getPropertyValue('display') !== display || line.style.getPropertyPriority('display') !== (visible ? '' : 'important')) {
        line.style.setProperty('display', display, visible ? '' : 'important');
      }
      if (line.style.getPropertyValue('pointer-events') !== pointerEvents || line.style.getPropertyPriority('pointer-events') !== (visible ? '' : 'important')) {
        line.style.setProperty('pointer-events', pointerEvents, visible ? '' : 'important');
      }
      if (visible) visibleLines += 1;
    });

    document.documentElement.dataset.skyVisibleRelationshipRows = String(visibleRows);
    document.documentElement.dataset.skyVisibleRelationshipLines = String(visibleLines);

    clearAutomaticSelection();
    applying = false;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(synchronize);
  }

  function markExplicitSelection(event) {
    const target = relationshipTarget(event.target);
    if (!target) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    explicitSelectionStarted = true;
    document.documentElement.dataset.skyRelationshipSelectionPolicy = 'explicit';
  }

  function bindObservers() {
    const relationships = document.getElementById('skyFoundationRelationships');
    if (relationships !== observedRelationships) {
      relationshipObserver?.disconnect();
      observedRelationships = relationships;
      if (relationships) {
        relationshipObserver = new MutationObserver(records => {
          if (applying) return;
          if (records.some(record => record.type === 'childList' || record.target?.matches?.('.sky-foundation-relationship-row[data-relation-index]'))) schedule();
        });
        relationshipObserver.observe(relationships, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'hidden', 'style', 'aria-current']
        });
      }
    }

    const selected = document.getElementById('skySelectedRelationship');
    if (selected !== observedSelected) {
      selectedObserver?.disconnect();
      observedSelected = selected;
      if (selected) {
        selectedObserver = new MutationObserver(() => { if (!applying) schedule(); });
        selectedObserver.observe(selected, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['hidden', 'data-relation-index']
        });
      }
    }
  }

  function scheduleStructural() {
    bindObservers();
    schedule();
  }

  function isHoverFilterEvent(event) {
    const state = event.detail?.state || null;
    const hover = state?.mode === 'hover' || (!state && hoverFilterActive);
    hoverFilterActive = state?.mode === 'hover';
    return hover;
  }

  function start() {
    document.addEventListener('pointerdown', markExplicitSelection, true);
    document.addEventListener('keydown', markExplicitSelection, true);
    bindObservers();

    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-interactions-ready',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-aspect-multiselect-changed',
      'relphi:sky-single-sky-aspects-rendered',
      'relphi:selected-relationship-rendered'
    ].forEach(name => window.addEventListener(name, scheduleStructural));
    window.addEventListener('relphi:sky-foundation-filter-changed', event => {
      if (!isHoverFilterEvent(event)) scheduleStructural();
    });

    document.documentElement.dataset.skyRelationshipSelectionPolicy = 'awaiting-user';
    scheduleStructural();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
