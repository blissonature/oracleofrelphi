// Preserves Sky A while the legacy calculator produces a comparison sky.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let intendedTarget = 'chart';
  let awaitingSkyB = false;
  let skyASnapshot = null;

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
    select.value = target;
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

  function preserveSkyA() {
    const output = byId('chartOutput');
    if (!output || !hasPlacements(output.textContent || '')) return;
    skyASnapshot = {
      html: output.innerHTML,
      text: output.textContent,
      className: output.className,
      hidden: output.hidden
    };
  }

  function transferLegacyResultToSkyB() {
    if (!awaitingSkyB || !skyASnapshot) return false;
    const chart = byId('chartOutput');
    const current = byId('currentSkyOutput');
    if (!chart || !current) return false;

    const calculatedHtml = chart.innerHTML;
    const calculatedText = chart.textContent || '';
    const changed = calculatedHtml !== skyASnapshot.html;
    if (!changed || !hasPlacements(calculatedText)) return false;

    current.innerHTML = calculatedHtml;
    current.hidden = false;
    current.removeAttribute('hidden');

    chart.innerHTML = skyASnapshot.html;
    chart.className = skyASnapshot.className;
    chart.hidden = skyASnapshot.hidden;
    if (!skyASnapshot.hidden) chart.removeAttribute('hidden');

    return hasPlacements(current.textContent || '') && hasPlacements(chart.textContent || '');
  }

  function completeSkyBWhenReady() {
    if (!awaitingSkyB) return;
    const output = byId('currentSkyOutput');
    let ready = hasPlacements(output?.textContent || '');

    if (!ready) ready = transferLegacyResultToSkyB();
    if (!ready) return;

    awaitingSkyB = false;
    setVisibleTarget('currentSky');
    enableComparisonMode();
    output.hidden = false;
    output.removeAttribute('hidden');
    delete document.body.dataset.relphiPendingSkyKind;
    skyASnapshot = null;
    fire(output, 'input');
    fire(output, 'change');
    window.dispatchEvent(new Event('resize'));
  }

  function isComparisonStart(node) {
    return !!node?.closest?.('#relphiAddComparison, #relphiSkyNameContinue');
  }

  function isCalculatorSetup(node) {
    return !!node?.closest?.('#relphiHereNow, #relphiChooseWhenWhere');
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
    const target = pendingTarget();

    if (isComparisonStart(event.target)) {
      if (target === 'currentSky') {
        preserveSkyA();
        setSelect('skyCreatorTarget', 'chart', false);
        setSelect('skyCalcTarget', 'chart', false);
      }
      return;
    }

    if (isCalculatorSetup(event.target)) {
      if (target === 'currentSky') preserveSkyA();
      setSelect('skyCreatorTarget', 'chart', false);
      setCalculatorTarget(target);
      awaitingSkyB = target === 'currentSky';
      return;
    }

    if (isCalculatorRun(event.target)) {
      if (target === 'currentSky') preserveSkyA();
      setCalculatorTarget(target);
      awaitingSkyB = target === 'currentSky';
      return;
    }

    if (isCreatorCommit(event.target)) setVisibleTarget(target);
  }

  function install() {
    document.addEventListener('click', guard, true);

    ['chartOutput', 'currentSkyOutput', 'skyCalcStatus'].forEach(function (id) {
      const node = byId(id);
      if (!node) return;
      new MutationObserver(completeSkyBWhenReady).observe(node, {
        childList:true,
        subtree:true,
        characterData:true
      });
    });
  }

  window.RelphiSkyCoreTargetFix = {
    forceTarget: setVisibleTarget,
    prepareCalculator: setCalculatorTarget,
    getIntendedTarget: function () { return intendedTarget; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();