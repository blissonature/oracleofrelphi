
(function () {
  const planets = [
    {key:'saturn', sym:'â™„', name:'Saturn', focusDay:'Structure, boundaries, karmic audit', focusHour:'Consolidate, prune, commit'},
    {key:'jupiter', sym:'â™ƒ', name:'Jupiter', focusDay:'Growth, teaching, wisdom', focusHour:'Expand, publish, mentor'},
    {key:'mars', sym:'â™‚', name:'Mars', focusDay:'Courage, cutting, heat', focusHour:'Act, compete, cauterize'},
    {key:'sun', sym:'â˜‰', name:'Sun', focusDay:'Vitality, authority, radiance', focusHour:'Lead, clarify, spotlight'},
    {key:'venus', sym:'â™€', name:'Venus', focusDay:'Harmony, bonds, aesthetics', focusHour:'Relate, attract, refine'},
    {key:'mercury', sym:'â˜¿', name:'Mercury', focusDay:'Trade, signals, analysis', focusHour:'Write, ship, negotiate'},
    {key:'moon', sym:'â˜½', name:'Moon', focusDay:'Care, tides, memory', focusHour:'Nourish, adapt, reflect'}
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
    return row.ruler.name + ' hour Â· ' + fmtHM(row.start) + 'â€“' + fmtHM(row.end) + ' Â· ' + (row.isBright ? 'Bright' : 'Dark') + ' hour ' + row.ordinal + ' of 24 Â· ' + ordinalName(info.occurrence).label + ' ' + row.ruler.name + ' hour of ' + info.total;
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
    el.locationNote.textContent = 'Location packet selected: ' + loc.name + ' â€” ' + loc.tz + '.';
    rebuild();
  }

  function setManualDateFromInputs() {
    if (el.datePick.value && el.timePick.value) {
      if (window.luxon && window.luxon.DateTime) {
        const dt = window.lu×Ş»âÚ$z{-®éÜj×6öç7BW&6VçBÒgVæ7F–öâ†FFR’²&WGW&âÖF‚æÖ‚ƒÂÖF‚æÖ–âƒÂ‚†FFRævWEF–ÖR‚’Òg&ÖRç7F'BævWEF–ÖR‚’’ò7â’¢’“²Ó°Ğ¢6öç7Bæ÷u7BÒW&6VçB†æ÷r“°Ğ¢VÂæF•7F'Bç7G–ÆRæÆVgBÒsRs°Ğ¢VÂæF”VæBç7G–ÆRæÆVgBÒv6Æ2ƒRÒ'‚’s°Ğ¢VÂç7Vç6WD&"ç7G–ÆRæÆVgBÒW&6VçB†g&ÖRç7Vç6WB’²rRs°Ğ¢VÂç&öw&W72ç7G–ÆRæÆVgBÒæ÷u7B²rRs°Ğ¢VÂçF–6¶W$f–ÆÂç7G–ÆRçv–GF‚Òæ÷u7B²rRs°Ğ¢6öç7B7W'&VçE&÷rÒ&÷w5¶7W'&VçD–æFW‚‡&÷w2Âæ÷r•ÒÇÂ&÷w5³Ó°Ğ¢–b†VÂæ7W'&VçDvÇ—‚bb7W'&VçE&÷r’°Ğ¢VÂæ7W'&VçDvÇ—‚çFW‡D6öçFVçBÒ7W'&VçE&÷rç'VÆW"ç7–Ó°Ğ¢VÂæ7W'&VçDvÇ—‚æ6Æ74æÖRÒw‚Ö7W'&VçBÖvÇ—‚Òr²7W'&VçE&÷rç'VÆW"æ¶W“°Ğ¢VÂæ7W'&VçDvÇ—‚ç7G–ÆRæÆVgBÒæ÷u7B²rRs°Ğ¢VÂæ7W'&VçDvÇ—‚çF—FÆRÒt7W'&VçBö–çC¢r²7W'&VçE&÷rç'VÆW"ææÖR²r†÷W"r²7W'&VçE&÷ræ–æFWƒ°Ğ¢ĞĞ¢6öç7B¦öæW2Ò&÷w2æÖ†gVæ7F–öâ‡"’°Ğ¢6öç7BÆVgBÒW&6VçB‡"ç7F'B“°Ğ¢6öç7Bv–GF‚ÒÖF‚æÖ‚ƒãRÂW&6VçB‡"æVæB’ÒÆVgB“°Ğ¢6öç7BÆ&VÂÒ‡"æ—4'&–v‡Bòt'&–v‡Br¢tF&²r’²r†÷W"r²"æ–æFW‚²s¢r²"ç'VÆW"ææÖR²rÂr²f×D„Ò‡"ç7F'B’²~(	2r²f×D„Ò‡"æVæB“°Ğ¢&WGW&âsÆ'WGFöâ6Æ73Ò'‚Ö†÷W"×¦öæR"G—SÒ&'WGFöâ"FFÖ†÷W"Ö§V×Ò"r²"æ–æFW‚²r"7G–ÆSÒ&ÆVgC¢r²ÆVgBçFôf—†VBƒ2’²rS·v–GFƒ¢r²v–GF‚çFôf—†VBƒ2’²rR"F—FÆSÒ"r²GG%FW‡B†Æ&VÂ’²r"&–ÖÆ&VÃÒ"r²GG%FW‡B‚u6†÷rr²Æ&VÂ²r–âF†R#BÖ†÷W"Æ—7Br’²r#ãÂö'WGFöãâs°Ğ¢Ò’æ¦ö–â‚rr“°Ğ¢6öç7BÖ&·2Ò&÷w2ç6Æ–6Rƒ’æÖ†gVæ7F–öâ‡"’°Ğ¢&WGW&âsÇ7â6Æ73Ò'‚Ö†÷W"ÖÖ&²"7G–ÆSÒ&ÆVgC¢r²W&6VçB‡"ç7F'B’çFôf—†VBƒ2’²rR#ãÂ÷7ãâs°Ğ¢Ò’æ¦ö–â‚rr“°Ğ¢VÂæ†÷W$Ö&·2æ–ææW$…DÔÂÒ¦öæW2²Ö&·3°Ğ¢ĞĞ Ğ¢gVæ7F–öâ&VæFW$†÷W'5F&ÆR‡&÷w2ÂF”¶W’Â–G‚’°Ğ¢VÂæ†÷W'5F&ÆRæ–ææW$…DÔÂÒrs°Ğ¢&÷w2æf÷$V6‚†gVæ7F–öâ‡"Â’’°Ğ¢6öç7BG"ÒFö7VÖVçBæ7&VFTVÆVÖVçB‚wG"r“°Ğ¢G"æ–BÒw‚Ö†÷W"×&÷rÒr²"æ–æFWƒ°Ğ¢G"æFF6WBæ†÷W$–æFW‚Ò7G&–ær‡"æ–æFW‚“°Ğ¢–b†’ÓÓÒ–G‚’G"æ6Æ74æÖRÒv7F—fRs°Ğ¢–b†’ÓÓÒ–G‚Ò’G"æ6Æ74æÖRÒw&Wf–÷W2s°Ğ¢–b†’ÓÓÒ–G‚²’G"æ6Æ74æÖRÒvæW‡Bs°Ğ¢G"æ–ææW$…DÔÂÒsÇFCâr²"æ–æFW‚²sÂ÷FCâr°Ğ¢sÇFCâr²f×D„Ò‡"ç7F'B’²~(	2r²f×D„Ò‡"æVæB’²sÂ÷FCâr°Ğ¢sÇFB6Æ73Ò'Òr²"ç'VÆW"æ¶W’²r#ãÇ7â6Æ73Ò'‚ÖF÷B#ãÂ÷7ãâr²"ç'VÆW"ç7–Ò²rr²"ç'VÆW"ææÖR²sÂ÷FCâr°Ğ¢sÇFCãÇ7â6Æ73Ò'‚Ö&FvRr²‡"æ—4'&–v‡Bòv'&–v‡Br¢vF&²r’²r#âr²‡"æ—4'&–v‡Bòt'&–v‡Br¢tF&²r’²sÂ÷7ããÂ÷FCâr°Ğ¢sÇFCâr²gVÆÄ6öçFW‡E7FFVÖVçB†'”¶W•¶F”¶W•ÒÂ"Â&÷w2’²sÂ÷FCâs°Ğ¢VÂæ†÷W'5F&ÆRæVæD6†–ÆB‡G"“°Ğ¢Ò“°Ğ¢ĞĞ Ğ¢gVæ7F–öâ7–æ4†6‚‚’°Ğ¢6öç7B&×2ÒæWrU$Å6V&6…&×2‚“°Ğ¢&×2ç6WB‚vÆBrÂ7FFRæÆBçFôf—†VBƒB’“°Ğ¢&×2ç6WB‚vÆöârÂ7FFRæÆöâçFôf—†VBƒB’“°Ğ¢&×2ç6WB‚wG¢rÂ7FFRçG¢“°Ğ¢–b‡7FFRæÆö6F–öäæÖR’&×2ç6WB‚vÆö2rÂ7FFRæÆö6F–öäæÖR“°Ğ¢–b‚7FFRçW6U7—7FVÒ’&×2ç6WB‚vGBrÂ7FFRææ÷rçFô•4õ7G&–ær‚’“°Ğ¢†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂrrÂr2r²&×2çFõ7G&–ær‚’“°Ğ¢ĞĞ Ğ¢gVæ7F–öâ&V'V–ÆB‚’°Ğ¢7FFRæÆBÒ6fTçVÖ&W"†VÂæÆBçfÇVRÂ7FFRæÆB“°Ğ¢7FFRæÆöâÒ6fTçVÖ&W"†VÂæÆöâçfÇVRÂ7FFRæÆöâ“°Ğ¢7FFRçG¢ÒVÂçG¥6VÆV7BçfÇVRÇÂ7FFRçG£°Ğ¢6ÖÆÄV6†ò‚“°Ğ¢6fUÆæWF'”†÷W'5v†W&Uv†Vâ‚“°Ğ¢–b†VÂç6WGF–æw57VÖÖ'’’VÂç6WGF–æw57VÖÖ'’çFW‡D6öçFVçBÒ‡7FFRæÆö6F–öäæÖRÇÂtÖçVÂÆ6Rr’²r+rr²7FFRçG¢²r+rr²‡7FFRçW6U7—7FVÒòvæ÷rr¢FFT–çWEfÇVTf÷"†Æö6Äæ÷r‚’Â7FFRçG¢’²rr²F–ÖT–çWEfÇVTf÷"†Æö6Äæ÷r‚’Â7FFRçG¢’“°Ğ Ğ¢6öç7Bg&ÖRÒ6ö×WFTF”g&ÖR†Æö6Äæ÷r‚’Â7FFRæÆBÂ7FFRæÆöâÂ7FFRçG¢“°Ğ¢6öç7BF”¶W’ÒF•'VÆW$¶W”f÷%vVV¶F’†g&ÖRç7F'B“°Ğ¢6öç7BF’Ò'”¶W•¶F”¶W•Ó°Ğ¢6öç7B&÷w2Ò'V–ÆD†÷W'2†g&ÖRÂF”¶W’“°Ğ¢6öç7B–G‚Ò7W'&VçD–æFW‚‡&÷w2Âg&ÖRæÆö6Äæ÷r“°Ğ¢6öç7B7W"Ò&÷w5¶–G…Ó°Ğ Ğ¢–b†VÂæF”6ÆVæF$FFR’VÂæF”6ÆVæF$FFRçFW‡D6öçFVçBÒæWrFFR†g&ÖRæÆö6Äæ÷r’çFôÆö6ÆTFFU7G&–ær‚vVâÕU2rÂ·F–ÖU¦öæS¢7FFRçG¢ÂvVV¶F“¢vÆöærrÂÖöçFƒ¢vÆöærrÂF“¢vçVÖW&–2rÂ–V#¢vçVÖW&–2wÒ“°Ğ¢–b†VÂæF•'VÆW"’VÂæF•'VÆW"æ–ææW$…DÔÂÒ–ÆÄf÷"†F’ÂF’ææÖR²rF’r“°Ğ¢VÂæF•'VÆW$ÖWFçFW‡D6öçFVçBÒrs°Ğ¢VÂç7VåF–ÖW2çFW‡D6öçFVçBÒt'&–v‡B†÷W'2&Rg&öÒ7Vç&—6RBr²f×D„ÕFW‡B†g&ÖRç7Vç&—6R’²rFò7Vç6WBBr²f×D„ÕFW‡B†g&ÖRç7Vç6WB’²rÂföÆÆ÷vVB'’F&²†÷W'2VçF–ÂæW‡B7Vç&—6RBr²f×D„ÕFW‡B†g&ÖRæVæB“°Ğ¢VÂæ'&–FvT–æfòçFW‡D6öçFVçBÒrs°Ğ¢6öç7BFFT¶W”f÷$ÆVFvW"ÒFFT–çWEfÇVTf÷"†g&ÖRæÆö6Äæ÷rÂ7FFRçG¢“°Ğ¢6öç7B6·”FFUF–ÖRÒFFT¶W”f÷$ÆVFvW"²uBr²F–ÖT–çWEfÇVTf÷"†g&ÖRæÆö6Äæ÷rÂ7FFRçG¢“°Ğ¢–b†VÂæFFTf–VÆDÆ–æ²’°Ğ¢6öç7B6·•&×2ÒæWrU$Å6V&6…&×2‡°Ğ¢&Wf–Ws¢w#SRrÀĞ¢6÷W&6S¢wÆæWF'’Ö†÷W'2rÀĞ¢FFWF–ÖS¢6·”FFUF–ÖRÀĞ¢ÆC¢7G&–ær‡7FFRæÆB’ÀĞ¢Æöã¢7G&–ær‡7FFRæÆöâ’ÀĞ¢G£¢7FFRçG¢ÇÂrrÀĞ¢Æö3¢7FFRæÆö6F–öäæÖRÇÂrrÀĞ¢6Æ3¢srÀĞ¢æÖS¢uÆæWF'’†÷W'2r²6·”FFUF–ÖRç&WÆ6R‚uBrÂrrĞ¢Ò“°Ğ¢VÂæFFTf–VÆDÆ–æ²æ‡&VbÒw6·’Ö6†'Bæ‡FÖÃòr²6·•&×2çFõ7G&–ær‚’²r76·’Ö6Æ2s°Ğ¢ĞĞ¢–b†VÂçF÷†÷W%'VÆW"bb7W"’VÂçF÷†÷W%'VÆW"æ–ææW$…DÔÂÒ–ÆÄf÷"†7W"ç'VÆW"Â7W"ç'VÆW"ææÖR²r†÷W"r“°Ğ¢–b†VÂçF÷†÷W%F–ÖRbb7W"’VÂçF÷†÷W%F–ÖRçFW‡D6öçFVçBÒf×D„Ò†7W"ç7F'B’²~(	2r²f×D„Ò†7W"æVæB’²r(
"r²†7W"æ—4'&–v‡Bòt'&–v‡Br¢tF&²r’²r†÷W"r²7W"æ–æFWƒ°Ğ¢–b†VÂçF÷†÷W$fö7W2bb7W"’VÂçF÷†÷W$fö7W2çFW‡D6öçFVçBÒ6öçFW‡Dfö7W2†F’Â7W"ç'VÆW"“°Ğ¢–b†VÂçF÷†÷W$§V×bb7W"’6WD†÷W$§V×†VÂçF÷†÷W$§V×Â7W"“°Ğ¢6öç7B&WdF”¶W”f÷$7VRÒvVV¶F•Fõ'VÆW%²‡'VÆW%FõvVV¶F•¶F”¶W•Ò²b’RuÓ°Ğ¢6öç7BæW‡DF”¶W”f÷$7VRÒvVV¶F•Fõ'VÆW%²‡'VÆW%FõvVV¶F•¶F”¶W•Ò²’RuÓ°Ğ¢–b†VÂç&WdF”7VR’VÂç&WdF”7VRçFW‡D6öçFVçBÒ~(ir²'”¶W•·&WdF”¶W”f÷$7VUÒç7–Ò²rF’s°Ğ¢–b†VÂææW‡DF”7VR’VÂææW‡DF”7VRçFW‡D6öçFVçBÒ'”¶W•¶æW‡DF”¶W”f÷$7VUÒç7–Ò²rF’(i"s°Ğ¢&VæFW$Öööäg&ÖR†g&ÖRæÆö6Äæ÷rÂ7FFRæÆBÂ7FFRæÆöâ“°Ğ¢&VæFW%væFW&W$w&–B†g&ÖR“°Ğ¢ÆWB&WbÒ&÷w5¶–G‚ÒÓ°Ğ¢ÆWBæW‡BÒ&÷w5¶–G‚²Ó°Ğ¢–b‚&Wb’°Ğ¢6öç7B&WdF”¶W’ÒvVV¶F•Fõ'VÆW%²‡'VÆW%FõvVV¶F•¶F”¶W•Ò²b’RuÓ°Ğ¢6öç7B&We7VâÒ6öÆ%F–ÖW2†Æö6Äæööäf÷"†g&ÖRç7F'BÂ7FFRçG¢ÂÓ’Â7FFRæÆBÂ7FFRæÆöâ“°Ğ¢6öç7B&Wdg&ÖRÒ·7F'C¢&We7Vâç7Vç&—6RÂ7Vç&—6S¢&We7Vâç7Vç&—6RÂ7Vç6WC¢&We7Vâç7Vç6WBÂVæC¢g&ÖRç7F'BÂÆö6Äæ÷s¢g&ÖRç7F'GÓ°Ğ¢&WbÒ'V–ÆD†÷W'2‡&Wdg&ÖRÂ&WdF”¶W’•³#5Ó°Ğ¢ĞĞ¢–b‚æW‡B’°Ğ¢6öç7BæW‡DF”¶W’ÒvVV¶F•Fõ'VÆW%²‡'VÆW%FõvVV¶F•¶F”¶W•Ò²’RuÓ°Ğ¢6öç7BæW‡E7VâÒ6öÆ%F–ÖW2†Æö6Äæööäf÷"†g&ÖRç7F'BÂ7FFRçG¢Â’Â7FFRæÆBÂ7FFRæÆöâ“°Ğ¢6öç7BföÆÆ÷v–æu7VâÒ6öÆ%F–ÖW2†Æö6Äæööäf÷"†g&ÖRç7F'BÂ7FFRçG¢Â"’Â7FFRæÆBÂ7FFRæÆöâ“°Ğ¢6öç7BæW‡Dg&ÖRÒ·7F'C¢g&ÖRæVæBÂ7Vç&—6S¢g&ÖRæVæBÂ7Vç6WC¢æW‡E7Vâç7Vç6WBÂVæC¢föÆÆ÷v–æu7Vâç7Vç&—6RÂÆö6Äæ÷s¢g&ÖRæVæGÓ°Ğ¢æW‡BÒ'V–ÆD†÷W'2†æW‡Dg&ÖRÂæW‡DF”¶W’•³Ó°Ğ¢ĞĞ¢6öç7BÖ–çWFW4ÆVgBÒÖ–çWFW4&WGvVVâ†g&ÖRæÆö6Äæ÷rÂ7W"æVæB“°Ğ¢6öç7BÖ–çWFW5F÷FÂÒÖF‚æÖ‚ƒÂÖ–çWFW4&WGvVVâ†7W"ç7F'BÂ7W"æVæB’“°Ğ¢6öç7BF”†÷W'4ÆVgBÒ†÷W'4ÆVgD–äF’†g&ÖRÂg&ÖRæÆö6Äæ÷r“°Ğ¢VÂç&Wd†÷W$6&Bæ–ææW$…DÔÂÒÖ–æ”6&B‚u&Wf–÷W2rÂ&Wb“°Ğ¢VÂæ7W'&VçD†÷W$6&Bæ–ææW$…DÔÂÒÖ–æ”6&B‚t7W'&VçBrÂ7W"“°Ğ¢VÂææW‡D†÷W$6&Bæ–ææW$…DÔÂÒÖ–æ”6&B‚tæW‡BrÂæW‡B“°Ğ¢6WD†÷W$§V×†VÂç&Wd†÷W$6&BÂ&Wb“°Ğ¢6WD†÷W$§V×†VÂæ7W'&VçD†÷W$6&BÂ7W"“°Ğ¢6WD†÷W$§V×†VÂææW‡D†÷W$6&BÂæW‡B“°Ğ¢VÂæÖ–çWFT6÷VçFF÷vâæ–ææW$…DÔÂÒsÇ7â6Æ73Ò'‚Ö6÷VçFF÷vâÖÖ–â#âr²Ö–çWFW4ÆVgB²rÖ–çWFW2ÆVgCÂ÷7ããÇ7â6Æ73Ò'‚Ö6÷VçFF÷vâ×7V"#æöbF†—2r²Ö–çWFW5F÷FÂ²rÖÖ–çWFRr²7W"ç'VÆW"ææÖR²r†÷W#Â÷7ãâs°Ğ¢VÂæ†÷W$ÖWFæ6Æ74æÖRÒw‚Ö7W'&VçBÖÖWFÖÆ–æRs°Ğ¢VÂæ†÷W$ÖWFçFW‡D6öçFVçBÒ†÷W$ÖWFÆ–æR†7W"Â&÷w2“°Ğ¢VÂæ7W'&VçD–çFW'&WFF–öâæ–ææW$…DÔÂÒ6ö×7D†÷W$–çFW'&WFF–öâ†F’Â7W"Â&÷w2“°Ğ¢VÂæF”6÷VçFF÷vâçFW‡D6öçFVçBÒF”†÷W'4ÆVgB²r†÷W'2ÆVgB–âF†—2ÆæWF'’F’s°Ğ¢VÂæÆVvVæD6†—2æ–ææW$…DÔÂÒ–ÆÄf÷"†7W"ç'VÆW"Ât†÷W#¢r²7W"ç'VÆW"æfö7W4†÷W"“°Ğ¢VÂæÆ&Å7F'BçFW‡D6öçFVçBÒf×D„Ò†g&ÖRç7F'B“°Ğ¢–b†VÂæÆ&Å7Vç6WB’VÂæÆ&Å7Vç6WBçFW‡D6öçFVçBÒu7Vç6WBr²f×D„Ò†g&ÖRç7Vç6WB“°Ğ¢VÂæÆ&ÄVæBçFW‡D6öçFVçBÒf×D„Ò†g&ÖRæVæB“°Ğ Ğ¢&VæFW$æ–ÖFVD†WFw&Ò†g&ÖRÂ&÷w2ÂF”¶W’Â–G‚“°Ğ¢&VæFW%F–6¶W"†g&ÖRÂ&÷w2“°Ğ¢&VæFW$†÷W'5F&ÆR‡&÷w2ÂF”¶W’Â–G‚“°Ğ¢&VæFW%6·”÷&–VçFF–öâ‡G'VR“°Ğ¢7–æ4†6‚‚“°Ğ Ğ¢ĞĞ Ğ¢gVæ7F–öâ&–æDWfVçG2‚’°Ğ¢VÂçW6TvVòæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°Ğ¢–b‚æf–vF÷"ævVöÆö6F–öâ’²6ÖÆÄV6†ò‚tvVöÆö6F–öâ—2Væf–Æ&ÆRâr“²&WGW&ã²ĞĞ¢æf–vF÷"ævVöÆö6F–öâævWD7W'&VçE÷6—F–öâ†gVæ7F–öâ‡÷2’°Ğ¢7FFRæÆBÒ÷2æ6ö÷&G2æÆF—GVFS°Ğ¢7FFRæÆöâÒ÷2æ6ö÷&G2æÆöæv—GVFS°Ğ¢7FFRæÆö6F–öäæÖRÒt7W'&VçB'&÷w6W"Æö6F–öâs°Ğ¢6öç7B'&÷w6W%G¢Ò–çFÂäFFUF–ÖTf÷&ÖB‚’ç&W6öÇfVD÷F–öç2‚’çF–ÖU¦öæS°Ğ¢–b†'&÷w6W%G¢’²7FFRçG¢Ò'&÷w6W%G£²VÂçG¥6VÆV7BçfÇVRÒ7FFRçG£²ĞĞ¢VÂæÆBçfÇVRÒ7FFRæÆBçFôf—†VBƒB“°Ğ¢VÂæÆöâçfÇVRÒ7FFRæÆöâçFôf—†VBƒB“°Ğ¢VÂæÆö6F–öå6V&6‚çfÇVRÒrs°Ğ¢VÂæÆö6F–öäæ÷FRçFW‡D6öçFVçBÒt7W'&VçBÆö6F–öâ6VÆV7FVC²F–ÖW¦öæR6WBg&öÒF†—2'&÷w6W"âs°Ğ¢&V'V–ÆB‚“°Ğ¢ÒÂgVæ7F–öâ‚’²6ÖÆÄV6†ò‚tvVöÆö6F–öâf–ÆVBâr“²Ò“°Ğ¢Ò“°Ğ¢VÂç6WDÆDÆöâæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²7FFRæÆö6F–öäæÖRÒtÖçVÂ6ö÷&F–æFW2s²VÂæÆö6F–öäæ÷FRçFW‡D6öçFVçBÒtÖçVÂ6ö÷&F–æFW2&R7F—fRâ¶VWF–ÖW¦öæR—&VBv—F‚F†R–çFVæFVBÆ6Râs²&V'V–ÆB‚“²Ò“°Ğ¢VÂæÇ”Æö6F–öâæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²Ç”Æö6F–öå&W6WB†ÖF6„Æö6F–öâ†VÂæÆö6F–öå6V&6‚çfÇVR’“²Ò“°Ğ¢VÂæÆö6F–öå6V&6‚æFDWfVçDÆ—7FVæW"‚v6†ævRrÂgVæ7F–öâ‚’²6öç7BÆö2ÒÖF6„Æö6F–öâ†VÂæÆö6F–öå6V&6‚çfÇVR“²–b†Æö2’Ç”Æö6F–öå&W6WB†Æö2“²Ò“°Ğ¢VÂçG¥6VÆV7BæFDWfVçDÆ—7FVæW"‚v6†ævRrÂgVæ7F–öâ‚’²VÂæÆö6F–öäæ÷FRæ–ææW$…DÔÂÒsÇ7â6Æ73Ò'‚×v&æ–ær#åF–ÖW¦öæR6†ævVB6W&FVÇ’g&öÒF†R6VÆV7FVBÆö6F–öââ6†V6²F†B—B7F–ÆÂÖF6†W2F†R–çFVæFVBÆ6RãÂ÷7ãâs²&V'V–ÆB‚“²Ò“°Ğ¢VÂçW6U7—7FVÒæFDWfVçDÆ—7FVæW"‚v6†ævRrÂgVæ7F–öâ‚’°Ğ¢7FFRçW6U7—7FVÒÒVÂçW6U7—7FVÒæ6†V6¶VC°Ğ¢VÂæÖçVÅF–ÖRç7G–ÆRæF—7Æ’Òv–æÆ–æRÖfÆW‚s²–b†VÂæFFU–6²’VÂæFFU–6²æF—6&ÆVBÒ7FFRçW6U7—7FVÓ²–b†VÂçF–ÖU–6²’VÂçF–ÖU–6²æF—6&ÆVBÒ7FFRçW6U7—7FVÓ°Ğ¢&V'V–ÆB‚“°Ğ¢Ò“°Ğ¢VÂæÇ”EBæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°Ğ¢–b†VÂæFFU–6²çfÇVRbbVÂçF–ÖU–6²çfÇVR’°Ğ¢6WDÖçVÄFFTg&öÔ–çWG2‚“°Ğ¢&V'V–ÆB‚“°Ğ¢ĞĞ¢Ò“°Ğ¢VÂæ6÷’æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°Ğ¢6öç7BW&ÂÒÆö6F–öâæ‡&Vc°Ğ¢–b†æf–vF÷"æ6Æ—&ö&Bbbæf–vF÷"æ6Æ—&ö&Bçw&—FUFW‡B’°Ğ¢æf–vF÷"æ6Æ—&ö&Bçw&—FUFW‡B‡W&Â’çF†Vâ†gVæ7F–öâ‚’²VÂæ6÷’çFW‡D6öçFVçBÒt6÷–VBs²6WEF–ÖV÷WB†gVæ7F–öâ‚’²VÂæ6÷’çFW‡D6öçFVçBÒt6÷’Æ–æ²s²ÒÂ#“²Ò“°Ğ¢ĞĞ¢Ò“°Ğ¢–b†VÂçF–ÖTf÷&ÖEFövvÆR’VÂçF–ÖTf÷&ÖEFövvÆRæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²7FFRçF–ÖTf÷&ÖBÒ7FFRçF–ÖTf÷&ÖBÓÓÒs#F‚ròs&‚r¢s#F‚s²&V'V–ÆB‚“²Ò“°Ğ¢–b†VÂç'Vå6·•VW'’’VÂç'Vå6·•VW'’æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²&VæFW%6·”÷&–VçFF–öâ‡G'VR“²Ò“°Ğ¢–b†VÂç6·•VW'’’VÂç6·•VW'’æFDWfVçDÆ—7FVæW"‚v¶W–F÷vârÂgVæ7F–öâ†WfVçB’²–b†WfVçBæ¶W’ÓÓÒtVçFW"r’&VæFW%6·”÷&–VçFF–öâ‡G'VR“²Ò“°Ğ¢–b†VÂçvæFW&W$w&–B’VÂçvæFW&W$w&–BæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ†WfVçB’°Ğ¢6öç7B'WGFöâÒWfVçBçF&vWBbbWfVçBçF&vWBæ6Æ÷6W7BòWfVçBçF&vWBæ6Æ÷6W7B‚u¶FF×6·’Ö&öG•Òr’¢çVÆÃ°Ğ¢–b‚'WGFöâ’&WGW&ã°Ğ¢6öç7B&öG’Ò'WGFöâævWDGG&–'WFR‚vFF×6·’Ö&öG’r“°Ğ¢–b‚&öG’’&WGW&ã°Ğ¢7FFRç6·”&öG’Ò&öG“°Ğ¢–b†VÂç6·•VW'’’VÂç6·•VW'’çfÇVRÒuv†W&R—2r²&öG’²r&–v‡Bæ÷sòs°Ğ¢&VæFW%væFW&W$w&–B‚“°Ğ¢&VæFW%6·”÷&–VçFF–öâ‡G'VR“°Ğ¢Ò“°Ğ¢–b†VÂæ†÷W$Ö&·2’VÂæ†÷W$Ö&·2æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ†WfVçB’²6öç7BF&vWBÒWfVçBçF&vWBæ6Æ÷6W7B‚u¶FFÖ†÷W"Ö§V×Òr“²–b‡F&vWB’67&öÆÅFô†÷W"„çVÖ&W"‡F&vWBæFF6WBæ†÷W$§V×’“²Ò“°Ğ¢¶VÂç&Wd†÷W$6&BÂVÂæ7W'&VçD†÷W$6&BÂVÂææW‡D†÷W$6&BÂVÂçF÷†÷W$§V×Òæf÷$V6‚†gVæ7F–öâ†'WGFöâ’°Ğ¢–b‚'WGFöâ’&WGW&ã°Ğ¢'WGFöâæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²–b†'WGFöâæFF6WBæ†÷W$§V×’67&öÆÅFô†÷W"„çVÖ&W"†'WGFöâæFF6WBæ†÷W$§V×’“²Ò“°Ğ¢Ò“°Ğ Ğ¢gVæ7F–öâ6†–gDÖçVÄF’†FVÇFÂ†÷W$÷fW'&–FR’°Ğ¢6öç7B&6RÒ7FFRçW6U7—7FVÒòÆö6Äæ÷r‚’¢æWrFFR‡7FFRææ÷r“°Ğ¢7FFRçW6U7—7FVÒÒfÇ6S°Ğ¢7FFRææ÷rÒFDF—2†&6RÂFVÇF“°Ğ¢7FFRæ†WFw&Ô†÷W$÷fW'&–FRÒ†÷W$÷fW'&–FRÓÒçVÆÂòçVÆÂ¢†÷W$÷fW'&–FS°Ğ¢–b†VÂçW6U7—7FVÒ’VÂçW6U7—7FVÒæ6†V6¶VBÒfÇ6S°Ğ¢–b†VÂæÖçVÅF–ÖR’²VÂæÖçVÅF–ÖRç7G–ÆRæF—7Æ’Òv–æÆ–æRÖfÆW‚s²–b†VÂæFFU–6²’VÂæFFU–6²æF—6&ÆVBÒfÇ6S²–b†VÂçF–ÖU–6²’VÂçF–ÖU–6²æF—6&ÆVBÒfÇ6S²ĞĞ¢–b†VÂæFFU–6²’VÂæFFU–6²çfÇVRÒFFT–çWEfÇVTf÷"‡7FFRææ÷rÂ7FFRçG¢“°Ğ¢–b†VÂçF–ÖU–6²’VÂçF–ÖU–6²çfÇVRÒF–ÖT–çWEfÇVTf÷"‡7FFRææ÷rÂ7FFRçG¢“°Ğ¢&V'V–ÆB‚“°Ğ¢ĞĞ¢–b†VÂç&WdF”7VR’VÂç&WdF”7VRæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²6†–gDÖçVÄF’‚Ó“²Ò“°Ğ¢–b†VÂææW‡DF”7VR’VÂææW‡DF”7VRæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²6†–gDÖçVÄF’ƒ“²Ò“°Ğ¢–b†VÂæ†WFw&Ô†÷W"’VÂæ†WFw&Ô†÷W"æFDWfVçDÆ—7FVæW"‚v–çWBrÂgVæ7F–öâ‚’²7FFRæ†WFw&Ô†÷W$÷fW'&–FRÒçVÖ&W"†VÂæ†WFw&Ô†÷W"çfÇVR’ÇÂçVÆÃ²&V'V–ÆB‚“²Ò“°Ğ¢–b†VÂæ†WFw&Õ&Wb’VÂæ†WFw&Õ&WbæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°Ğ¢6öç7B7W'&VçBÒ7FFRæ†WFw&Ô†÷W$÷fW'&–FRÇÂçVÖ&W"†VÂæ†WFw&Ô†÷W"bbVÂæ†WFw&Ô†÷W"çfÇVR’ÇÂ°Ğ¢–b†7W'&VçBÃÒ’²6†–gDÖçVÄF’‚ÓÂ#B“²ĞĞ¢VÇ6R²7FFRæ†WFw&Ô†÷W$÷fW'&–FRÒÖF‚æÖ‚ƒÂ7W'&VçBÒ“²&V'V–ÆB‚“²ĞĞ¢Ò“°Ğ¢–b†VÂæ†WFw&ÔæW‡B’VÂæ†WFw&ÔæW‡BæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°Ğ¢6öç7B7W'&VçBÒ7FFRæ†WFw&Ô†÷W$÷fW'&–FRÇÂçVÖ&W"†VÂæ†WFw&Ô†÷W"bbVÂæ†WFw&Ô†÷W"çfÇVR’ÇÂ°Ğ¢–b†7W'&VçBãÒ#B’²6†–gDÖçVÄF’ƒÂ“²ĞĞ¢VÇ6R²7FFRæ†WFw&Ô†÷W$÷fW'&–FRÒÖF‚æÖ–âƒ#BÂ7W'&VçB²“²&V'V–ÆB‚“²ĞĞ¢Ò“°Ğ¢–b†VÂæ†WFw&Ôæ÷r’VÂæ†WFw&Ôæ÷ræFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²7FFRæ†WFw&Ô†÷W$÷fW'&–FRÒçVÆÃ²7FFRçW6U7—7FVÒÒG'VS²–b†VÂçW6U7—7FVÒ’VÂçW6U7—7FVÒæ6†V6¶VBÒG'VS²–b†VÂæÖçVÅF–ÖR’²VÂæÖçVÅF–ÖRç7G–ÆRæF—7Æ’Òv–æÆ–æRÖfÆW‚s²–b†VÂæFFU–6²’VÂæFFU–6²æF—6&ÆVBÒG'VS²–b†VÂçF–ÖU–6²’VÂçF–ÖU–6²æF—6&ÆVBÒG'VS²Ò&V'V–ÆB‚“²Ò“°Ğ¢v–æF÷ræFDWfVçDÆ—7FVæW"‚w&W6—¦RrÂ&V'V–ÆB“°Ğ¢ĞĞ Ğ¢gVæ7F–öâ–æ—B‚’°Ğ¢&VD†6‚‚“°Ğ¢÷VÆFUF–ÖW¦öæW2‚“°Ğ¢÷VÆFTÆö6F–öç2‚“°Ğ¢VÂæÆö6F–öå6V&6‚çfÇVRÒ7FFRæÆö6F–öäæÖRÇÂrs°Ğ¢VÂæÆBçfÇVRÒ7FFRæÆBçFôf—†VBƒB“°Ğ¢VÂæÆöâçfÇVRÒ7FFRæÆöâçFôf—†VBƒB“°Ğ¢VÂçW6U7—7FVÒæ6†V6¶VBÒ7FFRçW6U7—7FVÓ°Ğ¢VÂæÖçVÅF–ÖRç7G–ÆRæF—7Æ’Òv–æÆ–æRÖfÆW‚s²–b†VÂæFFU–6²’VÂæFFU–6²æF—6&ÆVBÒ7FFRçW6U7—7FVÓ²–b†VÂçF–ÖU–6²’VÂçF–ÖU–6²æF—6&ÆVBÒ7FFRçW6U7—7FVÓ°Ğ¢6öç7Bæ÷rÒÆö6Äæ÷r‚“°Ğ¢VÂæFFU–6²çfÇVRÒFFT–çWEfÇVTf÷"†æ÷rÂ7FFRçG¢“°Ğ¢VÂçF–ÖU–6²çfÇVRÒF–ÖT–çWEfÇVTf÷"†æ÷rÂ7FFRçG¢“°Ğ¢&–æDWfVçG2‚“°Ğ¢F–6´Æö6Ä6Æö6²‚“°Ğ¢6WD–çFW'fÂ‡F–6´Æö6Ä6Æö6²ÂS“°Ğ¢6WD–çFW'fÂ†gVæ7F–öâ‚’²–b‡7FFRçW6U7—7FVÒ’&V'V–ÆB‚“²ÒÂc“°Ğ¢&V'V–ÆB‚“°Ğ¢ĞĞ Ğ¢–æ—B‚“°Ğ§Ò’‚“°Ğ