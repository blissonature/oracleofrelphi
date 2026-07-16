// Adds explicit controls for the active sky without coupling them to saved-sky deletion.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function fire(element, type) {
    if (element) element.dispatchEvent(new Event(type, { bubbles:true }));
  }

  function showStage(id) {
    ['relphiSkyNameStage','relphiSkyMethodStage','relphiExistingStage','relphiCalculateStage','relphiSkyCompleteStage'].forEach(function (stageId) {
      const stage = byId(stageId);
      if (stage) stage.hidden = stageId !== id;
    });
    byId(id)?.scrollIntoView({ block:'start', behavior:'smooth' });
  }

  function clearActiveSky() {
    const target = byId('skyCreatorTarget');
    const kind = target && target.value === 'currentSky' ? 'currentSky' : 'chart';

    byId('skyCreatorClear')?.click();

    ['skyCreatorName','skyCalcName','skyCreatorNotes','skyCreatorPaste'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = '';
      fire(field, 'input');
      fire(field, 'change');
    });

    if (kind === 'chart') {
      const nameInput = byId('relphiSkyNameInput');
      if (nameInput) nameInput.value = '';
      const eyebrow = byId('relphiSkyNameEyebrow');
      const heading = byId('relphiSkyNameHeading');
      if (eyebrow) eyebrow.textContent = 'First sky';
      if (heading) heading.textContent = 'Give this sky an identity';
      showStage('relphiSkyNameStage');
      nameInput?.focus();
    }
  }

  function install() {
    const wait = function () {
      const complete = byId('relphiSkyCompleteStage');
      if (!complete) {
        window.setTimeout(wait, 50);
        return;
      }
      if (byId('relphiActiveSkyActions')) return;

      const actions = document.createElement('div');
      actions.id = 'relphiActiveSkyActions';
      actions.className = 'button-row';
      actions.innerHTML = `
        <button id="relphiSaveActiveSky" class="relphi-primary-action" type="button">Save Sky A</button>
        <button id="relphiEditActiveSky" class="relphi-secondary-action" type="button">Edit Sky A</button>
        <button id="relphiClearActiveSky" class="relphi-secondary-action" type="button">Clear Sky A</button>
        <p id="relphiActiveSkyStatus" class="generated-note" aria-live="polite"></p>`;

      const comparison = byId('relphiAddComparison');
      const comparisonRow = comparison && comparison.parentElement;
      complete.insertBefore(actions, comparisonRow || null);

      byId('relphiSaveActiveSky').addEventListener('click', function () {
        const save = byId('skyCreatorSaveWizard');
        if (!save) {
          byId('relphiActiveSkyStatus').textContent = 'Save is unavailable for this sky.';
          return;
        }
        save.click();
        byId('relphiActiveSkyStatus').textContent = 'Sky A saved.';
      });

      byId('relphiEditActiveSky').addEventListener('click', function () {
        showStage('relphiSkyMethodStage');
      });

      byId('relphiClearActiveSky').addEventListener('click', clearActiveSky);
    };
    wait();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
