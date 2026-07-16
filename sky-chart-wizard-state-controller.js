// Owns new-sky Continue so Sky A / Sky B targets change exactly once.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function fire(el, type) { if (el) el.dispatchEvent(new Event(type, { bubbles:true })); }

  function savedNames() {
    const library = byId('skyCreatorLibrary');
    if (!library) return [];
    return Array.from(library.options)
      .filter(function (option) { return option.value; })
      .map(function (option) { return option.textContent.trim().toLowerCase(); });
  }

  function isSavedName(name) {
    return savedNames().includes(String(name || '').trim().toLowerCase());
  }

  function intendedKind() {
    const eyebrow = (byId('relphiSkyNameEyebrow')?.textContent || '').toLowerCase();
    const placeholder = (byId('relphiSkyNameInput')?.placeholder || '').toLowerCase();
    return eyebrow.includes('comparison') || placeholder.includes('comparison') ? 'currentSky' : 'chart';
  }

  function setTarget(kind) {
    ['skyCreatorTarget', 'skyCalcTarget'].forEach(function (id) {
      const select = byId(id);
      if (!select) return;
      select.value = kind;
      fire(select, 'input');
      fire(select, 'change');
    });
  }

  function showMethod(name) {
    ['relphiSkyNameStage','relphiSkyMethodStage','relphiExistingStage','relphiCalculateStage','relphiSkyCompleteStage'].forEach(function (id) {
      const stage = byId(id);
      if (stage) stage.hidden = id !== 'relphiSkyMethodStage';
    });
    const heading = byId('relphiSkyMethodHeading');
    if (heading) heading.textContent = 'How will you create “' + name + '”?';
    byId('relphiSkyMethodStage')?.scrollIntoView({ block:'center', behavior:'smooth' });
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest?.('#relphiSkyNameContinue');
    if (!button) return;

    const input = byId('relphiSkyNameInput');
    const name = input?.value.trim() || '';
    if (!name || isSavedName(name)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const error = byId('relphiSkyNameError');
    if (error) error.textContent = '';

    setTarget(intendedKind());
    ['skyCreatorName','skyCalcName'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = name;
      fire(field, 'input');
      fire(field, 'change');
    });
    showMethod(name);
  }, true);
})();
