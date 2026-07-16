// Coordinates Sky A / Sky B assignment without rendering an empty comparison slot.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let intendedTarget = 'chart';
  let awaitingSkyB = false;

  function byId(id) { return document.getElementById(id); }
  function fire(element, type) {
    if (element) element.dispatchEvent(new Event(type, { bubbles:true }));
  }

  function pendingTarget() {
    return document.body.dataset.relphiPendingSkyKind === 'currentSky' ? 'currentSky' : 'chart';
  }

  function hasPlacements(text) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,100}\d{1,2}°/i.test(String(text || ''));
  }

  function setSelect(id, kind, notify) {
    const select = byId(id);
    if (!select) return;
    const target = kind === 'currentSky' ? 'currentSky' : 'chart';
    if (select.value !== target) select.value = target;
    if (notify) {
      fire(select, 'input');
      fire(select, 'change');
    }
  }

  function setCalculatorTarget(kind) {
    intendedTarget = kind === 'currentSky' ? 'currentSky' : 'chart';
    setSelect('skyCalcTarget', intendedTarget, true);
  }

  function setVisibleTarget(kind) {
    intendedTarget = kind === 'currentSky' ? 'currentSky' : 'chart';
    setSelect('skyCreatorTarget', intendedTarget, true);
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
    setVisibleTarget('currentSky');
    enableComparisonMode();
    output.hidden = false;
    output.removeAttribute('hidden');
    delete document.body.dataset.relphiPendingSkyKind;
    window.dispatchEvent(new Event('resize'));
  }

  function isSetupControl(node) {
    return !!node?.closest?.('#relphiAddComparison, #relphiSkyNameContinue, #relphiHereNow, #relphiChooseWhenWhere');
  }

  function isCalculatorRun(node) {
    return !!node?.closest?.('#skyCalcRun');
  }

  function isCreatorCommit(node) {
    return !!node?.closest?.(
      '#skyCalcAttach, .sky-paste-create-button, #skyCreatorForm button, ' +
      '[data-create-sky], [data-confirm-sky]'
    );
  }

  function guard(event) {
    if (isSetupControl(event.target)) {
      if (pendingTarget() === 'currentSky') {
        setSelect('skyCreatorTarget', 'chart', false);
        setSelect('skyCalcTarget', 'chart', false);
      }
      return;
    }

    const target = pendingTarget();
    if (isCalculatorRun(event.target)) {
      // Tell the calculator to write Sky B without waking the visible Sky B renderer.
      setCalculatorTarget(target);
      awaitingSkyB = target === 'currentSky';
      return;
    }

    if (isCreatorCommit(event.target)) {
      setVisibleTarget(target);
    }
  }

  function install() {
    document.addEventListener('click', guard, true);

    const output = byId('currentSkyOutput');
    if (output) {
      new MutationObserver(completeSkyBWhenReady).observe(output, {
        childList:true,
        subtree:true,
        characterData:true
      });
    }

    const status = byId('skyCalcStatus');
    if (status) {
      new MutationObserver(completeSkyBWhenReady).observe(status, {
        childList:true,
        subtree:true,
        characterData:true
      });
    }
  }

  window.RelphiSkyCoreTargetFix = {
    forceTarget: setVisibleTarget,
    getIntendedTarget: function () { return intendedTarget; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();