
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
  const state = { tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', lat: 40.7608, lon: -111.8910, useSystem: true, now: new Date(), locationName: 'Salt Lake City, Utah, USA', moonOrientation: 'auto' };
  const locationPresets = [
    {name:'Salt Lake City, Utah, USA', lat:40.7608, lon:-111.8910, tz:'America/Denver'},
    {name:'Malden, Massachusetts, USA', lat:42.4251, lon:-71.0662, tz:'America/New_York'},
    {name:'Boston, Massachusetts, USA', lat:42.3601, lon:-71.0589, tz:'America/New_York'},
    {name:'Cambridge, Massachusetts, USA', lat:42.3736, lon:-71.1097, tz:'America/New_York'},
    {name:'Long Beach, California, USA', lat:33.7701, lon:-118.1937, tz:'America/Los_Angeles'},
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
    sunTimes: document.getElementById('sunTimes'),
    bridgeInfo: document.getElementById('bridgeInfo'),
    moonDisc: document.getElementById('moonDisc'),
    moonPhase: document.getElementById('moonPhase'),
    moonTimes: document.getElementById('moonTimes'),
    moonVisibility: document.getElementById('moonVisibility'),
    moonOrientation: document.getElementById('moonOrientation'),
    ticker: document.getElementById('ticker'),
    tickerFill: document.getElementById('tickerFill'),
    hourMarks: document.getElementById('hourMarks'),
    progress: document.getElementById('progress'),
    currentGlyph: document.getElementById('currentGlyph'),
    dayStart: document.getElementById('dayStart'),
    dayEnd: document.getElementById('dayEnd'),
    sunsetBar: document.getElementById('sunsetBar'),
    lblStart: document.getElementById('lblStart'),
    lblEnd: document.getElementById('lblEnd'),
    prevHourCard: document.getElementById('prevHourCard'),
    currentHourCard: document.getElementById('currentHourCard'),
    nextHourCard: document.getElementById('nextHourCard'),
    minuteCountdown: document.getElementById('minuteCountdown'),
    hourMeta: document.getElementById('hourMeta'),
    currentInterpretation: document.getElementById('currentInterpretation'),
    dayCountdown: document.getElementById('dayCountdown'),
    legendChips: document.getElementById('legendChips'),
    hoursTable: document.querySelector('#hoursTable tbody')
  };

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtHM(d) { return new Date(d).toLocaleTimeString('en-US', {timeZone: state.tz, hour: 'numeric', minute: '2-digit'}); }
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

  function tickLocalClock() {
    el.clock.textContent = new Date().toLocaleTimeString('en-US', {timeZone: state.tz, hour: '2-digit', minute: '2-digit', hour12: false});
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
    }
    el.hourMarks.innerHTML = rows.slice(1).map(function (r) {
      return '<span class="ph-hour-mark" style="left:' + percent(r.start).toFixed(3) + '%"></span>';
    }).join('');
  }

  function renderHoursTable(rows, dayKey, idx) {
    el.hoursTable.innerHTML = '';
    rows.forEach(function (r, i) {
      const tr = document.createElement('tr');
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
    if (el.settingsSummary) el.settingsSummary.textContent = (state.locationName || 'Manual place') + ' · ' + state.tz + ' · ' + (state.useSystem ? 'now' : dateInputValueFor(localNow(), state.tz) + ' ' + timeInputValueFor(localNow(), state.tz));

    const frame = computeDayFrame(localNow(), state.lat, state.lon, state.tz);
    const dayKey = dayRulerKeyForWeekday(frame.start);
    const day = byKey[dayKey];
    const rows = buildHours(frame, dayKey);
    const idx = currentIndex(rows, frame.localNow);
    const cur = rows[idx];

    el.dayRuler.innerHTML = pillFor(day, day.name + ' day');
    el.dayRulerMeta.textContent = day.focusDay + '. Planetary day began ' + fmtDate(frame.start) + ' at ' + fmtHM(frame.start) + '.';
    el.sunTimes.textContent = 'Sunrise ' + fmtHM(frame.sunrise) + ' • Sunset ' + fmtHM(frame.sunset) + ' • Next sunrise ' + fmtHM(frame.end);
    el.bridgeInfo.textContent = 'Day frame: ' + fmtHM(frame.start) + ' to ' + fmtHM(frame.end) + '. Bright hours: sunrise to sunset. Dark hours: sunset to next sunrise.';
    renderMoonFrame(frame.localNow, state.lat, state.lon);
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
    el.minuteCountdown.textContent = minutesLeft + ' minutes left / ' + minutesTotal + ' minutes';
    const occ = occurrenceInfo(rows, cur);
    el.hourMeta.textContent = 'Hour ' + cur.ordinal + ' of 24 • ' + (cur.isBright ? 'Bright' : 'Dark') + ' • ' + ordinalName(occ.occurrence).label + ' ' + cur.ruler.name + ' hour of ' + occ.total;
    el.currentInterpretation.innerHTML = fullContextStatement(day, cur, rows);
    el.dayCountdown.textContent = dayHoursLeft + ' hours left in this planetary day';
    el.legendChips.innerHTML = pillFor(day, 'Day: ' + day.focusDay.split(',')[0]) + pillFor(cur.ruler, 'Hour: ' + cur.ruler.focusHour);
    el.lblStart.textContent = fmtHM(frame.start);
    el.lblEnd.textContent = fmtHM(frame.end);

    renderTicker(frame, rows);
    renderHoursTable(rows, dayKey, idx);
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
    if (el.moonOrientation) el.moonOrientation.addEventListener('change', function () { state.moonOrientation = el.moonOrientation.value; rebuild(); });
    el.useSystem.addEventListener('change', function () {
      state.useSystem = el.useSystem.checked;
      el.manualTime.style.display = state.useSystem ? 'none' : 'inline-flex';
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
    window.addEventListener('resize', rebuild);
  }

  function init() {
    readHash();
    populateTimezones();
    if (el.moonOrientation) el.moonOrientation.value = state.moonOrientation;
    populateLocations();
    el.locationSearch.value = state.locationName || '';
    el.lat.value = state.lat.toFixed(4);
    el.lon.value = state.lon.toFixed(4);
    el.useSystem.checked = state.useSystem;
    el.manualTime.style.display = state.useSystem ? 'none' : 'inline-flex';
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
