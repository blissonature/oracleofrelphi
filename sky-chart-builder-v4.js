// Clean Sky Chart builder: one controller, one state object, two explicit native slots.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (new URLSearchParams(location.search).get('preview') !== 'pr55') return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SLOT_KEYS = { skyA:'relphiTarotChart', skyB:'relphiCurrentSky' };
  const STATE_KEY = 'relphiSkyBuilderV4State';

  const state = readSession(STATE_KEY, {
    step:'nameA',
    editingSlot:'skyA',
    pendingName:'',
    skyA:null,
    skyB:null,
    beforeSignature:'',
    calculating:false
  });

  let root;
  let calcOriginalParent = null;
  let calcOriginalNext = null;
  let pollTimer = 0;

  function byId(id) { return document.getElementById(id); }
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function readJson(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function removeJson(key) { try { localStorage.removeItem(key); } catch (_) {} }
  function readSession(key, fallback) {
    try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  }
  function saveState() {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
  }
  function clearState() { try { sessionStorage.removeItem(STATE_KEY); } catch (_) {} }
  function placementEntries(payload) {
    const source = payload && (payload.placements || payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    return Object.fromEntries(Object.entries(source).filter(function (entry) {
      const item = entry[1];
      return item && typeof item === 'object' && !Array.isArray(item) &&
        (String(item.sign || '').trim() || (item.degree !== '' && item.degree != null && Number.isFinite(Number(item.degree))));
    }));
  }
  function hasPlacements(payload) { return Object.keys(placementEntries(payload)).length > 0; }
  function signature(payload) {
    return Object.entries(placementEntries(payload)).sort(function (a, b) { return a[0].localeCompare(b[0]); }).map(function (entry) {
      const item = entry[1] || {};
      return [entry[0], item.sign || '', item.degree ?? '', item.minute ?? '', item.house ?? '', item.retrograde ? 'R' : ''].join(':');
    }).join('|');
  }
  function records() {
    const list = readJson(LIBRARY_KEY, []);
    return Array.isArray(list) ? list.filter(function (record) {
      return record && String(record.name || '').trim() && hasPlacements(record);
    }) : [];
  }
  function recordByName(name) {
    return records().find(function (record) { return normalize(record.name) === normalize(name); }) || null;
  }
  function payloadFromRecord(record) {
    return {
      name:String(record.name || '').trim(),
      notes:String(record.notes || ''),
      placements:placementEntries(record.placements),
      calcProfile:record.calcProfile && typeof record.calcProfile === 'object' ? record.calcProfile : {},
      savedAt:record.savedAt || new Date().toISOString(),
      savedAtLocal:record.savedAtLocal || new Date().toLocaleString()
    };
  }
  function defaultName() {
    const now = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return 'Untitled Sky ' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + pad(now.getMinutes());
  }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function setValue(id, value, notify) {
    const field = byId(id);
    if (!field) return;
    field.value = value == null ? '' : String(value);
    if (notify !== false) { fire(field, 'input'); fire(field, 'change'); }
  }
  function nativeKind(slot) { return slot === 'skyB' ? 'currentSky' : 'chart'; }
  function slotKey(slot) { return SLOT_KEYS[slot]; }
  function setNativeTarget(slot) {
    const kind = nativeKind(slot);
    setValue('skyCreatorTarget', kind, true);
    setValue('skyCalcTarget', kind, true);
    const paste = byId('skyCreatorPaste');
    if (paste) paste.dataset.skyKind = kind;
  }
  function setResultsVisible(visible) {
    const toolbar = byId('skyResultsToolbar') || document.querySelector('.sky-results-toolbar');
    const output = document.querySelector('.sky-output-box');
    if (toolbar) toolbar.hidden = !visible;
    if (output) output.hidden = !visible;
  }
  function activateComparison() {
    const button = document.querySelector('[data-sky-chart-mode="compare"], [data-sky-chart-mode="synastry"], [data-sky-chart-mode="transit"]');
    button?.click();
    const output = byId('currentSkyOutput');
    if (output) { output.hidden = false; output.removeAttribute('hidden'); }
    window.dispatchEvent(new Event('resize'));
  }
  function status(message, error) {
    const node = byId('relphiV4Status');
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', !!error);
    node.hidden = !message;
  }
  function savedOptions() {
    return records().map(function (record) {
      return '<option value="' + escapeHtml(record.name) + '"></option>';
    }).join('');
  }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char];
    });
  }
  function panel(slot, payload) {
    const label = slot === 'skyA' ? 'Sky A' : 'Sky B';
    return '<article class="relphi-v4-sky-panel" data-slot="' + slot + '">' +
      '<div><span class="eyebrow">' + label + '</span><h3>' + escapeHtml(payload.name || label) + '</h3><p>' + Object.keys(placementEntries(payload)).length + ' placements</p></div>' +
      '<div class="relphi-v4-panel-actions"><button type="button" data-edit="' + slot + '">Edit</button><button type="button" data-clear="' + slot + '">Clear</button></div>' +
      '</article>';
  }
  function render() {
    if (!root) return;
    let body = '';
    const a = state.skyA && hasPlacements(state.skyA) ? state.skyA : null;
    const b = state.skyB && hasPlacements(state.skyB) ? state.skyB : null;

    if (state.step === 'nameA' || state.step === 'nameB') {
      const slot = state.step === 'nameB' ? 'skyB' : 'skyA';
      const label = slot === 'skyA' ? 'First sky' : 'Comparison sky';
      const title = slot === 'skyA' ? 'Choose or name Sky A' : 'Choose or name Sky B';
      body = '<section class="relphi-v4-card"><span class="eyebrow">' + label + '</span><h2>' + title + '</h2>' +
        '<p>Choose a saved sky, type a new name, or continue for an automatic Untitled Sky name.</p>' +
        '<label>Sky name <span>optional</span><input id="relphiV4Name" list="relphiV4Saved" autocomplete="off" value="' + escapeHtml(state.pendingName || '') + '"></label>' +
        '<datalist id="relphiV4Saved">' + savedOptions() + '</datalist>' +
        '<div class="relphi-v4-actions">' + (slot === 'skyB' ? '<button class="secondary" type="button" data-action="back-complete">Back</button>' : '') + '<button class="primary" type="button" data-action="continue-name">Continue</button></div></section>';
    } else if (state.step === 'methodA' || state.step === 'methodB') {
      const label = state.editingSlot === 'skyA' ? 'Sky A' : 'Sky B';
      body = '<section class="relphi-v4-card"><span class="eyebrow">Create the sky</span><h2>How will you create “' + escapeHtml(state.pendingName) + '”?</h2>' +
        '<div class="relphi-v4-choice-grid"><button class="choice" type="button" data-action="saved"><strong>Use a saved sky</strong><span>Load placements already in your library.</span></button><button class="choice" type="button" data-action="calculate"><strong>Calculate a sky</strong><span>Calculate from a time and place.</span></button></div>' +
        '<button class="secondary back" type="button" data-action="back-name">Back</button></section>';
    } else if (state.step === 'chooseSavedA' || state.step === 'chooseSavedB') {
      body = '<section class="relphi-v4-card"><span class="eyebrow">Saved skies</span><h2>Choose a saved sky</h2>' +
        '<label>Saved sky<select id="relphiV4SavedSelect"><option value="">Choose…</option>' + records().map(function (r) { return '<option value="' + escapeHtml(r.name) + '">' + escapeHtml(r.name) + '</option>'; }).join('') + '</select></label>' +
        '<div class="relphi-v4-actions"><button class="secondary" type="button" data-action="back-method">Back</button><button class="primary" type="button" data-action="load-saved">Load sky</button></div></section>';
    } else if (state.step === 'calculateA' || state.step === 'calculateB') {
      body = '<section class="relphi-v4-card"><span class="eyebrow">Calculate</span><h2>Choose the time and place</h2>' +
        '<div id="relphiV4CalcChoices" class="relphi-v4-choice-grid"><button class="choice" type="button" data-action="here-now"><strong>Here and Now</strong><span>Use the current time and your present location.</span></button><button class="choice" type="button" data-action="manual"><strong>Choose a time and place</strong><span>Enter another date, time, and location.</span></button></div>' +
        '<div id="relphiV4CalcMount" hidden></div><button class="secondary back" type="button" data-action="back-method">Back</button></section>';
    } else if (state.step === 'completeA' || state.step === 'completeBoth') {
      body = '<section class="relphi-v4-complete">' + panel('skyA', a) + (b ? panel('skyB', b) : '') + '</section>' +
        (!b ? '<button class="primary add-comparison" type="button" data-action="add-comparison">Add a comparison sky</button>' : '');
    }

    root.innerHTML = '<div class="relphi-v4-toolbar"><button type="button" data-action="start-over">Start Over</button></div>' + body + '<p id="relphiV4Status" class="relphi-v4-status" hidden aria-live="polite"></p>';
    setResultsVisible(!!a);
    if (a) writeJson(SLOT_KEYS.skyA, a);
    if (b) { writeJson(SLOT_KEYS.skyB, b); activateComparison(); }
    saveState();
  }
  function rememberCalculator() {
    const calculator = document.querySelector('.sky-calc-drawer');
    if (!calculator || calcOriginalParent) return;
    calcOriginalParent = calculator.parentElement;
    calcOriginalNext = calculator.nextSibling;
  }
  function closeCalculator() {
    const calculator = document.querySelector('.sky-calc-drawer');
    if (!calculator) return;
    calculator.open = false;
    calculator.hidden = true;
    calculator.removeAttribute('open');
    if (calcOriginalParent && calculator.parentElement !== calcOriginalParent) calcOriginalParent.insertBefore(calculator, calcOriginalNext || null);
  }
  function openCalculator(clearFields) {
    rememberCalculator();
    const calculator = document.querySelector('.sky-calc-drawer');
    const mount = byId('relphiV4CalcMount');
    const choices = byId('relphiV4CalcChoices');
    if (!calculator || !mount) { status('The calculator is unavailable.', true); return; }
    if (choices) choices.hidden = true;
    mount.hidden = false;
    mount.appendChild(calculator);
    calculator.hidden = false;
    calculator.open = true;
    calculator.setAttribute('open', '');
    setNativeTarget(state.editingSlot);
    setValue('skyCalcName', state.pendingName || defaultName(), false);
    if (clearFields) ['skyCalcDateTime','skyCalcTimeZone','skyCalcLocation','skyCalcLatitude','skyCalcLongitude'].forEach(function (id) { setValue(id, '', false); });
    byId('skyCalcDateTime')?.focus();
  }
  function loadRecord(record, slot) {
    return new Promise(function (resolve, reject) {
      const select = byId('skyCreatorLibrary');
      const output = slot === 'skyB' ? byId('currentSkyOutput') : byId('chartOutput');
      if (!record || !select || !output) return reject(new Error('Native saved-sky controls unavailable'));
      setNativeTarget(slot);
      setValue('skyCreatorName', record.name, false);
      setValue('skyCalcName', record.name, false);
      select.value = record.id;
      fire(select, 'input'); fire(select, 'change');
      byId('skyCreatorLoad')?.click();
      const started = Date.now();
      (function wait() {
        const payload = readJson(slotKey(slot), null);
        if (hasPlacements(payload) && normalize(payload.name) === normalize(record.name)) return resolve(payload);
        if (Date.now() - started > 10000) return reject(new Error('Saved sky did not load'));
        setTimeout(wait, 120);
      })();
    });
  }
  function finishSlot(payload) {
    if (!hasPlacements(payload)) return;
    payload = { ...payload, name:state.pendingName || payload.name || defaultName() };
    writeJson(slotKey(state.editingSlot), payload);
    if (state.editingSlot === 'skyA') {
      state.skyA = payload;
      state.skyB = null;
      removeJson(SLOT_KEYS.skyB);
      state.step = 'completeA';
    } else {
      state.skyB = payload;
      if (state.skyA) writeJson(SLOT_KEYS.skyA, state.skyA);
      state.step = 'completeBoth';
    }
    state.calculating = false;
    closeCalculator();
    render();
  }
  function watchCalculation() {
    clearTimeout(pollTimer);
    const started = Date.now();
    const check = function () {
      if (!state.calculating) return;
      const payload = readJson(slotKey(state.editingSlot), null);
      if (hasPlacements(payload) && signature(payload) !== state.beforeSignature) return finishSlot(payload);
      if (Date.now() - started > 20000) {
        state.calculating = false;
        status('The calculation did not finish. The existing sky was not replaced.', true);
        return;
      }
      pollTimer = setTimeout(check, 150);
    };
    pollTimer = setTimeout(check, 100);
  }
  function prepareRun() {
    setNativeTarget(state.editingSlot);
    state.beforeSignature = signature(readJson(slotKey(state.editingSlot), null));
    state.calculating = true;
    saveState();
    watchCalculation();
  }
  function runHereNow() {
    openCalculator(false);
    prepareRun();
    setValue('skyCalcDateTime', localDateTimeValue(new Date()), false);
    setValue('skyCalcTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone || '', false);
    if (!navigator.geolocation) { state.calculating = false; status('Current location is unavailable. Choose a time and place instead.', true); return; }
    navigator.geolocation.getCurrentPosition(function (position) {
      setValue('skyCalcLatitude', position.coords.latitude.toFixed(6), false);
      setValue('skyCalcLongitude', position.coords.longitude.toFixed(6), false);
      setValue('skyCalcLocation', 'Current location', false);
      setNativeTarget(state.editingSlot);
      byId('skyCalcRun')?.click();
    }, function () {
      state.calculating = false;
      status('Location permission was unavailable. Choose a time and place instead.', true);
    }, { enableHighAccuracy:false, timeout:12000, maximumAge:60000 });
  }
  function localDateTimeValue(date) {
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
  function openAdvanced(slot) {
    const payload = slot === 'skyB' ? state.skyB : state.skyA;
    if (!payload) return;
    state.editingSlot = slot;
    setNativeTarget(slot);
    setValue('skyCreatorName', payload.name, false);
    setValue('skyCreatorNotes', payload.notes || '', false);
    const drawer = byId('skyCreatorDrawer');
    if (drawer) { drawer.hidden = false; drawer.open = true; drawer.setAttribute('open', ''); }
  }
  function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    const edit = event.target.closest('[data-edit]')?.dataset.edit;
    const clear = event.target.closest('[data-clear]')?.dataset.clear;
    if (edit) return openAdvanced(edit);
    if (clear) {
      if (clear === 'skyA') {
        state.skyA = null; state.skyB = null; state.step = 'nameA'; state.pendingName = ''; removeJson(SLOT_KEYS.skyA); removeJson(SLOT_KEYS.skyB);
      } else {
        state.skyB = null; state.step = 'completeA'; removeJson(SLOT_KEYS.skyB);
      }
      return render();
    }
    if (!action) return;
    if (action === 'start-over') {
      if (!window.confirm('Start over? This clears the current Sky A and Sky B. Saved skies will not be deleted.')) return;
      removeJson(SLOT_KEYS.skyA); removeJson(SLOT_KEYS.skyB); clearState(); location.reload(); return;
    }
    if (action === 'continue-name') {
      const input = byId('relphiV4Name');
      state.pendingName = input?.value.trim() || defaultName();
      const record = recordByName(state.pendingName);
      if (record) {
        status('Loading “' + record.name + '”…');
        return loadRecord(record, state.editingSlot).then(finishSlot).catch(function (error) { status(error.message + '.', true); });
      }
      state.step = state.editingSlot === 'skyA' ? 'methodA' : 'methodB';
      return render();
    }
    if (action === 'back-name') { state.step = state.editingSlot === 'skyA' ? 'nameA' : 'nameB'; return render(); }
    if (action === 'saved') { state.step = state.editingSlot === 'skyA' ? 'chooseSavedA' : 'chooseSavedB'; return render(); }
    if (action === 'calculate') { state.step = state.editingSlot === 'skyA' ? 'calculateA' : 'calculateB'; return render(); }
    if (action === 'back-method') { closeCalculator(); state.step = state.editingSlot === 'skyA' ? 'methodA' : 'methodB'; return render(); }
    if (action === 'load-saved') {
      const name = byId('relphiV4SavedSelect')?.value || '';
      const record = recordByName(name);
      if (!record) return status('Choose a saved sky.', true);
      status('Loading “' + record.name + '”…');
      return loadRecord(record, state.editingSlot).then(finishSlot).catch(function (error) { status(error.message + '.', true); });
    }
    if (action === 'manual') return openCalculator(true);
    if (action === 'here-now') return runHereNow();
    if (action === 'add-comparison') {
      state.editingSlot = 'skyB'; state.pendingName = ''; state.step = 'nameB'; return render();
    }
    if (action === 'back-complete') { state.step = state.skyB ? 'completeBoth' : 'completeA'; return render(); }
  }
  function installStyles() {
    if (byId('relphiV4Styles')) return;
    const style = document.createElement('style');
    style.id = 'relphiV4Styles';
    style.textContent = '.relphi-v4-root{margin:1.5rem auto;max-width:1400px}.relphi-v4-toolbar{display:flex;justify-content:flex-end;margin-bottom:1rem}.relphi-v4-toolbar button,.relphi-v4-root button{appearance:none;border:1px solid rgba(220,31,24,.42);border-radius:999px;background:#fff;color:#111;font:inherit;font-weight:700;padding:.8rem 1.25rem;min-height:48px}.relphi-v4-root button.primary{background:#e72018;color:#fff;border-color:#e72018;box-shadow:0 12px 24px rgba(231,32,24,.18)}.relphi-v4-card,.relphi-v4-complete{background:#fffaf4;border:1px solid #e6ddd4;border-radius:28px;padding:2rem}.relphi-v4-card h2{margin:.25rem 0 .5rem}.relphi-v4-card label{display:grid;gap:.45rem;margin:1.25rem 0;font-weight:700}.relphi-v4-card input,.relphi-v4-card select{font:inherit;padding:.9rem 1rem;border:1px solid #d8d1cb;border-radius:18px;background:#fff}.relphi-v4-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin:1.5rem 0}.relphi-v4-choice-grid .choice{border-radius:28px;min-height:150px;text-align:left;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}.relphi-v4-choice-grid strong{font-size:1.2rem}.relphi-v4-choice-grid span{font-weight:400;color:#777;margin-top:.35rem}.relphi-v4-actions{display:flex;gap:.75rem;justify-content:flex-end}.relphi-v4-complete{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.relphi-v4-sky-panel{background:#fff;border:1px solid #ddd;border-radius:24px;padding:1.5rem;display:flex;justify-content:space-between;gap:1rem;align-items:center}.relphi-v4-sky-panel h3{margin:.25rem 0}.relphi-v4-panel-actions{display:flex;gap:.65rem}.add-comparison{margin-top:1rem}.relphi-v4-status{background:#fff;border-left:4px solid #e72018;border-radius:16px;padding:1rem 1.25rem}.relphi-v4-status.is-error{color:#8b1713}.eyebrow{text-transform:uppercase;letter-spacing:.12em;color:#e45d55;font-weight:800;font-size:.8rem}#skyBuilderModeSwitch{display:none!important}@media(max-width:760px){.relphi-v4-choice-grid,.relphi-v4-complete{grid-template-columns:1fr}.relphi-v4-sky-panel{align-items:flex-start;flex-direction:column}.relphi-v4-panel-actions{width:100%}.relphi-v4-panel-actions button{flex:1}.relphi-v4-card,.relphi-v4-complete{padding:1.25rem}}';
    document.head.appendChild(style);
  }
  function install() {
    installStyles();
    const oldWizard = byId('relphiSkyWizard');
    if (oldWizard) oldWizard.remove();
    root = document.createElement('section');
    root.className = 'relphi-v4-root';
    root.id = 'relphiSkyBuilderV4';
    const hero = document.querySelector('.sky-chart-hero-panel');
    (hero || document.body).insertAdjacentElement('afterend', root);
    root.addEventListener('click', handleClick);
    document.addEventListener('click', function (event) {
      if (!event.target.closest('#skyCalcRun')) return;
      if (!state.calculating) prepareRun();
      setNativeTarget(state.editingSlot);
    }, true);

    if (state.skyA && hasPlacements(state.skyA)) writeJson(SLOT_KEYS.skyA, state.skyA);
    if (state.skyB && hasPlacements(state.skyB)) writeJson(SLOT_KEYS.skyB, state.skyB);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
