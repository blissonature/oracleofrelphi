// Controls named sky records separately from the temporary Sky A / Sky B workspace slots.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function fire(element, type) { if (element) element.dispatchEvent(new Event(type, { bubbles:true })); }
  function headingParts() {
    const text = byId('relphiSkyCompleteHeading')?.textContent || '';
    const match = text.match(/^(.*?)\s+is now\s+(Sky [AB])$/i);
    return match ? { name:match[1].trim(), slot:match[2] } : null;
  }
  function activeSlot() {
    const heading = headingParts();
    if (heading) return heading.slot;
    if (document.body.dataset.relphiSkyBReady === 'true') return 'Sky B';
    return byId('skyCreatorTarget')?.value === 'currentSky' ? 'Sky B' : 'Sky A';
  }
  function activeName() {
    const heading = headingParts();
    if (heading?.name) return heading.name;
    return byId('relphiSkyNameInput')?.value.trim() || byId('skyCreatorName')?.value.trim() || byId('skyCalcName')?.value.trim() || 'Untitled sky';
  }
  function showStage(id) {
    ['relphiSkyNameStage','relphiSkyMethodStage','relphiExistingStage','relphiCalculateStage','relphiSkyCompleteStage'].forEach(function (stageId) {
      const stage = byId(stageId);
      if (stage) stage.hidden = stageId !== id;
    });
    byId(id)?.scrollIntoView({ block:'start', behavior:'smooth' });
  }
  function setText(element, value) { if (element && element.textContent !== value) element.textContent = value; }
  function refreshLabels() {
    const name = activeName();
    const slot = activeSlot();
    setText(byId('relphiSaveActiveSky'), 'Save “' + name + '”');
    setText(byId('relphiEditActiveSky'), 'Edit “' + name + '”');
    setText(byId('relphiClearActiveSky'), 'Clear ' + slot);
  }
  function setTargetForSlot(slot) {
    const kind = slot === 'Sky B' ? 'currentSky' : 'chart';
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = kind;
      fire(field, 'input');
      fire(field, 'change');
    });
  }
  function savedNameExists(name) {
    return Array.from(byId('skyCreatorLibrary')?.options || []).some(function (option) {
      return option.value && option.textContent.trim().toLowerCase() === name.trim().toLowerCase();
    });
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
    setTargetForSlot(slot);
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
      if (!complete) return window.setTimeout(wait, 50);
      if (byId('relphiActiveSkyActions')) return;

      const actions = document.createElement('div');
      actions.id = 'relphiActiveSkyActions';
      actions.className = 'button-row';
      actions.innerHTML = '<button id="relphiSaveActiveSky" class="relphi-primary-action" type="button">Save named sky</button><button id="relphiEditActiveSky" class="relphi-secondary-action" type="button">Edit named sky</button><button id="relphiClearActiveSky" class="relphi-secondary-action" type="button">Clear active slot</button><p id="relphiActiveSkyStatus" class="generated-note" aria-live="polite"></p>';
      const comparison = byId('relphiAddComparison');
      complete.insertBefore(actions, comparison?.parentElement || null);
      refreshLabels();

      byId('relphiSaveActiveSky').addEventListener('click', function () {
        const name = activeName();
        const slot = activeSlot();
        const status = byId('relphiActiveSkyStatus');
        setTargetForSlot(slot);
        ['skyCreatorName','skyCalcName'].forEach(function (id) {
          const field = byId(id);
          if (!field) return;
          field.value = name;
          fire(field, 'input');
          fire(field, 'change');
        });
        const save = byId('skyCreatorSaveWizard');
        if (!save) {
          status.textContent = 'Save is unavailable for “' + name + '”.';
          return;
        }
        status.textContent = 'Saving “' + name + '”…';
        save.click();
        const started = Date.now();
        (function verify() {
          if (savedNameExists(name)) {
            status.textContent = 'Saved “' + name + '” to your saved skies.';
            return;
          }
          if (Date.now() - started > 3000) {
            status.textContent = '“' + name + '” was not added to saved skies. Nothing was claimed as saved.';
            return;
          }
          setTimeout(verify, 100);
        })();
      });
      byId('relphiEditActiveSky').addEventListener('click', function () { showStage('relphiSkyMethodStage'); });
      byId('relphiClearActiveSky').addEventListener('click', clearActiveSlot);
      ['skyCreatorName','skyCalcName','relphiSkyNameInput','skyCreatorTarget','relphiSkyCompleteHeading'].forEach(function (id) {
        const element = byId(id);
        element?.addEventListener('input', refreshLabels);
        element?.addEventListener('change', refreshLabels);
      });
      new MutationObserver(refreshLabels).observe(byId('relphiSkyCompleteHeading'), { childList:true, subtree:true, characterData:true });
      window.addEventListener('relphi:sky-b-ready', refreshLabels);
    };
    wait();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();