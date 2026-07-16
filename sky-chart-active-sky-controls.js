// Controls named sky records separately from the temporary Sky A / Sky B workspace slots.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function fire(element, type) {
    if (element) element.dispatchEvent(new Event(type, { bubbles:true }));
  }

  function activeSlot() {
    const target = byId('skyCreatorTarget');
    return target && target.value === 'currentSky' ? 'Sky B' : 'Sky A';
  }

  function activeName() {
    const creatorName = byId('skyCreatorName')?.value.trim();
    const calcName = byId('skyCalcName')?.value.trim();
    const wizardName = byId('relphiSkyNameInput')?.value.trim();
    const completeHeading = byId('relphiSkyCompleteHeading')?.textContent || '';
    const headingName = completeHeading.match(/^(.*?)\s+is now\s+Sky [AB]$/i)?.[1]?.trim();
    return creatorName || calcName || wizardName || headingName || 'Untitled sky';
  }

  function showStage(id) {
    ['relphiSkyNameStage','relphiSkyMethodStage','relphiExistingStage','relphiCalculateStage','relphiSkyCompleteStage'].forEach(function (stageId) {
      const stage = byId(stageId);
      if (stage) stage.hidden = stageId !== id;
    });
    byId(id)?.scrollIntoView({ block:'start', behavior:'smooth' });
  }

  function refreshLabels() {
    const name = activeName();
    const slot = activeSlot();
    const save = byId('relphiSaveActiveSky');
    const edit = byId('relphiEditActiveSky');
    const clear = byId('relphiClearActiveSky');
    if (save) save.textContent = 'Save “' + name + '”';
    if (edit) edit.textContent = 'Edit “' + name + '”';
    if (clear) clear.textContent = 'Clear ' + slot;
  }

  function resetWizardForSlot(slot) {
    const nameInput = byId('relphiSkyNameInput');
    const eyebrow = byId('relphiSkyNameEyebrow');
    const heading = byId('relphiSkyNameHeading');
    if (nameInput) nameInput.value = '';
    if (slot === 'Sky B') {
      if (eyebrow) eyebrow.textContent = 'Comparison sky';
      if (heading) heading.textContent = 'Give the comparison sky an identity';
    } else {
      if (eyebrow) eyebrow.textContent = 'First sky';
      if (heading) heading.textContent = 'Give this sky an identity';
    }
    showStage('relphiSkyNameStage');
    nameInput?.focus();
  }

  function clearActiveSlot() {
    const slot = activeSlot();

    // This invokes the app's own active-slot clear action. It does not delete a saved record.
    byId('skyCreatorClear')?.click();

    ['skyCreatorName','skyCalcName','skyCreatorNotes','skyCreatorPaste'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = '';
      fire(field, 'input');
      fire(field, 'change');
    });

    const status = byId('relphiActiveSkyStatus');
    if (status) status.textContent = slot + ' cleared. Saved skies were not deleted.';
    resetWizardForSlot(slot);
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
        <button id="relphiSaveActiveSky" class="relphi-primary-action" type="button">Save named sky</button>
        <button id="relphiEditActiveSky" class="relphi-secondary-action" type="button">Edit named sky</button>
        <button id="relphiClearActiveSky" class="relphi-secondary-action" type="button">Clear active slot</button>
        <p id="relphiActiveSkyStatus" class="generated-note" aria-live="polite"></p>`;

      const comparison = byId('relphiAddComparison');
      const comparisonRow = comparison && comparison.parentElement;
      complete.insertBefore(actions, comparisonRow || null);
      refreshLabels();

      byId('relphiSaveActiveSky').addEventListener('click', function () {
        const name = activeName();
        const creatorName = byId('skyCreatorName');
        const calcName = byId('skyCalcName');
        if (creatorName) creatorName.value = name;
        if (calcName) calcName.value = name;

        const save = byId('skyCreatorSaveWizard');
        if (!save) {
          byId('relphiActiveSkyStatus').textContent = 'Save is unavailable for “' + name + '”.';
          return;
        }
        save.click();
        byId('relphiActiveSkyStatus').textContent = 'Saved “' + name + '”. It remains assigned to ' + activeSlot() + ' until you clear or replace that slot.';
      });

      byId('relphiEditActiveSky').addEventListener('click', function () {
        showStage('relphiSkyMethodStage');
      });

      byId('relphiClearActiveSky').addEventListener('click', clearActiveSlot);

      ['skyCreatorName','skyCalcName','relphiSkyNameInput','skyCreatorTarget'].forEach(function (id) {
        const element = byId(id);
        element?.addEventListener('input', refreshLabels);
        element?.addEventListener('change', refreshLabels);
      });
      new MutationObserver(refreshLabels).observe(complete, { childList:true, subtree:true, characterData:true });
    };
    wait();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
