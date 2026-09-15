from pathlib import Path


def replace_once(path, old, new):
    p=Path(path)
    text=p.read_text()
    if old not in text:
        raise SystemExit(f'Expected block not found in {path}: {old[:140]!r}')
    p.write_text(text.replace(old,new,1))

# Expose the canonical Tarot Ledger entry renderer without duplicating its markup.
app=Path('tarot-app.js')
text=app.read_text()
needle="""  function renderDetail(card) {\n    const panel = $('cardDetail');\n    panel.innerHTML = cardDetailHtml(card);\n    bindCardNoteEditor(panel);\n\n  }\n"""
insert=needle+"""  window.RelphiTarotLedgerBridge = Object.freeze({\n    renderCardEntry(cardId, eyebrow = 'Tarot Ledger entry') {\n      const card = cardById(String(cardId || ''));\n      return card ? cardDetailHtml(card, eyebrow) : '';\n    },\n    titleFor(cardId) {\n      const card = cardById(String(cardId || ''));\n      return card ? title(card) : '';\n    },\n    bindCardEntry(root) {\n      if (!root) return;\n      bindCardNoteEditor(root);\n    }\n  });\n"""
if needle not in text:
    raise SystemExit('renderDetail insertion point not found')
app.write_text(text.replace(needle,insert,1))

# Replace the old overlay-style focus card with unobstructed art + canonical Ledger entry.
board=Path('drawing-board-workflow-v2.js')
text=board.read_text()
text=text.replace("  function optionsBridge() { return window.RelphiDrawingBoardOptionsBridge || null; }\n", "  function optionsBridge() { return window.RelphiDrawingBoardOptionsBridge || null; }\n  function ledgerBridge() { return window.RelphiTarotLedgerBridge || null; }\n", 1)
start=text.index('  function openLedgerFromCard(card) {')
end=text.index('  function isCrossingPosition(index) {', start)
new_block=r'''  function focusCardIsReversed(index, root = panel()) {
    const item=focusItem(index,root);
    const card=cardAt(index,root);
    return !!item?.classList?.contains('is-row-reversed') || card?.dataset?.rowReversed === 'true' || !!card?.classList?.contains('is-row-reversed');
  }
  function focusArtImage(card) {
    const art=card?.querySelector?.('.or-card-art');
    if (art?.tagName === 'IMG') return art;
    return art?.querySelector?.('img') || card?.querySelector?.('img') || null;
  }
  function addFocusReversedMeaning(entry, cardId, reversed) {
    entry.querySelectorAll('[data-relphi-focus-reversed]').forEach(node=>node.remove());
    if (!reversed) return;
    const meaning=window.RelphiTarotReversedMeanings?.meaningFor?.(cardId) || '';
    if (!meaning) return;
    const section=document.createElement('section');
    section.className='interpretation-card--priority relphi-focus-reversed';
    section.dataset.relphiFocusReversed=cardId;
    const heading=document.createElement('h3'); heading.textContent='Relphi-derived reversed interpretation';
    const body=document.createElement('p'); body.textContent=meaning;
    section.append(heading,body);
    const block=entry.querySelector('.full-entry-title-block');
    const upright=block?.querySelector(':scope > .locked-relphi-priority,:scope > .uhn-panel');
    if (upright) upright.insertAdjacentElement('afterend',section);
    else if (block) block.appendChild(section);
    else entry.prepend(section);
  }
  function renderFocusEntry(reader, index) {
    const card=cardAt(index);
    const cardId=String(card?.dataset?.rowCard || '');
    const artSource=focusArtImage(card);
    const reversed=focusCardIsReversed(index);
    const art=reader.querySelector('.relphi-focus-art');
    const entry=reader.querySelector('.relphi-focus-entry');
    const position=reader.querySelector('.relphi-focus-position');
    if (position) position.textContent=positionLabel(index);
    if (art && artSource) {
      art.src=artSource.currentSrc || artSource.src || '';
      art.alt=(artSource.alt || ledgerBridge()?.titleFor?.(cardId) || 'Tarot card') + (reversed ? ' — reversed' : '');
      art.classList.toggle('is-reversed',reversed);
    }
    if (entry) {
      entry.innerHTML=ledgerBridge()?.renderCardEntry?.(cardId,'Tarot Ledger entry') || '<p>Card entry unavailable.</p>';
      entry.querySelectorAll('.tarot-card-art,.full-entry-row-button').forEach(node=>node.remove());
      addFocusReversedMeaning(entry,cardId,reversed);
      ledgerBridge()?.bindCardEntry?.(entry);
      entry.scrollTop=0;
    }
  }
  function renderFocusStrip(reader, index) {
    const order=orderedNativePositionIndices();
    const strip=reader.querySelector('.relphi-focus-strip');
    strip.replaceChildren();
    order.forEach((nativeIndex,logicalIndex)=>{
      const button=document.createElement('button');
      button.type='button'; button.dataset.focusPosition=String(nativeIndex);
      button.classList.toggle('is-current',nativeIndex===index);
      button.classList.toggle('is-reversed',focusCardIsReversed(nativeIndex));
      const card=cardAt(nativeIndex);
      const img=focusArtImage(card)?.cloneNode(true);
      if (img) { img.removeAttribute('loading'); button.appendChild(img); }
      const span=document.createElement('span'); span.textContent=String(logicalIndex+1); button.appendChild(span);
      button.title=positionLabel(nativeIndex);
      button.addEventListener('click',()=>navigateFocusTo(nativeIndex));
      strip.appendChild(button);
    });
    setTimeout(()=>strip.querySelector('.is-current')?.scrollIntoView({block:'nearest',inline:'center'}),0);
  }
  function installFocusSwipe(reader) {
    const main=reader.querySelector('.relphi-focus-main');
    if (!main) return;
    let gesture=null;
    main.addEventListener('pointerdown',event=>{
      if (event.pointerType==='mouse') return;
      if (event.target.closest('button,a,input,textarea,select,label,[contenteditable="true"]')) return;
      gesture={id:event.pointerId,x:event.clientX,y:event.clientY,time:Date.now()};
    });
    main.addEventListener('pointercancel',()=>{gesture=null;});
    main.addEventListener('pointerup',event=>{
      if (!gesture || event.pointerId!==gesture.id) return;
      const dx=event.clientX-gesture.x;
      const dy=event.clientY-gesture.y;
      const elapsed=Date.now()-gesture.time;
      gesture=null;
      if (elapsed>1400 || Math.abs(dx)<56 || Math.abs(dx)<=Math.abs(dy)*1.25) return;
      navigateFocusBy(dx<0?1:-1);
    });
  }
  function openFocus(index) {
    const root=panel(); const card=cardAt(index,root);
    if (!root || !card || !ledgerBridge()) return false;
    closeFocus({acknowledge:false});
    focusIndex=index;
    const reader=document.createElement('section');
    reader.className='relphi-focus-reader';
    reader.dataset.focusIndex=String(index);
    reader.setAttribute('role','dialog');
    reader.setAttribute('aria-modal','true');
    reader.setAttribute('aria-label',positionLabel(index,root));
    reader.innerHTML=`<div class="relphi-focus-shell"><header><strong class="relphi-focus-position"></strong><button type="button" class="relphi-focus-close" aria-label="Close focused card">×</button></header><div class="relphi-focus-main"><section class="relphi-focus-art-pane" aria-label="Card art"><div class="relphi-focus-art-frame"><img class="relphi-focus-art" alt=""></div></section><article class="relphi-focus-entry tarot-detail" aria-label="Full Tarot Ledger entry"></article></div><footer><button type="button" class="relphi-focus-prev" aria-label="Previous position">‹</button><div class="relphi-focus-strip" aria-label="Reading positions"></div><button type="button" class="relphi-focus-next" aria-label="Next position">›</button></footer></div>`;
    renderFocusEntry(reader,index);
    renderFocusStrip(reader,index);
    reader.querySelector('.relphi-focus-close').addEventListener('click',()=>closeFocus({acknowledge:true}));
    reader.querySelector('.relphi-focus-prev').addEventListener('click',()=>navigateFocusBy(-1));
    reader.querySelector('.relphi-focus-next').addEventListener('click',()=>navigateFocusBy(1));
    installFocusSwipe(reader);
    document.body.appendChild(reader);
    document.body.classList.add('relphi-focus-open');
    return true;
  }
'''
board.write_text(text[:start]+new_block+text[end:])

# Replace focus reader CSS while preserving Drawing Board mobile rules.
css=Path('drawing-board-workflow-v2.css')
text=css.read_text()
start=text.index('.relphi-focus-open{overflow:hidden!important}')
end=text.index('/* Transactional drawer chrome never competes with its scrollable body. */', start)
new_css=r'''.relphi-focus-open{overflow:hidden!important}
.relphi-focus-reader{position:fixed!important;inset:0!important;z-index:100000!important;display:grid!important;place-items:center!important;padding:1.25rem!important;background:rgba(17,12,10,.72)!important;backdrop-filter:blur(8px)!important}
.relphi-focus-shell{display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;width:min(76rem,calc(100vw - 2rem))!important;height:min(54rem,calc(100dvh - 2rem))!important;max-height:calc(100dvh - 2rem)!important;border:1px solid rgba(255,255,255,.5)!important;border-radius:18px!important;background:#fffdf8!important;box-shadow:0 24px 70px rgba(0,0,0,.42)!important;overflow:hidden!important}
.relphi-focus-shell>header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;padding:.65rem .8rem!important;border-bottom:1px solid #ddd4cb!important;background:#fffdf8!important}
.relphi-focus-position{display:inline-flex!important;align-items:center!important;min-height:2rem!important;padding:.35rem .62rem!important;border:1px solid rgba(17,17,17,.2)!important;border-radius:999px!important;background:#f3ede5!important;color:#111!important;font-size:.86rem!important;font-weight:900!important;line-height:1.2!important}
.relphi-focus-close{display:grid!important;place-items:center!important;width:2.2rem!important;height:2.2rem!important;margin:0!important;padding:0!important;border:1px solid #bbb1a8!important;border-radius:50%!important;background:#fff!important;color:#111!important;font-size:1.35rem!important}
.relphi-focus-main{display:grid!important;grid-template-columns:minmax(16rem,.82fr) minmax(0,1.45fr)!important;gap:1rem!important;min-height:0!important;padding:.85rem!important;overflow:hidden!important;touch-action:pan-y!important;background:#fffdf8!important}
.relphi-focus-art-pane{display:grid!important;place-items:center!important;min-width:0!important;min-height:0!important;overflow:hidden!important}
.relphi-focus-art-frame{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;min-height:0!important;padding:.2rem!important}
.relphi-focus-art{display:block!important;width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;border:1.5px solid #111!important;border-radius:10px!important;background:#fff!important;box-shadow:0 10px 26px rgba(0,0,0,.22)!important;transform:none!important;transform-origin:50% 50%!important}
.relphi-focus-art.is-reversed{transform:rotate(180deg)!important}
.relphi-focus-entry{min-width:0!important;min-height:0!important;margin:0!important;padding:.2rem .4rem .9rem!important;overflow:auto!important;overscroll-behavior:contain!important;background:#fffdf8!important;color:#111!important;text-align:left!important}
.relphi-focus-entry>.eyebrow{margin:.1rem 0 .45rem!important}
.relphi-focus-entry .tarot-card-art{display:none!important}
.relphi-focus-entry .full-entry-row-button{display:none!important}
.relphi-focus-entry .full-entry-hero.system-card{grid-template-columns:1fr!important;grid-template-areas:"title" "ingredients"!important}
.relphi-focus-entry .full-entry-hero .full-entry-title-block{grid-area:title!important;max-width:none!important}
.relphi-focus-entry .full-entry-hero .locked-ingredients{grid-area:ingredients!important}
.relphi-focus-entry .full-entry-title-row,.relphi-focus-entry .full-entry-hero .locked-relphi-priority{max-width:100%!important}
.relphi-focus-entry .detail-glyph-panel{max-width:100%!important}
.relphi-focus-entry .full-entry-title-row h2,.relphi-focus-entry .full-entry-hero .full-entry-title-block h2,.relphi-focus-entry.tarot-detail h2{font-size:clamp(1.75rem,3vw,2.65rem)!important;line-height:1.02!important}
.relphi-focus-entry .relphi-focus-reversed{margin:.75rem 0 .25rem!important;padding:.8rem .95rem!important;border-left:4px solid var(--red,#dc1f18)!important;border-radius:.75rem!important;background:rgba(255,250,240,.72)!important}
.relphi-focus-entry .relphi-focus-reversed h3{margin:0 0 .45rem!important;font-size:.78rem!important;letter-spacing:.1em!important;text-transform:uppercase!important}
.relphi-focus-entry .relphi-focus-reversed p{margin:0!important;font-size:1.05rem!important;line-height:1.45!important}
.relphi-focus-shell>footer{display:grid!important;grid-template-columns:2.4rem minmax(0,1fr) 2.4rem!important;align-items:center!important;gap:.4rem!important;padding:.55rem .7rem!important;border-top:1px solid #ddd4cb!important;background:#faf6f1!important}
.relphi-focus-prev,.relphi-focus-next{display:grid!important;place-items:center!important;width:2.4rem!important;height:2.4rem!important;margin:0!important;padding:0!important;border:1px solid #bdb3aa!important;border-radius:8px!important;background:#fff!important;color:#111!important;font-size:1.5rem!important}
.relphi-focus-strip{display:flex!important;align-items:center!important;gap:.35rem!important;min-width:0!important;overflow-x:auto!important;scrollbar-width:thin!important;padding:.15rem!important}
.relphi-focus-strip>button{position:relative!important;flex:0 0 3rem!important;width:3rem!important;height:3.8rem!important;margin:0!important;padding:.15rem!important;border:2px solid transparent!important;border-radius:7px!important;background:#eee7df!important;color:#111!important;overflow:hidden!important}
.relphi-focus-strip>button.is-current{border-color:#dc1f18!important}
.relphi-focus-strip>button img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:4px!important;transform:none!important}
.relphi-focus-strip>button.is-reversed img{transform:rotate(180deg)!important}
.relphi-focus-strip>button span{position:absolute!important;right:.15rem!important;bottom:.15rem!important;display:grid!important;place-items:center!important;width:1.2rem!important;height:1.2rem!important;border-radius:50%!important;background:rgba(255,255,255,.9)!important;font-size:.6rem!important;font-weight:900!important}

@media(max-width:700px){
  #shortListPanel .card-row-workspace{height:clamp(23rem,58dvh,36rem)!important;min-height:clamp(23rem,58dvh,36rem)!important;max-height:clamp(23rem,58dvh,36rem)!important}
  #shortListPanel .card-row-drawing-board>summary{padding-left:3.6rem!important}
  #shortListPanel .drawing-board-top-actions{gap:.28rem!important;margin:.3rem .35rem!important;width:calc(100% - .7rem)!important}
  #shortListPanel .drawing-board-top-actions>button{padding:.4rem .48rem!important;font-size:.68rem!important}
  #shortListPanel .drawing-board-top-actions>.board-history-icon{width:2.1rem!important;min-width:2.1rem!important;height:2.1rem!important}
  #shortListPanel .card-row-workspace-toolbar.relphi-board-controller{left:.4rem!important;bottom:.4rem!important;max-width:calc(100% - .8rem)!important;padding:.3rem!important;gap:.25rem!important}
  #shortListPanel .relphi-zoom-row{gap:.22rem!important}
  #shortListPanel .relphi-zoom-row #rowZoom{width:min(25vw,6rem)!important;min-width:3.5rem!important}
  #shortListPanel .relphi-zoom-row #rowZoomValue{min-width:2.25rem!important;font-size:.58rem!important}
  #shortListPanel .relphi-zoom-step,#shortListPanel .relphi-icon-button,#shortListPanel .relphi-tool-trigger{width:1.85rem!important;min-width:1.85rem!important;height:1.85rem!important}
  #shortListPanel .relphi-reading-options-drawer{position:absolute!important;inset:.35rem!important;width:auto!important;max-width:none!important;max-height:calc(100% - .7rem)!important}
  #shortListPanel .relphi-draw-options{grid-template-columns:1fr!important}
  #shortListPanel .relphi-draw-options>label:not(:first-child){width:100%!important;white-space:normal!important}
  #shortListPanel .relphi-template-save{grid-template-columns:1fr!important}
  .relphi-focus-reader{padding:0!important;background:#fffdf8!important}
  .relphi-focus-shell{width:100vw!important;height:100dvh!important;max-height:100dvh!important;border:0!important;border-radius:0!important;box-shadow:none!important}
  .relphi-focus-shell>header{padding:.55rem .65rem!important}
  .relphi-focus-position{max-width:calc(100vw - 4rem)!important;font-size:.76rem!important;white-space:normal!important}
  .relphi-focus-main{display:block!important;padding:.55rem!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important}
  .relphi-focus-art-pane{display:grid!important;place-items:center!important;overflow:visible!important;padding:.15rem 0 .9rem!important}
  .relphi-focus-art-frame{width:100%!important;height:auto!important;padding:0!important}
  .relphi-focus-art{width:min(18rem,80vw)!important;height:auto!important;max-width:min(18rem,80vw)!important;max-height:none!important}
  .relphi-focus-entry{overflow:visible!important;padding:.2rem .1rem 1rem!important}
  .relphi-focus-entry .full-entry-title-row h2,.relphi-focus-entry .full-entry-hero .full-entry-title-block h2,.relphi-focus-entry.tarot-detail h2{font-size:clamp(1.65rem,8vw,2.25rem)!important}
  .relphi-focus-shell>footer{padding-bottom:max(.55rem,env(safe-area-inset-bottom))!important}
}
@media(max-width:430px){
  #shortListPanel .drawing-board-top-actions>#clearShortListCardsOnly{font-size:0!important}
  #shortListPanel .drawing-board-top-actions>#clearShortListCardsOnly::after{content:'Clear';font-size:.68rem!important}
  #shortListPanel .relphi-workspace-tools{gap:.18rem!important}
  #shortListPanel .relphi-zoom-step:first-child{display:none!important}
  #shortListPanel .relphi-tool-flyout{left:auto!important;right:0!important;width:min(20rem,calc(100vw - 1.4rem))!important}
}

'''
css.write_text(text[:start]+new_css+text[end:])

# Cache bust the focus redesign.
replace_once('navloader.js','drawing-board-workflow-v2.css?v=30','drawing-board-workflow-v2.css?v=31')
replace_once('navloader.js','drawing-board-workflow-v2.js?v=74','drawing-board-workflow-v2.js?v=75')

# Static ownership/workflow contracts.
replace_once('tests/drawing-board-single-owner.test.js','drawing-board-workflow-v2\\.js\\?v=74','drawing-board-workflow-v2\\.js\\?v=75')
workflow=Path('tests/drawing-board-workflow-v2.test.js')
text=workflow.read_text()
text=text.replace("assert.match(board, /function openFocus/);\nassert.match(board, /cloneNode\\(true\\)/);\nassert.match(css, /or-card-layer\\.relphi-info-layer/);\n", "assert.match(board, /function openFocus/);\nassert.match(app, /window\\.RelphiTarotLedgerBridge/);\nassert.match(board, /renderCardEntry/);\nassert.match(board, /function installFocusSwipe/);\nassert.match(board, /relphi-focus-art/);\nassert.match(css, /relphi-focus-main/);\nassert.match(css, /relphi-focus-entry/);\nassert.match(css, /relphi-focus-art\\.is-reversed/);\n")
workflow.write_text(text)

# Browser acceptance: new focus view = unobstructed art + full Ledger entry + correct reversal.
runtime=Path('tests/drawing-board-runtime.test.js')
text=runtime.read_text()
text=text.replace("!!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge", "!!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge && !!window.RelphiTarotLedgerBridge")
a=text.index('async function assertReadableFocus(page) {')
b=text.index('\n\n(async()=>{',a)
new_runtime=r'''async function assertReadableFocus(page) {
  const result=await page.evaluate(()=>{
    const reader=document.querySelector('.relphi-focus-reader');
    const art=reader?.querySelector('.relphi-focus-art');
    const entry=reader?.querySelector('.relphi-focus-entry');
    const position=reader?.querySelector('.relphi-focus-position');
    if (!reader || !art || !entry || !position) return {ok:false};
    const index=Number(reader.dataset.focusIndex);
    const item=document.querySelector(`#shortListPanel .card-row-item[data-row-index="${index}"]`);
    const card=item?.querySelector('[data-row-card]');
    const reversed=!!item?.classList.contains('is-row-reversed') || card?.dataset.rowReversed==='true' || !!card?.classList.contains('is-row-reversed');
    const matrix=new DOMMatrix(getComputedStyle(art).transform);
    const ar=art.getBoundingClientRect(), er=entry.getBoundingClientRect();
    return {
      ok:true,reversed,
      naturalWidth:art.naturalWidth,
      matrixA:matrix.a,matrixD:matrix.d,
      position:position.textContent.trim(),
      entryText:entry.textContent.trim(),
      hasTitle:!!entry.querySelector('.full-entry-title-block h2'),
      duplicateArtVisible:!!entry.querySelector('.tarot-card-art') && getComputedStyle(entry.querySelector('.tarot-card-art')).display!=='none',
      reversedMeaning:entry.querySelectorAll('[data-relphi-focus-reversed]').length,
      mobileStack:ar.bottom<=er.top+3,
      artChildren:reader.querySelector('.relphi-focus-art-frame')?.children.length || 0
    };
  });
  assert.equal(result.ok,true);
  assert.ok(result.naturalWidth>0,'focus art must load');
  assert.match(result.position,/\S/,'spread position must be visible outside the art');
  assert.ok(result.entryText.length>100,'focus view must contain the full Tarot Ledger entry');
  assert.equal(result.hasTitle,true,'full Ledger title block must be present');
  assert.equal(result.duplicateArtVisible,false,'Ledger entry must not duplicate or cover the dedicated card art');
  assert.equal(result.mobileStack,true,'mobile focus view must stack the full card above the Ledger entry');
  assert.equal(result.artChildren,1,'nothing may be layered over the card art');
  if (result.reversed) {
    assert.ok(result.matrixA<-.8 && result.matrixD<-.8,'a reversed draw must show reversed card art');
    assert.equal(result.reversedMeaning,1,'reversed meaning must appear only for a reversed draw');
  } else {
    assert.ok(result.matrixA>.8 && result.matrixD>.8,'an upright draw must show upright card art');
    assert.equal(result.reversedMeaning,0,'upright draws must not be labeled or interpreted as reversed');
  }
}
'''
text=text[:a]+new_runtime+text[b:]
# Add desktop side-by-side check at first desktop focus opening.
needle="""  await desktop.locator('.card-row-item[data-row-index=\"9\"] .card-row-drop-card').click();\n  await desktop.waitForSelector('.relphi-focus-reader',{state:'visible'});\n"""
if needle not in text:
    raise SystemExit('desktop focus insertion point not found')
addition=needle+r'''  const desktopFocus=await desktop.evaluate(()=>{
    const art=document.querySelector('.relphi-focus-art')?.getBoundingClientRect();
    const entry=document.querySelector('.relphi-focus-entry')?.getBoundingClientRect();
    return art&&entry?{sideBySide:art.right<=entry.left+3,entryText:document.querySelector('.relphi-focus-entry')?.textContent?.trim().length||0}:null;
  });
  assert.ok(desktopFocus?.sideBySide,'desktop focus view must show full art beside the Ledger entry');
  assert.ok(desktopFocus.entryText>100,'desktop focus view must show the full Ledger entry');
'''
text=text.replace(needle,addition,1)
runtime.write_text(text)

iphone=Path('tests/drawing-board-iphone-regressions.test.js')
text=iphone.read_text()
text=text.replace("!!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge", "!!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge && !!window.RelphiTarotLedgerBridge")
a=text.index('async function assertFocusArtVisible(page) {')
b=text.index('\n\n(async()=>{',a)
new_iphone=r'''async function assertFocusReadingView(page) {
  const result=await page.evaluate(()=>{
    const reader=document.querySelector('.relphi-focus-reader');
    const art=reader?.querySelector('.relphi-focus-art');
    const entry=reader?.querySelector('.relphi-focus-entry');
    const position=reader?.querySelector('.relphi-focus-position');
    if (!reader || !art || !entry || !position) return {ok:false};
    const index=Number(reader.dataset.focusIndex);
    const item=document.querySelector(`#shortListPanel .card-row-item[data-row-index="${index}"]`);
    const card=item?.querySelector('[data-row-card]');
    const reversed=!!item?.classList.contains('is-row-reversed') || card?.dataset.rowReversed==='true' || !!card?.classList.contains('is-row-reversed');
    const matrix=new DOMMatrix(getComputedStyle(art).transform);
    const ar=art.getBoundingClientRect(), er=entry.getBoundingClientRect();
    return {
      ok:true,reversed,naturalWidth:art.naturalWidth,
      matrixA:matrix.a,matrixD:matrix.d,
      position:position.textContent.trim(),
      fullEntry:entry.textContent.trim(),
      title:entry.querySelector('.full-entry-title-block h2')?.textContent?.trim()||'',
      stacked:ar.bottom<=er.top+3,
      artChildren:reader.querySelector('.relphi-focus-art-frame')?.children.length||0,
      reversedMeaning:entry.querySelectorAll('[data-relphi-focus-reversed]').length
    };
  });
  assert.equal(result.ok,true);
  assert.ok(result.naturalWidth>0,'card art must load');
  assert.match(result.position,/\S/,'the spread position must be shown outside the art');
  assert.ok(result.title.length>0,'the full Ledger entry title must be present');
  assert.ok(result.fullEntry.length>100,'the full Tarot Ledger entry must be present');
  assert.equal(result.stacked,true,'mobile must place the full card above the entry, never underneath it');
  assert.equal(result.artChildren,1,'no labels or interpretation may cover the card art');
  if (result.reversed) {
    assert.ok(result.matrixA<-.8 && result.matrixD<-.8,'reversed draw must visibly rotate the art');
    assert.equal(result.reversedMeaning,1,'reversed draw must get the reversed interpretation');
  } else {
    assert.ok(result.matrixA>.8 && result.matrixD>.8,'upright draw must keep the art upright');
    assert.equal(result.reversedMeaning,0,'upright draw must not be labeled reversed');
  }
}
'''
text=text[:a]+new_iphone+text[b:]
text=text.replace('await assertFocusArtVisible(page);','await assertFocusReadingView(page);')
# Add real swipe navigation after all ten cards exist.
needle="""  await page.screenshot({path:path.join(out,'drawing-board-mobile-celtic-full.png'),fullPage:true});\n\n  const jsonDownload=page.waitForEvent('download');\n"""
if needle not in text:
    raise SystemExit('iphone swipe insertion point not found')
swipe=r'''  await page.screenshot({path:path.join(out,'drawing-board-mobile-celtic-full.png'),fullPage:true});

  await page.click('#shortListPanel .card-row-item[data-relphi-position-id="covering"] [data-row-card]');
  await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
  await assertFocusReadingView(page);
  const swipeTarget=page.locator('.relphi-focus-main');
  await swipeTarget.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:77,isPrimary:true,clientX:320,clientY:340});
  await swipeTarget.dispatchEvent('pointerup',{pointerType:'touch',pointerId:77,isPrimary:true,clientX:70,clientY:338});
  await page.waitForFunction(()=>/crosses/i.test(document.querySelector('.relphi-focus-position')?.textContent||''));
  await page.click('.relphi-focus-close');
  await page.waitForSelector('.relphi-focus-reader',{state:'detached'});

  const jsonDownload=page.waitForEvent('download');
'''
text=text.replace(needle,swipe,1)
iphone.write_text(text)
