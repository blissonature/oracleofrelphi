// In-place Sky card editing for the tri-panel workspace.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  let active = null;
  let queued = false;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }
  function profile(payload) {
    return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function fire(node, type) {
    if (node) node.dispatchEvent(new Event(type, { bubbles:true }));
  }
  function setNative(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.value = value == null ? '' : String(value);
    fire(node, 'input');
    fire(node, 'change');
  }
  function waitFor(test, timeout) {
    const started = Date.now();
    return new Promise(function (resolve, reject) {
      (function check() {
        const value = test();
        if (value) return resolve(value);
        if (Date.now() - started > (timeout || 5000)) return reject(new Error('The editor did not finish opening.'));
        setTimeout(check, 30);
      })();
    });
  }
  function localNow() {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function sourceEdit(slot) {
    return document.querySelector('.relphi-v4-sky-panel[data-slot="' + slot + '"] [data-edit]');
  }
  function card(slot) {
    return document.querySelector('.relphi-workspace-sky[data-workspace-slot="' + slot + '"]');
  }
  function syncSimpleToNative(host) {
    setNative('skyCalcName', host.querySelector('[name="inline-name"]')?.value || '');
    setNative('skyCalcDateTime', host.querySelector('[name="inline-datetime"]')?.value || '');
    setNative('skyCalcLocation', host.querySelector('[name="inline-location"]')?.value || '');
  }
  function finishUi() {
    document.body.classList.remove('relphi-inline-sky-editing');
    active = null;
  }
  function closeNativeEditor() {
    const root = document.getElementById('relphiSkyBuilderV4');
    root?.querySelector('[data-action="back-method"]')?.click();
    setTimeout(function () { root?.querySelector('[data-action="back-name"]')?.click(); }, 0);
  }
  function cancel() {
    if (!active) return;
    const workspace = document.getElementById('relphiSkyWorkspace');
    if (workspace) workspace.dataset.signature = 'inline-cancel-' + Date.now();
    closeNativeEditor();
    finishUi();
    window.dispatchEvent(new Event('storage'));
  }
  function runCalculation(host, useNow) {
    syncSimpleToNative(host);
    const status = host.querySelector('.relphi-inline-editor-status');
    if (useNow) {
      const now = localNow();
      const simple = host.querySelector('[name="inline-datetime"]');
      if (simple) simple.value = now;
      setNative('skyCalcDateTime', now);
      document.getElementById('skyCalcNow')?.click();
    }
    if (status) status.textContent = useNow ? 'Updating this sky to the current minute…' : 'Recalculating this sky…';
    document.getElementById('skyCalcRun')?.click();
    const slot = active?.slot;
    const before = JSON.stringify(read(SLOT_KEYS[slot]));
    const started = Date.now();
    (function watch() {
      const after = JSON.stringify(read(SLOT_KEYS[slot]));
      const nativeStatus = document.getElementById('skyCalcStatus')?.textContent?.trim() || '';
      if (after && after !== before) {
        finishUi();
        window.dispatchEvent(new Event('storage'));
        return;
      }
      if (/^(Could not|Enter |Choose |No location|Location search failed|Date |Time zone)/i.test(nativeStatus)) {
        if (status) status.textContent = nativeStatus;
        return;
      }
      if (Date.now() - started > 65000) {
        if (status) status.textContent = nativeStatus || 'The calculation did not finish.';
        return;
      }
      setTimeout(watch, 150);
    })();
  }
  async function open(slot, immediateNow) {
    if (active) cancel();
    const target = card(slot);
    const payload = read(SLOT_KEYS[slot]);
    if (!target || !payload) return;
    const p = profile(payload);
    active = { slot:slot };
    document.body.classList.add('relphi-inline-sky-editing');

    try {
      sourceEdit(slot)?.click();
      const calculate = await waitFor(function () { return document.querySelector('#relphiSkyBuilderV4 [data-action="calculate"]'); });
      calculate.click();
      const manual = await waitFor(function () { return document.querySelector('#relphiSkyBuilderV4 [data-action="manual"]'); });
      manual.click();
      const calculator = await waitFor(function () { return document.querySelector('.sky-calc-drawer'); });

      target.innerHTML = '<header class="relphi-workspace-sky-header"><span class="relphi-workspace-tab">' + (slot === 'skyA' ? 'Sky A' : 'Sky B') + '</span><strong>Edit sky</strong></header>' +
        '<form class="relphi-inline-sky-editor">' +
          '<label><span>Name</span><input name="inline-name" value="' + esc(payload.name || '') + '"></label>' +
          '<label><span>Date and time</span><input name="inline-datetime" type="datetime-local" value="' + esc(p.dateTime || '') + '"></label>' +
          '<label><span>Location</span><input name="inline-location" value="' + esc(p.location || '') + '"></label>' +
          '<div class="relphi-inline-editor-actions"><button class="primary" type="button" data-inline-action="now">Update to now</button><button type="button" data-inline-action="save">Recalculate</button><button type="button" data-inline-action="cancel">Cancel</button></div>' +
          '<details class="relphi-inline-advanced"><summary>Advanced options</summary><div class="relphi-inline-native-mount"></div></details>' +
          '<p class="relphi-inline-editor-status" aria-live="polite"></p>' +
        '</form>';
      target.querySelector('.relphi-inline-native-mount').appendChild(calculator);
      calculator.hidden = false;
      calculator.open = true;
      calculator.setAttribute('open', '');

      const form = target.querySelector('.relphi-inline-sky-editor');
      form.addEventListener('input', function () { syncSimpleToNative(form); });
      form.addEventListener('click', function (event) {
        const action = event.target.closest('[data-inline-action]')?.dataset.inlineAction;
        if (action === 'now') runCalculation(form, true);
        if (action === 'save') runCalculation(form, false);
        if (action === 'cancel') cancel();
      });
      syncSimpleToNative(form);
      if (immediateNow) runCalculation(form, true);
    } catch (error) {
      finishUi();
      window.dispatchEvent(new Event('storage'));
    }
  }
  function decorate() {
    queued = false;
    document.querySelectorAll('.relphi-workspace-sky').forEach(function (sky) {
      const actions = sky.querySelector('.relphi-workspace-actions');
      if (!actions || actions.querySelector('[data-inline-update-now]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Now';
      button.dataset.inlineUpdateNow = 'true';
      button.setAttribute('aria-label', 'Update this sky to the current minute');
      actions.prepend(button);
    });
  }
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(decorate);
  }
  function capture(event) {
    const sky = event.target.closest('.relphi-workspace-sky');
    if (!sky) return;
    const slot = sky.dataset.workspaceSlot;
    if (event.target.closest('[data-inline-update-now]')) {
      event.preventDefault(); event.stopImmediatePropagation(); open(slot, true); return;
    }
    if (event.target.closest('[data-workspace-action="edit"]')) {
      event.preventDefault(); event.stopImmediatePropagation(); open(slot, false);
    }
  }
  function styles() {
    if (document.getElementById('relphi-inline-sky-editor-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-inline-sky-editor-style';
    style.textContent = `
      body.relphi-inline-sky-editing #relphiSkyBuilderV4{display:none!important}
      .relphi-inline-sky-editor{display:grid;gap:.75rem;padding:1rem}.relphi-inline-sky-editor label{display:grid;gap:.3rem;font-weight:800}.relphi-inline-sky-editor input,.relphi-inline-sky-editor select{width:100%;min-width:0;border:1px solid #cfd5df;border-radius:.5rem;padding:.65rem;font:inherit;background:#fff}.relphi-inline-editor-actions{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.relphi-inline-editor-actions button{border:1px solid var(--panel-accent);border-radius:.5rem;background:#fff;color:var(--panel-accent);padding:.65rem .5rem;font-weight:800;cursor:pointer}.relphi-inline-editor-actions .primary{grid-column:1/-1;background:var(--panel-accent);color:#fff}.relphi-inline-advanced{border:1px solid #dfe3ea;border-radius:.6rem;overflow:hidden}.relphi-inline-advanced>summary{padding:.7rem .8rem;font-weight:800;cursor:pointer;background:#fafbfc}.relphi-inline-native-mount{padding:.5rem}.relphi-inline-native-mount .sky-calc-drawer{display:block!important;border:0!important;margin:0!important}.relphi-inline-native-mount .sky-calc-drawer>summary{display:none!important}.relphi-inline-editor-status{min-height:1.3em;margin:0;color:#555;font-weight:700}
      @media(max-width:760px){.relphi-inline-editor-actions{grid-template-columns:1fr}.relphi-inline-editor-actions .primary{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }
  function start() {
    styles();
    decorate();
    document.addEventListener('click', capture, true);
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('storage', queue);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();