// Keeps both Sky Chart working skies available after a page refresh.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const STORAGE_KEY = 'relphiSkyChartSessionV1';
  const TARGETS = ['chart', 'currentSky'];
  let activeTarget = 'chart';
  let restoring = false;
  let saveTimer = 0;

  function byId(id) { return document.getElementById(id); }

  function readControl(control) {
    if (!control || !control.id) return null;
    if (control.type === 'checkbox' || control.type === 'radio') {
      return { id: control.id, checked: control.checked };
    }
    return { id: control.id, value: control.value };
  }

  function readFormSnapshot() {
    return Array.from(document.querySelectorAll('#skyCreatorForm input, #skyCreatorForm select, #skyCreatorForm textarea'))
      .map(readControl)
      .filter(Boolean);
  }

  function readTargetSnapshot(target) {
    return {
      target: target,
      name: byId('skyCreatorName')?.value || '',
      notes: byId('skyCreatorNotes')?.value || '',
      paste: byId('skyCreatorPaste')?.value || '',
      libraryValue: byId('skyCreatorLibrary')?.value || '',
      libraryLabel: byId('skyCreatorLibrary')?.selectedOptions?.[0]?.textContent?.trim() || '',
      form: readFormSnapshot(),
      savedAt: Date.now()
    };
  }

  function loadSession() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : { skies: {} };
    } catch (error) {
      return { skies: {} };
    }
  }

  function writeSession(session) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch (error) {}
  }

  function saveTarget(target) {
    if (restoring || !TARGETS.includes(target)) return;
    const session = loadSession();
    session.skies = session.skies || {};
    session.skies[target] = readTargetSnapshot(target);
    session.activeTarget = target;
    session.compareOpen = !byId('skyWizardComparePanel')?.hidden;
    writeSession(session);
  }

  function saveCurrentTarget() {
    const target = byId('skyCreatorTarget')?.value || activeTarget || 'chart';
    saveTarget(target);
    activeTarget = target;
  }

  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCurrentTarget, 120);
  }

  function dispatchChange(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function applyField(id, value) {
    const el = byId(id);
    if (!el) return;
    if (typeof value === 'boolean') el.checked = value;
    else el.value = value == null ? '' : value;
    dispatchChange(el);
  }

  function waitForLibraryOption(value, label, callback, attempts) {
    const select = byId('skyCreatorLibrary');
    const tries = attempts || 0;
    if (!select) {
      if (tries < 30) setTimeout(function () { waitForLibraryOption(value, label, callback, tries + 1); }, 100);
      return;
    }
    const options = Array.from(select.options);
    const match = options.find(function (option) {
      return (value && option.value === value) || (label && option.textContent.trim() === label);
    });
    if (match) {
      select.value = match.value;
      dispatchChange(select);
      callback(true);
      return;
    }
    if (tries < 30) setTimeout(function () { waitForLibraryOption(value, label, callback, tries + 1); }, 100);
    else callback(false);
  }

  function restoreForm(snapshot) {
    if (!snapshot) return;
    applyField('skyCreatorName', snapshot.name || '');
    applyField('skyCreatorNotes', snapshot.notes || '');
    applyField('skyCreatorPaste', snapshot.paste || '');
    (snapshot.form || []).forEach(function (item) {
      const el = byId(item.id);
      if (!el) return;
      if ('checked' in item) el.checked = !!item.checked;
      if ('value' in item) el.value = item.value;
      dispatchChange(el);
    });
  }

  function restoreTarget(target, snapshot, done) {
    const targetSelect = byId('skyCreatorTarget');
    if (!targetSelect || !snapshot) { done(); return; }
    targetSelect.value = target;
    dispatchChange(targetSelect);
    activeTarget = target;

    setTimeout(function () {
      if (snapshot.libraryValue || snapshot.libraryLabel) {
        waitForLibraryOption(snapshot.libraryValue, snapshot.libraryLabel, function (loaded) {
          if (!loaded) restoreForm(snapshot);
          setTimeout(done, 180);
        });
      } else {
        restoreForm(snapshot);
        setTimeout(done, 180);
      }
    }, 180);
  }

  function restoreSession() {
    const session = loadSession();
    if (!session.skies || (!session.skies.chart && !session.skies.currentSky)) return;
    restoring = true;

    const compareButton = byId('skyWizardCompareButton');
    if (session.skies.currentSky && compareButton && byId('skyWizardComparePanel')?.hidden) compareButton.click();

    restoreTarget('chart', session.skies.chart, function () {
      restoreTarget('currentSky', session.skies.currentSky, function () {
        const finalTarget = TARGETS.includes(session.activeTarget) ? session.activeTarget : 'chart';
        const targetSelect = byId('skyCreatorTarget');
        if (targetSelect) {
          targetSelect.value = finalTarget;
          dispatchChange(targetSelect);
        }
        activeTarget = finalTarget;
        restoring = false;
        queueSave();
      });
    });
  }

  function install() {
    const targetSelect = byId('skyCreatorTarget');
    if (targetSelect) {
      activeTarget = targetSelect.value || 'chart';
      targetSelect.addEventListener('change', function () {
        const previousTarget = activeTarget;
        saveTarget(previousTarget);
        activeTarget = targetSelect.value || 'chart';
      }, true);
    }

    document.addEventListener('input', function (event) {
      if (event.target.closest?.('#skyCreatorDrawer, #skyWizardPrimaryEntryPanel, #skyWizardCompareEntryPanel')) queueSave();
    }, true);
    document.addEventListener('change', function (event) {
      if (event.target.closest?.('#skyCreatorDrawer, #skyWizardPrimaryEntryPanel, #skyWizardCompareEntryPanel')) queueSave();
    }, true);
    window.addEventListener('beforeunload', saveCurrentTarget);

    setTimeout(restoreSession, 650);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
