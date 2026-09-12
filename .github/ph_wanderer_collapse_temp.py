from pathlib import Path

page_path = Path('planetaryhours.html')
test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
page = page_path.read_text()
test = test_path.read_text()

state_old = "const state = { tz: browserTimeZone, lat: 51.4769, lon: -0.0005, useSystem: true, now: new Date(), locationName: 'Greenwich demo', moonOrientation: 'auto', skyBody: 'Saturn', skyHasRun: false, heptagramHourOverride: null, timeFormat: '12h' };"
state_new = "const state = { tz: browserTimeZone, lat: 51.4769, lon: -0.0005, useSystem: true, now: new Date(), locationName: 'Greenwich demo', moonOrientation: 'auto', skyBody: 'Saturn', skyHasRun: false, wandererExpandedBody: null, heptagramHourOverride: null, timeFormat: '12h' };"
if state_old not in page:
    raise SystemExit('state target not found')
page = page.replace(state_old, state_new, 1)

css_needle = "  .ph-wanderer-select-note { font-size: .72rem; color: #666; font-weight: 700; text-align: right; }\n"
css_add = """
  /* Compact unavailable wanderers so the useful guide does not dominate the page. */
  .ph-wanderer-grid { align-items: start; }
  .ph-wanderer-card.is-collapsed {
    gap: .18rem;
    padding: .48rem .55rem;
    background: #fff;
    box-shadow: none !important;
  }
  .ph-wanderer-card.is-collapsed .ph-wanderer-title { margin-bottom: 0; }
  .ph-wanderer-card.is-collapsed .ph-wanderer-rail,
  .ph-wanderer-card.is-collapsed .ph-wanderer-caption,
  .ph-wanderer-card.is-collapsed .ph-wanderer-facts,
  .ph-wanderer-card.is-collapsed .ph-wanderer-mini-meters,
  .ph-wanderer-card.is-collapsed .ph-wanderer-selected-guide,
  .ph-wanderer-card.is-collapsed .ph-wanderer-visibility-dot { display: none; }
  .ph-wanderer-card.is-collapsed::after {
    content: 'Tap for guide';
    justify-self: end;
    color: #777;
    font-size: .68rem;
    font-weight: 750;
  }
"""
if css_add not in page:
    if css_needle not in page:
        raise SystemExit('wanderer CSS insertion point not found')
    page = page.replace(css_needle, css_needle + css_add, 1)

instructions_old = '<p class="ph-planet-instructions">Choose a tile to see rise, set, visibility, compass direction, and altitude together. Tiles are ordered by practical viewing: naked eye, binoculars, telescope, not practical, then below horizon.</p>'
instructions_new = '<p class="ph-planet-instructions">Viewable wanderers stay open. Wanderers that are not practical to see are collapsed; tap one to open its full orientation guide. Tiles remain ordered by practical viewing.</p>'
if instructions_old not in page:
    raise SystemExit('wanderer instructions target not found')
page = page.replace(instructions_old, instructions_new, 1)

map_old = '''    el.wandererGrid.innerHTML = items.map(function (item) {
      const body = item.body;
      return '<button class="ph-wanderer-card ' + (item.above ? 'is-above ' : '') + (item.visibility.practical ? 'is-viewable ' : '') + (state.skyBody === body ? 'is-selected' : '') + '" type="button" data-sky-body="' + body + '" aria-pressed="' + (state.skyBody === body ? 'true' : 'false') + '" aria-label="Orient to ' + body + '">' +
'''
map_new = '''    el.wandererGrid.innerHTML = items.map(function (item) {
      const body = item.body;
      const collapsed = !item.visibility.practical && state.wandererExpandedBody !== body;
      return '<button class="ph-wanderer-card ' + (item.above ? 'is-above ' : '') + (item.visibility.practical ? 'is-viewable ' : '') + (collapsed ? 'is-collapsed ' : '') + (state.skyBody === body ? 'is-selected' : '') + '" type="button" data-sky-body="' + body + '" aria-pressed="' + (state.skyBody === body ? 'true' : 'false') + '" aria-expanded="' + (collapsed ? 'false' : 'true') + '" aria-label="' + (collapsed ? 'Expand ' : 'Orient to ') + body + '">' +
'''
if map_old not in page:
    raise SystemExit('wanderer card render target not found')
page = page.replace(map_old, map_new, 1)

click_old = '''      state.skyBody = body;
      if (el.skyQuery) el.skyQuery.value = 'Where is ' + body + ' right now?';
      renderWandererGrid();
      renderSkyOrientation(true);
'''
click_new = '''      state.skyBody = body;
      state.wandererExpandedBody = button.classList.contains('is-collapsed') ? body : null;
      if (el.skyQuery) el.skyQuery.value = 'Where is ' + body + ' right now?';
      renderWandererGrid();
      renderSkyOrientation(true);
'''
if click_old not in page:
    raise SystemExit('wanderer click target not found')
page = page.replace(click_old, click_new, 1)
page_path.write_text(page)

marker = "console.log('Planetary Hours direct heptagram, enlarged canonical glyphs, rainbow houses, and direct mini-wheel ownership contract passed.');"
test_add = """assert.match(page,/wandererExpandedBody: null/);
assert.match(page,/const collapsed = !item\\.visibility\\.practical && state\\.wandererExpandedBody !== body/);
assert.match(page,/collapsed \\? 'is-collapsed ' : ''/);
assert.match(page,/aria-expanded=/);
assert.match(page,/\\.ph-wanderer-card\\.is-collapsed \\.ph-wanderer-mini-meters/);
assert.match(page,/state\\.wandererExpandedBody = button\\.classList\\.contains\\('is-collapsed'\\) \\? body : null/);

"""
if test_add not in test:
    if marker not in test:
        raise SystemExit('test insertion point not found')
    test = test.replace(marker, test_add + marker, 1)
test_path.write_text(test)
