from pathlib import Path

p = Path('tests/drawing-board-runtime.test.js')
text = p.read_text()
old = """  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool=\"snaps\"]').count(),1);
  const magnetGeometry=await mobile.locator('.relphi-tool-trigger[data-tool=\"snaps\"] svg').evaluate(svg=>{
"""
new = """  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool=\"snaps\"]').count(),1);
  const magnetSvg=mobile.locator('.relphi-tool-trigger[data-tool=\"snaps\"] svg');
  await magnetSvg.waitFor({state:'visible'});
  const magnetGeometry=await magnetSvg.evaluate(svg=>{
"""
if old not in text:
    raise SystemExit('magnet assertion anchor not found')
p.write_text(text.replace(old, new, 1))
