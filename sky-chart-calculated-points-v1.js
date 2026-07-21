// Preview-only calculated support for nodes, angles, Lilith, Vertex, and Part of Fortune.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { chart:'relphiSkyChartA', currentSky:'relphiSkyChartB' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  let pending = 0;
  let reloading = false;

  function norm(x) { x = Number(x); return ((x % 360) + 360) % 360; }
  function rad(x) { return Number(x) * Math.PI / 180; }
  function deg(x) { return Number(x) * 180 / Math.PI; }
  function read(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (_) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function entries(payload) { return payload && (payload.placements || payload) || {}; }

  function longitudeOf(item) {
    if (!item || typeof item !== 'object') return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(item.longitude);
    const signIndex = SIGNS.findIndex(function (sign) { return sign.toLowerCase() === String(item.sign || '').trim().toLowerCase(); });
    if (signIndex < 0 || !Number.isFinite(Number(item.degree))) return NaN;
    return norm(signIndex * 30 + Number(item.degree) + (Number(item.minute) || 0) / 60 + (Number(item.second) || 0) / 3600);
  }

  function keyFor(map, names) {
    const keys = Object.keys(map || {});
    for (const name of names) {
      const exact = keys.find(function (candidate) { return candidate.toLowerCase() === name.toLowerCase(); });
      if (exact) return exact;
    }
    return '';
  }

  function findPlacement(map, names) {
    const key = keyFor(map, names);
    return key ? map[key] : null;
  }

  function placementFromLongitude(lon, house, extra) {
    lon = norm(lon);
    const signIndex = Math.floor(lon / 30);
    const within = lon - signIndex * 30;
    let degree = Math.floor(within);
    let minute = Math.round((within - degree) * 60);
    if (minute === 60) { minute = 0; degree += 1; }
    if (degree === 30) { degree = 0; lon = norm(lon + 1 / 3600); }
    return Object.assign({
      sign:SIGNS[Math.floor(lon / 30)], degree:degree, minute:minute,
      longitude:lon, house:Number.isFinite(Number(house)) ? Number(house) : ''
    }, extra || {});
  }

  function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }

  function dateFromProfile(profile) {
    const candidates = [profile.utcDateTime, profile.utcIso, profile.instant, profile.dateTimeUtc, profile.isoUtc, profile.calculatedAtUtc, profile.dateTime, profile.datetime];
    for (const value of candidates) {
      if (!value) continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
    return null;
  }

  function meanNorthNode(jd) {
    const T = (jd - 2451545.0) / 36525;
    return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - Math.pow(T,4) / 60616000);
  }

  function meanLilith(jd) {
    const T = (jd - 2451545.0) / 36525;
    const perigee = 83.3532465 + 4069.0137287 * T - 0.0103200 * T * T - Math.pow(T,3) / 80053 + Math.pow(T,4) / 18999000;
    return norm(perigee + 180);
  }

  function rightAscensionFromEcliptic(lon, obliquity) {
    const lambda = rad(lon);
    const eps = rad(obliquity);
    return norm(deg(Math.atan2(Math.sin(lambda) * Math.cos(eps), Math.cos(lambda))));
  }

  function vertexLongitude(lst, latitude, obliquity) {
    if (![lst, latitude, obliquity].every(function (v) { return Number.isFinite(Number(v)); })) return NaN;
    const L = rad(norm(lst));
    const phi = rad(Math.max(-89.999, Math.min(89.999, Number(latitude))));
    const eps = rad(Number(obliquity));
    const north = { x:-Math.sin(phi) * Math.cos(L), y:-Math.sin(phi) * Math.sin(L), z:Math.cos(phi) };
    const eclNormal = { x:0, y:-Math.sin(eps), z:Math.cos(eps) };
    const cross = {
      x:north.y * eclNormal.z - north.z * eclNormal.y,
      y:north.z * eclNormal.x - north.x * eclNormal.z,
      z:north.x * eclNormal.y - north.y * eclNormal.x
    };
    const mag = Math.hypot(cross.x, cross.y, cross.z) || 1;
    const a = { x:cross.x / mag, y:cross.y / mag, z:cross.z / mag };
    const west = { x:Math.sin(L), y:-Math.cos(L), z:0 };
    const chosen = (a.x * west.x + a.y * west.y + a.z * west.z) >= 0 ? a : { x:-a.x, y:-a.y, z:-a.z };
    const yEcl = chosen.y * Math.cos(eps) + chosen.z * Math.sin(eps);
    return norm(deg(Math.atan2(yEcl, chosen.x)));
  }

  function profileCusps(payload) {
    const profile = payload.calcProfile || {};
    return Array.isArray(profile.houseCusps) ? profile.houseCusps : Array.isArray(profile.cusps) ? profile.cusps : null;
  }

  function houseForLongitude(lon, payload) {
    const cusps = profileCusps(payload);
    if (!cusps || cusps.length < 12) return '';
    for (let i = 0; i < 12; i += 1) {
      const start = norm(cusps[i]);
      const end = norm(cusps[(i + 1) % 12]);
      const span = norm(end - start);
      if (norm(lon - start) < span || Math.abs(norm(lon - start) - span) < 1e-8) return i + 1;
    }
    return '';
  }

  function augmentPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    const map = entries(payload);
    if (!map || typeof map !== 'object') return false;
    const profile = payload.calcProfile || {};
    const date = dateFromProfile(profile);
    const asc = longitudeOf(findPlacement(map, ['Rising','Ascendant','ASC','AC']));
    const mc = longitudeOf(findPlacement(map, ['MC','Midheaven']));
    const sun = longitudeOf(findPlacement(map, ['Sun']));
    const moon = longitudeOf(findPlacement(map, ['Moon']));
    let changed = false;

    function add(name, lon, extra, aliases) {
      if (!Number.isFinite(lon)) return;
      const names = [name].concat(aliases || []);
      const existingKey = keyFor(map, names);
      const old = existingKey ? map[existingKey] : null;
      const next = placementFromLongitude(lon, houseForLongitude(lon, payload), extra);
      if (!old || Math.abs(longitudeOf(old) - lon) > 1 / 120 || existingKey !== name) {
        if (existingKey && existingKey !== name) delete map[existingKey];
        map[name] = next;
        changed = true;
      }
    }

    if (date) {
      const jd = julianDay(date);
      const north = meanNorthNode(jd);
      add('North Node', north, { retrograde:true, glyph:'☊', calculation:'mean lunar node' }, ['Node']);
      add('South Node', norm(north + 180), { retrograde:true, glyph:'☋', calculation:'opposite mean lunar node' });
      add('Lilith', meanLilith(jd), { glyph:'⚸', calculation:'mean lunar apogee' });
    }

    if (Number.isFinite(asc)) {
      add('Rising', asc, { glyph:'ASC', angle:true, calculation:'ascendant' }, ['Ascendant','ASC','AC']);
      add('Dsc', norm(asc + 180), { glyph:'DSC', angle:true, calculation:'opposite ascendant' }, ['Descendant','DSC']);
    }
    if (Number.isFinite(mc)) {
      add('MC', mc, { glyph:'MC', angle:true, calculation:'midheaven' }, ['Midheaven']);
      add('IC', norm(mc + 180), { glyph:'IC', angle:true, calculation:'opposite midheaven' });
    }

    const obliquity = Number(profile.obliquityDegrees ?? profile.obliquity ?? 23.4392911);
    const latitude = Number(profile.latitude ?? profile.lat ?? profile.coordinates?.latitude);
    let lst = Number(profile.siderealDegrees ?? profile.localSiderealDegrees ?? profile.lstDegrees ?? profile.localSiderealTimeDegrees);
    if (!Number.isFinite(lst) && Number.isFinite(mc)) lst = rightAscensionFromEcliptic(mc, obliquity);
    add('Vertex', vertexLongitude(lst, latitude, obliquity), { glyph:'Vx', calculation:'prime vertical intersection' });

    if ([asc, sun, moon].every(Number.isFinite)) {
      const sunPlacement = findPlacement(map, ['Sun']);
      const sunHouse = Number(sunPlacement && sunPlacement.house);
      const isDay = Number.isFinite(sunHouse) ? sunHouse >= 7 && sunHouse <= 12 : true;
      const fortune = isDay ? asc + moon - sun : asc + sun - moon;
      add('Part of Fortune', norm(fortune), { glyph:'⊗', calculation:isDay ? 'day formula' : 'night formula' }, ['Fortune','POF']);
    }

    if (payload.placements && payload.placements !== map) payload.placements = map;
    return changed;
  }

  function augmentSlot(kind) {
    const key = SLOT_KEYS[kind] || SLOT_KEYS.chart;
    const payload = read(key);
    if (!payload) return false;
    const changed = augmentPayload(payload);
    if (!changed) return false;
    write(key, payload);
    if (!reloading) {
      reloading = true;
      const loadId = kind === 'currentSky' ? 'loadCurrentSky' : 'loadChart';
      document.getElementById(loadId)?.click();
      setTimeout(function () { reloading = false; }, 0);
    }
    window.dispatchEvent(new CustomEvent('relphi:extra-points-updated', { detail:{ calculated:true } }));
    return true;
  }

  function runAfterCalculation() {
    clearTimeout(pending);
    const kind = document.getElementById('skyCalcTarget')?.value === 'currentSky' ? 'currentSky' : 'chart';
    let attempts = 0;
    function check() {
      attempts += 1;
      if (augmentSlot(kind) || attempts >= 40) return;
      pending = setTimeout(check, 100);
    }
    pending = setTimeout(check, 0);
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest?.('#skyCalcRun')) runAfterCalculation();
  }, true);
  window.addEventListener('relphi:sky-builder-v4-loaded', function () {
    setTimeout(function () {
      augmentSlot('chart');
      augmentSlot('currentSky');
    }, 0);
  });
})();