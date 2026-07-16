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
    const text = output.textContent || '';
    const matches = text.match(/(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)\b/gi) || [];
    const unique = Array.from(new Set(matches.map(function (v) { return v.toLowerCase(); })));
    return unique.length ? unique.length + ' placements loaded.' : 'Placements loaded.';
  }
  function completeSaved(name, kind) {
    const heading = byId('relphiSkyCompleteHeading');
    const summary = byId('relphiSkyCompleteSummary');
    const add = byId('relphiAddComparison');
    const output = outputFor(kind);
    setName(name);
    if (heading) heading.textContent = name + ' is now ' + slotLabel(kind);
    if (summary) summary.textContent = placementSummary(output) + ' Loaded from your saved skies.';
    if (add) add.hidden = kind !== 'chart';
    showStage('relphiSkyCompleteStage');
    byId('relphiSkyCompleteStage')?.scrollIntoView({ block:'start', behavior:'smooth' });
    window.dispatchEvent(new Event('resize'));
  }

  function savedRecords() {
    const core = byId('skyCreatorLibrary');
    if (!core) return [];
    return Array.from(core.options).filter(function (option) { return option.value; }).map(function (option) {
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
      option.dataset.savedValue = record.value;
      list.appendChild(option);
    });
  }

  function loadSaved(record, kind) {
    const core = byId('skyCreatorLibrary');
    const status = byId('relphiSkyNameError');
    if (!core || !record) return;
    setTarget(kind);
    setName(record.name);
    core.value = record.value;
    fire(core, 'input');
    fire(core, 'change');
    if (status) status.textContent = 'Loading “' + record.name + '” into ' + slotLabel(kind) + '…';
    byId('skyCreatorLoad')?.click();

    const started = Date.now();
    (function check() {
      const output = outputFor(kind);
      if (hasPlacements(output?.textContent || '')) {
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
      const core = byId('skyCreatorLibrary');
      if (!stage || !input || !core) return setTimeout(wait, 50);

      byId('relphiSavedSkyStart')?.remove();
      const label = stage.querySelector('label[for="relphiSkyNameInput"]');
      if (label) label.textContent = 'Choose a name for this sky:';
      input.setAttribute('list', 'relphiSavedSkyNames');
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.autocomplete = 'off';

      let list = byId('relphiSavedSkyNames');
      if (!list) {
        list = document.createElement('datalist');
        list.id = 'relphiSavedSkyNames';
        input.insertAdjacentElement('afterend', list);
      }
      refreshDatalist();
      new MutationObserver(refreshDatalist).observe(core, { childList:true });

      if (!input.value.trim()) input.value = defaultName();

      input.addEventListener('input', function () {
        const record = exactSavedRecord(input.value);
        const error = byId('relphiSkyNameError');
        if (error && !error.textContent.startsWith('Loading')) {
          error.textContent = record ? 'Saved sky found. Continue will load it into ' + slotLabel(intendedKind()) + '.' : 'Continue will create a new sky with this name.';
        }
      });

      document.addEventListener('click', function (event) {
        if (!event.target.closest?.('#relphiAddComparison')) return;
        setTimeout(function () {
          input.value = defaultName();
          input.placeholder = 'Comparison sky name';
          fire(input, 'input');
          input.focus();
        }, 0);
      }, true);

      document.addEventListener('click', function (event) {
        const button = event.target.closest?.('#relphiSkyNameContinue');
        if (!button) return;
        const name = input.value.trim();
        const record = exactSavedRecord(name);
        if (!record) {
          setTarget(intendedKind());
          return;
        }
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
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const item = aspectCandidate(event.target);
      if (!item) return;
      event.preventDefault();
      item.click();
    });
    const enhance = function () {
      document.querySelectorAll('[data-aspect], [data-relationship], .aspect-row, .relationship-row, .aspect-line, .relationship-line').forEach(function (el) {
        if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      });
    };
    enhance();
    new MutationObserver(enhance).observe(document.body, { childList:true, subtree:true });
  }

  function installStyles() {
    if (byId('relphiWizardUiStateStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiWizardUiStateStyles';
    style.textContent = `
      #relphiSkyNameStage{display:block;max-width:760px;margin:0 auto}
      #relphiSkyNameStage>.sky-wizard-step-copy{margin-bottom:1rem}
      #relphiSkyNameStage>.sky-creator-name-label{display:block;margin-bottom:.45rem;font-weight:700}
      #relphiSkyNameInput{width:100%;min-height:48px;padding:.75rem 1rem;border:1px solid rgba(0,0,0,.28);border-radius:12px;background:#fff}
      #relphiSkyNameStage .button-row{margin-top:.85rem}
      #relphiSkyNameError.generated-note{min-height:0;padding:.5rem 0 0!important;border-left:0!important;background:transparent!important}
      #relphiSkyNameError.generated-note:empty{display:none}
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
