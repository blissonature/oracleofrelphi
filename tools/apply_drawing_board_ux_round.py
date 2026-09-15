from pathlib import Path
import re

ROOT=Path('.')

def read(path): return (ROOT/path).read_text()
def write(path,text): (ROOT/path).write_text(text)
def replace_once(text,old,new,label):
    if old not in text:
        raise SystemExit(f'missing anchor: {label}')
    return text.replace(old,new,1)

# --- unified Drawing Board workflow ---
p=Path('drawing-board-workflow-v2.js')
s=read(p)
s=replace_once(s,"  let openTool = '';\n  let showPositionStickers = readStickerVisibility();","  let openTool = '';\n  let transformEditingUnlocked = false;\n  let showPositionStickers = readStickerVisibility();",'transform lock state')

start=s.index('    zoomRow.appendChild(zoomOut);')
end_marker="    nativeOptions.setAttribute('aria-hidden','true');"
end=s.index(end_marker,start)+len(end_marker)
new_controls=r'''    zoomRow.appendChild(zoomOut);
    if (zoom) { zoom.classList.add('relphi-native-zoom'); zoomRow.appendChild(zoom); }
    if (zoomValue) zoomRow.appendChild(zoomValue);
    zoomRow.append(zoomIn,fit);

    const tools = document.createElement('div');
    tools.className='relphi-workspace-tools';
    tools.innerHTML = `<button type="button" class="relphi-tool-trigger relphi-more-button" data-tool="more" aria-label="More board tools" title="More board tools">…</button><div class="relphi-tool-flyout" hidden></div>`;
    const flyout = tools.querySelector('.relphi-tool-flyout');
    const renderFlyout = () => {
      const open=openTool==='more';
      flyout.hidden=!open;
      flyout.replaceChildren();
      tools.querySelector('.relphi-tool-trigger')?.classList.toggle('is-active',open);
      if (!open) return;

      const transformButton=document.createElement('button');
      transformButton.type='button';
      transformButton.id='relphiToggleTransformEditing';
      transformButton.textContent=transformEditingUnlocked?'Lock rotation & scale':'Unlock rotation & scale';
      transformButton.setAttribute('aria-pressed',String(transformEditingUnlocked));
      transformButton.addEventListener('click',event=>{
        event.preventDefault(); event.stopPropagation();
        transformEditingUnlocked=!transformEditingUnlocked;
        root.classList.toggle('relphi-transform-editing-unlocked',transformEditingUnlocked);
        renderFlyout();
      });
      flyout.appendChild(transformButton);

      const snapsHeading=document.createElement('strong'); snapsHeading.textContent='Snaps'; flyout.appendChild(snapsHeading);
      const posRow=document.createElement('div'); posRow.className='relphi-tool-row';
      posRow.append(controlLabel(snap,'Position snap'));
      [snapMinus,snapValue,snapPlus].filter(Boolean).forEach(node=>posRow.appendChild(node));
      flyout.appendChild(posRow);
      const rotRow=document.createElement('div'); rotRow.className='relphi-tool-row';
      rotRow.append(controlLabel(rotate,'Rotation snap'));
      [rotateMinus,rotateValue,rotatePlus].filter(Boolean).forEach(node=>rotRow.appendChild(node));
      flyout.appendChild(rotRow);
      if (resetLayout) { resetLayout.textContent='Reset layout'; flyout.appendChild(resetLayout); }

      const backgroundHeading=document.createElement('strong'); backgroundHeading.textContent='Background'; flyout.appendChild(backgroundHeading);
      if (envelopeColor) { const row=document.createElement('div'); row.className='relphi-tool-row'; row.append(controlLabel(envelopeColor,'Card / placeholder')); flyout.appendChild(row); }
      if (tableColor) { const row=document.createElement('div'); row.className='relphi-tool-row'; row.append(controlLabel(tableColor,'Board')); flyout.appendChild(row); }
      const imageRow=document.createElement('div'); imageRow.className='relphi-tool-row';
      if (tableUpload) { tableUpload.textContent='Upload board image'; imageRow.appendChild(tableUpload); }
      if (tableReset) { tableReset.textContent='Remove board image'; imageRow.appendChild(tableReset); }
      if (imageRow.children.length) flyout.appendChild(imageRow);
    };
    tools.querySelector('.relphi-tool-trigger').addEventListener('click',event => {
      event.preventDefault(); event.stopPropagation();
      openTool=openTool==='more'?'':'more';
      renderFlyout();
    });
    zoomRow.appendChild(tools);
    toolbar.appendChild(zoomRow);
    root.classList.toggle('relphi-transform-editing-unlocked',transformEditingUnlocked);
    renderFlyout();
    nativeOptions.hidden = true;
    nativeOptions.setAttribute('aria-hidden','true');'''
s=s[:start]+new_controls+s[end:]

s=replace_once(s,"    closeFocus({acknowledge:false});\n    focusIndex=index;","    const existingReader=document.querySelector('.relphi-focus-reader');\n    focusIndex=index;",'atomic focus replacement')
old_html='''    reader.innerHTML=`<div class="relphi-focus-shell"><header><div class="relphi-focus-heading"><strong class="relphi-focus-position"></strong><span class="relphi-focus-reversed-badge" hidden>Reversed</span></div><button type="button" class="relphi-focus-close" aria-label="Close focused card">×</button></header><div class="relphi-focus-main"><section class="relphi-focus-art-pane" aria-label="Card art"><div class="relphi-focus-art-frame"><img class="relphi-focus-art" alt=""></div></section><article class="relphi-focus-entry tarot-detail" aria-label="Full Tarot Ledger entry"></article></div><footer><button type="button" class="relphi-focus-prev" aria-label="Previous position">‹</button><div class="relphi-focus-strip" aria-label="Reading positions"></div><button type="button" class="relphi-focus-next" aria-label="Next position">›</button></footer></div>`;'''
new_html='''    reader.innerHTML=`<div class="relphi-focus-shell"><header><div class="relphi-focus-heading"><strong class="relphi-focus-position"></strong><span class="relphi-focus-reversed-badge" hidden>Reversed</span></div><div class="relphi-focus-actions"><button type="button" class="relphi-focus-draw">Draw</button><button type="button" class="relphi-focus-close" aria-label="Close focused card">×</button></div></header><div class="relphi-focus-main"><section class="relphi-focus-art-pane" aria-label="Card art"><div class="relphi-focus-art-frame"><img class="relphi-focus-art" alt=""></div></section><article class="relphi-focus-entry tarot-detail" aria-label="Full Tarot Ledger entry"></article></div><footer><button type="button" class="relphi-focus-prev" aria-label="Previous position">‹</button><div class="relphi-focus-strip" aria-label="Reading positions"></div><button type="button" class="relphi-focus-next" aria-label="Next position">›</button></footer></div>`;'''
s=replace_once(s,old_html,new_html,'focus Draw markup')
s=replace_once(s,"    reader.querySelector('.relphi-focus-next').addEventListener('click',()=>navigateFocusBy(1));\n    installFocusSwipe(reader);\n    document.body.appendChild(reader);","    reader.querySelector('.relphi-focus-next').addEventListener('click',()=>navigateFocusBy(1));\n    reader.querySelector('.relphi-focus-draw').addEventListener('click',()=>drawNextLogical(panel()));\n    installFocusSwipe(reader);\n    if (existingReader) existingReader.replaceWith(reader); else document.body.appendChild(reader);",'focus Draw binding')
s=replace_once(s,"      if (cardAt(target,root)) { pendingFocusIndex=null; setTimeout(()=>openFocus(target),0); }","      if (cardAt(target,root)) {\n        pendingFocusIndex=null;\n        if (configuredPositionCount()===0) zoomExtents();\n        setTimeout(()=>openFocus(target),0);\n      }",'freeform fit after draw')

insert_before='''  function globalCapture(event) {'''
clear_owner=r'''  function clearCardsOnly(root=panel()) {
    const bridge=optionsBridge();
    const trigger=document.getElementById('relphiOpenDrawingBoardCurrent');
    if (!root || !bridge || !trigger) return false;
    const snapshot=bridge.capture();
    if (!snapshot) return false;
    boardOpen=true;
    trigger.textContent='Close Drawing Board';
    trigger.setAttribute('aria-expanded','true');
    root.hidden=false;
    root.removeAttribute('hidden');
    snapshot.shortList=[];
    snapshot.shortListSelection=[];
    snapshot.rowCardReversals={};
    snapshot.rowCardManual=[];
    snapshot.rowDrawDeck=[];
    snapshot.rowDrawDeckSignature='';
    snapshot.cardRowBoardOpen=true;
    bridge.restore(snapshot);
    return true;
  }

'''
if clear_owner.strip() not in s:
    s=replace_once(s,insert_before,clear_owner+insert_before,'Clear Cards owner insertion')

draw_anchor='''    const drawTrigger=event.target.closest?.('#shortListPanel #drawRandomRowCard');'''
clear_capture=r'''    const clearCardsTrigger=event.target.closest?.('#shortListPanel #clearShortListCardsOnly');
    if (clearCardsTrigger && root?.contains(clearCardsTrigger)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearCardsOnly(root);
      return;
    }
'''
s=replace_once(s,draw_anchor,clear_capture+draw_anchor,'Clear Cards capture ownership')
write(p,s)

# --- native state: card provenance + manual-only flipper ---
p=Path('tarot-app.js')
s=read(p)
s=replace_once(s,"      rowCardReversals: { ...(state.rowCardReversals || {}) },","      rowCardReversals: { ...(state.rowCardReversals || {}) },\n      rowCardManual: rowCardManualArray(),",'snapshot manual card provenance')
s=replace_once(s,"    state.rowCardReversals = { ...(snapshot.rowCardReversals || {}) };","    state.rowCardReversals = { ...(snapshot.rowCardReversals || {}) };\n    state.rowCardManual = Array.isArray(snapshot.rowCardManual) ? snapshot.rowCardManual.slice(0,state.shortList.length).map(Boolean) : Array(state.shortList.length).fill(false);",'restore manual card provenance')
s=replace_once(s,"  function commitShortList(next) {\n    next = next.filter(Boolean);","  function commitShortList(next, options = {}) {\n    next = next.filter(Boolean);",'commit options')
s=replace_once(s,"    pushBoardUndo();\n    if (next.length) {","    const nextManual=rowCardManualForNextList(next, options.newCardsManual !== false);\n    pushBoardUndo();\n    if (next.length) {",'compute manual flags')
s=replace_once(s,"    state.shortList = next;\n    state.shortListSelection = state.shortListSelection.filter(id => next.includes(id));","    state.shortList = next;\n    state.rowCardManual = nextManual;\n    state.shortListSelection = state.shortListSelection.filter(id => next.includes(id));",'commit manual flags')
s=replace_once(s,"    state.rowCardReversals = {};\n    state.rowEnvelopeLayout = {};","    state.rowCardReversals = {};\n    state.rowCardManual = [];\n    state.rowEnvelopeLayout = {};",'clear manual flags')
s=replace_once(s,"    commitShortList([...state.shortList, draw.card.card_id]);","    commitShortList([...state.shortList, draw.card.card_id], { newCardsManual:false });",'random draw provenance')
manual_helpers=r'''  function rowCardManualArray(length = (state.shortList || []).length) {
    const source=Array.isArray(state.rowCardManual) ? state.rowCardManual : [];
    return Array.from({length},(_,index)=>!!source[index]);
  }
  function rowCardWasAddedManually(index) { return !!rowCardManualArray()[Number(index) || 0]; }
  function rowCardManualForNextList(next, defaultForNew = true) {
    const before=(state.shortList || []).slice();
    const flags=rowCardManualArray(before.length);
    const used=new Set();
    return next.map(cardId=>{
      let match=-1;
      for (let i=0;i<before.length;i++) {
        if (!used.has(i) && before[i]===cardId) { match=i; break; }
      }
      if (match>=0) { used.add(match); return !!flags[match]; }
      return !!defaultForNew;
    });
  }

'''
marker='''  function rowCardEnvelopeHtml(card, index, panel) {'''
if manual_helpers.strip() not in s:
    s=replace_once(s,marker,manual_helpers+marker,'manual card helper insertion')
s=replace_once(s,"    const reverseLabel = reversed ? 'Set card upright' : 'Reverse card';\n    const reverseButton = `<button class=\"card-row-reverse-toggle${reversed ? ' is-active' : ''}\" type=\"button\" data-row-reverse=\"${index}\" aria-pressed=\"${reversed ? 'true' : 'false'}\" title=\"${escapeHtml(reverseLabel)}\" aria-label=\"${escapeHtml(reverseLabel + ': ' + title(card))}\">↕</button>`;","    const reverseLabel = reversed ? 'Set card upright' : 'Reverse card';\n    const reverseButton = rowCardWasAddedManually(index) ? `<button class=\"card-row-reverse-toggle${reversed ? ' is-active' : ''}\" type=\"button\" data-row-reverse=\"${index}\" aria-pressed=\"${reversed ? 'true' : 'false'}\" title=\"${escapeHtml(reverseLabel)}\" aria-label=\"${escapeHtml(reverseLabel + ': ' + title(card))}\">↕</button>` : '';",'manual-only flipper')
write(p,s)

# --- CSS ---
p=Path('drawing-board-workflow-v2.css')
s=read(p)
old_drawer='#shortListPanel .relphi-reading-options-drawer{position:absolute!important;top:.5rem!important;left:.5rem!important;right:auto!important;z-index:1900!important;display:flex!important;flex-direction:column!important;width:min(35rem,calc(100% - 1rem))!important;max-width:calc(100% - 1rem)!important;max-height:min(calc(100% - 1rem),calc(100dvh - 2rem))!important;margin:0!important;border:1px solid rgba(17,17,17,.24)!important;border-radius:13px!important;background:#fffdf8!important;box-shadow:0 16px 38px rgba(0,0,0,.28)!important;text-align:left!important;overflow:hidden!important}'
new_drawer='#shortListPanel .relphi-reading-options-drawer{position:fixed!important;top:1rem!important;left:1rem!important;right:auto!important;bottom:1rem!important;z-index:1900!important;display:flex!important;flex-direction:column!important;width:min(35rem,calc(100vw - 2rem))!important;max-width:calc(100vw - 2rem)!important;max-height:none!important;margin:0!important;border:1px solid rgba(17,17,17,.24)!important;border-radius:13px!important;background:#fffdf8!important;box-shadow:0 16px 38px rgba(0,0,0,.28)!important;text-align:left!important;overflow:hidden!important}'
s=replace_once(s,old_drawer,new_drawer,'viewport-safe left Options drawer')
s=s.replace('#shortListPanel .relphi-tool-flyout{position:absolute!important;left:0!important;bottom:calc(100% + .45rem)!important;','#shortListPanel .relphi-tool-flyout{position:absolute!important;left:auto!important;right:0!important;bottom:calc(100% + .45rem)!important;',1)
append=r'''
/* Compact zoom toolbar: advanced board tools live behind the ellipsis. */
#shortListPanel .relphi-more-button{font-size:1.15rem!important;font-weight:900!important;line-height:1!important;letter-spacing:.08em!important}
#shortListPanel:not(.relphi-transform-editing-unlocked) .card-row-transform-box{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
#shortListPanel .relphi-tool-flyout>#relphiToggleTransformEditing{width:100%!important;min-height:2rem!important;margin:0!important;padding:.35rem .55rem!important;border:1px solid #bfb5ac!important;border-radius:7px!important;background:#fff!important;color:#111!important;font:inherit!important;font-size:.7rem!important;font-weight:850!important;text-align:left!important}
.relphi-focus-actions{display:flex!important;align-items:center!important;gap:.5rem!important}
.relphi-focus-draw{min-height:2.2rem!important;margin:0!important;padding:.42rem .85rem!important;border:1.5px solid #b81712!important;border-radius:8px!important;background:#dc1f18!important;color:#fff!important;font:inherit!important;font-size:.78rem!important;font-weight:900!important}
@media(max-width:700px){#shortListPanel .relphi-reading-options-drawer{top:.5rem!important;left:.5rem!important;bottom:.5rem!important;width:calc(100vw - 1rem)!important;max-width:calc(100vw - 1rem)!important}.relphi-focus-shell>header{gap:.45rem!important}.relphi-focus-actions{gap:.35rem!important}.relphi-focus-draw{padding:.38rem .65rem!important}}
'''
if 'Compact zoom toolbar: advanced board tools live behind the ellipsis.' not in s:
    s += append
write(p,s)

# --- cache busting ---
p=Path('navloader.js')
s=read(p)
s=s.replace("drawing-board-workflow-v2.css?v=35","drawing-board-workflow-v2.css?v=36")
s=s.replace("drawing-board-workflow-v2.js?v=79","drawing-board-workflow-v2.js?v=80")
write(p,s)

p=Path('tarot.html')
s=read(p)
m=re.search(r'tarot-app\.js\?v=(\d+)',s)
if not m: raise SystemExit('tarot-app version not found')
old=m.group(0); new=f"tarot-app.js?v={int(m.group(1))+1}"
s=s.replace(old,new,1)
write(p,s)
for test in Path('tests').glob('drawing-board-*.js'):
    t=read(test)
    if old in t:
        write(test,t.replace(old,new))

# --- runtime acceptance updates ---
p=Path('tests/drawing-board-runtime.test.js')
s=read(p)
old_block=r'''  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="snaps"]').count(),1);
  const magnetSvg=mobile.locator('.relphi-tool-trigger[data-tool="snaps"] svg');
  await magnetSvg.waitFor({state:'visible'});
  const magnetGeometry=await magnetSvg.evaluate(svg=>{
    const box=svg.getBBox();
    const view=svg.viewBox.baseVal;
    return {dx:(box.x+box.width/2)-(view.x+view.width/2),dy:(box.y+box.height/2)-(view.y+view.height/2)};
  });
  assert.ok(Math.abs(magnetGeometry.dx)<.25 && Math.abs(magnetGeometry.dy)<.25,'magnet glyph must be geometrically centered in its viewBox: '+JSON.stringify(magnetGeometry));
  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="background"]').count(),1);'''
new_block=r'''  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="more"]').count(),1,'advanced board tools should live behind one ellipsis button');
  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="snaps"]').count(),0,'Snaps should not occupy the main zoom toolbar');
  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="background"]').count(),0,'Background should not occupy the main zoom toolbar');
  const zoomOrder=await mobile.evaluate(()=>{
    const plus=document.querySelector('.relphi-zoom-step[aria-label="Zoom in"]');
    const fit=document.querySelector('#zoomCardRowExtents');
    return !!plus && !!fit && !!(plus.compareDocumentPosition(fit)&Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.equal(zoomOrder,true,'Zoom Extents must sit after the + button');
  await mobile.click('.relphi-tool-trigger[data-tool="more"]');
  await mobile.waitForSelector('.relphi-tool-flyout:not([hidden])',{state:'visible'});
  assert.equal(await mobile.locator('#rowSnapEnabled').count(),1,'ellipsis menu should contain Snaps');
  assert.equal(await mobile.locator('#rowTableColor').count(),1,'ellipsis menu should contain Background controls');
  assert.equal(await mobile.locator('#relphiToggleTransformEditing').getAttribute('aria-pressed'),'false','rotation and scale editing must begin locked');
  await mobile.click('.relphi-tool-trigger[data-tool="more"]');'''
s=replace_once(s,old_block,new_block,'runtime toolbar expectations')

old_first_focus="""  await mobile.waitForSelector('.relphi-focus-reader',{state:'visible'});\n  assert.equal(await mobile.locator('.relphi-focus-strip>button').count(),10);\n  await assertReadableFocus(mobile);\n  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-focus.png'),fullPage:true});\n  await mobile.click('.relphi-focus-close');"""
new_first_focus="""  await mobile.waitForSelector('.relphi-focus-reader',{state:'visible'});\n  assert.equal(await mobile.locator('.relphi-focus-strip>button').count(),10);\n  assert.equal(await mobile.locator('.relphi-focus-draw').count(),1,'Card Focus must keep Draw available');\n  assert.equal(await mobile.locator('#shortListPanel [data-row-reverse]').count(),0,'randomly drawn cards must not show the manual card flipper');\n  await assertReadableFocus(mobile);\n  const transformDisplay=await mobile.locator('.card-row-item[data-row-index=\"0\"] .card-row-transform-box').evaluate(node=>getComputedStyle(node).display);\n  assert.equal(transformDisplay,'none','rotation/scale gizmos must start hidden');\n  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-focus.png'),fullPage:true});\n  await mobile.click('.relphi-focus-draw');\n  await mobile.waitForFunction(() => Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===1);\n  assert.equal(await mobile.locator('.card-row-item[data-row-index=\"1\"] [data-row-card]').count(),1,'Draw in Card Focus must draw the next position');"""
s=replace_once(s,old_first_focus,new_first_focus,'focus Draw acceptance')

old_second=r'''  await mobile.locator('.card-row-item[data-row-index="1"] .card-row-drop-card').click();
  await mobile.waitForSelector('.card-row-item[data-row-index="1"] [data-row-card]',{state:'visible'});
  await mobile.waitForSelector('.relphi-focus-reader',{state:'visible'});
  await assertReadableFocus(mobile);'''
new_second=r'''  await mobile.waitForSelector('.relphi-focus-reader',{state:'visible'});
  await assertReadableFocus(mobile);'''
s=replace_once(s,old_second,new_second,'second focus now comes from Focus Draw')

# Add transform-unlock assertion after crossing screenshot, before closing focus.
anchor="""  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-celtic-crossed.png'),fullPage:true});\n  if (await mobile.locator('.relphi-focus-reader').count()) await mobile.click('.relphi-focus-close');"""
replacement="""  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-celtic-crossed.png'),fullPage:true});\n  if (await mobile.locator('.relphi-focus-reader').count()) await mobile.click('.relphi-focus-close');\n  await mobile.click('.relphi-tool-trigger[data-tool=\"more\"]');\n  await mobile.click('#relphiToggleTransformEditing');\n  const unlockedDisplay=await mobile.locator('.card-row-item[data-row-index=\"0\"] .card-row-transform-box').evaluate(node=>getComputedStyle(node).display);\n  assert.notEqual(unlockedDisplay,'none','explicit unlock should reveal rotation/scale editing');\n  await mobile.click('#relphiToggleTransformEditing');\n  assert.equal(await mobile.locator('#relphiToggleTransformEditing').getAttribute('aria-pressed'),'false');\n  await mobile.click('.relphi-tool-trigger[data-tool=\"more\"]');"""
s=replace_once(s,anchor,replacement,'transform unlock acceptance')
write(p,s)

# --- Clear Cards: add the desktop reproduction the user reported ---
p=Path('tests/drawing-board-clear-cards.test.js')
s=read(p)
anchor="""    await restored.close();\n\n    console.log('Drawing Board Clear Cards preservation checks passed');"""
replacement="""    await restored.close();\n\n    const desktop=await browser.newPage({viewport:{width:1024,height:768}});\n    await openBoard(desktop);\n    await drawCards(desktop,3);\n    await assertFreeformClearCardsLeavesZeroSlotBoard(desktop,3);\n    await desktop.screenshot({path:path.join(out,'drawing-board-desktop-clear-cards-freeform-zero.png'),fullPage:true});\n    await desktop.close();\n\n    console.log('Drawing Board Clear Cards preservation checks passed');"""
s=replace_once(s,anchor,replacement,'desktop Clear Cards reproduction')
write(p,s)

# Static contracts that pin exact cache versions are updated automatically.
for test in Path('tests').glob('drawing-board-*.js'):
    t=read(test)
    t=t.replace('drawing-board-workflow-v2.css?v=35','drawing-board-workflow-v2.css?v=36')
    t=t.replace('drawing-board-workflow-v2.js?v=79','drawing-board-workflow-v2.js?v=80')
    write(test,t)

print('Drawing Board UX round applied.')
