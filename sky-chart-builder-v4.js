// Clean Sky Chart builder: one controller, one state object, two explicit native slots.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (new URLSearchParams(location.search).get('preview') !== 'pr55') return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SLOT_KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const STATE_KEY = 'relphiSkyBuilderV4State';
  const state = readSession(STATE_KEY, { step:'nameA', editingSlot:'skyA', pendingName:'', skyA:null, skyB:null, beforeSignature:'', calculating:false });
  state.calculating = false;
  state.beforeSignature = '';
  if ((state.step === 'nameA' || state.step === 'nameB') && String(state.pendingName || '').trim().toLowerCase() === 'now') state.pendingName = '';
  if (!hasPlacements(state.skyA)) state.skyA = readJson(SLOT_KEYS.skyA, null);
  if (!hasPlacements(state.skyB)) state.skyB = readJson(SLOT_KEYS.skyB, null);
  if (hasPlacements(state.skyA)) state.step = hasPlacements(state.skyB) ? 'completeBoth' : 'completeA';
  let root;
  let calcOriginalParent = null;
  let calcOriginalNext = null;
  let placementOriginalParent = null;
  let placementOriginalNext = null;
  let pollTimer = 0;
  let nativeSyncSignature = '';
  const externalHandoff = readExternalHandoff();

  function byId(id) { return document.getElementById(id); }
  function readExternalHandoff() {
    const params = new URLSearchParams(location.search);
    const dateTime = params.get('datetime') || (params.get('date') ? params.get('date') + 'T12:00' : '');
    if (!dateTime) return null;
    const requestedName = params.get('name') || (params.get('source') === 'planetary-hours' ? 'Planetary Hours sky' : 'Date sky');
    return {
      dateTime,
      latitude:params.get('lat') || '',
      longitude:params.get('lon') || '',
      timeZone:params.get('tz') || '',
      location:params.get('loc') || '',
      name:String(requestedName || '').trim().toLowerCase() === 'now' ? '' : requestedName,
      autoRun:params.get('calc') === '1'
    };
  }
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function removeJson(key) { try { localStorage.removeItem(key); } catch (_) {} }
  function readSession(key, fallback) { try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } }
  function saveState() { try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {} }
  function clearState() { try { sessionStorage.removeItem(STATE_KEY); } catch (_) {} }
  function placementEntries(payload) {
    const source = payload && (payload.placements || payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    return Object.fromEntries(Object.entries(source).filter(function (entry) {
      const item = entry[1];
      return item && typeof item === 'object' && !Array.isArray(item) && (String(item.sign || '').trim() || (item.degree !== '' && item.degree != null && Number.isFinite(Number(item.degree))));
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
    return Array.isArray(list) ? list.filter(function (record) { return record && String(record.name || '').trim() && hasPlacements(record); }) : [];
  }
  function recordByName(name) { return records().find(function (record) { return normalize(record.name) === normalize(name); }) || null; }
  function nextAvailableName(name) {
    const base = String(name || '').trim() || defaultName();
    const used = new Set(records().map(function (record) { return normalize(record.name); }));
    if (!used.has(normalize(base))) return base;
    let index = 1;
    while (used.has(normalize(base + ' (' + index + ')'))) index += 1;
    return base + ' (' + index + ')';
  }
  function payloadFromRecord(record) {
    return { name:String(record.name || '').trim(), notes:String(record.notes || ''), placements:placementEntries(record.placements), calcProfile:record.calcProfile && typeof record.calcProfile === 'object' ? record.calcProfile : {}, savedAt:record.savedAt || new Date().toISOString(), savedAtLocal:record.savedAtLocal || new Date().toLocaleString() };
  }
  function defaultName() {
    const now = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return 'Unnamed sky · ' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  }
  function automaticName(payload) {
    const recovered = recoverCalculationProfile(payload || {});
    const dateTime = byId('skyCalcDateTime')?.value || recovered?.calcProfile?.dateTime || '';
    const date = String(dateTime).match(/^\d{4}-\d\d-\d\d/)?.[0];
    return nextAvailableName(date ? 'Unnamed sky · ' + date : defaultName());
  }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function setValue(id, value, notify) { const field = byId(id); if (!field) return; field.value = value == null ? '' : String(value); if (notify !== false) { fire(field, 'input'); fire(field, 'change'); } }
  function nativeKind(slot) { return slot === 'skyB' ? 'currentSky' : 'chart'; }
  function slotKey(slot) { return SLOT_KEYS[slot]; }
  function setNativeTarget(slot) {
    const kind = nativeKind(slot);
    const creatorTarget = byId('skyCreatorTarget');
    const calcTarget = byId('skyCalcTarget');
    if (creatorTarget && creatorTarget.value !== kind) setValue('skyCreatorTarget', kind, true);
    if (calcTarget && calcTarget.value !== kind) setValue('skyCalcTarget', kind, true);
    const paste = byId('skyCreatorPaste');
    if (paste) paste.dataset.skyKind = kind;
  }
  function setResultsVisible(visible) {
    const toolbar = byId('skyResultsToolbar') || document.querySelector('.sky-results-toolbar');
    const output = document.querySelector('.sky-output-box');
    if (toolbar) toolbar.hidden = !visible;
    if (output) output.hidden = !visible;
  }
  function syncNativeSlots(a, b) {
    if (!hasPlacements(a)) return;
    a = recoverCalculationProfile(a);
    b = hasPlacements(b) ? recoverCalculationProfile(b) : b;
    state.skyA = a;
    state.skyB = hasPlacements(b) ? b : null;
    const nextSignature = signature(a) + '|' + String(a.name || '') + '||' + signature(b) + '|' + String(b?.name || '');
    if (nextSignature === nativeSyncSignature) return;
    nativeSyncSignature = nextSignature;
    writeJson(SLOT_KEYS.skyA, a);
    if (hasPlacements(b)) {
      writeJson(SLOT_KEYS.skyB, b);
      activateComparison();
    } else {
      removeJson(SLOT_KEYS.skyB);
      window.RelphiSkyChartController?.setMode?.('single');
      byId('clearCurrentSky')?.click();
    }
    byId('loadChart')?.click();
    if (hasPlacements(b)) byId('loadCurrentSky')?.click();
  }
  function activateComparison() {
    if (window.RelphiSkyChartController?.setMode) window.RelphiSkyChartController.setMode('compare');
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
  function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, function (char) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]; }); }
  function savedOptions() { return records().map(function (record) { return '<option value="' + escapeHtml(record.name) + '"></option>'; }).join(''); }
  function panel(slot, payload) {
    const label = slot === 'skyA' ? 'Sky A' : 'Sky B';
    const entries = Object.entries(placementEntries(payload));
    const preview = entries.slice(0, 6).map(function (entry) {
      const placement = entry[1] || {};
      const hasDegree = placement.degree != null && placement.degree !== '';
      const minute = placement.minute == null || placement.minute === '' || Number.isNaN(Number(placement.minute)) ? 0 : Number(placement.minute);
      const coordinate = hasDegree ? ' ' + placement.degree + '°' + String(minute).padStart(2, '0') + '′' : '';
      return '<li><strong>' + escapeHtml(entry[0]) + '</strong><span>' + escapeHtml((placement.sign || '') + coordinate) + '</span></li>';
    }).join('');
    const remainder = entries.length > 6 ? '<li class="more">+' + (entries.length - 6) + ' more</li>' : '';
    return '<article class="relphi-v4-sky-panel ' + (slot === 'skyA' ? 'is-sky-a' : 'is-sky-b') + '" data-slot="' + slot + '"><div class="relphi-v4-panel-copy"><span class="eyebrow">' + label + '</span><h3>' + escapeHtml(payload.name || label) + '</h3><p>' + entries.length + ' placements</p><ul class="relphi-v4-placement-preview">' + preview + remainder + '</ul></div><div class="relphi-v4-panel-actions"><button type="button" data-edit="' + slot + '">Edit</button><button type="button" data-clear="' + slot + '">Clear</button></div></article>';
  }
  function render() {
    if (!root) return;
    restorePlacementEditor();
    let body = '';
    const a = state.skyA && hasPlacements(state.skyA) ? state.skyA : null;
    const b = state.skyB && hasPlacements(state.skyB) ? state.skyB : null;
    if (state.step === 'nameA' || state.step === 'nameB') {
      const slot = state.step === 'nameB' ? 'skyB' : 'skyA';
      const birthRecord = recordByName('My birth chart');
      body = '<section class="relphi-v4-card"><span class="eyebrow">' + (slot === 'skyA' ? 'First sky' : 'Comparison sky') + '</span><h2>' + (slot === 'skyA' ? 'Choose Sky A' : 'Choose Sky B') + '</h2><div class="relphi-v4-quick-start" aria-label="Quick sky choices"><button class="choice primary" type="button" data-action="quick-now"><strong>Now</strong><span>Use the present moment and your current location. No name required.</span></button><button class="choice" type="button" data-action="quick-birth"><strong>My birth chart</strong><span>' + (birthRecord ? 'Load your saved birth chart.' : 'Enter your birth date, time, and place once, then save it for one-click use.') + '</span></button></div><p class="relphi-v4-or"><span>or</span></p><p>Choose a saved sky or optionally type a name before creating another one.</p><label><span class="relphi-v4-field-label">Sky name or saved sky <small>optional</small></span><span class="relphi-v4-combobox"><input id="relphiV4Name" name="relphi-sky-name" autocomplete="one-time-code" aria-autocomplete="list" aria-controls="relphiV4NameMenu" value="' + escapeHtml(state.pendingName || '') + '"><button class="relphi-v4-combobox-toggle" type="button" data-action="toggle-name-menu" aria-label="Show saved skies" aria-expanded="false">⌄</button></span></label><div id="relphiV4NameMenu" class="relphi-v4-name-menu" role="listbox" hidden>' + (records().length ? records().map(function (record) { return '<button type="button" role="option" data-load-name="' + escapeHtml(record.name) + '"><strong>' + escapeHtml(record.name) + '</strong><span>' + Object.keys(placementEntries(record)).length + ' placements</span></button>'; }).join('') : '<p>No saved skies yet.</p>') + '</div><div class="relphi-v4-actions">' + (slot === 'skyB' ? '<button class="secondary" type="button" data-action="back-complete">Back</button>' : '') + '<button class="primary" type="button" data-action="continue-name">Continue</button></div></section>';
    } else if (state.step === 'nameConflictA' || state.step === 'nameConflictB') {
      const copyName = nextAvailableName(state.pendingName);
      body = '<section class="relphi-v4-card"><span class="eyebrow">Name already saved</span><h2>“' + escapeHtml(state.pendingName) + '” is in your library</h2><p>Load the saved sky, or keep this as a separate sky with the next available computer-style name.</p><div class="relphi-v4-conflict-choice"><button class="choice" type="button" data-action="load-conflict"><strong>Load “' + escapeHtml(state.pendingName) + '”</strong><span>Use the placements already saved under this name.</span></button><button class="choice" type="button" data-action="create-copy" data-copy-name="' + escapeHtml(copyName) + '"><strong>Create “' + escapeHtml(copyName) + '”</strong><span>Keep the saved sky untouched and create a separate entry.</span></button></div><button class="secondary back" type="button" data-action="back-name">Back</button></section>';
    } else if (state.step === 'methodA' || state.step === 'methodB') {
      const editing = hasPlacements(state.editingSlot === 'skyA' ? state.skyA : state.skyB);
      const subject = state.pendingName ? '“' + escapeHtml(state.pendingName) + '”' : 'this unnamed sky';
      body = '<section class="relphi-v4-card"><span class="eyebrow">' + (editing ? 'Edit the sky' : 'Create the sky') + '</span><h2>How will you ' + (editing ? 'edit ' : 'create ') + subject + '?</h2><div class="relphi-v4-choice-grid"><button class="choice" type="button" data-action="placements"><strong>Edit placements</strong><span>Type, paste, or use fields in one synchronized editor.</span></button><button class="choice" type="button" data-action="calculate"><strong>Edit calculation</strong><span>Change the date, time, place, or house system and recalculate.</span></button></div><button class="secondary back" type="button" data-action="back-name">Back</button></section>';
    } else if (state.step === 'chooseSavedA' || state.step === 'chooseSavedB') {
      body = '<section class="relphi-v4-card"><span class="eyebrow">Saved skies</span><h2>Choose a saved sky</h2><label>Saved sky<select id="relphiV4SavedSelect"><option value="">Choose…</option>' + records().map(function (r) { return '<option value="' + escapeHtml(r.name) + '">' + escapeHtml(r.name) + '</option>'; }).join('') + '</select></label><div class="relphi-v4-actions"><button class="secondary" type="button" data-action="back-method">Back</button><button class="primary" type="button" data-action="load-saved">Load sky</button></div></section>';
    } else if (state.step === 'calculateA' || state.step === 'calculateB') {
      body = '<section class="relphi-v4-card"><span class="eyebrow">Calculate</span><h2>Choose the time and place</h2><div id="relphiV4CalcChoices" class="relphi-v4-choice-grid"><button class="choice" type="button" data-action="here-now"><strong>Here and Now</strong><span>Use the current time and your present location.</span></button><button class="choice" type="button" data-action="manual"><strong>Choose a time and place</strong><span>Enter another date, time, and location.</span></button></div><div id="relphiV4CalcMount" hidden></div><button class="secondary back" type="button" data-action="back-method">Back</button></section>';
    } else if (state.step === 'placementsA' || state.step === 'placementsB') {
      body = '<section class="relphi-v4-card relphi-v4-placement-card"><span class="eyebrow">Placement editor</span><h2>Type, paste, or build placements</h2><p>Both sides are the same sky. Editing either side updates the other and immediately refreshes the wheel and Tarot correspondences.</p><label>Sky name<input id="relphiV4PlacementName" value="' + escapeHtml(state.pendingName || '') + '"></label><div id="relphiV4PlacementMount" class="relphi-v4-placement-mount"></div><div class="relphi-v4-actions"><button class="secondary" type="button" data-action="back-method">Back</button><button class="primary" type="button" data-action="finish-placements">Use these placements</button></div></section>';
    } else if (state.step === 'completeA' || state.step === 'completeBoth') {
      body = '<section class="relphi-v4-complete">' + panel('skyA', a) + (b ? panel('skyB', b) : '') + '</section>' + (!b ? '<button class="primary add-comparison" type="button" data-action="add-comparison">Add a comparison sky</button>' : '');
    }
    root.innerHTML = '<div class="relphi-v4-toolbar"><button type="button" data-action="start-over">Start Over</button></div>' + body + '<p id="relphiV4Status" class="relphi-v4-status" hidden aria-live="polite"></p>';
    if (state.step === 'placementsA' || state.step === 'placementsB') openPlacementEditor();
    setResultsVisible(!!a);
    if (a) writeJson(SLOT_KEYS.skyA, a);
    if (b) { writeJson(SLOT_KEYS.skyB, b); activateComparison(); }
    if (a && (state.step === 'completeA' || state.step === 'completeBoth')) syncNativeSlots(a, b);
    saveState();
  }
  function rememberCalculator() { const calculator = document.querySelector('.sky-calc-drawer'); if (!calculator || calcOriginalParent) return; calcOriginalParent = calculator.parentElement; calcOriginalNext = calculator.nextSibling; }
  function closeCalculator() { const calculator = document.querySelector('.sky-calc-drawer'); if (!calculator) return; calculator.open = false; calculator.hidden = true; calculator.removeAttribute('open'); if (calcOriginalParent && calculator.parentElement !== calcOriginalParent) calcOriginalParent.insertBefore(calculator, calcOriginalNext || null); }
  function rememberPlacementEditor() { const editor = document.querySelector('.sky-creator-side-by-side'); if (!editor || placementOriginalParent) return; placementOriginalParent = editor.parentElement; placementOriginalNext = editor.nextSibling; }
  function restorePlacementEditor() { const editor = document.querySelector('.sky-creator-side-by-side'); if (!editor || !placementOriginalParent || editor.parentElement === placementOriginalParent) return; placementOriginalParent.insertBefore(editor, placementOriginalNext || null); }
  function openPlacementEditor() {
    rememberPlacementEditor();
    const editor = document.querySelector('.sky-creator-side-by-side');
    const mount = byId('relphiV4PlacementMount');
    if (!editor || !mount) { status('The placement editor is unavailable.', true); return; }
    setNativeTarget(state.editingSlot);
    setValue('skyCreatorName', state.pendingName, false);
    mount.appendChild(editor);
    editor.hidden = false;
    editor.querySelector('.placement-entry-drawer')?.setAttribute('open', '');
    const form = byId('skyCreatorForm');
    if (form && !form.dataset.relphiLiveSync) {
      form.dataset.relphiLiveSync = 'true';
      let liveTimer = 0;
      const sync = function (event) {
        if (!event.target.matches('input,select')) return;
        clearTimeout(liveTimer);
        liveTimer = setTimeout(function () {
          if (byId('skyCreatorPlacementBody')?.value && byId('skyCreatorPlacementSign')?.value) byId('skyCreatorPlacementAdd')?.click();
        }, 120);
      };
      form.addEventListener('input', sync);
      form.addEventListener('change', sync);
    }
    byId('skyCreatorPaste')?.focus();
  }
  function openCalculator(clearFields) {
    rememberCalculator();
    const calculator = document.querySelector('.sky-calc-drawer');
    const mount = byId('relphiV4CalcMount');
    const choices = byId('relphiV4CalcChoices');
    if (!calculator || !mount) { status('The calculator is unavailable.', true); return; }
    if (choices) choices.hidden = true;
    mount.hidden = false; mount.appendChild(calculator); calculator.hidden = false; calculator.open = true; calculator.setAttribute('open', '');
    setNativeTarget(state.editingSlot); setValue('skyCalcName', state.pendingName, false);
    if (clearFields) ['skyCalcDateTime','skyCalcTimeZone','skyCalcLocation','skyCalcLatitude','skyCalcLongitude'].forEach(function (id) { setValue(id, '', false); });
    else {
      const payload = recoverCalculationProfile(state.editingSlot === 'skyB' ? state.skyB : state.skyA);
      const profile = payload?.calcProfile || {};
      setValue('skyCalcDateTime', profile.dateTime || '', false);
      setValue('skyCalcTimeZone', profile.timeZone || '', false);
      setValue('skyCalcLocation', profile.location || '', false);
      setValue('skyCalcLatitude', profile.latitude || '', false);
      setValue('skyCalcLongitude', profile.longitude || '', false);
      setValue('skyCalcHouseSystem', profile.houseSystem || 'whole-sign', false);
    }
    byId('skyCalcDateTime')?.focus();
  }
  function loadRecord(record, slot) {
    if (!record || !hasPlacements(record)) return Promise.reject(new Error('Saved sky has no usable placements'));
    setNativeTarget(slot);
    const payload = recoverCalculationProfile(payloadFromRecord(record));
    writeJson(slotKey(slot), payload);
    return Promise.resolve(payload);
  }
  function localDateTimeValueInZone(date, timeZone) {
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone:timeZone || undefined, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(date).filter(function (part) { return part.type !== 'literal'; }).map(function (part) { return [part.type, part.value]; }));
      return parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute;
    } catch (_) { return localDateTimeValue(date); }
  }
  function calculationProfileFromFields(payload) {
    return {
      dateTime:byId('skyCalcDateTime')?.value || '',
      latitude:byId('skyCalcLatitude')?.value || '',
      longitude:byId('skyCalcLongitude')?.value || '',
      location:byId('skyCalcLocation')?.value || '',
      timeZone:byId('skyCalcTimeZone')?.value || '',
      houseSystem:byId('skyCalcHouseSystem')?.value || 'whole-sign',
      name:String(payload?.name || state.pendingName || '')
    };
  }
  function recoverCalculationProfile(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    const existing = payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
    if (existing.dateTime) return payload;
    const notes = String(payload.notes || '');
    const instantMatch = notes.match(/Motion state sampled around\s+(\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?Z)/i);
    const coordinates = notes.match(/latitude\s+(-?\d+(?:\.\d+)?)\s+and longitude\s+(-?\d+(?:\.\d+)?)/i);
    const zone = notes.match(/Time zone:\s*([^\.]+)\./i)?.[1]?.trim() || existing.timeZone || '';
    const location = notes.match(/Location:\s*(.+?)\.\s*Time zone:/i)?.[1]?.trim() || existing.location || '';
    const instant = instantMatch ? new Date(instantMatch[1]) : null;
    if (!instant || Number.isNaN(instant.getTime())) return payload;
    return { ...payload, calcProfile:{ ...existing, dateTime:localDateTimeValueInZone(instant, zone), latitude:coordinates?.[1] || existing.latitude || '', longitude:coordinates?.[2] || existing.longitude || '', location, timeZone:zone, houseSystem:existing.houseSystem || 'whole-sign', name:String(payload.name || existing.name || '') } };
  }
  function finishSlot(payload) {
    if (!hasPlacements(payload)) return;
    payload = { ...payload, name:state.pendingName || automaticName(payload) };
    payload = state.calculating
      ? { ...payload, calcProfile:calculationProfileFromFields(payload) }
      : recoverCalculationProfile(payload);
    writeJson(slotKey(state.editingSlot), payload);
    if (state.editingSlot === 'skyA') { state.skyA = payload; if (hasPlacements(state.skyB)) writeJson(SLOT_KEYS.skyB, state.skyB); state.step = hasPlacements(state.skyB) ? 'completeBoth' : 'completeA'; }
    else { state.skyB = payload; if (state.skyA) writeJson(SLOT_KEYS.skyA, state.skyA); state.step = 'completeBoth'; }
    state.calculating = false; closeCalculator(); render();
  }
  function watchCalculation() {
    clearTimeout(pollTimer);
    const started = Date.now();
    const check = function () {
      if (!state.calculating) return;
      const nativeStatus = byId('skyCalcStatus')?.textContent.trim() || '';
      const calculationFinished = /^Calculated\b/i.test(nativeStatus);
      if (calculationFinished) byId(state.editingSlot === 'skyB' ? 'saveCurrentSky' : 'saveChart')?.click();
      const payload = readJson(slotKey(state.editingSlot), null);
      if (hasPlacements(payload) && (calculationFinished || signature(payload) !== state.beforeSignature)) return finishSlot(payload);
      if (Date.now() - started > 500 && /^(Could not|Enter |Choose |Location |Date |Time zone)/i.test(nativeStatus)) { state.calculating = false; saveState(); status(nativeStatus, true); return; }
      if (Date.now() - started > 60000) { state.calculating = false; saveState(); status('The calculation did not finish within one minute. The existing sky was not replaced.', true); return; }
      pollTimer = setTimeout(check, 150);
    };
    pollTimer = setTimeout(check, 100);
  }
  function prepareRun() { setNativeTarget(state.editingSlot); state.pendingName = byId('skyCalcName')?.value.trim() || ''; state.beforeSignature = signature(readJson(slotKey(state.editingSlot), null)); state.calculating = true; saveState(); watchCalculation(); }
  function localDateTimeValue(date) { const pad = function (n) { return String(n).padStart(2, '0'); }; return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()); }
  function runHereNow() {
    setNativeTarget(state.editingSlot);
    setValue('skyCalcName', state.pendingName, false);
    status('Using your current time and location…');
    setValue('skyCalcDateTime', localDateTimeValue(new Date()), false);
    setValue('skyCalcTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone || '', false);
    if (!navigator.geolocation) { state.calculating = false; status('Current location is unavailable. Choose a time and place instead.', true); return; }
    navigator.geolocation.getCurrentPosition(function (position) {
      setValue('skyCalcLatitude', position.coords.latitude.toFixed(6), false); setValue('skyCalcLongitude', position.coords.longitude.toFixed(6), false); setValue('skyCalcLocation', 'Current location', false); setNativeTarget(state.editingSlot); byId('skyCalcRun')?.click();
    }, function () { state.calculating = false; status('Location permission was unavailable. Choose a time and place instead.', true); }, { enableHighAccuracy:false, timeout:12000, maximumAge:60000 });
  }
  function applyExternalHandoff() {
    if (!externalHandoff) return;
    const replacingExisting = hasPlacements(state.editingSlot === 'skyA' ? state.skyA : state.skyB);
    if (state.editingSlot === 'skyB') activateComparison();
    openCalculator(false);
    setValue('skyCalcDateTime', externalHandoff.dateTime, false);
    setValue('skyCalcLatitude', externalHandoff.latitude, false);
    setValue('skyCalcLongitude', externalHandoff.longitude, false);
    setValue('skyCalcTimeZone', externalHandoff.timeZone, false);
    setValue('skyCalcLocation', externalHandoff.location, false);
    setValue('skyCalcName', externalHandoff.name, false);
    const cleanUrl = new URL(location.href);
    ['datetime','date','lat','lon','tz','loc','name','calc','source'].forEach(function (key) { cleanUrl.searchParams.delete(key); });
    history.replaceState(history.state, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    if (replacingExisting) {
      status('The supplied date, time, and place are loaded. Sky A and Sky B are already occupied, so review the values and run the calculation when you are ready to replace this sky.');
      return;
    }
    status('Creating a sky from the supplied date, time, and placeâ€¦');
    if (externalHandoff.autoRun && externalHandoff.latitude && externalHandoff.longitude) setTimeout(function () { byId('skyCalcRun')?.click(); }, 0);
  }
  function openAdvanced(slot) {
    const payload = slot === 'skyB' ? state.skyB : state.skyA;
    if (!payload) return;
    state.editingSlot = slot;
    state.pendingName = payload.name || '';
    setNativeTarget(slot);
    state.step = slot === 'skyA' ? 'methodA' : 'methodB';
    render();
  }
  function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    const edit = event.target.closest('[data-edit]')?.dataset.edit;
    const clear = event.target.closest('[data-clear]')?.dataset.clear;
    const loadName = event.target.closest('[data-load-name]')?.dataset.loadName;
    if (loadName) {
      const record = recordByName(loadName);
      if (!record) return status('That saved sky is no longer available.', true);
      state.pendingName = record.name;
      status('Loading “' + record.name + '”…');
      return loadRecord(record, state.editingSlot).then(finishSlot).catch(function (error) { status(error.message + '.', true); });
    }
    if (edit) return openAdvanced(edit);
    if (clear) {
      if (clear === 'skyA') { state.skyA = null; state.skyB = null; state.step = 'nameA'; state.pendingName = ''; removeJson(SLOT_KEYS.skyA); removeJson(SLOT_KEYS.skyB); }
      else { state.skyB = null; state.step = 'completeA'; removeJson(SLOT_KEYS.skyB); }
      return render();
    }
    if (!action) return;
    if (action === 'toggle-name-menu') {
      const menu = byId('relphiV4NameMenu');
      const toggle = event.target.closest('[data-action="toggle-name-menu"]');
      if (!menu || !toggle) return;
      menu.hidden = !menu.hidden;
      toggle.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
      return;
    }
    if (action === 'start-over') { if (!window.confirm('Start over? This clears the current Sky A and Sky B. Saved skies will not be deleted.')) return; removeJson(SLOT_KEYS.skyA); removeJson(SLOT_KEYS.skyB); clearState(); location.reload(); return; }
    if (action === 'quick-now') {
      state.pendingName = '';
      state.step = state.editingSlot === 'skyA' ? 'calculateA' : 'calculateB';
      render();
      return setTimeout(runHereNow, 0);
    }
    if (action === 'quick-birth') {
      const record = recordByName('My birth chart');
      if (record) { state.pendingName = record.name; return loadRecord(record, state.editingSlot).then(finishSlot).catch(function (error) { status(error.message + '.', true); }); }
      state.pendingName = 'My birth chart';
      state.step = state.editingSlot === 'skyA' ? 'calculateA' : 'calculateB';
      render();
      return setTimeout(function () { openCalculator(true); }, 0);
    }
    if (action === 'continue-name') {
      const input = byId('relphiV4Name');
      state.pendingName = input?.value.trim() || '';
      const record = state.pendingName ? recordByName(state.pendingName) : null;
      if (record) { state.step = state.editingSlot === 'skyA' ? 'nameConflictA' : 'nameConflictB'; return render(); }
      state.step = state.editingSlot === 'skyA' ? 'methodA' : 'methodB'; return render();
    }
    if (action === 'back-name') { state.step = state.editingSlot === 'skyA' ? 'nameA' : 'nameB'; return render(); }
    if (action === 'saved') { state.step = state.editingSlot === 'skyA' ? 'chooseSavedA' : 'chooseSavedB'; return render(); }
    if (action === 'load-conflict') {
      const record = recordByName(state.pendingName);
      if (!record) return status('That saved sky is no longer available.', true);
      status('Loading “' + record.name + '”…');
      return loadRecord(record, state.editingSlot).then(finishSlot).catch(function (error) { status(error.message + '.', true); });
    }
    if (action === 'create-copy') {
      state.pendingName = event.target.closest('[data-copy-name]')?.dataset.copyName || nextAvailableName(state.pendingName);
      state.step = state.editingSlot === 'skyA' ? 'methodA' : 'methodB';
      return render();
    }
    if (action === 'placements') { state.step = state.editingSlot === 'skyA' ? 'placementsA' : 'placementsB'; return render(); }
    if (action === 'calculate') { state.step = state.editingSlot === 'skyA' ? 'calculateA' : 'calculateB'; return render(); }
    if (action === 'back-method') {
      closeCalculator();
      const editingExisting = hasPlacements(state.editingSlot === 'skyA' ? state.skyA : state.skyB);
      state.step = editingExisting ? (hasPlacements(state.skyB) ? 'completeBoth' : 'completeA') : (state.editingSlot === 'skyA' ? 'methodA' : 'methodB');
      return render();
    }
    if (action === 'load-saved') {
      const record = recordByName(byId('relphiV4SavedSelect')?.value || '');
      if (!record) return status('Choose a saved sky.', true);
      status('Loading “' + record.name + '”…');
      return loadRecord(record, state.editingSlot).then(finishSlot).catch(function (error) { status(error.message + '.', true); });
    }
    if (action === 'manual') return openCalculator(!hasPlacements(state.editingSlot === 'skyA' ? state.skyA : state.skyB));
    if (action === 'here-now') return runHereNow();
    if (action === 'finish-placements') {
      const kind = nativeKind(state.editingSlot);
      const editedName = byId('relphiV4PlacementName')?.value.trim() || '';
      setValue('skyCreatorName', editedName, false);
      byId('skyCreatorSaveWizard')?.click();
      byId(state.editingSlot === 'skyB' ? 'saveCurrentSky' : 'saveChart')?.click();
      const payload = readJson(slotKey(state.editingSlot), null);
      if (!hasPlacements(payload)) return status('Add at least one valid placement before continuing.', true);
      state.pendingName = editedName;
      return finishSlot(payload);
    }
    if (action === 'add-comparison') { activateComparison(); state.editingSlot = 'skyB'; state.pendingName = ''; state.step = 'nameB'; return render(); }
    if (action === 'back-complete') { state.step = state.skyB ? 'completeBoth' : 'completeA'; return render(); }
  }
  function installStyles() {
    if (byId('relphiV4Styles')) return;
    const style = document.createElement('style');
    style.id = 'relphiV4Styles';
    style.textContent = '.relphi-v4-root{margin:1.5rem auto;max-width:1400px}.relphi-v4-toolbar{display:flex;justify-content:flex-end;margin-bottom:1rem}.relphi-v4-toolbar button,.relphi-v4-root button{appearance:none;border:1px solid rgba(220,31,24,.42);border-radius:999px;background:#fff;color:#111;font:inherit;font-weight:700;padding:.8rem 1.25rem;min-height:48px}.relphi-v4-root button.primary{background:#e72018;color:#fff;border-color:#e72018;box-shadow:0 12px 24px rgba(231,32,24,.18)}.relphi-v4-card,.relphi-v4-complete{background:#fffaf4;border:1px solid #e6ddd4;border-radius:28px;padding:2rem}.relphi-v4-card h2{margin:.25rem 0 .5rem}.relphi-v4-card label{display:grid;gap:.45rem;margin:1.25rem 0;font-weight:700}.relphi-v4-card input,.relphi-v4-card select{font:inherit;padding:.9rem 1rem;border:1px solid #d8d1cb;border-radius:18px;background:#fff}.relphi-v4-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin:1.5rem 0}.relphi-v4-choice-grid .choice{border-radius:28px;min-height:150px;text-align:left;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}.relphi-v4-choice-grid strong{font-size:1.2rem}.relphi-v4-choice-grid span{font-weight:400;color:#777;margin-top:.35rem}.relphi-v4-actions{display:flex;gap:.75rem;justify-content:flex-end}.relphi-v4-complete{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.relphi-v4-sky-panel{--sky-accent:#dc1f18;background:#fff;border:1px solid color-mix(in srgb,var(--sky-accent) 30%,#ddd);border-top:5px solid var(--sky-accent);border-radius:24px;padding:1.5rem;display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.relphi-v4-sky-panel.is-sky-b{--sky-accent:#3166e2}.relphi-v4-sky-panel .eyebrow{color:var(--sky-accent)}.relphi-v4-sky-panel h3{margin:.25rem 0}.relphi-v4-panel-copy{min-width:0;flex:1}.relphi-v4-placement-preview{list-style:none;margin:.9rem 0 0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem .9rem}.relphi-v4-placement-preview li{display:flex;justify-content:space-between;gap:.5rem;font-size:.88rem;border-bottom:1px solid #eee7df;padding:.25rem 0}.relphi-v4-placement-preview span{color:#5f5751}.relphi-v4-placement-preview .more{color:#6b625d;border:0}.relphi-v4-panel-actions{display:flex;gap:.65rem}.add-comparison{margin-top:1rem}.relphi-v4-status{background:#fff;border-left:4px solid #e72018;border-radius:16px;padding:1rem 1.25rem}.relphi-v4-status.is-error{color:#8b1713}.eyebrow{text-transform:uppercase;letter-spacing:.12em;color:#e45d55;font-weight:800;font-size:.8rem}#skyBuilderModeSwitch{display:none!important}@media(max-width:760px){.relphi-v4-choice-grid,.relphi-v4-complete{grid-template-columns:1fr}.relphi-v4-sky-panel{align-items:flex-start;flex-direction:column}.relphi-v4-panel-actions{width:100%}.relphi-v4-panel-actions button{flex:1}.relphi-v4-card,.relphi-v4-complete{padding:1.25rem}}';
    style.textContent += '.relphi-v4-choice-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.relphi-v4-placement-mount .sky-creator-side-by-side{margin:1rem 0;display:grid!important}.relphi-v4-placement-card .sky-paste-panel,.relphi-v4-placement-card .placement-entry-drawer{background:#fff}';
    style.textContent += '.relphi-v4-combobox{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.5rem;margin:0!important}.relphi-v4-combobox input{min-width:0}.relphi-v4-combobox-toggle{border-radius:16px!important;min-width:52px;padding:.6rem!important;font-size:1.35rem}.relphi-v4-name-menu{margin:-.75rem 0 1.25rem;padding:.5rem;background:#fff;border:1px solid #d8d1cb;border-radius:18px;box-shadow:0 16px 36px rgba(30,22,18,.12);max-height:19rem;overflow:auto}.relphi-v4-name-menu>button{width:100%;border:0!important;border-radius:12px!important;display:flex;justify-content:space-between;gap:1rem;text-align:left;box-shadow:none!important}.relphi-v4-name-menu>button:hover,.relphi-v4-name-menu>button:focus-visible{background:#fff2ef}.relphi-v4-name-menu>button span{color:#777;font-weight:500}.relphi-v4-name-menu p{margin:.6rem;color:#777}.relphi-v4-conflict-choice{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin:1.5rem 0}.relphi-v4-conflict-choice .choice{min-height:145px;text-align:left;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;border-radius:24px}.relphi-v4-conflict-choice .choice span{font-weight:400;color:#777;margin-top:.35rem}';
    style.textContent += '.relphi-v4-quick-start{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin:1.15rem 0}.relphi-v4-quick-start .choice{min-height:92px;border-radius:20px;text-align:left;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}.relphi-v4-quick-start .choice span{margin-top:.25rem;font-weight:500;font-size:.88rem;opacity:.78}.relphi-v4-quick-start .primary span{color:inherit;opacity:.9}.relphi-v4-or{display:flex;align-items:center;gap:.75rem;color:#857b74;font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em}.relphi-v4-or:before,.relphi-v4-or:after{content:"";height:1px;background:#e6ddd4;flex:1}.relphi-v4-field-label{display:flex;align-items:baseline;gap:.45rem}.relphi-v4-field-label small{color:#857b74;font-size:.78em;font-weight:650}@media(max-width:620px){.relphi-v4-quick-start{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }
  function install() {
    installStyles();
    byId('relphiPreviewLoadFailure')?.remove();
    const oldWizard = byId('relphiSkyWizard'); if (oldWizard) oldWizard.remove();
    root = document.createElement('section'); root.className = 'relphi-v4-root'; root.id = 'relphiSkyBuilderV4';
    const hero = document.querySelector('.sky-chart-hero-panel'); (hero || document.body).insertAdjacentElement('afterend', root);
    root.addEventListener('click', handleClick);
    document.addEventListener('click', function (event) { if (!event.target.closest('#skyCalcRun')) return; if (!state.calculating) prepareRun(); setNativeTarget(state.editingSlot); }, true);
    if (state.skyA && hasPlacements(state.skyA)) writeJson(SLOT_KEYS.skyA, state.skyA);
    if (state.skyB && hasPlacements(state.skyB)) writeJson(SLOT_KEYS.skyB, state.skyB);
    if (externalHandoff) {
      state.editingSlot = !hasPlacements(state.skyA) ? 'skyA' : 'skyB';
      state.pendingName = externalHandoff.name;
      state.step = state.editingSlot === 'skyA' ? 'calculateA' : 'calculateB';
      if (state.editingSlot === 'skyB') activateComparison();
    }
    render();
    setTimeout(function () {
      nativeSyncSignature = '';
      syncNativeSlots(state.skyA, state.skyB);
      if (externalHandoff) setTimeout(applyExternalHandoff, 0);
    }, 0);
    document.dispatchEvent(new CustomEvent('relphi:sky-builder-ready', { detail:{ version:4 } }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true }); else install();
})();
