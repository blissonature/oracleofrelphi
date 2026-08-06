import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const extensions = new Set(['.js', '.css', '.html']);
const excludedDirectories = new Set(['.git', 'node_modules', 'vendor', 'assets']);
const excludedFiles = new Set([
  'relphi-glyph-component-v1.js',
  'relphi-glyph-registry-v1.js',
  'glyphs-unified-preview.html'
]);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (extensions.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

const forbidden = [
  ['runtime bubble/circle construction', /RelphiGlyphComponent\.createBubble\s*\(/],
  ['visible-bounds fitting', /getBBox\s*\(/],
  ['glyph viewBox rewriting', /setAttribute\(\s*['"]viewBox['"]/],
  ['glyph transform rewriting', /setAttribute\(\s*['"]transform['"]/],
  ['radius supplied to a glyph renderer', /RelphiGlyphComponent\.(?:draw|createBubble)[\s\S]{0,240}?\bradius\s*:/],
  ['padding supplied to a glyph renderer', /RelphiGlyphComponent\.(?:draw|createBubble)[\s\S]{0,240}?\bpadding\s*:/],
  ['relationship glyph SVG construction', /sky-foundation-relationship[\s\S]{0,600}?createElementNS\s*\([^)]*['"]svg['"]/],
  ['relationship glyph descendant transform', /sky-foundation-relationship[^\n{]*?(?:svg|g|path|circle)[^{]*\{[^}]*\btransform\s*:/],
  ['relationship glyph clipping', /sky-foundation-relationship[^\n{]*?svg[^{]*\{[^}]*\boverflow\s*:\s*hidden/],
  ['relationship glyph descendant geometry styling', /sky-foundation-relationship[^\n{]*?(?:path|circle|g)[^{]*\{[^}]*(?:stroke-width|transform|translate|scale)\s*:/]
];

const failures = [];
for (const file of walk(root)) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  if (relative.startsWith('tests/') || relative.startsWith('.github/')) continue;
  if (excludedFiles.has(relative)) continue;

  const source = fs.readFileSync(file, 'utf8');
  const glyphConsumer = /glyph|RelphiGlyph|relationship/i.test(source);
  if (!glyphConsumer) continue;

  for (const [label, pattern] of forbidden) {
    if (pattern.test(source)) failures.push(`${relative}: ${label}`);
  }
}

if (failures.length) {
  console.error('\nCANONICAL GLYPH CONSUMER AUDIT: FAILED\n');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('CANONICAL GLYPH CONSUMER AUDIT: PASSED');
console.log('Consumers use preserved-canvas canonical assets and approved presentation states only.');
