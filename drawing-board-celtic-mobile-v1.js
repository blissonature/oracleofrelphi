// Celtic Cross mobile viewport: stable center view, canonical stack, extended zoom, and fixed UI controls.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardCelticMobileV1) return;
  window.__relphiDrawingBoardCelticMobileV1 = true;

  const PANEL = '#shortListPanel';
  const CORE_MIN_ZOOM = 0.45;
  const EXTENDED_MIN_ZOOM = 0.20;
  const MAX_ZOOM = 2.40;
  const CENTER_KEY = 'relphiDrawingBoardCelticCenterViewV1';
  const ZOOM_KEY = 'relphiDrawingBoardExtendedZoomV1';
  let queued = false;
  let bypassZoomCapture = false;
  let effectiveZoom = null;

  function panel() { return document.querySelector(PANEL); }
  function api() { return window.RelphiDrawingBoardPrefabsBridge; }
  function state() { return api()?.getState?.() || null; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || min)); }
  function isCeltic(layout) { return !!layout && layout.helper === 'celtic-center' && /^celtic-cross-(10|11)$/.test(String(layout.id || '')); }

  function canonicalLayout(id) {
    const shipped = window.RelphiDrawingBoardSpreadPrefabs?.shipped || [];
    return shipped.find(item => item.id === id) || null;
  }

  function readCenterPreferences() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CENTER_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) { return {}; }
  }
  function storedCenterOpen(layoutId) {
    const values = readCenterPreferences();
    return Object.prototype.hasOwnProperty.call(values, layoutId) ? !!values[layoutId] : null;
  }
  function storeCenterOpen(layoutId, open) {
    try {
      const values = readCenterPreferences();
      values[layoutId] = !!open;
      localStorage.setItem(CENTER_KEY, JSON.stringify(values));
    } catch (_) {}
  }

  function readStoredZoom() {
    try {
      const value = Number(localStorage.getItem(ZOOM_KEY));
      return Number.isFinite(value) ? clamp(value, EXTENDED_MIN_ZOOM, MAX_ZOOM) : null;
    } catch (_) { return null; }
  }
  function storeZoom(value) {
    try { localStorage.setItem(ZOOM_KEY, String(clamp(value, EXTENDED_MIN_ZOOM, MAX_ZOOM))); } catch (_) {}
  }

  function installStyles() {
    if (document.getElementById('relphi-celtic-mobile-v1-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-celtic-mobile-v1-style';
    style.textContent = `
      #shortListPanel .card-row-board>.relphi-center-helper{display:none!important}
      #shortListPanel .relphi-celtic-view-control{position:absolute;top:.55rem;right:.55rem;z-index:1700;display:inline-flex;align-items:center;gap:.35rem;min-height:2.35rem;padding:.35rem .7rem;border:1px solid rgba(23,20,18,.35);border-radius:999px;background:rgba(255,250,244,.96);color:#171412;font:inherit;font-size:.74rem;font-weight:900;line-height:1;box-shadow:0 4px 12px rgba(30,20,15,.12);backdrop-filter:blur(4px);touch-action:manipulation}
      #shortListPanel .relphi-celtic-view-control::before{content:'Center';color:#756b64;font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
      #shortListPanel .relphi-celtic-zoom-layer{position:relative;transform-origin:0 0}
      @media(max-width:600px){#shortListPanel .relphi-celtic-view-control{top:.45rem;right:.45rem;min-height:2.2rem;padding:.3rem .58rem;font-size:.7rem}}
    `;
    document.head.appendChild(style);
  }

  function ensureZoomLayer(root) {
    const workspace = root?.querySelector('.card-row-workspace');
    const board = workspace?.querySelector('.card-row-board');
    if (!workspace || !board) return null;
    if (board.parentElement?.classList.contains('relphi-celtic-zoom-layer')) return board.parentElement;
    const layer = document.createElement('div');
    layer.className = 'relphi-celtic-zoom-layer';
    board.parentNode.insertBefore(layer, board);
    layer.appendChild(board);
    return layer;
  }

  function applyExtraScale(root, value) {
    const layer = ensureZoomLayer(root);
    if (!layer) return;
    const extra = value < CORE_MIN_ZOOM ? value / CORE_MIN_ZOOM : 1;
    layer.style.transform = extra === 1 ? '' : `scale(${extra})`;
    layer.dataset.relphiEffectiveZoom = String(value);
  }

  function dispatchCoreZoom(input, coreValue, commit) {
    if (!input) return;
    bypassZoomCapture = true;
    input.value = String(coreValue);
    input.dispatchEvent(new Event('input', { bubbles:true }));
    if (commit) input.dispatchEvent(new Event('change', { bubbles:true }));
    bypassZoomCapture = false;
  }

  function setEffectiveZoom(value, options = {}) {
    const root = panel();
    const input = root?.querySelector('#rowZoom');
    if (!root || !input) return;
    const next = clamp(value, EXTENDED_MIN_ZOOM, MAX_ZOOM);
    effectiveZoom = next;
    input.min = String(EXTENDED_MIN_ZOOM);
    if (next < CORE_MIN_ZOOM) {
      dispatchCoreZoom(input, CORE_MIN_ZOOM, !!options.commit);
      input.value = String(next);
      const label = root.querySelector('#rowZoomValue');
      if (label) label.textContent = Math.round(next * 100) + '%';
      applyExtraScale(root, next);
    } else {
      applyExtraScale(root, next);
      if (options.dispatchCore !== false) dispatchCoreZoom(input, next, !!options.commit);
      else input.value = String(next);
    }
    storeZoom(next);
    requestAnimationFrame(() => applyCanonicalCenter(root));
  }

  function currentEffectiveZoom(root) {
    if (Number.isFinite(effectiveZoom)) return effectiveZoom;
    const input = root?.querySelector('#rowZoom');
    const stored = readStoredZoom();
    if (stored != null && stored < CORE_MIN_ZOOM) return stored;
    return clamp(input?.value || 1, EXTENDED_MIN_ZOOM, MAX_ZOOM);
  }

  function centerOpenFor(layout, liveState) {
    const stored = storedCenterOpen(layout.id);
    if (stored == null) {
      storeCenterOpen(layout.id, !!liveState.centerOpen);
      return !!liveState.centerOpen;
    }
    return stored;
  }

  function syncCoreCenter(layout, liveState) {
    const wanted = centerOpenFor(layout, liveState);
    if (!!liveState.centerOpen !== wanted) {
      api()?.setCenterOpen?.(wanted);
      return wanted;
    }
    return wanted;
  }

  function applyCanonicalCenter(root) {
    const liveState = state();
    const active = liveState?.activeLayout;
    const board = root?.querySelector('.card-row-board');
    if (!board || !isCeltic(active)) return;
    const canonical = canonicalLayout(active.id) || active;
    const open = centerOpenFor(canonical, liveState);
    const roles = new Set(['significator','covering','crossing']);
    canonical.positions.forEach((position, index) => {
      if (!roles.has(position.role)) return;
      const value = open && position.openTransform ? position.openTransform : position.transform;
      const item = board.querySelector('[data-row-index="' + index + '"]');
      if (!item || !value) return;
      item.dataset.relphiCelticRole = position.role;
      item.style.left = Math.round(Number(value.x) * 900) + 'px';
      item.style.top = Math.round(Number(value.y) * 760) + 'px';
      item.style.zIndex = String(Number(value.zIndex) || 1);
      item.style.setProperty('--row-card-scale', String(Number(value.scale) || 1));
      item.style.setProperty('--row-card-rotation', (Number(value.rotation) || 0) + 'deg');
    });
  }

  function ensureCenterControl(root) {
    const workspace = root?.querySelector('.card-row-workspace');
    const liveState = state();
    const layout = liveState?.activeLayout;
    root?.querySelectorAll('.card-row-board>.relphi-center-helper').forEach(node => node.remove());
    let button = root?.querySelector('.relphi-celtic-view-control');
    if (!workspace || !isCeltic(layout)) {
      button?.remove();
      return;
    }
    const open = syncCoreCenter(layout, liveState);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'relphi-celtic-view-control';
      workspace.appendChild(button);
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const current = state();
        const currentLayout = current?.activeLayout;
        if (!isCeltic(currentLayout)) return;
        const next = !centerOpenFor(currentLayout, current);
        storeCenterOpen(currentLayout.id, next);
        api()?.setCenterOpen?.(next);
        schedule();
      });
    } else if (button.parentElement !== workspace) {
      workspace.appendChild(button);
    }
    button.textContent = open ? 'Cross' : 'Uncross';
    button.title = open ? 'Restore the crossed Celtic Cross center' : 'Uncross the Celtic Cross center';
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', String(open));
  }

  function logicalBounds(board) {
    const items = Array.from(board.querySelectorAll('.card-row-item[data-row-index]'));
    if (!items.length) return null;
    const values = items.map(item => {
      const left = Number.parseFloat(item.style.left) || 0;
      const top = Number.parseFloat(item.style.top) || 0;
      const scale = Number.parseFloat(item.style.getPropertyValue('--row-card-scale')) || 1;
      const rotation = Math.abs((Number.parseFloat(item.style.getPropertyValue('--row-card-rotation')) || 0) % 180);
      const quarterTurn = rotation > 45 && rotation < 135;
      const width = (quarterTurn ? 382 : 210) * scale;
      const height = (quarterTurn ? 210 : 382) * scale;
      return { left, top, right:left + width, bottom:top + height };
    });
    return {
      minX:Math.min(...values.map(value => value.left)),
      minY:Math.min(...values.map(value => value.top)),
      maxX:Math.max(...values.map(value => value.right)),
      maxY:Math.max(...values.map(value => value.bottom))
    };
  }

  function zoomToExtents(root) {
    const workspace = root?.querySelector('.card-row-workspace');
    const board = workspace?.querySelector('.card-row-board');
    if (!workspace || !board) return;
    root.querySelector('#resetCardRowPan')?.click();
    requestAnimationFrame(() => {
      applyCanonicalCenter(root);
      const bounds = logicalBounds(board);
      if (!bounds) return;
      const width = Math.max(1, bounds.maxX - Math.min(0, bounds.minX));
      const height = Math.max(1, bounds.maxY - Math.min(0, bounds.minY));
      const fitX = Math.max(1, workspace.clientWidth - 24) / width;
      const fitY = Math.max(1, workspace.clientHeight - 24) / height;
      setEffectiveZoom(clamp(Math.min(fitX, fitY, 1), EXTENDED_MIN_ZOOM, 1), { commit:true });
    });
  }

  function bindZoomCapture() {
    document.addEventListener('input', event => {
      const input = event.target;
      if (input?.id !== 'rowZoom' || bypassZoomCapture || !input.closest(PANEL)) return;
      input.min = String(EXTENDED_MIN_ZOOM);
      const value = clamp(input.value, EXTENDED_MIN_ZOOM, MAX_ZOOM);
      effectiveZoom = value;
      storeZoom(value);
      if (value < CORE_MIN_ZOOM) {
        event.preventDefault();
        event.stopImmediatePropagation();
        dispatchCoreZoom(input, CORE_MIN_ZOOM, false);
        input.value = String(value);
        const label = panel()?.querySelector('#rowZoomValue');
        if (label) label.textContent = Math.round(value * 100) + '%';
        applyExtraScale(panel(), value);
      } else {
        applyExtraScale(panel(), value);
      }
      requestAnimationFrame(() => applyCanonicalCenter(panel()));
    }, true);

    document.addEventListener('change', event => {
      const input = event.target;
      if (input?.id !== 'rowZoom' || bypassZoomCapture || !input.closest(PANEL)) return;
      const value = clamp(input.value, EXTENDED_MIN_ZOOM, MAX_ZOOM);
      effectiveZoom = value;
      storeZoom(value);
      if (value < CORE_MIN_ZOOM) {
        event.preventDefault();
        event.stopImmediatePropagation();
        dispatchCoreZoom(input, CORE_MIN_ZOOM, true);
        input.value = String(value);
        const label = panel()?.querySelector('#rowZoomValue');
        if (label) label.textContent = Math.round(value * 100) + '%';
        applyExtraScale(panel(), value);
      }
      requestAnimationFrame(() => applyCanonicalCenter(panel()));
    }, true);

    document.addEventListener('click', event => {
      const button = event.target.closest?.('#zoomCardRowExtents');
      if (!button || !button.closest(PANEL)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      zoomToExtents(panel());
    }, true);
  }

  function enhance() {
    queued = false;
    const root = panel();
    if (!root || root.hidden) return;
    const liveState = state();
    const input = root.querySelector('#rowZoom');
    if (input) input.min = String(EXTENDED_MIN_ZOOM);
    if (isCeltic(liveState?.activeLayout)) {
      ensureZoomLayer(root);
      ensureCenterControl(root);
      applyCanonicalCenter(root);
      const remembered = currentEffectiveZoom(root);
      if (remembered < CORE_MIN_ZOOM) setEffectiveZoom(remembered, { dispatchCore:false });
      else applyExtraScale(root, remembered);
    } else {
      root.querySelector('.relphi-celtic-view-control')?.remove();
      const layer = root.querySelector('.relphi-celtic-zoom-layer');
      if (layer) {
        const board = layer.querySelector('.card-row-board');
        if (board) layer.parentNode.insertBefore(board, layer);
        layer.remove();
      }
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(enhance);
  }

  installStyles();
  bindZoomCapture();
  document.addEventListener('relphi:drawing-board-rendered', schedule);
  document.addEventListener('relphi:drawing-board-center-view', schedule);
  new MutationObserver(records => {
    if (records.some(record => record.type === 'childList')) schedule();
  }).observe(document.documentElement, { childList:true, subtree:true });
  schedule();
})();
