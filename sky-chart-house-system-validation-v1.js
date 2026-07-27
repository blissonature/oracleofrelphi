// Refuses to present quadrant house systems as complete without persisted exact cusp arrays.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const DERIVED = new Set(['whole-sign','equal-house']);

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
  }

  function profile(payload) {
    return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
  }

  function hasPlacements(payload) {
    const value = payload && (payload.placements || payload);
    return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
  }

  function cuspArray(payload) {
    const p = profile(payload);
    const candidates = [p.houseCusps, p.cusps, payload && payload.houseCusps, payload && payload.cusps];
    return candidates.find(function (value) {
      return Array.isArray(value) && value.length >= 12 && value.slice(0,12).every(function (number) { return Number.isFinite(Number(number)); });
    }) || null;
  }

  function status(message) {
    const node = document.querySelector('#relphiHouseSystemFilter .relphi-house-system-status');
    if (node) node.textContent = message || '';
  }

  function validate(system) {
    if (!system || DERIVED.has(system)) return true;
    const missing = [];
    ['skyA','skyB'].forEach(function (slot) {
      const payload = read(KEYS[slot]);
      if (hasPlacements(payload) && !cuspArray(payload)) missing.push(slot === 'skyA' ? 'Sky A' : 'Sky B');
    });
    if (!missing.length) return true;
    status(missing.join(' and ') + ' did not return exact cusp data for this house system. The comparison wheel was not given invented or unchanged cusps.');
    return false;
  }

  function start() {
    window.addEventListener('relphi:house-system-changed', function (event) {
      validate(event.detail && event.detail.houseSystem);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();