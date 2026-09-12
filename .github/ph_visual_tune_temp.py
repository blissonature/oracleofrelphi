from pathlib import Path

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')

replacements = [
    (
        "  .ph-current-wheel-direct .ph-wheel-sign { pointer-events:none; filter:drop-shadow(0 0 2px rgba(255,255,255,.98)); }",
        "  .ph-current-wheel-direct .ph-wheel-sign { pointer-events:none; filter:none; }",
        'mini-wheel sign glow'
    ),
    (
        "jobs.push(phWheelCanonicalBubble(host, id, {radius:zodiac.glyphRadius || 14,color:'#514b45',plain:true,strokeWidth:1.5}));",
        "jobs.push(phWheelCanonicalBubble(host, id, {radius:zodiac.glyphRadius || 14,color:'#111',plain:true,strokeWidth:1.5}));",
        'mini-wheel sign color'
    ),
    (
        "  #dayRulerProfileName .ph-direct-canonical-glyph,\n  #hourRulerProfileName .ph-direct-canonical-glyph {\n    width:3.1em;\n    height:3.1em;\n    margin:0 .04em 0 0;\n    vertical-align:middle;\n  }",
        "  #dayRulerProfileName .ph-direct-canonical-glyph,\n  #hourRulerProfileName .ph-direct-canonical-glyph {\n    width:2.15em;\n    height:2.15em;\n    margin:0 .28em 0 .08em;\n    vertical-align:middle;\n    transform:scale(1.42);\n    transform-origin:center;\n  }\n  .ph-pill .ph-direct-canonical-glyph {\n    width:1.35em;\n    height:1.35em;\n    margin:0 .32em;\n    vertical-align:-.08em;\n    transform:scale(1.9);\n    transform-origin:center;\n  }",
        'compact ruler glyph boxes and enlarge bottom pill glyph'
    )
]

for old, new, label in replacements:
    count = page.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    page = page.replace(old, new, 1)

page_path.write_text(page, encoding='utf-8')

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test = test_path.read_text(encoding='utf-8')

test_replacements = [
    ("assert.match(page,/width:3\\.1em/);", "assert.match(page,/width:2\\.15em/);\nassert.match(page,/transform:scale\\(1\\.42\\)/);\nassert.match(page,/\\.ph-pill \\.ph-direct-canonical-glyph/);\nassert.match(page,/transform:scale\\(1\\.9\\)/);"),
    ("assert.match(page,/fill-opacity':spec\\.houseFillOpacity/);", "assert.match(page,/fill-opacity':spec\\.houseFillOpacity/);\nassert.match(page,/\\.ph-wheel-sign \\{ pointer-events:none; filter:none; \\}/);\nassert.match(page,/color:'#111',plain:true/);")
]

for old, new in test_replacements:
    count = test.count(old)
    if count != 1:
        raise SystemExit(f'test contract replacement expected one match, found {count}: {old}')
    test = test.replace(old, new, 1)

test_path.write_text(test, encoding='utf-8')
