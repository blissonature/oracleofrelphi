// Normalize Ascendant, Descendant, Midheaven, and Imum Coeli as first-class
// Sky Chart placements without replacing the Master Glyph List entries.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyAnglePlacementsV3) return;
  window.__relphiSkyAnglePlacementsV1 = true;
  window.__relphiSkyAnglePlacementsV2 = true;
  window.__relphiSkyAnglePlacementsV3 = true;

  const KEYS = new Set(['relphiSkyChartA', 'relphiSkyChartB']);
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ANGLES = Object.freeze([
    { id:'asc', key:'Ascendant', label:'Asc.', registry:'asc', aliases:['asc','ascendant','ac','rising'] },
    { id:'dsc', key:'Descendant', label:'Desc.', registry:'dsc', aliases:['dsc','desc','descendant','dc'] },
    { id:'mc', key:'Midheaven', label:'MC', registry:'mc', aliases:['mc','midheaven','medium coeli'] },
    { id:'ic', key:'IC', label:'IC', registry:'ic', aliases:['ic','imum coeli','imumcoeli'] }
  ]);
  const originalSetItem = Storage.prototype.setItem;
  let decorating = false;

  const norm = value => ((Number(value) % 360) + 360) % 360;
  const normalizeKey = value => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  function longitude(value) {
    if (Number.isFinite(Number(value))) return norm(value);
    if (!value || typeof value !== 'object') return NaN;
    if (Number.isFinite(Number(value.longitude))) return norm(value.longitude);
    if (Number.isFinite(Number(value.value))) return norm(value.value);
    const signName = String(value.sign || value.zodiac || '').trim().toLowerCase();
    const sign = SIGNS.findIndex(name => name.toLowerCase() === signName);
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(value.degree || value.degrees || 0) + Number(value.minute || value.minutes || 0) / 60 + Number(value.second || value.seconds || 0) / 3600);
  }

  function containers(payload) {
    if (!payload || typeof payload !== 'object') return [];
    return [payload.placements, payload.positions, payload.points, payload.bodies, payload.angles, payload.calcProfile, payload.profile, payload]
      .filter(value => value && typeof value === 'object');
  }

  function findNamed(payload, aliases) {
    const wanted = new Set(aliases.map(normalizeKey));
    for (const source of containers(payload)) {
      const entries = Array.isArray(source)
        ? source.map((value, index) => [String(value?.name || value?.label || value?.id || index), value])
        : Object.entries(source);
      for (const [key, value] of entries) {
        const names = [key, value?.name, value?.label, value?.id, value?.glyphId].map(normalizeKey);
        if (!names.some(name => wanted.has(name))) continue;
        const result = longitude(value);
        if (Number.isFinite(result)) return result;
      }
    }
    return NaN;
  }

  function directNumber(payload, names) {
    const profile = payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
    for (const source of [profile, payload?.profile, payload?.angles, payload]) {
      if (!source || typeof source !== 'object') continue;
      for (const name of names) {
        const result = longitude(source[name]);
        if (Number.isFinite(result)) return result;
      }
    }
    return NaN;
  }

  function cuspValues(payload) {
    const profile = payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
    for (const raw of [profile.houseCusps, profile.cusps, payload?.houseCusps, payload?.cusps, payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw)).map(longitude).slice(0, 12);
      if (values.length === 12 && values.every(Number.isFinite)) return values;
    }
    return [];
  }

  function placementObject(angle, value) {
    const sign = Math.floor(norm(value) / 30);
    const within = norm(value) - sign * 30;
    const degree = Math.floor(within);
    const minuteFloat = (within - degree) * 60;
    const minute = Math.floor(minuteFloat);
    const second = Math.round((minuteFloat - minute) * 60);
    return {
      name: angle.key,
      label: angle.label,
      id: angle.id,
      glyphId: angle.registry,
      longitude: norm(value),
      sign: SIGNS[sign],
      degree,
      minute,
      second
    };
  }

  function writePlacement(payload, angle, value) {
    if (!payload.placements || typeof payload.placements !== 'object') payload.placements = {};
    const placement = placementObject(angle, value);
    if (Array.isArray(payload.placements)) {
      const index = payload.placements.findIndex(item => angle.aliases.includes(normalizeKey(item?.name || item?.label || item?.id || item?.glyphId)));
      if (index >= 0) payload.placements[index] = Object.assign({}, payload.placements[index], placement);
      else payload.placements.push(placement);
      return;
    }
    const matchingKey = Object.keys(payload.placements).find(key => angle.aliases.includes(normalizeKey(key)));
    const key = matchingKey || angle.key;
    payload.placements[key] = Object.assign({}, payload.placements[key] || {}, placement);
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    const cusps = cuspValues(payload);
    let asc = findNamed(payload, ANGLES[0].aliases);
    if (!Number.isFinite(asc)) asc = directNumber(payload, ['ascendant','asc','rising','ac']);
    if (!Number.isFinite(asc) && cusps.length) asc = cusps[0];

    let dsc = findNamed(payload, ANGLES[1].aliases);
    if (!Number.isFinite(dsc)) dsc = directNumber(payload, ['descendant','dsc','desc','dc']);
    if (!Number.isFinite(dsc) && Number.isFinite(asc)) dsc = norm(asc + 180);

    let mc = findNamed(payload, ANGLES[2].aliases);
    if (!Number.isFinite(mc)) mc = directNumber(payload, ['midheaven','mc','mediumCoeli']);
    if (!Number.isFinite(mc) && cusps.length) mc = cusps[9];

    let ic = findNamed(payload, ANGLES[3].aliases);
    if (!Number.isFinite(ic)) ic = directNumber(payload, ['imumCoeli','imumcoeli','ic']);
    if (!Number.isFinite(ic) && Number.isFinite(mc)) ic = norm(mc + 180);

    const values = { asc, dsc, mc, ic };
    ANGLES.forEach(angle => {
      const value = values[angle.id];
      if (Number.isFinite(value)) writePlacement(payload, angle, value);
    });
    return payload;
  }

  function normalizeStored(raw) {
    try { return JSON.stringify(normalizePayload(JSON.parse(raw))); }
    catch (_) { return raw; }
  }

  Storage.prototype.setItem = function (key, value) {
    if (this === localStorage && KEYS.has(String(key))) {
      return originalSetItem.call(this, key, normalizeStored(String(value)));
    }
    return originalSetItem.call(this, key, value);
  };

  function normalizeExistingStorage() {
    KEYS.forEach(key => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const normalized = normalizeStored(raw);
      if (normalized !== raw) originalSetItem.call(localStorage, key, normalized);
    });
  }

  function angleFromRow(row) {
    const existing = normalizeKey(row.dataset.placement);
    const name = normalizeKey(row.querySelector('.sky-foundation-row-name')?.textContent);
    return ANGLES.find(angle => angle.aliases.includes(existing) || angle.aliases.includes(name)) || null;
  }

  function decorateLedgers() {
    if (decorating) return;
    decorating = true;
    try {
      ['A','B'].forEach(slot => {
        const ledger = document.querySelector(`#skyFoundation${slot} .sky-foundation-ledger`);
        if (!ledger) return;
        ledger.querySelectorAll('.sky-foundation-ledger-angle-heading').forEach(node => node.remove());
        const rows = Array.from(ledger.querySelectorAll('.sky-foundation-row'));
        const angleRows = [];
        rows.forEach(row => {
          const angle = angleFromRow(row);
          if (!angle) return;
          row.dataset.placement = angle.id;
          row.dataset.anglePlacement = angle.id;
          const name = row.querySelector('.sky-foundation-row-name');
          if (name) name.textContent = angle.label;
          angleRows.push([angle, row]);
        });
        if (!angleRows.length) return;

        const heading = document.createElement('div');
        heading.className = 'sky-foundation-ledger-angle-heading';
        heading.dataset.placementSection = 'chart-angles';
        heading.textContent = 'Chart Angles';
        ledger.appendChild(heading);
        ANGLES.forEach(angle => {
          const match = angleRows.find(([entry]) => entry.id === angle.id);
          if (match) ledger.appendChild(match[1]);
        });
      });
    } finally {
      decorating = false;
    }
  }

  normalizeExistingStorage();

  function start() {
    const root = document.getElementById('skyFoundationRoot') || document.documentElement;
    new MutationObserver(() => requestAnimationFrame(decorateLedgers))
      .observe(root, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-foundation-ready', () => requestAnimationFrame(decorateLedgers));
    window.addEventListener('relphi:sky-foundation-interactions-ready', () => requestAnimationFrame(decorateLedgers));
    requestAnimationFrame(decorateLedgers);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();

  window.RelphiAnglePlacements = Object.freeze({ normalizePayload });
})();
