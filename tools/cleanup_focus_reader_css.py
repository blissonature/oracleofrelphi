from pathlib import Path

css=Path('drawing-board-workflow-v2.css')
text=css.read_text()
old='''@media(max-width:700px){\n  body .relphi-focus-card-host>.or-card.card-row-card.tarot-card-surface.relphi-surface--card{width:min(21rem,88vw)!important;min-width:min(21rem,88vw)!important;max-width:min(21rem,88vw)!important}\n  .relphi-focus-shell>footer{padding-bottom:max(.55rem,env(safe-area-inset-bottom))!important}\n}\n\n'''
if old not in text:
    raise SystemExit('obsolete focus-card-host block not found')
css.write_text(text.replace(old,'',1))

runtime=Path('tests/drawing-board-runtime.test.js')
text=runtime.read_text()
needle="""  assert.ok(desktopFocus?.sideBySide,'desktop focus view must show full art beside the Ledger entry');\n  assert.ok(desktopFocus.entryText>100,'desktop focus view must show the full Ledger entry');\n"""
if needle not in text:
    raise SystemExit('desktop focus assertion block not found')
replacement=needle+"  await desktop.screenshot({path:path.join(out,'drawing-board-desktop-focus-full-entry.png'),fullPage:true});\n"
runtime.write_text(text.replace(needle,replacement,1))
