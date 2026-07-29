// Appends the second-step calculated points and Chiron after a complete primary sky exists.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiCalculatedPointStorageBridgeV4) return;
  window.__relphiCalculatedPointStorageBridgeV4 = true;

  const SLOT_KEYS = new Set(['relphiSkyChartA', 'relphiSkyChartB']);
  const CORE = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const REQUIRED_DERIVED = ['North Node','South Node','Lilith','Vertex','Part of Fortune'];
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const originalSetItem = Storage.prototype.setItem;
  let calculationActiveUntil = 0;
  let calculationKey = '';
  let chironRequest = null;

  function norm(value) { value = Number(value); return ((value % 360) + 360) % 360; }
  function rad(value) { return Number(value) * Math.PI / 180; }
  function deg(value) { return Number(value) * 180 / Math.PI; }
  function placementsOf(payload) {
    const map = payload && (payload.placements || payload);
    return map && typeof map === 'object' && !Array.isArray(map) ? map : null;
  }
  function keyFor(map, aliases) {
    const wanted = aliases.map(function (name) { return name.toLowerCase(); });
    return Object.keys(map || {}).find(function (key) { return wanted.includes(String(key).trim().toLowerCase()); }) || '';
  }
  function placement(map, aliases) { const key = keyFor(map, aliases); return key ? map[key] : null; }
  function hasAll(map, names) { return names.every(function (name) { return Boolean(placement(map, [name])); }); }
  function hasCompletePrimarySky(map) { return hasAll(map, CORE); }
  function field(id) { return document.getElementById(id)?.value || ''; }
  function activeProfile(payload) {
    const existing = payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
    return Object.assign({}, existing, {
      dateTime:field('skyCalcDateTime') || existing.dateTime || '',
      latitude:field('skyCalcLatitude') || existing.latitude || '',
      longitude:field('skyCalcLongitude') || existing.longitude || '',
      location:field('skyCalcLocation') || existing.location || '',
      timeZone:field('skyCalcTimeZone') || existing.timeZone || '',
      houseSystem:field('skyCalcHouseSystem') || existing.houseSystem || 'whole-sign'
    });
  }
  function longitudeOf(item) {
    if (!item || typeof item !== 'object') return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(item.longitude);
    const index = SIGNS.findIndex(function (sign) { return sign.toLowerCase() === String(item.sign || '').trim().toLowerCase(); });
    if (index < 0 || !Number.isFinite(Number(item.degree))) return NaN;
    return norm(index * 30 + Number(item.degree) + (Number(item.minute) || 0) / 60 + (Number(item.second) || 0) / 3600);
  }
  function fromLongitude(lon, house, extra) {
    lon = norm(lon);
    const index = Math.floor(lon / 30);
    const within = lon - index * 30;
    let degree = Math.floor(within);
    let minute = Math.round((within - degree) * 60);
    if (minute === 60) { minute = 0; degree += 1; }
    if (degree === 30) { degree = 0; lon = norm(lon + 1 / 3600); }
    return Object.assign({ sign:SIGNS[Math.floor(lon / 30)], degree:degree, minute:minute, longitude:lon, house:Number.isFinite(Number(house)) ? Number(house) : '' }, extra || {});
  }
  function dateFrom(profile) {
    const values = [profile.utcDateTime, profile.utcIso, profile.instant, profile.dateTimeUtc, profile.isoUtc, profile.calculatedAtUtc, profile.dateTime, profile.datetime];
    for (const value of values) {
      if (!value) continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
    return null;
  }
  function meanNorthNode(jd) {
    const T = (jd - 2451545.0) / 36525;
    return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - Math.pow(T, 4) / 60616000);
  }
  function meanLilith(jd) {
    const T = (jd - 2451545.0) / 36525;
    return norm(83.3532465 + 4069.0137287 * T - 0.0103200 * T * T - Math.pow(T, 3) / 80053 + Math.pow(T, 4) / 18999000 + 180);
  }
  function rightAscension(lon, obliquity) {
    const lambda = rad(lon), eps = rad(obliquity);
    return norm(deg(Math.atan2(Math.sin(lambda) * Math.cos(eps), Math.cos(lambda))));
  }
  function vertexLongitude(lst, latitude, obliquity) {
    if (![lst, latitude, obliquity].every(function (value) { return Number.isFinite(Number(value)); })) return NaN;
    const L = rad(norm(lst)), phi = rad(Math.max(-89.999, Math.min(89.999, Number(latitude)))), eps = rad(obliquity);
    const north = { x:-Math.sin(phi) * Math.cos(L), y:-Math.sin(phi) * Math.sin(L), z:Math.cos(phi) };
    const normal = { x:0, y:-Math.sin(eps), z:Math.cos(eps) };
    const cross = { x:north.y * normal.z - north.z * normal.y, y:north.z * normal.x - north.x * normal.z, z:north.x * normal.y - north.y * normal.x };
    const magnitude = Math.hypot(cross.x, cross.y, cross.z) || 1;
    const a = { x:cross.x / magnitude, y:cross.y / magnitude, z:cross.z / magnitude };
    const west = { x:Math.sin(L), y:-Math.cos(L), z:0 };
    const chosen = a.x * west.x + a.y * west.y + a.z * west.z >= 0 ? a : { x:-a.x, y:-a.y, z:-a.z };
    return norm(deg(Math.atan2(chosen.y * Math.cos(eps) + chosen.z * Math.sin(eps), chosen.x)));
  }
  function houseCusps(payload) {
    const profile = payload.calcProfile || {};
    return Array.isArray(profile.houseCusps) ? profile.houseCusps : Array.isArray(profile.cusps) ? profile.cusps : null;
  }
  function houseFor(lon, payload) {
    const cusps = houseCusps(payload);
    if (!cusps || cusps.length < 12) return '';
    for (let i = 0; i < 12; i += 1) {
      const start = norm(cusps[i]);
      const span = norm(cusps[(i + 1) % 12] - start);
      if (norm(lon - start) < span) return i + 1;
    }
    return '';
  }
  function add(map, payload, name, lon, extra, aliases) {
    if (!Number.isFinite(lon)) return;
    const all = [name].concat(aliases || []);
    Object.keys(map).forEach(function (key) {
      if (all.some(function (alias) { return key.toLowerCase() === alias.toLowerCase(); }) && key !== name) delete map[key];
    });
    map[name] = fromLongitude(lon, houseFor(lon, payload), extra);
  }
  function augmentDerived(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    const map = placementsOf(payload);
    if (!map || !hasCompletePrimarySky(map)) return payload;
    payload.calcProfile = activeProfile(payload);
    const profile = payload.calcProfile;
    const asc = longitudeOf(placement(map, ['Rising','Ascendant','ASC','AC']));
    const mc = longitudeOf(placement(map, ['MC','Midheaven']));
    const sun = longitudeOf(placement(map, ['Sun']));
    const moon = longitudeOf(placement(map, ['Moon']));
    const date = dateFrom(profile);
    if (date) {
      const jd = date.getTime() / 86400000 + 2440587.5;
      const node = meanNorthNode(jd);
      add(map, payload, 'North Node', node, { retrograde:true, glyph:'☊', calculation:'mean lunar node' }, ['Node','True North Node','Mean North Node','Ascending Node']);
      add(map, payload, 'South Node', norm(node + 180), { retrograde:true, glyph:'☋', calculation:'opposite mean lunar node' }, ['Descending Node']);
      add(map, payload, 'Lilith', meanLilith(jd), { glyph:'⚸', calculation:'mean lunar apogee' }, ['Black Moon Lilith','BML']);
    }
    const obliquity = Number(profile.obliquityDegrees ?? profile.obliquity ?? 23.4392911);
    const latitude = Number(profile.latitude ?? profile.lat ?? profile.coordinates?.latitude);
    let lst = Number(profile.siderealDegrees ?? profile.localSiderealDegrees ?? profile.lstDegrees ?? profile.localSiderealTimeDegrees);
    if (!Number.isFinite(lst) && Number.isFinite(mc)) lst = rightAscension(mc, obliquity);
    add(map, payload, 'Vertex', vertexLongitude(lst, latitude, obliquity), { glyph:'Vx', calculation:'prime vertical intersection' }, ['Vx']);
    if ([asc, sun, moon].every(Number.isFinite)) {
      const sunHouse = Number(placement(map, ['Sun'])?.house);
      const isDay = Number.isFinite(sunHouse) ? sunHouse >= 7 && sunHouse <= 12 : true;
      add(map, payload, 'Part of Fortune', norm(isDay ? asc + moon - sun : asc + sun - moon), { glyph:'⊗', calculation:isDay ? 'day formula' : 'night formula' }, ['Fortune','POF','Pars Fortunae']);
    }
    if (payload.placements && payload.placements !== map) payload.placements = map;
    return payload;
  }
  function horizonsDate(date) {
    return date.getUTCFullYear() + '-' + String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + String(date.getUTCDate()).padStart(2, '0') + ' ' + String(date.getUTCHours()).padStart(2, '0') + ':' + String(date.getUTCMinutes()).padStart(2, '0');
  }
  function parseHorizonsLongitudes(result) {
    const block = String(result || '').match(/\$\$SOE([\s\S]*?)\$\$EOE/);
    if (!block) return [];
    return block[1].split(/\r?\n/).map(function (line) {
      const fields = line.split(',').map(function (item) { return item.trim(); });
      const numeric = fields.slice(1).find(function (item) { return /^[-+]?\d+(?:\.\d+)?$/.test(item); });
      return numeric == null ? NaN : Number(numeric);
    }).filter(Number.isFinite);
  }
  async function fetchChiron(payload) {
    const profile = payload.calcProfile || {};
    const date = dateFrom(profile);
    if (!date) throw new Error('Chiron requires a valid calculation date and time.');
    const stop = new Date(date.getTime() + 86400000);
    const params = new URLSearchParams({
      format:'json', COMMAND:"'2060'", OBJ_DATA:"'NO'", MAKE_EPHEM:"'YES'", EPHEM_TYPE:"'OBSERVER'",
      CENTER:"'500@399'", START_TIME:"'" + horizonsDate(date) + "'", STOP_TIME:"'" + horizonsDate(stop) + "'",
      STEP_SIZE:"'1 d'", QUANTITIES:"'31'", ANG_FORMAT:"'DEG'", CSV_FORMAT:"'YES'"
    });
    const response = await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?' + params.toString(), { mode:'cors', cache:'no-store' });
    if (!response.ok) throw new Error('JPL Horizons returned ' + response.status + '.');
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    const values = parseHorizonsLongitudes(data.result);
    if (!values.length) throw new Error('JPL Horizons did not return a Chiron longitude.');
    const first = norm(values[0]);
    const second = values.length > 1 ? norm(values[1]) : first;
    return { longitude:first, retrograde:norm(second - first) > 180 };
  }
  function setStatus(message, error) {
    const native = document.getElementById('skyCalcStatus');
    if (native) native.textContent = message;
    const builder = document.getElementById('relphiV4Status');
    if (builder) {
      builder.textContent = message;
      builder.hidden = false;
      builder.classList.toggle('is-error', Boolean(error));
    }
  }
  function completeWithChiron(key, payload) {
    if (chironRequest) return;
    setStatus('Calculating Chiron and finalizing 20 placements…');
    chironRequest = fetchChiron(payload).then(function (chiron) {
      const map = placementsOf(payload);
      add(map, payload, 'Chiron', chiron.longitude, { glyph:'⚷', retrograde:chiron.retrograde, calculation:'JPL Horizons geocentric ecliptic longitude' }, []);
      originalSetItem.call(localStorage, key, JSON.stringify(payload));
      calculationActiveUntil = 0;
      calculationKey = '';
      setStatus('Calculated 20 placements, including Chiron.');
      window.dispatchEvent(new CustomEvent('relphi:extra-points-updated', { detail:{ calculated:true, chiron:true, placementCount:Object.keys(map).length } }));
    }).catch(function (error) {
      calculationActiveUntil = 0;
      calculationKey = '';
      setStatus('Chiron could not be calculated: ' + error.message, true);
    }).finally(function () { chironRequest = null; });
  }

  document.addEventListener('click', function (event) {
    if (!event.target.closest?.('#skyCalcRun')) return;
    calculationActiveUntil = Date.now() + 30000;
    calculationKey = document.getElementById('skyCalcTarget')?.value === 'currentSky' ? 'relphiSkyChartB' : 'relphiSkyChartA';
  }, true);

  Storage.prototype.setItem = function (key, value) {
    if (this === localStorage && SLOT_KEYS.has(String(key))) {
      try {
        const payload = JSON.parse(String(value));
        const map = placementsOf(payload);
        if (Date.now() < calculationActiveUntil && String(key) === calculationKey) {
          if (!map || !hasCompletePrimarySky(map)) return;
          augmentDerived(payload);
          if (!hasAll(map, REQUIRED_DERIVED)) return;
          if (!placement(map, ['Chiron'])) {
            completeWithChiron(String(key), payload);
            return;
          }
        } else if (map && hasCompletePrimarySky(map)) {
          augmentDerived(payload);
        }
        value = JSON.stringify(payload);
      } catch (_) {}
    }
    return originalSetItem.call(this, key, value);
  };

  window.RelphiCalculatedPointStorageBridge = {
    augment:augmentDerived,
    hasCompletePrimarySky:hasCompletePrimarySky,
    fetchChiron:fetchChiron
  };
})();