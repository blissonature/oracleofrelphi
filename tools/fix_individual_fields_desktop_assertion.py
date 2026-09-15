from pathlib import Path
p=Path('tests/drawing-board-runtime.test.js')
text=p.read_text()
old="  assert.equal(await desktop.locator('#relphiPositionLabels').count(),0,'Options must not duplicate the question text into per-position fields');"
new="  assert.equal(await desktop.locator('#relphiPositionLabels').count(),1,'Options must keep the individual position-label editor beneath the comma-separated master field');"
if old not in text:
    raise SystemExit('stale desktop Options assertion not found')
p.write_text(text.replace(old,new,1))
