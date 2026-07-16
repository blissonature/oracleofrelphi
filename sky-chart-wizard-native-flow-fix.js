// Keeps calculation and saved-sky loading inside the guided Wizard.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function fire(element, type) {
    if (element) element.dispatchEvent(new Event(type, { bubbles:true }));
  }

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

  function showOnlyStage(id) {
    ['relphiSkyNameStage','relphiSkyMethodStage','relphiExistingStage','relphiCalculateStage','relphiSkyCompleteStage'].forEach(function (stageId) {
      const stage = byId(stageId);
      if (stage) stage.hidden = stageId !== id;
    });
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

  function completeLoadedSky(name) {
    const heading = byId('relphiSkyCompleteHeading');
    const summary = byId('relphiSkyCompleteSummary');
    const addComparison = byId('relphiAddComparison');
    const drawer = byId('skyCreatorDrawer');

    if (drawer) {
      drawer.open = false;
      drawer.hidden = true;
      drawer.setAttribute('hidden', '');
      drawer.style.removeProperty('display');
    }
    keepWizardMode();
    if (heading) heading.textContent = name + ' is now Sky A';
    if (summary) summary.textContent = 'Loaded from your saved skies.';
    if (addComparison) addComparison.hidden = false;
    showOnlyStage('relphiSkyCompleteStage');
    byId('relphiSkyCompleteStage')?.scrollIntoView({ block:'start', behavior:'smooth' });
  }

  function loadSavedSky(value, name) {
    const core = byId('skyCreatorLibrary');
    if (!core || !value) return;
    core.value = value;
    fire(core, 'input');
    fire(core, 'change');
    byId('skyCreatorLoad')?.click();

    window.setTimeout(function () {
      const paste = byId('skyCreatorPaste');
      const output = byId('chartOutput');
      const hasPlacements = !!(paste && paste.value.trim()) || !!(output && output.textContent.trim());
      if (hasPlacements) completeLoadedSky(name);
      else {
        const status = byId('relphiSavedSkyStatus');
        if (status) status.textContent = 'That saved sky did not load. The saved record may be incomplete.';
      }
    }, 450);
  }

  function installSavedSkyPicker() {
    const stage = byId('relphiSkyNameStage');
    const core = byId('skyCreatorLibrary');
    if (!stage || !core || byId('relphiSavedSkyStart')) return;

    const box = document.createElement('div');
    box.id = 'relphiSavedSkyStart';
    box.className = 'sky-wizard-step-copy';
    box.innerHTML = `
      <p class="eyebrow">Already saved?</p>
      <h3>Load an existing sky</h3>
      <label for="relphiSavedSkySelect">Choose a saved sky</label>
      <select id="relphiSavedSkySelect"><option value="">Choose saved sky…</option></select>
      <button id="relphiLoadSavedSky" class="relphi-secondary-action" type="button">Load saved sky</button>
      <p id="relphiSavedSkyStatus" class="generated-note" aria-live="polite"></p>`;
    stage.appendChild(box);

    const picker = byId('relphiSavedSkySelect');
    Array.from(core.options).forEach(function (option) {
      if (!option.value) return;
      picker.appendChild(new Option(option.textContent, option.value));
    });

    byId('relphiLoadSavedSky').addEventListener('click', function () {
      const option = picker.options[picker.selectedIndex];
      if (!picker.value) {
        byId('relphiSavedSkyStatus').textContent = 'Choose a saved sky first.';
        return;
      }
      loadSavedSky(picker.value, option.textContent.trim());
    });
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
      installSavedSkyPicker();
      document.addEventListener('click', interceptWizardChoices, true);
      const savedChoice = byId('relphiSavedSky');
      if (savedChoice) savedChoice.hidden = true;
    };
    waitForWizard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
