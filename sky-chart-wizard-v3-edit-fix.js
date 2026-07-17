// Opens the correct Advanced editor without discarding either completed sky.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };

  function byId(id) { return document.getElementById(id); }
  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function setValue(id, value) {
    const field = byId(id);
    if (!field) return;
    field.value = value == null ? '' : String(value);
    fire(field, 'input');
    fire(field, 'change');
  }
  function placementLines(payload) {
    const placements = payload && (payload.placements || payload);
    if (!placements || typeof placements !== 'object' || Array.isArray(placements)) return '';
    return Object.entries(placements).map(function (entry) {
      const name = entry[0];
      const item = entry[1] || {};
      if (!item || typeof item !== 'object') return '';
      const degree = String(item.degree ?? '').padStart(2, '0');
      const minute = String(item.minute ?? 0).padStart(2, '0');
      const house = item.house !== '' && item.house != null ? ', in ' + item.house + ' House' : '';
      const retrograde = item.retrograde ? ', Retrograde' : '';
      return name + ',' + (item.sign || '') + ',' + degree + '°' + minute + "'" + house + retrograde;
    }).filter(Boolean).join('\n');
  }
  function applyProfile(payload) {
    const profile = payload?.calcProfile || {};
    setValue('skyCalcDateTime', profile.dateTime || profile.datetime || '');
    setValue('skyCalcTimeZone', profile.timeZone || profile.timezone || profile.tz || '');
    setValue('skyCalcLocation', profile.location || profile.loc || '');
    setValue('skyCalcLatitude', profile.latitude || profile.lat || '');
    setValue('skyCalcLongitude', profile.longitude || profile.lon || '');
    if (profile.houseSystem) setValue('skyCalcHouseSystem', profile.houseSystem);
  }
  function openEditor(kind) {
    const payload = readJson(SLOT_KEYS[kind]);
    const otherKind = kind === 'chart' ? 'currentSky' : 'chart';
    const otherPayload = readJson(SLOT_KEYS[otherKind]);
    if (!payload) return;

    // Preserve both records before any native control receives change events.
    try {
      localStorage.setItem(SLOT_KEYS[kind], JSON.stringify(payload));
      if (otherPayload) localStorage.setItem(SLOT_KEYS[otherKind], JSON.stringify(otherPayload));
    } catch (_) {}

    setValue('skyCreatorTarget', kind);
    setValue('skyCalcTarget', kind);
    setValue('skyCreatorName', payload.name || (kind === 'chart' ? 'Sky A' : 'Sky B'));
    setValue('skyCalcName', payload.name || (kind === 'chart' ? 'Sky A' : 'Sky B'));
    setValue('skyCreatorNotes', payload.notes || '');
    setValue('skyCreatorPaste', placementLines(payload));
    applyProfile(payload);

    const wizard = byId('relphiSkyWizard');
    const drawer = byId('skyCreatorDrawer');
    if (wizard) wizard.hidden = true;
    if (drawer) {
      drawer.hidden = false;
      drawer.open = true;
      drawer.setAttribute('open', '');
    }

    document.body.dataset.skyBuilderUi = 'advanced';
    byId('skyBuilderWizardMode')?.classList.remove('is-active');
    byId('skyBuilderAdvancedMode')?.classList.add('is-active');
    byId('skyBuilderWizardMode')?.setAttribute('aria-pressed', 'false');
    byId('skyBuilderAdvancedMode')?.setAttribute('aria-pressed', 'true');

    const status = byId('skyCreatorDrawerStatus');
    if (status) status.textContent = 'Editing ' + (kind === 'chart' ? 'Sky A' : 'Sky B') + ' · ' + (payload.name || 'Untitled Sky');

    drawer?.scrollIntoView({ block:'start', behavior:'smooth' });
    setTimeout(function () {
      drawer.hidden = false;
      drawer.open = true;
      drawer.setAttribute('open', '');
      byId('skyCreatorName')?.focus();
    }, 80);
  }

  window.addEventListener('click', function (event) {
    const button = event.target.closest?.('[data-edit-sky]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openEditor(button.dataset.editSky);
  }, true);
})();
