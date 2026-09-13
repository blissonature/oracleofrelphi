const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = process.env.RELPHI_TEST_URL || 'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';

async function ensureBoard(page) {
  await page.waitForSelector('#shortListPanel', { timeout:15000 });
  const hidden = await page.$eval('#shortListPanel', el => el.hidden || getComputedStyle(el).display === 'none');
  if (hidden) {
    for (const selector of ['#landingOpenBoard','#relphiOpenDrawingBoardCurrent']) {
      const node = await page.$(selector);
      if (node) { await node.click(); break; }
    }
  }
  await page.waitForFunction(() => {
    const panel = document.querySelector('#shortListPanel');
    const workspace = panel?.querySelector('.card-row-workspace');
    return panel && !panel.hidden && workspace && workspace.getBoundingClientRect().width > 0;
  }, { timeout:15000 });
}

async function waitStable(page) {
  await page.waitForFunction(() => document.documentElement.classList.contains('relphi-drawing-board-ui-stable'), { timeout:15000 });
  await page.waitForFunction(() => {
    const p = document.querySelector('#shortListPanel');
    return p?.classList.contains('relphi-drawing-board-ui-ready') &&
      p.querySelector('#drawingBoardOptionsButton') &&
      p.querySelector('.card-row-workspace-toolbar .relphi-zoom-row #zoomCardRowExtents');
  }, { timeout:15000 });
}

async function openOptions(page) {
  await page.click('#drawingBoardOptionsButton');
  await page.waitForFunction(() => document.querySelector('#shortListPanel')?.dataset.relphiReadingOptionsOpen === 'true');
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open #relphiSpreadTemplateSelect');
}

async function applyCeltic(page,name) {
  await openOptions(page);
  await page.selectOption('#relphiSpreadTemplateSelect','celtic-cross-10');
  const before = await page.evaluate(() => {
    const root = document.querySelector('#shortListPanel');
    const select = root?.querySelector('#relphiSpreadTemplateSelect');
    const ok = root?.querySelector('.relphi-options-ok');
    const state = window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return {
      selected:select?.value || null,
      optionsOpen:root?.dataset.relphiReadingOptionsOpen || null,
      okConnected:!!ok?.isConnected,
      okVisible:!!ok && ok.getBoundingClientRect().width > 0 && getComputedStyle(ok).visibility !== 'hidden',
      activeLayout:state?.activeLayout?.id || null,
      slotCount:state?.slotCount ?? null,
      controller:!!window.RelphiDrawingBoardLayoutController
    };
  });
  await page.click('.relphi-options-ok');
  try {
    await page.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id === 'celtic-cross-10', { timeout:10000 });
  } catch (error) {
    const after = await page.evaluate(() => {
      const root = document.querySelector('#shortListPanel');
      const state = window.RelphiDrawingBoardPrefabsBridge?.getState?.();
      return {
        optionsOpen:root?.dataset.relphiReadingOptionsOpen || null,
        rootClasses:root?.className || '',
        selectValue:root?.querySelector('#relphiSpreadTemplateSelect')?.value || null,
        okPresent:!!root?.querySelector('.relphi-options-ok'),
        activeLayout:state?.activeLayout?.id || null,
        currentLayout:state?.currentLayout?.id || null,
        slotCount:state?.slotCount ?? null,
        locked:state?.locked ?? null,
        hasCards:state?.hasCards ?? null,
        layoutSettling:root?.classList.contains('relphi-layout-settling') || false,
        controller:!!window.RelphiDrawingBoardLayoutController
      };
    });
    console.log(`${name} Options commit trace: ${JSON.stringify({before,after})}`);
    throw error;
  }
  await page.waitForFunction(() => !document.querySelector('#shortListPanel')?.classList.contains('relphi-layout-settling'), { timeout:10000 });
  await page.waitForFunction(() => document.querySelectorAll('#shortListPanel .card-row-board>.card-row-item').length === 10, { timeout:10000 });
  await page.waitForTimeout(120);
}

async function inspectCeltic(page) {
  return page.evaluate(() => {
    const root = document.querySelector('#shortListPanel');
    const workspace = root.querySelector('.card-row-workspace');
    const items = Array.from(root.querySelectorAll('.card-row-board>.card-row-item'));
    const rect = node => { const r=node.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}; };
    const faces = items.map(item => rect(item.querySelector(':scope>.card-row-card-wrap,:scope>.card-row-drop-card')));
    const labels = items.map(item => rect(item.querySelector(':scope>.card-row-position-panel')));
    const labelStyles = items.map(item => { const label=item.querySelector(':scope>.card-row-position-panel'); const s=getComputedStyle(label); return {left:s.left,right:s.right,top:s.top,bottom:s.bottom,width:s.width,position:s.position,transform:s.transform,display:s.display,visibility:s.visibility}; });
    const itemClasses = items.map(item => item.className);
    const wr=rect(workspace); const all=[...faces,...labels];
    const union={left:Math.min(...all.map(r=>r.left)),right:Math.max(...all.map(r=>r.right)),top:Math.min(...all.map(r=>r.top)),bottom:Math.max(...all.map(r=>r.bottom))};
    const crossing=items[1];
    return {workspace:wr,faces,labels,labelStyles,itemClasses,union,crossingRotation:getComputedStyle(crossing).getPropertyValue('--row-card-rotation').trim(),crossingRotated:crossing.classList.contains('relphi-celtic-crossing-rotated'),rootClasses:root.className,fitValue:Number(root.querySelector('#rowZoom')?.value||0)};
  });
}

function assertInside(inner,outer,label,tolerance=2) {
  assert.ok(inner.left >= outer.left - tolerance, `${label} extends left of workspace`);
  assert.ok(inner.right <= outer.right + tolerance, `${label} extends right of workspace`);
  assert.ok(inner.top >= outer.top - tolerance, `${label} is clipped at top`);
  assert.ok(inner.bottom <= outer.bottom + tolerance, `${label} is clipped at bottom`);
}

function assertTraditional(data) {
  const f=data.faces; assert.equal(f.length,10,'Celtic Cross must render ten positions');
  const cx=r=>(r.left+r.right)/2, cy=r=>(r.top+r.bottom)/2;
  assert.ok(cy(f[2])<cy(f[0]),'3 must be above 1'); assert.ok(cy(f[3])>cy(f[0]),'4 must be below 1'); assert.ok(cx(f[4])<cx(f[0]),'5 must be left of 1'); assert.ok(cx(f[5])>cx(f[1]),'6 must be right of the center');
  assert.ok(cx(f[1])>cx(f[0])+f[0].width*.45,'2 must begin separately to the right of 1'); assert.equal(data.crossingRotated,false,'empty position 2 must not be rotated'); assert.ok(data.crossingRotation==='0deg'||data.crossingRotation==='0','empty position 2 must be upright');
  const staff=f.slice(6), xs=staff.map(cx); assert.ok(Math.max(...xs)-Math.min(...xs)<3,'staff cards must share one vertical axis'); assert.ok(staff[3].top<staff[2].top&&staff[2].top<staff[1].top&&staff[1].top<staff[0].top,'staff must rise from 7 to 10');
  for(let i=1;i<staff.length;i++){const upper=staff[staff.length-i],lower=staff[staff.length-i-1];assert.ok(upper.bottom<=lower.top+2||lower.bottom<=upper.top+2,'staff cards must not overlap');}
  data.labels.forEach((label,index)=>assertInside(label,data.workspace,`label ${index+1}`,3)); data.faces.forEach((face,index)=>assertInside(face,data.workspace,`card ${index+1}`,3));
  for(let i=6;i<10;i++) assert.ok(data.labels[i].left>=data.faces[i].right-3,`staff label ${i+1} must sit beside its card`);
  const contentW=data.union.right-data.union.left,contentH=data.union.bottom-data.union.top; const fill=Math.max(contentW/data.workspace.width,contentH/data.workspace.height); assert.ok(fill>=.84,`zoom extents wastes too much available space (${(fill*100).toFixed(1)}% fill)`); assert.ok(fill<=1.01,'zoom extents must not overflow the workspace');
}

async function assertResetStable(page) {
  await openOptions(page);
  await page.evaluate(() => { window.__relphiResetSamples=[]; let count=0; function sample(){const b=document.querySelector('#drawingBoardOptionsButton');const visible=!!b&&b.getBoundingClientRect().width>0&&getComputedStyle(b).visibility!=='hidden'&&getComputedStyle(b).opacity!=='0';window.__relphiResetSamples.push(visible);if(++count<18)requestAnimationFrame(sample);} requestAnimationFrame(sample); });
  await page.click('.relphi-options-reset');
  await page.waitForFunction(() => {const s=window.RelphiDrawingBoardPrefabsBridge?.getState?.();return s&&!s.activeLayout&&s.slotCount===0&&!s.hasCards;},{timeout:10000});
  await page.waitForTimeout(350);
  const result=await page.evaluate(()=>({samples:window.__relphiResetSamples||[],buttonVisible:!!document.querySelector('#drawingBoardOptionsButton')&&document.querySelector('#drawingBoardOptionsButton').getBoundingClientRect().width>0,itemCount:document.querySelectorAll('#shortListPanel .card-row-board>.card-row-item').length,ready:document.querySelector('#shortListPanel')?.classList.contains('relphi-drawing-board-ui-ready'),stable:document.documentElement.classList.contains('relphi-drawing-board-ui-stable')}));
  assert.equal(result.itemCount,0,'Reset Board must leave zero positions'); assert.equal(result.buttonVisible,true,'Options button must remain visible after Reset Board'); assert.equal(result.ready,true,'Reset Board must not revoke UI readiness'); assert.equal(result.stable,true,'Reset Board must preserve stable UI mode'); assert.ok(result.samples.length>=8,'reset visibility sampler did not run'); assert.ok(result.samples.every(Boolean),'Options button disappeared during a painted reset frame');
}

async function testViewport(browser,viewport,name) {
  const page=await browser.newPage({viewport});
  await page.addInitScript(()=>{window.__relphiFouc={rawToolbarVisible:false,rawOptionsVisible:false,workspaceSeen:false,rawToolbarSample:null,rawOptionsSample:null};function visible(n){if(!n)return false;const s=getComputedStyle(n),r=n.getBoundingClientRect();return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.opacity!=='0'&&s.display!=='none';}function describe(n){if(!n)return null;const s=getComputedStyle(n),r=n.getBoundingClientRect(),root=document.querySelector('#shortListPanel');return{html:n.outerHTML.slice(0,1200),styleAttr:n.getAttribute('style')||'',computed:{display:s.display,visibility:s.visibility,opacity:s.opacity,position:s.position,zIndex:s.zIndex},rect:{width:r.width,height:r.height,left:r.left,top:r.top},panelClass:root?.className||'',documentClass:document.documentElement.className||'',bootStylePresent:!!document.getElementById('relphi-drawing-board-boot-style'),chromeStylePresent:!!document.getElementById('relphi-drawing-board-chrome-v2-style')};}function sample(){const root=document.querySelector('#shortListPanel'),workspace=root?.querySelector('.card-row-workspace');if(visible(workspace))window.__relphiFouc.workspaceSeen=true;const toolbar=root?.querySelector('.card-row-workspace-toolbar');if(visible(toolbar)&&!toolbar.querySelector('.relphi-zoom-row')){window.__relphiFouc.rawToolbarVisible=true;if(!window.__relphiFouc.rawToolbarSample)window.__relphiFouc.rawToolbarSample=describe(toolbar);}const rawOptions=root?.querySelector('.card-row-more-options:not(.relphi-reading-options-drawer)');if(visible(rawOptions)){window.__relphiFouc.rawOptionsVisible=true;if(!window.__relphiFouc.rawOptionsSample)window.__relphiFouc.rawOptionsSample=describe(rawOptions);}requestAnimationFrame(sample);}addEventListener('DOMContentLoaded',()=>requestAnimationFrame(sample),{once:true});});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000}); await ensureBoard(page); await waitStable(page);
  const fouc=await page.evaluate(()=>window.__relphiFouc); if(fouc.rawToolbarVisible||fouc.rawOptionsVisible)console.log(`${name} FOUC snapshot: ${JSON.stringify(fouc)}`); assert.equal(fouc.workspaceSeen,true,`${name}: dark board workspace never appeared`); assert.equal(fouc.rawToolbarVisible,false,`${name}: obsolete zoom toolbar painted`); assert.equal(fouc.rawOptionsVisible,false,`${name}: raw Options UI painted`);
  await applyCeltic(page,name); const data=await inspectCeltic(page); console.log(`${name} Celtic geometry: ${JSON.stringify({workspace:data.workspace,staffFaces:data.faces.slice(6),staffLabels:data.labels.slice(6),staffLabelStyles:data.labelStyles.slice(6),staffItemClasses:data.itemClasses.slice(6),union:data.union,fitValue:data.fitValue,rootClasses:data.rootClasses})}`); await page.screenshot({path:`test-results/drawing-board-${name}.png`,fullPage:false}); assertTraditional(data); await assertResetStable(page); await page.close();
}

(async()=>{const browser=await chromium.launch({headless:true});try{await testViewport(browser,{width:1365,height:900},'desktop');await testViewport(browser,{width:390,height:844},'mobile');console.log('Drawing Board runtime acceptance checks passed.');}finally{await browser.close();}})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});