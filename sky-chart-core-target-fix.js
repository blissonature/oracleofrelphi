// Makes the core Sky Chart enter a two-sky mode before any Sky B editor action.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let intendedTarget = 'chart';
  let forcing = false;

  function byId(id) { return document.getElementById(id); }
  function fire(element, type) {
    if (element) element.dispatchEvent(new Event(type, { bubbles:true }));
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

  function belongsToSkyB(node) {
    if (!node || !node.closest) return false;
    return !!node.closest(
      '#skyWizardCompareStep, #skyWizardComparePanel, #skyWizardCompareEntryPanel, ' +
      '[data-sky-entry-kind="currentSky"], [data-sky-wizard-target="currentSky"]'
    );
  }

  function isSharedCommitControl(node) {
    if (!node || !node.closest) return false;
    return !!node.closest(
      '#skyCalcRun, #skyCalcAttach, .sky-paste-create-button, ' +
      '#skyCreatorForm button, [data-create-sky], [data-confirm-sky]'
    );
  }

  function guard(event) {
    if (belongsToSkyB(event.target)) forceTarget('currentSky');
    else if (isSharedCommitControl(event.target)) forceTarget(intendedTarget);
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
        if (intendedTarget === 'currentSky') forceTarget('currentSky');
      }
    }, true);

    new MutationObserver(function () {
      if (intendedTarget === 'currentSky') forceTarget('currentSky');
    }).observe(document.body, { childList:true, subtree:true });
  }

  window.RelphiSkyCoreTargetFix = {
    forceTarget:forceTarget,
    getIntendedTarget:function () { return intendedTarget; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
