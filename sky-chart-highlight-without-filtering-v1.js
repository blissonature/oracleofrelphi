// Interaction presentation policy: wheel gestures highlight; only explicit filters change list membership.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHighlightWithoutFilteringV1) return;
  window.__relphiSkyHighlightWithoutFilteringV1 = true;

  let explicitVisible = new Set();
  let restoreQueued = false;

  const rows = () => Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));

  function captureExplicitVisibility() {
    explicitVisible = new Set(rows().filter(row => !row.hidden).map(row => row.dataset.relationIndex));
  }

  function currentExplicitRows() {
    const all = rows();
    if (!explicitVisible.size) return all;
    return all.filter(row => explicitVisible.has(row.dataset.relationIndex));
  }

  function restoreList(highlightIndexes) {
    const all = rows();
    const highlighted = new Set((highlightIndexes || []).map(String));
    const visible = currentExplicitRows();
    const visibleKeys = new Set(visible.map(row => row.dataset.relationIndex));

    all.forEach(row => {
      const show = visibleKeys.has(row.dataset.relationIndex);
      row.hidden = !show;
      row.setAttribute('aria-hidden', show ? 'false' : 'true');
      row.classList.toggle('is-wheel-related', show && highlighted.has(row.dataset.relationIndex));
    });

    const count = document.getElementById('skyFoundationRelationshipCount');
    if (count) count.textContent = `${visible.length}/${all.length}`;
    const empty = document.getElementById('skyFoundationRelationshipEmpty');
    if (empty) empty.hidden = visible.length !== 0;
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

    captureExplicitVisibility();

    window.addEventListener('relphi:sky-foundation-filter-changed', event => {
      queueRestore(event.detail?.relationshipIndexes || []);
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

    document.addEventListener('change', event => {
      if (!event.target.closest('.sky-chart-filter-bar')) return;
      requestAnimationFrame(() => requestAnimationFrame(captureExplicitVisibility));
    }, true);

    window.addEventListener('relphi:sky-foundation-interactions-ready', () => {
      captureExplicitVisibility();
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
