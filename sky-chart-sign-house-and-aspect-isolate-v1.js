// Correct sign-to-house highlighting in both skies.
// This module contains no glyph or selected-relationship rendering.
(function () {
  'use strict';
  if (window.__relphiSignHouseAndAspectIsolateV1) return;
  window.__relphiSignHouseAndAspectIsolateV1 = true;

  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const norm = value => ((Number(value) % 360) + 360) % 360;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placementSource(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const known = [payload.placements,payload.positions,payload.points,payload.bodies].find(value => value && typeof value === 'object');
    const source = known || payload;
    return (Array.isArray(source) ? source : Object.values(source)).filter(value => value && typeof value === 'object' && !Array.isArray(value));
  }

  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    const sign = signs.indexOf(String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60);
  }

  function ascendant(payload) {
    const placements = placementSource(payload);
    const asc = placements.find(item => /^(asc|ascendant|rising)$/i.test(String(item.id || item.name || item.label || item.point || '')));
    if (asc && Number.isFinite(longitude(asc))) return longitude(asc);
    const profile = payload?.calcProfile || {};
    const value = Number(profile.ascendant ?? payload?.ascendant ?? payload?.asc);
    return Number.isFinite(value) ? norm(value) : 0;
  }

  function cusps(payload) {
    const profile = payload?.calcProfile || {};
    for (const raw of [profile.houseCusps,profile.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw)).map(value => typeof value === 'object' ? Number(value.longitude ?? value.value ?? value.cusp) : Number(value)).slice(0,12);
      if (values.length === 12 && values.every(Number.isFinite)) return values.map(norm);
    }
    const asc = ascendant(payload);
    const system = String(profile.houseSystem || payload?.houseSystem || 'whole-sign').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc / 30) * 30 : asc;
    return Array.from({length:12},(_,index)=>norm(start + index * 30));
  }

  function intervalParts(start, span) {
    const end = start + span;
    return end <= 360 ? [[start,end]] : [[start,360],[0,end-360]];
  }

  function overlaps(aStart,aSpan,bStart,bSpan) {
    return intervalParts(norm(aStart),aSpan).some(a => intervalParts(norm(bStart),bSpan).some(b => Math.max(a[0],b[0]) < Math.min(a[1],b[1])));
  }

  function housesForSign(payload, sign) {
    const houseCusps = cusps(payload);
    const signStart = sign * 30;
    const result = new Set();
    houseCusps.forEach((start,index) => {
      const span = norm(houseCusps[(index + 1) % 12] - start) || 30;
      if (overlaps(start,span,signStart,30)) result.add(index + 1);
    });
    return result;
  }

  function applySignHouseCorrection(event) {
    const state = event.detail?.state;
    // The fast hover path already computes sign-to-house overlap from cached cusps.
    // Re-reading both saved skies and recomputing cusps here would duplicate that work.
    if (!state || state.mode === 'hover' || state.kind !== 'sign') return;
    const sign = Number(state.value);
    if (!Number.isInteger(sign) || sign < 0 || sign > 11) return;
    const bySky = {
      A:housesForSign(read(KEYS.A),sign),
      B:housesForSign(read(KEYS.B),sign)
    };
    document.querySelectorAll('.sky-foundation-house-sector[data-sky][data-house]').forEach(node => {
      if (bySky[node.dataset.sky]?.has(Number(node.dataset.house))) node.classList.add('is-kept');
    });
  }

  window.addEventListener('relphi:sky-foundation-filter-changed',applySignHouseCorrection);
})();
