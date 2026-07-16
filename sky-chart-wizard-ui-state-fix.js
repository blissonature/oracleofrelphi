// Unifies saved-sky loading and new-sky naming in one Wizard combobox.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function fire(el, type) { if (el) el.dispatchEvent(new Event(type, { bubbles:true })); }

  function intendedKind() {
    const eyebrow = (byId('relphiSkyNameEyebrow')?.textContent || '').toLowerCase();
    const placeholder = (byId('relphiSkyNameInput')?.placeholder || '').toLowerCase();
    return eyebrow.includes('comparison') || placeholder.includes('comparison') ? 'currentSky' : 'chart';
  }

  function slotLabel(kind) { return kind === 'currentSky' ? 'Sky B' : 'Sky A'; }
  function outputFor(kind) { return kind === 'currentSky' ? byId('currentSkyOutput') : byId('chartOutput'); }
  function hasPlacements(text) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,100}\d{1,2}°/i.test(String(text || ''));
  }

  function setTarget(kind) {
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const select = byId(id);
      if (!select) return;
      select.value = kind;
      fire(select, 'input');
      fire(select, 'change');
    });
  }

  function setName(name) {
    ['relphiSkyNameInput','skyCreatorName','skyCalcName'].forEach(function (id) {
      const input = byId(id);
      if (!input) return;
      input.value = name;
      fire(input, 'input');
      fire(input, 'change');
    });
  }

  function defaultName() {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return 'Untitled Sky ' + pad(d.getUTCMonth()+1) + pad(d.getUTCDate()) + String(d.getUTCFullYear()).slice(-2) + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'UT';
  }

  function showStage(id) {
    ['relphiSkyNameStage','relphiSkyMethodStage','relphiExistingStage','relphiCalculateStage','relphiSkyCompleteStage'].forEach(function (stageId) {
      const stage = byId(stageId);
      if (stage) stage.hidden = stageId !== id;
    });
  }

  function placementSummary(output) {
    if (!output) return '';
    const matches = (output.textContent || '').match(/(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)\b/gi) || [];
    const unique = Array.from(new Set(matches.map(function (value) { return value.toLowerCase(); })));
    return unique.length ? unique.length + ' placements loaded.' : 'Placements loaded.';
  }

  function completeSaved(name, kind) {
    const heading = byId('relphiSkyCompleteHeading');
    const summary = byId('relphiSkyCompleteSummary');
    const add = byId('relphiAddComparison');
    setName(name);
    if (heading) heading.textContent = name + ' is now ' + slotLabel(kind);
    if (summary) summary.textContent = placementSummary(outputFor(kind)) + ' Loaded from your saved skies.';
    if (add) add.hidden = kind !== 'chart';
    showStage('relphiSkyCompleteStage');
    byId('relphiSkyCompleteStage')?.scrollIntoView({ block:'start', behavior:'smooth' });
    window.dispatchEvent(new Event('resize'));
  }

  function savedRecords() {
    const library = byId('skyCreatorLibrary');
    if (!library) return [];
    return Array.from(library.options).filter(function (option) { return option.value; }).map(function (option) {
      return { name: option.textContent.trim(), value: option.value };
    });
  }

  function exactSavedRecord(name) {
    const normalized = String(name || '').trim().toLowerCase();
    return savedRecords().find(function (record) { return record.name.toLowerCase() === normalized; }) || null;
  }

  function refreshDatalist() {
    const list = byId('relphiSavedSkyNames');
    if (!list) return;
    list.innerHTML = '';
    savedRecords().forEach(function (record) {
      const option = document.createElement('option');
      option.value = record.name;
      list.appendChild(option);
    });
  }

  function loadSaved(record, kind) {
    const library = byId('skyCreatorLibrary');
    const status = byId('relphiSkyNameError');
    if (!library || !record) return;

    setTarget(kind);
    setName(record.name);
    library.value = record.value;
    fire(library, 'input');
    fire(library, 'change');
    if (status) status.textContent = 'Loading “' + record.name + '” into ' + slotLabel(kind) + '…';
    byId('skyCreatorLoad')?.click();

    const started = Date.now();
    (function check() {
      if (hasPlacements(outputFor(kind)?.textContent || '')) {
        if (status) status.textContent = '';
        completeSaved(record.name, kind);
        return;
      }
      if (Date.now() - started > 6000) {
        if (status) status.textContent = '“' + record.name + '” did not load into ' + slotLabel(kind) + '. No placements were assigned.';
        return;
      }
      setTimeout(check, 120);
    })();
  }

  function installUnifiedNameField() {
    const wait = function () {
      const stage = byId('relphiSkyNameStage');
      const input = byId('relphiSkyNameInput');
      const library = byId('skyCreatorLibrary');
      if (!stage || !input || !library) return setTimeout(wait, 50);

      byId('relphiSavedSkyStart')?.remove();
      const label = stage.querySelector('label[for="relphiSkyNameInput"]');
      if (label) label.textContent = 'Choose a name for this sky:';
      input.setAttribute('list', 'relphiSavedSkyNames');
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.autocomplete = 'off';
      input.placeholder = 'Type a new name or choose a saved sky';
      input.value = '';

      let list = byId('relphiSavedSkyNames');
      if (!list) {
        list = document.createElement('datalist');
        list.id = 'relphiSavedSkyNames';
        input.insertAdjacentElement('afterend', list);
      }
      refreshDatalist();
      new MutationObserver(refreshDatalist).observe(library, { childList:true });

      input.addEventListener('input', function () {
        const record = exactSavedRecord(input.value);
        const error = byId('relphiSkyNameError');
        if (!error || error.textContent.startsWith('Loading')) return;
        if (!input.value.trim()) error.textContent = 'Type a new name or choose a saved sky.';
        else error.textContent = record ? 'Saved sky found. Continue will load it into ' + slotLabel(intendedKind()) + '.' : 'Continue will create a new sky with this name.';
      });

      document.addEventListener('click', function (event) {
        if (!event.target.closest?.('#relphiAddComparison')) return;
        library.value = '';
        setTimeout(function () {
          input.value = '';
          input.placeholder = 'Type a new name or choose a saved sky';
          const error = byId('relphiSkyNameError');
          if (error) error.textContent = 'Type a new name or choose a saved sky.';
          input.focus();
        }, 0);
      }, true);

      document.addEventListener('click', function (event) {
        const button = event.target.closest?.('#relphiSkyNameContinue');
        if (!button) return;

        if (!input.value.trim()) {
          input.value = defaultName();
          fire(input, 'input');
        }

        const record = exactSavedRecord(input.value.trim());
        if (!record) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        loadSaved(record, intendedKind());
      }, true);
    };
    wait();
  }

  function aspectCandidate(target) {
    return target.closest?.(
      '[data-aspect], [data-relationship], .aspect-row, .relationship-row, .aspect-line, .relationship-line, ' +
      '#chartOutput svg line, #chartOutput svg path, #chartOutput svg circle, #chartOutput svg g, ' +
      '#currentSkyOutput svg line, #currentSkyOutput svg path, #currentSkyOutput svg circle, #currentSkyOutput svg g'
    );
  }

  function setAspectState(element, active) {
    if (!element) return;
    element.classList.toggle('relphi-aspect-active', active);
    element.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function installAspectInteractions() {
    document.addEventListener('pointerover', function (event) {
      const item = aspectCandidate(event.target);
      if (item) item.classList.add('relphi-aspect-hover');
    });
    document.addEventListener('pointerout', function (event) {
      const item = aspectCandidate(event.target);
      if (item) item.classList.remove('relphi-aspect-hover');
    });
    document.addEventListener('click', function (event) {
      const item = aspectCandidate(event.target);
      if (!item) return;
      const scope = item.closest('#chartOutput, #currentSkyOutput, .sky-ledger') || document;
      scope.querySelectorAll('.relphi-aspect-active').forEach(function (other) {
        if (other !== item) setAspectState(other, false);
      });
      setAspectState(item, !item.classList.contains('relphi-aspect-active'));
    });
  }

  function installStyles() {
    if (byId('relphiWizardUiStateStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiWizardUiStateStyles';
    style.textContent = `
      #relphiSavedSkyStart{display:none!important}
      #relphiSkyNameStage{display:block;max-width:760px;margin:0 auto}
      #relphiSkyNameStage>.sky-wizard-step-copy{margin-bottom:1rem}
      #relphiSkyNameStage>.sky-creator-name-label{display:block;margin-bottom:.45rem;font-weight:700}
      #relphiSkyNameInput{width:100%;min-height:48px;padding:.75rem 1rem;border:1px solid rgba(0,0,0,.18);border-radius:14px;background:#fff;box-shadow:0 1px 0 rgba(0,0,0,.04)}
      #relphiSkyNameInput:focus{outline:3px solid rgba(220,31,24,.16);border-color:#dc1f18}
      #relphiSkyNameStage .button-row{margin-top:.85rem}
      #relphiSkyNameError.generated-note{min-height:0;padding:.5rem 0 0!important;border-left:0!important;background:transparent!important}
      #relphiSkyNameError.generated-note:empty{display:none}
      #relphiSkyWizard button,#skyResultsToolbar button,#skyDataMenu button,.sky-wizard-shell button{appearance:none;-webkit-appearance:none;font:inherit;font-weight:700;border-radius:999px;border:1px solid rgba(0,0,0,.14);padding:.72rem 1.15rem;background:#fff;color:#111;box-shadow:0 2px 8px rgba(0,0,0,.06);cursor:pointer;transition:transform .14s ease,box-shadow .14s ease,background .14s ease,border-color .14s ease}
      #relphiSkyWizard button:hover,#skyResultsToolbar button:hover,#skyDataMenu button:hover,.sky-wizard-shell button:hover{transform:translateY(-1px);box-shadow:0 7px 18px rgba(0,0,0,.10);border-color:rgba(220,31,24,.45)}
      #relphiSkyWizard button:focus-visible,#skyResultsToolbar button:focus-visible,#skyDataMenu button:focus-visible,.sky-wizard-shell button:focus-visible{outline:3px solid rgba(220,31,24,.18);outline-offset:2px}
      #relphiSkyWizard .relphi-primary-action,#relphiAddComparison,#relphiSkyNameContinue,#skyCalcRun,#exportChart{background:#dc1f18!important;color:#fff!important;border-color:#dc1f18!important;box-shadow:0 7px 18px rgba(220,31,24,.18)!important}
      #relphiSkyWizard .relphi-secondary-action{background:#fff!important;color:#111!important;border-color:rgba(220,31,24,.45)!important}
      #relphiSkyWizard .sky-wizard-action{border-radius:18px!important;text-align:left!important;padding:1rem 1.1rem!important}
      #relphiSkyWizard .sky-wizard-action span{display:block;font-weight:700}
      #relphiSkyWizard .sky-wizard-action small{display:block;margin-top:.2rem;font-weight:400;opacity:.72}
      #skyResultsToolbar summary{border-radius:999px;border:1px solid rgba(0,0,0,.14);padding:.72rem 1.15rem;background:#fff;font-weight:700;cursor:pointer;list-style:none;box-shadow:0 2px 8px rgba(0,0,0,.06)}
      #skyResultsToolbar summary::-webkit-details-marker{display:none}
      .relphi-aspect-hover,.relphi-aspect-active{cursor:pointer;filter:brightness(.9);opacity:1!important}
      svg .relphi-aspect-hover,svg .relphi-aspect-active{stroke-width:4px!important;opacity:1!important}
      .relphi-aspect-active{outline:3px solid rgba(227,29,23,.25);outline-offset:2px}
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    installUnifiedNameField();
    installAspectInteractions();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();