// Repairs stale/persisted Celtic Cross board geometry from the shipped template.
// This runs before the desktop visual fitter so a saved default 6+4 grid cannot
// masquerade as the Celtic Cross merely because its labels survived persistence.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardCelticStateRepairV1) return;
  window.__relphiDrawingBoardCelticStateRepairV1 = true;

  const CELTIC = 'celtic-cross-10';
  const CANVAS_W = 900;
  const CANVAS_H = 760;
  const EPSILON = .75;
  let repairing = false;
  let queued = false;

  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const panel = () => document.getElementById('shortListPanel');
  const prefabBridge = () => window.RelphiDrawingBoardPrefabsBridge || null;
  const optionsBridge = () => window.RelphiDrawingBoardOptionsBridge || null;

  function canonicalPrefab() {
    const shipped = window.RelphiDrawingBoardSpreadPrefabs?.shipped;
    if (Array.isArray(shipped)) {
      const found = shipped.find(item => item?.id === CELTIC);
      if (found) return clone(found);
    }
    try {
      const found = window.RelphiDrawingBoardSpreadPrefabs?.list?.().find(item => item?.id === CELTIC);
      return found ? clone(found) : null;
    } catch (_) { return null; }
  }

  function orderedPositions(layout) {
    return (layout?.positions || []).slice().sort((a, b) => Number(a?.drawOrder || 0) - Number(b?.drawOrder || 0));
  }

  function labelsFor(layout) {
    return orderedPositions(layout).map((item, index) => String(item?.label || ('Position ' + (index + 1))).trim());
  }

  function sameLabels(a, b) {
    if (!Array.isArray(a) || a.length !== b.length) return false;
    return a.every((value, index) => String(value || '').trim() === b[index]);
  }

  function intendedCeltic(state, snapshot, canonical) {
    if (state?.designMode) return false;
    if (state?.activeLayout?.id === CELTIC || snapshot?.rowActiveLayout?.id === CELTIC) return true;
    if (panel()?.querySelector('#relphiSpreadTemplateSelect')?.value === CELTIC) return true;
    const expectedLabels = labelsFor(canonical);
    const actualLabels = Array.isArray(snapshot?.shortListPositionLabels) ? snapshot.shortListPositionLabels : [];
    return Number(state?.slotCount || 0) === expectedLabels.length && sameLabels(actualLabels, expectedLabels);
  }

  function expectedGeometry(canonical) {
    const positions = orderedPositions(canonical);
    return positions.map((position, index) => {
      const t = position?.canonicalTransform || position?.transform || {};
      return {
        index,
        position,
        x:(Number(t.x) || 0) * CANVAS_W,
        y:(Number(t.y) || 0) * CANVAS_H,
        scale:Number(t.scale) || 1,
        rotation:Number(t.rotation) || 0,
        zIndex:Number(t.zIndex) || 1
      };
    });
  }

  function closeEnough(a, b) {
    return Number.isFinite(Number(a)) && Math.abs(Number(a) - Number(b)) <= EPSILON;
  }

  function snapshotMatches(snapshot, canonical) {
    if (snapshot?.rowActiveLayout?.id !== CELTIC) return false;
    const expected = expectedGeometry(canonical);
    if (!expected.length) return false;
    const labels = labelsFor(canonical);
    if (!sameLabels(snapshot.shortListPositionLabels || [], labels)) return false;
    return expected.every(entry => {
      const point = snapshot.rowEnvelopeLayout?.[entry.index];
      const transform = snapshot.rowCardTransforms?.[entry.index];
      return point && transform &&
        closeEnough(point.x, entry.x) && closeEnough(point.y, entry.y) &&
        closeEnough(transform.scale, entry.scale) &&
        closeEnough(transform.rotation, entry.rotation) &&
        Number(transform.zIndex || 1) === entry.zIndex;
    });
  }

  function canonicalSnapshot(snapshot, canonical) {
    const next = clone(snapshot) || {};
    const expected = expectedGeometry(canonical);
    const oldStickerCards = Array.isArray(next.shortListPositionCardIds) ? next.shortListPositionCardIds.slice() : [];

    next.shortListPositionLabels = expected.map(entry => String(entry.position?.label || ('Position ' + (entry.index + 1))).trim());
    next.shortListPositionCardIds = expected.map((entry, index) => String(oldStickerCards[index] || ''));
    next.rowEnvelopeLayout = {};
    next.rowCardTransforms = {};
    next.rowPositionMeta = [];

    expected.forEach(entry => {
      const position = entry.position || {};
      next.rowEnvelopeLayout[entry.index] = { x:entry.x, y:entry.y };
      next.rowCardTransforms[entry.index] = { scale:entry.scale, rotation:entry.rotation, zIndex:entry.zIndex };
      next.rowPositionMeta[entry.index] = {
        id:String(position.id || ('position-' + (entry.index + 1))),
        role:String(position.role || ''),
        covers:String(position.covers || ''),
        crosses:String(position.crosses || ''),
        openTransform:position.openTransform ? clone(position.openTransform) : null
      };
    });

    next.rowActiveLayout = clone(canonical);
    next.rowLayoutDesignMode = false;
    next.rowLayoutLocked = true;
    next.rowTransformTarget = 0;
    // Keep cards, reversals, notes, art, zoom, pan and the user's temporary center view.
    return next;
  }

  function repairNow() {
    queued = false;
    if (repairing) return false;
    const canonical = canonicalPrefab();
    const pBridge = prefabBridge();
    const oBridge = optionsBridge();
    if (!canonical || !pBridge?.getState || !oBridge?.capture || !oBridge?.restore) return false;

    const state = pBridge.getState();
    const snapshot = oBridge.capture();
    if (!intendedCeltic(state, snapshot, canonical) || snapshotMatches(snapshot, canonical)) return false;

    repairing = true;
    try {
      oBridge.restore(canonicalSnapshot(snapshot, canonical));
      panel()?.setAttribute('data-relphi-celtic-state-repaired', 'true');
    } finally {
      requestAnimationFrame(() => { repairing = false; });
    }
    return true;
  }

  function schedule() {
    if (queued || repairing) return;
    queued = true;
    requestAnimationFrame(repairNow);
  }

  // Run synchronously once: previews share localStorage by origin, so the stale
  // snapshot should be corrected before the desktop geometry owner gets a chance to paint it.
  repairNow();
  document.addEventListener('relphi:drawing-board-rendered', schedule, true);
  document.addEventListener('relphi:tarot-enhancements-ready', schedule, true);
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#relphiSpreadTemplateSelect')) schedule();
  }, true);
})();
