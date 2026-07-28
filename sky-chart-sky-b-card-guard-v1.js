// Restores the Sky B workspace card whenever the builder or comparison wheel still has Sky B.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SKY_B_KEY = 'relphiSkyChartB';
  const STATE_KEY = 'relphiSkyBuilderV4State';
  let queued = false;
  let rebuilding = false;

  function read(storage, key) {
    try { return JSON.parse(storage.getItem(key) || 'null'); } catch (_) { return null; }
  }
  function write(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
  }
  function placements(payload) {
    const value = payload && (payload.placements || payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function usable(payload) { return !!payload && Object.keys(placements(payload)).length > 0; }

  function nativePayload() {
    const panel = document.querySelector('.relphi-v4-sky-panel[data-slot="skyB"]');
    if (panel) {
      try {
        const payload = JSON.parse(panel.dataset.json || 'null');
        if (usable(payload)) return payload;
      } catch (_) {}
    }
    return null;
  }

  function recoverSkyB() {
    const stored = read(localStorage, SKY_B_KEY);
    if (usable(stored)) return stored;
    const state = read(sessionStorage, STATE_KEY);
    if (usable(state && state.skyB)) {
      write(localStorage, SKY_B_KEY, state.skyB);
      return state.skyB;
    }
    const native = nativePayload();
    if (usable(native)) {
      write(localStorage, SKY_B_KEY, native);
      return native;
    }
    return null;
  }

  function blueComparisonExists() {
    return !!document.querySelector(
      '.relphi-canonical-marker-host[data-sky="skyB"],' +
      '.relphi-inside-sign-placement-host[data-sky="skyB"],' +
      '.chart-wheel-placement-stick[data-sky="skyB"],' +
      '.chart-wheel-placement-stick.current-sky,' +
      '.chart-wheel-placement-stick.comparison'
    );
  }

  function rebuildWorkspace() {
    if (rebuilding) return;
    rebuilding = true;
    const workspace = document.getElementById('relphiSkyWorkspace');
    if (workspace && !workspace.querySelector('[data-workspace-slot="skyB"]')) workspace.remove();
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('relphi:extra-points-updated'));
    setTimeout(function () { rebuilding = false; queue(); }, 120);
  }

  function run() {
    queued = false;
    const skyB = recoverSkyB();
    const workspace = document.getElementById('relphiSkyWorkspace');
    const hasCard = !!workspace?.querySelector('[data-workspace-slot="skyB"]');
    if (usable(skyB) && !hasCard) {
      rebuildWorkspace();
      return;
    }
    if (!usable(skyB) && blueComparisonExists()) {
      setTimeout(queue, 120);
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  function start() {
    run();
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('storage', queue);
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();