const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const sky = fs.readFileSync(path.join(root, 'sky-chart.html'), 'utf8');
const planetary = fs.readFileSync(path.join(root, 'planetaryhours.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'tarot-app.js'), 'latin1');
const refresh = fs.readFileSync(path.join(root, 'sky-chart-refresh-persistence.js'), 'utf8');

assert.match(sky, /id="skySharedUseLocation"/);
assert.match(sky, /id="skySharedChooseManual"/);
assert.match(sky, /relphi-location-service\.js\?v=1/);
assert.match(planetary, /relphi-location-service\.js\?v=1/);
assert.match(planetary, /state\.locationSource === 'demo'/, 'Greenwich demo is not persisted');
assert.match(planetary, /\.ph-summary-grid-consolidated > \.ph-hour-frame \{ order: 1; \}/);
assert.match(planetary, /\.ph-summary-grid-consolidated > \.ph-day-frame \{ order: 2; \}/);
assert.match(planetary, /\.ph-summary-grid-consolidated > \.ph-moon-frame \{ order: 3; \}/);
assert.match(app, /selectionToken/);
assert.match(app, /showSkyManualLocation\(message\)/, 'denial and timeout reveal manual controls');
assert.match(app, /skyCalcGeo['"]\)\?\.addEventListener\(['"]click['"], captureSkyCalcLocation\)/);
assert.doesNotMatch(app, /addEventListener\(['"]load['"][\s\S]{0,300}getCurrentPosition/, 'Sky Chart does not request permission on load');
assert.match(refresh, /addEventListener\('pagehide', flushSave\)/);
assert.match(refresh, /visibilityState === 'hidden'/);
assert.match(refresh, /setTimeout\(done, 420\)/, 'target switch waits for the 260 ms paste import');
assert.doesNotMatch(refresh, /waitForLibraryOption/, 'working sky restoration never yields to a stale library record');

for (const [name, html] of [['sky-chart.html', sky], ['planetaryhours.html', planetary]]) {
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  inlineScripts.forEach((match, index) => new vm.Script(match[1], { filename: `${name}:inline-${index + 1}` }));
}

console.log('location integration tests passed');
