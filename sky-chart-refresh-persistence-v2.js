// Refresh-safe persistence for Sky A and Sky B as two separate records.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const KEYS = {
    chart:'relphiSkyChartV2:chart',
    currentSky:'relphiSkyChartV2:currentSky',
    active:'relphiSkyChartV2:active'
  };
  let restoring = false;
  let activeKind = 'chart';
  let saveTimer = 0;

  function byId(id) { return document.getElementById(id); }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function fire(element, type) { if (element) element.dispatchEvent(new Event(type, { bubbles:true })); }
  function normalizeKind(value) { return value === 'currentSky' ? 'currentSky' : 'chart'; }
  function targetSelect() { return byId('skyCreatorTarget'); }
  function pasteBox() { return byId('skyCreatorPaste'); }
  function nameBox() { return byId('skyCreatorName'); }
  function notesBox() { return byId('skyCreatorNotes'); }

  function currentKind() {
    const paste = pasteBox();
    const select = targetSelect();
    return normalizeKind((paste && paste.dataset.skyKind) || (select && select.value) || activeKind);
  }

  function readEditor(kind) {
    return {
      version:2,
      kind:normalizeKind(kind),
      name:nameBox() ? nameBox().value : '',
      notes:notesBox() ? notesBox().value : '',
      text:pasteBox() ? pasteBox().value : '',
      savedAt:Date.now()
    };
  }

  function writeRecord(record) {
    if (!record || !record.text) return;
    try {
      localStorage.setItem(KEYS[record.kind], JSON.stringify(record));
      localStorage.setItem(KEYS.active, record.kind);
    } catch (error) {}
  }

  function readRecord(kind) {
    try {
      const value = JSON.parse(localStorage.getItem(KEYS[normalizeKind(kind)]) || 'null');
      return value && value.text ? value : null;
    } catch (error) { return null; }
  }

  function saveNow(kind) {
    if (restoring) return;
    const resolved = normalizeKind(kind || currentKind());
    activeKind = resolved;
    writeRecord(readEditor(resolved));
  }

  function scheduleSave(kind) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveNow(kind); }, 180);
  }

  async function switchTarget(kind) {
    const wanted = normalizeKind(kind);
    const select = targetSelect();
    activeKind = wanted;
    if (select && select.value !== wanted) {
      select.value = wanted;
      fire(select, 'change');
      await wait(180);
    }
    const paste = pasteBox();
    if (paste) paste.dataset.skyKind = wanted;
  }

  async function applyRecord(record) {
    if (!record || !record.text) return;
    await switchTarget(record.kind);
    const name = nameBox();
    const notes = notesBox();
    const paste = pasteBox();
    if (name) { name.value = record.name || ''; fire(name, 'input'); fire(name, 'change'); }
    if (notes) { notes.value = record.notes || ''; fire(notes, 'input'); fire(notes, 'change'); }
    if (paste) {
      paste.dataset.skyKind = record.kind;
      paste.value = record.text;
      fire(paste, 'input');
      fire(paste, 'change');
    }
    await wait(550);
  }

  async function restore() {
    const skyA = readRecord('chart');
    const skyB = readRecord('currentSky');
    if (!skyA && !skyB) return;
    restoring = true;
    try {
      if (skyA) await applyRecord(skyA);
      if (skyB) await applyRecord(skyB);
      // Reapply A after B so a faulty shared parser cannot leave Sky A carrying Sky B.
      if (skyA) await applyRecord(skyA);
      const preferred = normalizeKind(localStorage.getItem(KEYS.active) || (skyB ? 'currentSky' : 'chart'));
      await switchTarget(preferred);
    } finally {
      restoring = false;
    }
  }

  function install() {
    const select = targetSelect();
    if (select) activeKind = normalizeKind(select.value);

    document.addEventListener('pointerdown', function (event) {
      if (restoring) return;
      if (event.target === targetSelect()) saveNow(activeKind);
    }, true);

    document.addEventListener('change', function (event) {
      if (restoring) return;
      if (event.target === targetSelect()) {
        activeKind = normalizeKind(event.target.value);
        try { localStorage.setItem(KEYS.active, activeKind); } catch (error) {}
        return;
      }
      if ([pasteBox(), nameBox(), notesBox()].includes(event.target)) scheduleSave(currentKind());
    }, true);

    document.addEventListener('input', function (event) {
      if (restoring) return;
      if ([pasteBox(), nameBox(), notesBox()].includes(event.target)) scheduleSave(currentKind());
    }, true);

    window.addEventListener('pagehide', function () { saveNow(currentKind()); });
    setTimeout(restore, 900);
  }

  window.RelphiSkyRefreshPersistenceV2 = {
    save:saveNow,
    restore:restore,
    clear:function () {
      Object.values(KEYS).forEach(function (key) { try { localStorage.removeItem(key); } catch (error) {} });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
