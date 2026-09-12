from pathlib import Path

page_path = Path('planetaryhours.html')
test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
page = page_path.read_text()
test = test_path.read_text()

old_css = '''  /* Mobile planetary-hours table: compact cards instead of a wide clipped table. */
  @media (max-width: 700px) {
    #tableSection { padding-inline: .75em; }
    #tableSection h2 { font-size: clamp(1.55rem, 8vw, 2.2rem); line-height: 1.08; }
    .ph-table-wrap { max-height: 520px; overflow-y: auto; overflow-x: hidden; }
    .ph-table { min-width: 0; width: 100%; display: block; }
    .ph-table thead { display: none; }
    .ph-table tbody { display: grid; }
    .ph-table tr {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      grid-template-areas:
        "number time ruler"
        "light focus focus";
      align-items: center;
      column-gap: .65rem;
      row-gap: .4rem;
      padding: .8rem .7rem;
      border-bottom: 1px solid var(--relphi-line);
    }
    .ph-table th,
    .ph-table td { padding: 0; border-bottom: 0; min-width: 0; }
    .ph-table td:nth-child(1) { grid-area: number; font-weight: 800; align-self: start; }
    .ph-table td:nth-child(2) { grid-area: time; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .ph-table td:nth-child(3) { grid-area: ruler; display: flex; align-items: center; justify-self: end; gap: .3rem; white-space: nowrap; }
    .ph-table td:nth-child(4) { grid-area: light; align-self: start; }
    .ph-table td:nth-child(5) { grid-area: focus; font-size: .86rem; line-height: 1.35; color: var(--relphi-muted); }
    .ph-table tr.active { box-shadow: inset 3px 0 var(--relphi-red); }
    .ph-table .ph-dot,
    .ph-table .ph-direct-canonical-glyph { flex: 0 0 auto; }
  }
'''
new_css = '''  /* Mobile planetary-hours table: compact cards instead of a wide clipped table. */
  @media (max-width: 700px) {
    #tableSection { padding-inline: .75em; }
    #tableSection h2 { font-size: clamp(1.55rem, 8vw, 2.2rem); line-height: 1.08; }
    .ph-table-wrap { max-height: none; overflow: visible; }
    .ph-table { min-width: 0; width: 100%; display: block; }
    .ph-table thead { display: none; }
    .ph-table tbody { display: grid; }
    .ph-table tr {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas:
        "number time"
        ". ruler"
        "light focus";
      align-items: start;
      column-gap: .8rem;
      row-gap: .45rem;
      padding: .9rem .8rem 1rem;
      border-bottom: 1px solid var(--relphi-line);
    }
    .ph-table th,
    .ph-table td { padding: 0; border-bottom: 0; min-width: 0; }
    .ph-table td:nth-child(1) { grid-area: number; font-weight: 800; line-height: 1.2; }
    .ph-table td:nth-child(2) { grid-area: time; white-space: nowrap; font-variant-numeric: tabular-nums; line-height: 1.2; }
    .ph-table td:nth-child(3) { grid-area: ruler; display: flex; align-items: center; justify-self: start; gap: .38rem; white-space: nowrap; font-weight: 650; }
    .ph-table td:nth-child(4) { grid-area: light; align-self: start; padding-top: .08rem; }
    .ph-table td:nth-child(5) { grid-area: focus; font-size: .86rem; line-height: 1.38; color: var(--relphi-muted); }
    .ph-table tr.active { box-shadow: inset 3px 0 var(--relphi-red); }
    .ph-table .ph-direct-canonical-glyph { flex: 0 0 auto; }
  }
'''
if old_css not in page:
    raise SystemExit('mobile table CSS target not found')
page = page.replace(old_css, new_css, 1)

old_row = '''      tr.innerHTML = '<td>' + r.index + '</td>' +
        '<td>' + fmtHM(r.start) + '–' + fmtHM(r.end) + '</td>' +
        '<td class="p-' + r.ruler.key + '"><span class="ph-dot"></span> ' + canonicalPlanetGlyphMarkup(r.ruler.key, r.ruler.name) + ' ' + r.ruler.name + '</td>' +
        '<td><span class="ph-badge ' + (r.isBright ? 'bright' : 'dark') + '">' + (r.isBright ? 'Bright' : 'Dark') + '</span></td>' +
        '<td>' + fullContextStatement(byKey[dayKey], r, rows) + '</td>';
'''
new_row = '''      tr.innerHTML = '<td>' + r.index + '</td>' +
        '<td>' + fmtHM(r.start) + '–' + fmtHM(r.end) + '</td>' +
        '<td class="p-' + r.ruler.key + '">' + canonicalPlanetGlyphMarkup(r.ruler.key, r.ruler.name) + ' ' + r.ruler.name + '</td>' +
        '<td><span class="ph-badge ' + (r.isBright ? 'bright' : 'dark') + '">' + (r.isBright ? 'Bright' : 'Dark') + '</span></td>' +
        '<td>' + fullContextStatement(byKey[dayKey], r, rows) + '</td>';
'''
if old_row not in page:
    raise SystemExit('hours table row target not found')
page = page.replace(old_row, new_row, 1)
page_path.write_text(page)

needle = "assert.doesNotMatch(page,/class=\\\"planet-marker/);\n"
addition = """assert.match(page,/\\.ph-table-wrap \\{ max-height: none; overflow: visible; \\}/);\nassert.match(page,/\\\"number time\\\"\\s*\\\"\\. ruler\\\"\\s*\\\"light focus\\\"/);\nassert.doesNotMatch(page,/r\\.ruler\\.key \\+ '\\\\"><span class=\\\"ph-dot\\\"><\\/span>/);\n"""
if addition not in test:
    if needle not in test:
        raise SystemExit('test insertion point not found')
    test = test.replace(needle, needle + addition, 1)
test_path.write_text(test)
