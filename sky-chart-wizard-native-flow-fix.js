// Keeps calculation and saved-sky loading inside the guided Wizard.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function fire(element, type) {
    if (element) element.dispatchEvent(new Event(type, { bubbles:true }));
  }

  function selectedSlot() {
    return byId('skyCreatorTarget')?.value === 'currentSky' ? 'Sky B' : 'Sky A';
  }

  function targetOutput() {
    return selectedSlot() === 'Sky B' ? byId('currentSkyOutput') : byId('chartOutput');
  }

  function hasPlacements(text) {
    return /(?:☉|Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|ASC|MC)[\s\S]{0,80}\d{1,2}°/i.test(String(text || ''));
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

  function setLoadedName(name) {
    ['relphiSkyNameInput','skyCreatorName','skyCalcName'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = name;
      fire(field, 'input');
      fire(field, 'change');
    });
  }

  function completeLoadedSky(name) {
    const slot = selectedSlot();
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
    setLoadedName(name);
    if (heading) heading.textContent = name + ' is now ' + slot;
    if (summary) summary.textContent = 'Loaded from your saved skies.';
    if (addComparison) addComparison.hidden = slot !== 'Sky A';
    showOnlyStage('relphiSkyCompleteStage');
    window.dispatchEvent(new Event('resize'));
    targetOutput()?.dispatchEvent(new Event('change', { bubbles:true }));
    byId('relphiSkyCompleteStage')?.scrollIntoView({ block:'start', behavior:'smooth' });
  }

  function waitForLoadedSky(name, beforeText) {
    const status = byId('relphiSavedSkyStatus');
    const started = Date.now();
    function check() {
      const output = targetOutput();
      const text = output?.textContent || '';
      const changed = text.trim() !== beforeText.trim();
      if (hasPlacements(text) && (changed || !beforeText.trim())) {
        completeLoadedSky(name);
        return;
      }
      if (Date.now() - started > 5000) {
        if (status) status.textContent = 'The saved record was selected, but its placements did not load into ' + selectedSlot() + '.';
        return;
      }
      window.setTimeout(check, 100);
    }
    check();
  }

  function loadSavedSky(value, name) {
    const core = byId('skyCreatorLibrary');
    if (!core || !value) return;
    const output = targetOutput();
    const beforeText = output?.textContent || '';
    setLoadedName(name);
    core.value = value;
    fire(core, 'input');
    fire(core, 'change');
    byId('skyCreatorLoad')?.click();
    waitForLoadedSky(name, beforeText);
  }

  function syncSavedOptions(core, picker) {
    const selected = picker.value;
    picker.innerHTML = '<option value="">Choose saved sky…</option>';
    Array.from(core.options).forEach(function (option) {
      if (!option.value) return;
      picker.appendChild(new Option(option.textContent, option.value));
    });
    if (Array.from(picker.options).some(function (option) { return option.value === selected; })) picker.value = selected;
  }

  function installSavedSkyPicker() {
    const stage = byId('relphiSkyNameStage');
    const core = byId('skyCreatorLibrary');
    if (!stage || !core || byId('relphiSavedSkyStart')) return;

    const box = document.createElement('div');
    box.id = 'relphiSavedSkyStart';
    box.className = 'sky-wizard-step-copy';
    box.innerHTML = `
      <p class="eyebrow">Saved skies</p>
      <h3>Load an existing sky</h3>
      <label for="relphiSavedSkySelect">Choose a saved sky</label>
      <select id="relphiSavedSkySelect"><option value="">Choose saved sky…</option></select>
      <button id="relphiLoadSavedSky" class="relphi-secondary-action" type="button">Load saved sky</button>
      <p id="relphiSavedSkyStatus" class="generated-note" aria-live="polite"></p>`;
    stage.insertBefore(box, stage.firstChild);

    const picker = byId('relphiSavedSkySelect');
    syncSavedOptions(core, picker);
    new MutationObserver(function () { syncSavedOptions(core, picker); }).observe(core, { childList:true });

    picker.addEventListener('change', function () {
      const option = picker.options[picker.selectedIndex];
      if (!picker.value || !option) return;
      setLoadedName(option.textContent.trim());
      byId('relphiSavedSkyStatus').textContent = '';
    });

    byId('relphiLoadSavedSky').addEventListener('click', function () {
      const option = picker.options[picker.selectedIndex];
      if (!picker.value || !option) {
        byId('relphiSavedSkyStatus').textContent = 'Choose a saved sky first.';
        return;
      }
      byId('relphiSavedSkyStatus').textContent = 'Loading ' + option.textContent.trim() + ' into ' + selectedSlot() + '…';
      loadSavedSky(picker.value, option.textContent.trim());
    });
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
      installSavedSkyPicker();
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
