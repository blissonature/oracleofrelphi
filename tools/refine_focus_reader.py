from pathlib import Path


def replace_once(path, old, new):
    p=Path(path)
    text=p.read_text()
    if old not in text:
        raise SystemExit(f'Expected block not found in {path}: {old[:140]!r}')
    p.write_text(text.replace(old,new,1))

# Force desktop art to resolve against the actual available grid-row height.
css='drawing-board-workflow-v2.css'
replace_once(css,
  '.relphi-focus-art{display:block!important;width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;border:1.5px solid #111!important;border-radius:10px!important;background:#fff!important;box-shadow:0 10px 26px rgba(0,0,0,.22)!important;transform:none!important;transform-origin:50% 50%!important}',
  '.relphi-focus-art{display:block!important;box-sizing:border-box!important;width:auto!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;border:1.5px solid #111!important;border-radius:10px!important;background:#fff!important;box-shadow:0 10px 26px rgba(0,0,0,.22)!important;transform:none!important;transform-origin:50% 50%!important}')

# Desktop QA must prove the art rectangle itself is fully contained.
runtime='tests/drawing-board-runtime.test.js'
replace_once(runtime,
  "    return art&&entry?{sideBySide:art.right<=entry.left+3,entryText:document.querySelector('.relphi-focus-entry')?.textContent?.trim().length||0}:null;",
  "    const pane=document.querySelector('.relphi-focus-art-pane')?.getBoundingClientRect();\n    return art&&entry&&pane?{sideBySide:art.right<=entry.left+3,entryText:document.querySelector('.relphi-focus-entry')?.textContent?.trim().length||0,artContained:art.top>=pane.top-2&&art.bottom<=pane.bottom+2&&art.left>=pane.left-2&&art.right<=pane.right+2}:null;")
replace_once(runtime,
  "  assert.ok(desktopFocus?.sideBySide,'desktop focus view must show full art beside the Ledger entry');\n  assert.ok(desktopFocus.entryText>100,'desktop focus view must show the full Ledger entry');",
  "  assert.ok(desktopFocus?.sideBySide,'desktop focus view must show full art beside the Ledger entry');\n  assert.ok(desktopFocus?.artContained,'desktop focus view must contain the entire card art above the film strip');\n  assert.ok(desktopFocus.entryText>100,'desktop focus view must show the full Ledger entry');")

# A completed Celtic Cross deliberately covers position 1 with position 2. Test
# swipe navigation from an exposed staff card instead of forcing a click through it.
iphone='tests/drawing-board-iphone-regressions.test.js'
replace_once(iphone,
  "  await page.click('#shortListPanel .card-row-item[data-relphi-position-id=\"covering\"] [data-row-card]');\n  await page.waitForSelector('.relphi-focus-reader',{state:'visible'});\n  await assertFocusReadingView(page);\n  const swipeTarget=page.locator('.relphi-focus-main');\n  await swipeTarget.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:77,isPrimary:true,clientX:320,clientY:340});\n  await swipeTarget.dispatchEvent('pointerup',{pointerType:'touch',pointerId:77,isPrimary:true,clientX:70,clientY:338});\n  await page.waitForFunction(()=>/crosses/i.test(document.querySelector('.relphi-focus-position')?.textContent||''));",
  "  await page.click('#shortListPanel .card-row-item[data-relphi-position-id=\"self\"] [data-row-card]');\n  await page.waitForSelector('.relphi-focus-reader',{state:'visible'});\n  await assertFocusReadingView(page);\n  const swipeTarget=page.locator('.relphi-focus-main');\n  await swipeTarget.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:77,isPrimary:true,clientX:320,clientY:340});\n  await swipeTarget.dispatchEvent('pointerup',{pointerType:'touch',pointerId:77,isPrimary:true,clientX:70,clientY:338});\n  await page.waitForFunction(()=>/house/i.test(document.querySelector('.relphi-focus-position')?.textContent||''));")
