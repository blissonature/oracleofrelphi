from pathlib import Path

# 1) Clear Cards: keep native page mode and Drawing Board state authoritative.
p=Path('tarot-app.js')
text=p.read_text()
old="""  function clearShortListCardsOnlyNative() {
    if (!(state.shortList || []).length) return;
    commitShortList([]);
  }
"""
new="""  function clearShortListCardsOnlyNative() {
    if (!(state.shortList || []).length) return;
    state.mode = 'board';
    state.cardRowBoardOpen = true;
    const trigger = $('relphiOpenDrawingBoardCurrent');
    if (trigger) {
      trigger.textContent = 'Close Drawing Board';
      trigger.setAttribute('aria-expanded', 'true');
    }
    commitShortList([]);
    const wrap = $('shortListPanel');
    if (wrap) {
      wrap.hidden = false;
      const drawer = wrap.querySelector('.card-row-drawing-board');
      if (drawer) drawer.open = true;
    }
  }
"""
if old not in text: raise SystemExit('clear cards anchor not found')
p.write_text(text.replace(old,new,1))

# 2) Unified workflow UX: reversed badge, keyboard navigation, no draw-gap, compact Options.
p=Path('drawing-board-workflow-v2.js')
text=p.read_text()
old='reader.innerHTML=`<div class="relphi-focus-shell"><header><strong class="relphi-focus-position"></strong><button type="button" class="relphi-focus-close" aria-label="Close focused card">×</button></header><div class="relphi-focus-main"><section class="relphi-focus-art-pane" aria-label="Card art"><div class="relphi-focus-art-frame"><img class="relphi-focus-art" alt=""></div></section><article class="relphi-focus-entry tarot-detail" aria-label="Full Tarot Ledger entry"></article></div><footer><button type="button" class="relphi-focus-prev" aria-label="Previous position">‹</button><div class="relphi-focus-strip" aria-label="Reading positions"></div><button type="button" class="relphi-focus-next" aria-label="Next position">›</button></footer></div>`;'
new='reader.innerHTML=`<div class="relphi-focus-shell"><header><div class="relphi-focus-heading"><strong class="relphi-focus-position"></strong><span class="relphi-focus-reversed-badge" hidden>Reversed</span></div><button type="button" class="relphi-focus-close" aria-label="Close focused card">×</button></header><div class="relphi-focus-main"><section class="relphi-focus-art-pane" aria-label="Card art"><div class="relphi-focus-art-frame"><img class="relphi-focus-art" alt=""></div></section><article class="relphi-focus-entry tarot-detail" aria-label="Full Tarot Ledger entry"></article></div><footer><button type="button" class="relphi-focus-prev" aria-label="Previous position">‹</button><div class="relphi-focus-strip" aria-label="Reading positions"></div><button type="button" class="relphi-focus-next" aria-label="Next position">›</button></footer></div>`;'
if old not in text: raise SystemExit('focus shell anchor not found')
text=text.replace(old,new,1)
old="""    const position=reader.querySelector('.relphi-focus-position');
    if (position) position.textContent=positionLabel(index);
    if (art && artSource) {
"""
new="""    const position=reader.querySelector('.relphi-focus-position');
    const reversedBadge=reader.querySelector('.relphi-focus-reversed-badge');
    if (position) position.textContent=positionLabel(index);
    if (reversedBadge) reversedBadge.hidden=!reversed;
    if (art && artSource) {
"""
if old not in text: raise SystemExit('focus render anchor not found')
text=text.replace(old,new,1)
old="""    if (cardAt(next)) openFocus(next);
    else {
      closeFocus({acknowledge:false});
      drawInto(focusItem(next),next);
    }
"""
new="""    if (cardAt(next)) openFocus(next);
    else {
      // Keep the current reader mounted while the next card is drawn. The
      // newly drawn card replaces it only when its complete focus view is ready,
      // avoiding the board/page flash between focus cards.
      drawInto(focusItem(next),next);
    }
"""
if old not in text: raise SystemExit('focus draw navigation anchor not found')
text=text.replace(old,new,1)
old="""  document.addEventListener('keydown',event=>{
    if (event.key!=='Escape') return;
    if (document.querySelector('.relphi-focus-reader')) closeFocus({acknowledge:true});
    else if (optionsSession) closeOptions(panel());
    else if (openTool) { openTool=''; enhance(panel()); }
  });
"""
new="""  document.addEventListener('keydown',event=>{
    const reader=document.querySelector('.relphi-focus-reader');
    const target=event.target;
    const editable=!!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || ''));
    if (reader && !editable && (event.key==='ArrowLeft' || event.key==='ArrowRight')) {
      event.preventDefault();
      navigateFocusBy(event.key==='ArrowLeft' ? -1 : 1);
      return;
    }
    if (event.key!=='Escape') return;
    if (reader) closeFocus({acknowledge:true});
    else if (optionsSession) closeOptions(panel());
    else if (openTool) { openTool=''; enhance(panel()); }
  });
"""
if old not in text: raise SystemExit('keydown anchor not found')
text=text.replace(old,new,1)
old="""        <label class=\"relphi-options-field\">Spread Template<select id=\"relphiSpreadTemplateSelect\" ${hasCards?'disabled':''}>${optionTemplateMarkup(draft)}</select></label>
        <label class=\"relphi-options-field relphi-bulk-questions\">Questions / position labels<textarea id=\"relphiBulkQuestions\" rows=\"3\" ${hasCards?'disabled':''} placeholder=\"Question one, question two, question three\">${escapeHtml(draft.labels.join(', '))}</textarea><small>Separate multiple questions with commas.</small></label>
        <div class=\"relphi-labels-section\">
          <div class=\"relphi-options-subhead\"><strong>Position labels</strong><button type=\"button\" id=\"relphiAddPosition\" ${hasCards?'disabled':''}>Add position</button></div>
          <div id=\"relphiPositionLabels\">${labelsMarkup(draft.labels)}</div>
        </div>
"""
new="""        <label class=\"relphi-options-field relphi-bulk-questions\">Questions / position labels<textarea id=\"relphiBulkQuestions\" rows=\"3\" ${hasCards?'disabled':''} placeholder=\"Question one, question two, question three\">${escapeHtml(draft.labels.join(', '))}</textarea><small>Tip: separate questions with commas. Each comma-separated entry becomes one position.</small></label>
        <label class=\"relphi-options-field\">Spread Template<select id=\"relphiSpreadTemplateSelect\" ${hasCards?'disabled':''}>${optionTemplateMarkup(draft)}</select></label>
"""
if old not in text: raise SystemExit('options fields anchor not found')
text=text.replace(old,new,1)
p.write_text(text)

# 3) Presentation: Options left, reversed callout outside art.
p=Path('drawing-board-workflow-v2.css')
text=p.read_text()
old='#shortListPanel .relphi-reading-options-drawer{position:absolute!important;top:.5rem!important;right:.5rem!important;left:auto!important;z-index:1900!important;display:flex!important;flex-direction:column!important;width:min(35rem,calc(100% - 1rem))!important;max-width:calc(100% - 1rem)!important;max-height:calc(100% - 1rem)!important;margin:0!important;border:1px solid rgba(17,17,17,.24)!important;border-radius:13px!important;background:#fffdf8!important;box-shadow:0 16px 38px rgba(0,0,0,.28)!important;text-align:left!important;overflow:hidden!important}'
new='#shortListPanel .relphi-reading-options-drawer{position:absolute!important;top:.5rem!important;left:.5rem!important;right:auto!important;z-index:1900!important;display:flex!important;flex-direction:column!important;width:min(35rem,calc(100% - 1rem))!important;max-width:calc(100% - 1rem)!important;max-height:min(calc(100% - 1rem),calc(100dvh - 2rem))!important;margin:0!important;border:1px solid rgba(17,17,17,.24)!important;border-radius:13px!important;background:#fffdf8!important;box-shadow:0 16px 38px rgba(0,0,0,.28)!important;text-align:left!important;overflow:hidden!important}'
if old not in text: raise SystemExit('options CSS anchor not found')
text=text.replace(old,new,1)
old='.relphi-focus-shell>header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;padding:.65rem .8rem!important;border-bottom:1px solid #ddd4cb!important;background:#fffdf8!important}\n.relphi-focus-position{display:inline-flex!important;align-items:center!important;min-height:2rem!important;padding:.35rem .62rem!important;border:1px solid rgba(17,17,17,.2)!important;border-radius:999px!important;background:#f3ede5!important;color:#111!important;font-size:.86rem!important;font-weight:900!important;line-height:1.2!important}'
new='.relphi-focus-shell>header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;padding:.65rem .8rem!important;border-bottom:1px solid #ddd4cb!important;background:#fffdf8!important}\n.relphi-focus-heading{display:flex!important;align-items:center!important;gap:.45rem!important;min-width:0!important}\n.relphi-focus-position{display:inline-flex!important;align-items:center!important;min-height:2rem!important;padding:.35rem .62rem!important;border:1px solid rgba(17,17,17,.2)!important;border-radius:999px!important;background:#f3ede5!important;color:#111!important;font-size:.86rem!important;font-weight:900!important;line-height:1.2!important}\n.relphi-focus-reversed-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:1.85rem!important;padding:.28rem .55rem!important;border:1.5px solid #b81712!important;border-radius:999px!important;background:#fff3f1!important;color:#a51612!important;font-size:.68rem!important;font-weight:950!important;letter-spacing:.07em!important;text-transform:uppercase!important;line-height:1!important}\n.relphi-focus-reversed-badge[hidden]{display:none!important}'
if old not in text: raise SystemExit('focus header CSS anchor not found')
text=text.replace(old,new,1)
p.write_text(text)

# 4) Cache bust enhanced assets.
p=Path('navloader.js')
text=p.read_text()
if "drawing-board-workflow-v2.css?v=33" not in text or "drawing-board-workflow-v2.js?v=78" not in text:
    raise SystemExit('nav cache anchors not found')
text=text.replace('drawing-board-workflow-v2.css?v=33','drawing-board-workflow-v2.css?v=34')
text=text.replace('drawing-board-workflow-v2.js?v=78','drawing-board-workflow-v2.js?v=79')
p.write_text(text)

# 5) Update static contracts for the streamlined Options UI and new UX.
p=Path('tests/drawing-board-single-owner.test.js')
text=p.read_text().replace('drawing-board-workflow-v2\\.js\\?v=78','drawing-board-workflow-v2\\.js\\?v=79')
text=text.replace("assert.match(board, /Separate multiple questions with commas/);","assert.match(board, /Tip: separate questions with commas/);\nassert.match(board, /relphi-focus-reversed-badge/);\nassert.match(board, /ArrowLeft/);\nassert.match(board, /ArrowRight/);")
p.write_text(text)

p=Path('tests/drawing-board-workflow-v2.test.js')
text=p.read_text()
text=text.replace("assert.match(board, /Add position/);\n","")
text=text.replace("assert.match(board, /relphi-focus-art/);","assert.match(board, /relphi-focus-art/);\nassert.match(board, /relphi-focus-reversed-badge/);\nassert.match(board, /ArrowLeft/);\nassert.match(board, /ArrowRight/);")
p.write_text(text)

p=Path('tests/drawing-board-bulk-questions.test.js')
text=p.read_text()
text=text.replace("assert.match(board, /Separate multiple questions with commas\\./);","assert.match(board, /Tip: separate questions with commas\\./);\nassert.doesNotMatch(board, /id=\"relphiPositionLabels\"/);\nassert.doesNotMatch(board, /id=\"relphiAddPosition\"/);")
p.write_text(text)

# 6) Browser regression assertions: no duplicate label list, left Options, badge, arrows, no focus gap.
p=Path('tests/drawing-board-runtime.test.js')
text=p.read_text()
old="""      reversedMeaning:entry.querySelectorAll('[data-relphi-focus-reversed]').length,
      mobileStack:ar.bottom<=er.top+3,
"""
new="""      reversedMeaning:entry.querySelectorAll('[data-relphi-focus-reversed]').length,
      reversedBadgeVisible:!!reader.querySelector('.relphi-focus-reversed-badge') && !reader.querySelector('.relphi-focus-reversed-badge').hidden,
      mobileStack:ar.bottom<=er.top+3,
"""
if old not in text: raise SystemExit('runtime focus result anchor not found')
text=text.replace(old,new,1)
old="""  assert.equal(result.artChildren,1,'nothing may be layered over the card art');
  if (result.reversed) {
"""
new="""  assert.equal(result.artChildren,1,'nothing may be layered over the card art');
  assert.equal(result.reversedBadgeVisible,result.reversed,'Reversed callout must exactly match the card orientation');
  if (result.reversed) {
"""
if old not in text: raise SystemExit('runtime badge assertion anchor not found')
text=text.replace(old,new,1)
old="""  await assertReadableFocus(mobile);
  await mobile.click('.relphi-focus-next');
  await mobile.waitForFunction(() => window.RelphiDrawingBoardOptionsBridge?.capture?.()?.rowPositionMeta?.some?.(meta => meta?.celticCrossAcknowledged === true));
"""
new="""  await assertReadableFocus(mobile);
  await mobile.keyboard.press('ArrowLeft');
  await mobile.waitForFunction(() => Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===0);
  await mobile.keyboard.press('ArrowRight');
  await mobile.waitForFunction(() => Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===1);
  await mobile.evaluate(()=>{
    window.__relphiFocusGap=false;
    window.__relphiFocusGapObserver=new MutationObserver(()=>{
      if (!document.querySelector('.relphi-focus-reader')) window.__relphiFocusGap=true;
    });
    window.__relphiFocusGapObserver.observe(document.body,{childList:true,subtree:true});
  });
  await mobile.click('.relphi-focus-next');
  await mobile.waitForFunction(() => Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===2);
  const focusGap=await mobile.evaluate(()=>{
    window.__relphiFocusGapObserver?.disconnect();
    return !!window.__relphiFocusGap;
  });
  assert.equal(focusGap,false,'drawing the next card from focus view must not expose a frame without the focus reader');
  await mobile.waitForFunction(() => window.RelphiDrawingBoardOptionsBridge?.capture?.()?.rowPositionMeta?.some?.(meta => meta?.celticCrossAcknowledged === true));
"""
if old not in text: raise SystemExit('runtime keyboard/flash anchor not found')
text=text.replace(old,new,1)
old="""  await mobile.fill('#relphiBulkQuestions',bulkQuestions.join(', '));
  assert.equal(await mobile.locator('#relphiPositionLabels .relphi-label-row').count(),3,'comma-separated questions should stage three positions');
  assert.deepEqual(await mobile.locator('#relphiPositionLabels .relphi-label-row input').evaluateAll(nodes=>nodes.map(node=>node.value)),bulkQuestions);
"""
new="""  await mobile.fill('#relphiBulkQuestions',bulkQuestions.join(', '));
  assert.equal(await mobile.locator('#relphiPositionLabels').count(),0,'Options must not duplicate comma-separated questions into a second label list');
  assert.equal(await mobile.locator('#relphiBulkQuestions').inputValue(),bulkQuestions.join(', '));
"""
if old not in text: raise SystemExit('runtime bulk duplicate anchor not found')
text=text.replace(old,new,1)
old="""  await waitReady(desktop);
  await openBoard(desktop);
  await applyCeltic(desktop);
"""
new="""  await waitReady(desktop);
  await openBoard(desktop);
  await desktop.click('#drawingBoardOptionsButton');
  await desktop.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  const desktopOptions=await desktop.locator('.relphi-reading-options-drawer.is-reading-options-open').evaluate(drawer=>{
    const r=drawer.getBoundingClientRect();
    const host=drawer.parentElement.getBoundingClientRect();
    const firstField=drawer.querySelector('.relphi-options-body>.relphi-options-field:first-child');
    return {left:r.left,right:r.right,viewport:innerWidth,hostLeft:host.left,firstIsBulk:!!firstField?.querySelector('#relphiBulkQuestions')};
  });
  assert.ok(Math.abs(desktopOptions.left-desktopOptions.hostLeft)<=12,'Options must open on the left side of the Drawing Board');
  assert.ok(desktopOptions.left>=0 && desktopOptions.right<=desktopOptions.viewport,'Options must not be cut off horizontally');
  assert.equal(desktopOptions.firstIsBulk,true,'comma-separated Questions / position labels must be the first Options field');
  assert.equal(await desktop.locator('#relphiPositionLabels').count(),0,'Options must not duplicate the question text into per-position fields');
  await desktop.screenshot({path:path.join(out,'drawing-board-desktop-options-left.png'),fullPage:true});
  await desktop.click('#relphiCancelOptions');
  await applyCeltic(desktop);
"""
if old not in text: raise SystemExit('runtime desktop options anchor not found')
text=text.replace(old,new,1)
p.write_text(text)
