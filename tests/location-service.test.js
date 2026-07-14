const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createWindow(initial = {}) {
  const values = new Map(Object.entries(initial));
  const events = [];
  const window = {
    localStorage: {
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) { values.set(key, String(value)); }
    },
    navigator: {},
    dispatchEvent(event) { events.push(event); },
    events
  };
  return window;
}

function loadService(window) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'relphi-location-service.js'), 'utf8');
  const context = { window, Intl, Date, Promise, CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } } };
  vm.runInNewContext(source, context, { filename: 'relphi-location-service.js' });
  return window.RelphiLocation;
}

const key = 'relphiPlanetaryHoursWhereWhen';

{
  const service = loadService(createWindow());
  assert.equal(service.read(), null, 'first visit has no implicit location');
}

{
  const service = loadService(createWindow({
    [key]: JSON.stringify({ lat: '51.4769', lon: '-0.0005', tz: 'Europe/London', loc: 'Greenwich demo' })
  }));
  assert.equal(service.read(), null, 'legacy Greenwich demo is not a user location');
}

{
  const window = createWindow();
  const service = loadService(window);
  const saved = service.save({ lat: 42.4251, lon: -71.0662, tz: 'America/New_York', loc: 'Malden, MA', source: 'manual' });
  assert.equal(saved.loc, 'Malden, MA');
  assert.equal(service.read().source, 'manual');
  assert.equal(window.events.at(-1).type, 'relphi:location-changed');
}

{
  const service = loadService(createWindow());
  assert.equal(service.save({ lat: '', lon: '', tz: 'UTC', source: 'manual' }), null, 'blank coordinates are invalid');
  assert.equal(service.save({ lat: 95, lon: 0, tz: 'UTC', source: 'manual' }), null, 'out-of-range coordinates are invalid');
  assert.equal(service.save({ lat: 1, lon: 2, tz: 'Not/AZone', source: 'manual' }), null, 'invalid timezone is rejected');
}

{
  const service = loadService(createWindow());
  const stale = service.beginSelection();
  const current = service.beginSelection();
  assert.equal(service.save({ lat: 10, lon: 20, tz: 'UTC', loc: 'Old result', source: 'geolocation' }, { token: stale }), null);
  assert.equal(service.save({ lat: 30, lon: 40, tz: 'UTC', loc: 'New selection', source: 'manual' }, { token: current }).loc, 'New selection');
  assert.equal(service.read().loc, 'New selection', 'stale async result cannot replace newer selection');
}

(async function geolocationTests() {
  const grantedWindow = createWindow();
  grantedWindow.navigator.geolocation = {
    getCurrentPosition(success) { success({ coords: { latitude: 42.4, longitude: -71.1 } }); }
  };
  const granted = await loadService(grantedWindow).getCurrentPosition();
  assert.equal(granted.coords.latitude, 42.4, 'permission granted returns coordinates');

  const deniedWindow = createWindow();
  deniedWindow.navigator.geolocation = {
    getCurrentPosition(success, failure) { failure({ code: 1 }); }
  };
  const deniedService = loadService(deniedWindow);
  await assert.rejects(deniedService.getCurrentPosition(), error => error.code === 1);
  assert.match(deniedService.errorMessage({ code: 1 }), /Choose a location manually/);

  console.log('location-service tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
