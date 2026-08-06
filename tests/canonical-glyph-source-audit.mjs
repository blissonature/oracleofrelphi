import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const registryPath = path.join(root, 'relphi-glyph-registry-v1.js');
const componentPath = path.join(root, 'relphi-glyph-component-v1.js');

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing required canonical source file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

const registry = read(registryPath);
const component = read(componentPath);

const registryEntries = [...registry.matchAll(/^\s*\['([^']+)'\s*,/gm)].map(match => match[1]);
const staticAssetEntries = [...registry.matchAll(/^\s*\['([^']+)'\s*,[^\n]*?'(assets\/[^']+\.svg)'/gm)].map(match => ({ id: match[1], asset: match[2] }));
const fallbackEntries = [...registry.matchAll(/^\s*\['([^']+)'\s*,[^\n]*?,null,[^\n]*?'([^']+)'/gm)].map(match => ({ id: match[1], fallback: match[2] }));

const failures = [];

if (registryEntries.length !== 93) {
  failures.push(`Expected exactly 93 registered canonical glyph entries; found ${registryEntries.length}.`);
}

if (staticAssetEntries.length !== 93) {
  failures.push(`Expected all 93 entries to resolve to static SVG assets; found ${staticAssetEntries.length} static assets and ${fallbackEntries.length} fallback-driven entries.`);
}

const forbiddenComponentPatterns = [
  ['generated circles', /createBubble\s*\(/],
  ['runtime fitting', /function\s+fit\s*\(/],
  ['visible-bounds measurement', /getBBox\s*\(/],
  ['text or font fallback rendering', /function\s+textGlyph\s*\(/],
  ['runtime glyph transforms', /setAttribute\(\s*['"]transform['"]/],
  ['radius-driven rendering', /options\?\.radius|availableRadius\s*\(/],
  ['padding-driven rendering', /options\?\.padding|\bpadding\b/]
];

for (const [label, pattern] of forbiddenComponentPatterns) {
  if (pattern.test(component)) failures.push(`Canonical component still contains ${label}.`);
}

if (failures.length) {
  console.error('\nCANONICAL GLYPH SOURCE AUDIT: FAILED\n');
  failures.forEach(item => console.error(`- ${item}`));
  if (fallbackEntries.length) {
    console.error('\nEntries still using non-asset fallback paths:');
    fallbackEntries.forEach(entry => console.error(`- ${entry.id}: ${entry.fallback}`));
  }
  process.exit(1);
}

console.log('CANONICAL GLYPH SOURCE AUDIT: PASSED');
console.log('93 static assets; no fitting, cropping, generated circles, text fallbacks, or runtime geometry.');
