// Relationship rows highlight their wheel line without changing list membership.
// Wheel gestures retain ownership of dimming/isolation and mark related list rows.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHighlightWithoutFilteringV1) return;
  window.__relphiSkyHighlightWithoutFilteringV1 = true;

  let visibilityQueued = false;
  let rowsByIndex = new Map();
  let linesByIdentity = new Map();
  let linesByIndex = new Map();
  let wheelRelatedRows = new Set();
  let hoveredRow = null;
  let hoveredLines = new Set();

  function relationshipIdentity(node) {
    if (!node) return '';
    const left = String(node.dataset.leftPlacement || '').trim();
    const aspect = String(node.dataset.aspect || '').trim();
    const right = String(node.dataset.rightPlacement || '').trim();
    return left && aspect && right ? `${left}|${aspect}|${right}` : '';
  }

  function addMappedLine(map, key, line) {
    if (!key) return;
    let set = map.get(key);
    if (!set) {
      set = new Set();
      map.set(key, set);
    }
    set.add(line);
  }

  // relationIndex is a render address, not relationship identity. Foundation wheel
  // lines already carry the same endpoint/aspect identity as relationship rows.
  // Rebind once after each interactions pass, then use cached identity/index maps on
  // the hot hover path instead of scanning the relationship DOM on every pointer move.
  function synchronizeLineIdentity() {
    clearRowHover();
    const rowsByIdentity = new Map();
    rowsByIndex = new Map();

    document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(row => {
      const index = String(row.dataset.relationIndex || '');
      const identity = relationshipIdentity(row);
      if (index) rowsByIndex.set(index, row);
      if (identity) rowsByIdentity.set(identity, index);
    });

    const nextByIdentity = new Map();
    const nextByIndex = new Map();
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
      addMappedLine(nextByIdentity, identity, line);
      addMappedLine(nextByIndex, index, line);
    });
    linesByIdentity = nextByIdentity;
    linesByIndex = nextByIndex;
    wheelRelatedRows.clear();
  }

  function restoreVisibility() {
    visibilityQueued = false;
    let visible = 0;
    rowsByIndex.forEach(row => {
      const show = !row.classList.contains('sky-chart-filter-hidden') &&
        !row.classList.contains('sky-chart-orb-hidden') &&
        !row.classList.contains('sky-orb-filter-hidden');
      row.hidden = !show;
      row.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (!show && row.classList.contains('is-wheel-related')) {
        row.classList.remove('is-wheel-related');
        wheelRelatedRows.delete(row);
      }
      if (show) visible += 1;
    });
    const count = document.getElementById('skyFoundationRelationshipCount');
    if (count) count.textContent = `${visible}/${rowsByIndex.size}`;
    const empty = document.getElementById('skyFoundationRelationshipEmpty');
    if (empty) empty.hidden = visible !== 0;
  }

  function queueVisibilityRestore() {
    if (visibilityQueued) return;
    visibilityQueued = true;
    queueMicrotask(restoreVisibility);
  }

  function setWheelRelated(indexes) {
    const next = new Set();
    (indexes || []).forEach(value => {
      const row = rowsByIndex.get(String(value));
      if (row && !row.hidden) next.add(row);
    });

    wheelRelatedRows.forEach(row => {
      if (!next.has(row)) row.classList.remove('is-wheel-related');
    });
    next.forEach(row => {
      if (!wheelRelatedRows.has(row)) row.classList.add('is-wheel-related');
    });
    wheelRelatedRows = next;
  }

  function clearRowHover() {
    if (hoveredRow) hoveredRow.classList.remove('is-row-hovered');
    hoveredLines.forEach(line => line.classList.remove('is-row-hovered'));
    hoveredRow = null;
    hoveredLines = new Set();
  }

  function setRowHover(row) {
    if (row === hoveredRow) return;
    clearRowHover();
    if (!row) return;

    row.classList.add('is-row-hovered');
    hoveredRow = row;
    const identity = relationshipIdentity(row);
    const index = String(row.dataset.relationIndex || '');
    const lines = (identity && linesByIdentity.get(identity)) || (index && linesByIndex.get(index)) || new Set();
    hoveredLines = new Set(lines);
    hoveredLines.forEach(line => line.classList.add('is-row-hovered'));
  }

  function bind() {
    const root = document.getElementById('skyFoundationRoot');
    if (!root || root.dataset.highlightWithoutFilteringBound === 'true') return;
    root.dataset.highlightWithoutFilteringBound = 'true';

    window.addEventListener('relphi:sky-foundation-filter-changed', event => {
      const mode = event.detail?.state?.mode;
      if (mode === 'selected') {
        setWheelRelated([]);
        return;
      }
      setWheelRelated(mode === 'hover' ? event.detail.relationshipIndexes || [] : []);
      queueVisibilityRestore();
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
      setWheelRelated([]);
      restoreVisibility();
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
