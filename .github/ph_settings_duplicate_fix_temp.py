from pathlib import Path

path = Path('planetaryhours.html')
text = path.read_text(encoding='utf-8')

old_clock = '            <span class="ph-clock" id="localClock">--:--</span>\n'
if old_clock not in text:
    raise SystemExit('visible local clock not found')
text = text.replace(old_clock, '', 1)

body_anchor = '      <div class="ph-settings-body">\n'
if body_anchor not in text:
    raise SystemExit('settings body anchor not found')
text = text.replace(body_anchor, body_anchor + '        <span class="ph-sr-only" id="localClock" aria-hidden="true">--:--</span>\n', 1)

text = text.replace(
    '.ph-settings-row-location { grid-template-columns:auto auto minmax(220px,1fr) minmax(115px,.45fr) minmax(115px,.45fr) auto; }',
    '.ph-settings-row-location { grid-template-columns:auto minmax(220px,1fr) minmax(115px,.45fr) minmax(115px,.45fr) auto; }',
    1,
)
text = text.replace(
    '.ph-settings-row-location { grid-template-columns:auto auto minmax(220px,1fr) minmax(115px,.5fr) minmax(115px,.5fr); }',
    '.ph-settings-row-location { grid-template-columns:auto minmax(220px,1fr) minmax(115px,.5fr) minmax(115px,.5fr) auto; }',
    1,
)

style_end = '</style>'
if style_end not in text:
    raise SystemExit('style end not found')
late_css = '''
  /* Settings correction: one visible time display and reliably legible secondary actions. */
  #controls .ph-btn.ph-btn-secondary {
    background:#fff !important;
    color:var(--relphi-red-dark) !important;
    border:1px solid var(--relphi-line) !important;
    box-shadow:none !important;
  }
  #controls .ph-btn.ph-btn-secondary:hover,
  #controls .ph-btn.ph-btn-secondary:focus {
    background:#fff7f5 !important;
    color:var(--relphi-red-dark) !important;
    border-color:rgba(220,31,24,.38) !important;
  }
'''
text = text.replace(style_end, late_css + style_end, 1)
path.write_text(text, encoding='utf-8')

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
if test_path.exists():
    test = test_path.read_text(encoding='utf-8')
    anchor = "assert.match(page,/ph-btn-secondary/);"
    addition = "\nassert.match(page,/class=\\\"ph-sr-only\\\" id=\\\"localClock\\\"/);\nassert.doesNotMatch(page,/class=\\\"ph-clock\\\" id=\\\"localClock\\\"/);\nassert.match(page,/#controls \\.ph-btn\\.ph-btn-secondary/);"
    if addition.strip() not in test:
        if anchor not in test:
            raise SystemExit('test anchor not found')
        test = test.replace(anchor, anchor + addition, 1)
        test_path.write_text(test, encoding='utf-8')
