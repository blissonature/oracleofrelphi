from pathlib import Path

page_path = Path('planetaryhours.html')
test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
page = page_path.read_text()

marker = "  .ph-table tr.next {\n    background: rgba(220,31,24,0.045);\n  }\n"
block = """

  /* Mobile planetary-hours table: compact cards instead of a wide clipped table. */
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
        \"number time ruler\"
        \"light focus focus\";
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
"""
if 'Mobile planetary-hours table: compact cards instead of a wide clipped table.' not in page:
    if marker not in page:
        raise SystemExit('table marker not found')
    page = page.replace(marker, marker + block, 1)
page_path.write_text(page)

test = test_path.read_text()
anchor = "assert.doesNotMatch(page,/class=\\\"planet-marker/);\n"
checks = """assert.match(page,/Mobile planetary-hours table: compact cards instead of a wide clipped table/);\nassert.match(page,/@media \\(max-width: 700px\\)/);\nassert.match(page,/grid-template-areas:[\\s\\S]*\\\"number time ruler\\\"[\\s\\S]*\\\"light focus focus\\\"/);\nassert.match(page,/\\.ph-table \\{ min-width: 0; width: 100%; display: block; \\}/);\nassert.match(page,/\\.ph-table thead \\{ display: none; \\}/);\nassert.match(page,/overflow-x: hidden/);\n"""
if 'compact cards instead of a wide clipped table' not in test:
    if anchor not in test:
        raise SystemExit('test anchor not found')
    test = test.replace(anchor, anchor + checks, 1)
test_path.write_text(test)
