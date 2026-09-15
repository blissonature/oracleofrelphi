from pathlib import Path
p=Path('tests/drawing-board-runtime.test.js')
s=p.read_text()
old="""  assert.ok(Math.abs(desktopOptions.left-desktopOptions.hostLeft)<=12,'Options must open on the left side of the Drawing Board');
  assert.ok(desktopOptions.left>=0 && desktopOptions.right<=desktopOptions.viewport,'Options must not be cut off horizontally');"""
new="""  assert.ok(desktopOptions.left>=0 && desktopOptions.left<=20,'Options must open against the left side of the viewport');
  assert.ok(desktopOptions.left>=0 && desktopOptions.right<=desktopOptions.viewport,'Options must not be cut off horizontally');
  assert.equal(desktopOptions.firstIsBulk,true,'the comma-separated master question field must remain first');"""
if old not in s: raise SystemExit('Options geometry assertion anchor not found')
s=s.replace(old,new,1)
anchor="""  assert.deepEqual(desktopErrors,[]);
  await desktop.close();

  await browser.close();"""
insert="""  assert.deepEqual(desktopErrors,[]);
  await desktop.close();

  const manual=await browser.newPage({viewport:{width:1024,height:768}});
  await manual.goto(base,{waitUntil:'domcontentloaded'});
  await waitReady(manual);
  await manual.click('#showAllCards');
  await manual.waitForSelector('[data-shortlist]',{state:'visible'});
  const manualAdd=manual.locator('[data-shortlist][aria-pressed="false"]').first();
  await manualAdd.click();
  await openBoard(manual);
  await manual.waitForSelector('#shortListPanel [data-row-card]',{state:'visible'});
  assert.equal(await manual.locator('#shortListPanel [data-row-reverse]').count(),1,'a card explicitly added from the Ledger must expose the manual flip control');
  assert.equal(await manual.locator('#shortListPanel .card-row-transform-box').evaluate(node=>getComputedStyle(node).display),'none','manually-added cards must still start with transform gizmos locked');
  await manual.screenshot({path:path.join(out,'drawing-board-desktop-manual-card-flipper.png'),fullPage:true});
  await manual.close();

  await browser.close();"""
if anchor not in s: raise SystemExit('manual-card test insertion anchor not found')
s=s.replace(anchor,insert,1)
p.write_text(s)
