// Makes Here and Now calculate immediately without exposing the manual calculator form.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function readyForCalculation() {
    return !!(
      byId('skyCalcDateTime')?.value &&
      byId('skyCalcLatitude')?.value &&
      byId('skyCalcLongitude')?.value
    );
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
    if (drawer) {
      drawer.open = false;
      drawer.hidden = true;
      drawer.setAttribute('hidden', '');
      drawer.style.removeProperty('display');
    }
  }

  function runHereNow() {
    window.RelphiSkyCoreTargetFix?.prepareCalculator?.();
    byId('skyCalcNow')?.click();
    byId('skyCalcGeo')?.click();
    hideManualCalculator();
    setProgress('Using your current time and location…');

    const started = Date.now();
    (function waitForLocation() {
      if (readyForCalculation()) {
        setProgress('Calculating Sky B…');
        window.RelphiSkyCoreTargetFix?.prepareCalculator?.();
        byId('skyCalcRun')?.click();
        return;
      }
      if (Date.now() - started > 12000) {
        setProgress('Current location could not be resolved. Choose a time and place instead.');
        return;
      }
      setTimeout(waitForLocation, 150);
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