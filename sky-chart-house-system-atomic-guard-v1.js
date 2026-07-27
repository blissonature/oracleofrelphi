// Keeps house-system changes atomic so one sky cannot erase the other's house ring.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const SETTING_KEY = 'relphiSkyChartHouseSystemViewV1';
  let transaction = null;
  let restoring = false;

  function raw(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function read(key) {
    try { return JSON.parse(raw(key) || 'null'); } catch (_) { return null; }
  }

  function writeRaw(key, value) {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (_) {}
  }

  function placements(payload) {
    const value = payload && (payload.placements || payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function profile(payload) {
    return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
  }

  function hasTwelveCusps(payload) {
    const p = profile(payload);
    return [p.houseCusps, p.cusps, payload && payload.houseCusps, payload && payload.cusps].some(function (candidate) {
      return Array.isArray(candidate) && candidate.length >= 12 && candidate.slice(0, 12).every(function (value) {
        return Number.isFinite(Number(value));
      });
    });
  }

  function validForSystem(payload, system) {
    if (!payload || !Object.keys(placements(payload)).length) return true;
    if (/^(whole-sign|equal-house)$/.test(system)) return true;
    return hasTwelveCusps(payload);
  }

  function snapshot() {
    transaction = {
      skyA:raw(SLOT_KEYS.skyA),
      skyB:raw(SLOT_KEYS.skyB),
      setting:raw(SETTING_KEY),
      started:Date.now()
    };
  }

  function reloadSavedSkies() {
    document.getElementById('loadChart')?.click();
    if (read(SLOT_KEYS.skyB)) document.getElementById('loadCurrentSky')?.click();
    window.RelphiCanonicalSkyWheel?.render?.();
    window.dispatchEvent(new Event('relphi:extra-points-updated'));
  }

  function rollback(reason) {
    if (!transaction || restoring) return;
    restoring = true;
    writeRaw(SLOT_KEYS.skyA, transaction.skyA);
    writeRaw(SLOT_KEYS.skyB, transaction.skyB);
    writeRaw(SETTING_KEY, transaction.setting);
    reloadSavedSkies();
    const fieldset = document.getElementById('relphiHouseSystemFilter');
    const prior = transaction.setting || profile(read(SLOT_KEYS.skyA)).houseSystem || 'whole-sign';
    fieldset?.querySelectorAll('input[type="radio"]').forEach(function (input) { input.checked = input.value === prior; });
    const status = fieldset?.querySelector('.relphi-house-system-status');
    if (status) status.textContent = reason || 'The prior house rings were restored.';
    setTimeout(function () { if (status) status.textContent = ''; }, 2600);
    transaction = null;
    setTimeout(function () { restoring = false; }, 300);
  }

  function validateCompleted(event) {
    if (!transaction || restoring) return;
    const system = event.detail && event.detail.houseSystem || raw(SETTING_KEY) || '';
    setTimeout(function () {
      const a = read(SLOT_KEYS.skyA);
      const b = read(SLOT_KEYS.skyB);
      if (!validForSystem(a, system) || !validForSystem(b, system)) {
        rollback('That house system did not return complete cusps for both skies. The previous houses were restored.');
        return;
      }
      transaction = null;
    }, 350);
  }

  function watchStatus() {
    const status = document.getElementById('skyCalcStatus');
    if (!status) return;
    new MutationObserver(function () {
      if (!transaction || restoring) return;
      const text = String(status.textContent || '').trim();
      if (/^(Could not|Enter |Choose |No location|Location search failed|Date |Time zone)/i.test(text)) rollback(text);
    }).observe(status, { childList:true, subtree:true, characterData:true });
  }

  function start() {
    document.addEventListener('change', function (event) {
      if (restoring) return;
      const input = event.target && event.target.closest && event.target.closest('#relphiHouseSystemFilter input[type="radio"]');
      if (input) snapshot();
    }, true);
    window.addEventListener('relphi:house-system-changed', validateCompleted);
    watchStatus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();