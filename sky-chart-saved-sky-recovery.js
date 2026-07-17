// Recovers named skies that predate the unified saved-sky library.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const LEGACY_SLOTS = [
    { key:'relphiTarotChart', kind:'chart' },
    { key:'relphiCurrentSky', kind:'currentSky' }
  ];

  function parseStored(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function normalizeName(value) {
    return String(value || '').trim().toLowerCase();
  }

  function slug(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function placementEntries(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(function (entry) {
      const placement = entry[1];
      return placement && typeof placement === 'object' && !Array.isArray(placement) &&
        (String(placement.sign || '').trim() || Number.isFinite(Number(placement.degree)));
    }));
  }

  function legacyRecord(slot) {
    const payload = parseStored(slot.key, null);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    const name = String(payload.name || '').trim();
    const placements = placementEntries(payload.placements || payload);
    if (!name || !Object.keys(placements).length) return null;
    return {
      id: slot.kind + ':' + (slug(name) || Date.now()),
      kind: slot.kind,
      name: name,
      notes: String(payload.notes || ''),
      placements: placements,
      calcProfile: payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {},
      savedAt: payload.savedAt || new Date().toISOString(),
      savedAtLocal: payload.savedAtLocal || ''
    };
  }

  function hasPlacements(record) {
    return !!Object.keys(placementEntries(record && record.placements)).length;
  }

  function recoverLibrary() {
    const stored = parseStored(LIBRARY_KEY, []);
    const library = Array.isArray(stored) ? stored.filter(function (record) {
      return record && typeof record === 'object' && String(record.name || '').trim();
    }) : [];
    let changed = false;

    LEGACY_SLOTS.forEach(function (slot) {
      const recovered = legacyRecord(slot);
      if (!recovered) return;
      const recoveredName = normalizeName(recovered.name);
      const index = library.findIndex(function (record) {
        return normalizeName(record.name) === recoveredName;
      });
      if (index < 0) {
        library.unshift(recovered);
        changed = true;
        return;
      }
      if (!hasPlacements(library[index]) && hasPlacements(recovered)) {
        library[index] = { ...recovered, ...library[index], placements:recovered.placements };
        changed = true;
      }
    });

    if (!changed) return null;
    const next = library.slice(0, 80);
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(next)); }
    catch (error) { return null; }
    return next;
  }

  function refreshRetrievalList(library) {
    if (!Array.isArray(library)) return;
    const select = document.getElementById('skyCreatorLibrary');
    if (select) {
      const selected = select.value;
      select.replaceChildren(new Option('Choose saved sky…', ''));
      library.forEach(function (record) {
        select.appendChild(new Option(record.name, record.id));
      });
      if (library.some(function (record) { return record.id === selected; })) select.value = selected;
    }
    const datalist = document.getElementById('relphiSavedSkyNames');
    if (datalist) {
      datalist.replaceChildren();
      library.forEach(function (record) {
        const option = document.createElement('option');
        option.value = record.name;
        datalist.appendChild(option);
      });
    }
    window.dispatchEvent(new CustomEvent('relphi:saved-skies-recovered'));
  }

  function run() {
    refreshRetrievalList(recoverLibrary());
  }

  window.addEventListener('load', function () { setTimeout(run, 0); }, { once:true });
})();
