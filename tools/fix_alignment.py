from pathlib import Path

js_path = Path('drawing-board-workflow-v2.js')
css_path = Path('drawing-board-workflow-v2.css')
test_path = Path('tests/drawing-board-runtime.test.js')
nav_path = Path('navloader.js')

js = js_path.read_text()
old_magnet = "if (kind === 'magnet') return '<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3z\"></path><path d=\"M6 7h4M14 7h4\"></path></svg>';"
new_magnet = "if (kind === 'magnet') return '<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 5v8a6 6 0 0 0 12 0V5h-4v8a2 2 0 0 1-4 0V5z\"></path><path d=\"M6 9h4M14 9h4\"></path></svg>';"
if old_magnet not in js:
    raise SystemExit('magnet source not found')
js = js.replace(old_magnet, new_magnet, 1)
js_path.write_text(js)

css = css_path.read_text()
marker = '#shortListPanel .relphi-workspace-tools{position:relative!important;display:flex!important;align-items:center!important;gap:.3rem!important}\n'
addition = '''#shortListPanel .relphi-workspace-tools{position:relative!important;display:flex!important;align-items:center!important;gap:.3rem!important}\n/* Keep the description-layer card name centered on the card, independent of the add/remove control. */\n#shortListPanel .card-row-workspace .or-card-layer.relphi-info-layer>.or-layer-head.relphi-info-static{display:grid!important;grid-template-columns:2rem minmax(0,1fr) 2rem!important;align-items:center!important;width:100%!important;min-width:0!important}\n#shortListPanel .card-row-workspace .or-card-layer.relphi-info-layer>.or-layer-head.relphi-info-static>.or-card-title-banner.card-title-link{grid-column:2!important;justify-self:center!important;align-self:center!important;width:max-content!important;max-width:100%!important;min-width:0!important;margin-inline:0!important;text-align:center!important;box-sizing:border-box!important}\n#shortListPanel .card-row-workspace .or-card-layer.relphi-info-layer>.or-layer-head.relphi-info-static>.or-card-layer-add{grid-column:3!important;justify-self:end!important;align-self:center!important;margin:0!important}\n'''
if marker not in css:
    raise SystemExit('workspace tools CSS marker not found')
css = css.replace(marker, addition, 1)
css_path.write_text(css)

test = test_path.read_text()
magnet_anchor = "  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool=\"snaps\"]').count(),1);\n"
magnet_test = '''  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="snaps"]').count(),1);\n  const magnetGeometry=await mobile.locator('.relphi-tool-trigger[data-tool="snaps"] svg').evaluate(svg=>{\n    const box=svg.getBBox();\n    const view=svg.viewBox.baseVal;\n    return {dx:(box.x+box.width/2)-(view.x+view.width/2),dy:(box.y+box.height/2)-(view.y+view.height/2)};\n  });\n  assert.ok(Math.abs(magnetGeometry.dx)<.25 && Math.abs(magnetGeometry.dy)<.25,'magnet glyph must be geometrically centered in its viewBox: '+JSON.stringify(magnetGeometry));\n'''
if magnet_anchor not in test:
    raise SystemExit('magnet test anchor not found')
test = test.replace(magnet_anchor, magnet_test, 1)

title_anchor = "  await mobile.click('.relphi-focus-close');\n\n  await mobile.locator('.card-row-item[data-row-index=\"1\"] .card-row-drop-card').click();"
title_test = '''  await mobile.click('.relphi-focus-close');\n  const titleGeometry=await mobile.locator('.card-row-item[data-row-index="0"] [data-row-card]').evaluate(card=>{\n    card.classList.add('relphi-description-open');\n    const layer=card.querySelector('.or-card-layer.relphi-info-layer');\n    const title=layer?.querySelector('.or-card-title-banner.card-title-link');\n    const head=layer?.querySelector('.or-layer-head.relphi-info-static');\n    if (!layer || !title || !head) return null;\n    const lr=layer.getBoundingClientRect(), tr=title.getBoundingClientRect(), hr=head.getBoundingClientRect();\n    return {layerDelta:(tr.left+tr.width/2)-(lr.left+lr.width/2),headDelta:(tr.left+tr.width/2)-(hr.left+hr.width/2)};\n  });\n  assert.ok(titleGeometry && Math.abs(titleGeometry.layerDelta)<1 && Math.abs(titleGeometry.headDelta)<1,'description-layer title must be centered on the card: '+JSON.stringify(titleGeometry));\n  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-description-title-centered.png'),fullPage:true});\n  await mobile.locator('.card-row-item[data-row-index="0"] [data-row-card]').evaluate(card=>card.classList.remove('relphi-description-open'));\n\n  await mobile.locator('.card-row-item[data-row-index="1"] .card-row-drop-card').click();'''
if title_anchor not in test:
    raise SystemExit('title test anchor not found')
test = test.replace(title_anchor, title_test, 1)
test_path.write_text(test)

nav = nav_path.read_text()
if "drawing-board-workflow-v2.css?v=31" not in nav or "drawing-board-workflow-v2.js?v=75" not in nav:
    raise SystemExit('expected Drawing Board cache versions not found')
nav = nav.replace('drawing-board-workflow-v2.css?v=31','drawing-board-workflow-v2.css?v=32',1)
nav = nav.replace('drawing-board-workflow-v2.js?v=75','drawing-board-workflow-v2.js?v=76',1)
nav_path.write_text(nav)
