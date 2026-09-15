from pathlib import Path

# Any native/restored path that opens the Drawing Board must synchronize the
# public open/close control, because the enhancement layer treats that control
# as the authoritative open state across rerenders.
p = Path('tarot-app.js')
text = p.read_text()
old = """      setVisible('shortListPanel', true);
      ['browsePanel','visibilityPanel','spreadPanel','datePanel','chartPanel','currentSkyPanel'].forEach(id => setVisible(id, false));
"""
new = """      setVisible('shortListPanel', true);
      const currentBoardTrigger = $('relphiOpenDrawingBoardCurrent');
      if (currentBoardTrigger) {
        currentBoardTrigger.textContent = 'Close Drawing Board';
        currentBoardTrigger.setAttribute('aria-expanded', 'true');
      }
      ['browsePanel','visibilityPanel','spreadPanel','datePanel','chartPanel','currentSkyPanel'].forEach(id => setVisible(id, false));
"""
if old not in text:
    raise SystemExit('native Drawing Board open anchor not found')
p.write_text(text.replace(old, new, 1))

# Add the path the device exposed: native/restored opening rather than the
# external Open Drawing Board control, followed by a real touch tap on Clear Cards.
p = Path('tests/drawing-board-clear-cards.test.js')
text = p.read_text()
anchor = """    assert.equal(redrawn.workspaceVisible,true,'freeform: workspace must remain visible after drawing again');

    console.log('Drawing Board Clear Cards preservation checks passed');
"""
insert = """    assert.equal(redrawn.workspaceVisible,true,'freeform: workspace must remain visible after drawing again');

    // Saved/restored sessions open through the hidden native landing control.
    // That path must synchronize the public Drawing Board open state before any
    // rerender, or Clear Cards can make the enhancement layer hide the panel.
    const restored=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await restored.goto(base,{waitUntil:'domcontentloaded'});
    await restored.waitForSelector('#relphiOpenDrawingBoardCurrent',{timeout:20000});
    await restored.waitForFunction(() => !!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge,{timeout:20000});
    await restored.evaluate(() => document.getElementById('landingOpenBoard')?.click());
    await restored.waitForSelector('#shortListPanel .card-row-workspace-toolbar.relphi-board-controller',{state:'visible'});
    assert.equal(await restored.locator('#relphiOpenDrawingBoardCurrent').getAttribute('aria-expanded'),'true','native/restored opening must synchronize the public Drawing Board open state');
    await drawCards(restored,1);
    const clearButton=restored.locator('#clearShortListCardsOnly');
    const clearHit=await clearButton.evaluate(button=>{
      const r=button.getBoundingClientRect();
      return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.id || '';
    });
    assert.equal(clearHit,'clearShortListCardsOnly','Clear Cards must be the actual touch target');
    await clearButton.tap();
    await restored.waitForFunction(() => document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length===0);
    await restored.waitForTimeout(150);
    const restoredAfter=await boardState(restored);
    assert.equal(restoredAfter.rootHidden,false,'restored board: Clear Cards must not hide Drawing Board');
    assert.notEqual(restoredAfter.rootDisplay,'none','restored board: Drawing Board must remain rendered');
    assert.equal(restoredAfter.workspaceVisible,true,'restored board: workspace must remain visible');
    assert.equal(restoredAfter.drawerOpen,true,'restored board: drawer must remain open');
    assert.equal(restoredAfter.triggerExpanded,'true','restored board: public open state must remain true');
    assert.equal(restoredAfter.slots,0,'restored freeform board: Clear Cards must leave zero slots');
    assert.equal(restoredAfter.placeholders,0,'restored freeform board: Clear Cards must not invent placeholders');
    await restored.screenshot({path:path.join(out,'drawing-board-mobile-clear-cards-restored-zero.png'),fullPage:true});
    await restored.close();

    console.log('Drawing Board Clear Cards preservation checks passed');
"""
if anchor not in text:
    raise SystemExit('Clear Cards regression insertion anchor not found')
p.write_text(text.replace(anchor, insert, 1))
