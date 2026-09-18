// Stable final Sky Chart integration: immediate derived placements and relationship filters.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyFinalPassV2) return;
  window.__relphiSkyFinalPassV2 = true;

  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  // Only preserve points that this layer cannot safely recalculate. Lilith is intentionally excluded:
  // carrying an old Lilith into a newly dated sky makes the new sky inherit the prior sky-state's apogee.
  const PRESERVE = ['Vertex'];
  const HOUSE_SYSTEMS = {
    'whole-sign':'Whole Sign', 'equal-house':'Equal House', porphyry:'Porphyry', placidus:'Placidus',
    alcabitius:'Alcabitius', regiomontanus:'Regiomontanus', campanus:'Campanus', koch:'Koch'
  };
  const ASPECT_LABELS = {
    all:'All', conjunction:'Conjunction', 'semi-sextile':'Semi-Sextile', octile:'Octile', sextile:'Sextile',
    quintile:'Quintile', square:'Square', trine:'Trine', 'tri-octile':'Tri-Octile',
    'bi-quintile':'Bi-Quintile', quincunx:'Quincunx', opposition:'Opposition'
  };
  const filters = { aspect:'all', placement:'all', houseA:'all', houseB:'all' };
  const baseSetItem = Storage.prototype.setItem;
  let enriching = false;
  let queued = false;
  let mutationTimer = 0;

  const norm = value => ((Number(value) % 360) + 360) % 360;
  const normalizedName = value => String(value || '').toLowerCase().replace(/[._-]+/g, '').replace(/\s+/g, '');
  const BASE_SKY_NAMES=new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','asc','ascendant','rising','ac','mc','midheaven','mediumcoeli']);
  const baseSkyName=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
  function hasBaseSky(value){
    if(!value||typeof value!=='object')return false;
    const source=[value.placements,value.positions,value.points,value.bodies]
      .find(candidate=>candidate&&typeof candidate==='object'&&!Array.isArray(candidate));
    if(!source)return false;
    return Object.entries(source).some(([key,item])=>{
      if(!item||typeof item!=='object'||Array.isArray(item))return false;
      const id=baseSkyName(item.name||item.label||item.body||item.planet||item.point||item.id||item.glyphId||key);
      if(!BASE_SKY_NAMES.has(id))return false;
      return Number.isFinite(Number(item.longitude))||
        !!String(item.sign||item.zodiac||'').trim()||
        (item.degree!==''&&item.degree!=null&&Number.isFinite(Number(item.degree)));
    });
  }

  function read(slot) {
    try { return JSON.parse(localStorage.getItem(KEYS[slot]) || 'null'); }
    catch (_) { return null; }
  }

  function placements(value) {
    if (!value || typeof value !== 'object') return {};
    if (!value.placements || typeof value.placements !== 'object' || Array.isArray(value.placements)) value.placements = {};
    return value.placements;
  }

  function find(source, names) {
    const wanted = new Set(names.map(normalizedName));
    for (const [key, item] of Object.entries(source || {})) {
      if (wanted.has(normalizedName(item?.name || item?.label || key))) return item;
    }
    return null;
  }

  function placementObject(name, longitude) {
    const value = norm(longitude);
    const signIndex = Math.floor(value / 30);
    const within = value - signIndex * 30;
    const degree = Math.floor(within);
    const minuteFloat = (within - degree) * 60;
    const minute = Math.floor(minuteFloat);
    const second = Math.round((minuteFloat - minute) * 60);
    return { name, longitude:value, sign:SIGNS[signIndex], degree, minute, second };
  }

  function meanNodeLongitude(date) {
    const jd = date.getTime() / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525;
    return norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000);
  }

  function houseFor(value, cusps) {
    for (let index = 0; index < 12; index += 1) {
      const start = norm(cusps[index]);
      const span = norm(cusps[(index + 1) % 12] - start) || 30;
      if (norm(value - start) < span) return index + 1;
    }
    return 12;
  }

  function previousPlacement(previous, names) {
    const source = previous?.placements && typeof previous.placements === 'object' ? previous.placements : {};
    return find(source, names);
  }

  function enrichPayload(value, previous) {
    if (!value || typeof value !== 'object' || !hasBaseSky(value)) return value;
    const source = placements(value);
    const profile = value.calcProfile && typeof value.calcProfile === 'object' ? value.calcProfile : {};
    const asc = find(source, ['Ascendant','ASC','Rising']);
    const mc = find(source, ['Midheaven','MC']);
    const sun = find(source, ['Sun']);
    const moon = find(source, ['Moon']);

    if (asc && Number.isFinite(Number(asc.longitude))) source.Descendant = placementObject('Descendant', Number(asc.longitude) + 180);
    if (mc && Number.isFinite(Number(mc.longitude))) source.IC = placementObject('IC', Number(mc.longitude) + 180);

    const instant = new Date(profile.instant || profile.dateTime || Date.now());
    if (!Number.isNaN(instant.getTime())) {
      source['North Node'] = placementObject('North Node', meanNodeLongitude(instant));
      source['South Node'] = placementObject('South Node', Number(source['North Node'].longitude) + 180);
    }

    PRESERVE.forEach(name => {
      if (find(source, [name])) return;
      const prior = previousPlacement(previous, [name]);
      if (prior) source[name] = { ...prior };
    });

    if (asc && sun && moon && Number.isFinite(Number(asc.longitude)) && Number.isFinite(Number(sun.longitude)) && Number.isFinite(Number(moon.longitude))) {
      let isDay = true;
      try {
        if (window.SunCalc && Number.isFinite(Number(profile.latitude)) && Number.isFinite(Number(profile.longitude))) {
          isDay = window.SunCalc.getPosition(instant, Number(profile.latitude), Number(profile.longitude)).altitude > 0;
        }
      } catch (_) {}
      source['Part of Fortune'] = placementObject(
        'Part of Fortune',
        isDay
          ? Number(asc.longitude) + Number(moon.longitude) - Number(sun.longitude)
          : Number(asc.longitude) + Number(sun.longitude) - Number(moon.longitude)
      );
    }

    const rawCusps = profile.houseCusps || profile.cusps || value.houseCusps || value.cusps;
    if (Array.isArray(rawCusps) && rawCusps.length === 12 && rawCusps.every(item => Number.isFinite(Number(item)))) {
      const cusps = rawCusps.map(norm);
      value.houseCusps = cusps;
      value.calcProfile = { ...profile, houseCusps:cusps, cusps };
      Object.values(source).forEach(item => {
        if (Number.isFinite(Number(item?.longitude))) item.house = houseFor(Number(item.longitude), cusps);
      });
    }
    return value;
  }

  Storage.prototype.setItem = function (key, raw) {
    if (!enriching && this === localStorage && Object.values(KEYS).includes(String(key))) {
      try {
        const next = JSON.parse(String(raw));
        const previous = JSON.parse(localStorage.getItem(String(key)) || 'null');
        enriching = true;
        return baseSetItem.call(this, key, JSON.stringify(enrichPayload(next, previous)));
      } catch (_) {
        // Fall through to the existing storage pipeline for non-JSON values.
      } finally {
        enriching = false;
      }
    }
    return baseSetItem.call(this, key, raw);
  };

  function dispatch(slot) {
    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key:KEYS[slot], newValue:localStorage.getItem(KEYS[slot]), storageArea:localStorage
      }));
    } catch (_) {
      const event = new Event('storage');
      Object.defineProperty(event, 'key', { value:KEYS[slot] });
      window.dispatchEvent(event);
    }
  }

  function completeStored(slot, emit) {
    const current = read(slot);
    if (!current || !hasBaseSky(current)) return false;
    const before = JSON.stringify(current);
    const after = JSON.stringify(enrichPayload(current, current));
    if (before === after) return false;
    localStorage.setItem(KEYS[slot], after);
    if (emit) dispatch(slot);
    return true;
  }

  function calculateHouseSystem(slot, system) {
    const value = read(slot);
    if (!value) throw new Error(`Sky ${slot} is empty.`);
    const profile = value.calcProfile || {};
    const source = placements(value);
    const asc = find(source, ['Ascendant','ASC','Rising']);
    const mc = find(source, ['Midheaven','MC']);
    if (!asc || !mc) throw new Error(`Sky ${slot} needs Ascendant and Midheaven before changing house system.`);
    if (!window.RelphiHouseSystems || !window.Astronomy) throw new Error('The house calculation engine is unavailable.');
    const instant = new Date(profile.instant || profile.dateTime || Date.now());
    const longitude = Number(profile.longitude);
    const latitude = Number(profile.latitude);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) throw new Error(`Sky ${slot} needs resolved coordinates.`);
    const siderealDegrees = norm(window.Astronomy.SiderealTime(instant) * 15 + longitude);
    const obliquityDegrees = Number(window.Astronomy.e_tilt(instant).tobl);
    const result = window.RelphiHouseSystems.calculateCusps({
      system, ascendant:Number(asc.longitude), midheaven:Number(mc.longitude),
      siderealDegrees, obliquityDegrees, latitude
    });
    value.calcProfile = { ...profile, houseSystem:result.system, houseCusps:result.cusps, cusps:result.cusps, houseSystemNote:result.note };
    value.houseCusps = result.cusps;
    Object.values(source).forEach(item => {
      if (Number.isFinite(Number(item?.longitude))) item.house = houseFor(Number(item.longitude), result.cusps);
    });
    localStorage.setItem(KEYS[slot], JSON.stringify(value));
    dispatch(slot);
  }

  function changeHouseSystem(select) {
    try {
      calculateHouseSystem('A', select.value);
      calculateHouseSystem('B', select.value);
      select.setCustomValidity('');
    } catch (error) {
      console.error(error);
      select.setCustomValidity(error.message);
      select.reportValidity();
    }
  }

  function addFilters() {
    const relationshipPanel = document.getElementById('skyFoundationRelationships');
    if (!relationshipPanel) return;
    let bar = relationshipPanel.querySelector('.sky-chart-filter-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'sky-chart-filter-bar';
      relationshipPanel.insertBefore(bar, relationshipPanel.querySelector('#skyFoundationRelationshipList'));
    }
    if (bar.dataset.finalFilterOwner === 'true') return;
    bar.dataset.finalFilterOwner = 'true';
    const aspectOptions = Object.entries(ASPECT_LABELS).map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    const houses = ['all', ...Array.from({ length:12 }, (_, index) => String(index + 1))]
      .map(value => `<option value="${value}">${value === 'all' ? 'All' : value}</option>`).join('');
    const current = read('A')?.calcProfile?.houseSystem || read('B')?.calcProfile?.houseSystem || 'whole-sign';
    const systems = Object.entries(HOUSE_SYSTEMS)
      .map(([value, label]) => `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`).join('');
    bar.innerHTML = `<label>Aspects<select data-filter="aspect">${aspectOptions}</select></label><label>Placements<select data-filter="placement"><option value="all">All</option></select></label><label>Sky A House<select data-filter="houseA">${houses}</select></label><label>Sky B House<select data-filter="houseB">${houses}</select></label><label>House System<select data-house-system-filter>${systems}</select></label>`;
    bar.addEventListener('change', event => {
      if (event.target.matches('[data-house-system-filter]')) return changeHouseSystem(event.target);
      if (!event.target.dataset.filter) return;
      filters[event.target.dataset.filter] = event.target.value;
      applyFilters();
    });
    refreshPlacementFilter();
  }

  function refreshPlacementFilter() {
    const select = document.querySelector('[data-filter="placement"]');
    if (!select) return;
    const values = new Map();
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row => {
      const copies = row.querySelectorAll('.sky-foundation-relationship-copy');
      [
        [row.dataset.leftPlacement, copies[0]?.childNodes?.[0]?.textContent],
        [row.dataset.rightPlacement, copies[1]?.childNodes?.[0]?.textContent]
      ].forEach(([id, label]) => { if (id) values.set(id, String(label || id).trim()); });
    });
    const entries = [...values.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    const nextSignature = JSON.stringify(entries);
    if (select.dataset.finalPlacementOptions === nextSignature) return;
    const previous = select.value;
    select.innerHTML = '<option value="all">All</option>';
    entries.forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    select.value = [...select.options].some(option => option.value === previous) ? previous : 'all';
    select.dataset.finalPlacementOptions = nextSignature;
  }

  function applyFilters() {
    const linesByIndex = new Map();
    document.querySelectorAll('[data-layer="aspects"] [data-relation-index]').forEach(node => {
      const index = String(node.dataset.relationIndex || '');
      if (!linesByIndex.has(index)) linesByIndex.set(index, []);
      linesByIndex.get(index).push(node);
    });
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row => {
      const label = String(row.getAttribute('aria-label') || '').toLowerCase();
      const visible =
        (filters.aspect === 'all' || label.includes(filters.aspect)) &&
        (filters.placement === 'all' || row.dataset.leftPlacement === filters.placement || row.dataset.rightPlacement === filters.placement) &&
        (filters.houseA === 'all' || row.dataset.leftHouse === filters.houseA) &&
        (filters.houseB === 'all' || row.dataset.rightHouse === filters.houseB);
      row.classList.toggle('sky-chart-filter-hidden', !visible);
      (linesByIndex.get(String(row.dataset.relationIndex || '')) || [])
        .forEach(node => node.classList.toggle('sky-chart-filter-hidden', !visible));
    });
  }

  function removeAxisLabels() {
    document.querySelectorAll('#skyFoundationWheelMount .sky-axis-label').forEach(node => node.remove());
    document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')?.removeAttribute('data-final-axis-labels');
  }

  function hideAspectBoxes() {
    document.querySelectorAll('.sky-foundation-aspect-hit,[data-layer="aspects"] rect').forEach(node => {
      node.setAttribute('fill', 'transparent');
      node.setAttribute('stroke', 'transparent');
      node.style.outline = 'none';
    });
  }

  function whereWhenEditing() {
    return document.documentElement.dataset.skyWhereWhenEditing === 'true';
  }

  function refresh() {
    queued = false;
    if (whereWhenEditing()) return;
    addFilters();
    refreshPlacementFilter();
    applyFilters();
    removeAxisLabels();
    hideAspectBoxes();
    document.documentElement.dataset.skyFinalPass = 'v2';
  }

  function schedule() {
    if (queued || whereWhenEditing()) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function relevantMutation(record) {
    return Array.from(record.addedNodes || []).some(node => node.nodeType === 1 && (
      node.matches?.('.sky-where-when-editor,.sky-where-when-actions,.sky-chart-filter-bar,#skyFoundationRelationships,.sky-foundation-wheel') ||
      node.querySelector?.('.sky-where-when-editor,.sky-where-when-actions,.sky-chart-filter-bar,#skyFoundationRelationships,.sky-foundation-wheel')
    ));
  }

  function start() {
    const changedA = completeStored('A', false);
    const changedB = completeStored('B', false);
    if (changedA) dispatch('A');
    if (changedB) dispatch('B');
    const root = document.getElementById('skyFoundationRoot');
    if (root) new MutationObserver(records => {
      clearTimeout(mutationTimer);
      if (!records.some(relevantMutation)) return;
      mutationTimer = setTimeout(schedule, 0);
    }).observe(root, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-foundation-ready', schedule);
    window.addEventListener('relphi:sky-foundation-interactions-ready', schedule);
    window.addEventListener('storage', schedule);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
