from pathlib import Path

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')

old_pill = "  function pillFor(p, label) {\n    return '<span class=\"ph-pill p-' + p.key + '\"><span class=\"ph-dot\"></span>' + canonicalPlanetGlyphMarkup(p.key, p.name) + ' ' + label + '</span>';\n  }"
new_pill = "  function pillFor(p, label) {\n    return '<span class=\"ph-pill p-' + p.key + '\">' + canonicalPlanetGlyphMarkup(p.key, p.name) + ' ' + label + '</span>';\n  }"
if page.count(old_pill) != 1:
    raise SystemExit(f'pillFor dot markup: expected one match, found {page.count(old_pill)}')
page = page.replace(old_pill, new_pill, 1)
page_path.write_text(page, encoding='utf-8')
