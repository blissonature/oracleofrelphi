from pathlib import Path

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')

old = "    const glyphColor=isHour?'#ffffff':color, fill=isHour?color:'#ffffff';"
new = "    const glyphColor=isHour?color:'#ffffff', fill=isHour?'#ffffff':color;"
if page.count(old) != 1:
    raise SystemExit(f'heptagram node color ownership: expected one match, found {page.count(old)}')
page = page.replace(old, new, 1)
page_path.write_text(page, encoding='utf-8')

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test = test_path.read_text(encoding='utf-8')
anchor = "assert.match(page,/directHeptagramPlanetMarkup\\(key, dayKey, hourKey\\)/);\n"
addition = anchor + "assert.match(page,/const glyphColor=isHour\\?color:'#ffffff', fill=isHour\\?'#ffffff':color/);\nassert.doesNotMatch(page,/const glyphColor=isHour\\?'#ffffff':color, fill=isHour\\?color:'#ffffff'/);\n"
if test.count(anchor) != 1:
    raise SystemExit(f'heptagram test anchor: expected one match, found {test.count(anchor)}')
test = test.replace(anchor, addition, 1)
test_path.write_text(test, encoding='utf-8')
