// Desktop Drawing Board rendered-surface + Celtic Cross geometry owner.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.matchMedia?.('(max-width:700px)')?.matches) return;
  if (window.__relphiDrawingBoardRenderGeometryV2) return;
  window.__relphiDrawingBoardRenderGeometryV2 = true;
  // Prevent the retired desktop geometry owner from attaching if another loader finds it.
  window.__relphiDrawingBoardRenderGeometryV1 = true;

  const PANEL = '#shortListPanel';
  const CELTIC = 'celtic-cross-10';
  const RADIUS = '.72rem';
  const GAP_RATIO = .14;
  const GAP_MIN = 14;
  const GAP_MAX = 26;
  const TOP_GUTTER = 8;
  const SIDE_GUTTER = 12;
  const BOTTOM_GUTTER = 12;
  const FOLD_GUTTER = 14;
  const MIN_FOLD_HEIGHT = 280;
  const FIT_SAFETY = .985;
  let queued = false;
  let applying = false;
  let fitting = false;

  const root = () => document.querySelector(PANEL);
  const board = r => r?.querySelector('.card-row-board') || null;
  const face = item => item?.querySelector('.card-row-card-wrap,.card-row-drop-card') || null;
  const item = (b, index) => b?.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]') || null;

  function setImportant(node, property, value) {
    if (!node) return;
    if (node.style.getPropertyValue(property) === value && node.style.getPropertyPriority(property) === 'important') return;
    node.style.setProperty(property, value, 'important');
  }

  function activeCeltic(r) {
    let id = '';
    try { id = window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id || ''; } catch (_) {}
    const active = id === CELTIC;
    r?.classList.toggle('relphi-celtic-readable', active);
    if (!active && r) {
      r.style.removeProperty('--relphi-celtic-board-top');
      r.classList.remove('relphi-celtic-cross-unrevealed');
      delete r.dataset.relphiCelticFoldFitDone;
      releaseFold(r);
    }
    return active;
  }

  function syncCrossingReveal(r) {
    const b = board(r);
    const crosses = item(b, 1);
    const revealed = !!crosses?.querySelector('[data-row-card]');
    const state = revealed ? 'revealed' : 'unrevealed';
    if (r.dataset.relphiCelticCrossRevealState !== state) {
      r.dataset.relphiCelticCrossRevealState = state;
      delete r.dataset.relphiCelticFoldFitDone;
    }
    r.classList.toggle('relphi-celtic-cross-unrevealed', !revealed);
    return revealed;
  }

  function installStyle() {
    let style = document.getElementById('relphi-render-geometry-desktop-v2-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'relphi-render-geometry-desktop-v2-style';
    }
    style.textContent = [
      '#shortListPanel .card-row-board>.card-row-item::before,#shortListPanel .card-row-board>.card-row-item::after{content:none!important;display:none!important}',
      '#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::before,#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::after,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::before,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::after{content:none!important;display:none!important}',
      // This supersedes the old fixed 3.25rem rule. One renderer now owns top clearance.
      '#shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board{top:var(--relphi-celtic-board-top,3.25rem)!important}',
      '#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="0"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="1"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="2"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="3"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="4"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="5"]>.card-row-position-panel{top:0!important;bottom:auto!important;margin:0!important;transform:translateY(-100%)!important}',
      'html body #shortListPanel.relphi-celtic-cross-unrevealed .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="1"].relphi-celtic-crossing-rotated{transform:rotate(0deg) scale(var(--row-card-scale,1))!important}',
      'html body #shortListPanel.relphi-celtic-cross-unrevealed .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="1"].relphi-celtic-crossing-rotated>.card-row-position-panel{left:0!important;right:auto!important;top:0!important;bottom:auto!important;width:100%!important;min-width:100%!important;max-width:100%!important;margin:0!important;transform:translateY(-100%)!important;text-align:center!important}',
      'html body #shortListPanel.relphi-celtic-cross-unrevealed .relphi-center-helper{display:none!important}'
    ].join('');
    if (style.parentElement !== document.head || style !== document.head.lastElementChild) document.head.appendChild(style);
  }

  function ownSurfaces(r) {
    const b = board(r);
    if (!b) return;
    b.querySelectorAll(':scope > .card-row-item').forEach(node => {
      setImportant(node, 'background', 'transparent');
      setImportant(node, 'background-color', 'transparent');
      setImportant(node, 'border', '0px');
      setImportant(node, 'outline', '0px');
      setImportant(node, 'box-shadow', 'none');
      [node.querySelector(':scope > .card-row-card-wrap'), node.querySelector(':scope > .card-row-drop-card')].filter(Boolean).forEach(surface => {
        setImportant(surface, 'border-radius', RADIUS);
        setImportant(surface, 'overflow', 'hidden');
        setImportant(surface, 'clip-path', 'inset(0 round ' + RADIUS + ')');
        setImportant(surface, 'background-clip', 'padding-box');
        setImportant(surface, 'border', '0px');
        setImportant(surface, 'outline', '0px');
        setImportant(surface, 'box-shadow', 'none');
      });
    });
  }

  function scaleX(b) {
    if (!b?.offsetWidth) return 1;
    const value = b.getBoundingClientRect().width / b.offsetWidth;
    return Number.isFinite(value) && Math.abs(value) > .001 ? value : 1;
  }

  function clearTranslate(node, key) {
    if (!node || node.dataset[key] === undefined) return;
    node.style.removeProperty('translate');
    delete node.dataset[key];
  }

  function baseRect(node, key, sx) {
    const surface = face(node);
    if (!surface) return null;
    const rect = surface.getBoundingClientRect();
    const logical = Number(node.dataset[key] || 0);
    const visual = Number.isFinite(logical) ? logical * sx : 0;
    return { left:rect.left - visual, right:rect.right - visual, top:rect.top, bottom:rect.bottom, width:rect.width, height:rect.height };
  }

  function setTranslate(node, key, logical) {
    if (!node || !Number.isFinite(logical)) return;
    if (Math.abs(logical) < .01) return clearTranslate(node, key);
    const value = logical.toFixed(2) + 'px 0px';
    node.dataset[key] = String(logical);
    setImportant(node, 'translate', value);
  }

  function translateVisual(node, key, delta, sx) {
    if (!Number.isFinite(delta) || !Number.isFinite(sx) || Math.abs(sx) < .001) return;
    setTranslate(node, key, delta / sx);
  }

  function middleGap(width) { return Math.max(GAP_MIN, Math.min(GAP_MAX, width * GAP_RATIO)); }

  function positionMiddle(r) {
    const b = board(r);
    if (!b) return;
    const covers = item(b, 0), crosses = item(b, 1), behind = item(b, 4), before = item(b, 5);
    if (!covers || !crosses || !behind || !before) return;
    const sx = scaleX(b);
    const cover = baseRect(covers, 'relphiMiddleTranslateX', sx);
    const cross = baseRect(crosses, 'relphiMiddleTranslateX', sx);
    const rear = baseRect(behind, 'relphiMiddleTranslateX', sx);
    const front = baseRect(before, 'relphiMiddleTranslateX', sx);
    if (!cover || !cross || !rear || !front || !cover.width) return;

    const revealed = !!crosses.querySelector('[data-row-card]');
    const centerOpen = !revealed || !crosses.classList.contains('relphi-celtic-crossing-rotated');
    const coverCenter = cover.left + cover.width / 2;
    const crossCenter = cross.left + cross.width / 2;
    const axis = centerOpen ? (coverCenter + crossCenter) / 2 : coverCenter;
    const gap = middleGap(cover.width);

    if (centerOpen) {
      translateVisual(covers, 'relphiMiddleTranslateX', (axis - gap / 2) - cover.right, sx);
      translateVisual(crosses, 'relphiMiddleTranslateX', (axis + gap / 2) - cross.left, sx);
    } else {
      clearTranslate(covers, 'relphiMiddleTranslateX');
      clearTranslate(crosses, 'relphiMiddleTranslateX');
    }
    const leftEdge = axis - cover.width - gap / 2;
    const rightEdge = axis + cover.width + gap / 2;
    translateVisual(behind, 'relphiMiddleTranslateX', (leftEdge - gap) - rear.right, sx);
    translateVisual(before, 'relphiMiddleTranslateX', (rightEdge + gap) - front.left, sx);
  }

  function positionStaff(r) {
    const b = board(r);
    const before = item(b, 5), first = item(b, 6);
    const beforeFace = face(before), firstFace = face(first);
    if (!beforeFace || !firstFace) return;
    const sx = scaleX(b);
    const beforeRect = beforeFace.getBoundingClientRect();
    const staffRect = baseRect(first, 'relphiStaffTranslateX', sx);
    if (!beforeRect.width || !staffRect?.width) return;
    const logical = (beforeRect.right + beforeRect.width - staffRect.left) / sx;
    [6,7,8,9].forEach(index => setTranslate(item(b, index), 'relphiStaffTranslateX', logical));
  }

  function maxTopStickerHeight(r) {
    const b = board(r);
    if (!b) return 0;
    let height = 0;
    [0,1,2,3,4,5].forEach(index => {
      const sticker = item(b, index)?.querySelector(':scope > .card-row-position-panel');
      if (sticker) height = Math.max(height, sticker.getBoundingClientRect().height || 0);
    });
    return height;
  }

  function reserveTop(r) {
    // The historical 3.25rem fix was correct at its original zoom. The new fitter
    // can enlarge labels, so clearance must track their rendered height instead.
    const required = Math.max(52, Math.ceil(maxTopStickerHeight(r) + TOP_GUTTER));
    const previous = Number(r.dataset.relphiCelticTopClearance || 0);
    if (Math.abs(previous - required) < 1) return;
    r.dataset.relphiCelticTopClearance = String(required);
    r.style.setProperty('--relphi-celtic-board-top', required + 'px');
  }

  function bounds(b) {
    if (!b) return null;
    const nodes = [];
    b.querySelectorAll(':scope > .card-row-item').forEach(node => {
      const f = face(node);
      const sticker = node.querySelector(':scope > .card-row-position-panel');
      if (f) nodes.push(f);
      if (sticker) nodes.push(sticker);
    });
    const helper = b.querySelector('.relphi-center-helper');
    if (helper && getComputedStyle(helper).display !== 'none') nodes.push(helper);
    const rects = nodes.map(n => n.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    if (!rects.length) return null;
    return { left:Math.min(...rects.map(r => r.left)), right:Math.max(...rects.map(r => r.right)), top:Math.min(...rects.map(r => r.top)), bottom:Math.max(...rects.map(r => r.bottom)) };
  }

  function constrainFold(r) {
    const workspace = r.querySelector('.card-row-workspace');
    if (!workspace) return null;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
    const rect = workspace.getBoundingClientRect();
    const available = Math.floor(viewportHeight - Math.max(0, rect.top) - FOLD_GUTTER);
    if (available < MIN_FOLD_HEIGHT) return null;
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
    return available;
  }

  function releaseFold(r) {
    const workspace = r?.querySelector('.card-row-workspace');
    if (!workspace || workspace.dataset.relphiCelticFoldPrevious === undefined) return;
    let old = {};
    try { old = JSON.parse(workspace.dataset.relphiCelticFoldPrevious || '{}'); } catch (_) {}
    [['height',old.height],['min-height',old.minHeight],['max-height',old.maxHeight]].forEach(([property,value]) => {
      if (value) workspace.style.setProperty(property, value); else workspace.style.removeProperty(property);
    });
    delete workspace.dataset.relphiCelticFoldPrevious;
  }

  function fitFold(r) {
    if (fitting || r.dataset.relphiCelticFoldFitDone === 'true') return;
    const workspace = r.querySelector('.card-row-workspace');
    const b = board(r);
    const zoom = document.getElementById('rowZoom');
    if (!workspace || !b || !zoom || !constrainFold(r)) return;

    reserveTop(r);
    const content = bounds(b);
    const frame = workspace.getBoundingClientRect();
    if (!content || !frame.width || !frame.height) return;
    const contentWidth = Math.max(1, content.right - content.left);
    const contentHeight = Math.max(1, content.bottom - content.top);
    const targetWidth = Math.max(1, frame.width - SIDE_GUTTER * 2);
    const targetHeight = Math.max(1, frame.height - TOP_GUTTER - BOTTOM_GUTTER);
    const ratio = Math.min(targetWidth / contentWidth, targetHeight / contentHeight);
    const current = Number(zoom.value) || 1;
    const min = Number(zoom.min) > 0 ? Number(zoom.min) : .45;
    const max = Number(zoom.max) > 0 ? Number(zoom.max) : 2.4;
    const next = Math.max(min, Math.min(max, current * ratio * FIT_SAFETY));

    if (Math.abs(next - current) < .005 || Math.abs(1 - ratio) < .012) {
      r.dataset.relphiCelticFoldFitDone = 'true';
      return;
    }
    fitting = true;
    r.dataset.relphiCelticFoldFitDone = 'true';
    zoom.value = String(next);
    zoom.dispatchEvent(new Event('input', { bubbles:true }));
    zoom.dispatchEvent(new Event('change', { bubbles:true }));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fitting = false;
      delete r.dataset.relphiCelticTopClearance;
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
      installStyle();
      if (!activeCeltic(r)) return;
      syncCrossingReveal(r);
      ownSurfaces(r);
      positionMiddle(r);
      positionStaff(r);
      reserveTop(r);
      fitFold(r);
    } finally { applying = false; }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  function resetFit() {
    const r = root();
    if (!r) return;
    delete r.dataset.relphiCelticFoldFitDone;
    delete r.dataset.relphiCelticTopClearance;
  }

  installStyle();
  document.addEventListener('relphi:drawing-board-rendered', schedule);
  document.addEventListener('relphi:drawing-board-center-view', () => { resetFit(); schedule(); });
  document.addEventListener('input', event => {
    if (event.target?.matches?.('#rowZoom,#rowEnvelopeColor')) {
      if (event.target.matches('#rowZoom') && event.isTrusted && !fitting) root()?.setAttribute('data-relphi-celtic-fold-fit-done','true');
      schedule();
    }
  }, true);
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#relphiSpreadTemplateSelect')) resetFit();
    if (event.target?.matches?.('#relphiSpreadTemplateSelect,#rowZoom,#rowEnvelopeColor')) schedule();
  }, true);
  window.addEventListener('resize', () => { resetFit(); schedule(); }, { passive:true });
  new MutationObserver(records => {
    if (applying) return;
    if (records.some(record => record.type === 'childList' || (record.type === 'attributes' && ['class','style'].includes(record.attributeName)))) schedule();
  }).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
  schedule();
})();
