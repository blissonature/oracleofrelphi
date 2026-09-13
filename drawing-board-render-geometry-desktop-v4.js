// Desktop Celtic Cross fold fitter. The prefab owns card coordinates; this file never rewrites the traditional layout.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.matchMedia?.('(max-width:700px)')?.matches) return;
  if (window.__relphiDrawingBoardRenderGeometryV4) return;
  window.__relphiDrawingBoardRenderGeometryV4 = true;
  window.__relphiDrawingBoardRenderGeometryV1 = true;
  window.__relphiDrawingBoardRenderGeometryV2 = true;
  window.__relphiDrawingBoardRenderGeometryV3 = true;

  const PANEL = '#shortListPanel';
  const CELTIC = 'celtic-cross-10';
  const FOLD_GUTTER = 14;
  const SIDE_GUTTER = 14;
  const TOP_GUTTER = 8;
  const BOTTOM_GUTTER = 14;
  const MIN_FOLD_HEIGHT = 280;
  const FIT_SAFETY = .985;
  const MAX_PASSES = 5;
  let queued = false;
  let applying = false;
  let fitting = false;

  const root = () => document.querySelector(PANEL);
  const board = r => r?.querySelector('.card-row-board') || null;
  const item = (b, index) => b?.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]') || null;
  const face = node => node?.querySelector('.card-row-card-wrap,.card-row-drop-card,.card-row-card,.or-card') || null;

  function setImportant(node, property, value) {
    if (!node) return;
    if (node.style.getPropertyValue(property) === value && node.style.getPropertyPriority(property) === 'important') return;
    node.style.setProperty(property, value, 'important');
  }

  function activeLayoutId() {
    try { return window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id || ''; }
    catch (_) { return ''; }
  }

  function release(r) {
    const b = board(r);
    if (b?.dataset.relphiCelticOwnedTop === 'true') {
      b.style.removeProperty('top');
      delete b.dataset.relphiCelticOwnedTop;
    }
    r.classList.remove('relphi-celtic-readable', 'relphi-celtic-cross-unrevealed');
    delete r.dataset.relphiCelticFoldFitDone;
    delete r.dataset.relphiCelticFitPass;
    delete r.dataset.relphiCelticTopClearance;
    delete r.dataset.relphiCelticPanReset;
    const workspace = r.querySelector('.card-row-workspace');
    if (workspace?.dataset.relphiCelticFoldPrevious !== undefined) {
      let old = {};
      try { old = JSON.parse(workspace.dataset.relphiCelticFoldPrevious || '{}'); } catch (_) {}
      [['height',old.height],['min-height',old.minHeight],['max-height',old.maxHeight]].forEach(([property,value]) => {
        if (value) workspace.style.setProperty(property, value); else workspace.style.removeProperty(property);
      });
      delete workspace.dataset.relphiCelticFoldPrevious;
    }
  }

  function activeCeltic(r) {
    const active = activeLayoutId() === CELTIC;
    if (!active) release(r);
    else r.classList.add('relphi-celtic-readable');
    return active;
  }

  function syncReveal(r) {
    const crosses = item(board(r), 1);
    const revealed = !!crosses?.querySelector('[data-row-card]');
    const next = revealed ? 'revealed' : 'unrevealed';
    if (r.dataset.relphiCelticCrossRevealState !== next) {
      r.dataset.relphiCelticCrossRevealState = next;
      delete r.dataset.relphiCelticFoldFitDone;
      r.dataset.relphiCelticFitPass = '0';
    }
    r.classList.toggle('relphi-celtic-cross-unrevealed', !revealed);
  }

  function boardScale(b) {
    const rect = b?.getBoundingClientRect();
    const x = b?.offsetWidth ? rect.width / b.offsetWidth : 1;
    const y = b?.offsetHeight ? rect.height / b.offsetHeight : 1;
    return {
      x:Number.isFinite(x) && Math.abs(x) > .001 ? Math.abs(x) : 1,
      y:Number.isFinite(y) && Math.abs(y) > .001 ? Math.abs(y) : 1
    };
  }

  function reserveTop(r) {
    const b = board(r);
    if (!b) return;
    let renderedLabelHeight = 0;
    [0,1,2,3,4,5].forEach(index => {
      const label = item(b, index)?.querySelector(':scope > .card-row-position-panel');
      if (label) renderedLabelHeight = Math.max(renderedLabelHeight, label.getBoundingClientRect().height || 0);
    });
    const visualClearance = Math.ceil(renderedLabelHeight + TOP_GUTTER);
    const logicalTop = Math.max(0, Math.ceil(visualClearance / boardScale(b).y));
    setImportant(b, 'top', logicalTop + 'px');
    b.dataset.relphiCelticOwnedTop = 'true';
    r.dataset.relphiCelticTopClearance = String(visualClearance);
  }

  function constrainFold(r) {
    const workspace = r.querySelector('.card-row-workspace');
    if (!workspace) return false;
    const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 720;
    const rect = workspace.getBoundingClientRect();
    const available = Math.floor(viewportHeight - Math.max(0, rect.top) - FOLD_GUTTER);
    if (available < MIN_FOLD_HEIGHT) return false;
    if (workspace.dataset.relphiCelticFoldPrevious === undefined) {
      workspace.dataset.relphiCelticFoldPrevious = JSON.stringify({
        height:workspace.style.getPropertyValue('height') || '',
        minHeight:workspace.style.getPropertyValue('min-height') || '',
        maxHeight:workspace.style.getPropertyValue('max-height') || ''
      });
    }
    const px = available + 'px';
    setImportant(workspace, 'height', px);
    setImportant(workspace, 'min-height', px);
    setImportant(workspace, 'max-height', px);
    return true;
  }

  function visualBounds(b) {
    if (!b) return null;
    const nodes = [];
    b.querySelectorAll(':scope > .card-row-item').forEach(node => {
      const visual = face(node);
      const label = node.querySelector(':scope > .card-row-position-panel');
      if (visual) nodes.push(visual);
      if (label) nodes.push(label);
    });
    const rects = nodes.map(node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    if (!rects.length) return null;
    return {
      left:Math.min(...rects.map(rect => rect.left)),
      right:Math.max(...rects.map(rect => rect.right)),
      top:Math.min(...rects.map(rect => rect.top)),
      bottom:Math.max(...rects.map(rect => rect.bottom))
    };
  }

  function resetPanOnce(r) {
    if (r.dataset.relphiCelticPanReset === 'true') return;
    r.dataset.relphiCelticPanReset = 'true';
    document.getElementById('resetCardRowPan')?.click();
  }

  function fit(r) {
    if (fitting || r.dataset.relphiCelticFoldFitDone === 'true') return;
    const workspace = r.querySelector('.card-row-workspace');
    const b = board(r);
    const zoom = document.getElementById('rowZoom');
    if (!workspace || !b || !zoom || !constrainFold(r)) return;
    reserveTop(r);
    const content = visualBounds(b);
    const frame = workspace.getBoundingClientRect();
    if (!content || !frame.width || !frame.height) return;

    const contentWidth = Math.max(1, content.right - content.left);
    const contentHeight = Math.max(1, content.bottom - content.top);
    const targetWidth = Math.max(1, frame.width - SIDE_GUTTER * 2);
    const targetHeight = Math.max(1, frame.height - TOP_GUTTER - BOTTOM_GUTTER);
    const ratio = Math.min(targetWidth / contentWidth, targetHeight / contentHeight);
    const current = Number(zoom.value) || 1;
    const min = Number(zoom.min) > 0 ? Number(zoom.min) : .35;
    const max = Number(zoom.max) > 0 ? Number(zoom.max) : 2.4;
    const next = Math.max(min, Math.min(max, current * ratio * FIT_SAFETY));
    const pass = Number(r.dataset.relphiCelticFitPass || 0);

    if (Math.abs(next - current) < .006 || Math.abs(1 - ratio) < .012 || pass >= MAX_PASSES) {
      r.dataset.relphiCelticFoldFitDone = 'true';
      return;
    }

    fitting = true;
    r.dataset.relphiCelticFitPass = String(pass + 1);
    zoom.value = String(next);
    zoom.dispatchEvent(new Event('input', { bubbles:true }));
    zoom.dispatchEvent(new Event('change', { bubbles:true }));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fitting = false;
      reserveTop(r);
      schedule();
    }));
  }

  function apply() {
    queued = false;
    if (applying) return;
    const r = root();
    if (!r || r.hidden) return;
    applying = true;
    try {
      if (!activeCeltic(r)) return;
      syncReveal(r);
      resetPanOnce(r);
      reserveTop(r);
      fit(r);
    } finally { applying = false; }
  }

  function resetFit() {
    const r = root();
    if (!r) return;
    delete r.dataset.relphiCelticFoldFitDone;
    r.dataset.relphiCelticFitPass = '0';
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  document.addEventListener('relphi:drawing-board-rendered', () => { resetFit(); schedule(); });
  document.addEventListener('relphi:drawing-board-center-view', () => { resetFit(); schedule(); });
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#relphiSpreadTemplateSelect')) {
      const r = root();
      if (r) delete r.dataset.relphiCelticPanReset;
      resetFit();
      schedule();
    }
  }, true);
  document.addEventListener('input', event => {
    if (event.target?.matches?.('#rowZoom') && event.isTrusted && !fitting) {
      const r = root();
      if (r) r.dataset.relphiCelticFoldFitDone = 'true';
    }
  }, true);
  window.addEventListener('resize', () => { resetFit(); schedule(); }, { passive:true });
  new MutationObserver(records => {
    if (applying) return;
    if (records.some(record => record.type === 'childList')) schedule();
  }).observe(document.documentElement, { childList:true, subtree:true });
  schedule();
})();