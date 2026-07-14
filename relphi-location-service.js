// Shared location state for Planetary Hours and Sky Chart.
(function (root) {
  'use strict';

  const STORAGE_KEY = 'relphiPlanetaryHoursWhereWhen';
  const GREENWICH = { lat: 51.4769, lon: -0.0005 };
  let selectionGeneration = 0;

  function number(value) {
    if (value == null || String(value).trim() === '') return NaN;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function isValidTimeZone(value) {
    const zone = String(value || '').trim();
    if (!zone) return false;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(new Date());
      return true;
    } catch (error) {
      return false;
    }
  }

  function isGreenwichDemo(value) {
    if (!value || typeof value !== 'object') return false;
    if (value.source === 'demo') return true;
    if (value.source) return false;
    const lat = number(value.lat ?? value.latitude);
    const lon = number(value.lon ?? value.longitude);
    const name = String(value.loc ?? value.location ?? value.locationName ?? '').toLowerCase();
    return Number.isFinite(lat) && Number.isFinite(lon) &&
      Math.abs(lat - GREENWICH.lat) < 0.01 && Math.abs(lon - GREENWICH.lon) < 0.01 &&
      (!name || name.includes('greenwich') || name.includes('demo'));
  }

  function normalize(value) {
    if (!value || typeof value !== 'object') return null;
    const lat = number(value.lat ?? value.latitude);
    const lon = number(value.lon ?? value.longitude);
    const tz = String(value.tz ?? value.timeZone ?? '').trim();
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180 || !isValidTimeZone(tz)) return null;
    if (isGreenwichDemo(value)) return null;
    return {
      ...value,
      lat: String(lat),
      lon: String(lon),
      tz,
      loc: String(value.loc ?? value.location ?? value.locationName ?? '').trim(),
      source: String(value.source || 'legacy'),
      savedAt: value.savedAt || new Date().toISOString()
    };
  }

  function read() {
    try {
      return normalize(JSON.parse(root.localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch (error) {
      return null;
    }
  }

  function beginSelection() {
    selectionGeneration += 1;
    return selectionGeneration;
  }

  function isCurrent(token) {
    return token === selectionGeneration;
  }

  function save(value, options) {
    const token = options && options.token;
    if (token != null && !isCurrent(token)) return null;
    const previous = read() || {};
    const normalized = normalize({ ...previous, ...value, savedAt: new Date().toISOString() });
    if (!normalized) return null;
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      root.dispatchEvent?.(new CustomEvent('relphi:location-changed', { detail: normalized }));
      return normalized;
    } catch (error) {
      return null;
    }
  }

  function getCurrentPosition(options) {
    return new Promise(function (resolve, reject) {
      if (!root.navigator || !root.navigator.geolocation) {
        reject(Object.assign(new Error('Geolocation is unavailable in this browser.'), { code: 0 }));
        return;
      }
      root.navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 15000,
        ...(options || {})
      });
    });
  }

  function errorMessage(error) {
    if (error && error.code === 1) return 'Location permission was denied. Choose a location manually, or allow location access in browser settings and try again.';
    if (error && error.code === 2) return 'Your location is currently unavailable. Choose a location manually.';
    if (error && error.code === 3) return 'The location request timed out. Choose a location manually or try again.';
    return error && error.message ? error.message : 'Location could not be obtained. Choose a location manually.';
  }

  root.RelphiLocation = Object.freeze({
    STORAGE_KEY,
    normalize,
    read,
    save,
    beginSelection,
    isCurrent,
    getCurrentPosition,
    errorMessage,
    isGreenwichDemo
  });
})(window);
