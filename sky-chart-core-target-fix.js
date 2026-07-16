// Coordinates Sky A / Sky B assignment without rendering an empty comparison slot.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let intendedTarget = 'chart';
  let awaitingSkyB = false;

  function byId(id) { return document.getElementById(id); }

  function pendingTarget() {
    return document.body.dataset.relphiPendingSkyKind === 'currentSky' ? 'currentSky' : 'chart';
  }

  function hasPlacements(text) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,100}\d{1,2}°/i.test(String(text || ''));
  }

  function setTargetSilently(kind) {
    intendedTarget = kind === 'currentSky' ? 'currentSky' : 'chart';
    ['skyCreatorTarget', 'skyCalcTarget'].forEach(function (id) {
      const select = byId(id);
      if (select) select.value = intendedTarget;
    });
    const paste = byId('skyCreatorPaste');
    if (paste) paste.dataset.skyKind = intendedTarget;
  }

  function comparisonModeIsActive() {
    return Array.from(document.querySelectorAll('[data-sky-chart-mode]')).some(function (button) {
      return button.getAttribute('aria-pressed') === 'true' && button.dataset.skyChartMode !== 'single';
    });
  }

  function enableComparisonMode() {
    if (comparisonModeIsActive()) return;
    const mode = document.querySelector('[data-sky-chart-mode="compare"]') ||
      document.querySelector('[data-sky-chart-mode="synastry"]') ||
      document.querySelector('[data-sky-chart-mode="transit"]');
    mode?.click();
  }

  function completeSkyBWhenReady() {
    if (!awaitingSkyB) return;
    const output = byId('currentSkyOutput');
    if (!hasPlacements(output?.textContent || '')) return;

    awaitingSkyB = false;
    enableComparisonMode();
    output.hidden = false;
    output.removeAttribute('hidden');
    window.dispatchEvent(new Event('resize'));
  }

  function isSetupControl(node) {
    return !!node?.closest?.('#relphiAddComparison, #relphiSkyNameContinue, #relphiHereNow, #relphiChooseWhenWhere');
  }

  function isCommitControl(node) {
    return !!node?.closest?.(
      '#skyCalcRun, #skyCalcAttach, .sky-paste-create-button, ' +
      '#skyCreatorForm button, [data-create-sky], [data-confirm-sky]'
    );
  }

  function guard(event) {
    if (isSetupControl(event.target)) {
      // Keep the visible renderer on Sky A while Sky B is only being configured.
      if (pendingTarget() === 'currentSky') setTargetSilently('chart');
      return;
    }

    if (!isCommitControl(event.target)) return;
    const target = pendingTarget();
    setTargetSilently(target);
    awaitingSkyB = target === 'currentSky';
  }

  function install() {
    ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(function (type) {
      document.addEventListener(type, guard, true);
    });

    const output = byId('currentSkyOutput');
    if (output) {
      new MutationObserver(completeSkyBWhenReady).observe(output, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    const status = byId('skyCalcStatus');
    if (status) {
      new MutationObserver(completeSkyBWhenReady).observe(status, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  window.RelphiSkyCoreTargetFix = {
    forceTarget: setTargetSilently,
    getIntendedTarget: function () { return intendedTarget; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
