from pathlib import Path

path = Path('planetaryhours.html')
page = path.read_text(encoding='utf-8')

def replace_once(old, new, label):
    global page
    count = page.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    page = page.replace(old, new, 1)

replace_once(
    "'<span class=\"ph-mini-ruler p-' + row.ruler.key + '\">' + row.ruler.sym + ' ' + row.ruler.name + '</span>' +",
    "'<span class=\"ph-mini-ruler p-' + row.ruler.key + '\">' + canonicalPlanetGlyphMarkup(row.ruler.key, row.ruler.name) + ' ' + row.ruler.name + '</span>' +",
    'mini hour cards'
)
replace_once(
    "return '<span class=\"ph-pill p-' + p.key + '\"><span class=\"ph-dot\"></span>' + p.sym + ' ' + label + '</span>';",
    "return '<span class=\"ph-pill p-' + p.key + '\"><span class=\"ph-dot\"></span>' + canonicalPlanetGlyphMarkup(p.key, p.name) + ' ' + label + '</span>';",
    'planet pills'
)
replace_once(
    "const weekText = weekPath.slice(0, 7).map(function (key) { return byKey[key].sym + ' ' + byKey[key].name; }).join(' → ') + ' → ' + byKey.sun.sym + ' Sun';",
    "const weekText = weekPath.slice(0, 7).map(function (key) { return canonicalPlanetGlyphMarkup(key, byKey[key].name) + ' ' + byKey[key].name; }).join(' → ') + ' → ' + canonicalPlanetGlyphMarkup('sun', 'Sun') + ' Sun';",
    'heptagram week path'
)
replace_once(
    "if (el.heptagramOrderText) el.heptagramOrderText.textContent = 'Planetary week path: ' + weekText + '. Completed this week: ' + completeText + '.';",
    "if (el.heptagramOrderText) el.heptagramOrderText.innerHTML = 'Planetary week path: ' + weekText + '. Completed this week: ' + completeText + '.';",
    'heptagram week path render mode'
)
replace_once(
    "return '<span class=\"ph-hour-bead ' + cls + ' p-' + r.ruler.key + '\">' + r.index + ' ' + r.ruler.sym + '</span>';",
    "return '<span class=\"ph-hour-bead ' + cls + ' p-' + r.ruler.key + '\">' + r.index + ' ' + canonicalPlanetGlyphMarkup(r.ruler.key, r.ruler.name) + '</span>';",
    'heptagram hour beads'
)
replace_once(
    "el.currentGlyph.textContent = currentRow.ruler.sym;",
    "el.currentGlyph.innerHTML = canonicalPlanetGlyphMarkup(currentRow.ruler.key, currentRow.ruler.name);",
    'ticker current glyph'
)
replace_once(
    "'<td class=\"p-' + r.ruler.key + '\"><span class=\"ph-dot\"></span> ' + r.ruler.sym + ' ' + r.ruler.name + '</td>' +",
    "'<td class=\"p-' + r.ruler.key + '\"><span class=\"ph-dot\"></span> ' + canonicalPlanetGlyphMarkup(r.ruler.key, r.ruler.name) + ' ' + r.ruler.name + '</td>' +",
    'hours table ruler glyph'
)
replace_once(
    "if (el.prevDayCue) el.prevDayCue.textContent = '← ' + byKey[prevDayKeyForCue].sym + ' day';",
    "if (el.prevDayCue) el.prevDayCue.innerHTML = '← ' + canonicalPlanetGlyphMarkup(prevDayKeyForCue, byKey[prevDayKeyForCue].name) + ' day';",
    'previous day cue'
)
replace_once(
    "if (el.nextDayCue) el.nextDayCue.textContent = byKey[nextDayKeyForCue].sym + ' day →';",
    "if (el.nextDayCue) el.nextDayCue.innerHTML = canonicalPlanetGlyphMarkup(nextDayKeyForCue, byKey[nextDayKeyForCue].name) + ' day →';",
    'next day cue'
)

path.write_text(page, encoding='utf-8', newline='')

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test = test_path.read_text(encoding='utf-8')
marker = "console.log('Planetary Hours direct heptagram and ruler-profile ownership contract passed.');"
checks = """assert.doesNotMatch(page,/row\\.ruler\\.sym \\+ ' '/);
assert.doesNotMatch(page,/r\\.ruler\\.sym \\+ '<\\/span>'/);
assert.doesNotMatch(page,/currentRow\\.ruler\\.sym/);
assert.doesNotMatch(page,/byKey\\[prevDayKeyForCue\\]\\.sym/);
assert.doesNotMatch(page,/byKey\\[nextDayKeyForCue\\]\\.sym/);
assert.match(page,/heptagramOrderText\\.innerHTML/);
"""
if 'assert.doesNotMatch(page,/currentRow\\.ruler\\.sym/);' not in test:
    if marker not in test:
        raise SystemExit('test marker missing')
    test = test.replace(marker, checks + '\n' + marker, 1)
    test_path.write_text(test, encoding='utf-8', newline='')
