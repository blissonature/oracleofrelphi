// Relationship rows highlight their wheel line without changing list membership.
// Wheel gestures retain ownership of dimming/isolation and mark related list rows.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHighlightWithoutFilteringV1) return;
  window.__relphiSkyHighlightWithoutFilteringV1 = true;

  let restoreQueued = false;

  function restoreList(highlightIndexes) {
    const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
    const highlighted = new Set((highlightIndexes || []).map(String));
    let visible = 0;
    rows.forEach(row => {
      const show = !row.classList.contains('sky-chart-filter-hidden') &&
        !row.classList.contains('sky-chart-orb-hidden') &&
        !row.classList.contains('sky-orb-filter-hidden');
      row.hidden = !show;
      row.setAttribute('aria-hidden', show ? 'false' : 'true');
      row.classList.toggle('is-wheel-related', show && highlighted.has(row.dataset.relationIndex));
      if (show) visible += 1;
    });
    const count = document.getElementById('skyFoundationRelationshipCount');
    if (count) count.textContent = `${visible}/${rows.length}`;
    const empty = document.getElementById('skyFoundationRelationshipEmpty');
    if (empty) empty.hidden = visible !== 0;
  }

  function queueRestore(indexes) {
    if (restoreQueued) return;
    restoreQueued = true;
    queueMicrotask(() => {
      restoreQueued = false;
      restoreList(indexes);
    });
  }

  function clearRowHover() {
    document.querySelectorAll('.sky-foundation-relationship-row.is-row-hovered').forEach(row => row.classList.remove('is-row-hovered'));
    document.querySelectorAll('.sky-foundation-aspect.is-row-hovered').forEach(line => line.classList.remove('is-row-hovered'));
  }

  function setRowHover(row) {
    clearRowHover();
    if (!row) return;
    row.classList.add('is-row-hovered');
    const index = CSS.escape(row.dataset.relationIndex || '');
    document.querySelectorAll(`.sky-foundation-aspect[data-relation-index="${index}"]`).forEach(line => line.classList.add('is-row-hovered'));
  }

  function bind() {
    const root = document.getElementById('skyFoundationRoot');
    if (!root || root.dataset.highlightWithoutFilteringBound === 'true') return;
    root.dataset.highlightWithoutFilteringBound = 'true';

    window.addEventListener('relphi:sky-foundation-filter-changed', event => {
      const mode=event.detail?.state?.mode;
      if(mode==='selected'){
        document.querySelectorAll('.sky-foundation-relationship-row.is-wheel-related').forEach(row=>row.classList.remove('is-wheel-related'));
        return;
      }
      queueRestore(mode==='hover' ? event.detail.relationshipIndexes || [] : []);
    });

    root.addEventListener('pointerover', event => {
      const row = event.target.closest('.sky-foundation-relationship-row');
      if (!row || row.contains(event.relatedTarget)) return;
      setRowHover(row);
    });

    root.addEventListener('pointerout', event => {
      const row = event.target.closest('.sky-foundation-relationship-row');
      if (!row || row.contains(event.relatedTarget)) return;
      clearRowHover();
    });

    root.addEventListener('focusin', event => {
      const row = event.target.closest('.sky-foundation-relationship-row');
      if (row) setRowHover(row);
    });

    root.addEventListener('focusout', event => {
      const row = event.target.closest('.sky-foundation-relationship-row');
      if (row && !row.contains(event.relatedTarget)) clearRowHover();
    });

    window.addEventListener('relphi:sky-foundation-interactions-ready', () => {
      clearRowHover();
      restoreList([]);
    });
  }

  function start() {
    bind();
    if (!document.getElementById('skyFoundationRoot')) return;
    const observer = new MutationObserver(() => bind());
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
