// Part 2 gate 1: Where-first Sky card editor, calculation, persistence, and Planetary Hours handoff.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyWhereWhenV1) return;
  window.__relphiSkyWhereWhenV1 = true;

  const SLOT_KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const VIEW_KEY = 'relphiSkyWhereWhenViewV1';
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const BODIES = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const SLOW_BODIES = ['Sun','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const CHALDEAN = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const WEEK_PATH = ['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
  const WEEKDAY_RULERS = { 1:'moon', 2:'mars', 3:'mercury', 4:'jupiter', 5:'venus', 6:'saturn', 7:'sun' };
  const PLANETS = {
    saturn:{ name:'Saturn', color:'#8c7a42' },
    jupiter:{ name:'Jupiter', color:'#41752f' },
    mars:{ name:'Mars', color:'#c9211e' },
    sun:{ name:'Sun', color:'#d08a00' },
    venus:{ name:'Venus', color:'#b23b79' },
    mercury:{ name:'Mercury', color:'#277390' },
    moon:{ name:'Moon', color:'#58628a' }
  };

  const cardState = {
    A:{ mode:'', query:'', selected:null, inference:null, busy:false },
    B:{ mode:'', query:'', selected:null, inference:null, busy:false }
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readViewState() {
    try {
      const value = JSON.parse(sessionStorage.getItem(VIEW_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (_) {
      return {};
    }
  }

  function writeViewState(slot, mode) {
    const value = readViewState();
    value[slot] = mode;
    try { sessionStorage.setItem(VIEW_KEY, JSON.stringify(value)); } catch (_) {}
  }

  function payload(slot) {
    return readJson(SLOT_KEYS[slot], null);
  }

  function norm(value) {
    return ((Number(value) % 360) + 360) % 360;
  }

  function signedLongitude(value) {
    const n = norm(value);
    return n > 180 ? n - 360 : n;
  }

  function angularDistance(a, b) {
    return Math.abs(((Number(a) - Number(b) + 180) % 360 + 360) % 360 - 180);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    })[character]);
  }

  function canonicalName(result) {
    return [result.name, result.admin1, result.country]
      .map(value => String(value || '').trim())
      .filter((value, index, list) => value && list.indexOf(value) === index)
      .join(', ');
  }

  function displayCoordinate(value) {
    return Number.isFinite(Number(value)) ? Number(value).toFixed(5) : '';
  }

  function completeProfile(profile) {
    return !!(
      profile &&
      profile.dateTime &&
      profile.location &&
      profile.timeZone &&
      Number.isFinite(Number(profile.latitude)) &&
      Number.isFinite(Number(profile.longitude))
    );
  }

  function profileFor(slot) {
    const value = payload(slot);
    return value && value.calcProfile && typeof value.calcProfile === 'object'
      ? value.calcProfile
      : {};
  }

  function placementEntries(value) {
    const source = value && (value.placements || value.positions || value.points || value.bodies || value);
    if (!source || typeof source !== 'object') return [];
    return Object.entries(source).filter(([, item]) => item && typeof item === 'object' && !Array.isArray(item));
  }

  function itemLongitude(item) {
    if (Number.isFinite(Number(item && item.longitude))) return norm(item.longitude);
    const signName = String(item && (item.sign || item.zodiac) || '').trim().toLowerCase();
    const signIndex = SIGNS.findIndex(sign => sign.toLowerCase() === signName);
    if (signIndex < 0) return NaN;
    return norm(
      signIndex * 30 +
      Number(item.degree || item.degrees || 0) +
      Number(item.minute || item.minutes || 0) / 60 +
      Number(item.second || item.seconds || 0) / 3600
    );
  }

  function placementMap(value) {
    const result = new Map();
    placementEntries(value).forEach(([key, item]) => {
      const name = String(item.name || item.label || item.body || item.planet || key).trim();
      const longitude = itemLongitude(item);
      if (Number.isFinite(longitude)) {
        result.set(name.toLowerCase().replace(/\s+/g, ''), { name, longitude, item });
      }
    });
    return result;
  }

  function findPlacement(map, names) {
    for (const name of names) {
      const normalized = String(name).toLowerCase().replace(/\s+/g, '');
      if (map.has(normalized)) return map.get(normalized);
    }
    return null;
  }

  function panel(slot) {
    return document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
  }

  function body(slot) {
    return panel(slot)?.querySelector('.sky-foundation-body') || null;
  }

  function heading(slot) {
    return panel(slot)?.querySelector('.sky-foundation-heading') || null;
  }

  function status(slot, message, error) {
    const node = panel(slot)?.querySelector('.sky-where-when-status');
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', !!error);
  }

  function setBusy(slot, busy) {
  cardState[slot].busy = !!busy;
  const editor = panel(slot)?.querySelector('.sky-where-when-editor');
  if (!editor) return;
  editor.querySelectorAll('button,input,select').forEach(node => {
    if (node.classList.contains('sky-where-when-cancel')) return;
    node.disabled = !!busy;
  });
}

  function ensureCardStructure(slot) {
    const card = panel(slot);
    const cardBody = body(slot);
    const cardHeading = heading(slot);
    if (!card || !cardBody || !cardHeading) return false;

    let actions = cardHeading.querySelector('.sky-where-when-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'sky-where-when-actions';
      actions.innerHTML = [
        '<button class="sky-where-when-action" type="button" data-ww-action="edit">Where and When</button>',
        '<button class="sky-where-when-action" type="button" data-ww-action="placements">Placements</button>'
      ].join('');
      cardHeading.appendChild(actions);
    }

    let placementView = cardBody.querySelector('.sky-where-when-placement-view');
    if (!placementView) {
      placementView = document.createElement('div');
      placementView.className = 'sky-where-when-placement-view';
      const existing = Array.from(cardBody.childNodes);
      existing.forEach(node => placementView.appendChild(node));
      cardBody.appendChild(placementView);
    }

    let view = cardBody.querySelector('.sky-where-when-view');
    if (!view) {
      view = document.createElement('div');
      view.className = 'sky-where-when-view';
      view.hidden = true;
      cardBody.appendChild(view);
    }

    return true;
  }

  function editorMarkup(slot, profile) {
    const selected = cardState[slot].selected || (completeProfile(profile) ? {
      query:profile.location,
      canonical:profile.location,
      latitude:Number(profile.latitude),
      longitude:Number(profile.longitude),
      timezone:profile.timeZone
    } : null);
    if (selected) cardState[slot].selected = selected;

    const dateTime = String(profile.dateTime || '');
    const date = dateTime.slice(0, 10);
    const time = dateTime.slice(11, 16);
    const disabled = selected ? '' : ' disabled';
    const confirmation = selected ? `
      <div class="sky-location-confirmation">
        <p><strong>You searched:</strong> ${escapeHtml(selected.query || selected.canonical)}</p>
        <p><strong>Location found:</strong> ${escapeHtml(selected.canonical)}</p>
      </div>` : '<div class="sky-location-confirmation" hidden></div>';

    return `
      <form class="sky-where-when-editor" data-slot="${slot}">
        <fieldset class="sky-where-when-section">
          <legend>Where</legend>
          <div class="sky-where-search-row">
            <label class="sky-where-when-label">Search for a location
              <input class="sky-where-when-input" data-ww-field="location-query" type="search" autocomplete="off" value="${escapeHtml(cardState[slot].query || selected?.query || '')}" placeholder="Ex. Malden, Massachusetts">
            </label>
            <button class="sky-where-when-button secondary" type="button" data-ww-action="search-location">Search</button>
          </div>
          <div class="sky-location-results" aria-live="polite"></div>
          ${confirmation}
        </fieldset>

        <fieldset class="sky-where-when-section" data-ww-when${disabled}>
          <legend>When</legend>
          <div class="sky-where-when-grid">
            <label class="sky-where-when-label">Date
              <input class="sky-where-when-input" data-ww-field="date" type="date" value="${escapeHtml(date)}"${disabled}>
            </label>
            <label class="sky-where-when-label">Local time
              <input class="sky-where-when-input" data-ww-field="time" type="time" value="${escapeHtml(time)}"${disabled}>
            </label>
          </div>
        </fieldset>

        <details class="sky-where-when-advanced">
          <summary>Advanced settings</summary>
          <div class="sky-where-when-advanced-body">
            <label class="sky-where-when-label">Time zone
              <input class="sky-where-when-input" data-ww-field="timezone" type="text" readonly value="${escapeHtml(selected?.timezone || profile.timeZone || '')}">
            </label>
            <div class="sky-where-when-coordinate-grid">
              <label class="sky-where-when-label">Latitude
                <input class="sky-where-when-input" data-ww-field="latitude" type="number" step="0.00001" min="-90" max="90" value="${escapeHtml(displayCoordinate(selected?.latitude ?? profile.latitude))}">
              </label>
              <label class="sky-where-when-label">Longitude
                <input class="sky-where-when-input" data-ww-field="longitude" type="number" step="0.00001" min="-180" max="180" value="${escapeHtml(displayCoordinate(selected?.longitude ?? profile.longitude))}">
              </label>
            </div>
            <div class="sky-where-when-inline-actions">
              <button class="sky-where-when-button secondary" type="button" data-ww-action="resolve-coordinates">Resolve Coordinates</button>
              <button class="sky-where-when-button secondary" type="button" data-ww-action="infer">Infer Place and Time from Placements</button>
            </div>
            <div class="sky-inference-card" hidden></div>
          </div>
        </details>

        <p class="sky-where-when-status" aria-live="polite"></p>
        <div class="sky-where-when-footer">
          <button class="sky-where-when-button secondary sky-where-when-cancel" type="button" data-ww-action="cancel">Cancel</button>
          <button class="sky-where-when-button primary" type="submit"${disabled}>Use This Where and When</button>
        </div>
      </form>`;
  }

  function openEditor(slot) {
    if (!ensureCardStructure(slot)) return;
    cardState[slot].mode = 'edit';
    writeViewState(slot, 'edit');
    const cardBody = body(slot);
    const placementView = cardBody.querySelector('.sky-where-when-placement-view');
    const view = cardBody.querySelector('.sky-where-when-view');
    placementView.hidden = true;
    view.hidden = false;
    view.innerHTML = editorMarkup(slot, profileFor(slot));
    view.querySelector('[data-ww-field="location-query"]')?.focus();
  }

  function showPlacements(slot) {
    if (!ensureCardStructure(slot)) return;
    cardState[slot].mode = 'placements';
    writeViewState(slot, 'placements');
    const cardBody = body(slot);
    cardBody.querySelector('.sky-where-when-placement-view').hidden = false;
    const view = cardBody.querySelector('.sky-where-when-view');
    view.hidden = true;
    view.replaceChildren();
  }

  function localDateTimeToInstant(date, time, timeZone) {
    if (!window.luxon?.DateTime) throw new Error('Time-zone conversion is unavailable.');
    const dt = window.luxon.DateTime.fromISO(`${date}T${time}`, { zone:timeZone, setZone:true });
    if (!dt.isValid) throw new Error(dt.invalidExplanation || 'That local date and time is not valid in the selected time zone.');
    return dt;
  }

  function astronomyLongitude(bodyName, date) {
    const A = window.Astronomy;
    if (!A) throw new Error('Astronomy Engine is unavailable.');
    if (bodyName === 'Moon' && typeof A.EclipticGeoMoon === 'function') return norm(A.EclipticGeoMoon(date).lon);
    const vector = A.GeoVector(bodyName, date, true);
    return norm(A.Ecliptic(vector).elon);
  }

  function siderealDegrees(date, longitude) {
    return norm(window.Astronomy.SiderealTime(date) * 15 + Number(longitude || 0));
  }

  function obliquity(date) {
    return Number(window.Astronomy.e_tilt(date).tobl);
  }

  function ascendantLongitude(date, latitude, longitude) {
    const theta = siderealDegrees(date, longitude) * Math.PI / 180;
    const phi = Number(latitude) * Math.PI / 180;
    const epsilon = obliquity(date) * Math.PI / 180;
    return norm(Math.atan2(
      -Math.cos(theta),
      Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon)
    ) * 180 / Math.PI + 180);
  }

  function midheavenLongitude(date, longitude) {
    const theta = siderealDegrees(date, longitude) * Math.PI / 180;
    const epsilon = obliquity(date) * Math.PI / 180;
    return norm(Math.atan2(
      Math.sin(theta),
      Math.cos(theta) * Math.cos(epsilon)
    ) * 180 / Math.PI);
  }

  function placementObject(name, longitude) {
    const value = norm(longitude);
    const signIndex = Math.floor(value / 30);
    const within = value - signIndex * 30;
    const degree = Math.floor(within);
    const minuteFloat = (within - degree) * 60;
    const minute = Math.floor(minuteFloat);
    const second = Math.round((minuteFloat - minute) * 60);
    return {
      name,
      longitude:value,
      sign:SIGNS[signIndex],
      degree,
      minute,
      second
    };
  }

  function calculateSky(slot, selected, date, time) {
    const dt = localDateTimeToInstant(date, time, selected.timezone);
    const instant = dt.toUTC().toJSDate();
    const placements = {};
    BODIES.forEach(name => {
      placements[name] = placementObject(name, astronomyLongitude(name, instant));
    });
    const asc = ascendantLongitude(instant, selected.latitude, selected.longitude);
    const mc = midheavenLongitude(instant, selected.longitude);
    placements.Ascendant = placementObject('Ascendant', asc);
    placements.Midheaven = placementObject('Midheaven', mc);

    const houseSystem = profileFor(slot).houseSystem || 'whole-sign';
    const houses = window.RelphiHouseSystems.calculateCusps({
      system:houseSystem,
      ascendant:asc,
      midheaven:mc,
      siderealDegrees:siderealDegrees(instant, selected.longitude),
      obliquityDegrees:obliquity(instant),
      latitude:selected.latitude
    });

    const existing = payload(slot) || {};
    return {
      ...existing,
      name:existing.name || `Sky ${slot}`,
      placements,
      houseCusps:houses.cusps,
      calcProfile:{
        ...(existing.calcProfile || {}),
        dateTime:`${date}T${time}`,
        instant:dt.toUTC().toISO(),
        latitude:String(selected.latitude),
        longitude:String(selected.longitude),
        location:selected.canonical,
        locationQuery:selected.query || selected.canonical,
        timeZone:selected.timezone,
        houseSystem,
        source:'where-when-v1'
      },
      savedAt:new Date().toISOString()
    };
  }

  function dispatchSlotChange(slot) {
    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key:SLOT_KEYS[slot],
        newValue:localStorage.getItem(SLOT_KEYS[slot]),
        storageArea:localStorage
      }));
    } catch (_) {
      const event = new Event('storage');
      Object.defineProperty(event, 'key', { value:SLOT_KEYS[slot] });
      window.dispatchEvent(event);
    }
  }

  async function searchLocation(slot) {
    const card = panel(slot);
    const input = card?.querySelector('[data-ww-field="location-query"]');
    const resultsNode = card?.querySelector('.sky-location-results');
    const query = input?.value.trim() || '';
    cardState[slot].query = query;
    if (!query) {
      status(slot, 'Type a location first.', true);
      input?.focus();
      return;
    }
    status(slot, `Searching for ${query}…`);
    resultsNode.replaceChildren();

    try {
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.searchParams.set('name', query);
      url.searchParams.set('count', '7');
      url.searchParams.set('language', 'en');
      url.searchParams.set('format', 'json');
      const response = await fetch(url.toString(), { headers:{ Accept:'application/json' } });
      if (!response.ok) throw new Error(`Location search returned ${response.status}.`);
      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : [];
      if (!results.length) {
        status(slot, 'No matching location was found. Try a city plus state, region, or country.', true);
        return;
      }
      const fragment = document.createDocumentFragment();
      results.forEach((result, index) => {
        const canonical = canonicalName(result);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sky-location-result';
        button.dataset.wwAction = 'select-location';
        button.dataset.locationIndex = String(index);
        button.innerHTML = `<strong>${escapeHtml(canonical)}</strong><span>${displayCoordinate(result.latitude)}, ${displayCoordinate(result.longitude)} · ${escapeHtml(result.timezone || 'Time zone unavailable')}</span>`;
        button.__locationPacket = {
          query,
          canonical,
          latitude:Number(result.latitude),
          longitude:Number(result.longitude),
          timezone:String(result.timezone || '')
        };
        fragment.appendChild(button);
      });
      resultsNode.appendChild(fragment);
      status(slot, 'Choose the canonical location that matches what you meant.');
    } catch (error) {
      status(slot, error.message || 'Location search failed.', true);
    }
  }

  function selectLocation(slot, button) {
    const packet = button && button.__locationPacket;
    if (!packet || !Number.isFinite(packet.latitude) || !Number.isFinite(packet.longitude) || !packet.timezone) {
      status(slot, 'That result did not include a complete coordinate and time-zone packet.', true);
      return;
    }
    cardState[slot].selected = packet;
    const card = panel(slot);
    card.querySelector('.sky-location-results').replaceChildren();
    const confirmation = card.querySelector('.sky-location-confirmation');
    confirmation.hidden = false;
    confirmation.innerHTML = `
      <p><strong>You searched:</strong> ${escapeHtml(packet.query)}</p>
      <p><strong>Location found:</strong> ${escapeHtml(packet.canonical)}</p>`;
    card.querySelector('[data-ww-field="timezone"]').value = packet.timezone;
    card.querySelector('[data-ww-field="latitude"]').value = displayCoordinate(packet.latitude);
    card.querySelector('[data-ww-field="longitude"]').value = displayCoordinate(packet.longitude);
    const when = card.querySelector('[data-ww-when]');
    when.disabled = false;
    when.querySelectorAll('input').forEach(node => { node.disabled = false; });
    card.querySelector('button[type="submit"]').disabled = false;
    status(slot, 'Location confirmed. Enter the local date and time.');
  }

  async function resolveCoordinates(slot) {
    const card = panel(slot);
    const latitude = Number(card?.querySelector('[data-ww-field="latitude"]')?.value);
    const longitude = Number(card?.querySelector('[data-ww-field="longitude"]')?.value);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      status(slot, 'Enter valid latitude and longitude values.', true);
      return;
    }
    status(slot, 'Resolving the canonical place and time zone…');
    try {
      const reverseUrl = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
      reverseUrl.searchParams.set('latitude', String(latitude));
      reverseUrl.searchParams.set('longitude', String(longitude));
      reverseUrl.searchParams.set('localityLanguage', 'en');
      const zoneUrl = new URL('https://api.open-meteo.com/v1/forecast');
      zoneUrl.searchParams.set('latitude', String(latitude));
      zoneUrl.searchParams.set('longitude', String(longitude));
      zoneUrl.searchParams.set('timezone', 'auto');
      zoneUrl.searchParams.set('forecast_days', '1');

      const [reverseResponse, zoneResponse] = await Promise.all([
        fetch(reverseUrl.toString(), { headers:{ Accept:'application/json' } }),
        fetch(zoneUrl.toString(), { headers:{ Accept:'application/json' } })
      ]);
      if (!reverseResponse.ok || !zoneResponse.ok) throw new Error('Coordinate resolution did not return a complete result.');
      const reverse = await reverseResponse.json();
      const zone = await zoneResponse.json();
      const canonical = [
        reverse.locality || reverse.city,
        reverse.principalSubdivision,
        reverse.countryName
      ].map(value => String(value || '').trim()).filter((value, index, list) => value && list.indexOf(value) === index).join(', ');
      const timezone = String(zone.timezone || '');
      if (!canonical || !timezone) throw new Error('Coordinates resolved without a canonical place name or IANA time zone.');

      cardState[slot].selected = {
        query:`${displayCoordinate(latitude)}, ${displayCoordinate(longitude)}`,
        canonical,
        latitude,
        longitude,
        timezone
      };
      cardState[slot].query = cardState[slot].selected.query;
      card.querySelector('[data-ww-field="location-query"]').value = cardState[slot].query;
      selectLocation(slot, { __locationPacket:cardState[slot].selected });
      status(slot, 'Coordinates resolved. Confirm the location, then enter the local date and time.');
    } catch (error) {
      status(slot, error.message || 'Coordinates could not be resolved.', true);
    }
  }

  function weekdayRuler(instant, timeZone) {
    const weekday = window.luxon.DateTime.fromJSDate(instant).setZone(timeZone).weekday;
    return WEEKDAY_RULERS[weekday] || 'sun';
  }

  function solarNoonDate(localDate, timeZone) {
    return window.luxon.DateTime.fromISO(`${localDate}T12:00`, { zone:timeZone }).toJSDate();
  }

  function solarFrame(instant, latitude, longitude, timeZone) {
    if (!window.SunCalc) throw new Error('Sunrise and sunset calculation is unavailable.');
    const local = window.luxon.DateTime.fromJSDate(instant).setZone(timeZone);
    const todayDate = local.toFormat('yyyy-MM-dd');
    const previousDate = local.minus({ days:1 }).toFormat('yyyy-MM-dd');
    const nextDate = local.plus({ days:1 }).toFormat('yyyy-MM-dd');
    const today = SunCalc.getTimes(solarNoonDate(todayDate, timeZone), latitude, longitude);
    const previous = SunCalc.getTimes(solarNoonDate(previousDate, timeZone), latitude, longitude);
    const next = SunCalc.getTimes(solarNoonDate(nextDate, timeZone), latitude, longitude);

    const valid = value => value instanceof Date && !Number.isNaN(value.getTime());
    if (![today.sunrise, today.sunset, previous.sunrise, previous.sunset, next.sunrise].every(valid)) {
      throw new Error('Planetary hours are unavailable for this date or latitude because a complete sunrise-to-sunrise frame could not be calculated.');
    }

    if (instant >= today.sunrise) {
      return { start:today.sunrise, sunrise:today.sunrise, sunset:today.sunset, end:next.sunrise };
    }
    return { start:previous.sunrise, sunrise:previous.sunrise, sunset:previous.sunset, end:today.sunrise };
  }

  function rotateHours(dayKey) {
    const start = CHALDEAN.indexOf(dayKey);
    return Array.from({ length:24 }, (_, index) => CHALDEAN[(start + index) % 7]);
  }

  function planetaryHourRows(frame, dayKey) {
    const sequence = rotateHours(dayKey);
    const daylight = frame.sunset.getTime() - frame.sunrise.getTime();
    const night = frame.end.getTime() - frame.sunset.getTime();
    const brightLength = daylight / 12;
    const darkLength = night / 12;
    return Array.from({ length:24 }, (_, index) => {
      const bright = index < 12;
      const start = bright
        ? frame.sunrise.getTime() + index * brightLength
        : frame.sunset.getTime() + (index - 12) * darkLength;
      const end = start + (bright ? brightLength : darkLength);
      return { index, ruler:sequence[index], start:new Date(start), end:new Date(end), bright };
    });
  }

  function heptagramPoint(key, radius) {
    const index = CHALDEAN.indexOf(key);
    const angle = (-90 + index * (360 / 7)) * Math.PI / 180;
    return { x:180 + Math.cos(angle) * radius, y:180 + Math.sin(angle) * radius };
  }

  function svgElement(name, attrs) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function line(parent, a, b, className) {
    parent.appendChild(svgElement('line', {
      x1:a.x, y1:a.y, x2:b.x, y2:b.y, class:className
    }));
  }

  function partialLine(parent, a, b, fraction, className) {
    const value = Math.max(0, Math.min(1, fraction));
    line(parent, a, {
      x:a.x + (b.x - a.x) * value,
      y:a.y + (b.y - a.y) * value
    }, className);
  }

  async function drawHeptagram(svg, profile) {
    const dt = window.luxon.DateTime.fromISO(profile.instant || profile.dateTime, {
      zone:profile.timeZone,
      setZone:true
    });
    const instant = dt.toUTC().toJSDate();
    const frame = solarFrame(instant, Number(profile.latitude), Number(profile.longitude), profile.timeZone);
    const dayKey = weekdayRuler(frame.start, profile.timeZone);
    const rows = planetaryHourRows(frame, dayKey);
    const currentIndex = Math.max(0, rows.findIndex(row => instant >= row.start && instant < row.end));
    const current = rows[currentIndex] || rows[0];
    const weekIndex = Math.max(0, WEEK_PATH.indexOf(dayKey));
    const dayFraction = Math.max(0, Math.min(1, (instant.getTime() - frame.start.getTime()) / (frame.end.getTime() - frame.start.getTime())));
    const hourFraction = Math.max(0, Math.min(1, (instant.getTime() - current.start.getTime()) / (current.end.getTime() - current.start.getTime())));

    svg.replaceChildren();
    svg.appendChild(svgElement('circle', { cx:180, cy:180, r:118, class:'sky-ph-circle' }));
    svg.appendChild(svgElement('circle', { cx:180, cy:180, r:78, class:'sky-ph-guide' }));

    for (let index = 0; index < 7; index += 1) {
      const from = heptagramPoint(WEEK_PATH[index], 118);
      const to = heptagramPoint(WEEK_PATH[index + 1], 118);
      line(svg, from, to, `sky-ph-week-segment ${index < weekIndex ? 'past' : 'future'}`);
      if (index === weekIndex) partialLine(svg, from, to, dayFraction, 'sky-ph-week-segment current');
    }

    const hourPoints = rows.map((row, index) => {
      const key = row.ruler;
      const base = heptagramPoint(key, 78);
      const next = heptagramPoint(rows[(index + 1) % rows.length].ruler, 78);
      return { row, base, next };
    });
    hourPoints.forEach((entry, index) => {
      line(svg, entry.base, entry.next, `sky-ph-hour-segment ${index < currentIndex ? 'past' : 'future'}`);
      if (index === currentIndex) partialLine(svg, entry.base, entry.next, hourFraction, 'sky-ph-hour-segment current');
    });

    const glyphJobs = [];
    CHALDEAN.forEach(key => {
      const point = heptagramPoint(key, 118);
      const labelPoint = heptagramPoint(key, 151);
      const group = svgElement('g', { class:`sky-ph-planet sky-ph-${key}`, style:`color:${PLANETS[key].color}` });
      const circle = svgElement('circle', {
        cx:point.x,
        cy:point.y,
        r:18,
        class:`sky-ph-node${key === dayKey ? ' day' : ''}${key === current.ruler ? ' hour' : ''}`
      });
      const glyph = svgElement('g', {
        transform:`translate(${point.x} ${point.y})`,
        class:'sky-ph-node-glyph'
      });
      const label = svgElement('text', {
        x:labelPoint.x,
        y:labelPoint.y,
        class:'sky-ph-node-label'
      });
      label.textContent = PLANETS[key].name;
      group.append(circle, glyph, label);
      svg.appendChild(group);
      const entry = window.RelphiGlyphRegistry?.resolve(key);
      if (entry?.asset && window.RelphiGlyphComponent?.draw) {
        glyphJobs.push(window.RelphiGlyphComponent.draw(glyph, entry.id, {
          radius:13,
          padding:1,
          color:key === current.ruler ? '#fff' : PLANETS[key].color
        }).catch(error => console.error(error)));
      }
    });

    const localFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone:profile.timeZone,
      hour:'numeric',
      minute:'2-digit'
    });
    const centerDay = svgElement('text', { x:180, y:169, class:'sky-ph-center-label' });
    centerDay.textContent = `${PLANETS[dayKey].name} day`;
    const centerHour = svgElement('text', { x:180, y:188, class:'sky-ph-center-label' });
    centerHour.textContent = `${PLANETS[current.ruler].name} hour`;
    const centerTime = svgElement('text', { x:180, y:207, class:'sky-ph-center-label' });
    centerTime.textContent = `${localFormatter.format(current.start)}–${localFormatter.format(current.end)}`;
    svg.append(centerDay, centerHour, centerTime);
    await Promise.allSettled(glyphJobs);

    return {
      dayKey,
      hourKey:current.ruler,
      hourNumber:currentIndex + 1,
      start:current.start,
      end:current.end
    };
  }

  function planetaryHoursUrl(profile) {
  const params = new URLSearchParams();
  const inferredInstant = !profile.instant && profile.dateTime && profile.timeZone && window.luxon?.DateTime
    ? window.luxon.DateTime.fromISO(profile.dateTime, { zone:profile.timeZone, setZone:true }).toUTC().toISO()
    : '';
  const instant = profile.instant || inferredInstant;
    params.set('phShare', '1');
    params.set('lat', String(profile.latitude));
    params.set('lon', String(profile.longitude));
    params.set('tz', profile.timeZone);
    params.set('loc', profile.location);
    params.set('dt', instant || '');
    return `planetaryhours.html#${params.toString()}`;
  }

  async function showConfirmed(slot) {
    if (!ensureCardStructure(slot)) return;
    const profile = profileFor(slot);
    if (!completeProfile(profile)) return showPlacements(slot);

    cardState[slot].mode = 'confirmed';
    writeViewState(slot, 'confirmed');
    const cardBody = body(slot);
    cardBody.querySelector('.sky-where-when-placement-view').hidden = true;
    const view = cardBody.querySelector('.sky-where-when-view');
    view.hidden = false;
    const dateTime = window.luxon.DateTime.fromISO(profile.instant || profile.dateTime, {
      zone:profile.timeZone,
      setZone:true
    }).setZone(profile.timeZone);
    const localText = dateTime.isValid
      ? dateTime.toLocaleString(window.luxon.DateTime.DATETIME_MED_WITH_WEEKDAY)
      : profile.dateTime;
    view.innerHTML = `
      <section class="sky-where-when-confirmed">
        <div class="sky-where-when-facts">
          <p><strong>Where:</strong> ${escapeHtml(profile.location)}</p>
          <p><strong>When:</strong> ${escapeHtml(localText)}</p>
        </div>
        <a class="sky-ph-jump" href="${escapeHtml(planetaryHoursUrl(profile))}">
          <span class="sky-ph-jump-title">Jump to this time in Planetary Hours</span>
          <svg class="sky-ph-heptagram" viewBox="0 0 360 360" role="img" aria-label="Planetary Hours heptagram for this Sky card"></svg>
          <p class="sky-ph-summary">Calculating the planetary day and hour…</p>
        </a>
      </section>`;

    const svg = view.querySelector('.sky-ph-heptagram');
    const summary = view.querySelector('.sky-ph-summary');
    try {
      const result = await drawHeptagram(svg, profile);
      summary.textContent = `${PLANETS[result.dayKey].name} day · planetary hour ${result.hourNumber} · ${PLANETS[result.hourKey].name} hour`;
    } catch (error) {
      summary.textContent = error.message || 'The Planetary Hours heptagram could not be calculated.';
      console.error(error);
    }
  }

  function inferenceCard(slot, result) {
    const card = panel(slot);
    const node = card?.querySelector('.sky-inference-card');
    if (!node) return;
    cardState[slot].inference = result;
    node.hidden = false;
    node.innerHTML = `
      <p><strong>Estimated where:</strong> ${escapeHtml(result.canonical || `${displayCoordinate(result.latitude)}, ${displayCoordinate(result.longitude)}`)}</p>
      <p><strong>Estimated when:</strong> ${escapeHtml(result.dateTime || 'Unavailable')}</p>
      <p><strong>Time zone:</strong> ${escapeHtml(result.timezone || 'UTC')}</p>
      <p><strong>Confidence:</strong> ${escapeHtml(result.confidence)}</p>
      <button class="sky-where-when-button secondary" type="button" data-ww-action="apply-inference">Apply inference</button>`;
  }

  function extractRecoveredInference(slot) {
    const value = payload(slot);
    const profile = profileFor(slot);
    if (completeProfile(profile)) {
      return {
        query:profile.locationQuery || profile.location,
        canonical:profile.location,
        latitude:Number(profile.latitude),
        longitude:Number(profile.longitude),
        timezone:profile.timeZone,
        dateTime:profile.dateTime,
        confidence:'High — recovered from the saved Sky record.'
      };
    }

    const notes = String(value?.notes || '');
    const instantMatch = notes.match(/Motion state sampled around\s+(\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?Z)/i);
    const coordinates = notes.match(/latitude\s+(-?\d+(?:\.\d+)?)\s+and longitude\s+(-?\d+(?:\.\d+)?)/i);
    const timezone = notes.match(/Time zone:\s*([^\.]+)\./i)?.[1]?.trim() || '';
    const location = notes.match(/Location:\s*(.+?)\.\s*Time zone:/i)?.[1]?.trim() || '';
    if (instantMatch && coordinates) {
      const instant = new Date(instantMatch[1]);
      const zone = timezone || 'UTC';
      const dt = window.luxon.DateTime.fromJSDate(instant).setZone(zone);
      return {
        query:location || 'Recovered coordinates',
        canonical:location || `${coordinates[1]}, ${coordinates[2]}`,
        latitude:Number(coordinates[1]),
        longitude:Number(coordinates[2]),
        timezone:zone,
        dateTime:dt.toFormat("yyyy-MM-dd'T'HH:mm"),
        confidence:'Medium — recovered from calculation notes.'
      };
    }
    return null;
  }

  async function inferDateFromPlacements(slot) {
    const value = payload(slot);
    const map = placementMap(value);
    const sun = findPlacement(map, ['Sun']);
    const usable = SLOW_BODIES.map(name => findPlacement(map, [name])).filter(Boolean);
    if (!sun || usable.length < 3) throw new Error('Inference needs the Sun and at least two slower planetary placements.');

    const yearNow = new Date().getUTCFullYear();
    const startYear = Math.max(1900, yearNow - 120);
    const endYear = Math.min(2100, yearNow + 20);
    let best = null;
    for (let year = startYear; year <= endYear; year += 1) {
      const marchEquinox = Date.UTC(year, 2, 20, 12, 0, 0);
      const estimate = marchEquinox + (sun.longitude / 0.98564736) * 86400000;
      for (let offset = -4; offset <= 4; offset += 0.5) {
        const date = new Date(estimate + offset * 86400000);
        let score = 0;
        usable.forEach(record => {
          const predicted = astronomyLongitude(record.name, date);
          const weight = record.name === 'Sun' ? 4 : 1;
          score += Math.pow(angularDistance(predicted, record.longitude) * weight, 2);
        });
        if (!best || score < best.score) best = { date, score };
      }
      if ((year - startYear) % 12 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
    }

    const allTargets = BODIES.map(name => findPlacement(map, [name])).filter(Boolean);
    let refined = best;
    for (let hours = -48; hours <= 48; hours += 1) {
      const date = new Date(best.date.getTime() + hours * 3600000);
      let score = 0;
      allTargets.forEach(record => {
        const predicted = astronomyLongitude(record.name, date);
        const weight = record.name === 'Moon' ? 2.5 : record.name === 'Sun' ? 2 : 1;
        score += Math.pow(angularDistance(predicted, record.longitude) * weight, 2);
      });
      if (!refined || score < refined.score) refined = { date, score };
    }

    const asc = findPlacement(map, ['Ascendant','ASC','Rising']);
    const mc = findPlacement(map, ['Midheaven','MC']);
    let latitude = 0;
    let longitude = 0;
    if (mc) {
      const epsilon = obliquity(refined.date);
      let bestLst = { value:0, error:Infinity };
      for (let lst = 0; lst < 360; lst += 0.25) {
        const theta = lst * Math.PI / 180;
        const eps = epsilon * Math.PI / 180;
        const candidate = norm(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) * 180 / Math.PI);
        const error = angularDistance(candidate, mc.longitude);
        if (error < bestLst.error) bestLst = { value:lst, error };
      }
      longitude = signedLongitude(bestLst.value - window.Astronomy.SiderealTime(refined.date) * 15);
      if (asc) {
        let bestLatitude = { value:0, error:Infinity };
        for (let lat = -66; lat <= 66; lat += 0.5) {
          const theta = bestLst.value * Math.PI / 180;
          const phi = lat * Math.PI / 180;
          const eps = epsilon * Math.PI / 180;
          const candidate = norm(Math.atan2(
            -Math.cos(theta),
            Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)
          ) * 180 / Math.PI + 180);
          const error = angularDistance(candidate, asc.longitude);
          if (error < bestLatitude.error) bestLatitude = { value:lat, error };
        }
        latitude = bestLatitude.value;
      }
    }

    const rms = Math.sqrt(refined.score / Math.max(1, allTargets.length));
    return {
      date:refined.date,
      latitude,
      longitude,
      confidence:rms < 4 ? 'Medium — close planetary fit; place remains an estimate.' : 'Low — broad planetary fit only; review before applying.'
    };
  }

  async function reversePacket(latitude, longitude) {
    const reverseUrl = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    reverseUrl.searchParams.set('latitude', String(latitude));
    reverseUrl.searchParams.set('longitude', String(longitude));
    reverseUrl.searchParams.set('localityLanguage', 'en');
    const zoneUrl = new URL('https://api.open-meteo.com/v1/forecast');
    zoneUrl.searchParams.set('latitude', String(latitude));
    zoneUrl.searchParams.set('longitude', String(longitude));
    zoneUrl.searchParams.set('timezone', 'auto');
    zoneUrl.searchParams.set('forecast_days', '1');
    const [reverseResponse, zoneResponse] = await Promise.all([
      fetch(reverseUrl.toString(), { headers:{ Accept:'application/json' } }),
      fetch(zoneUrl.toString(), { headers:{ Accept:'application/json' } })
    ]);
    if (!reverseResponse.ok || !zoneResponse.ok) throw new Error('The estimated coordinates could not be matched to a canonical place.');
    const reverse = await reverseResponse.json();
    const zone = await zoneResponse.json();
    const canonical = [
      reverse.locality || reverse.city,
      reverse.principalSubdivision,
      reverse.countryName
    ].map(value => String(value || '').trim()).filter((value, index, list) => value && list.indexOf(value) === index).join(', ');
    return { canonical, timezone:String(zone.timezone || 'UTC') };
  }

  async function infer(slot) {
    const recovered = extractRecoveredInference(slot);
    if (recovered) {
      inferenceCard(slot, recovered);
      status(slot, 'Recovered a Where and When estimate. Review it before applying.');
      return;
    }

    setBusy(slot, true);
    status(slot, 'Estimating date, time, and place from planetary placements…');
    try {
      const estimate = await inferDateFromPlacements(slot);
      let packet = { canonical:'', timezone:'UTC' };
      try {
        packet = await reversePacket(estimate.latitude, estimate.longitude);
      } catch (_) {}
      const dt = window.luxon.DateTime.fromJSDate(estimate.date).setZone(packet.timezone || 'UTC');
      inferenceCard(slot, {
        query:'Placement inference',
        canonical:packet.canonical || `${displayCoordinate(estimate.latitude)}, ${displayCoordinate(estimate.longitude)}`,
        latitude:estimate.latitude,
        longitude:estimate.longitude,
        timezone:packet.timezone || 'UTC',
        dateTime:dt.toFormat("yyyy-MM-dd'T'HH:mm"),
        confidence:estimate.confidence
      });
      status(slot, 'Inference complete. Nothing changes until you choose Apply inference.');
    } catch (error) {
      status(slot, error.message || 'The placements did not contain enough information for an estimate.', true);
    } finally {
      setBusy(slot, false);
    }
  }

  function applyInference(slot) {
    const result = cardState[slot].inference;
    if (!result) return;
    cardState[slot].selected = {
      query:result.query || 'Placement inference',
      canonical:result.canonical,
      latitude:Number(result.latitude),
      longitude:Number(result.longitude),
      timezone:result.timezone || 'UTC'
    };
    cardState[slot].query = cardState[slot].selected.query;
    const card = panel(slot);
    card.querySelector('[data-ww-field="location-query"]').value = cardState[slot].query;
    card.querySelector('[data-ww-field="timezone"]').value = result.timezone || 'UTC';
    card.querySelector('[data-ww-field="latitude"]').value = displayCoordinate(result.latitude);
    card.querySelector('[data-ww-field="longitude"]').value = displayCoordinate(result.longitude);
    const [date, time] = String(result.dateTime || '').split('T');
    card.querySelector('[data-ww-field="date"]').value = date || '';
    card.querySelector('[data-ww-field="time"]').value = (time || '').slice(0, 5);
    const when = card.querySelector('[data-ww-when]');
    when.disabled = false;
    when.querySelectorAll('input').forEach(node => { node.disabled = false; });
    card.querySelector('button[type="submit"]').disabled = false;
    const confirmation = card.querySelector('.sky-location-confirmation');
    confirmation.hidden = false;
    confirmation.innerHTML = `
      <p><strong>You searched:</strong> ${escapeHtml(cardState[slot].selected.query)}</p>
      <p><strong>Location found:</strong> ${escapeHtml(cardState[slot].selected.canonical)}</p>`;
    status(slot, 'Inference applied to the form. Review it, then confirm.');
  }

  async function submit(slot, form) {
    const selected = cardState[slot].selected;
    const date = form.querySelector('[data-ww-field="date"]')?.value || '';
    const time = form.querySelector('[data-ww-field="time"]')?.value || '';
    if (!selected) return status(slot, 'Choose a canonical location first.', true);
    if (!date || !time) return status(slot, 'Enter both the local date and local time.', true);

    setBusy(slot, true);
    status(slot, 'Calculating placements and Planetary Hours…');
    try {
      const nextPayload = calculateSky(slot, selected, date, time);
      writeJson(SLOT_KEYS[slot], nextPayload);
      writeViewState(slot, 'confirmed');
      dispatchSlotChange(slot);
      status(slot, 'Calculated and saved.');
    } catch (error) {
      setBusy(slot, false);
      status(slot, error.message || 'The Sky could not be calculated.', true);
    }
  }

  function restorePreferredView(slot) {
    if (!ensureCardStructure(slot)) return;
    const preference = readViewState()[slot];
    const profile = profileFor(slot);
    if (preference === 'edit') return openEditor(slot);
    if (preference === 'placements') return showPlacements(slot);
    if (completeProfile(profile)) return showConfirmed(slot);
    return showPlacements(slot);
  }

  function refreshCards() {
    ['A','B'].forEach(slot => {
      cardState[slot].mode = '';
      restorePreferredView(slot);
    });
  }

  function eventSlot(target) {
    return target.closest('#skyFoundationA') ? 'A' : target.closest('#skyFoundationB') ? 'B' : null;
  }

  document.addEventListener('click', event => {
    const actionNode = event.target.closest('[data-ww-action]');
    if (!actionNode) return;
    const slot = eventSlot(actionNode);
    if (!slot) return;
    const action = actionNode.dataset.wwAction;
    if (action === 'edit') openEditor(slot);
    else if (action === 'placements') showPlacements(slot);
    else if (action === 'cancel') {
      if (completeProfile(profileFor(slot))) showConfirmed(slot);
      else showPlacements(slot);
    } else if (action === 'search-location') searchLocation(slot);
    else if (action === 'select-location') selectLocation(slot, actionNode);
    else if (action === 'resolve-coordinates') resolveCoordinates(slot);
    else if (action === 'infer') infer(slot);
    else if (action === 'apply-inference') applyInference(slot);
  });

  document.addEventListener('submit', event => {
    const form = event.target.closest('.sky-where-when-editor');
    if (!form) return;
    event.preventDefault();
    submit(form.dataset.slot, form);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const input = event.target.closest('[data-ww-field="location-query"]');
    if (!input) return;
    event.preventDefault();
    const slot = eventSlot(input);
    if (slot) searchLocation(slot);
  });

  window.addEventListener('relphi:sky-foundation-interactions-ready', refreshCards);
  window.addEventListener('relphi:sky-foundation-ready', () => {
    requestAnimationFrame(refreshCards);
  });

  function start() {
    if (document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy') === 'false') {
      requestAnimationFrame(refreshCards);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();