from pathlib import Path

page_path = Path('planetaryhours.html')
text = page_path.read_text(encoding='utf-8')

old_anchor = "      const mc = phMidheavenLongitude(date, state.lon);\n      for (let i = 0; i < 12; i += 1) {"
new_anchor = "      const mc = phMidheavenLongitude(date, state.lon);\n      const houseNumberRadius = Math.max(Number(house.numberRadius || 0), Number(house.outer) - 12);\n      for (let i = 0; i < 12; i += 1) {"
if old_anchor not in text:
    raise SystemExit('house loop anchor not found')
text = text.replace(old_anchor, new_anchor, 1)

old_label = "        const labelPoint = phZodiacPoint(mid, house.numberRadius, center.x, center.y);"
new_label = "        const labelPoint = phZodiacPoint(mid, houseNumberRadius, center.x, center.y);"
if old_label not in text:
    raise SystemExit('house label radius line not found')
text = text.replace(old_label, new_label, 1)
page_path.write_text(text, encoding='utf-8')

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test = test_path.read_text(encoding='utf-8')
anchor = "assert.match(page,/fill-opacity':spec\\.houseFillOpacity/);"
addition = "\nassert.match(page,/const houseNumberRadius = Math\\.max\\(Number\\(house\\.numberRadius \\|\\| 0\\), Number\\(house\\.outer\\) - 12\\)/);\nassert.match(page,/phZodiacPoint\\(mid, houseNumberRadius, center\\.x, center\\.y\\)/);"
if anchor not in test:
    raise SystemExit('test anchor not found')
if 'houseNumberRadius' not in test:
    test = test.replace(anchor, anchor + addition, 1)
    test_path.write_text(test, encoding='utf-8')
