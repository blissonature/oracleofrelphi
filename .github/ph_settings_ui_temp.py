from pathlib import Path
import re

path = Path('planetaryhours.html')
text = path.read_text(encoding='utf-8')

section_re = re.compile(r'''  <section class="ph-panel ph-settings" id="controls" aria-label="Planetary hours controls">.*?  </section>''', re.S)
match = section_re.search(text)
if not match:
    raise SystemExit('settings section not found')

new_section = '''  <section class="ph-panel ph-settings" id="controls" aria-label="Planetary hours controls">
    <details id="settingsDetails">
      <summary><span>Where and when settings</span><span class="ph-settings-summary" id="settingsSummary">—</span></summary>
      <div class="ph-settings-body">
        <div class="ph-settings-group ph-settings-group-location">
          <div class="ph-settings-group-title">Location</div>
          <div class="ph-settings-row ph-settings-row-location">
            <span class="ph-clock" id="localClock">--:--</span>
            <button class="ph-btn" id="useGeo" type="button">Use my location</button>
            <label class="ph-settings-field ph-settings-field-timezone"><span>Timezone</span>
              <select class="ph-select" id="tzSelect"></select>
            </label>
            <label class="ph-settings-field ph-settings-field-coordinate"><span>Lat</span><input class="ph-input short" id="lat" step="0.0001" type="number"/></label>
            <label class="ph-settings-field ph-settings-field-coordinate"><span>Lon</span><input class="ph-input short" id="lon" step="0.0001" type="number"/></label>
            <button class="ph-btn ph-btn-secondary" id="setLatLon" type="button">Set</button>
          </div>
          <p class="ph-settings-echo ph-tiny" id="echo">—</p>
          <div class="ph-settings-row ph-settings-row-place" aria-label="Manual location search">
            <label class="ph-settings-field ph-location-search"><span>Search place</span>
              <input class="ph-input" id="locationSearch" list="locationOptions" placeholder="Search a preloaded place, e.g. Malden" type="search"/>
            </label>
            <datalist id="locationOptions"></datalist>
            <button class="ph-btn" id="applyLocation" type="button">Use selected location</button>
            <button class="ph-btn ph-btn-secondary" id="copyLink" type="button">Copy link</button>
            <span class="ph-location-note" id="locationNote">Choose a place to update latitude, longitude, and timezone together.</span>
          </div>
        </div>
        <div class="ph-settings-group ph-settings-group-time">
          <div class="ph-settings-group-title">Date &amp; time</div>
          <div class="ph-settings-row ph-settings-row-time">
            <label class="ph-switch ph-system-time-toggle"><input checked id="useSystem" type="checkbox"/><span>Use system date/time</span></label>
            <span class="ph-row-system-time" id="manualTime">
              <label class="ph-settings-field"><span>Date</span><input class="ph-input" id="datePick" type="date"/></label>
              <label class="ph-settings-field"><span>Time</span><input class="ph-input" id="timePick" type="time"/></label>
              <button class="ph-btn" id="applyDT" type="button">Apply</button>
            </span>
          </div>
        </div>
      </div>
    </details>
  </section>'''

text = text[:match.start()] + new_section + text[match.end():]

css_marker = '''  .ph-settings-body {
    margin-top: 0.9em;
    border-top: 1px solid var(--relphi-line);
    padding-top: 0.9em;
  }
'''
if css_marker not in text:
    raise SystemExit('settings CSS marker not found')

css = css_marker + r'''
  /* Settings UI: semantic rows, aligned fields, and quieter secondary actions. */
  .ph-settings-body { display:grid; gap:1rem; }
  .ph-settings-group { display:grid; gap:.65rem; }
  .ph-settings-group + .ph-settings-group { border-top:1px solid rgba(17,17,17,.09); padding-top:.85rem; }
  .ph-settings-group-title { color:#3f3a36; font-size:.78rem; font-weight:850; letter-spacing:.08em; text-transform:uppercase; }
  .ph-settings-row { display:grid; align-items:end; gap:.65rem; }
  .ph-settings-row-location { grid-template-columns:auto auto minmax(220px,1fr) minmax(115px,.45fr) minmax(115px,.45fr) auto; }
  .ph-settings-row-place { grid-template-columns:minmax(260px,1fr) auto auto; }
  .ph-settings-row-time { grid-template-columns:auto minmax(0,1fr); align-items:end; }
  .ph-settings-field { display:grid !important; min-width:0; gap:.28rem !important; color:#514b46 !important; font-size:.78rem; font-weight:750; line-height:1.1; }
  .ph-settings-field > span { padding-left:.2rem; }
  .ph-settings-field .ph-input,
  .ph-settings-field .ph-select { box-sizing:border-box; width:100%; min-width:0; min-height:2.55rem; }
  .ph-settings-field-coordinate .ph-input.short { width:100%; }
  .ph-settings-row .ph-btn,
  .ph-settings-row .ph-clock { min-height:2.55rem; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; white-space:nowrap; }
  .ph-settings-row .ph-clock { padding-inline:1rem; }
  .ph-btn-secondary { background:#fff; color:var(--relphi-red-dark); border:1px solid var(--relphi-line); box-shadow:none; }
  .ph-btn-secondary:hover,
  .ph-btn-secondary:focus { background:#fff7f5; color:var(--relphi-red-dark); border-color:rgba(220,31,24,.38); }
  .ph-settings-echo { margin:.05rem 0 0; padding:.45rem .6rem; border-radius:.65rem; background:rgba(255,255,255,.65); }
  .ph-location-note { grid-column:1 / -1; margin:0; padding-left:.2rem; }
  .ph-system-time-toggle { align-self:end; min-height:2.55rem; padding:.45rem .65rem; border:1px solid rgba(17,17,17,.09); border-radius:999px; background:#fff; white-space:nowrap; }
  .ph-row-system-time { display:grid; grid-template-columns:minmax(155px,1fr) minmax(135px,.8fr) auto; gap:.65rem; align-items:end; min-width:0; }
  @media (max-width: 980px) {
    .ph-settings-row-location { grid-template-columns:auto auto minmax(220px,1fr) minmax(115px,.5fr) minmax(115px,.5fr); }
    .ph-settings-row-location #setLatLon { grid-column:5; }
    .ph-settings-row-place { grid-template-columns:minmax(220px,1fr) auto auto; }
  }
  @media (max-width: 760px) {
    .ph-settings-body { gap:.85rem; }
    .ph-settings-row-location,
    .ph-settings-row-place,
    .ph-settings-row-time,
    .ph-row-system-time { grid-template-columns:1fr 1fr; }
    .ph-settings-row-location .ph-clock,
    .ph-settings-row-location #useGeo,
    .ph-settings-field-timezone,
    .ph-location-search,
    .ph-location-note,
    .ph-system-time-toggle,
    .ph-row-system-time { grid-column:1 / -1; }
    .ph-settings-row-location #setLatLon { grid-column:auto; }
    .ph-settings-row-place #applyLocation { grid-column:1; }
    .ph-settings-row-place #copyLink { grid-column:2; }
    .ph-row-system-time { display:grid; }
    .ph-row-system-time #applyDT { grid-column:1 / -1; }
  }
'''
text = text.replace(css_marker, css, 1)

path.write_text(text, encoding='utf-8')

# Extend the visual-ownership contract with the new semantic settings structure.
test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
if test_path.exists():
    test = test_path.read_text(encoding='utf-8')
    anchor = "assert.doesNotMatch(page,/nextDayCue\\.innerHTML = .*canonicalPlanetGlyphMarkup/);"
    addition = "\nassert.match(page,/ph-settings-row-location/);\nassert.match(page,/ph-settings-field-timezone/);\nassert.match(page,/ph-settings-row-place/);\nassert.match(page,/ph-settings-group-title\\\">Date &amp; time/);\nassert.match(page,/ph-btn-secondary/);"
    if addition.strip() not in test:
        if anchor not in test:
            raise SystemExit('test anchor not found')
        test = test.replace(anchor, anchor + addition, 1)
        test_path.write_text(test, encoding='utf-8')
