from pathlib import Path

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')

replacements = [
    ("    width:1.08em;\n    height:1.08em;", "    width:1.8em;\n    height:1.8em;", 'general canonical glyph size'),
    ("    width:2.15em;\n    height:2.15em;", "    width:3.1em;\n    height:3.1em;", 'primary ruler glyph size'),
    ("    max-width:270px;", "    max-width:340px;", 'current placements card width'),
    ("  .ph-current-wheel { width:min(242px,100%); height:auto; display:block; margin:0 auto; overflow:visible; }", "  .ph-current-wheel { width:min(320px,100%); height:auto; display:block; margin:0 auto; overflow:visible; }", 'current placements wheel width'),
    ("  .ph-current-wheel-direct .ph-wheel-house-sector { stroke:rgba(45,39,34,.10); stroke-width:1.1; vector-effect:non-scaling-stroke; }", "  .ph-current-wheel-direct .ph-wheel-house-sector { stroke:none; }", 'rainbow house sector border'),
    ("  .ph-current-wheel-direct .ph-wheel-house-cusp { stroke:rgba(45,39,34,.28); stroke-width:1.15; vector-effect:non-scaling-stroke; }", "  .ph-current-wheel-direct .ph-wheel-house-cusp { stroke:#c9211e; stroke-width:1.15; opacity:.72; vector-effect:non-scaling-stroke; }", 'house cusp color'),
    ("        viewBox:(spec.viewBox || [0,0,600,600]).join(' '),", "        viewBox:'60 60 480 480',", 'tighter mini wheel framing'),
    ("          fill:i % 2 ? '#faf7f2' : '#fffdfa'\n        }));", "          fill:colors[i] || '#ddd',\n          'fill-opacity':spec.houseFillOpacity == null ? .5 : spec.houseFillOpacity\n        }));", 'rainbow house fills')
]

for old, new, label in replacements:
    count = page.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    page = page.replace(old, new, 1)

# Preserve the Moon panel's existing scale if any direct canonical glyphs are ever added there.
anchor = "  #hourRulerProfileName .ph-direct-canonical-glyph { color:#111; }\n"
moon_override = anchor + "  .ph-moon-frame .ph-direct-canonical-glyph { width:1.08em; height:1.08em; }\n"
if moon_override not in page:
    if page.count(anchor) != 1:
        raise SystemExit('moon glyph scale override anchor not found exactly once')
    page = page.replace(anchor, moon_override, 1)

page_path.write_text(page, encoding='utf-8')

# Update the ownership regression contract to protect these visual decisions.
test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test = test_path.read_text(encoding='utf-8')
test = test.replace("assert.match(page,/width:2\\.15em/);", "assert.match(page,/width:3\\.1em/);\nassert.match(page,/width:1\\.8em/);")
needle = "assert.match(page,/root\\.classList\\.add\\('is-ready'\\)/);\n"
extra = needle + "assert.match(page,/viewBox:'60 60 480 480'/);\nassert.match(page,/fill:colors\\[i\\] \\|\\| '#ddd'/);\nassert.match(page,/fill-opacity':spec\\.houseFillOpacity/);\n"
if extra not in test:
    if needle not in test:
        raise SystemExit('test insertion anchor not found')
    test = test.replace(needle, extra, 1)
test_path.write_text(test, encoding='utf-8')
