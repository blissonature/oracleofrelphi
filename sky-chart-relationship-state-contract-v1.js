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
      line.hidden = !visible;
      line.classList.toggle('sky-chart-relationship-filter-hidden', !visible);
      line.setAttribute('aria-hidden', visible ? 'false' : 'true');
      line.style.setProperty('display', visible ? '' : 'none', visible ? '' : 'important');
      line.style.setProperty('pointer-events', visible ? '' : 'none', visible ? '' : 'important');
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

  function start() {
    document.addEventListener('pointerdown', markExplicitSelection, true);
    document.addEventListener('keydown', markExplicitSelection, true);

    const observer = new MutationObserver(records => {
      if (applying) return;
      if (records.some(record => {
        const target = record.target?.nodeType === 1 ? record.target : record.target?.parentElement;
        return !!target?.closest?.(
          '#skyFoundationRelationships, [data-layer="aspects"], #skySelectedRelationship'
        );
      })) schedule();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style', 'aria-current', 'data-selected-relation']
    });

    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-interactions-ready',
      'relphi:sky-foundation-filter-changed',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-aspect-multiselect-changed',
      'relphi:sky-single-sky-aspects-rendered',
      'relphi:selected-relationship-rendered'
    ].forEach(name => window.addEventListener(name, schedule));

    document.documentElement.dataset.skyRelationshipSelectionPolicy = 'awaiting-user';
    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
