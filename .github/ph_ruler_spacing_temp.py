from pathlib import Path

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')

replacements = [
    (
        "  .ph-hour-ruler-inline strong {\n    display: inline;\n    margin-left: .08rem;\n    font-size: 1rem;\n    line-height: 1.2;\n  }",
        "  .ph-hour-ruler-inline strong {\n    display: inline;\n    margin-left: 0;\n    font-size: 1rem;\n    line-height: 1.2;\n  }",
        'remove hour-ruler left offset'
    ),
    (
        "  #dayRulerProfileName .ph-direct-canonical-glyph,\n  #hourRulerProfileName .ph-direct-canonical-glyph {\n    width:1.45em;\n    height:1.45em;\n    margin:0 .02em 0 -.12em;\n    vertical-align:middle;\n    transform:scale(2.05);\n    transform-origin:center;\n  }",
        "  #dayRulerProfileName .ph-direct-canonical-glyph,\n  #hourRulerProfileName .ph-direct-canonical-glyph {\n    width:2.15em;\n    height:2.15em;\n    margin:0 .28em 0 0;\n    vertical-align:middle;\n    transform:scale(1.42);\n    transform-origin:center;\n  }",
        'restore ruler glyph box and keep only right-side breathing room'
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
    (
        "assert.match(page,/width:1\\.45em/);\nassert.match(page,/transform:scale\\(2\\.05\\)/);\nassert.match(page,/margin-left: \\.08rem/);",
        "assert.match(page,/width:2\\.15em/);\nassert.match(page,/transform:scale\\(1\\.42\\)/);\nassert.match(page,/margin:0 \\.28em 0 0/);\nassert.match(page,/margin-left: 0/);"
    )
]

for old, new in test_replacements:
    count = test.count(old)
    if count != 1:
        raise SystemExit(f'test replacement expected one match, found {count}: {old}')
    test = test.replace(old, new, 1)

test_path.write_text(test, encoding='utf-8')
