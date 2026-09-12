from pathlib import Path

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')

def replace_once(old, new, label):
    global page
    count = page.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    page = page.replace(old, new, 1)

# The Moon panel must never paint a Unicode Moon before its calculated phase disc.
replace_once(
    '<div class="ph-moon-disc" id="moonDisc">☽</div>',
    '<div class="ph-moon-disc" id="moonDisc"></div>',
    'remove noncanonical Moon placeholder'
)

css_anchor = '  /* Direct Sky Chart-matched heptagram renderer: core presentation, no post-processing. */'
css = '''  /* Planetary Hours owns dynamic ruler glyphs directly from the canonical SVG assets. */
  .ph-direct-canonical-glyph {
    display:inline-block;
    width:1.08em;
    height:1.08em;
    vertical-align:-.16em;
    background:currentColor;
    -webkit-mask:var(--ph-canonical-glyph) center / contain no-repeat;
    mask:var(--ph-canonical-glyph) center / contain no-repeat;
    flex:0 0 auto;
  }
  #dayRulerProfileName .ph-direct-canonical-glyph,
  #hourRulerProfileName .ph-direct-canonical-glyph { margin-right:.18em; }

'''
if 'Planetary Hours owns dynamic ruler glyphs directly from the canonical SVG assets.' not in page:
    if css_anchor not in page:
        raise SystemExit('canonical glyph CSS anchor not found')
    page = page.replace(css_anchor, css + css_anchor, 1)

helper_anchor = '  function directHeptagramPlanetMarkup(key, dayKey, hourKey) {'
helper = '''  function canonicalPlanetGlyphMarkup(key, label) {
    const id = String(key || '').toLowerCase();
    if (!/^(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)$/.test(id)) return '';
    return '<span class="ph-direct-canonical-glyph p-' + id + '" style="--ph-canonical-glyph:url(\\'assets/planet-glyphs/' + id + '.svg\\')" role="img" aria-label="' + attrText(label || id) + '"></span>';
  }

'''
if 'function canonicalPlanetGlyphMarkup' not in page:
    if helper_anchor not in page:
        raise SystemExit('canonical glyph helper anchor not found')
    page = page.replace(helper_anchor, helper + helper_anchor, 1)

replace_once(
    "if (el.dayRulerProfileName) el.dayRulerProfileName.textContent = day.sym + ' ' + day.name + ' day';",
    "if (el.dayRulerProfileName) el.dayRulerProfileName.innerHTML = canonicalPlanetGlyphMarkup(day.key, day.name) + ' ' + day.name + ' day';",
    'day ruler canonical source'
)
replace_once(
    "if (el.hourRulerProfileName && row) el.hourRulerProfileName.textContent = row.ruler.sym + ' ' + row.ruler.name + ' hour';",
    "if (el.hourRulerProfileName && row) el.hourRulerProfileName.innerHTML = canonicalPlanetGlyphMarkup(row.ruler.key, row.ruler.name) + ' ' + row.ruler.name + ' hour';",
    'hour ruler canonical source'
)

page_path.write_text(page, encoding='utf-8', newline='')

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test = test_path.read_text(encoding='utf-8')
marker = "console.log('Planetary Hours direct heptagram and ruler-profile ownership contract passed.');"
checks = """assert.match(page,/function canonicalPlanetGlyphMarkup/);
assert.match(page,/dayRulerProfileName\\.innerHTML = canonicalPlanetGlyphMarkup/);
assert.match(page,/hourRulerProfileName\\.innerHTML = canonicalPlanetGlyphMarkup/);
assert.doesNotMatch(page,/id=\"moonDisc\">☽<\\/div>/);
assert.doesNotMatch(page,/dayRulerProfileName\\.textContent = day\\.sym/);
assert.doesNotMatch(page,/hourRulerProfileName.*textContent = row\\.ruler\\.sym/);
"""
if 'assert.match(page,/function canonicalPlanetGlyphMarkup/);' not in test:
    if marker not in test:
        raise SystemExit('test marker not found')
    test = test.replace(marker, checks + '\n' + marker, 1)
    test_path.write_text(test, encoding='utf-8', newline='')
