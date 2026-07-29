// Prevent the My birth chart flow from inheriting Planetary Hours or another sky's moment.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const FIELD_IDS = ['skyCalcDateTime','skyCalcTimeZone','skyCalcLocation','skyCalcLatitude','skyCalcLongitude'];
  let birthFlowPending = false;

  function fire(node, type) {
    if (node) node.dispatchEvent(new Event(type, { bubbles:true }));
  }

  function clearBirthMoment() {
    const root = document.getElementById('relphiSkyBuilderV4');
    const calculator = document.querySelector('.sky-calc-drawer');
    if (!birthFlowPending || !root || !calculator || !calculator.open) return false;

    const state = (function () {
      try { return JSON.parse(sessionStorage.getItem('relphiSkyBuilderV4State') || 'null'); }
      catch (_) { return null; }
    })();
    if (!state || state.quickPurpose !== 'birth') {
      birthFlowPending = false;
      return false;
    }

    const nativeKind = state.editingSlot === 'skyB' ? 'currentSky' : 'chart';
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const field = document.getElementById(id);
      if (field && field.value !== nativeKind) {
        field.value = nativeKind;
        fire(field, 'change');
      }
    });

    const usePlanetaryHours = document.getElementById('skyCalcUsePlanetaryHours');
    if (usePlanetaryHours && usePlanetaryHours.checked) {
      usePlanetaryHours.checked = false;
      fire(usePlanetaryHours, 'change');
    }

    FIELD_IDS.forEach(function (id) {
      const field = document.getElementById(id);
      if (!field) return;
      field.value = '';
      fire(field, 'input');
      fire(field, 'change');
    });

    const name = document.getElementById('skyCalcName');
    if (name) name.value = 'My birth chart';
    document.getElementById('skyCalcDateTime')?.focus();
    birthFlowPending = false;
    return true;
  }

  function scheduleClear() {
    requestAnimationFrame(function () {
      if (clearBirthMoment()) return;
      setTimeout(clearBirthMoment, 60);
      setTimeout(clearBirthMoment, 180);
    });
  }

  document.addEventListener('click', function (event) {
    if (!event.target.closest('[data-action="quick-birth"]')) return;
    birthFlowPending = true;
    scheduleClear();
  }, true);

  const chart = document.getElementById('chartPanel');
  if (chart) new MutationObserver(function () {
    if (birthFlowPending) scheduleClear();
  }).observe(chart, { childList:true, subtree:true });
})();