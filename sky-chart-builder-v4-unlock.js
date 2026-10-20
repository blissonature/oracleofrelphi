// Allows the promoted Sky Builder V4 to initialize on the ordinary Sky Chart URL.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let cleanupQueued = false;

  function simplifyCalculatorActions() {
    cleanupQueued = false;
    const calculator = document.querySelector('.sky-calc-drawer');
    if (!calculator) return;

    document.getElementById('skyCalcUsePlanetaryHours')?.closest('label')?.remove();
    document.getElementById('skyCalcSeed')?.remove();
    document.getElementById('skyCalcAttach')?.remove();

    const infer = document.getElementById('skyCalcReverseSolve');
    const runBox = calculator.querySelector('.sky-calc-run-box');
    if (infer && runBox && infer.parentElement !== runBox) {
      infer.classList.add('relphi-secondary-action');
      runBox.insertBefore(infer, runBox.firstChild);
    }

    const sharedActions = calculator.querySelector('.sky-calc-shared-actions');
    if (sharedActions && !sharedActions.children.length) sharedActions.remove();
  }

  function scheduleCleanup() {
    if (cleanupQueued) return;
    cleanupQueued = true;
    requestAnimationFrame(simplifyCalculatorActions);
  }

  function installCleanup() {
    simplifyCalculatorActions();
    new MutationObserver(scheduleCleanup).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', simplifyCalculatorActions);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installCleanup, { once:true });
  else installCleanup();

  if (new URLSearchParams(location.search).get('preview') === 'pr55') return;

  const original = location.href;
  const url = new URL(original);
  url.searchParams.set('preview', 'pr55');
  history.replaceState(history.state, '', url.toString());

  window.addEventListener('relphi:sky-builder-v4-loaded', function restoreUrl() {
    history.replaceState(history.state, '', original);
  }, { once:true });

  window.setTimeout(function () {
    if (location.href !== original) history.replaceState(history.state, '', original);
  }, 10000);
})();