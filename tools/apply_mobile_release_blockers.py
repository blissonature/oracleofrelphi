from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected block not found in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))


js = 'drawing-board-workflow-v2.js'
replace_once(
    js,
    "      position('self', CELTIC_LABELS[6], 7, transform(.68,.665,.48,0,4), { role:'self' }),\n      position('house', CELTIC_LABELS[7], 8, transform(.68,.445,.48,0,4), { role:'house' }),\n      position('hopes-fears', CELTIC_LABELS[8], 9, transform(.68,.225,.48,0,4), { role:'hopes-fears' }),\n      position('outcome', CELTIC_LABELS[9], 10, transform(.68,.005,.48,0,4), { role:'outcome' })",
    "      position('self', CELTIC_LABELS[6], 7, transform(.70,.69,.44,0,4), { role:'self' }),\n      position('house', CELTIC_LABELS[7], 8, transform(.70,.46,.44,0,4), { role:'house' }),\n      position('hopes-fears', CELTIC_LABELS[8], 9, transform(.70,.23,.44,0,4), { role:'hopes-fears' }),\n      position('outcome', CELTIC_LABELS[9], 10, transform(.70,.00,.44,0,4), { role:'outcome' })",
)
replace_once(
    js,
    "    const root=panel();\n    const drawTrigger=event.target.closest?.('#shortListPanel #drawRandomRowCard');",
    "    const root=panel();\n    const optionsTrigger=event.target.closest?.('#shortListPanel #drawingBoardOptionsButton');\n    if (optionsTrigger && root?.contains(optionsTrigger)) {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      openOptions(root);\n      return;\n    }\n    const drawTrigger=event.target.closest?.('#shortListPanel #drawRandomRowCard');",
)

css = 'drawing-board-workflow-v2.css'
replace_once(
    css,
    "#shortListPanel .drawing-board-top-actions{display:flex!important;align-items:center!important;gap:.4rem!important;flex-wrap:nowrap!important;width:calc(100% - 1rem)!important;margin:.35rem .5rem!important}",
    "#shortListPanel .drawing-board-top-actions{position:relative!important;z-index:1800!important;isolation:isolate!important;display:flex!important;align-items:center!important;gap:.4rem!important;flex-wrap:nowrap!important;width:calc(100% - 1rem)!important;margin:.35rem .5rem!important;pointer-events:auto!important;touch-action:manipulation!important}",
)
replace_once(
    css,
    "#shortListPanel .drawing-board-top-actions>button{min-height:2.25rem!important;margin:0!important;padding:.42rem .68rem!important;border:1.5px solid var(--relphi-board-ink)!important;border-radius:8px!important;background:#fff!important;color:var(--relphi-board-ink)!important;font:inherit!important;font-size:.78rem!important;font-weight:800!important;line-height:1!important;box-shadow:none!important;white-space:nowrap!important}",
    "#shortListPanel .drawing-board-top-actions>button{position:relative!important;z-index:1!important;min-height:2.25rem!important;margin:0!important;padding:.42rem .68rem!important;border:1.5px solid var(--relphi-board-ink)!important;border-radius:8px!important;background:#fff!important;color:var(--relphi-board-ink)!important;font:inherit!important;font-size:.78rem!important;font-weight:800!important;line-height:1!important;box-shadow:none!important;white-space:nowrap!important;pointer-events:auto!important;touch-action:manipulation!important}",
)

nav = 'navloader.js'
replace_once(nav, 'drawing-board-workflow-v2.css?v=29', 'drawing-board-workflow-v2.css?v=30')
replace_once(nav, 'drawing-board-workflow-v2.js?v=73', 'drawing-board-workflow-v2.js?v=74')

test = 'tests/drawing-board-iphone-regressions.test.js'
replace_once(
    test,
    'async function assertFocusArtVisible(page) {',
    """async function assertStaffLabelsExposed(page) {
  const result=await page.evaluate(()=>{
    const root=document.querySelector('#shortListPanel');
    const ids=new Set(['self','house','hopes-fears','outcome']);
    const faces=[...root.querySelectorAll('.card-row-board>.card-row-item')].map(item=>({item,face:item.querySelector('.card-row-card-wrap,.card-row-drop-card')})).filter(entry=>entry.face);
    const failures=[];
    root.querySelectorAll('.card-row-board>.card-row-item').forEach(item=>{
      if (!ids.has(item.dataset.relphiPositionId)) return;
      const label=item.querySelector('.card-row-position-panel');
      if (!label) { failures.push({id:item.dataset.relphiPositionId,reason:'missing-label'}); return; }
      const lr=label.getBoundingClientRect();
      const style=getComputedStyle(label);
      if (style.display==='none' || style.visibility==='hidden' || lr.width<4 || lr.height<4) failures.push({id:item.dataset.relphiPositionId,reason:'hidden-label'});
      faces.forEach(entry=>{
        if (entry.item===item) return;
        const r=entry.face.getBoundingClientRect();
        const overlaps=lr.left-2<r.right && lr.right+2>r.left && lr.top-2<r.bottom && lr.bottom+2>r.top;
        if (overlaps) failures.push({id:item.dataset.relphiPositionId,reason:'label-covered-by-card',other:entry.item.dataset.relphiPositionId||entry.item.dataset.rowIndex});
      });
    });
    return failures;
  });
  assert.deepEqual(result,[],'Celtic staff labels must be visibly separated from every card face');
}

async function assertFocusArtVisible(page) {""",
)
replace_once(
    test,
    "  const page=await browser.newPage({viewport:{width:390,height:844}});",
    "  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});\n  const page=await context.newPage();",
)
replace_once(
    test,
    "  for (const id of ['snapshotCardRowArrangement','downloadRowHtml','downloadRowTextHtml','downloadRowJson','printCardRowImage']) {\n    await page.waitForSelector(`#drawing-board-post-export #${id}`,{state:'visible',timeout:10000});\n  }\n\n  await applyTemplate(page,'celtic-cross-10');",
    """  for (const id of ['snapshotCardRowArrangement','downloadRowHtml','downloadRowTextHtml','downloadRowJson','printCardRowImage']) {
    await page.waitForSelector(`#drawing-board-post-export #${id}`,{state:'visible',timeout:10000});
  }

  const optionsHit=await page.locator('#drawingBoardOptionsButton').evaluate(button=>{
    const r=button.getBoundingClientRect();
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {pointer:getComputedStyle(button).pointerEvents,hit:hit?.closest?.('#drawingBoardOptionsButton')?.id||''};
  });
  assert.equal(optionsHit.pointer,'auto','Options must accept pointer/touch input');
  assert.equal(optionsHit.hit,'drawingBoardOptionsButton','Options touch target must not be covered by another layer');
  await page.locator('#drawingBoardOptionsButton').tap();
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await page.screenshot({path:path.join(out,'drawing-board-mobile-options-open.png'),fullPage:true});
  await page.locator('#relphiCancelOptions').tap();
  await page.waitForSelector('.relphi-reading-options-drawer',{state:'detached'});

  await applyTemplate(page,'celtic-cross-10');""",
)
replace_once(
    test,
    "  await assertContained(page);\n  const allLabels=await page.locator('#shortListPanel .card-row-position-panel').evaluateAll",
    "  await assertContained(page);\n  await assertStaffLabelsExposed(page);\n  const allLabels=await page.locator('#shortListPanel .card-row-position-panel').evaluateAll",
)
