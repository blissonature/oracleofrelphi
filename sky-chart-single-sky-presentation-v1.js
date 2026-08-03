// Keep single-sky relationship rows visible after the cross-sky placement filter refreshes.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkySingleSkyPresentationV1) return;
  window.__relphiSkySingleSkyPresentationV1 = true;

  let queued = false;
  let choiceSyncTimer = 0;

  function isSingleSkyMode() {
    return /^(A-A|B-B)$/.test(document.documentElement.dataset.skyRelationshipMode || '');
  }

  function hiddenByOtherFilters(row) {
    return row.classList.contains('sky-chart-filter-hidden') ||
      row.classList.contains('sky-chart-orb-hidden') ||
      row.classList.contains('sky-orb-filter-hidden') ||
      row.classList.contains('sky-chart-house-multiselect-hidden');
  }

  function selectedPlacements(slot) {
    return Array.from(document.querySelectorAll(`[data-placement-option][data-slot="${slot}"]:checked`))
      .map(input => input.value)
      .filter(Boolean);
  }

  function restoreComparisonNow() {
    document.querySelectorAll('.sky-foundation-single-sky-aspect,.sky-foundation-single-sky-row').forEach(node => node.remove());
    document.querySelectorAll('[data-layer="aspects"] > .sky-foundation-aspect').forEach(node => {
      node.classList.remove('sky-foundation-single-sky-cross-hidden');
    });
    document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row').forEach(node => {
      node.classList.remove('sky-foundation-single-sky-cross-hidden');
    });
    document.documentElement.dataset.skyRelationshipMode = 'A-B';
  }

  function syncChoiceState() {
    choiceSyncTimer = 0;
    const A = selectedPlacements('A');
    const B = selectedPlacements('B');
    if (A.length && B.length) restoreComparisonNow();
    window.dispatchEvent(new CustomEvent('relphi:sky-placement-multiselect-changed', {
      detail:{ A, B, source:'single-sky-choice-sync' }
    }));
  }

  function repair() {
    queued = false;
    if (!isSingleSkyMode()) return;

    const relationships = document.getElementById('skyFoundationRelationships');
    const list = document.getElementById('skyFoundationRelationshipList');
    if (relationships) relationships.hidden = false;
    if (list) {
      list.hidden = false;
      list.style.removeProperty('display');
    }

    const rows = Array.from(document.querySelectorAll('.sky-foundation-single-sky-row'));
    document.querySelectorAll('.sky-foundation-single-sky-aspect').forEach(line => {
      line.classList.remove('sky-chart-multiselect-hidden');
    });
    rows.forEach(row => {
      row.classList.remove('sky-chart-multiselect-hidden');
      row.hidden = false;
      row.style.removeProperty('display');
      row.setAttribute('aria-hidden', hiddenByOtherFilters(row) ? 'true' : 'false');
    });

    const visible = rows.filter(row => !hiddenByOtherFilters(row)).length;
    const count = document.getElementById('skyFoundationRelationshipCount');
    const empty = document.getElementById('skyFoundationRelationshipEmpty');
    const next = `${visible}/${rows.length}`;
    if (count && count.textContent !== next) {
      count.textContent = next;
      count.dataset.total = String(rows.length);
    }
    if (empty) empty.hidden = visible !== 0;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(repair);
  }

  function start() {
    const root = document.getElementById('skyFoundationRoot');
    if (root) {
      new MutationObserver(schedule).observe(root, {
        childList:true,
        subtree:true,
        attributes:true,
        attributeFilter:['class','hidden','style']
      });
    }
    document.addEventListener('change', event => {
      if (!event.target.closest?.('[data-placement-choice]')) return;
      clearTimeout(choiceSyncTimer);
      choiceSyncTimer = setTimeout(syncChoiceState, 0);
    });
    [
      'relphi:sky-single-sky-aspects-rendered',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-foundation-filter-changed'
    ].forEach(name => window.addEventListener(name, schedule));
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
