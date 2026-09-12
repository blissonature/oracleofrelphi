from pathlib import Path

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')

old_pill = "  function pillFor(p, label) {\n    return '<span class=\"ph-pill p-' + p.key + '\"><span class=\"ph-dot\"></span>' + canonicalPlanetGlyphMarkup(p.key, p.name) + ' ' + label + '</span>';\n  }"
new_pill = "  function pillFor(p, label) {\n    return '<span class=\"ph-pill p-' + p.key + '\">' + canonicalPlanetGlyphMarkup(p.key, p.name) + ' ' + label + '</span>';\n  }"
if page.count(old_pill) != 1:
    raise SystemExit(f'pillFor dot markup: expected one match, found {page.count(old_pill)}')
page = page.replace(old_pill, new_pill, 1)
page_path.write_text(page, encoding='utf-8')

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test = test_path.read_text(encoding='utf-8')
anchor = "assert.match(page,/\\.ph-pill \\.ph-direct-canonical-glyph/);\n"
addition = anchor + "assert.match(page,/function pillFor\\(p, label\\) \\{\\n    return '<span class=\\\"ph-pill p-' \\+ p\\.key \\+ '\\">' \\+ canonicalPlanetGlyphMarkup/);\n"
if test.count(anchor) != 1:
    raise SystemExit(f'test anchor: expected one match, found {test.count(anchor)}')
test = test.replace(anchor, addition, 1)
test_path.write_text(test, encoding='utf-8')
