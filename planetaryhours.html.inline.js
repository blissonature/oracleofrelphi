
(function () {
  const planets = [
    {key:'saturn', sym:'♄', name:'Saturn', focusDay:'Structure, boundaries, karmic audit', focusHour:'Consolidate, prune, commit'},
    {key:'jupiter', sym:'♃', name:'Jupiter', focusDay:'Growth, teaching, wisdom', focusHour:'Expand, publish, mentor'},
    {key:'mars', sym:'♂', name:'Mars', focusDay:'Courage, cutting, heat', focusHour:'Act, compete, cauterize'},
    {key:'sun', sym:'☉', name:'Sun', focusDay:'Vitality, authority, radiance', focusHour:'Lead, clarify, spotlight'},
    {key:'venus', sym:'♀', name:'Venus', focusDay:'Harmony, bonds, aesthetics', focusHour:'Relate, attract, refine'},
    {key:'mercury', sym:'☿', name:'Mercury', focusDay:'Trade, signals, analysis', focusHour:'Write, ship, negotiate'},
    {key:'moon', sym:'☽', name:'Moon', focusDay:'Care, tides, memory', focusHour:'Nourish, adapt, reflect'}
  ];
  const byKey = Object.fromEntries(planets.map(function (p) { return [p.key, p]; }));
  const chaldean = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const weekdayToRuler = {0:'sun',1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn'};
  const rulerToWeekday = {sun:0, moon:1, mars:2, mercury:3, jupiter:4, venus:5, saturn:6};
  const mythicProfiles = {
    sun: 'https://commons.wikimedia.org/wiki/Special:FilePath/Belvedere_Apollo_Pio-Clementino_Inv1015.jpg?width=640',
    moon: 'https://commons.wikimedia.org/wiki/Special:FilePath/Diane_de_Versailles_-_Mus%C3%A9e_du_Louvre_AGER_Ma_589.jpg?width=640',
    mercury: 'https://commons.wikimedia.org/wiki/Special:FilePath/Hermes_from_Agaion_241_NAMAthens.jpg?width=640',
    venus: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cnidus_Aphrodite_Altemps_Inv8619.jpg?width=640',
    mars: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ares_%28Mars%29_-_the_Greek_god_of_war.jpg?width=640',
    jupiter: 'https://commons.wikimedia.org/wiki/Special:FilePath/Roman_Marble_Statue_of_Jupiter_%28Zeus%29_Accompanied_by_Eagle%2C_2nd_C._AD_%2827683776204%29.jpg?width=640',
    saturn: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chronos_MET_DP-932-001.jpg?width=640'
  };
  const state = { tz: 'Europe/London', lat: 51.4769, lon: -0.0005, useSystem: true, now: new Date(), locationName: 'Greenwich, London, UK', moonOrientation: 'auto', skyBody: 'Saturn', skyHasRun: false, heptagramHourOverride: null, timeFormat: '12h' };
  const locationPresets = [
    {name:'Greenwich, London, UK', lat:51.4769, lon:-0.0005, tz:'Europe/London'},
    {name:'Boston, Massachusetts, USA', lat:42.3601, lon:-71.0589, tz:'America/New_York'},
    {name:'Cambridge, Massachusetts, USA', lat:42.3736, lon:-71.1097, tz:'America/New_York'},
    {name:'Los Angeles, California, USA', lat:34.0522, lon:-118.2437, tz:'America/Los_Angeles'},
    {name:'New York, New York, USA', lat:40.7128, lon:-74.0060, tz:'America/New_York'},
    {name:'Chicago, Illinois, USA', lat:41.8781, lon:-87.6298, tz:'America/Chicago'},
    {name:'Denver, Colorado, USA', lat:39.7392, lon:-104.9903, tz:'America/Denver'},
    {name:'Phoenix, Arizona, USA', lat:33.4484, lon:-112.0740, tz:'America/Phoenix'},
    {name:'Seattle, Washington, USA', lat:47.6062, lon:-122.3321, tz:'America/Los_Angeles'},
    {name:'Portland, Oregon, USA', lat:45.5152, lon:-122.6784, tz:'America/Los_Angeles'},
    {name:'San Francisco, California, USA', lat:37.7749, lon:-122.4194, tz:'America/Los_Angeles'},
    {name:'Austin, Texas, USA', lat:30.2672, lon:-97.7431, tz:'America/Chicago'},
    {name:'London, England, UK', lat:51.5072, lon:-0.1276, tz:'Europe/London'},
    {name:'Paris, France', lat:48.8566, lon:2.3522, tz:'Europe/Paris'},
    {name:'Dublin, Ireland', lat:53.3498, lon:-6.2603, tz:'Europe/Dublin'},
    {name:'Cairo, Egypt', lat:30.0444, lon:31.2357, tz:'Africa/Cairo'}
  ];

  const el = {
    clock: document.getElementById('localClock'),
    panelCurrentTime: document.getElementById('phPanelCurrentTime'),
    timeFormatToggle: document.getElementById('timeFormatToggle'),
    copy: document.getElementById('copyLink'),
    useGeo: document.getElementById('useGeo'),
    tzSelect: document.getElementById('tzSelect'),
    lat: document.getElementById('lat'),
    lon: document.getElementById('lon'),
    setLatLon: document.getElementById('setLatLon'),
    locationSearch: document.getElementById('locationSearch'),
    locationOptions: document.getElementById('locationOptions'),
    applyLocation: document.getElementById('applyLocation'),
    locationNote: document.getElementById('locationNote'),
    settingsSummary: document.getElementById('settingsSummary'),
    echo: document.getElementById('echo'),
    useSystem: document.getElementById('useSystem'),
    manualTime: document.getElementById('manualTime'),
    datePick: document.getElementById('datePick'),
    timePick: document.getElementById('timePick'),
    applyDT: document.getElementById('applyDT'),
    dayRuler: document.getElementById('dayRuler'),
    dayRulerMeta: document.getElementById('dayRulerMeta'),
    dayCalendarDate: document.getElementById('dayCalendarDate'),
    sunTimes: document.getElementById('sunTimes'),
    bridgeInfo: document.getElementById('bridgeInfo'),
    topHourRuler: document.getElementById('topHourRuler'),
    topHourTime: document.getElementById('topHourTime'),
    topHourFocus: document.getElementById('topHourFocus'),
    topHourJump: document.getElementById('topHourJump'),
    moonDisc: document.getElementById('moonDisc'),
    moonPhase: document.getElementById('moonPhase'),
    moonTimes: document.getElementById('moonTimes'),
    moonVisibility: document.getElementById('moonVisibility'),
    dateFieldLink: document.getElementById('dateFieldLink'),
    ticker: document.getElementById('ticker'),
    tickerFill: document.getElementById('tickerFill'),
    hourMarks: document.getElementById('hourMarks'),
    progress: document.getElementById('progress'),
    currentGlyph: document.getElementById('currentGlyph'),
    dayStart: document.getElementById('dayStart'),
    dayEnd: document.getElementById('dayEnd'),
    sunsetBar: document.getElementById('sunsetBar'),
    lblStart: document.getElementById('lblStart'),
    lblSunset: document.getElementById('lblSunset'),
    lblEnd: document.getElementById('lblEnd'),
    prevHourCard: document.getElementById('prevHourCard'),
    currentHourCard: document.getElementById('currentHourCard'),
    nextHourCard: document.getElementById('nextHourCard'),
    prevDayCue: document.getElementById('prevDayCue'),
    nextDayCue: document.getElementById('nextDayCue'),
    minuteCountdown: document.getElementById('minuteCountdown'),
    hourMeta: document.getElementById('hourMeta'),
    currentInterpretation: document.getElementById('currentInterpretation'),
    dayCountdown: document.getElementById('dayCountdown'),
    legendChips: document.getElementById('legendChips'),
    hoursTable: document.querySelector('#hoursTable tbody'),
    skyQuery: document.getElementById('skyQuery'),
    runSkyQuery: document.getElementById('runSkyQuery'),
    skyObserveTitle: document.getElementById('skyObserveTitle'),
    skyCurrentBodyChip: document.getElementById('skyCurrentBodyChip'),
    skyInstruction: document.getElementById('skyInstruction'),
    skyAltitude: document.getElementById('skyAltitude'),
    skyAzimuth: document.getElementById('skyAzimuth'),
    skyCompass: document.getElementById('skyCompass'),
    skyVisibility: document.getElementById('skyVisibility'),
    skyRay: document.getElementById('skyRay'),
    skyRayText: document.getElementById('skyRayText'),
    skyAltitudePlot: document.getElementById('skyAltitudePlot'),
    skyAltitudeNote: document.getElementById('skyAltitudeNote'),
    skyClues: document.getElementById('skyClues'),
    skySourceText: document.getElementById('skySourceText'),
    wandererGrid: document.getElementById('wandererGrid'),
    heptagramSvg: document.getElementById('heptagramSvg'),
    heptagramHour: document.getElementById('heptagramHour'),
    heptagramPrev: document.getElementById('heptagramPrev'),
    heptagramNext: document.getElementById('heptagramNext'),
    prevDayCue: document.getElementById('prevDayCue'),
    nextDayCue: document.getElementById('nextDayCue'),
    heptagramNow: document.getElementById('heptagramNow'),
    heptagramHourLabel: document.getElementById('heptagramHourLabel'),
    heptagramHourBeads: document.getElementById('heptagramHourBeads'),
    heptagramSummary: document.getElementById('heptagramSummary'),
    heptagramOrderText: document.getElementById('heptagramOrderText'),
    heptagramTimeText: document.getElementById('heptagramTimeText'),
    heptagramGeometryText: document.getElementById('heptagramGeometryText'),
    dayRulerPortrait: document.getElementById('dayRulerPortrait'),
    dayRulerProfileName: document.getElementById('dayRulerProfileName'),
    hourRulerProfileName: document.getElementById('hourRulerProfileName'),
    dayRulerFocus: document.getElementById('dayRulerFocus'),
    hourRulerFocus: document.getElementById('hourRulerFocus')
  };

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtHM(d) { return new Date(d).toLocaleTimeString('en-US', {timeZone: state.tz, hour: state.timeFormat === '24h' ? '2-digit' : 'numeric', minute: '2-digit', hour12: state.timeFormat !== '24h'}); }
  function fmtHMText(d) { return fmtHM(d).replace('AM', 'a.m.').replace('PM', 'p.m.'); }
  function syncTimeFormatToggle() { if (!el.timeFormatToggle) return; el.timeFormatToggle.textContent = state.timeFormat === '24h' ? '24h' : '12h'; el.timeFormatToggle.setAttribute('aria-pressed', state.timeFormat === '24h' ? 'true' : 'false'); }
  function lowerFirst(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : ''; }
  function phaseTail(phase) {
    if (!phase) return '';
    const colon = phase.indexOf(':');
    return colon >= 0 ? phase.slice(colon + 1).trim() : phase.trim();
  }
  function compactHourInterpretation(day, row, rows) {
    const info = occurrenceInfo(rows, row);
    const pair = pairStatements[day.key] && pairStatements[day.key][row.ruler.key];
    const pk = phaseKey(row, info.occurrence);
    const planetPhases = phaseStatements[row.ruler.key] || {};
    const phase = phaseTail(planetPhases[pk] || '');
    const head = row.ruler.name + ' hour on ' + day.name + ' day';
    let body = pair && pair.body ? pair.body.trim() : (contextFocus(day, row.ruler) + '.');
    if (body.toLowerCase().startsWith(head.toLowerCase())) body = body.slice(head.length).trim();
    if (body.startsWith(':')) body = body.slice(1).trim();
    const bridge = phase ? (' As the ' + ordinalName(info.occurrence).label + ' ' + row.ruler.name + ' hour in the ' + (row.isBright ? 'bright' : 'dark') + ' half, ' + lowerFirst(phase)) : '';
    return '<b>' + head + ':</b> ' + body + bridge;
  }
  function hourMetaLine(row, rows) {
    const info = occurrenceInfo(rows, row);
    return row.ruler.name + ' hour · ' + fmtHM(row.start) + '–' + fmtHM(row.end) + ' · ' + (row.isBright ? 'Bright' : 'Dark') + ' hour ' + row.ordinal + ' of 24 · ' + ordinalName(info.occurrence).label + ' ' + row.ruler.name + ' hour of ' + info.total;
  }
  function fmtDate(d) { return new Date(d).toLocaleDateString(undefined, {timeZone: state.tz, weekday:'short', month:'short', day:'numeric'}); }
  function safeNumber(value, fallback) { const n = parseFloat(value); return Number.isFinite(n) ? n : fallback; }
  function rotateTo(dayKey) { const idx = chaldean.indexOf(dayKey); return Array.from({length:24}, function (_, i) { return chaldean[(idx + i) % 7]; }); }
  function ordinalName(n) { const suffix = (n % 10 === 1 && n % 100 !== 11) ? 'st' : (n % 10 === 2 && n % 100 !== 12) ? 'nd' : (n % 10 === 3 && n % 100 !== 13) ? 'rd' : 'th'; const harmonic = ['','Fundamental','Octave','Fifth','Double Octave'][n] || n + suffix; return {label:n + suffix, harmonic:harmonic}; }
  function localNow() { return state.useSystem ? new Date() : new Date(state.now); }
  function toLocalWallDate(date, tz) { return new Date(new Date(date).toLocaleString('en-US', {timeZone: tz})); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function setTime(d, h, m, s) { const x = new Date(d); x.setHours(h, m, s || 0, 0); return x; }
  function localNoonFor(date, tz, offsetDays) {
    if (window.luxon && window.luxon.DateTime) {
      return window.luxon.DateTime.fromJSDate(new Date(date)).setZone(tz).startOf('day').plus({days: offsetDays || 0, hours: 12}).toJSDate();
    }
    return setTime(addDays(toLocalWallDate(date, tz), offsetDays || 0), 12, 0);
  }

  function readHash() {
    try {
      const h = new URLSearchParams(location.hash.slice(1));
      if (h.get('lat')) state.lat = safeNumber(h.get('lat'), state.lat);
      if (h.get('lon')) state.lon = safeNumber(h.get('lon'), state.lon);
      if (h.get('tz')) state.tz = h.get('tz');
      if (h.get('loc')) state.locationName = h.get('loc');
      if (h.get('dt')) { state.useSystem = false; state.now = new Date(h.get('dt')); }
    } catch (error) {}
  }

  function populateTimezones() {
    const zones = (Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['UTC']).slice();
    if (!zones.includes('UTC')) zones.unshift('UTC');
    el.tzSelect.innerHTML = '';
    zones.sort().forEach(function (z) { const opt = document.createElement('option'); opt.value = z; opt.textContent = z; el.tzSelect.appendChild(opt); });
    if (!zones.includes(state.tz)) state.tz = 'UTC';
    el.tzSelect.value = state.tz;
  }



  function populateLocations() {
    el.locationOptions.innerHTML = locationPresets.map(function (loc) {
      return '<option value="' + loc.name.replace(/"/g, '&quot;') + '"></option>';
    }).join('');
  }

  function matchLocation(value) {
    const q = String(value || '').trim().toLowerCase();
    if (!q) return null;
    return locationPresets.find(function (loc) { return loc.name.toLowerCase() === q; }) ||
      locationPresets.find(function (loc) { return loc.name.toLowerCase().includes(q); }) || null;
  }

  function applyLocationPreset(loc) {
    if (!loc) {
      el.locationNote.innerHTML = '<span class="ph-warning">No matching preloaded location found.</span>';
      return;
    }
    state.locationName = loc.name;
    state.lat = loc.lat;
    state.lon = loc.lon;
    state.tz = loc.tz;
    el.lat.value = state.lat.toFixed(4);
    el.lon.value = state.lon.toFixed(4);
    el.tzSelect.value = state.tz;
    el.locationSearch.value = loc.name;
    el.locationNote.textContent = 'Location packet selected: ' + loc.name + ' — ' + loc.tz + '.';
    rebuild();
  }

  function setManualDateFromInputs() {
    if (el.datePick.value && el.timePick.value) {
      if (window.luxon && window.luxon.DateTime) {
        const dt = window.luxon.DateTime.fromISO(el.datePick.value + 'T' + el.timePick.value, {zone: state.tz});
        if (dt.isValid) { state.now = dt.toJSDate(); return; }
      }
      state.now = new Date(el.datePick.value + 'T' + el.timePick.value + ':00');
    }
  }

  function dateInputValueFor(date, tz) {
    if (window.luxon && window.luxon.DateTime) return window.luxon.DateTime.fromJSDate(date).setZone(tz).toFormat('yyyy-MM-dd');
    return toLocalWallDate(date, tz).toISOString().slice(0, 10);
  }

  function timeInputValueFor(date, tz) {
    if (window.luxon && window.luxon.DateTime) return window.luxon.DateTime.fromJSDate(date).setZone(tz).toFormat('HH:mm');
    const d = toLocalWallDate(date, tz);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function savePlanetaryHoursWhereWhen() {
    try {
      const now = localNow();
      localStorage.setItem('relphiPlanetaryHoursWhereWhen', JSON.stringify({
        datetime: dateInputValueFor(now, state.tz) + 'T' + timeInputValueFor(now, state.tz),
        lat: String(state.lat),
        lon: String(state.lon),
        tz: state.tz || '',
        loc: state.locationName || '',
        useSystem: !!state.useSystem,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {}
  }

  function moonPhaseName(phase) {
    if (phase < 0.03 || phase > 0.97) return 'New Moon';
    if (phase < 0.22) return 'Waning crescent';
    if (phase < 0.28) return 'First quarter';
    if (phase < 0.47) return 'Waxing gibbous';
    if (phase < 0.53) return 'Full Moon';
    if (phase < 0.72) return 'Waning gibbous';
    if (phase < 0.78) return 'Last quarter';
    return 'Waning crescent';
  }

  function moonSpecialName(phase, date) {
    const fullMoonNames = ['Wolf Moon','Snow Moon','Worm Moon','Pink Moon','Flower Moon','Strawberry Moon','Buck Moon','Sturgeon Moon','Corn Moon',"Hunter's Moon",'Beaver Moon','Cold Moon'];
    if (!(phase >= 0.47 && phase < 0.53)) return '';
    return fullMoonNames[new Date(date).getMonth()] || '';
  }

  function moonSvgMarkup(phase, orientation) {
    const p = ((phase % 1) + 1) % 1;
    const glow = '<defs><radialGradient id="phMoonGlow" cx="35%" cy="35%" r="80%"><stop offset="0%" stop-color="#fff"/><stop offset="52%" stop-color="#ececec"/><stop offset="100%" stop-color="#9fa6b3"/></radialGradient><clipPath id="phMoonClipRight"><rect x="50" y="0" width="50" height="100"></rect></clipPath><clipPath id="phMoonClipLeft"><rect x="0" y="0" width="50" height="100"></rect></clipPath></defs>';
    const span = (value) => Math.max(0, Math.min(48, 48 * value));
    const rightWhite = '<circle class="ph-moon-litshape" cx="50" cy="50" r="48" clip-path="url(#phMoonClipRight)"></circle>';
    const leftWhite = '<circle class="ph-moon-litshape" cx="50" cy="50" r="48" clip-path="url(#phMoonClipLeft)"></circle>';
    const rightBlack = '<circle class="ph-moon-sphere" cx="50" cy="50" r="48" clip-path="url(#phMoonClipRight)"></circle>';
    const leftBlack = '<circle class="ph-moon-sphere" cx="50" cy="50" r="48" clip-path="url(#phMoonClipLeft)"></circle>';
    const overlay = (side, tone, rx) => `<ellipse class="${tone==='white'?'ph-moon-litshape':'ph-moon-shadowshape'}" cx="50" cy="50" rx="${rx.toFixed(2)}" ry="48" clip-path="url(#${side==='right'?'phMoonClipRight':'phMoonClipLeft'})"></ellipse>`;
    let body = '';
    if (p < 0.25) {
      const rx = span(1 - p / 0.25);
      body = `${leftBlack}${rightWhite}${rx > 0.02 ? overlay('right','black',rx) : ''}`;
    } else if (p < 0.5) {
      const rx = span((p - 0.25) / 0.25);
      body = `${leftBlack}${rightWhite}${rx > 0.02 ? overlay('left','white',rx) : ''}`;
    } else if (p < 0.75) {
      const rx = span(1 - (p - 0.5) / 0.25);
      body = `${leftWhite}${rightBlack}${rx > 0.02 ? overlay('right','white',rx) : ''}`;
    } else {
      const rx = span((p - 0.75) / 0.25);
      body = `${leftWhite}${rightBlack}${rx > 0.02 ? overlay('left','black',rx) : ''}`;
    }
    const transform = orientation === 'south' ? ' transform="rotate(180 50 50)"' : '';
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><g${transform}>${glow}${body}<circle class="ph-moon-stroke" cx="50" cy="50" r="48"></circle></g></svg>`;
  }

  function renderMoonFrame(base, lat, lon) {
    if (!window.SunCalc) {
      el.moonPhase.textContent = 'Moon data unavailable.';
      el.moonTimes.textContent = 'SunCalc did not load.';
      el.moonVisibility.textContent = '—';
      return;
    }
    const illum = SunCalc.getMoonIllumination(base);
    const phase = illum.phase;
    const percent = Math.round((illum.fraction || 0) * 100);
    const name = moonPhaseName(phase);
    const orientation = state.moonOrientation === 'auto' ? (Number(lat) < 0 ? 'south' : 'north') : state.moonOrientation;
    el.moonDisc.innerHTML = moonSvgMarkup(phase, orientation);
    el.moonDisc.dataset.orientation = orientation;
    el.moonDisc.classList.toggle('southern-view', orientation === 'south');
    el.moonDisc.setAttribute('aria-label', name + ', ' + percent + '% illuminated, ' + orientation + 'ern orientation');
    const special = moonSpecialName(phase, base);
    el.moonPhase.textContent = name + ' • ' + percent + '% illuminated' + (special ? ' • ' + special : '');
    try {
      const mt = SunCalc.getMoonTimes(base, lat, lon);
      const rise = mt.rise ? fmtHM(mt.rise) : (mt.alwaysUp ? 'always up' : 'not today');
      const set = mt.set ? fmtHM(mt.set) : (mt.alwaysDown ? 'always down' : 'not today');
      el.moonTimes.textContent = 'Moonrise ' + rise + ' • Moonset ' + set;
    } catch (error) {
      el.moonTimes.textContent = 'Moonrise/moonset unavailable for this date.';
    }
    try {
      const mp = SunCalc.getMoonPosition(base, lat, lon);
      const above = mp.altitude > 0;
      const altitude = Math.round((mp.altitude * 180 / Math.PI) * 10) / 10;
      el.moonVisibility.textContent = above ? 'Moon is above the horizon now. Altitude about ' + altitude + '°.' : 'Moon is below the horizon now. Altitude about ' + altitude + '°.';
    } catch (error) {
      el.moonVisibility.textContent = 'Moon visibility unavailable.';
    }
  }

  const skyBodies = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const skyGlyphs = {Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂', Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'♇'};
  function skyRound(value, places) { return Number.isFinite(Number(value)) ? Number(value).toFixed(places || 1) : '—'; }
  function skyBodyFromQuery(value) {
    const lower = String(value || '').toLowerCase();
    return skyBodies.find(function (body) { return lower.includes(body.toLowerCase()); }) || state.skyBody || 'Saturn';
  }
  function skyCompassDirection(azimuth) {
    const dirs = ['north','north-northeast','northeast','east-northeast','east','east-southeast','southeast','south-southeast','south','south-southwest','southwest','west-southwest','west','west-northwest','northwest','north-northwest'];
    const index = Math.round((((Number(azimuth) % 360) + 360) % 360) / 22.5) % 16;
    return dirs[index];
  }
  function skySymbolic(body) {
    return ({
      Sun:'The Sun teaches visible center, daily path, vitality, and orientation by light.',
      Moon:'The Moon teaches phase, return, rhythm, body timing, and reflected light.',
      Mercury:'Mercury teaches signal, naming, direction, and the handoff between sight and language.',
      Venus:'Venus teaches brightness, attraction, relation, and the visible pull of beauty.',
      Mars:'Mars teaches motion, heat, pursuit, courage, and the red point of directed force.',
      Jupiter:'Jupiter teaches confidence, scale, witness, and bright steady enlargement of the field.',
      Saturn:'Saturn teaches boundary, patience, repetition, and coherence through a distant steady point.'
    })[body] || 'Observation becomes symbolic when it teaches a pattern you can use again without the app.';
  }
  function skyVisibility(body, altitude, sunAltitude) {
    if (altitude <= 0) return {label:'Below horizon', reason: body + ' is below the local mathematical horizon.', viewing:'Not practical', skyState:'Below horizon', practical:false};
    if (body === 'Sun') return {label:'Above horizon', reason:'The Sun is above the horizon. Do not look directly at it.', viewing:'Naked eye', skyState:'Above horizon', practical:true};
    const darkEnough = sunAltitude === null || sunAltitude <= -6;
    const twilight = sunAltitude !== null && sunAltitude > -6 && sunAltitude <= 0;
    let viewing = 'Not practical';
    let reason = body + ' is above the horizon.';
    if (body === 'Moon') {
      viewing = 'Naked eye';
      reason = 'The Moon is above the horizon and is ordinarily a naked-eye target.';
    } else if (body === 'Mercury') {
      if (darkEnough && altitude >= 5) { viewing = 'Naked eye'; reason = 'Mercury is above the horizon with enough darkness and enough height for a real naked-eye chance.'; }
      else if ((darkEnough || twilight) && altitude >= 3) { viewing = 'Binoculars'; reason = 'Mercury is above the horizon, but its low height or the brighter sky makes binoculars the safer expectation.'; }
      else { reason = 'Mercury is above the horizon, but the geometry is not friendly enough for a practical viewing attempt right now.'; }
    } else if (body === 'Venus' || body === 'Mars' || body === 'Jupiter' || body === 'Saturn') {
      if (darkEnough && altitude >= 3) { viewing = 'Naked eye'; reason = body + ' is above the horizon and the sky is dark enough for an ordinary naked-eye attempt.'; }
      else if ((darkEnough || twilight) && altitude >= 2) { viewing = 'Binoculars'; reason = body + ' is above the horizon, but brighter sky or low altitude makes binoculars the better expectation.'; }
      else { reason = body + ' is above the horizon, but the sky is too bright or the body is too low for a practical attempt.'; }
    } else if (body === 'Uranus') {
      if (darkEnough && altitude >= 5) { viewing = 'Binoculars'; reason = 'Uranus is above the horizon and dark enough for a binocular target.'; }
      else { reason = 'Uranus is above the horizon, but it is not a practical casual target right now.'; }
    } else if (body === 'Neptune' || body === 'Pluto') {
      if (darkEnough && altitude >= 5) { viewing = 'Telescope'; reason = body + ' is above the horizon and dark enough, but it is a telescope target.'; }
      else { reason = body + ' is above the horizon, but the sky is not favorable enough for a practical telescope attempt right now.'; }
    }
    if (!darkEnough && body !== 'Moon' && body !== 'Sun' && viewing === 'Naked eye') viewing = 'Binoculars';
    const practical = viewing !== 'Not practical';
    return {label: practical ? 'Possible to see' : 'Above horizon', reason: reason, viewing:viewing, skyState:'Above horizon', practical:practical};
  }
  function skyObstructionCue(altitude, body) {
    const alt = Number(altitude);
    if (!Number.isFinite(alt)) return 'Local obstruction cannot be estimated without a valid altitude.';
    if (alt < 0) return body + ' is below the horizon, so buildings, trees, and mountains are not the main problem; the Earth itself is blocking it.';
    if (alt < 5) return 'This is horizon-hugging. It is lower than most trees, houses, tall buildings, and mountain ridges unless your horizon is very open.';
    if (alt < 15) return 'This is very low sky. Trees, rooflines, buildings, and mountains may hide it; look from an open place with a clear horizon.';
    if (alt < 30) return 'This is low-to-middle sky. It may clear nearby trees and houses, but tall buildings, close hills, or mountain ridges can still block it.';
    if (alt < 45) return 'This is middle sky. It is usually above ordinary rooflines and many trees, though tall buildings or mountains can still intervene.';
    if (alt < 75) return 'This is high sky. It should be above most trees and buildings unless you are very close to an obstruction.';
    return 'This is near overhead. Step away from eaves, porches, and overhangs, then look almost straight up.';
  }
  function skyObstructionIcon(altitude) {
    const alt = Number(altitude);
    if (!Number.isFinite(alt)) return '<span class="ph-obstruction-icon unknown" aria-label="Obstruction unknown">?</span>';
    if (alt < 0) return '<span class="ph-obstruction-icon below" aria-label="Below horizon">↓</span>';
    if (alt < 5) return '<span class="ph-obstruction-icon severe" aria-label="Horizon obstruction likely">!</span>';
    if (alt < 15) return '<span class="ph-obstruction-icon high" aria-label="Trees, buildings, or mountains may block it">△</span>';
    if (alt < 30) return '<span class="ph-obstruction-icon medium" aria-label="Some obstruction risk">◇</span>';
    return '<span class="ph-obstruction-icon clear" aria-label="Mostly open sky">○</span>';
  }
  function skyHorizontal(body, date, lat, lon) {
    if (!window.Astronomy) throw new Error('Astronomy Engine did not load.');
    const observer = new Astronomy.Observer(lat, lon, 0);
    const equ = Astronomy.Equator(body, date, observer, true, true);
    return Astronomy.Horizon(date, observer, equ.ra, equ.dec, 'normal');
  }
  function renderSkyRay(azimuth) {
    if (!el.skyRay) return;
    const az = ((((Number(azimuth) % 360) + 360) % 360) * Math.PI) / 180;
    const r = 88, cx = 120, cy = 120;
    el.skyRay.setAttribute('x2', String(cx + r * Math.sin(az)));
    el.skyRay.setAttribute('y2', String(cy - r * Math.cos(az)));
  }
  function renderSkyLadder(body, altitude) {
    if (!el.skyAltitudePlot) return;
    const svg = el.skyAltitudePlot;
    const rawAltitude = Number(altitude);
    const visibleAltitude = Math.max(0, Math.min(90, Number.isFinite(rawAltitude) ? rawAltitude : 0));
    const size = 320, originX = 42, originY = 276, radius = 214;
    function pointFor(degrees, r) {
      const angle = degrees * Math.PI / 180;
      return { x: originX + (r || radius) * Math.cos(angle), y: originY - (r || radius) * Math.sin(angle) };
    }
    const arcStart = pointFor(0), arcEnd = pointFor(90), target = pointFor(visibleAltitude);
    const markers = [0, 15, 45, 90].map(function (degrees) {
      const p = pointFor(degrees);
      const labelX = degrees === 90 ? p.x + 8 : degrees === 0 ? p.x - 8 : p.x + 8;
      const labelY = degrees === 90 ? p.y + 15 : degrees === 0 ? p.y - 10 : p.y - 8;
      const anchor = degrees === 0 ? 'end' : 'start';
      const text = degrees === 0 ? '0° horizon' : degrees === 90 ? '90° overhead' : degrees + '°';
      return '<circle class="ph-alt-tick" cx="' + p.x + '" cy="' + p.y + '" r="3"></circle>' +
        '<text class="ph-alt-label" x="' + labelX + '" y="' + labelY + '" text-anchor="' + anchor + '">' + text + '</text>';
    }).join('');
    const below = rawAltitude < 0;
    const label = body + ' ' + skyRound(rawAltitude, 1) + '°';
    svg.innerHTML =
      '<line class="ph-alt-axis" x1="' + originX + '" y1="' + originY + '" x2="' + (originX + radius + 18) + '" y2="' + originY + '"></line>' +
      '<line class="ph-alt-axis" x1="' + originX + '" y1="' + originY + '" x2="' + originX + '" y2="' + (originY - radius - 18) + '"></line>' +
      '<path class="ph-alt-arc" d="M ' + arcStart.x + ' ' + arcStart.y + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + arcEnd.x + ' ' + arcEnd.y + '"></path>' +
      markers +
      '<line class="ph-alt-ray ' + (below ? 'ph-alt-below' : '') + '" x1="' + originX + '" y1="' + originY + '" x2="' + target.x + '" y2="' + target.y + '"></line>' +
      '<circle class="ph-alt-dot" cx="' + target.x + '" cy="' + target.y + '" r="7"></circle>' +
      '<text class="ph-alt-body-label" x="' + (target.x + 10) + '" y="' + (target.y - 8) + '">' + label + '</text>';
    if (el.skyAltitudeNote) el.skyAltitudeNote.textContent = below ? body + ' is below the horizon; the dashed ray is pinned to the horizon arc.' : 'The ray leaves the right-angle observer point at ' + skyRound(rawAltitude, 1) + ' degrees above the horizon.';
  }
  function localStartOfDayFor(date, tz) {
    if (window.luxon && window.luxon.DateTime) {
      return window.luxon.DateTime.fromJSDate(new Date(date)).setZone(tz).startOf('day').toJSDate();
    }
    return setTime(toLocalWallDate(date, tz), 0, 0, 0);
  }
  function searchWandererRiseSet(body, observer, start, direction) {
    try {
      if (!window.Astronomy || typeof Astronomy.SearchRiseSet !== 'function') return null;
      const found = Astronomy.SearchRiseSet(body, observer, direction, start, 2);
      if (!found) return null;
      return found.date instanceof Date ? found.date : new Date(found);
    } catch (error) { return null; }
  }
  function percentageThroughDay(date, start) {
    return Math.max(0, Math.min(100, minutesBetween(start, date) / 1440 * 100));
  }
  function aboveSegmentsMarkup(rise, set, dayStart) {
    if (!rise || !set) return '';
    const risePct = percentageThroughDay(rise, dayStart);
    const setPct = percentageThroughDay(set, dayStart);
    if (risePct <= setPct) {
      return '<span class="ph-wanderer-above-seg" style="left:' + risePct + '%;width:' + Math.max(0, setPct - risePct) + '%"></span>';
    }
    return '<span class="ph-wanderer-above-seg" style="left:0%;width:' + setPct + '%"></span>' +
      '<span class="ph-wanderer-above-seg" style="left:' + risePct + '%;width:' + Math.max(0, 100 - risePct) + '%"></span>';
  }

  function wandererMiniCompassMarkup(item) {
    const azimuth = Number(item.azimuth);
    if (!Number.isFinite(azimuth)) return '';
    const angle = ((((azimuth % 360) + 360) % 360) * Math.PI) / 180;
    const cx = 34, cy = 34, r = 21;
    const x2 = cx + r * Math.sin(angle);
    const y2 = cy - r * Math.cos(angle);
    return '<svg class="ph-wanderer-mini-compass" viewBox="0 0 68 68" aria-label="Compass direction ' + item.direction + '">' +
      '<circle class="mini-ring" cx="34" cy="34" r="26"></circle>' +
      '<text x="34" y="11" text-anchor="middle">N</text>' +
      '<text x="34" y="62" text-anchor="middle">S</text>' +
      '<text x="8" y="38" text-anchor="middle">W</text>' +
      '<text x="60" y="38" text-anchor="middle">E</text>' +
      '<line class="mini-ray" x1="34" y1="34" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"></line>' +
      '<circle class="mini-dot" cx="34" cy="34" r="2.5"></circle>' +
      '</svg>';
  }

  function wandererMiniAltitudeMarkup(item) {
    const rawAltitude = Number(item.altitude);
    if (!Number.isFinite(rawAltitude)) return '';
    const visibleAltitude = Math.max(0, Math.min(90, rawAltitude));
    const cx = 10, cy = 58, radius = 45;
    const angle = visibleAltitude * Math.PI / 180;
    const x2 = cx + radius * Math.cos(angle);
    const y2 = cy - radius * Math.sin(angle);
    const below = rawAltitude < 0;
    return '<svg class="ph-wanderer-mini-altitude" viewBox="0 0 68 68" aria-label="Altitude ' + skyRound(rawAltitude, 0) + ' degrees">' +
      '<line class="mini-axis" x1="10" y1="58" x2="62" y2="58"></line>' +
      '<line class="mini-axis" x1="10" y1="58" x2="10" y2="6"></line>' +
      '<path class="mini-arc" d="M 55 58 A 45 45 0 0 0 10 13"></path>' +
      '<line class="mini-alt-ray ' + (below ? 'below' : '') + '" x1="10" y1="58" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"></line>' +
      '<circle class="mini-alt-dot" cx="' + x2.toFixed(1) + '" cy="' + y2.toFixed(1) + '" r="3.5"></circle>' +
      '</svg>';
  }

  function renderWandererGrid(frame) {
    if (!el.wandererGrid) return;
    if (!window.Astronomy) {
      el.wandererGrid.innerHTML = '<p class="ph-tiny">Astronomy Engine is unavailable, so planetary rise/set times cannot be calculated.</p>';
      return;
    }
    const now = frame ? frame.localNow : localNow();
    const start = localStartOfDayFor(now, state.tz);
    const observer = new Astronomy.Observer(state.lat, state.lon, 0);
    let sunAlt = null;
    try { sunAlt = Number(skyHorizontal('Sun', now, state.lat, state.lon).altitude); } catch (error) {}
    const bodies = skyBodies.slice();
    const nowPct = percentageThroughDay(now, start);
    const items = bodies.map(function (body) {
      let altitude = NaN, azimuth = NaN, direction = '—';
      try {
        const hor = skyHorizontal(body, now, state.lat, state.lon);
        altitude = Number(hor.altitude);
        azimuth = Number(hor.azimuth);
        direction = skyCompassDirection(azimuth);
      } catch (error) {}
      const rise = searchWandererRiseSet(body, observer, start, +1);
      const set = searchWandererRiseSet(body, observer, start, -1);
      const above = Number.isFinite(altitude) && altitude > 0;
      const risePct = rise ? percentageThroughDay(rise, start) : null;
      const setPct = set ? percentageThroughDay(set, start) : null;
      const visibility = skyVisibility(body, altitude, sunAlt);
      const obstructionCue = skyObstructionCue(altitude, body);
      const obstructionIcon = skyObstructionIcon(altitude);
      return { body: body, altitude: altitude, azimuth: azimuth, direction: direction, above: above, rise: rise, set: set, risePct: risePct, setPct: setPct, visibility: visibility, obstructionCue: obstructionCue, obstructionIcon: obstructionIcon };
    }).sort(function (a, b) {
      function viewingRank(item) {
        if (!item.above) return 5;
        if (item.visibility.viewing === 'Naked eye') return 1;
        if (item.visibility.viewing === 'Binoculars') return 2;
        if (item.visibility.viewing === 'Telescope') return 3;
        return 4;
      }
      const rankA = viewingRank(a);
      const rankB = viewingRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (b.altitude || -999) - (a.altitude || -999);
    });
    el.wandererGrid.innerHTML = items.map(function (item) {
      const body = item.body;
      return '<button class="ph-wanderer-card ' + (item.above ? 'is-above ' : '') + (item.visibility.practical ? 'is-viewable ' : '') + (state.skyBody === body ? 'is-selected' : '') + '" type="button" data-sky-body="' + body + '" aria-pressed="' + (state.skyBody === body ? 'true' : 'false') + '" aria-label="Orient to ' + body + '">' +
        (item.visibility.practical ? '<span class="ph-wanderer-visibility-dot" aria-hidden="true"></span>' : '') +
        '<div class="ph-wanderer-title"><span class="ph-wanderer-title-main"><span class="glyph">' + (skyGlyphs[body] || '') + '</span><span>' + body + '</span></span><span class="ph-wanderer-status-stack"><span class="ph-wanderer-status sky-state">' + (item.above ? 'above' : 'below') + '</span><span class="ph-wanderer-status viewing">' + item.visibility.viewing + '</span></span></div>' +
        '<div class="ph-wanderer-rail" aria-label="Rise/set visualization for ' + body + '">' +
          aboveSegmentsMarkup(item.rise, item.set, start) +
          (item.risePct === null ? '' : '<span class="ph-wanderer-crossing rise" title="Rise ' + fmtHM(item.rise) + '" style="left:' + item.risePct + '%"></span>') +
          (item.setPct === null ? '' : '<span class="ph-wanderer-crossing set" title="Set ' + fmtHM(item.set) + '" style="left:' + item.setPct + '%"></span>') +
          '<span class="ph-wanderer-now" title="Current time" style="left:' + nowPct + '%"></span>' +
        '</div>' +
        '<div class="ph-wanderer-caption"><span>Rise ' + (item.rise ? fmtHM(item.rise) : '—') + '</span><span>Set ' + (item.set ? fmtHM(item.set) : '—') + '</span></div>' +
        '<dl class="ph-wanderer-facts">' +
          '<div><dt>Alt</dt><dd>' + (Number.isFinite(item.altitude) ? skyRound(item.altitude, 0) + '° ' + item.direction + ' ' + item.obstructionIcon : '— ' + item.obstructionIcon) + '</dd></div>' +
          '<div><dt>Az</dt><dd>' + (Number.isFinite(item.azimuth) ? skyRound(item.azimuth, 0) + '°' : '—') + '</dd></div>' +
          '<div><dt>Guide</dt><dd>' + item.visibility.viewing + '</dd></div>' +
        '</dl>' +
        (state.skyBody === body ? '<div class="ph-wanderer-selected-guide"><strong>Orientation guide</strong><p>' + (item.above ? 'Face ' + item.direction + '. Lift your eyes about ' + skyRound(item.altitude, 0) + ' degrees above the horizon.' : body + ' is below the horizon now.') + '</p><p>' + item.obstructionCue + '</p><p>' + item.visibility.reason + '</p></div>' : '') +
        '<div class="ph-wanderer-mini-meters" aria-hidden="true">' + wandererMiniCompassMarkup(item) + wandererMiniAltitudeMarkup(item) + '</div>' +
      '</button>';
    }).join('');
  }


  function renderSkyOrientation(force) {
    if (!el.skyQuery || (!state.skyHasRun && !force)) return;
    state.skyHasRun = true;
    const body = skyBodyFromQuery(el.skyQuery.value);
    state.skyBody = body;
    try {
      const now = localNow();
      const hor = skyHorizontal(body, now, state.lat, state.lon);
      const altitude = Number(hor.altitude);
      const azimuth = (((Number(hor.azimuth) % 360) + 360) % 360);
      let sunAlt = null;
      try { sunAlt = Number(skyHorizontal('Sun', now, state.lat, state.lon).altitude); } catch (error) {}
      const compass = skyCompassDirection(azimuth);
      const visibility = skyVisibility(body, altitude, sunAlt);
      const obstructionCue = skyObstructionCue(altitude, body);
      const direction = altitude > 0 ? 'Face ' + compass + '. Look about ' + skyRound(altitude, 0) + ' degrees above the horizon. ' + obstructionCue : body + ' is below the horizon now. ' + obstructionCue;
      el.skyObserveTitle.textContent = (skyGlyphs[body] || '') + ' ' + body;
      if (el.skyCurrentBodyChip) el.skyCurrentBodyChip.innerHTML = '<span class="glyph">' + (skyGlyphs[body] || '') + '</span><span>' + body + ' selected</span>';
      el.skyInstruction.textContent = direction;
      el.skyAltitude.textContent = skyRound(altitude, 1) + '°';
      el.skyAzimuth.textContent = skyRound(azimuth, 1) + '°';
      el.skyCompass.textContent = compass;
      el.skyVisibility.textContent = visibility.viewing + ' • ' + visibility.skyState;
      el.skyRayText.textContent = 'The ray points ' + compass + ' from ' + (state.locationName || 'the selected place') + '.';
      renderSkyRay(azimuth);
      renderSkyLadder(body, altitude);
      el.skyClues.innerHTML = [
        body + ' bearing: ' + skyRound(azimuth, 1) + ' degrees, or ' + compass + '.',
        altitude > 0 ? 'Use the horizon first, then lift your eyes to about ' + skyRound(altitude, 0) + ' degrees.' : 'Use the rise/set table or return when the body is above the horizon.',
        'A clenched fist at arm’s length is roughly ten degrees of sky height.',
        obstructionCue,
        'Viewing class: ' + visibility.viewing + '.',
        visibility.reason,
        'Calculated sky position is fact; local buildings, mountains, trees, haze, and clouds must be observed in place.'
      ].map(function (item) { return '<li>' + item + '</li>'; }).join('');
      el.skySourceText.textContent = 'Calculated by Astronomy Engine for ' + (state.locationName || 'selected coordinates') + ' at ' + fmtHM(now) + '. Symbolic note: ' + skySymbolic(body);
    } catch (error) {
      el.skyInstruction.textContent = 'Sky orientation could not be calculated. Astronomy Engine may not have loaded.';
      el.skyClues.innerHTML = '<li>Check the network connection for the open-source Astronomy Engine browser library.</li><li>Planetary Hours itself still works through SunCalc and the local time frame.</li>';
      el.skySourceText.textContent = String(error.message || error);
    }
  }

  function tickLocalClock() {
    const nowText = new Date().toLocaleTimeString('en-US', {timeZone: state.tz, hour: state.timeFormat === '24h' ? '2-digit' : 'numeric', minute: '2-digit', hour12: state.timeFormat !== '24h'});
    el.clock.textContent = nowText;
    if (el.panelCurrentTime && state.heptagramHourOverride == null && state.useSystem) el.panelCurrentTime.textContent = nowText;
    syncTimeFormatToggle();
  }

  function smallEcho(extra) {
    const label = state.locationName ? state.locationName + ' — ' : '';
    el.echo.textContent = label + state.lat.toFixed(4) + ', ' + state.lon.toFixed(4) + ' (' + state.tz + ')' + (extra ? ' — ' + extra : '');
  }

  function solarTimes(base, lat, lon) {
    if (window.SunCalc && typeof window.SunCalc.getTimes === 'function') {
      return window.SunCalc.getTimes(base, lat, lon);
    }
    return { sunrise: setTime(base, 6, 0), sunset: setTime(base, 18, 0) };
  }

  function computeDayFrame(now, lat, lon, tz) {
    const instant = new Date(now);
    const base = localNoonFor(instant, tz, 0);
    const today = solarTimes(base, lat, lon);
    if (instant >= today.sunrise) {
      const next = solarTimes(localNoonFor(instant, tz, 1), lat, lon);
      return {start: today.sunrise, sunrise: today.sunrise, sunset: today.sunset, end: next.sunrise, localNow: instant};
    }
    const prev = solarTimes(localNoonFor(instant, tz, -1), lat, lon);
    return {start: prev.sunrise, sunrise: prev.sunrise, sunset: prev.sunset, end: today.sunrise, localNow: instant};
  }

  function dayRulerKeyForWeekday(localStart) { return weekdayToRuler[localStart.getDay()]; }

  function buildHours(frame, dayKey) {
    const seq = rotateTo(dayKey);
    const daylight = frame.sunset.getTime() - frame.sunrise.getTime();
    const night = frame.end.getTime() - frame.sunset.getTime();
    const brightLen = daylight / 12;
    const darkLen = night / 12;
    const rows = [];
    let t = frame.start.getTime();
    for (let i = 0; i < 24; i++) {
      const isBright = i < 12;
      const len = isBright ? brightLen : darkLen;
      const start = new Date(t);
      const end = new Date(t + len);
      const ruler = byKey[seq[i]];
      rows.push({index: i + 1, start: start, end: end, ruler: ruler, isBright: isBright, ordinal: i + 1});
      t += len;
    }
    return rows;
  }

  function hoursHeldToday(rows, key) {
    return rows.reduce(function (acc, r) { if (r.ruler.key === key) { if (r.isBright) acc.b++; else acc.d++; acc.t++; } return acc; }, {b:0, d:0, t:0});
  }


  function minutesBetween(a, b) { return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000)); }
  function hoursLeftInDay(frame, now) { return Math.max(0, Math.ceil((frame.end.getTime() - now.getTime()) / 3600000)); }

  function miniCard(label, row, role) {
    return '<span class="ph-mini-label">' + label + '</span>' +
      '<span class="ph-mini-ruler p-' + row.ruler.key + '">' + row.ruler.sym + ' ' + row.ruler.name + '</span>' +
      '<span class="ph-mini-time">' + fmtHM(row.start) + '–' + fmtHM(row.end) + '</span>' +
      '<span class="ph-mini-time">' + (row.isBright ? 'Bright' : 'Dark') + ' hour ' + row.index + '</span>';
  }

  function currentIndex(rows, local) {
    const t = local.getTime();
    for (let i = 0; i < rows.length; i++) {
      if (t >= rows[i].start.getTime() && t < rows[i].end.getTime()) return i;
    }
    return t < rows[0].start.getTime() ? 0 : rows.length - 1;
  }

  const pairStatements = {
    saturn: {
      saturn: {short:'Concentrate structure.', body:'Saturn day and Saturn hour concentrate the field of structure: consolidate, prune, commit, and let only the durable form remain.'},
      jupiter: {short:'Expand the structure.', body:'Jupiter hour on Saturn day expands what already has bones: publish the plan, mentor through discipline, and grow only what can carry consequence.'},
      mars: {short:'Act on the boundary.', body:'Mars hour on Saturn day turns structure into decisive action: cut, cauterize, enforce the limit, and protect the commitment from drift.'},
      sun: {short:'Clarify the structure.', body:'Sun hour on Saturn day makes structure visible: lead with the rule, name the center, and put the durable obligation under a clear light.'},
      venus: {short:'Refine the structure.', body:'Venus hour on Saturn day softens structure without dissolving it: relate through boundaries, refine the form, and make commitment livable.'},
      mercury: {short:'Articulate the structure.', body:'Mercury hour on Saturn day turns structure into language: write the rule, negotiate the terms, ship the document, and make the commitment legible.'},
      moon: {short:'Stabilize through care.', body:'Moon hour on Saturn day brings care into structure: adapt the boundary to living need, nourish what must endure, and reflect before tightening the form.'}
    },
    jupiter: {
      saturn: {short:'Make growth durable.', body:'Saturn hour on Jupiter day gives growth a limit it can survive: prune the expansion, choose the worthy commitment, and make blessing durable.'},
      jupiter: {short:'Concentrate growth.', body:'Jupiter day and Jupiter hour concentrate growth: expand, publish, mentor, and let generosity move through a larger field.'},
      mars: {short:'Give growth force.', body:'Mars hour on Jupiter day turns growth into bold action: act on the opportunity, defend the increase, and cut away what weakens the larger aim.'},
      sun: {short:'Make growth visible.', body:'Sun hour on Jupiter day spotlights growth: lead the expansion, clarify the teaching, and let blessing become visible direction.'},
      venus: {short:'Grow through attraction.', body:'Venus hour on Jupiter day lets growth move through relation: attract support, refine the offer, and let generosity become beautiful and shareable.'},
      mercury: {short:'Translate growth.', body:'Mercury hour on Jupiter day translates growth into message: write, teach, negotiate, ship, and make the larger vision intelligible.'},
      moon: {short:'Grow responsively.', body:'Moon hour on Jupiter day makes growth responsive: expand by nourishing what is alive, adapting to actual need, and letting reflection guide increase.'}
    },
    mars: {
      saturn: {short:'Discipline courage.', body:'Saturn hour on Mars day gives courage a boundary: consolidate the action, prune the fight, and commit only to force that can bear consequence.'},
      jupiter: {short:'Enlarge courage.', body:'Jupiter hour on Mars day expands courage into a larger field: act with confidence, mentor through action, and let force become principled growth.'},
      mars: {short:'Concentrate action.', body:'Mars day and Mars hour concentrate action: move, compete, cauterize, and bring heat directly to the obstacle.'},
      sun: {short:'Clarify the action.', body:'Sun hour on Mars day makes action visible: lead from courage, clarify the target, and put force under the light of purpose.'},
      venus: {short:'Temper action through relation.', body:'Venus hour on Mars day asks courage to relate: refine the force, attract rather than only strike, and let desire civilize heat.'},
      mercury: {short:'Make action tactical.', body:'Mercury hour on Mars day turns courage into tactics: name the move, negotiate the conflict, ship the message, and make the cut precise.'},
      moon: {short:'Adapt the action.', body:'Moon hour on Mars day makes courage responsive: act with awareness of need, adapt before striking again, and let reflection cool unnecessary heat.'}
    },
    sun: {
      saturn: {short:'Give vitality form.', body:'Saturn hour on Sun day gives vitality a structure: commit the will, prune distraction, and let radiance become responsibility.'},
      jupiter: {short:'Magnify vitality.', body:'Jupiter hour on Sun day expands vitality into confidence, teaching, and blessing: lead generously and let the center grow large enough to include others.'},
      mars: {short:'Activate vitality.', body:'Mars hour on Sun day turns vitality into action: lead by doing, clarify through force, and move the spotlight toward the decisive cut.'},
      sun: {short:'Concentrate vitality.', body:'Sun day and Sun hour concentrate vitality: lead, clarify, spotlight, and let the center announce itself plainly.'},
      venus: {short:'Beautify vitality.', body:'Venus hour on Sun day makes vitality relational: attract, refine, and let radiance become warmth, style, and generous presence.'},
      mercury: {short:'Speak vitality.', body:'Mercury hour on Sun day turns vitality into message: write the center, clarify the point, negotiate visibility, and ship the signal.'},
      moon: {short:'Make vitality receptive.', body:'Moon hour on Sun day makes vitality responsive: nourish the center, adapt the expression, and reflect before taking more light.'}
    },
    venus: {
      saturn: {short:'Commit the bond.', body:'Saturn hour on Venus day gives harmony a boundary: define the bond, prune false sweetness, and commit to what can be trusted.'},
      jupiter: {short:'Expand the bond.', body:'Jupiter hour on Venus day grows harmony through generosity: publish the invitation, mentor through kindness, and let beauty become abundant.'},
      mars: {short:'Act on desire.', body:'Mars hour on Venus day gives harmony force: act on desire, protect the bond, and cauterize what makes relation dishonest.'},
      sun: {short:'Illuminate the bond.', body:'Sun hour on Venus day makes relation visible: lead with warmth, clarify affection, and let beauty step into the light.'},
      venus: {short:'Concentrate harmony.', body:'Venus day and Venus hour concentrate harmony: relate, attract, refine, and let pleasure show what belongs together.'},
      mercury: {short:'Name the bond.', body:'Mercury hour on Venus day turns harmony into language: write the affection, negotiate the value, and make relation speak clearly.'},
      moon: {short:'Nourish the bond.', body:'Moon hour on Venus day makes harmony responsive: nourish the relation, adapt to feeling, and let reflection protect tenderness.'}
    },
    mercury: {
      saturn: {short:'Structure the message.', body:'Saturn hour on Mercury day gives trade and speech a durable form: consolidate the message, prune the noise, and commit the agreement.'},
      jupiter: {short:'Enlarge the message.', body:'Jupiter hour on Mercury day expands the signal: teach, publish, mentor, and let trade become a larger exchange of meaning.'},
      mars: {short:'Sharpen the message.', body:'Mars hour on Mercury day gives language a blade: act on the message, cut ambiguity, and make negotiation decisive.'},
      sun: {short:'Clarify the message.', body:'Sun hour on Mercury day spotlights the signal: lead with the point, clarify the argument, and make the message visible.'},
      venus: {short:'Sweeten the message.', body:'Venus hour on Mercury day makes trade relational: refine the language, attract agreement, and let negotiation become graceful.'},
      mercury: {short:'Concentrate the message.', body:'Mercury day and Mercury hour concentrate trade, speech, and interpretation: write, ship, negotiate, and let the signal move cleanly.'},
      moon: {short:'Make the message responsive.', body:'Moon hour on Mercury day makes language adaptive: listen before answering, nourish the exchange, and let reflection shape the signal.'}
    },
    moon: {
      saturn: {short:'Give care a boundary.', body:'Saturn hour on Moon day gives care a container: consolidate the need, prune emotional excess, and commit to what protects the living field.'},
      jupiter: {short:'Expand care.', body:'Jupiter hour on Moon day grows care through generosity: nourish more widely, teach from memory, and let belonging become blessing.'},
      mars: {short:'Defend care.', body:'Mars hour on Moon day gives care force: act to protect what is vulnerable, cut what harms the field, and let instinct become courage.'},
      sun: {short:'Make care visible.', body:'Sun hour on Moon day brings care into the light: clarify need, lead with warmth, and let feeling become visible guidance.'},
      venus: {short:'Refine care.', body:'Venus hour on Moon day makes care relational and beautiful: attract comfort, refine tenderness, and let nourishment become harmony.'},
      mercury: {short:'Name care.', body:'Mercury hour on Moon day gives care words: write the need, negotiate support, and let memory become a usable message.'},
      moon: {short:'Concentrate care.', body:'Moon day and Moon hour concentrate care: nourish, adapt, reflect, and let tides, memory, and need speak plainly.'}
    }
  };

  const phaseStatements = {
    saturn: {
      '1_bright': 'This is the first Saturn hour of the planetary day, occurring in the bright half: structure first appears as a visible boundary, rule, or commitment.',
      '2_bright': 'This is the second Saturn hour of the planetary day, occurring in the bright half: the boundary is tested in practice and the commitment becomes concrete.',
      '2_dark': 'This is the second Saturn hour of the planetary day, occurring in the dark half: the boundary turns inward, asking what must be privately accepted or refused.',
      '3_dark': 'This is the third Saturn hour of the planetary day, occurring in the dark half: structure becomes consequence, residue, and the weight of what has been chosen.',
      '4_dark': 'This is the fourth Saturn hour of the planetary day, occurring in the dark half: the day closes through Saturnian remainder, final pruning, and the form carried forward.'
    },
    jupiter: {
      '1_bright': 'This is the first Jupiter hour of the planetary day, occurring in the bright half: growth opens visibly as invitation, teaching, publication, or blessing.',
      '2_bright': 'This is the second Jupiter hour of the planetary day, occurring in the bright half: expansion leaves first promise and becomes practiced generosity, visible reach, and tested scale.',
      '2_dark': 'This is the second Jupiter hour of the planetary day, occurring in the dark half: growth turns inward, becoming faith, meaning, and the private measure of what can truly expand.',
      '3_dark': 'This is the third Jupiter hour of the planetary day, occurring in the dark half: increase becomes consequence, gratitude, and the lesson carried after visible expansion has passed.',
      '4_dark': 'This is the fourth Jupiter hour of the planetary day, occurring in the dark half: blessing becomes residue, excess is sorted from wisdom, and growth prepares to hand the day onward.'
    },
    mars: {
      '1_bright': 'This is the first Mars hour of the planetary day, occurring in the bright half: action first appears as heat, courage, defense, or the initiating cut.',
      '2_bright': 'This is the second Mars hour of the planetary day, occurring in the bright half: the first strike becomes directed effort, tactical pressure, and visible follow-through.',
      '2_dark': 'This is the second Mars hour of the planetary day, occurring in the dark half: force turns inward, asking what anger, urgency, or defense is still moving below the surface.',
      '3_dark': 'This is the third Mars hour of the planetary day, occurring in the dark half: action becomes aftermath, cauterization, and the consequence of what was cut or defended.',
      '4_dark': 'This is the fourth Mars hour of the planetary day, occurring in the dark half: remaining heat is discharged, contained, or carried as pressure into the next day.'
    },
    sun: {
      '1_bright': 'This is the first Sun hour of the planetary day, occurring in the bright half: vitality first becomes visible as center, clarity, leadership, or direction.',
      '2_bright': 'This is the second Sun hour of the planetary day, occurring in the bright half: the spotlight becomes sustained presence, public clarification, and practiced leadership.',
      '2_dark': 'This is the second Sun hour of the planetary day, occurring in the dark half: vitality turns inward, asking what center remains when visibility is reduced.',
      '3_dark': 'This is the third Sun hour of the planetary day, occurring in the dark half: the day’s light becomes memory, meaning, and the inward ember of identity.',
      '4_dark': 'This is the fourth Sun hour of the planetary day, occurring in the dark half: the last solar residue preserves the center while the visible day has already passed.'
    },
    venus: {
      '1_bright': 'This is the first Venus hour of the planetary day, occurring in the bright half: relation first appears as attraction, sweetness, value, or visible refinement.',
      '2_bright': 'This is the second Venus hour of the planetary day, occurring in the bright half: attraction becomes mutual adjustment, practiced grace, and the refinement of what can be shared.',
      '2_dark': 'This is the second Venus hour of the planetary day, occurring in the dark half: relation turns inward, asking what desire, value, or tenderness is privately shaping the field.',
      '3_dark': 'This is the third Venus hour of the planetary day, occurring in the dark half: harmony becomes aftertaste, attachment, and the quiet truth of what still attracts or repels.',
      '4_dark': 'This is the fourth Venus hour of the planetary day, occurring in the dark half: pleasure and relation become residue, memory, and the final sorting of what belongs.'
    },
    mercury: {
      '1_bright': 'This is the first Mercury hour of the planetary day, occurring in the bright half: the signal first becomes visible as message, trade, movement, or interpretation.',
      '2_bright': 'This is the second Mercury hour of the planetary day, occurring in the bright half: the message enters active exchange, revision, negotiation, and practical delivery.',
      '2_dark': 'This is the second Mercury hour of the planetary day, occurring in the dark half: the signal turns inward, becoming private thought, revision, listening, and unsent language.',
      '3_dark': 'This is the third Mercury hour of the planetary day, occurring in the dark half: interpretation becomes residue, pattern, and the hidden logic left by the day’s exchanges.',
      '4_dark': 'This is the fourth Mercury hour of the planetary day, occurring in the dark half: the final signal becomes archive, afterword, and message carried toward the next cycle.'
    },
    moon: {
      '1_bright': 'This is the first Moon hour of the planetary day, occurring in the bright half: need first becomes visible as care, memory, mood, or adaptation.',
      '2_bright': 'This is the second Moon hour of the planetary day, occurring in the bright half: care becomes responsive adjustment, visible tending, and adaptation to what the living field now shows.',
      '2_dark': 'This is the second Moon hour of the planetary day, occurring in the dark half: need turns inward, becoming memory, emotional calibration, and private adaptation.',
      '3_dark': 'This is the third Moon hour of the planetary day, occurring in the dark half: care becomes absorption, reflection, and the inward tide that gathers what the day has stirred.',
      '4_dark': 'This is the fourth Moon hour of the planetary day, occurring in the dark half: the final Moon hour becomes residue, dream, bodily memory, and the tide carried into the next day.'
    }
  };

  function occurrenceInfo(rows, row) {
    const same = rows.filter(function (r) { return r.ruler.key === row.ruler.key; });
    const prior = rows.slice(0, row.index).filter(function (r) { return r.ruler.key === row.ruler.key; });
    const occurrence = prior.length;
    return { occurrence: occurrence, total: same.length };
  }

  function phaseKey(row, occurrence) { return occurrence + '_' + (row.isBright ? 'bright' : 'dark'); }

  function contextFocus(day, hour) {
    const pair = pairStatements[day.key] && pairStatements[day.key][hour.key];
    return pair ? pair.short : (day.name + ' day / ' + hour.name + ' hour');
  }

  function fullContextStatement(day, row, rows) {
    const info = occurrenceInfo(rows, row);
    const pair = pairStatements[day.key] && pairStatements[day.key][row.ruler.key];
    const pk = phaseKey(row, info.occurrence);
    const planetPhases = phaseStatements[row.ruler.key] || {};
    const phase = planetPhases[pk] || ('This ' + row.ruler.name + ' hour occurs in the ' + (row.isBright ? 'bright' : 'dark') + ' half.');
    const head = row.ruler.name + ' hour on ' + day.name + ' day';
    const occurrenceLabel = ordinalName(info.occurrence).label + ' ' + row.ruler.name + ' hour of ' + info.total;
    let body = pair ? pair.body : contextFocus(day, row.ruler);
    if (pair && body.toLowerCase().startsWith(head.toLowerCase())) body = body.slice(head.length).trim();
    return '<b>' + head + ':</b> ' + body + ' <span class="ph-tiny">' + occurrenceLabel + '. ' + phase + '</span>';
  }

  function pillFor(p, label) {
    return '<span class="ph-pill p-' + p.key + '"><span class="ph-dot"></span>' + p.sym + ' ' + label + '</span>';
  }

  function attrText(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function scrollToHour(index) {
    const row = document.getElementById('ph-hour-row-' + index);
    if (!row) return;
    row.scrollIntoView({behavior: 'smooth', block: 'center'});
    row.classList.add('jump-target');
    window.setTimeout(function () { row.classList.remove('jump-target'); }, 1800);
  }

  function setHourJump(elm, row) {
    if (!elm || !row) return;
    elm.dataset.hourJump = String(row.index);
    elm.disabled = false;
    elm.setAttribute('aria-label', 'Show hour ' + row.index + ' in the 24-hour list');
  }



  function dayRulerSequenceFrom(dayKey) {
    const startWeekday = rulerToWeekday[dayKey];
    return Array.from({length: 8}, function (_, i) { return weekdayToRuler[(startWeekday + i) % 7]; });
  }

  function heptagramPointFor(key) {
    const idx = chaldean.indexOf(key);
    const angle = (-90 + idx * (360 / chaldean.length)) * Math.PI / 180;
    const cx = 180, cy = 180, r = 118;
    return {x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, angle: angle};
  }

  function heptagramLabelPointFor(key) {
    const idx = chaldean.indexOf(key);
    const angle = (-90 + idx * (360 / chaldean.length)) * Math.PI / 180;
    const cx = 180, cy = 180;
    const radiusByKey = {
      saturn: 144,
      jupiter: 158,
      mars: 160,
      sun: 154,
      venus: 154,
      mercury: 170,
      moon: 154
    };
    const r = radiusByKey[key] || 154;
    return {x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r};
  }


  function heptagramLine(aKey, bKey, className) {
    const a = heptagramPointFor(aKey);
    const b = heptagramPointFor(bKey);
    return '<line class="' + className + '" x1="' + a.x.toFixed(2) + '" y1="' + a.y.toFixed(2) + '" x2="' + b.x.toFixed(2) + '" y2="' + b.y.toFixed(2) + '"></line>';
  }

  function heptagramPartialLine(aKey, bKey, className, fraction) {
    const a = heptagramPointFor(aKey);
    const b = heptagramPointFor(bKey);
    const t = Math.max(0, Math.min(1, Number(fraction) || 0));
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    return '<line class="' + className + '" x1="' + a.x.toFixed(2) + '" y1="' + a.y.toFixed(2) + '" x2="' + x.toFixed(2) + '" y2="' + y.toFixed(2) + '"></line>';
  }

  function renderAnimatedHeptagram(frame, rows, dayKey, currentIdx) {
    if (!el.heptagramSvg) return;
    const liveHour = Math.max(1, Math.min(24, currentIdx + 1));
    const liveRow = rows[liveHour - 1] || rows[0];
    const liveNow = state.useSystem ? new Date() : frame.localNow;
    const liveSpan = liveRow ? Math.max(1, liveRow.end.getTime() - liveRow.start.getTime()) : 1;
    const liveFraction = liveRow ? Math.max(0, Math.min(0.999, (liveNow.getTime() - liveRow.start.getTime()) / liveSpan)) : 0;
    const selectedPosition = Math.max(1, Math.min(24, state.heptagramHourOverride != null ? Number(state.heptagramHourOverride) || 1 : liveHour + liveFraction));
    const selectedHour = Math.max(1, Math.min(24, Math.floor(selectedPosition)));
    const hourFraction = selectedPosition >= 24 ? 1 : Math.max(0, Math.min(0.999, selectedPosition - selectedHour));
    if (el.heptagramHour) el.heptagramHour.value = String(selectedPosition);
    const day = byKey[dayKey];
    const row = rows[selectedHour - 1] || rows[liveHour - 1];
    const selectedNow = row ? new Date(row.start.getTime() + Math.max(0, Math.min(1, hourFraction)) * Math.max(1, row.end.getTime() - row.start.getTime())) : liveNow;
    if (el.panelCurrentTime) el.panelCurrentTime.textContent = fmtHM(selectedNow);
    if (row && el.minuteCountdown) {
      const minutesLeft = Math.max(0, minutesBetween(selectedNow, row.end));
      const minutesTotal = Math.max(1, minutesBetween(row.start, row.end));
      el.minuteCountdown.innerHTML = '<span class="ph-countdown-main">' + minutesLeft + ' minutes left</span><span class="ph-countdown-sub">of this ' + minutesTotal + '-minute ' + row.ruler.name + ' hour</span>';
    }
    if (row && el.hourMeta) el.hourMeta.textContent = hourMetaLine(row, rows);
    if (row && el.currentInterpretation) el.currentInterpretation.innerHTML = compactHourInterpretation(day, row, rows);
    syncTimeFormatToggle();
    const sequence24 = rows.map(function (r) { return r.ruler.key; });
    const weekPath = ['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
    const weekIndex = Math.max(0, weekPath.indexOf(dayKey));
    const dayFraction = selectedPosition >= 24 ? 1 : Math.max(0, Math.min(1, (selectedPosition - 1) / 23));
    let svg = '';
    svg += '<circle class="ph-heptagram-circle" cx="180" cy="180" r="118"></circle>';
    svg += '<circle class="ph-heptagram-guide" cx="180" cy="180" r="78"></circle>';

    for (let i = 0; i < 7; i++) {
      const a = weekPath[i], b = weekPath[i + 1];
      if (i < weekIndex) svg += heptagramLine(a, b, 'ph-heptagram-star-segment past');
      else if (i === weekIndex) {
        svg += heptagramLine(a, b, 'ph-heptagram-star-segment future');
        svg += heptagramPartialLine(a, b, 'ph-heptagram-star-segment current', dayFraction);
      } else svg += heptagramLine(a, b, 'ph-heptagram-star-segment future');
    }

    const currentSegment = Math.max(0, selectedHour - 1);
    for (let i = 0; i < 23; i++) {
      if (i < currentSegment) svg += heptagramLine(sequence24[i], sequence24[i + 1], 'ph-heptagram-hour-segment past');
      else if (i === currentSegment) {
        svg += heptagramLine(sequence24[i], sequence24[i + 1], 'ph-heptagram-hour-segment future');
        svg += heptagramPartialLine(sequence24[i], sequence24[i + 1], 'ph-heptagram-hour-segment current', hourFraction);
      } else svg += heptagramLine(sequence24[i], sequence24[i + 1], 'ph-heptagram-hour-segment future');
    }
    chaldean.forEach(function (key) {
      const p = heptagramPointFor(key);
      const lp = heptagramLabelPointFor(key);
      const planet = byKey[key];
      const isCurrent = row && row.ruler.key === key;
      const isDay = key === dayKey;
      const isWeekComplete = weekPath.slice(0, weekIndex + 1).includes(key);
      const classes = 'ph-heptagram-node p-' + key + (isCurrent ? ' current' : '') + (isDay ? ' day-ruler' : '') + (isWeekComplete ? ' week-complete' : '');
      svg += '<g class="p-' + key + '">';
      svg += '<circle class="' + classes + '" cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) + '" r="18"></circle>';
      svg += '<text class="ph-heptagram-glyph" x="' + p.x.toFixed(2) + '" y="' + (p.y + 9).toFixed(2) + '" text-anchor="middle">' + planet.sym + '</text>';
      svg += '<text class="ph-heptagram-label" x="' + lp.x.toFixed(2) + '" y="' + lp.y.toFixed(2) + '" text-anchor="middle">' + planet.name + '</text>';
      if (isDay) svg += '<title>' + planet.name + ' day ruler</title>';
      svg += '</g>';
    });
    el.heptagramSvg.innerHTML = svg;

    if (el.dayRulerPortrait && mythicProfiles[dayKey]) { el.dayRulerPortrait.src = mythicProfiles[dayKey]; el.dayRulerPortrait.alt = day.name + ' profile artwork'; }
    if (el.dayRulerProfileName) el.dayRulerProfileName.textContent = day.sym + ' ' + day.name + ' day';
    if (el.dayRulerFocus) el.dayRulerFocus.textContent = day.focusDay + '.';
    if (el.hourRulerProfileName && row) el.hourRulerProfileName.textContent = row.ruler.sym + ' ' + row.ruler.name + ' hour';
    if (el.hourRulerFocus && row) el.hourRulerFocus.textContent = row.ruler.focusHour + '.';

    const weekText = weekPath.slice(0, 7).map(function (key) { return byKey[key].sym + ' ' + byKey[key].name; }).join(' → ') + ' → ' + byKey.sun.sym + ' Sun';
    const completeText = weekIndex ? weekPath.slice(0, weekIndex + 1).map(function (key) { return byKey[key].name; }).join(' → ') : 'Sun';
    if (el.heptagramOrderText) el.heptagramOrderText.textContent = 'Planetary week path: ' + weekText + '. Completed this week: ' + completeText + '.';
    if (el.heptagramTimeText) el.heptagramTimeText.textContent = day.name + ' day is drawing from ' + byKey[weekPath[weekIndex]].name + ' toward ' + byKey[weekPath[weekIndex + 1]].name + '. Hour ' + selectedHour + ' is ' + row.ruler.name + ' hour, from ' + fmtHM(row.start) + ' to ' + fmtHM(row.end) + '. The hour handoff is ' + Math.round(hourFraction * 100) + '% drawn.';
    if (el.heptagramGeometryText) el.heptagramGeometryText.textContent = 'Soft solid lines mark completed planetary days. Pale guide lines mark future days. The glowing star line marks the current sunrise-to-sunrise day, and the inner ring marks the current planetary hour.';
    if (el.heptagramSummary) {
      el.heptagramSummary.innerHTML = 'The week has already carried <b>' + completeText + '</b>. Today, <b>' + day.name + '</b> is the day ruler, and <b>' + row.ruler.name + '</b> is the hour ruler. The heptagram shows the week, day, and hour moving together.';
    }
    if (el.heptagramHourLabel) el.heptagramHourLabel.textContent = (state.heptagramHourOverride != null ? 'Previewing' : 'Live now') + ' · hour ' + selectedHour + ' of 24 · ' + row.ruler.name + ' hour · ' + fmtHM(row.start) + '–' + fmtHM(row.end) + ' · day segment ' + Math.round(dayFraction * 100) + '%';
    if (el.heptagramHourBeads) {
      el.heptagramHourBeads.innerHTML = rows.map(function (r) {
        const cls = r.index < selectedHour ? 'past' : (r.index === selectedHour ? 'current' : 'future');
        return '<span class="ph-hour-bead ' + cls + ' p-' + r.ruler.key + '">' + r.index + ' ' + r.ruler.sym + '</span>';
      }).join('');
    }
  }

  function renderTicker(frame, rows) {
    const now = state.useSystem ? new Date() : frame.localNow;
    const span = frame.end.getTime() - frame.start.getTime();
    const percent = function (date) { return Math.max(0, Math.min(100, ((date.getTime() - frame.start.getTime()) / span) * 100)); };
    const nowPct = percent(now);
    el.dayStart.style.left = '0%';
    el.dayEnd.style.left = 'calc(100% - 2px)';
    el.sunsetBar.style.left = percent(frame.sunset) + '%';
    el.progress.style.left = nowPct + '%';
    el.tickerFill.style.width = nowPct + '%';
    const currentRow = rows[currentIndex(rows, now)] || rows[0];
    if (el.currentGlyph && currentRow) {
      el.currentGlyph.textContent = currentRow.ruler.sym;
      el.currentGlyph.className = 'ph-current-glyph p-' + currentRow.ruler.key;
      el.currentGlyph.style.left = nowPct + '%';
      el.currentGlyph.title = 'Current point: ' + currentRow.ruler.name + ' hour ' + currentRow.index;
    }
    const zones = rows.map(function (r) {
      const left = percent(r.start);
      const width = Math.max(0.15, percent(r.end) - left);
      const label = (r.isBright ? 'Bright' : 'Dark') + ' hour ' + r.index + ': ' + r.ruler.name + ', ' + fmtHM(r.start) + '–' + fmtHM(r.end);
      return '<button class="ph-hour-zone" type="button" data-hour-jump="' + r.index + '" style="left:' + left.toFixed(3) + '%;width:' + width.toFixed(3) + '%" title="' + attrText(label) + '" aria-label="' + attrText('Show ' + label + ' in the 24-hour list') + '"></button>';
    }).join('');
    const marks = rows.slice(1).map(function (r) {
      return '<span class="ph-hour-mark" style="left:' + percent(r.start).toFixed(3) + '%"></span>';
    }).join('');
    el.hourMarks.innerHTML = zones + marks;
  }

  function renderHoursTable(rows, dayKey, idx) {
    el.hoursTable.innerHTML = '';
    rows.forEach(function (r, i) {
      const tr = document.createElement('tr');
      tr.id = 'ph-hour-row-' + r.index;
      tr.dataset.hourIndex = String(r.index);
      if (i === idx) tr.className = 'active';
      if (i === idx - 1) tr.className = 'previous';
      if (i === idx + 1) tr.className = 'next';
      tr.innerHTML = '<td>' + r.index + '</td>' +
        '<td>' + fmtHM(r.start) + '–' + fmtHM(r.end) + '</td>' +
        '<td class="p-' + r.ruler.key + '"><span class="ph-dot"></span> ' + r.ruler.sym + ' ' + r.ruler.name + '</td>' +
        '<td><span class="ph-badge ' + (r.isBright ? 'bright' : 'dark') + '">' + (r.isBright ? 'Bright' : 'Dark') + '</span></td>' +
        '<td>' + fullContextStatement(byKey[dayKey], r, rows) + '</td>';
      el.hoursTable.appendChild(tr);
    });
  }

  function syncHash() {
    const params = new URLSearchParams();
    params.set('lat', state.lat.toFixed(4));
    params.set('lon', state.lon.toFixed(4));
    params.set('tz', state.tz);
    if (state.locationName) params.set('loc', state.locationName);
    if (!state.useSystem) params.set('dt', state.now.toISOString());
    history.replaceState(null, '', '#' + params.toString());
  }

  function rebuild() {
    state.lat = safeNumber(el.lat.value, state.lat);
    state.lon = safeNumber(el.lon.value, state.lon);
    state.tz = el.tzSelect.value || state.tz;
    smallEcho();
    savePlanetaryHoursWhereWhen();
    if (el.settingsSummary) el.settingsSummary.textContent = (state.locationName || 'Manual place') + ' · ' + state.tz + ' · ' + (state.useSystem ? 'now' : dateInputValueFor(localNow(), state.tz) + ' ' + timeInputValueFor(localNow(), state.tz));

    const frame = computeDayFrame(localNow(), state.lat, state.lon, state.tz);
    const dayKey = dayRulerKeyForWeekday(frame.start);
    const day = byKey[dayKey];
    const rows = buildHours(frame, dayKey);
    const idx = currentIndex(rows, frame.localNow);
    const cur = rows[idx];

    if (el.dayCalendarDate) el.dayCalendarDate.textContent = new Date(frame.localNow).toLocaleDateString('en-US', {timeZone: state.tz, weekday:'long', month:'long', day:'numeric', year:'numeric'});
    if (el.dayRuler) el.dayRuler.innerHTML = pillFor(day, day.name + ' day');
    el.dayRulerMeta.textContent = '';
    el.sunTimes.textContent = 'Bright hours are from sunrise at ' + fmtHMText(frame.sunrise) + ' to sunset at ' + fmtHMText(frame.sunset) + ', followed by dark hours until next sunrise at ' + fmtHMText(frame.end);
    el.bridgeInfo.textContent = '';
    const dateKeyForLedger = dateInputValueFor(frame.localNow, state.tz);
    const skyDateTime = dateKeyForLedger + 'T' + timeInputValueFor(frame.localNow, state.tz);
    if (el.dateFieldLink) {
      const skyParams = new URLSearchParams({
        preview: 'pr55',
        source: 'planetary-hours',
        datetime: skyDateTime,
        lat: String(state.lat),
        lon: String(state.lon),
        tz: state.tz || '',
        loc: state.locationName || '',
        calc: '1',
        name: 'Planetary Hours ' + skyDateTime.replace('T', ' ')
      });
      el.dateFieldLink.href = 'sky-chart.html?' + skyParams.toString() + '#sky-calc';
    }
    if (el.topHourRuler && cur) el.topHourRuler.innerHTML = pillFor(cur.ruler, cur.ruler.name + ' hour');
    if (el.topHourTime && cur) el.topHourTime.textContent = fmtHM(cur.start) + '–' + fmtHM(cur.end) + ' • ' + (cur.isBright ? 'Bright' : 'Dark') + ' hour ' + cur.index;
    if (el.topHourFocus && cur) el.topHourFocus.textContent = contextFocus(day, cur.ruler);
    if (el.topHourJump && cur) setHourJump(el.topHourJump, cur);
    const prevDayKeyForCue = weekdayToRuler[(rulerToWeekday[dayKey] + 6) % 7];
    const nextDayKeyForCue = weekdayToRuler[(rulerToWeekday[dayKey] + 1) % 7];
    if (el.prevDayCue) el.prevDayCue.textContent = '← ' + byKey[prevDayKeyForCue].sym + ' day';
    if (el.nextDayCue) el.nextDayCue.textContent = byKey[nextDayKeyForCue].sym + ' day →';
    renderMoonFrame(frame.localNow, state.lat, state.lon);
    renderWandererGrid(frame);
    let prev = rows[idx - 1];
    let next = rows[idx + 1];
    if (!prev) {
      const prevDayKey = weekdayToRuler[(rulerToWeekday[dayKey] + 6) % 7];
      const prevSun = solarTimes(localNoonFor(frame.start, state.tz, -1), state.lat, state.lon);
      const prevFrame = {start: prevSun.sunrise, sunrise: prevSun.sunrise, sunset: prevSun.sunset, end: frame.start, localNow: frame.start};
      prev = buildHours(prevFrame, prevDayKey)[23];
    }
    if (!next) {
      const nextDayKey = weekdayToRuler[(rulerToWeekday[dayKey] + 1) % 7];
      const nextSun = solarTimes(localNoonFor(frame.start, state.tz, 1), state.lat, state.lon);
      const followingSun = solarTimes(localNoonFor(frame.start, state.tz, 2), state.lat, state.lon);
      const nextFrame = {start: frame.end, sunrise: frame.end, sunset: nextSun.sunset, end: followingSun.sunrise, localNow: frame.end};
      next = buildHours(nextFrame, nextDayKey)[0];
    }
    const minutesLeft = minutesBetween(frame.localNow, cur.end);
    const minutesTotal = Math.max(1, minutesBetween(cur.start, cur.end));
    const dayHoursLeft = hoursLeftInDay(frame, frame.localNow);
    el.prevHourCard.innerHTML = miniCard('Previous', prev);
    el.currentHourCard.innerHTML = miniCard('Current', cur);
    el.nextHourCard.innerHTML = miniCard('Next', next);
    setHourJump(el.prevHourCard, prev);
    setHourJump(el.currentHourCard, cur);
    setHourJump(el.nextHourCard, next);
    el.minuteCountdown.innerHTML = '<span class="ph-countdown-main">' + minutesLeft + ' minutes left</span><span class="ph-countdown-sub">of this ' + minutesTotal + '-minute ' + cur.ruler.name + ' hour</span>';
    el.hourMeta.className = 'ph-current-meta-line';
    el.hourMeta.textContent = hourMetaLine(cur, rows);
    el.currentInterpretation.innerHTML = compactHourInterpretation(day, cur, rows);
    el.dayCountdown.textContent = dayHoursLeft + ' hours left in this planetary day';
    el.legendChips.innerHTML = pillFor(cur.ruler, 'Hour: ' + cur.ruler.focusHour);
    el.lblStart.textContent = fmtHM(frame.start);
    if (el.lblSunset) el.lblSunset.textContent = 'Sunset ' + fmtHM(frame.sunset);
    el.lblEnd.textContent = fmtHM(frame.end);

    renderAnimatedHeptagram(frame, rows, dayKey, idx);
    renderTicker(frame, rows);
    renderHoursTable(rows, dayKey, idx);
    renderSkyOrientation(true);
    syncHash();

  }

  function bindEvents() {
    el.useGeo.addEventListener('click', function () {
      if (!navigator.geolocation) { smallEcho('Geolocation is unavailable.'); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        state.lat = pos.coords.latitude;
        state.lon = pos.coords.longitude;
        state.locationName = 'Current browser location';
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (browserTz) { state.tz = browserTz; el.tzSelect.value = state.tz; }
        el.lat.value = state.lat.toFixed(4);
        el.lon.value = state.lon.toFixed(4);
        el.locationSearch.value = '';
        el.locationNote.textContent = 'Current location selected; timezone set from this browser.';
        rebuild();
      }, function () { smallEcho('Geolocation failed.'); });
    });
    el.setLatLon.addEventListener('click', function () { state.locationName = 'Manual coordinates'; el.locationNote.textContent = 'Manual coordinates are active. Keep timezone paired with the intended place.'; rebuild(); });
    el.applyLocation.addEventListener('click', function () { applyLocationPreset(matchLocation(el.locationSearch.value)); });
    el.locationSearch.addEventListener('change', function () { const loc = matchLocation(el.locationSearch.value); if (loc) applyLocationPreset(loc); });
    el.tzSelect.addEventListener('change', function () { el.locationNote.innerHTML = '<span class="ph-warning">Timezone changed separately from the selected location. Check that it still matches the intended place.</span>'; rebuild(); });
    el.useSystem.addEventListener('change', function () {
      state.useSystem = el.useSystem.checked;
      el.manualTime.style.display = 'inline-flex'; if (el.datePick) el.datePick.disabled = state.useSystem; if (el.timePick) el.timePick.disabled = state.useSystem;
      rebuild();
    });
    el.applyDT.addEventListener('click', function () {
      if (el.datePick.value && el.timePick.value) {
        setManualDateFromInputs();
        rebuild();
      }
    });
    el.copy.addEventListener('click', function () {
      const url = location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { el.copy.textContent = 'Copied'; setTimeout(function () { el.copy.textContent = 'Copy link'; }, 1200); });
      }
    });
    if (el.timeFormatToggle) el.timeFormatToggle.addEventListener('click', function () { state.timeFormat = state.timeFormat === '24h' ? '12h' : '24h'; rebuild(); });
    if (el.runSkyQuery) el.runSkyQuery.addEventListener('click', function () { renderSkyOrientation(true); });
    if (el.skyQuery) el.skyQuery.addEventListener('keydown', function (event) { if (event.key === 'Enter') renderSkyOrientation(true); });
    if (el.wandererGrid) el.wandererGrid.addEventListener('click', function (event) {
      const button = event.target && event.target.closest ? event.target.closest('[data-sky-body]') : null;
      if (!button) return;
      const body = button.getAttribute('data-sky-body');
      if (!body) return;
      state.skyBody = body;
      if (el.skyQuery) el.skyQuery.value = 'Where is ' + body + ' right now?';
      renderWandererGrid();
      renderSkyOrientation(true);
    });
    if (el.hourMarks) el.hourMarks.addEventListener('click', function (event) { const target = event.target.closest('[data-hour-jump]'); if (target) scrollToHour(Number(target.dataset.hourJump)); });
    [el.prevHourCard, el.currentHourCard, el.nextHourCard, el.topHourJump].forEach(function (button) {
      if (!button) return;
      button.addEventListener('click', function () { if (button.dataset.hourJump) scrollToHour(Number(button.dataset.hourJump)); });
    });

    function shiftManualDay(delta, hourOverride) {
      const base = state.useSystem ? localNow() : new Date(state.now);
      state.useSystem = false;
      state.now = addDays(base, delta);
      state.heptagramHourOverride = hourOverride == null ? null : hourOverride;
      if (el.useSystem) el.useSystem.checked = false;
      if (el.manualTime) { el.manualTime.style.display = 'inline-flex'; if (el.datePick) el.datePick.disabled = false; if (el.timePick) el.timePick.disabled = false; }
      if (el.datePick) el.datePick.value = dateInputValueFor(state.now, state.tz);
      if (el.timePick) el.timePick.value = timeInputValueFor(state.now, state.tz);
      rebuild();
    }
    if (el.prevDayCue) el.prevDayCue.addEventListener('click', function () { shiftManualDay(-1); });
    if (el.nextDayCue) el.nextDayCue.addEventListener('click', function () { shiftManualDay(1); });
    if (el.heptagramHour) el.heptagramHour.addEventListener('input', function () { state.heptagramHourOverride = Number(el.heptagramHour.value) || null; rebuild(); });
    if (el.heptagramPrev) el.heptagramPrev.addEventListener('click', function () {
      const current = state.heptagramHourOverride || Number(el.heptagramHour && el.heptagramHour.value) || 1;
      if (current <= 1) { shiftManualDay(-1, 24); }
      else { state.heptagramHourOverride = Math.max(1, current - 1); rebuild(); }
    });
    if (el.heptagramNext) el.heptagramNext.addEventListener('click', function () {
      const current = state.heptagramHourOverride || Number(el.heptagramHour && el.heptagramHour.value) || 1;
      if (current >= 24) { shiftManualDay(1, 1); }
      else { state.heptagramHourOverride = Math.min(24, current + 1); rebuild(); }
    });
    if (el.heptagramNow) el.heptagramNow.addEventListener('click', function () { state.heptagramHourOverride = null; state.useSystem = true; if (el.useSystem) el.useSystem.checked = true; if (el.manualTime) { el.manualTime.style.display = 'inline-flex'; if (el.datePick) el.datePick.disabled = true; if (el.timePick) el.timePick.disabled = true; } rebuild(); });
    window.addEventListener('resize', rebuild);
  }

  function init() {
    readHash();
    populateTimezones();
    populateLocations();
    el.locationSearch.value = state.locationName || '';
    el.lat.value = state.lat.toFixed(4);
    el.lon.value = state.lon.toFixed(4);
    el.useSystem.checked = state.useSystem;
    el.manualTime.style.display = 'inline-flex'; if (el.datePick) el.datePick.disabled = state.useSystem; if (el.timePick) el.timePick.disabled = state.useSystem;
    const now = localNow();
    el.datePick.value = dateInputValueFor(now, state.tz);
    el.timePick.value = timeInputValueFor(now, state.tz);
    bindEvents();
    tickLocalClock();
    setInterval(tickLocalClock, 15000);
    setInterval(function () { if (state.useSystem) rebuild(); }, 60000);
    rebuild();
  }

  init();
})();
