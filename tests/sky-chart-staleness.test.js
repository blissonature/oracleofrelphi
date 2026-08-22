const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'sky-chart-staleness-v1.js'), 'utf8');
const migration = fs.readFileSync(path.join(__dirname, '..', 'sky-chart-live-origin-migration-v1.js'), 'utf8');
const header = fs.readFileSync(path.join(__dirname, '..', 'sky-chart-live-header-v1.js'), 'utf8');
const titleIntegrity = fs.readFileSync(path.join(__dirname, '..', 'sky-chart-sky-card-title-integrity-v1.js'), 'utf8');
const loader = fs.readFileSync(path.join(__dirname, '..', 'sky-chart-page-stability-v1.js'), 'utf8');

const ageFunction = source.match(/function ageLabel\(timestamp,now=Date\.now\(\)\)\{[\s\S]*?\n\}/);
assert.ok(ageFunction, 'ageLabel should remain directly testable');
const ageLabel = new Function('STEP_MS', `${ageFunction[0]}; return ageLabel;`)(5 * 60 * 1000);
const base = 1_000_000_000;

assert.equal(ageLabel(base, base), 'Now');
assert.equal(ageLabel(base, base + 4 * 60 * 1000 + 59_999), 'Now');
assert.equal(ageLabel(base, base + 5 * 60 * 1000), '5 minutes ago');
assert.equal(ageLabel(base, base + 9 * 60 * 1000 + 59_999), '5 minutes ago');
assert.equal(ageLabel(base, base + 10 * 60 * 1000), '10 minutes ago');
assert.equal(ageLabel(base, base + 65 * 60 * 1000), '65 minutes ago');

// The staleness module tracks live-origin state only. It must never render a second
// age/refresh row in Where and When; the header owns the visible control exclusively.
assert.match(source, /LIVE_ORIGINS=new Set\(\['here-and-now','update-to-now'\]\)/);
assert.match(source, /clearLive\(slot,'loaded-sky'\)/);
assert.match(source, /clearLive\(slot,'custom-where-when'\)/);
assert.match(source, /markLive\(detail\.slot,'update-to-now'\)/);
assert.match(source, /markLive\(slot,'here-and-now'\)/);
assert.match(source, /Math\.abs\(marker-current\)>90\*1000/);
assert.doesNotMatch(source, /sky-staleness-control|sky-staleness-age|sky-staleness-refresh/);
assert.doesNotMatch(source, /dataset\.finalNow|dataset\.stalenessRefresh|buildControl\(/);

// Persisted legacy live skies must be recognized from their surviving semantic signature,
// not from savedAt/updatedAt timestamps that other Sky Chart layers may rewrite later.
assert.match(migration, /hasSavedIdentity\(value\)\|\|!isNamedNow\(value\)/);
assert.match(migration, /source==='where-when-v1'&&query==='my current location'/);
assert.match(migration, /query==='current location'\|\|location==='current location'/);
assert.doesNotMatch(migration, /MAX_CREATION_DRIFT|createdAtSkyMoment/);
assert.match(migration, /liveNowMigrated='legacy-v2'/);

// The visible stable title host is the one and only UI owner for a live sky.
assert.match(header, /\.sky-card-title-stable\[data-live-header-owned="true"\]/);
assert.match(header, /function host\(slot\)/);
assert.match(header, /className='sky-live-age'/);
assert.match(header, /container\.replaceChildren\(age,refresh\)/);
assert.match(header, /dataset\.finalNow=slot/);
assert.match(header, /title='Update to Now'/);
assert.match(header, /width:44px!important/);
assert.match(header, /height:44px!important/);
assert.match(header, /legacyLive\(value\)/);
assert.match(titleIntegrity, /if\(host\.dataset\.liveHeaderOwned==='true'\)return/);

// Startup order must classify legacy state before staleness/header rendering.
const migrationIndex = loader.indexOf("sky-chart-live-origin-migration-v1.js?v=2");
const stalenessIndex = loader.indexOf("sky-chart-staleness-v1.js?v=1");
const headerIndex = loader.indexOf("sky-chart-live-header-v1.js?v=1");
assert.ok(migrationIndex >= 0 && stalenessIndex > migrationIndex && headerIndex > stalenessIndex);

console.log('Sky Chart staleness regression checks passed.');
