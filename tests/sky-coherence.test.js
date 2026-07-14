const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'sky-chart.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'tarot-app.js'), 'latin1');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const roles = fs.readFileSync(path.join(root, 'sky-chart-static-dynamic.js'), 'utf8');
const glyphs = fs.readFileSync(path.join(root, 'sky-ledger-wheel-glyphs.js'), 'utf8');

assert.doesNotMatch(html, /data-sky-path-panel="there-then"[\s\S]{0,500}data-sky-here-now/, 'There and Then has no duplicate Here and Now action');
assert.match(html, /id="skyWizardPrimaryName"/);
assert.match(html, /id="skyWizardCompareName"/);
assert.equal((html.match(/Use Planetary Hours Where and When/g) || []).length, 3);
assert.match(html, /data-ph-confirmation="chart"/);
assert.match(app, /houseSystem: data\.houseSystem \|\| 'whole-sign'/);
assert.match(app, /relphiPlanetaryHoursWhereWhen/);
assert.match(app, /btn\.dataset\.phConfirmed === signature/);

assert.match(roles, /valid:validity\(\)/);
assert.match(roles, /staticTarget/);
assert.match(roles, /dynamicTarget/);
assert.match(app, /skyTransitRoleContract/);
assert.match(app, /relation:'transit-invalid'/);
assert.match(app, /roles\.dynamicTarget === 'chart'/);

assert.match(app, /skySameSkyMode:'exclude'/);
assert.match(app, /data-same-sky-mode/);
assert.match(app, /sameMode === 'separate'/);
assert.match(app, /in the same sky\./);
assert.match(app, /relationship-line-sample/);
assert.match(app, /event\.target !== event\.currentTarget/);
assert.match(css, /user-select: text !important/);
assert.match(css, /relationship-reading-pair > \.relationship-placement-card[^}]*height: 100%/s);
assert.match(css, /relationship-sky-label[^}]*width: max-content/s);
assert.match(css, /relationship-sky-label[^}]*height: 1\.75rem/s);
assert.match(css, /@media \(max-width: 640px\)[\s\S]*min-height: 0 !important/);

assert.match(glyphs, /relphiWheelGlyphPending/);
assert.match(glyphs, /validPosition/);
assert.match(glyphs, /querySelectorAll\(':scope > \.relphi-wheel-planet-glyph'\)/);
assert.match(glyphs, /group\.remove\(\)/);
console.log('Sky coherence regression tests passed');
