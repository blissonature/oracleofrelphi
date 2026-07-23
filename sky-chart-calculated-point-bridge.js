// Bridges the existing calculated-point formulas into the canonical Sky Chart body registry for both Sky A and Sky B.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = ['relphiSkyChartA', 'relphiSkyChartB'];
  const CANONICAL = {
    node:'North Node', northnode:'North Node', truenode:'North Node', meannode:'North Node',
    southnode:'South Node', descendingnode:'South Node',
    lilith:'Lilith', blackmoon:'Lilith', blackmoonlilith:'Lilith', meanlilith:'Lilith',
    chiron:'Chiron', vertex:'Vertex', vx:'Vertex',
    fortune:'Part of Fortune', partoffortune:'Part of Fortune', lotoffortune:'Part of Fortune', parsfortunae:'Part of Fortune', pof:'Part of Fortune'
  };

  function normalizeKey(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function canonicalLabel(value) {
    return CANONICAL[normalizeKey(value)] || String(value || '').trim();
  }

  function normalizePlacements(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { payload:payload, changed:false };
    const source = payload.placements && typeof payload.placements === 'object' ? payload.placements : payload;
    const next = {};
    let changed = false;
    Object.entries(source).forEach(function (entry) {
      const oldKey = entry[0];
      const newKey = canonicalLabel(oldKey);
      if (newKey !== oldKey) changed = true;
      next[newKey] = entry[1];
    });
    if (!changed) return { payload:payload, changed:false };
    if (payload.placements && typeof payload.placements === 'object') {
      return { payload:Object.assign({}, payload, { placements:next }), changed:true };
    }
    return { payload:next, changed:true };
  }

  function normalizeSlot(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const result = normalizePlacements(parsed);
      if (!result.changed) return false;
      localStorage.setItem(key, JSON.stringify(result.payload));
      return true;
    } catch (_) {
      return false;
    }
  }

  function normalizeLibrary() {
    try {
      const key = 'relphiSkyLibraryV1';
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return false;
      let changed = false;
      const next = list.map(function (record) {
        const result = normalizePlacements(record);
        changed = changed || result.changed;
        return result.payload;
      });
      if (changed) localStorage.setItem(key, JSON.stringify(next));
      return changed;
    } catch (_) {
      return false;
    }
  }

  function normalizeSelectOptions(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('option').forEach(function (option) {
      const source = option.value || option.textContent;
      const key = normalizeKey(source);
      if (!CANONICAL[key]) return;
      option.value = CANONICAL[key];
      option.textContent = CANONICAL[key];
    });
  }

  function refreshBothSkies() {
    const changedA = normalizeSlot(SLOT_KEYS[0]);
    const changedB = normalizeSlot(SLOT_KEYS[1]);
    const changedLibrary = normalizeLibrary();
    normalizeSelectOptions(document);
    if (changedA) document.getElementById('loadChart')?.click();
    if (changedB) document.getElementById('loadCurrentSky')?.click();
    if (changedA || changedB || changedLibrary) {
      window.RelphiCanonicalSkyGlyphs?.refresh?.();
      window.dispatchEvent(new CustomEvent('relphi:calculated-points-normalized', {
        detail:{ skyA:changedA, skyB:changedB, library:changedLibrary }
      }));
    }
  }

  function start() {
    refreshBothSkies();
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        normalizeSelectOptions(document);
        SLOT_KEYS.forEach(normalizeSlot);
      });
    }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('storage', refreshBothSkies);
    window.addEventListener('relphi:sky-builder-v4-loaded', refreshBothSkies);
    window.RelphiCalculatedPointBridge = { refresh:refreshBothSkies, canonicalLabel:canonicalLabel };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
