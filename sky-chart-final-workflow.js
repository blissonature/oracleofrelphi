// Final workflow guard and visual alignment for the guided Sky Chart builder.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };
  const SNAPSHOT_KEY = 'relphiFinalSkyASnapshotV1';
  const RESUME_KEY = 'relphiFinalTwoSkyResumeV1';
  const STAGES = ['relphiSkyNameStage','relphiSkyMethodStage','relphiExistingStage','relphiCalculateStage','relphiSkyCompleteStage'];
  let pendingComparison = false;
  let finishing = false;
  let timeoutId = 0;

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
  function removeSession(key) {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }
  function placementEntries(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(function (entry) {
      const item = entry[1];
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const degree = item.degree;
      return String(item.sign || '').trim() || (degree !== '' && degree !== null && Number.isFinite(Number(degree)));
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
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,160}\d{1,2}°/i.test(node?.textContent || '');
  }
  function localTimestamp(date) {
    const value = date || new Date();
    const pad = function (number) { return String(number).padStart(2, '0'); };
    return value.getFullYear() + '-' + pad(value.getMonth() + 1) + '-' + pad(value.getDate()) + ' ' + pad(value.getHours()) + pad(value.getMinutes());
  }
  function defaultSkyName() {
    return 'Untitled Sky ' + localTimestamp(new Date());
  }
  function state() {
    return window.RelphiTwoSkyAuthority?.state?.() || { kind:'chart', name:'', skyA:'', pending:false, running:false };
  }
  function isComparisonStage() {
    const current = state();
    const eyebrow = normalize(byId('relphiSkyNameEyebrow')?.textContent);
    return current.kind === 'currentSky' || document.body.dataset.relphiPendingSkyKind === 'currentSky' || eyebrow.includes('comparison');
  }
  function library() {
    const records = readJson(LIBRARY_KEY, []);
    return Array.isArray(records) ? records.filter(function (record) {
      return record && String(record.name || '').trim() && Object.keys(placementEntries(record.placements)).length;
    }) : [];
  }
  function findRecord(name) {
    return library().find(function (record) { return normalize(record.name) === normalize(name); }) || null;
  }
  function upsertRecord(kind, payload) {
    if (!payload || !hasPlacements(payload)) return null;
    const records = library();
    const name = String(payload.name || (kind === 'currentSky' ? 'Sky B' : 'Sky A')).trim();
    const record = {
      id:(kind === 'currentSky' ? 'currentSky' : 'chart') + ':' + normalize(name).replace(/[^a-z0-9]+/g, '-') + ':' + Date.now(),
      kind:kind,
      name:name,
      notes:String(payload.notes || ''),
      placements:placementEntries(payload.placements || payload),
      calcProfile:payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {},
      savedAt:new Date().toISOString(),
      savedAtLocal:new Date().toLocaleString()
    };
    const index = records.findIndex(function (item) { return normalize(item.name) === normalize(name); });
    if (index >= 0) {
      record.id = records[index].id || record.id;
      records[index] = { ...records[index], ...record };
    } else records.unshift(record);
    if (!writeJson(LIBRARY_KEY, records.slice(0, 80))) return null;
    refreshLibrary(records.slice(0, 80));
    return record;
  }
  function refreshLibrary(records) {
    const select = byId('skyCreatorLibrary');
    if (select) {
      const selected = select.value;
      select.replaceChildren(new Option('Choose saved sky…', ''));
      records.forEach(function (record) { select.appendChild(new Option(record.name, record.id)); });
      if (records.some(function (record) { return record.id === selected; })) select.value = selected;
    }
    const datalist = byId('relphiSavedSkyNames');
    if (datalist) {
      datalist.replaceChildren();
      records.forEach(function (record) {
        const option = document.createElement('option');
        option.value = record.name;
        datalist.appendChild(option);
      });
    }
    window.dispatchEvent(new CustomEvent('relphi:saved-skies-recovered'));
  }
  function inferredSkyAName() {
    const payload = readJson(SLOT_KEYS.chart, null);
    const heading = byId('relphiSkyCompleteHeading')?.textContent || '';
    const headingName = heading.match(/^(.*?)\s+is now\s+Sky A$/i)?.[1]?.trim();
    const wheelName = byId('chartOutput')?.dataset.skyName;
    const legend = document.querySelector('.sky-chart-legend, .wheel-legend, [data-sky-legend]')?.textContent || '';
    const saved = library().find(function (record) {
      return signature(record) === signature(payload);
    });
    return String(payload?.name || headingName || wheelName || saved?.name || (legend.trim().length < 80 ? legend.trim() : '') || 'Sky A').trim();
  }
  function captureSkyA() {
    let payload = readJson(SLOT_KEYS.chart, null);
    const name = inferredSkyAName();
    if (!hasPlacements(payload)) {
      const record = findRecord(name);
      if (record) payload = {
        name:record.name,
        notes:record.notes || '',
        placements:placementEntries(record.placements),
        calcProfile:record.calcProfile || {}
      };
    }
    if (!hasPlacements(payload)) return null;
    payload.name = name;
    writeJson(SLOT_KEYS.chart, payload);
    upsertRecord('chart', payload);
    const snapshot = {
      name:name,
      payload:payload,
      signature:signature(payload),
      capturedAt:Date.now()
    };
    writeSession(SNAPSHOT_KEY, snapshot);
    return snapshot;
  }
  function currentSnapshot() {
    return readSession(SNAPSHOT_KEY, null) || captureSkyA();
  }
  function ensureComparisonName() {
    const input = byId('relphiSkyNameInput');
    if (!input) return '';
    const aName = currentSnapshot()?.name || '';
    if (!input.value.trim() || normalize(input.value) === normalize(aName)) input.value = defaultSkyName();
    const load = byId('relphiLoadMatchingSavedSky');
    if (load && !findRecord(input.value)) load.hidden = true;
    return input.value.trim();
  }
  function prepareComparisonStart() {
    const snapshot = captureSkyA();
    if (!snapshot) return false;
    pendingComparison = true;
    document.body.dataset.relphiFinalComparison = 'true';
    return true;
  }
  function candidateSkyB(snapshot) {
    const aSignature = snapshot?.signature || '';
    const chart = readJson(SLOT_KEYS.chart, null);
    const current = readJson(SLOT_KEYS.currentSky, null);
    if (hasPlacements(current) && signature(current) !== aSignature) return { payload:current, source:'currentSky' };
    if (hasPlacements(chart) && signature(chart) !== aSignature) return { payload:chart, source:'chart' };
    return null;
  }
  function comparisonName() {
    return String(state().name || byId('skyCalcName')?.value || byId('relphiSkyNameInput')?.value || defaultSkyName()).trim();
  }
  function statusLooksCalculated() {
    return /^Calculated Sky for\b/i.test(byId('skyCalcStatus')?.textContent.trim() || '');
  }
  function renderedNewSky(snapshot) {
    const chart = byId('chartOutput');
    const current = byId('currentSkyOutput');
    const chartPayload = readJson(SLOT_KEYS.chart, null);
    const currentPayload = readJson(SLOT_KEYS.currentSky, null);
    return (outputHasPlacements(current) && signature(currentPayload) !== snapshot?.signature) ||
      (outputHasPlacements(chart) && signature(chartPayload) !== snapshot?.signature);
  }
  function finalizeComparison() {
    if (finishing || !pendingComparison) return false;
    const snapshot = currentSnapshot();
    if (!snapshot?.payload) return false;
    const candidate = candidateSkyB(snapshot);
    if (!candidate || (!statusLooksCalculated() && !renderedNewSky(snapshot))) return false;

    finishing = true;
    window.clearTimeout(timeoutId);
    const bPayload = { ...candidate.payload, name:comparisonName() };
    const aPayload = { ...snapshot.payload, name:snapshot.name };
    writeJson(SLOT_KEYS.chart, aPayload);
    writeJson(SLOT_KEYS.currentSky, bPayload);
    const aRecord = upsertRecord('chart', aPayload);
    const bRecord = upsertRecord('currentSky', bPayload);
    if (!aRecord || !bRecord) {
      finishing = false;
      return false;
    }
    writeSession(RESUME_KEY, { skyA:aRecord.name, skyB:bRecord.name, savedAt:Date.now() });
    pendingComparison = false;
    delete document.body.dataset.relphiFinalComparison;
    const url = new URL(location.href);
    url.searchParams.set('finalTwoSky', String(Date.now()));
    location.replace(url.toString());
    return true;
  }
  function setTarget(kind) {
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = kind;
      fire(field, 'input');
      fire(field, 'change');
    });
  }
  function activateComparisonMode() {
    const active = Array.from(document.querySelectorAll('[data-sky-chart-mode]')).some(function (button) {
      return button.dataset.skyChartMode !== 'single' && button.getAttribute('aria-pressed') === 'true';
    });
    if (!active) document.querySelector('[data-sky-chart-mode="compare"], [data-sky-chart-mode="synastry"], [data-sky-chart-mode="transit"]')?.click();
  }
  function waitUntil(test, timeout) {
    const started = Date.now();
    return new Promise(function (resolve, reject) {
      (function check() {
        try {
          const value = test();
          if (value) return resolve(value);
        } catch (_) {}
        if (Date.now() - started > timeout) return reject(new Error('Timed out'));
        setTimeout(check, 120);
      })();
    });
  }
  function loadRecord(record, kind) {
    const select = byId('skyCreatorLibrary');
    const output = kind === 'currentSky' ? byId('currentSkyOutput') : byId('chartOutput');
    if (!select || !output) return Promise.reject(new Error('Saved sky controls unavailable'));
    if (kind === 'currentSky') activateComparisonMode();
    setTarget(kind);
    const creatorName = byId('skyCreatorName');
    const calcName = byId('skyCalcName');
    if (creatorName) creatorName.value = record.name;
    if (calcName) calcName.value = record.name;
    const before = output.innerHTML;
    select.value = record.id;
    fire(select, 'input');
    fire(select, 'change');
    byId('skyCreatorLoad')?.click();
    return waitUntil(function () {
      const payload = readJson(SLOT_KEYS[kind], null);
      return outputHasPlacements(output) && (output.innerHTML !== before || normalize(payload?.name) === normalize(record.name));
    }, 10000);
  }
  function showCompletedTwoSky(aName, bName) {
    STAGES.forEach(function (id) {
      const stage = byId(id);
      if (stage) stage.hidden = id !== 'relphiSkyCompleteStage';
    });
    const complete = byId('relphiSkyCompleteStage');
    if (complete) complete.hidden = false;
    const heading = byId('relphiSkyCompleteHeading');
    const summary = byId('relphiSkyCompleteSummary');
    if (heading) heading.textContent = bName + ' is now Sky B';
    if (summary) summary.textContent = 'Sky A and Sky B are ready for comparison.';
    document.body.dataset.relphiSkyBReady = 'true';
    byId('chartOutput')?.setAttribute('data-sky-name', aName);
    const current = byId('currentSkyOutput');
    if (current) {
      current.dataset.skyName = bName;
      current.hidden = false;
      current.removeAttribute('hidden');
    }
    window.dispatchEvent(new CustomEvent('relphi:sky-b-ready', { detail:{ skyA:aName, skyB:bName } }));
    window.dispatchEvent(new Event('resize'));
  }
  function resumeBothSkies() {
    const resume = readSession(RESUME_KEY, null);
    if (!resume?.skyA || !resume?.skyB) return;
    const aRecord = findRecord(resume.skyA);
    const bRecord = findRecord(resume.skyB);
    if (!aRecord || !bRecord) return;
    loadRecord(aRecord, 'chart').then(function () {
      activateComparisonMode();
      return loadRecord(bRecord, 'currentSky');
    }).then(function () {
      removeSession(RESUME_KEY);
      removeSession(SNAPSHOT_KEY);
      showCompletedTwoSky(aRecord.name, bRecord.name);
      finishing = false;
    }).catch(function () {
      const status = byId('skyCalcStatus');
      if (status) status.textContent = 'Both skies could not be restored. Your saved records remain available.';
      finishing = false;
    });
  }
  function removeDuplicateControls() {
    const finished = byId('relphiFinishedSkyWorkspace');
    if (finished) {
      byId('relphiAddComparison')?.closest('.button-row')?.setAttribute('hidden', '');
      document.querySelectorAll('#relphiSkyCompleteStage > .relphi-primary-action, #relphiSkyCompleteStage > #relphiAddComparison').forEach(function (node) { node.hidden = true; });
    }
    const duplicateAdds = Array.from(document.querySelectorAll('#relphiCompactAddComparison'));
    duplicateAdds.slice(1).forEach(function (node) { node.remove(); });
  }
  function installStyles() {
    if (byId('relphiFinalWorkflowStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiFinalWorkflowStyles';
    style.textContent = `
      #relphiSkyWizard{width:100%!important;max-width:none!important}
      #relphiSkyWizard .sky-wizard-step:not([hidden]){width:100%!important;max-width:none!important;padding:1.35rem!important;border-radius:24px!important}
      #relphiSkyNameStage{max-width:920px!important;margin-inline:auto!important}
      #relphiSkyWizard button,.sky-calc-drawer button,#skyCreatorDrawer button{appearance:none!important;-webkit-appearance:none!important;font:inherit!important;font-weight:700!important;line-height:1.15!important;border-radius:999px!important;min-height:44px!important;padding:.72rem 1.1rem!important;border:1px solid rgba(220,31,24,.38)!important;background:#fff!important;color:#111!important;box-shadow:0 4px 13px rgba(0,0,0,.06)!important;cursor:pointer!important}
      #relphiSkyWizard button:hover,.sky-calc-drawer button:hover,#skyCreatorDrawer button:hover{border-color:#dc1f18!important;transform:translateY(-1px)}
      #relphiSkyWizard .relphi-primary-action,#relphiSkyWizard #relphiSkyNameContinue,#relphiSkyWizard #relphiCompactAddComparison,.sky-calc-drawer #skyCalcRun{background:#e51d18!important;color:#fff!important;border-color:#e51d18!important;box-shadow:0 9px 24px rgba(229,29,24,.22)!important}
      #relphiSkyWizard .sky-wizard-action{border-radius:22px!important;min-height:132px!important;padding:1.2rem 1.3rem!important;text-align:left!important;background:#fff!important}
      #relphiSkyWizard button[id^="relphiBack"]{min-height:auto!important;padding:.4rem .2rem!important;border:0!important;box-shadow:none!important;background:transparent!important;color:#555!important;text-decoration:underline!important}
      #relphiSkyWizard input,#relphiSkyWizard select,.sky-calc-drawer input,.sky-calc-drawer select,#skyCreatorDrawer input,#skyCreatorDrawer select,#skyCreatorDrawer textarea{appearance:none!important;-webkit-appearance:none!important;font:inherit!important;border:1px solid rgba(0,0,0,.18)!important;border-radius:14px!important;padding:.78rem .9rem!important;background:#fff!important;color:#111!important;min-height:44px!important}
      #relphiSkyNameInput{width:100%!important}
      #relphiWizardCalculatorMount,.sky-calc-drawer,.sky-calc-panel{width:100%!important;max-width:none!important}
      #relphiWizardCalculatorMount .sky-calc-panel{display:block!important;padding:1.25rem!important}
      #relphiWizardCalculatorMount .sky-calc-setup{grid-template-columns:minmax(260px,.8fr) minmax(0,1.2fr)!important}
      #relphiWizardCalculatorMount .sky-calc-columns{grid-template-columns:repeat(2,minmax(300px,1fr))!important}
      #relphiFinishedSkyWorkspace{width:100%!important}
      #relphiFinishedSkyWorkspace .relphi-finished-sky-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:1rem!important}
      #relphiFinishedSkyWorkspace .relphi-finished-sky-panel{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:1rem!important;align-items:center!important;min-height:128px!important;padding:1.2rem 1.3rem!important;border:1px solid rgba(0,0,0,.14)!important;border-radius:22px!important;background:#fff!important;box-shadow:0 7px 22px rgba(0,0,0,.06)!important}
      #relphiFinishedSkyWorkspace .relphi-finished-sky-actions{display:flex!important;gap:.65rem!important;align-items:center!important;justify-content:flex-end!important}
      #relphiFinishedSkyWorkspace .relphi-finished-sky-actions button{margin:0!important}
      #relphiSkyCompleteStage>#relphiAddComparison,#relphiSkyCompleteStage>.button-row:has(#relphiAddComparison){display:none!important}
      #relphiLoadMatchingSavedSky[hidden]{display:none!important}
      @media(max-width:760px){#relphiFinishedSkyWorkspace .relphi-finished-sky-grid{grid-template-columns:1fr!important}#relphiFinishedSkyWorkspace .relphi-finished-sky-panel{grid-template-columns:1fr!important}#relphiFinishedSkyWorkspace .relphi-finished-sky-actions{justify-content:flex-start!important}#relphiWizardCalculatorMount .sky-calc-setup,#relphiWizardCalculatorMount .sky-calc-columns{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }
  function scheduleFinalize() {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(function () {
      if (finalizeComparison()) return;
      const snapshot = currentSnapshot();
      if (snapshot && renderedNewSky(snapshot)) finalizeComparison();
    }, 22000);
  }
  function install() {
    installStyles();
    refreshLibrary(library());

    window.addEventListener('click', function (event) {
      const target = event.target;
      if (target.closest?.('#relphiAddComparison, #relphiCompactAddComparison')) {
        prepareComparisonStart();
        window.setTimeout(function () {
          const input = byId('relphiSkyNameInput');
          if (input && isComparisonStage()) {
            input.value = '';
            input.placeholder = 'Optional — an Untitled Sky name will be supplied';
            const load = byId('relphiLoadMatchingSavedSky');
            if (load) load.hidden = true;
          }
          removeDuplicateControls();
        }, 0);
        return;
      }
      if (target.closest?.('#relphiSkyNameContinue') && isComparisonStage()) {
        ensureComparisonName();
        return;
      }
      if (target.closest?.('#relphiHereNow, #relphiChooseWhenWhere') && isComparisonStage()) {
        prepareComparisonStart();
        ensureComparisonName();
        return;
      }
      if (target.closest?.('#skyCalcRun') && (isComparisonStage() || document.body.dataset.relphiFinalComparison === 'true')) {
        prepareComparisonStart();
        ensureComparisonName();
        pendingComparison = true;
        scheduleFinalize();
      }
    }, true);

    const observer = new MutationObserver(function () {
      if (pendingComparison) finalizeComparison();
      removeDuplicateControls();
    });
    ['skyCalcStatus','chartOutput','currentSkyOutput','relphiSkyCompleteStage'].forEach(function (id) {
      const node = byId(id);
      if (node) observer.observe(node, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['hidden'] });
    });

    window.addEventListener('relphi:sky-b-ready', removeDuplicateControls);
    window.setTimeout(function () {
      resumeBothSkies();
      removeDuplicateControls();
    }, 250);
  }

  window.RelphiFinalSkyWorkflow = {
    captureSkyA:captureSkyA,
    finalizeComparison:finalizeComparison,
    defaultSkyName:defaultSkyName
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();