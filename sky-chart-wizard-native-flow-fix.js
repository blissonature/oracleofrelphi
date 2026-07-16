// Keeps calculation inside the guided Wizard without injecting a second saved-sky UI.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }

  function keepWizardMode() {
    const wizard = byId('skyBuilderWizardMode');
    const advanced = byId('skyBuilderAdvancedMode');
    if (wizard) {
      wizard.classList.add('is-active');
      wizard.setAttribute('aria-pressed', 'true');
    }
    if (advanced) {
      advanced.classList.remove('is-active');
      advanced.setAttribute('aria-pressed', 'false');
    }
    document.body.dataset.skyBuilderUi = 'wizard';
  }

  function moveCalculatorIntoWizard() {
    const stage = byId('relphiCalculateStage');
    const calculator = document.querySelector('.sky-calc-drawer');
    if (!stage || !calculator) return null;

    let mount = byId('relphiWizardCalculatorMount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'relphiWizardCalculatorMount';
      stage.insertBefore(mount, stage.lastElementChild);
    }

    if (calculator.parentElement !== mount) mount.appendChild(calculator);
    calculator.hidden = false;
    calculator.removeAttribute('hidden');
    calculator.style.setProperty('display', 'block', 'important');
    calculator.open = true;
    keepWizardMode();
    return calculator;
  }

  function loadActiveSkyControls() {
    if (document.querySelector('script[src^="sky-chart-active-sky-controls.js"]')) return;
    const script = document.createElement('script');
    script.src = 'sky-chart-active-sky-controls.js?v=2';
    document.body.appendChild(script);
  }

  function interceptWizardChoices(event) {
    const hereNow = event.target.closest && event.target.closest('#relphiHereNow');
    const choose = event.target.closest && event.target.closest('#relphiChooseWhenWhere');
    if (!hereNow && !choose) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    moveCalculatorIntoWizard();

    if (hereNow) {
      byId('skyCalcNow')?.click();
      byId('skyCalcGeo')?.click();
      byId('skyCalcRun')?.scrollIntoView({ block:'center', behavior:'smooth' });
    } else {
      const field = byId('skyCalcDateTime');
      field?.scrollIntoView({ block:'center', behavior:'smooth' });
      field?.focus();
    }
  }

  function install() {
    const waitForWizard = function () {
      if (!byId('relphiSkyWizard')) {
        window.setTimeout(waitForWizard, 50);
        return;
      }
      byId('relphiSavedSkyStart')?.remove();
      loadActiveSkyControls();
      document.addEventListener('click', interceptWizardChoices, true);
      const savedChoice = byId('relphiSavedSky');
      if (savedChoice) savedChoice.hidden = true;
    };
    waitForWizard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
