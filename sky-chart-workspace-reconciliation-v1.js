// Keeps the visible Sky workspace synchronized with stored and builder sky slots.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const STATE_KEY = 'relphiSkyBuilderV4State';
  let queued = false;

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

  function panelPayload(slot) {
    const panel = document.querySelector('.relphi-v4-sky-panel[data-slot="' + slot + '"]');
    if (!panel) return null;
    try { return JSON.parse(panel.dataset.json || 'null'); } catch (_) { return null; }
  }

  function recover(slot) {
    const key = KEYS[slot];
    const stored = read(localStorage, key);
    if (usable(stored)) return stored;
    const state = read(sessionStorage, STATE_KEY);
    const fromState = state && state[slot];
    if (usable(fromState)) {
      write(localStorage, key, fromState);
      return fromState;
    }
    const fromPanel = panelPayload(slot);
    if (usable(fromPanel)) {
      write(localStorage, key, fromPanel);
      return fromPanel;
    }
    return null;
  }

  function blueMarkersExist() {
    return !!document.querySelector('.relphi-canonical-marker-host[data-sky="skyB"],.chart-wheel-placement-stick[data-sky="skyB"],.chart-wheel-placement-stick.current-sky,.chart-wheel-placement-stick.comparison');
  }

  function ensureBuilderState(a, b) {
    const state = read(sessionStorage, STATE_KEY) || {};
    let changed = false;
    if (usable(a) && !usable(state.skyA)) { state.skyA = a; changed = true; }
    if (usable(b) && !usable(state.skyB)) { state.skyB = b; changed = true; }
    if (usable(a)) {
      const desired = usable(b) ? 'completeBoth' : 'completeA';
      if (!/^calculate|^placements|^method|^name/i.test(String(state.step || '')) && state.step !== desired) {
        state.step = desired;
        changed = true;
      }
    }
    if (changed) write(sessionStorage, STATE_KEY, state);
  }

  function revealBuilder() {
    const root = document.getElementById('relphiSkyBuilderV4');
    if (!root) return;
    root.hidden = false;
    root.removeAttribute('hidden');
    root.classList.add('relphi-v4-external-open');
    const moveToBuilder = function () {
      root.scrollIntoView({
        block:'start',
        behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
      const heading = root.querySelector('h2');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll:true });
      }
    };
    requestAnimationFrame(function () { requestAnimationFrame(moveToBuilder); });
  }

  function openComparisonBuilder() {
    const native = document.querySelector('#relphiSkyBuilderV4 [data-action="add-comparison"]');
    if (native) {
      native.click();
      revealBuilder();
      return;
    }

    const state = read(sessionStorage, STATE_KEY) || {};
    state.step = 'nameB';
    state.editingSlot = 'skyB';
    state.pendingName = '';
    state.quickPurpose = '';
    write(sessionStorage, STATE_KEY, state);

    // The native builder owns rendering. Reload only as a last-resort recovery path.
    const url = new URL(location.href);
    url.searchParams.set('openSkyB', '1');
    location.replace(url.toString());
  }

  function addComparisonButton(workspace) {
    if (!workspace || workspace.querySelector('[data-relphi-add-comparison]')) return;
    if (recover('skyB')) return;
    const skyA = workspace.querySelector('[data-workspace-slot="skyA"]');
    if (!skyA) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.relphiAddComparison = 'true';
    button.className = 'relphi-workspace-add-comparison';
    button.textContent = 'Add a comparison sky';
    button.addEventListener('click', openComparisonBuilder);
    skyA.appendChild(button);
  }

  function ensureStyles() {
    if (document.getElementById('relphi-workspace-reconciliation-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-workspace-reconciliation-style';
    style.textContent = '.relphi-workspace-add-comparison{display:block;width:calc(100% - 32px);margin:0 16px 16px;padding:.7rem;border:1px solid var(--panel-accent,#dc1f18);border-radius:5px;background:#fff;color:var(--panel-accent,#dc1f18);font:inherit;font-weight:800;cursor:pointer}.relphi-v4-root.relphi-v4-external-open{scroll-margin-top:1rem}';
    document.head.appendChild(style);
  }

  function triggerWorkspaceRefresh() {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('relphi:extra-points-updated'));
  }

  function run() {
    queued = false;
    ensureStyles();
    const a = recover('skyA');
    let b = recover('skyB');

    // A blue comparison still visible means Sky B must not silently disappear from the workspace state.
    if (!b && blueMarkersExist()) {
      const state = read(sessionStorage, STATE_KEY);
      if (usable(state && state.skyB)) {
        b = state.skyB;
        write(localStorage, KEYS.skyB, b);
      }
    }

    ensureBuilderState(a, b);
    const workspace = document.getElementById('relphiSkyWorkspace');
    if (workspace) {
      const hasCard = !!workspace.querySelector('[data-workspace-slot="skyB"]');
      if (usable(b) !== hasCard) {
        triggerWorkspaceRefresh();
        return;
      }
      addComparisonButton(workspace);
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

    // Recovery for a reload initiated before the native builder was available.
    if (new URLSearchParams(location.search).get('openSkyB') === '1') {
      const tryOpen = function () {
        const native = document.querySelector('#relphiSkyBuilderV4 [data-action="add-comparison"]');
        if (!native) return setTimeout(tryOpen, 80);
        native.click();
        revealBuilder();
        const url = new URL(location.href);
        url.searchParams.delete('openSkyB');
        history.replaceState(null, '', url.toString());
      };
      tryOpen();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();