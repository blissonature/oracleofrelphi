// Relationship rows highlight their wheel line without changing list membership.
// Wheel gestures retain ownership of dimming/isolation and mark related list rows.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHighlightWithoutFilteringV1) return;
  window.__relphiSkyHighlightWithoutFilteringV1 = true;

  let restoreQueued = false;

  function relationshipIdentity(node) {
    if (!node) return '';
    const left = String(node.dataset.leftPlacement || '').trim();
    const aspect = String(node.dataset.aspect || '').trim();
    const right = String(node.dataset.rightPlacement || '').trim();
    return left && aspect && right ? `${left}|${aspect}|${right}` : '';
  }

  // relationIndex is a render address, not relationship identity. Foundation wheel
  // lines already carry the same stable endpoint/aspect identity as relationship rows.
  // Rebind the render address from that identity after every interactions pass so
  // the fast wheel hover path, row hover, orb visibility, and filters all address
  // the same line even when row order or ordinary-orb formatting changes.
  function synchronizeLineIdentity() {
    const rowsByIdentity = new Map();
    document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(row => {
      const identity = relationshipIdentity(row);
      if (identity) rowsByIdentity.set(identity, String(row.dataset.relationIndex));
    });

    document.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').forEach(line => {
      const identity = relationshipIdentity(line);
      const index = identity ? rowsByIdentity.get(identity) : undefined;
      if (index === undefined) {
        delete line.dataset.relationIndex;
        return;
      }
      line.dataset.relationIndex = index;
      line.dataset.interactive = 'aspect';
      line.dataset.focusPiece = 'aspect';
      line.classList.add('sky-foundation-interactive', 'sky-foundation-aspect');
      line.style.pointerEvents = 'stroke';
    });
  }

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
    const identity = relationshipIdentity(row);
    const index = String(row.dataset.relationIndex || '');
    document.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').forEach(line => {
      if ((identity && relationshipIdentity(line) === identity) || (index && String(line.dataset.relationIndex || '') === index)) {
        line.classList.add('is-row-hovered');
      }
    });
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
      synchronizeLineIdentity();
      clearRowHover();
      restoreList([]);
    });
  }

  function start() {
    bind();
    synchronizeLineIdentity();
    window.addEventListener('relphi:sky-foundation-ready', bind);
    window.addEventListener('relphi:sky-foundation-interactions-ready', bind);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
