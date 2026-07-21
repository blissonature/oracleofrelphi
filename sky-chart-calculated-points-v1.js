// Preview-only calculated support for North Node, Lilith, Vertex, and Part of Fortune.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { chart:'relphiSkyChartA', currentSky:'relphiSkyChartB' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  let pending = 0;

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

  function findPlacement(map, names) {
    const keys = Object.keys(map || {});
    for (const name of names) {
      const key = keys.find(function (candidate) { return candidate.toLowerCase() === name.toLowerCase(); });
      if (key) return map[key];
    }
    return null;
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
    const candidates = [profile.utcDateTime, profile.utcIso, profile.instant, profile.dateTimeUtc, profile.isoUtc, profile.calculatedAtUtc, profile.dateTime];
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

  function houseForLongitude(lon, payload) {
    const profile = payload.calcProfile || {};
    const cusps = Array.isArray(profile.houseCusps) ? profile.houseCusps : Array.isArray(profile.cusps) ? profile.cusps : null;
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
    const asc = longitudeOf(findPlacement(map, ['Ascendant','ASC','AC']));
    const sun = longitudeOf(findPlacement(map, ['Sun']));
    const moon = longitudeOf(findPlacement(map, ['Moon']));
    let changed = false;

    function add(name, lon, extra) {
      if (!Number.isFinite(lon)) return;
      const old = findPlacement(map, [name]);
      const next = placementFromLongitude(lon, houseForLongitude(lon, payload), extra);
      if (!old || Math.abs(longitudeOf(old) - lon) > 1 / 120) {
        map[name] = next;
        changed = true;
      }
    }

    if (date) {
      const jd = julianDay(date);
      add('North Node', meanNorthNode(jd), { retrograde:true, calculation:'mean lunar node' });
      add('Lilith', meanLilith(jd), { calculation:'mean lunar apogee' });
    }

    const lst = Number(profile.siderealDegrees ?? profile.localSiderealDegrees ?? profile.lstDegrees);
    const latitude = Number(profile.latitude ?? profile.lat);
    const obliquity = Number(profile.obliquityDegrees ?? profile.obliquity ?? 23.4392911);
    add('Vertex', vertexLongitude(lst, latitude, obliquity), { calculation:'prime vertical intersection' });

    if ([asc, sun, moon].every(Number.isFinite)) {
      const sunPlacement = findPlacement(map, ['Sun']);
      const sunHouse = Number(sunPlacement && sunPlacement.house);
      const isDay = Number.isFinite(sunHouse) ? sunHouse >= 7 && sunHouse <= 12 : true;
      const fortune = isDay ? asc + moon - sun : asc + sun - moon;
      add('Part of Fortune', norm(fortune), { calculation:isDay ? 'day formula' : 'night formula' });
    }

    if (payload.placements && payload.placements !== map) payload.placements = map;
    return changed;
  }

  function augmentSlot(kind) {
    const key = SLOT_KEYS[kind] || SLOT_KEYS.chart;
    const payload = read(key);
    if (!payload || !augmentPayload(payload)) return false;
    write(key, payload);
    const loadId = kind === 'currentSky' ? 'loadCurrentSky' : 'loadChart';
    document.getElementById(loadId)?.click();
    return true;
  }

  function runAfterCalculation() {
    clearTimeout(pending);
    const kind = document.getElementById('skyCalcTarget')?.value === 'currentSky' ? 'currentSky' : 'chart';
    let attempts = 0;
    function check() {
      attempts += 1;
      if (augmentSlot(kind) || attempts >= 30) return;
      pending = setTimeout(check, 100);
    }
    pending = setTimeout(check, 0);
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest?.('#skyCalcRun')) runAfterCalculation();
  }, true);
  window.addEventListener('relphi:sky-builder-v4-loaded', function () {
    augmentSlot('chart');
    augmentSlot('currentSky');
  });
})();
