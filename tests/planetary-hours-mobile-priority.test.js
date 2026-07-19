const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(path.resolve(__dirname, '..', 'planetaryhours.html'), 'utf8');
const inline = fs.readFileSync(path.resolve(__dirname, '..', 'planetaryhours.html.inline.js'), 'utf8');

assert.ok(Buffer.byteLength(page, 'utf8') > 150000,
  'Planetary Hours HTML is unexpectedly short and may have been truncated.');
assert.ok(Buffer.byteLength(inline, 'utf8') > 80000,
  'The extracted Planetary Hours script is unexpectedly short and may have been truncated.');
assert.match(page, /<\/script>\s*<script src="navloader\.js"><\/script>\s*<\/body>\s*<\/html>\s*$/,
  'Planetary Hours must retain its complete closing script, body, and document tags.');
assert.match(page, /ph-summary-grid-consolidated > \.ph-living-heptagram-frame \{ order: 1; \}/,
  'The living heptagram must lead the mobile summary.');
assert.match(page, /ph-summary-grid-consolidated > \.ph-day-frame \{ order: 2; \}/,
  'The Day Ruler must follow the living heptagram on mobile.');
assert.match(page, /grid-template-columns: 5\.75rem minmax\(0, 1fr\)/,
  'The mobile Day Ruler portrait must use the compact side-by-side card.');
assert.match(page, /\.ph-day-ruler-photo-label[\s\S]*?position: static;/,
  'The mobile Day Ruler label must not cover or blur the portrait.');
assert.doesNotMatch(page, /Rubens_saturn\.jpg/, 'The disturbing Rubens Saturn image must not return.');
assert.match(page, /Chronos_MET_DP-932-001\.jpg\?width=640/,
  'The calm public-domain Met Chronos portrait must be used at a clear display size.');
assert.match(inline, /Chronos_MET_DP-932-001\.jpg\?width=640/,
  'The extracted inline script must mirror the Met Chronos portrait.');

console.log('Planetary Hours mobile priority and profile checks passed.');
