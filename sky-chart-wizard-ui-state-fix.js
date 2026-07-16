// Makes saved-sky loading an exclusive Wizard path and normalizes comparison interactions.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function fire(el, type) { if (el) el.dispatchEvent(new Event(type, { bubbles:true })); }
  function setTarget(kind) {
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const select = byId(id);
      if (!select) return;
      select.value = kind;
      fire(select, 'input');
      fire(select, 'change');
    });
  }
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
  function loadSaved(name, value, kind) {
    const core = byId('skyCreatorLibrary');
    const status = byId('relphiSavedSkyStatus');
    if (!core || !value) return;
    setTarget(kind);
    setName(name);
    core.value = value;
    fire(core, 'input');
    fire(core, 'change');
    if (status) status.textContent = 'Loading “' + name + '” into ' + slotLabel(kind) + '…';
    byId('skyCreatorLoad')?.click();

    const started = Date.now();
    (function check() {
      const output = outputFor(kind);
      if (hasPlacements(output?.textContent || '')) {
        if (status) status.textContent = '';
        completeSaved(name, kind);
        return;
      }
      if (Date.now() - started > 6000) {
        if (status) status.textContent = '“' + name + '” did not load into ' + slotLabel(kind) + '. No placements were assigned.';
        return;
      }
      setTimeout(check, 120);
    })();
  }

  function installSavedPath() {
    document.addEventListener('click', function (event) {
      const button = event.target.closest && event.target.closest('#relphiLoadSavedSky');
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const picker = byId('relphiSavedSkySelect');
      const option = picker && picker.options[picker.selectedIndex];
      if (!picker?.value || !option) {
        if (byId('relphiSavedSkyStatus')) byId('relphiSavedSkyStatus').textContent = 'Choose a saved sky first.';
        return;
      }
      loadSaved(option.textContent.trim(), picker.value, intendedKind());
    }, true);

    document.addEventListener('change', function (event) {
      if (event.target?.id !== 'relphiSavedSkySelect') return;
      const option = event.target.options[event.target.selectedIndex];
      if (event.target.value && option) setName(option.textContent.trim());
    }, true);
  }

  function installDefaultName() {
    const apply = function () {
      const input = byId('relphiSkyNameInput');
      if (!input || input.value.trim()) return;
      input.value = defaultName();
      fire(input, 'input');
    };
    const wait = function () {
      if (!byId('relphiSkyNameInput')) return setTimeout(wait, 50);
      apply();
      document.addEventListener('click', function (event) {
        if (event.target.closest?.('#relphiAddComparison')) setTimeout(apply, 0);
      }, true);
    };
    wait();
  }

  function aspectCandidate(target) {
    return target.closest?.(
      '#chartOutput [data-aspect], #currentSkyOutput [data-aspect], ' +
      '#chartOutput .aspect-row, #currentSkyOutput .aspect-row, ' +
      '#chartOutput .relationship-row, #currentSkyOutput .relationship-row, ' +
      '#chartOutput svg line, #chartOutput svg path, #currentSkyOutput svg line, #currentSkyOutput svg path'
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
      const scope = item.closest('#chartOutput, #currentSkyOutput') || document;
      scope.querySelectorAll('.relphi-aspect-active').forEach(function (other) {
        if (other !== item) setAspectState(other, false);
      });
      setAspectState(item, !item.classList.contains('relphi-aspect-active'));
    });
    const enhance = function () {
      document.querySelectorAll('#chartOutput [data-aspect], #currentSkyOutput [data-aspect], #chartOutput .aspect-row, #currentSkyOutput .aspect-row, #chartOutput .relationship-row, #currentSkyOutput .relationship-row').forEach(function (el) {
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
      #relphiSkyNameStage{display:grid;grid-template-columns:minmax(260px,1fr) minmax(260px,1fr);gap:1.25rem;align-items:start}
      #relphiSavedSkyStart{grid-column:1;padding:1rem;border:1px solid rgba(0,0,0,.12);border-radius:18px;background:#fff}
      #relphiSkyNameStage>.sky-wizard-step-copy:not(#relphiSavedSkyStart),#relphiSkyNameStage>.sky-creator-name-label,#relphiSkyNameStage>#relphiSkyNameInput,#relphiSkyNameStage>#relphiSkyNameError,#relphiSkyNameStage>.button-row{grid-column:2}
      #relphiSavedSkyStart select{width:100%;min-height:44px;margin:.45rem 0 .75rem}
      #relphiSavedSkyStart button{width:100%}
      #relphiSavedSkyStatus.generated-note{border-left:0!important;min-height:0;padding:.5rem 0 0!important;background:transparent!important}
      #relphiSkyNameError.generated-note:empty,#relphiSavedSkyStatus.generated-note:empty{display:none}
      #relphiSkyNameInput{width:100%;min-height:46px}
      #relphiSkyNameStage .button-row{margin-top:.25rem}
      .relphi-aspect-hover,.relphi-aspect-active{cursor:pointer;filter:brightness(.9);opacity:1!important}
      svg .relphi-aspect-hover,svg .relphi-aspect-active{stroke-width:4px!important;opacity:1!important}
      .relphi-aspect-active{outline:3px solid rgba(227,29,23,.25);outline-offset:2px}
      @media(max-width:760px){
        #relphiSkyNameStage{grid-template-columns:1fr}
        #relphiSavedSkyStart,#relphiSkyNameStage>.sky-wizard-step-copy:not(#relphiSavedSkyStart),#relphiSkyNameStage>.sky-creator-name-label,#relphiSkyNameStage>#relphiSkyNameInput,#relphiSkyNameStage>#relphiSkyNameError,#relphiSkyNameStage>.button-row{grid-column:1}
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    installSavedPath();
    installDefaultName();
    installAspectInteractions();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
