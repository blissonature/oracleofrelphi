// Keeps the completed Sky workspace mounted while the underlying builder enters edit mode.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SKY_A_KEY = 'relphiSkyChartA';
  const SENTINEL_CLASS = 'relphi-workspace-lifecycle-sentinel';
  let queued = false;

  function hasSkyA() {
    try {
      const payload = JSON.parse(localStorage.getItem(SKY_A_KEY) || 'null');
      const placements = payload && (payload.placements || payload);
      return !!placements && typeof placements === 'object' && !Array.isArray(placements) && Object.keys(placements).length > 0;
    } catch (_) {
      return false;
    }
  }

  function ensureAnchor() {
    queued = false;
    const root = document.getElementById('relphiSkyBuilderV4');
    if (!root) return;
    let anchor = root.querySelector('.' + SENTINEL_CLASS);
    if (!hasSkyA()) {
      anchor?.remove();
      return;
    }
    if (!anchor) {
      anchor = document.createElement('span');
      anchor.className = 'relphi-v4-complete ' + SENTINEL_CLASS;
      anchor.hidden = true;
      anchor.setAttribute('aria-hidden', 'true');
      root.appendChild(anchor);
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(ensureAnchor);
  }

  function start() {
    ensureAnchor();
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('storage', schedule);
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();