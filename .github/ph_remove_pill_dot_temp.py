from pathlib import Path

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')

old_css = "  .ph-dot {\n    display: inline-block;\n    width: 0.7em;\n    height: 0.7em;\n    border-radius: 50%;\n    background: currentColor;\n  }\n"
if page.count(old_css) != 1:
    raise SystemExit(f'ph-dot CSS: expected one match, found {page.count(old_css)}')
page = page.replace(old_css, '', 1)

old_pill = "  function pillFor(p, label) {\n    return '<span class=\"ph-pill p-' + p.key + '\"><span class=\"ph-dot\"></span>' + canonicalPlanetGlyphMarkup(p.key, p.name) + ' ' + label + '</span>';\n  }"
new_pill = "  function pillFor(p, label) {\n    return '<span class=\"ph-pill p-' + p.key + '\">' + canonicalPlanetGlyphMarkup(p.key, p.name) + ' ' + label + '</span>';\n  }"
if page.count(old_pill) != 1:
    raise SystemExit(f'pillFor dot markup: expected one match, found {page.count(old_pill)}')
page = page.replace(old_pill, new_pill, 1)
page_path.write_text(page, encoding='utf-8')

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test = test_path.read_text(encoding='utf-8')
anchor = "assert.match(page,/\\.ph-pill \\.ph-direct-canonical-glyph/);\n"
addition = anchor + "assert.doesNotMatch(page,/ph-dot/);\n"
if test.count(anchor) != 1:
    raise SystemExit(f'test anchor: expected one match, found {test.count(anchor)}')
test = test.replace(anchor, addition, 1)
test_path.write_text(test, encoding='utf-8')
