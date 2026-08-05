// Bridges canonical Sky-card Edit controls to the builder's own slot-aware edit
// command. The cog's originating sky is immutable throughout this workflow.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyContractEditorV1) return;
  window.__relphiSkyContractEditorV1 = true;

  let activeSlot = null;
  let observer = null;

  function nativeKind(slot) { return slot === 'skyB' ? 'currentSky' : 'chart'; }

  function enforceTarget() {
    if (!activeSlot) return;
    const kind = nativeKind(activeSlot);
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const control = document.getElementById(id);
      if (!control) return;
      control.dataset.relphiContractLockedTarget = kind;
      if (control.value !== kind) {
        control.value = kind;
        control.dispatchEvent(new Event('change', { bubbles:true }));
      }
      const label = control.closest('label');
      if (label) {
        label.hidden = true;
        label.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function finishEditing() {
    activeSlot = null;
    document.body.classList.remove('relphi-sky-editor-open');
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const control = document.getElementById(id);
      if (!control) return;
      delete control.dataset.relphiContractLockedTarget;
      const label = control.closest('label');
      if (label) {
        label.hidden = false;
        label.removeAttribute('aria-hidden');
      }
    });
    window.dispatchEvent(new Event('relphi:sky-contract-editor-closed'));
  }

  function watchBuilder(builder) {
    observer?.disconnect();
    observer = new MutationObserver(function () {
      enforceTarget();
      if (!activeSlot) return;
      const complete = builder.querySelector('.relphi-v4-complete');
      const editing = builder.querySelector('.relphi-v4-card:not(.relphi-v4-complete),#relphiV4CalcMount,#relphiV4PlacementMount');
      if (complete && !editing) finishEditing();
    });
    observer.observe(builder, { childList:true, subtree:true });
  }

  function sendEditCommand(slot) {
    const builder = document.getElementById('relphiSkyBuilderV4');
    if (!builder) return false;
    activeSlot = slot;
    document.body.classList.add('relphi-sky-editor-open');
    builder.hidden = false;
    builder.style.removeProperty('display');
    watchBuilder(builder);

    let command = builder.querySelector(`[data-edit="${slot}"]`);
    let temporary = false;
    if (!command) {
      command = document.createElement('button');
      command.type = 'button';
      command.hidden = true;
      command.dataset.edit = slot;
      builder.appendChild(command);
      temporary = true;
    }
    command.click();
    if (temporary) command.remove();
    enforceTarget();
    builder.scrollIntoView({ block:'start', behavior:'auto' });
    return true;
  }

  document.addEventListener('click', function (event) {
    const edit = event.target.closest?.('[data-contract-edit]');
    if (!edit) return;
    const slot = edit.dataset.contractEdit === 'B' ? 'skyB' : 'skyA';
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!sendEditCommand(slot)) {
      console.error('Sky Chart builder is unavailable for ' + slot + '.');
    }
  }, true);

  document.addEventListener('change', function (event) {
    const control = event.target.closest?.('#skyCreatorTarget,#skyCalcTarget');
    const locked = control?.dataset.relphiContractLockedTarget;
    if (!locked || control.value === locked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    control.value = locked;
    control.dispatchEvent(new Event('change', { bubbles:true }));
  }, true);

  window.addEventListener('relphi:sky-builder-v4-loaded', function () {
    const builder = document.getElementById('relphiSkyBuilderV4');
    if (builder && activeSlot) {
      watchBuilder(builder);
      enforceTarget();
    }
  });
})();
