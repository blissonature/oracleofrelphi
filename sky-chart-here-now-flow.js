// Makes Here and Now calculate immediately without exposing the manual calculator form.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function readyForCalculation() {
    return !!(byId('skyCalcDateTime')?.value && byId('skyCalcLatitude')?.value && byId('skyCalcLongitude')?.value);
  }
  function setProgress(message) {
    let note = byId('relphiHereNowProgress');
    const stage = byId('relphiCalculateStage');
    if (!stage) return;
    if (!note) {
      note = document.createElement('p');
      note.id = 'relphiHereNowProgress';
      note.className = 'generated-note';
      note.setAttribute('aria-live', 'polite');
      stage.appendChild(note);
    }
    note.textContent = message;
  }
  function hideManualCalculator() {
    const drawer = byId('skyCreatorDrawer');
    const calculator = document.querySelector('.sky-calc-drawer');
    [calculator, drawer].forEach(function (node) {
      if (!node) return;
      node.open = false;
      node.hidden = true;
      node.setAttribute('hidden', '');
      node.style.removeProperty('display');
    });
    document.body.dataset.skyBuilderUi = 'wizard';
  }
  function runHereNow() {
    window.RelphiSkyWorkspace?.prepareCalculation?.();
    hideManualCalculator();
    setProgress('Using your current time and location…');
    byId('skyCalcNow')?.click();
    byId('skyCalcGeo')?.click();

    const started = Date.now();
    (function waitForLocation() {
      hideManualCalculator();
      if (readyForCalculation()) {
        setProgress('Calculating the comparison sky…');
        window.RelphiSkyWorkspace?.prepareCalculation?.();
        byId('skyCalcRun')?.click();
        return;
      }
      if (Date.now() - started > 12000) {
        setProgress('Current location could not be resolved. Choose a time and place instead.');
        return;
      }
      setTimeout(waitForLocation, 120);
    })();
  }
  function install() {
    document.addEventListener('click', function (event) {
      const button = event.target.closest?.('#relphiHereNow');
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      runHereNow();
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();