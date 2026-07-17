// Corrects the V3 opening state, method choices, saved-sky Continue, Advanced preservation, and controls.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };
  const SNAPSHOT_KEY = 'relphiWizardV3SkyA';
  const RESUME_KEY = 'relphiWizardV3Resume';
  const STAGES = ['relphiV3Name','relphiV3Method','relphiV3ExistingStage','relphiV3CalculateStage','relphiV3Complete'];
  let userInteracted = false;
  let completedInThisVisit = false;

  function byId(id) { return document.getElementById(id); }
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function readJson(key, fallback, session) {
    try {
      const storage = session ? sessionStorage : localStorage;
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function writeJson(key, value, session) {
    try {
      const storage = session ? sessionStorage : localStorage;
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) { return false; }
  }
  function removeKey(key, session) {
    try { (session ? sessionStorage : localStorage).removeItem(key); } catch (_) {}
  }
  function placementEntries(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(function (entry) {
      const placement = entry[1];
      if (!placement || typeof placement !== 'object' || Array.isArray(placement)) return false;
      const degree = placement.degree;
      return String(placement.sign || '').trim() || (degree !== '' && degree != null && Number.isFinite(Number(degree)));
    }));
  }
  function hasPlacements(payload) {
    return !!Object.keys(placementEntries(payload && (payload.placements || payload))).length;
  }
  function records() {
    const stored = readJson(LIBRARY_KEY, [], false);
    return Array.isArray(stored) ? stored.filter(function (record) {
      return record && String(record.name || '').trim() && Object.keys(placementEntries(record.placements)).length;
    }) : [];
  }
  function recordByName(name) {
    return records().find(function (record) { return normalize(record.name) === normalize(name); }) || null;
  }
  function payloadFromRecord(record) {
    if (!record) return null;
    return {
      name:String(record.name || '').trim(),
      notes:String(record.notes || ''),
      placements:placementEntries(record.placements),
      calcProfile:record.calcProfile && typeof record.calcProfile === 'object' ? record.calcProfile : {},
      savedAt:record.savedAt || new Date().toISOString(),
      savedAtLocal:record.savedAtLocal || new Date().toLocaleString()
    };
  }
  function fire(node, type) {
    if (node) node.dispatchEvent(new Event(type, { bubbles:true }));
  }
  function setValue(id, value) {
    const field = byId(id);
    if (!field) return;
    field.value = value == null ? '' : String(value);
    fire(field, 'input');
    fire(field, 'change');
  }
  function showStage(id) {
    STAGES.forEach(function (stageId) {
      const stage = byId(stageId);
      if (stage) stage.hidden = stageId !== id;
    });
  }
  function setResultVisibility(visible) {
    const toolbar = byId('skyResultsToolbar') || document.querySelector('.sky-results-toolbar');
    const output = document.querySelector('.sky-output-box');
    if (toolbar) toolbar.hidden = !visible;
    if (output) output.hidden = !visible;
  }
  function ensureMethodChoices() {
    const stage = byId('relphiV3Method');
    if (!stage) return;
    let grid = stage.querySelector('.relphi-v3-choice-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.className = 'relphi-v3-choice-grid';
      const back = byId('relphiV3BackName');
      stage.insertBefore(grid, back || null);
    }
    if (!byId('relphiV3Existing')) {
      grid.insertAdjacentHTML('beforeend', '<button id="relphiV3Existing" class="choice" type="button"><strong>Use existing sky data</strong><span>Load, paste, or build placements.</span></button>');
    }
    if (!byId('relphiV3Calculate')) {
      grid.insertAdjacentHTML('beforeend', '<button id="relphiV3Calculate" class="choice" type="button"><strong>Calculate a sky</strong><span>Calculate from a time and place.</span></button>');
    }
    grid.hidden = false;
    grid.removeAttribute('hidden');
    grid.style.removeProperty('display');
    [byId('relphiV3Existing'), byId('relphiV3Calculate')].forEach(function (button) {
      if (!button) return;
      button.hidden = false;
      button.removeAttribute('hidden');
      button.style.removeProperty('display');
    });
  }
  function updateUnifiedContinueState() {
    const input = byId('relphiV3NameInput');
    const status = byId('relphiV3NameStatus');
    const load = byId('relphiV3LoadSaved');
    const record = recordByName(input?.value || '');
    if (load) load.hidden = true;
    if (!status) return;
    if (record) status.textContent = 'Continue will load the saved sky “' + record.name + '”.';
    else if (/saved sky|Continue will load/i.test(status.textContent)) status.textContent = '';
  }
  function showFreshOpening() {
    const params = new URLSearchParams(location.search);
    if (userInteracted || completedInThisVisit || params.has('v3resume') || params.has('v3load')) return;
    document.body.dataset.relphiV3AwaitingChoice = 'true';
    const input = byId('relphiV3NameInput');
    if (input) {
      input.value = '';
      input.placeholder = 'Type a new name or choose a saved sky';
    }
    const eyebrow = byId('relphiV3NameEyebrow');
    const heading = byId('relphiV3NameHeading');
    const help = byId('relphiV3NameHelp');
    const status = byId('relphiV3NameStatus');
    if (eyebrow) eyebrow.textContent = 'First sky';
    if (heading) heading.textContent = 'Choose or name Sky A';
    if (help) help.textContent = 'Choose a saved sky, type a new name, or continue for an automatic Untitled Sky name.';
    if (status) status.textContent = '';
    const load = byId('relphiV3LoadSaved');
    if (load) load.hidden = true;
    showStage('relphiV3Name');
    setResultVisibility(false);
    const wizard = byId('relphiSkyWizard');
    const advanced = byId('skyCreatorDrawer');
    if (wizard) wizard.hidden = false;
    if (advanced) advanced.hidden = true;
    byId('skyBuilderWizardMode')?.classList.add('is-active');
    byId('skyBuilderAdvancedMode')?.classList.remove('is-active');
  }
  function comparisonInProgress() {
    const eyebrow = String(byId('relphiV3NameEyebrow')?.textContent || '').toLowerCase();
    const snapshot = readJson(SNAPSHOT_KEY, null, true);
    return eyebrow.includes('comparison') || (!!snapshot?.payload && !byId('relphiV3Complete')?.querySelector('[data-kind="currentSky"]'));
  }
  function continueSavedSky(record) {
    const payload = payloadFromRecord(record);
    const status = byId('relphiV3NameStatus');
    if (!payload || !hasPlacements(payload)) {
      if (status) status.textContent = 'That saved sky has no usable placements.';
      return false;
    }

    const comparison = comparisonInProgress();
    if (!comparison) {
      writeJson(SLOT_KEYS.chart, payload, false);
      removeKey(SLOT_KEYS.currentSky, false);
      removeKey(SNAPSHOT_KEY, true);
      removeKey(RESUME_KEY, true);
      const url = new URL(location.href);
      url.searchParams.delete('v3resume');
      url.searchParams.set('v3load', String(Date.now()));
      location.replace(url.toString());
      return true;
    }

    const snapshot = readJson(SNAPSHOT_KEY, null, true);
    const skyA = snapshot?.payload && hasPlacements(snapshot.payload) ? snapshot.payload : readJson(SLOT_KEYS.chart, null, false);
    if (!hasPlacements(skyA)) {
      if (status) status.textContent = 'Sky A could not be preserved.';
      return false;
    }
    writeJson(SLOT_KEYS.chart, skyA, false);
    writeJson(SLOT_KEYS.currentSky, payload, false);
    writeJson(RESUME_KEY, { skyA:skyA.name || snapshot?.name || 'Sky A', skyB:payload.name, savedAt:Date.now() }, true);
    const url = new URL(location.href);
    url.searchParams.delete('v3load');
    url.searchParams.set('v3resume', String(Date.now()));
    location.replace(url.toString());
    return true;
  }
  function preserveAdvancedState() {
    const snapshot = readJson(SNAPSHOT_KEY, null, true);
    const chart = readJson(SLOT_KEYS.chart, null, false);
    if (snapshot?.payload && hasPlacements(snapshot.payload)) writeJson(SLOT_KEYS.chart, snapshot.payload, false);
    const preservedA = snapshot?.payload && hasPlacements(snapshot.payload) ? snapshot.payload : chart;
    const target = comparisonInProgress() ? 'currentSky' : 'chart';
    setValue('skyCreatorTarget', target);
    setValue('skyCalcTarget', target);
    if (target === 'chart' && preservedA?.name) {
      setValue('skyCreatorName', preservedA.name);
      setValue('skyCalcName', preservedA.name);
    } else if (target === 'currentSky') {
      const b = readJson(SLOT_KEYS.currentSky, null, false);
      setValue('skyCreatorName', b?.name || '');
      setValue('skyCalcName', b?.name || byId('relphiV3NameInput')?.value || '');
    }
    const drawer = byId('skyCreatorDrawer');
    const wizard = byId('relphiSkyWizard');
    if (wizard) wizard.hidden = true;
    if (drawer) {
      drawer.hidden = false;
      drawer.open = true;
      drawer.setAttribute('open', '');
    }
    const drawerStatus = byId('skyCreatorDrawerStatus');
    if (drawerStatus) {
      if (target === 'currentSky') drawerStatus.textContent = hasPlacements(readJson(SLOT_KEYS.currentSky, null, false)) ? 'Editing Sky B' : 'Sky B: empty · Sky A preserved';
      else drawerStatus.textContent = hasPlacements(preservedA) ? 'Editing Sky A · ' + (preservedA.name || 'Sky A') : 'Sky A: empty';
    }
    setResultVisibility(hasPlacements(preservedA));
  }
  function markCompleteIfReal() {
    const complete = byId('relphiV3Complete');
    if (!complete || complete.hidden) return;
    const panelA = complete.querySelector('[data-kind="chart"]');
    if (!panelA) return;
    const params = new URLSearchParams(location.search);
    if (!userInteracted && !params.has('v3resume') && !params.has('v3load')) return;
    completedInThisVisit = true;
    userInteracted = true;
    delete document.body.dataset.relphiV3AwaitingChoice;
    setResultVisibility(true);
  }
  function installStyles() {
    if (byId('relphiV3CorrectionStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiV3CorrectionStyles';
    style.textContent = `
      #relphiV3StartOver{appearance:none!important;-webkit-appearance:none!important;display:flex!important;align-items:center!important;justify-content:center!important;width:max-content!important;float:none!important;margin:1rem 0 1rem auto!important;min-height:44px!important;padding:.7rem 1.2rem!important;border:1px solid rgba(220,31,24,.42)!important;border-radius:999px!important;background:#fff!important;color:#111!important;font:inherit!important;font-weight:700!important;box-shadow:0 5px 16px rgba(0,0,0,.07)!important;cursor:pointer!important}
      #relphiV3StartOver:hover{border-color:#dc1f18!important;transform:translateY(-1px)}
      #relphiV3Method .relphi-v3-choice-grid{display:grid!important;visibility:visible!important;opacity:1!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:1rem!important}
      #relphiV3Method .relphi-v3-choice-grid>.choice{display:flex!important;visibility:visible!important;opacity:1!important;min-height:140px!important}
      #relphiV3LoadSaved{display:none!important}
      body[data-relphi-v3-awaiting-choice="true"] .sky-output-box,body[data-relphi-v3-awaiting-choice="true"] #skyResultsToolbar,body[data-relphi-v3-awaiting-choice="true"] .sky-results-toolbar{display:none!important}
      @media(max-width:760px){#relphiV3Method .relphi-v3-choice-grid{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }
  function install() {
    const wait = function () {
      if (!byId('relphiSkyWizard')) return setTimeout(wait, 50);
      installStyles();
      ensureMethodChoices();
      showFreshOpening();
      updateUnifiedContinueState();
      [1900, 2400, 3200].forEach(function (delay) { setTimeout(showFreshOpening, delay); });

      window.addEventListener('click', function (event) {
        const target = event.target;
        if (target.closest?.('#relphiV3Continue')) {
          const record = recordByName(byId('relphiV3NameInput')?.value || '');
          if (record) {
            event.preventDefault();
            event.stopImmediatePropagation();
            userInteracted = true;
            delete document.body.dataset.relphiV3AwaitingChoice;
            continueSavedSky(record);
            return;
          }
          userInteracted = true;
          delete document.body.dataset.relphiV3AwaitingChoice;
          setTimeout(ensureMethodChoices, 0);
          return;
        }
        if (target.closest?.('#relphiV3LoadSaved')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const record = recordByName(byId('relphiV3NameInput')?.value || '');
          if (record) continueSavedSky(record);
          return;
        }
        if (target.closest?.('#relphiV3Existing,#relphiV3Calculate,#relphiV3Paste,#relphiV3Form,#relphiV3UseEntered,#relphiV3HereNow,#relphiV3Manual,#relphiV3AddComparison,[data-edit-sky],[data-clear-sky]')) {
          userInteracted = true;
          delete document.body.dataset.relphiV3AwaitingChoice;
        }
        if (target.closest?.('#skyBuilderAdvancedMode')) setTimeout(preserveAdvancedState, 0);
        if (target.closest?.('#skyBuilderWizardMode')) {
          setTimeout(function () {
            if (!completedInThisVisit && document.body.dataset.relphiV3AwaitingChoice === 'true') showFreshOpening();
            else ensureMethodChoices();
          }, 0);
        }
      }, true);

      byId('relphiV3NameInput')?.addEventListener('input', updateUnifiedContinueState);
      byId('relphiV3NameInput')?.addEventListener('change', updateUnifiedContinueState);

      const observer = new MutationObserver(function () {
        ensureMethodChoices();
        markCompleteIfReal();
      });
      ['relphiV3Method','relphiV3Complete'].forEach(function (id) {
        const node = byId(id);
        if (node) observer.observe(node, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden'] });
      });
    };
    wait();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
