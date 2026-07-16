// Naming-first progressive Sky Wizard.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function show(element) { if (element) element.hidden = false; }
  function hide(element) { if (element) element.hidden = true; }
  function fire(element, type) { if (element) element.dispatchEvent(new Event(type, { bubbles:true })); }

  function openAdvanced() {
    const drawer = byId('skyCreatorDrawer');
    if (drawer) drawer.open = true;
  }

  function openCalculator() {
    openAdvanced();
    const drawer = document.querySelector('.sky-calc-drawer');
    if (drawer) drawer.open = true;
  }

  function install() {
    const chartPanel = byId('chartPanel');
    const advanced = byId('skyCreatorDrawer');
    if (!chartPanel || !advanced || byId('relphiSkyWizard')) return;

    const wizard = document.createElement('section');
    wizard.id = 'relphiSkyWizard';
    wizard.className = 'sky-wizard-shell';
    wizard.setAttribute('data-relphi-wizard-v2', '');
    wizard.setAttribute('aria-label', 'Guided Sky Creator');
    wizard.innerHTML = `
      <div id="relphiSkyNameStage" class="sky-wizard-step">
        <div class="sky-wizard-step-copy">
          <p class="eyebrow">First sky</p>
          <h3>Give this sky an identity</h3>
          <p>Name the sky before choosing how to create it.</p>
        </div>
        <label class="sky-creator-name-label" for="relphiSkyNameInput">What will you call this sky?</label>
        <input id="relphiSkyNameInput" type="text" autocomplete="off" placeholder="Sky name">
        <p id="relphiSkyNameError" class="generated-note" aria-live="polite"></p>
        <div class="button-row"><button id="relphiSkyNameContinue" class="relphi-primary-action" type="button">Continue</button></div>
      </div>

      <div id="relphiSkyMethodStage" class="sky-wizard-step" hidden>
        <div class="sky-wizard-step-copy">
          <p class="eyebrow">Create the sky</p>
          <h3 id="relphiSkyMethodHeading">How will you create this sky?</h3>
        </div>
        <div class="sky-wizard-entry-card">
          <button id="relphiUseExisting" class="sky-wizard-action" type="button"><span>Use existing sky data</span><small>Type, paste, build, or open saved placements.</small></button>
          <button id="relphiCalculateSky" class="sky-wizard-action" type="button"><span>Calculate a sky</span><small>Calculate from a time and place.</small></button>
        </div>
        <button id="relphiBackToName" class="relphi-secondary-action" type="button">Back</button>
      </div>

      <div id="relphiExistingStage" class="sky-wizard-step" hidden>
        <div class="sky-wizard-step-copy"><p class="eyebrow">Existing data</p><h3>How will you enter the placements?</h3></div>
        <div class="sky-wizard-entry-card">
          <button id="relphiTypePaste" class="sky-wizard-action" type="button"><span>Type or paste</span><small>Enter copied placement text.</small></button>
          <button id="relphiFormEntry" class="sky-wizard-action" type="button"><span>Form-field entry</span><small>Build placements one field at a time.</small></button>
          <button id="relphiSavedSky" class="sky-wizard-action" type="button"><span>Use stored sky</span><small>Open a sky you previously saved.</small></button>
        </div>
        <button id="relphiBackToMethodFromExisting" class="relphi-secondary-action" type="button">Back</button>
      </div>

      <div id="relphiCalculateStage" class="sky-wizard-step" hidden>
        <div class="sky-wizard-step-copy"><p class="eyebrow">Calculate</p><h3>Choose the time and place</h3></div>
        <div class="sky-wizard-entry-card">
          <button id="relphiHereNow" class="sky-wizard-action" type="button"><span>Here and Now</span><small>Use the current time and your present location.</small></button>
          <button id="relphiChooseWhenWhere" class="sky-wizard-action" type="button"><span>Choose a time and place</span><small>Enter another date, time, and location.</small></button>
        </div>
        <button id="relphiBackToMethodFromCalculate" class="relphi-secondary-action" type="button">Back</button>
      </div>`;

    chartPanel.insertBefore(wizard, advanced);
    advanced.hidden = true;

    const stages = ['relphiSkyNameStage','relphiSkyMethodStage','relphiExistingStage','relphiCalculateStage'];
    function go(id) {
      stages.forEach(function (stageId) { const stage = byId(stageId); if (stage) stage.hidden = stageId !== id; });
      wizard.scrollIntoView({ block:'start', behavior:'smooth' });
    }

    byId('relphiSkyNameContinue').addEventListener('click', function () {
      const input = byId('relphiSkyNameInput');
      const name = input.value.trim();
      if (!name) {
        byId('relphiSkyNameError').textContent = 'Name this sky before continuing.';
        input.focus();
        return;
      }
      byId('relphiSkyNameError').textContent = '';
      const creatorName = byId('skyCreatorName');
      const calcName = byId('skyCalcName');
      if (creatorName) { creatorName.value = name; fire(creatorName, 'input'); fire(creatorName, 'change'); }
      if (calcName) { calcName.value = name; fire(calcName, 'input'); fire(calcName, 'change'); }
      byId('relphiSkyMethodHeading').textContent = 'How will you create “' + name + '”?';
      go('relphiSkyMethodStage');
    });

    byId('relphiBackToName').addEventListener('click', function () { go('relphiSkyNameStage'); });
    byId('relphiUseExisting').addEventListener('click', function () { go('relphiExistingStage'); });
    byId('relphiCalculateSky').addEventListener('click', function () { go('relphiCalculateStage'); });
    byId('relphiBackToMethodFromExisting').addEventListener('click', function () { go('relphiSkyMethodStage'); });
    byId('relphiBackToMethodFromCalculate').addEventListener('click', function () { go('relphiSkyMethodStage'); });

    byId('relphiTypePaste').addEventListener('click', function () {
      advanced.hidden = false; openAdvanced();
      const field = byId('skyCreatorPaste'); if (field) { field.scrollIntoView({ block:'center' }); field.focus(); }
    });
    byId('relphiFormEntry').addEventListener('click', function () {
      advanced.hidden = false; openAdvanced();
      const form = byId('skyCreatorForm'); if (form) { form.scrollIntoView({ block:'center' }); form.querySelector('input,select,button')?.focus(); }
    });
    byId('relphiSavedSky').addEventListener('click', function () {
      advanced.hidden = false; openAdvanced();
      const load = byId('skyCreatorLoad'); if (load) load.click();
      else byId('skyCreatorName')?.focus();
    });
    byId('relphiHereNow').addEventListener('click', function () {
      advanced.hidden = false; openCalculator();
      byId('skyCalcNow')?.click();
      byId('skyCalcGeo')?.click();
      byId('skyCalcRun')?.scrollIntoView({ block:'center' });
    });
    byId('relphiChooseWhenWhere').addEventListener('click', function () {
      advanced.hidden = false; openCalculator();
      const field = byId('skyCalcDateTime'); if (field) { field.scrollIntoView({ block:'center' }); field.focus(); }
    });

    byId('relphiSkyNameInput').focus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
