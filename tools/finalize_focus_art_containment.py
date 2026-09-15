from pathlib import Path

p=Path('drawing-board-workflow-v2.css')
text=p.read_text()
old_pane='.relphi-focus-art-pane{display:grid!important;place-items:center!important;min-width:0!important;min-height:0!important;overflow:hidden!important}'
new_pane='.relphi-focus-art-pane{display:grid!important;box-sizing:border-box!important;place-items:center!important;min-width:0!important;min-height:0!important;padding:.2rem!important;overflow:hidden!important}'
old_frame='.relphi-focus-art-frame{display:grid!important;box-sizing:border-box!important;place-items:center!important;width:100%!important;height:100%!important;min-height:0!important;padding:.2rem!important;overflow:hidden!important}'
new_frame='.relphi-focus-art-frame{display:grid!important;box-sizing:border-box!important;place-items:center!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;padding:0!important;overflow:hidden!important}'
old_art='.relphi-focus-art{display:block!important;box-sizing:border-box!important;width:auto!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;border:1.5px solid #111!important;border-radius:10px!important;background:#fff!important;box-shadow:0 10px 26px rgba(0,0,0,.22)!important;transform:none!important;transform-origin:50% 50%!important}'
new_art='.relphi-focus-art{display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;transform:none!important;transform-origin:50% 50%!important}'
for old,new in [(old_pane,new_pane),(old_frame,new_frame),(old_art,new_art)]:
    if old not in text:
        raise SystemExit('expected focus CSS rule not found: '+old[:80])
    text=text.replace(old,new,1)
p.write_text(text)

# Capture the desktop focus view before asserting geometry, so failed QA is inspectable.
t=Path('tests/drawing-board-runtime.test.js')
text=t.read_text()
old="""  assert.ok(desktopFocus?.sideBySide,'desktop focus view must show full art beside the Ledger entry');\n  assert.ok(desktopFocus?.artContained,'desktop focus view must contain the entire card art above the film strip');\n  assert.ok(desktopFocus.entryText>100,'desktop focus view must show the full Ledger entry');\n  await desktop.screenshot({path:path.join(out,'drawing-board-desktop-focus-full-entry.png'),fullPage:true});\n"""
new="""  await desktop.screenshot({path:path.join(out,'drawing-board-desktop-focus-full-entry.png'),fullPage:true});\n  assert.ok(desktopFocus?.sideBySide,'desktop focus view must show full art beside the Ledger entry: '+JSON.stringify(desktopFocus));\n  assert.ok(desktopFocus?.artContained,'desktop focus view must contain the entire card art above the film strip: '+JSON.stringify(desktopFocus));\n  assert.ok(desktopFocus.entryText>100,'desktop focus view must show the full Ledger entry');\n"""
if old not in text:
    raise SystemExit('desktop assertion block not found')
t.write_text(text.replace(old,new,1))
