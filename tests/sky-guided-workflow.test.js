const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'sky-chart.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'tarot-app.js'), 'latin1');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const persistence = fs.readFileSync(path.join(root, 'sky-chart-refresh-persistence.js'), 'utf8');

assert.match(html, /id="skyWizardPrimaryHeading">Choose Where and When</);
assert.match(app, /if \(path === 'here-now'\) return 'Here and Now'/);
assert.match(app, /if \(path === 'there-then'\) return 'There and Then'/);
assert.match(app, /if \(path === 'existing'\) return 'Enter an Existing Sky'/);

const existingPanel = html.match(/data-sky-path-panel="existing"[\s\S]*?<\/div>/)?.[0] || '';
assert.match(existingPanel, / hidden>/, 'existing-sky methods start hidden');
assert.match(existingPanel, /Type or paste/);
assert.match(existingPanel, /Form-field placement entry/);
assert.match(existingPanel, /Use stored sky/);

assert.match(html, /Detect my location automatically/);
assert.match(html, /Add a location manually/);
assert.doesNotMatch(html, />Use my location</, 'ambiguous geolocation label is removed');
assert.doesNotMatch(app, /Use my location/, 'status text uses the same unambiguous location language');
assert.match(html, /id="skyCalcLocationResults"[^>]*hidden/);
assert.match(html, /id="skyCalcLocationConfirmation"[^>]*hidden/);
assert.match(html, /Selected location/);
assert.match(app, /limit=5/);
assert.match(app, /Location changed while the lookup was running/);

assert.match(html, /id="skyWizardPrimaryComplete"[^>]*hidden/);
assert.match(html, /id="skyWizardCompareComplete"[^>]*hidden/);
assert.match(app, /complete\.hidden = !ready/);
assert.match(html, /id="skyWizardCompareStep" hidden/);
assert.match(app, /compareStep\.hidden = !hasA/);
assert.match(html, /sky-wizard-entry-card-secondary[^>]*hidden/);
assert.match(app, /secondaryEntry\.hidden = !needsB/);

assert.match(css, /data-sky-builder-ui="wizard"[^\n]*sky-builder-advanced-panel[^\n]*display: none/);
assert.match(css, /data-sky-builder-ui="advanced"[^\n]*sky-wizard-shell/);
assert.match(app, /closeSkyWizardInline\('chart'\)/);
assert.match(app, /closeSkyWizardInline\('currentSky'\)/);
assert.match(app, /skyWizardPath: \{ chart:'', currentSky:'' \}/);
assert.match(app, /skyMotionMode: \{ chart:'static', currentSky:'dynamic' \}/);
assert.match(html, /id="skyMotionMode"/);

assert.match(html, /<section id="skyCreatorDrawer"/);
assert.doesNotMatch(html, /<details id="skyCreatorDrawer"/, 'Advanced is not a disclosure below Wizard');
assert.match(html, /data-sky-wizard-target="chart"/);
assert.match(html, /data-sky-wizard-target="currentSky"/);
assert.match(html, /Use Planetary Hours Where and When/);
assert.match(css, /sky-calc-shared-actions \{ display: none; \}/, 'technical metadata actions are hidden in Wizard only');

assert.match(persistence, /motionMode: byId\('skyMotionMode'\)/);
assert.match(persistence, /window\.addEventListener\('pagehide', flushSave\)/);
assert.match(persistence, /visibilityState === 'hidden'/);
assert.match(persistence, /TARGETS = \['chart', 'currentSky'\]/);
assert.match(persistence, /setTimeout\(done, 420\)/, 'both paste imports settle before target switching');

console.log('guided sky workflow regression tests passed');
