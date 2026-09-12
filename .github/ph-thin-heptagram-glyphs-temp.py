from pathlib import Path

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')

replacements = {
    '3.9091328641833893': '2.65',
    '1.9129799122599562': '1.30',
    '3.3114267878104444': '2.25',
    '3.3226974572350114': '2.25',
    '3.0878458220259137': '2.10',
    '2.8010427638740447': '1.90',
    '2.715849674371604': '1.85',
    '3.054547111109828': '2.08',
}
for old, new in replacements.items():
    count = page.count('stroke-width=\"' + old + '\"')
    if count < 1:
        raise SystemExit(f'expected heptagram stroke width {old} at least once')
    page = page.replace('stroke-width=\"' + old + '\"', 'stroke-width=\"' + new + '\"')

page_path.write_text(page, encoding='utf-8')

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test = test_path.read_text(encoding='utf-8')
anchor = "assert.match(page,/directHeptagramPlanetMarkup\\(key, dayKey, hourKey\\)/);\n"
addition = anchor + "assert.match(page,/stroke-width=\\\"2\\.25\\\"/);\nassert.match(page,/stroke-width=\\\"1\\.85\\\"/);\nassert.doesNotMatch(page,/stroke-width=\\\"3\\.3226974572350114\\\"/);\n"
if test.count(anchor) != 1:
    raise SystemExit(f'test anchor expected once, found {test.count(anchor)}')
test = test.replace(anchor, addition, 1)
test_path.write_text(test, encoding='utf-8')
