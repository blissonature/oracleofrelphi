// Unified guided Sky A / Sky B builder used by the PR 56 live preview.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };
  const SNAPSHOT_KEY = 'relphiWizardV3SkyA';
  const RESUME_KEY = 'relphiWizardV3Resume';
  const STAGES = ['relphiV3Name','relphiV3Method','relphiV3Existing','relphiV3Calculate','relphiV3Complete'];

  const flow = {
    kind:'chart',
    name:'',
    skyA:null,
    running:false,
    startedAt:0,
    beforeChartHtml:'',
    beforePaste:'',
    timer:0,
    originalCalcParent:null,
    originalCalcNext:null,
    manualUnlocked:false
  };

  function byId(id) { return document.getElementById(id); }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function removeLocal(key) { try { localStorage.removeItem(key); } catch (_) {} }
  function readSession(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function writeSession(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function removeSession(key) { try { sessionStorage.removeItem(key); } catch (_) {} }
  function setValue(id, value, notify) {
    const field = byId(id);
    if (!field) return;
    field.value = value == null ? '' : String(value);
    if (notify !== false) {
      fire(field, 'input');
      fire(field, 'change');
    }
  }
  function placementEntries(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(function (entry) {
      const placement = entry[1];
      if (!placement || typeof placement !== 'object' || Array.isArray(placement)) return false;
      const degree = placement.degree;
      return String(placement.sign || '').trim() || (degree !== '' && degree !== null && Number.isFinite(Number(degree)));
    }));
  }
  function hasPlacements(payload) {
    return !!Object.keys(placementEntries(payload && (payload.placements || payload))).length;
  }
  function signature(payload) {
    const placements = placementEntries(payload && (payload.placements || payload));
    return Object.keys(placements).sort().map(function (key) {
      const item = placements[key] || {};
      return [key, item.sign || '', item.degree ?? '', item.minute ?? '', item.house ?? '', item.retrograde ?? ''].join(':');
    }).join('|');
  }
  function outputHasPlacements(node) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,180}\d{1,2}°/i.test(node?.textContent || '');
  }
  function slug(value) {
    return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (character) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character];
    });
  }
  function defaultName() {
    const now = new Date();
    const pad = function (number) { return String(number).padStart(2, '0'); };
    return 'Untitled Sky ' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + pad(now.getMinutes());
  }
  function localDateTimeValue(date) {
    const value = date || new Date();
    const pad = function (number) { return String(number).padStart(2, '0'); };
    return value.getFullYear() + '-' + pad(value.getMonth() + 1) + '-' + pad(value.getDate()) + 'T' + pad(value.getHours()) + ':' + pad(value.getMinutes());
  }

  function parsePlacementText(text) {
    const placements = {};
    String(text || '').split(/\r?\n/).forEach(function (line) {
      const clean = line.trim();
      if (!clean) return;
      let match = clean.match(/^\s*([^,]+?)\s*,\s*([A-Za-z]+)\s*,\s*(\d{1,2})\s*°?\s*(\d{1,2})?/i);
      if (!match) match = clean.match(/^\s*(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|Ascendant|MC|Midheaven)\s+([A-Za-z]+)\s+(\d{1,2})\s*°?\s*(\d{1,2})?/i);
      if (!match) return;
      const rawBody = normalize(match[1]).replace(/[^a-z]/g, '');
      const aliases = {
        sun:'Sun', moon:'Moon', mercury:'Mercury', venus:'Venus', mars:'Mars', jupiter:'Jupiter', saturn:'Saturn',
        uranus:'Uranus', neptune:'Neptune', pluto:'Pluto', rising:'Rising', asc:'Rising', ascendant:'Rising',
        mc:'Midheaven', midheaven:'Midheaven'
      };
      const body = aliases[rawBody] || String(match[1] || '').trim();
      const house = clean.match(/(?:in\s+)?(\d{1,2})(?:st|nd|rd|th)?\s*House/i);
      placements[body] = {
        sign:match[2],
        degree:Number(match[3]),
        minute:Number(match[4] || 0),
        house:house ? Number(house[1]) : '',
        retrograde:/\bretrograde\b|℞/i.test(clean)
      };
    });
    return placements;
  }
  function calcProfileFromFields() {
    return {
      dateTime:byId('skyCalcDateTime')?.value || '',
      timeZone:byId('skyCalcTimeZone')?.value || '',
      location:byId('skyCalcLocation')?.value || '',
      latitude:byId('skyCalcLatitude')?.value || '',
      longitude:byId('skyCalcLongitude')?.value || '',
      houseSystem:byId('skyCalcHouseSystem')?.value || 'whole-sign'
    };
  }
  function payloadFromPaste(name) {
    const placements = parsePlacementText(byId('skyCreatorPaste')?.value || '');
    if (!Object.keys(placements).length) return null;
    return {
      name:name,
      notes:byId('skyCreatorNotes')?.value || '',
      placements:placements,
      calcProfile:calcProfileFromFields(),
      savedAt:new Date().toISOString(),
      savedAtLocal:new Date().toLocaleString()
    };
  }

  function records() {
    const stored = readJson(LIBRARY_KEY, []);
    return Array.isArray(stored) ? stored.filter(function (record) {
      return record && String(record.name || '').trim() && Object.keys(placementEntries(record.placements)).length;
    }) : [];
  }
  function recordByName(name) {
    return records().find(function (record) { return normalize(record.name) === normalize(name); }) || null;
  }
  function refreshLibrary(list) {
    const library = Array.isArray(list) ? list : records();
    const select = byId('skyCreatorLibrary');
    if (select) {
      const selected = select.value;
      select.replaceChildren(new Option('Choose saved sky…', ''));
      library.forEach(function (record) { select.appendChild(new Option(record.name, record.id)); });
      if (library.some(function (record) { return record.id === selected; })) select.value = selected;
    }
    const datalist = byId('relphiV3SavedNames');
    if (datalist) {
      datalist.replaceChildren();
      library.forEach(function (record) {
        const option = document.createElement('option');
        option.value = record.name;
        datalist.appendChild(option);
      });
    }
  }
  function upsertRecord(kind, payload) {
    if (!payload || !hasPlacements(payload)) return null;
    const list = records();
    const name = String(payload.name || (kind === 'currentSky' ? 'Sky B' : 'Sky A')).trim();
    const record = {
      id:(kind === 'currentSky' ? 'currentSky' : 'chart') + ':' + (slug(name) || Date.now()),
      kind:kind,
      name:name,
      notes:String(payload.notes || ''),
      placements:placementEntries(payload.placements || payload),
      calcProfile:payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {},
      savedAt:new Date().toISOString(),
      savedAtLocal:new Date().toLocaleString()
    };
    const index = list.findIndex(function (item) { return normalize(item.name) === normalize(name); });
    if (index >= 0) {
      record.id = list[index].id || record.id;
      list[index] = { ...list[index], ...record };
    } else list.unshift(record);
    if (!writeJson(LIBRARY_KEY, list.slice(0, 80))) return null;
    refreshLibrary(list.slice(0, 80));
    return record;
  }
  function payloadFromRecord(record) {
    if (!record) return null;
    return {
      name:record.name,
      notes:record.notes || '',
      placements:placementEntries(record.placements),
      calcProfile:record.calcProfile || {},
      savedAt:record.savedAt || new Date().toISOString(),
      savedAtLocal:record.savedAtLocal || new Date().toLocaleString()
    };
  }

  function inferredName(kind) {
    const payload = readJson(SLOT_KEYS[kind], null);
    const output = kind === 'currentSky' ? byId('currentSkyOutput') : byId('chartOutput');
    const complete = byId('relphiV3Complete');
    const panel = complete?.querySelector('[data-kind="' + kind + '"] h3')?.textContent;
    const saved = records().find(function (record) { return signature(record) === signature(payload); });
    return String(payload?.name || output?.dataset.skyName || panel || saved?.name || (kind === 'currentSky' ? 'Sky B' : 'Sky A')).trim();
  }
  function captureSkyA() {
    let payload = readJson(SLOT_KEYS.chart, null);
    const name = inferredName('chart');
    if (!hasPlacements(payload)) {
      const saved = recordByName(name);
      if (saved) payload = payloadFromRecord(saved);
    }
    if (!hasPlacements(payload)) payload = payloadFromPaste(name);
    if (!hasPlacements(payload)) return null;
    payload.name = name;
    writeJson(SLOT_KEYS.chart, payload);
    upsertRecord('chart', payload);
    const snapshot = { name:name, payload:payload, signature:signature(payload), capturedAt:Date.now() };
    writeSession(SNAPSHOT_KEY, snapshot);
    flow.skyA = snapshot;
    return snapshot;
  }
  function snapshotSkyA() {
    return flow.skyA || readSession(SNAPSHOT_KEY, null) || captureSkyA();
  }

  function ensureWizard() {
    byId('relphiSkyWizard')?.remove();
    const chartPanel = byId('chartPanel');
    const advanced = byId('skyCreatorDrawer');
    if (!chartPanel || !advanced) return null;
    const wizard = document.createElement('section');
    wizard.id = 'relphiSkyWizard';
    wizard.className = 'relphi-v3-wizard';
    wizard.innerHTML = `
      <section id="relphiV3Name" class="relphi-v3-stage">
        <div class="relphi-v3-copy"><p id="relphiV3NameEyebrow" class="eyebrow">First sky</p><h3 id="relphiV3NameHeading">Give this sky an identity</h3><p id="relphiV3NameHelp">Choose a name, or continue to use an automatic Untitled Sky name.</p></div>
        <label for="relphiV3NameInput">Sky name <span class="optional-label">optional</span></label>
        <input id="relphiV3NameInput" type="text" list="relphiV3SavedNames" autocomplete="off" placeholder="Untitled Sky will be supplied">
        <datalist id="relphiV3SavedNames"></datalist>
        <p id="relphiV3NameStatus" class="generated-note" aria-live="polite"></p>
        <div class="relphi-v3-actions"><button id="relphiV3LoadSaved" class="secondary" type="button" hidden>Load saved sky</button><button id="relphiV3Continue" class="primary" type="button">Continue</button></div>
      </section>
      <section id="relphiV3Method" class="relphi-v3-stage" hidden>
        <div class="relphi-v3-copy"><p class="eyebrow">Create the sky</p><h3 id="relphiV3MethodHeading">How will you create this sky?</h3></div>
        <div class="relphi-v3-choice-grid"><button id="relphiV3Existing" class="choice" type="button"><strong>Use existing sky data</strong><span>Load, paste, or build placements.</span></button><button id="relphiV3Calculate" class="choice" type="button"><strong>Calculate a sky</strong><span>Calculate from a time and place.</span></button></div>
        <button id="relphiV3BackName" class="back" type="button">Back</button>
      </section>
      <section id="relphiV3ExistingStage" class="relphi-v3-stage" hidden>
        <div class="relphi-v3-copy"><p class="eyebrow">Existing data</p><h3>Enter or load the placements</h3></div>
        <div class="relphi-v3-choice-grid"><button id="relphiV3Paste" class="choice" type="button"><strong>Type or paste</strong><span>Enter copied placement text.</span></button><button id="relphiV3Form" class="choice" type="button"><strong>Form-field entry</strong><span>Build placements one field at a time.</span></button></div>
        <div class="relphi-v3-actions"><button id="relphiV3BackMethodExisting" class="back" type="button">Back</button><button id="relphiV3UseEntered" class="primary" type="button">Use entered placements</button></div>
        <p id="relphiV3ExistingStatus" class="generated-note" aria-live="polite"></p>
      </section>
      <section id="relphiV3CalculateStage" class="relphi-v3-stage" hidden>
        <div class="relphi-v3-copy"><p class="eyebrow">Calculate</p><h3>Choose the time and place</h3></div>
        <div id="relphiV3CalcChoices" class="relphi-v3-choice-grid"><button id="relphiV3HereNow" class="choice" type="button"><strong>Here and Now</strong><span>Use the current time and your present location.</span></button><button id="relphiV3Manual" class="choice" type="button"><strong>Choose a time and place</strong><span>Enter another date, time, and location.</span></button></div>
        <div id="relphiV3CalcMount" hidden></div>
        <button id="relphiV3BackMethodCalc" class="back" type="button">Back</button>
        <p id="relphiV3CalcStatus" class="generated-note" aria-live="polite"></p>
      </section>
      <section id="relphiV3Complete" class="relphi-v3-stage relphi-v3-complete" hidden>
        <div id="relphiV3SkyGrid" class="relphi-v3-sky-grid"></div>
        <button id="relphiV3AddComparison" class="primary add-comparison" type="button">Add a comparison sky</button>
      </section>`;
    chartPanel.insertBefore(wizard, advanced);
    advanced.hidden = true;
    advanced.removeAttribute('open');
    refreshLibrary(records());
    return wizard;
  }
  function showStage(id) {
    STAGES.forEach(function (stageId) {
      const stage = byId(stageId);
      if (stage) stage.hidden = stageId !== id;
    });
  }
  function showWizardMode() {
    document.body.dataset.skyBuilderUi = 'wizard';
    byId('skyBuilderWizardMode')?.classList.add('is-active');
    byId('skyBuilderAdvancedMode')?.classList.remove('is-active');
    byId('skyBuilderWizardMode')?.setAttribute('aria-pressed', 'true');
    byId('skyBuilderAdvancedMode')?.setAttribute('aria-pressed', 'false');
    const wizard = byId('relphiSkyWizard');
    if (wizard) wizard.hidden = false;
    const advanced = byId('skyCreatorDrawer');
    if (advanced) advanced.hidden = true;
  }
  function showAdvancedMode() {
    document.body.dataset.skyBuilderUi = 'advanced';
    byId('skyBuilderWizardMode')?.classList.remove('is-active');
    byId('skyBuilderAdvancedMode')?.classList.add('is-active');
    byId('skyBuilderWizardMode')?.setAttribute('aria-pressed', 'false');
    byId('skyBuilderAdvancedMode')?.setAttribute('aria-pressed', 'true');
    const wizard = byId('relphiSkyWizard');
    if (wizard) wizard.hidden = true;
    const advanced = byId('skyCreatorDrawer');
    if (advanced) {
      advanced.hidden = false;
      advanced.open = true;
      advanced.setAttribute('open', '');
    }
  }
  function setTarget(kind) {
    setValue('skyCreatorTarget', kind);
    setValue('skyCalcTarget', kind);
  }

  function panelMarkup(kind, payload) {
    const name = String(payload?.name || (kind === 'currentSky' ? 'Sky B' : 'Sky A')).trim();
    const count = Object.keys(placementEntries(payload?.placements || payload)).length || 12;
    return '<article class="relphi-v3-sky-card" data-kind="' + kind + '">' +
      '<div class="relphi-v3-sky-info"><p class="eyebrow">' + (kind === 'currentSky' ? 'Sky B' : 'Sky A') + '</p><h3>' + escapeHtml(name) + '</h3><p>' + count + ' placements</p></div>' +
      '<div class="relphi-v3-sky-actions"><button type="button" data-edit-sky="' + kind + '">Edit</button><button type="button" data-clear-sky="' + kind + '">Clear</button></div>' +
      '</article>';
  }
  function renderComplete() {
    const a = readJson(SLOT_KEYS.chart, null);
    const b = readJson(SLOT_KEYS.currentSky, null);
    if (!hasPlacements(a)) return false;
    const grid = byId('relphiV3SkyGrid');
    if (!grid) return false;
    grid.innerHTML = panelMarkup('chart', a) + (hasPlacements(b) ? panelMarkup('currentSky', b) : '');
    const add = byId('relphiV3AddComparison');
    if (add) add.hidden = hasPlacements(b);
    showStage('relphiV3Complete');
    showWizardMode();
    hideResultSaveButton();
    return true;
  }
  function hideResultSaveButton() {
    const save = byId('skyCreatorSaveWizard');
    if (save) save.hidden = true;
  }

  function updateNameUi() {
    const input = byId('relphiV3NameInput');
    const load = byId('relphiV3LoadSaved');
    if (!input || !load) return;
    const record = recordByName(input.value);
    load.hidden = !record;
    if (record) load.textContent = 'Load saved “' + record.name + '”';
  }
  function startName(kind) {
    flow.kind = kind;
    flow.name = '';
    const input = byId('relphiV3NameInput');
    const eyebrow = byId('relphiV3NameEyebrow');
    const heading = byId('relphiV3NameHeading');
    const help = byId('relphiV3NameHelp');
    const status = byId('relphiV3NameStatus');
    if (input) {
      input.value = '';
      input.placeholder = kind === 'currentSky' ? 'Optional — Untitled Sky will be supplied' : 'Untitled Sky will be supplied';
    }
    if (eyebrow) eyebrow.textContent = kind === 'currentSky' ? 'Comparison sky' : 'First sky';
    if (heading) heading.textContent = kind === 'currentSky' ? 'Give the comparison sky an identity' : 'Give this sky an identity';
    if (help) help.textContent = kind === 'currentSky' ? 'Naming is optional. Continue to use an automatic Untitled Sky name.' : 'Choose a name, or continue to use an automatic Untitled Sky name.';
    if (status) status.textContent = '';
    updateNameUi();
    showStage('relphiV3Name');
    showWizardMode();
    input?.focus();
  }
  function continueName() {
    const input = byId('relphiV3NameInput');
    const name = input?.value.trim() || defaultName();
    if (input) input.value = name;
    flow.name = name;
    const heading = byId('relphiV3MethodHeading');
    if (heading) heading.textContent = 'How will you create “' + name + '”?';
    setValue('skyCalcName', name, false);
    if (flow.kind === 'chart') setValue('skyCreatorName', name, false);
    showStage('relphiV3Method');
  }

  function loadRecord(record, kind) {
    return new Promise(function (resolve, reject) {
      if (!record) return reject(new Error('Saved sky unavailable'));
      const select = byId('skyCreatorLibrary');
      const output = kind === 'currentSky' ? byId('currentSkyOutput') : byId('chartOutput');
      if (!select || !output) return reject(new Error('Native saved-sky controls unavailable'));
      setTarget(kind);
      setValue('skyCreatorName', record.name, false);
      setValue('skyCalcName', record.name, false);
      select.value = record.id;
      fire(select, 'input');
      fire(select, 'change');
      const before = output.innerHTML;
      byId('skyCreatorLoad')?.click();
      const started = Date.now();
      (function wait() {
        const slot = readJson(SLOT_KEYS[kind], null);
        if (hasPlacements(slot) && normalize(slot.name) === normalize(record.name) && (outputHasPlacements(output) || output.innerHTML !== before)) return resolve(true);
        if (Date.now() - started > 10000) return reject(new Error('Saved sky did not render'));
        setTimeout(wait, 120);
      })();
    });
  }
  function loadSavedFromName() {
    const input = byId('relphiV3NameInput');
    const status = byId('relphiV3NameStatus');
    const record = recordByName(input?.value || '');
    if (!record) return;
    if (flow.kind === 'currentSky' && !captureSkyA()) {
      if (status) status.textContent = 'Sky A could not be preserved.';
      return;
    }
    loadRecord(record, flow.kind).then(function () {
      if (flow.kind === 'chart') {
        writeJson(SLOT_KEYS.chart, payloadFromRecord(record));
        renderComplete();
      } else {
        writeJson(SLOT_KEYS.currentSky, payloadFromRecord(record));
        restoreBoth(readJson(SLOT_KEYS.chart, null), payloadFromRecord(record));
      }
    }).catch(function () {
      if (status) status.textContent = 'The saved sky could not be loaded.';
    });
  }

  function openAdvancedExisting(mode) {
    setTarget(flow.kind);
    if (flow.kind === 'currentSky') {
      const snapshot = snapshotSkyA();
      if (snapshot) setValue('skyCreatorName', snapshot.name, false);
    } else setValue('skyCreatorName', flow.name, false);
    showAdvancedMode();
    if (mode === 'paste') byId('skyCreatorPaste')?.focus();
    else byId('skyCreatorForm')?.querySelector('input,select,button')?.focus();
  }
  function useEnteredPlacements() {
    const status = byId('relphiV3ExistingStatus');
    const payload = payloadFromPaste(flow.name || defaultName());
    if (!payload) {
      if (status) status.textContent = 'Enter placements in the Advanced editor first.';
      showAdvancedMode();
      return;
    }
    payload.name = flow.name || defaultName();
    if (flow.kind === 'currentSky') {
      const a = snapshotSkyA();
      if (!a) {
        if (status) status.textContent = 'Sky A could not be preserved.';
        return;
      }
      writeJson(SLOT_KEYS.chart, a.payload);
      writeJson(SLOT_KEYS.currentSky, payload);
      upsertRecord('chart', a.payload);
      upsertRecord('currentSky', payload);
      restoreBoth(a.payload, payload);
    } else {
      writeJson(SLOT_KEYS.chart, payload);
      upsertRecord('chart', payload);
      const record = recordByName(payload.name);
      loadRecord(record, 'chart').finally(renderComplete);
    }
  }

  function rememberCalculatorPosition() {
    const calculator = document.querySelector('.sky-calc-drawer');
    if (!calculator || flow.originalCalcParent) return;
    flow.originalCalcParent = calculator.parentElement;
    flow.originalCalcNext = calculator.nextSibling;
  }
  function closeCalculator() {
    const calculator = document.querySelector('.sky-calc-drawer');
    const mount = byId('relphiV3CalcMount');
    if (calculator) {
      calculator.open = false;
      calculator.hidden = true;
      calculator.removeAttribute('open');
      if (flow.originalCalcParent && calculator.parentElement !== flow.originalCalcParent) {
        flow.originalCalcParent.insertBefore(calculator, flow.originalCalcNext || null);
      }
    }
    if (mount) mount.hidden = true;
    const choices = byId('relphiV3CalcChoices');
    if (choices) choices.hidden = false;
  }
  function openManualCalculator() {
    rememberCalculatorPosition();
    const calculator = document.querySelector('.sky-calc-drawer');
    const mount = byId('relphiV3CalcMount');
    const choices = byId('relphiV3CalcChoices');
    if (!calculator || !mount) return;
    if (choices) choices.hidden = true;
    mount.hidden = false;
    mount.appendChild(calculator);
    calculator.hidden = false;
    calculator.open = true;
    calculator.setAttribute('open', '');
    flow.manualUnlocked = false;
    clearManualFields();
    calculator.addEventListener('pointerdown', function () { flow.manualUnlocked = true; }, { once:true, capture:true });
    calculator.addEventListener('keydown', function () { flow.manualUnlocked = true; }, { once:true, capture:true });
    [50, 150, 350, 700, 1200].forEach(function (delay) {
      setTimeout(function () { if (!flow.manualUnlocked) clearManualFields(); }, delay);
    });
    setValue('skyCalcName', flow.name || defaultName(), false);
    setValue('skyCalcTarget', 'chart', false);
    byId('skyCalcDateTime')?.focus();
  }
  function clearManualFields() {
    ['skyCalcDateTime','skyCalcTimeZone','skyCalcLocation','skyCalcLatitude','skyCalcLongitude'].forEach(function (id) { setValue(id, ''); });
    const useHours = byId('skyCalcUsePlanetaryHours');
    if (useHours) useHours.checked = false;
    const status = byId('skyCalcStatus');
    if (status) status.textContent = 'Enter the date, time, and location for this sky.';
  }

  function prepareCalculation() {
    if (flow.kind === 'currentSky') {
      const a = captureSkyA();
      if (!a) throw new Error('Sky A could not be preserved.');
    }
    flow.name = flow.name || defaultName();
    flow.running = true;
    flow.startedAt = Date.now();
    flow.beforeChartHtml = byId('chartOutput')?.innerHTML || '';
    flow.beforePaste = byId('skyCreatorPaste')?.value || '';
    setValue('skyCalcTarget', 'chart', false);
    setValue('skyCalcName', flow.name, false);
    const status = byId('skyCalcStatus');
    if (status) status.textContent = 'Calculating…';
    setCalcStatus(flow.kind === 'currentSky' ? 'Calculating Sky B…' : 'Calculating the sky…');
    scheduleCalculationCheck();
  }
  function setCalcStatus(message) {
    const status = byId('relphiV3CalcStatus');
    if (status) status.textContent = message;
  }
  function candidateCalculatedPayload() {
    const chart = readJson(SLOT_KEYS.chart, null);
    const current = readJson(SLOT_KEYS.currentSky, null);
    const pasted = payloadFromPaste(flow.name);
    if (flow.kind === 'chart') {
      if (hasPlacements(chart)) return { ...chart, name:flow.name };
      if (hasPlacements(pasted)) return { ...pasted, name:flow.name };
      return null;
    }
    const a = snapshotSkyA();
    const aSignature = a?.signature || '';
    if (hasPlacements(current) && signature(current) !== aSignature) return { ...current, name:flow.name };
    if (hasPlacements(chart) && signature(chart) !== aSignature) return { ...chart, name:flow.name };
    if (hasPlacements(pasted) && signature(pasted) !== aSignature) return { ...pasted, name:flow.name };
    return null;
  }
  function calculationLooksDone() {
    const status = byId('skyCalcStatus')?.textContent || '';
    const pasteChanged = (byId('skyCreatorPaste')?.value || '') !== flow.beforePaste;
    const chartChanged = (byId('chartOutput')?.innerHTML || '') !== flow.beforeChartHtml;
    return /^Calculated Sky for\b/i.test(status.trim()) || pasteChanged || chartChanged;
  }
  function scheduleCalculationCheck() {
    window.clearTimeout(flow.timer);
    const check = function () {
      if (!flow.running) return;
      const payload = candidateCalculatedPayload();
      if (payload && calculationLooksDone()) {
        finishCalculatedPayload(payload);
        return;
      }
      if (Date.now() - flow.startedAt > 25000) {
        flow.running = false;
        setCalcStatus('The calculation did not finish. Your existing sky was left unchanged.');
        const choices = byId('relphiV3CalcChoices');
        if (choices) choices.hidden = false;
        return;
      }
      flow.timer = window.setTimeout(check, 120);
    };
    flow.timer = window.setTimeout(check, 80);
  }
  function finishCalculatedPayload(payload) {
    if (!flow.running) return;
    flow.running = false;
    window.clearTimeout(flow.timer);
    payload.name = flow.name || defaultName();
    if (flow.kind === 'currentSky') {
      const a = snapshotSkyA();
      if (!a?.payload) {
        setCalcStatus('Sky A could not be restored.');
        return;
      }
      writeJson(SLOT_KEYS.chart, a.payload);
      writeJson(SLOT_KEYS.currentSky, payload);
      upsertRecord('chart', a.payload);
      upsertRecord('currentSky', payload);
      writeSession(RESUME_KEY, { skyA:a.name, skyB:payload.name, savedAt:Date.now() });
      closeCalculator();
      const url = new URL(location.href);
      url.searchParams.set('v3resume', String(Date.now()));
      location.replace(url.toString());
    } else {
      writeJson(SLOT_KEYS.chart, payload);
      upsertRecord('chart', payload);
      closeCalculator();
      const record = recordByName(payload.name);
      loadRecord(record, 'chart').finally(renderComplete);
    }
  }

  function runHereNow() {
    flow.name = flow.name || defaultName();
    try { prepareCalculation(); }
    catch (error) { setCalcStatus(error.message); return; }
    setCalcStatus('Finding your current location…');
    setValue('skyCalcDateTime', localDateTimeValue(new Date()), false);
    setValue('skyCalcTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone || '', false);
    if (!navigator.geolocation) {
      flow.running = false;
      setCalcStatus('Current location is unavailable. Choose a time and place instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(function (position) {
      setValue('skyCalcLatitude', position.coords.latitude.toFixed(6), false);
      setValue('skyCalcLongitude', position.coords.longitude.toFixed(6), false);
      setValue('skyCalcLocation', 'Current location', false);
      setCalcStatus(flow.kind === 'currentSky' ? 'Calculating Sky B…' : 'Calculating the sky…');
      byId('skyCalcRun')?.click();
    }, function () {
      flow.running = false;
      window.clearTimeout(flow.timer);
      setCalcStatus('Current location permission was not available. Choose a time and place instead.');
      const choices = byId('relphiV3CalcChoices');
      if (choices) choices.hidden = false;
    }, { enableHighAccuracy:false, timeout:12000, maximumAge:60000 });
  }

  function activateComparisonMode() {
    const button = document.querySelector('[data-sky-chart-mode="compare"], [data-sky-chart-mode="synastry"], [data-sky-chart-mode="transit"]');
    button?.click();
  }
  function restoreBoth(aPayload, bPayload) {
    const aRecord = upsertRecord('chart', aPayload);
    const bRecord = upsertRecord('currentSky', bPayload);
    if (!aRecord || !bRecord) {
      setCalcStatus('Both sky records could not be prepared.');
      return;
    }
    writeJson(SLOT_KEYS.chart, aPayload);
    writeJson(SLOT_KEYS.currentSky, bPayload);
    activateComparisonMode();
    loadRecord(aRecord, 'chart').then(function () {
      activateComparisonMode();
      return loadRecord(bRecord, 'currentSky');
    }).then(function () {
      writeJson(SLOT_KEYS.chart, aPayload);
      writeJson(SLOT_KEYS.currentSky, bPayload);
      const current = byId('currentSkyOutput');
      if (current) {
        current.hidden = false;
        current.removeAttribute('hidden');
        current.dataset.skyName = bPayload.name;
      }
      const chart = byId('chartOutput');
      if (chart) chart.dataset.skyName = aPayload.name;
      closeCalculator();
      removeSession(RESUME_KEY);
      removeSession(SNAPSHOT_KEY);
      flow.skyA = null;
      renderComplete();
      window.dispatchEvent(new CustomEvent('relphi:sky-b-ready', { detail:{ skyA:aPayload.name, skyB:bPayload.name } }));
      window.dispatchEvent(new Event('resize'));
    }).catch(function () {
      writeJson(SLOT_KEYS.chart, aPayload);
      writeJson(SLOT_KEYS.currentSky, bPayload);
      closeCalculator();
      setCalcStatus('Both skies were saved, but the comparison wheel could not be restored.');
      renderComplete();
    });
  }
  function resumeComparison() {
    const resume = readSession(RESUME_KEY, null);
    if (!resume?.skyA || !resume?.skyB) return false;
    const aRecord = recordByName(resume.skyA);
    const bRecord = recordByName(resume.skyB);
    if (!aRecord || !bRecord) return false;
    const aPayload = payloadFromRecord(aRecord);
    const bPayload = payloadFromRecord(bRecord);
    window.setTimeout(function () { restoreBoth(aPayload, bPayload); }, 350);
    return true;
  }

  function editSky(kind) {
    setTarget(kind);
    const payload = readJson(SLOT_KEYS[kind], null);
    if (payload?.name) {
      setValue('skyCreatorName', payload.name, false);
      setValue('skyCalcName', payload.name, false);
    }
    showAdvancedMode();
    byId('skyCreatorName')?.focus();
  }
  function clearSky(kind) {
    const label = kind === 'currentSky' ? 'Sky B' : 'Sky A';
    if (!window.confirm('Clear ' + label + ' from the current workspace? Saved skies will not be deleted.')) return;
    if (kind === 'chart') {
      removeLocal(SLOT_KEYS.chart);
      removeLocal(SLOT_KEYS.currentSky);
      removeSession(SNAPSHOT_KEY);
      removeSession(RESUME_KEY);
      location.reload();
      return;
    }
    removeLocal(SLOT_KEYS.currentSky);
    const current = byId('currentSkyOutput');
    if (current) {
      current.innerHTML = '';
      current.hidden = true;
    }
    renderComplete();
  }
  function startOver() {
    if (!window.confirm('Start over? This clears Sky A and Sky B from the current workspace. Saved skies will not be deleted.')) return;
    removeLocal(SLOT_KEYS.chart);
    removeLocal(SLOT_KEYS.currentSky);
    removeSession(SNAPSHOT_KEY);
    removeSession(RESUME_KEY);
    const url = new URL(location.href);
    url.searchParams.set('reset', String(Date.now()));
    location.replace(url.toString());
  }

  function installStyles() {
    if (byId('relphiV3Styles')) return;
    const style = document.createElement('style');
    style.id = 'relphiV3Styles';
    style.textContent = `
      #relphiSkyWizard{width:100%;max-width:none;margin-top:1rem}
      .relphi-v3-stage{width:100%;padding:1.5rem;border:1px solid rgba(0,0,0,.12);border-radius:26px;background:#fffaf5;box-shadow:0 10px 30px rgba(0,0,0,.045)}
      .relphi-v3-stage[hidden]{display:none!important}
      .relphi-v3-copy{margin-bottom:1rem}.relphi-v3-copy h3{margin:.2rem 0 .35rem;font-size:1.55rem}.relphi-v3-copy p{margin:.2rem 0}
      .relphi-v3-stage label{display:block;font-weight:700;margin-bottom:.45rem}.optional-label{font-weight:400;color:#777}
      #relphiV3NameInput{width:100%;min-height:50px;padding:.8rem 1rem;border:1px solid rgba(0,0,0,.2);border-radius:16px;font:inherit;background:#fff}
      .relphi-v3-actions{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-top:1rem}
      .relphi-v3-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
      .relphi-v3-choice-grid .choice{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;min-height:140px;padding:1.25rem 1.35rem;text-align:left;border-radius:24px;background:#fff}
      .relphi-v3-choice-grid .choice strong{font-size:1.18rem}.relphi-v3-choice-grid .choice span{margin-top:.35rem;color:#777;font-weight:400}
      #relphiSkyWizard button,.sky-calc-drawer button,#skyCreatorDrawer button{appearance:none;-webkit-appearance:none;font:inherit;font-weight:700;line-height:1.15;min-height:44px;padding:.72rem 1.1rem;border:1px solid rgba(220,31,24,.38);border-radius:999px;background:#fff;color:#111;box-shadow:0 4px 13px rgba(0,0,0,.06);cursor:pointer}
      #relphiSkyWizard button:hover,.sky-calc-drawer button:hover,#skyCreatorDrawer button:hover{border-color:#dc1f18;transform:translateY(-1px)}
      #relphiSkyWizard .primary,.sky-calc-drawer #skyCalcRun{background:#e51d18;color:#fff;border-color:#e51d18;box-shadow:0 9px 24px rgba(229,29,24,.22)}
      #relphiSkyWizard .back{border:0;box-shadow:none;background:transparent;color:#555;text-decoration:underline;padding:.45rem .15rem;margin-top:1rem;min-height:auto}
      .generated-note:empty{display:none}.generated-note{max-width:760px}
      #relphiV3CalcMount{width:100%;margin-top:1rem}#relphiV3CalcMount[hidden]{display:none!important}
      #relphiV3CalcMount .sky-calc-drawer,#relphiV3CalcMount .sky-calc-panel{display:block!important;width:100%!important;max-width:none!important}
      #relphiV3CalcMount .sky-calc-drawer>summary{display:none!important}#relphiV3CalcMount .sky-calc-panel{padding:1.3rem!important}
      #relphiV3CalcMount .sky-calc-setup{grid-template-columns:minmax(280px,1fr) minmax(280px,1fr)!important}
      #relphiV3CalcMount .sky-calc-columns{grid-template-columns:repeat(2,minmax(300px,1fr))!important}
      #relphiV3CalcMount .sky-calc-shared-actions{display:none!important}
      #relphiV3CalcMount input,#relphiV3CalcMount select,#skyCreatorDrawer input,#skyCreatorDrawer select,#skyCreatorDrawer textarea{font:inherit;min-height:44px;padding:.75rem .9rem;border:1px solid rgba(0,0,0,.18);border-radius:14px;background:#fff;color:#111}
      .relphi-v3-complete{padding:1.25rem}.relphi-v3-sky-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
      .relphi-v3-sky-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1.25rem;align-items:center;min-width:0;min-height:150px;padding:1.35rem 1.5rem;border:1px solid rgba(0,0,0,.14);border-radius:24px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.06)}
      .relphi-v3-sky-info{min-width:0}.relphi-v3-sky-info h3{margin:.2rem 0 .3rem;font-size:1.55rem;overflow-wrap:anywhere}.relphi-v3-sky-info p{margin:.2rem 0}
      .relphi-v3-sky-actions{display:flex;gap:.65rem;align-items:center;justify-content:flex-end;flex-wrap:wrap}.relphi-v3-sky-actions button{margin:0;min-width:88px}
      .add-comparison{margin-top:1rem}.add-comparison[hidden]{display:none!important}
      #skyCreatorSaveWizard{display:none!important}
      #relphiV3StartOver{float:right;margin:.8rem 0 1rem}
      @media(max-width:760px){.relphi-v3-choice-grid,.relphi-v3-sky-grid{grid-template-columns:1fr}.relphi-v3-sky-card{grid-template-columns:1fr}.relphi-v3-sky-actions{justify-content:flex-start}#relphiV3CalcMount .sky-calc-setup,#relphiV3CalcMount .sky-calc-columns{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function installStartOver() {
    if (byId('relphiV3StartOver')) return;
    const hero = document.querySelector('.sky-chart-hero-panel');
    if (!hero) return;
    const button = document.createElement('button');
    button.id = 'relphiV3StartOver';
    button.type = 'button';
    button.textContent = 'Start Over';
    hero.insertAdjacentElement('afterend', button);
    button.addEventListener('click', startOver);
  }

  function install() {
    installStyles();
    rememberCalculatorPosition();
    ensureWizard();
    installStartOver();
    refreshLibrary(records());

    document.addEventListener('click', function (event) {
      const target = event.target;
      if (target.closest?.('#skyBuilderWizardMode')) { event.preventDefault(); showWizardMode(); renderComplete() || startName('chart'); return; }
      if (target.closest?.('#skyBuilderAdvancedMode')) { event.preventDefault(); showAdvancedMode(); return; }
      if (target.closest?.('#relphiV3Continue')) { event.preventDefault(); continueName(); return; }
      if (target.closest?.('#relphiV3LoadSaved')) { event.preventDefault(); loadSavedFromName(); return; }
      if (target.closest?.('#relphiV3BackName')) { event.preventDefault(); startName(flow.kind); return; }
      if (target.closest?.('#relphiV3Existing')) { event.preventDefault(); showStage('relphiV3ExistingStage'); return; }
      if (target.closest?.('#relphiV3Calculate')) { event.preventDefault(); closeCalculator(); showStage('relphiV3CalculateStage'); return; }
      if (target.closest?.('#relphiV3BackMethodExisting')) { event.preventDefault(); showStage('relphiV3Method'); return; }
      if (target.closest?.('#relphiV3Paste')) { event.preventDefault(); openAdvancedExisting('paste'); return; }
      if (target.closest?.('#relphiV3Form')) { event.preventDefault(); openAdvancedExisting('form'); return; }
      if (target.closest?.('#relphiV3UseEntered')) { event.preventDefault(); useEnteredPlacements(); return; }
      if (target.closest?.('#relphiV3HereNow')) { event.preventDefault(); event.stopImmediatePropagation(); runHereNow(); return; }
      if (target.closest?.('#relphiV3Manual')) { event.preventDefault(); openManualCalculator(); return; }
      if (target.closest?.('#relphiV3BackMethodCalc')) { event.preventDefault(); closeCalculator(); showStage('relphiV3Method'); return; }
      if (target.closest?.('#relphiV3AddComparison')) { event.preventDefault(); captureSkyA(); removeLocal(SLOT_KEYS.currentSky); startName('currentSky'); return; }
      const edit = target.closest?.('[data-edit-sky]');
      if (edit) { event.preventDefault(); editSky(edit.dataset.editSky); return; }
      const clear = target.closest?.('[data-clear-sky]');
      if (clear) { event.preventDefault(); clearSky(clear.dataset.clearSky); return; }
      if (target.closest?.('#skyCalcRun') && flow.kind && !flow.running) {
        try { prepareCalculation(); }
        catch (error) { event.preventDefault(); setCalcStatus(error.message); }
      }
    }, true);

    byId('relphiV3NameInput')?.addEventListener('input', updateNameUi);
    byId('relphiV3NameInput')?.addEventListener('change', updateNameUi);

    const observer = new MutationObserver(function () {
      if (flow.running) {
        const payload = candidateCalculatedPayload();
        if (payload && calculationLooksDone()) finishCalculatedPayload(payload);
      }
    });
    ['skyCalcStatus','chartOutput','currentSkyOutput','skyCreatorPaste'].forEach(function (id) {
      const node = byId(id);
      if (node) observer.observe(node, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['value'] });
    });

    if (!resumeComparison()) {
      const started = Date.now();
      (function initialState() {
        const a = readJson(SLOT_KEYS.chart, null);
        if (hasPlacements(a) && (outputHasPlacements(byId('chartOutput')) || Date.now() - started > 1800)) {
          renderComplete();
          return;
        }
        if (Date.now() - started > 2200) startName('chart');
        else setTimeout(initialState, 120);
      })();
    }
  }

  window.RelphiSkyWizardV3 = { renderComplete:renderComplete, captureSkyA:captureSkyA, restoreBoth:restoreBoth };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
