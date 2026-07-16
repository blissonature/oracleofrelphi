// Coordinates the core target only at real placement-creation boundaries.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let intendedTarget = 'chart';
  let forcing = false;

  function byId(id) { return document.getElementById(id); }
  function fire(element, type) {
    if (element) element.dispatchEvent(new Event(type, { bubbles:true }));
  }

  function pendingTarget() {
    return document.body.dataset.relphiPendingSkyKind === 'currentSky' ? 'currentSky' : 'chart';
  }

  function comparisonModeIsActive() {
    return Array.from(document.querySelectorAll('[data-sky-chart-mode]')).some(function (button) {
      return button.getAttribute('aria-pressed') === 'true' && button.dataset.skyChartMode !== 'single';
    });
  }

  function ensureComparisonMode() {
    if (comparisonModeIsActive()) return;
    const mode = document.querySelector('[data-sky-chart-mode="compare"]') ||
      document.querySelector('[data-sky-chart-mode="synastry"]') ||
      document.querySelector('[data-sky-chart-mode="transit"]');
    if (mode) mode.click();
  }

  function forceTarget(kind) {
    intendedTarget = kind === 'currentSky' ? 'currentSky' : 'chart';
    if (forcing) return;
    forcing = true;
    try {
      if (intendedTarget === 'currentSky') ensureComparisonMode();
      ['skyCreatorTarget', 'skyCalcTarget'].forEach(function (id) {
        const select = byId(id);
        if (!select || select.value === intendedTarget) return;
        select.value = intendedTarget;
        fire(select, 'input');
        fire(select, 'change');
      });
      const paste = byId('skyCreatorPaste');
      if (paste) paste.dataset.skyKind = intendedTarget;
    } finally {
      forcing = false;
    }
  }

  function isSetupControl(node) {
    return !!node?.closest?.('#relphiAddComparison, #relphiSkyNameContinue, #relphiHereNow, #relphiChooseWhenWhere');
  }

  function isSharedCommitControl(node) {
    return !!node?.closest?.(
      '#skyCalcRun, #skyCalcAttach, .sky-paste-create-button, ' +
      '#skyCreatorForm button, [data-create-sky], [data-confirm-sky]'
    );
  }

  function guard(event) {
    if (isSetupControl(event.target)) {
      // Naming and configuring Sky B must leave the completed Sky A renderer active.
      if (pendingTarget() === 'currentSky') forceTarget('chart');
      return;
    }
    if (isSharedCommitControl(event.target)) {
      // Commit the pending slot only when placements are about to be created.
      forceTarget(pendingTarget());
    }
  }

  function install() {
    document.addEventListener('pointerdown', guard, true);
    document.addEventListener('mousedown', guard, true);
    document.addEventListener('touchstart', guard, true);
    document.addEventListener('click', guard, true);
    document.addEventListener('focusin', guard, true);

    document.addEventListener('change', function (event) {
      if (forcing) return;
      if (event.target === byId('skyCreatorTarget') || event.target === byId('skyCalcTarget')) {
        intendedTarget = event.target.value === 'currentSky' ? 'currentSky' : 'chart';
      }
    }, true);

    new MutationObserver(function () {
      // Do not reassert Sky B while the Wizard is still naming or configuring it.
      if (intendedTarget === 'currentSky' && pendingTarget() !== 'currentSky') forceTarget('currentSky');
    }).observe(document.body, { childList:true, subtree:true });
  }

  window.RelphiSkyCoreTargetFix = {
    forceTarget: forceTarget,
    getIntendedTarget: function () { return intendedTarget; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
