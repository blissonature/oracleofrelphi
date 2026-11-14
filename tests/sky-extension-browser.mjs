import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const dir=path.resolve('chrome-extension/relphi-sky-intake');
const browser=await chromium.launchPersistentContext('',{
  channel:'chromium',headless:true,viewport:{width:1280,height:860},
  args:['--disable-extensions-except='+dir,'--load-extension='+dir]
});
try{
  let worker=browser.serviceWorkers()[0];
  if(!worker)worker=await browser.waitForEvent('serviceworker',{timeout:12000});
  assert.ok(worker.url().includes('background.js'),'Real MV3 background service worker started');
  await worker.evaluate(()=>chrome.storage.local.set({linkDates:false,linkAddresses:false,dateOrder:'unambiguous',target:'preview'}));
  const options=await browser.newPage();
  await options.goto('chrome-extension://'+new URL(worker.url()).hostname+'/options.html');
  assert.equal(await options.locator('#addresses').isChecked(),false,'Address linking defaults to opt-in');
  assert.equal(await options.locator('#dates').isChecked(),false,'Date linking defaults to opt-in');
  assert.equal(await options.locator('#target').inputValue(),'preview','Draft extension defaults to working review build');
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await browser.route('https://oracleofrelphi.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Sky Chart launch</title>'}));
  await page.goto('http://127.0.0.1:4173/tests/fixtures/sky-extension-sample.html');
  await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-relphi-sky-link]').count(),0,'Default page remains untouched');
  await options.locator('#addresses').check();
  await page.waitForFunction(()=>document.querySelectorAll('[data-relphi-sky-link="address"]').length>=2);
  assert.equal(await page.locator('[data-relphi-sky-link="date"]').count(),0,'Dates still off');
  assert.equal(await page.locator('#existing a').count(),0,'No nested anchor modification');
  assert.equal(await page.locator('a#existing [data-relphi-sky-link]').count(),0,'Original hyperlink is untouched');
  assert.equal(await page.locator('input#editable').inputValue(),'November 9, 2026 in Salt Lake City, Utah');
  assert.equal(await page.locator('code [data-relphi-sky-link]').count(),0);
  await options.locator('#addresses').uncheck();
  await options.locator('#dates').check();
  await page.waitForFunction(()=>document.querySelectorAll('[data-relphi-sky-link="date"]').length>=1);
  assert.equal(await page.locator('[data-relphi-sky-link="address"]').count(),0,'Address-link option toggles independently');
  const opening=browser.waitForEvent('page');
  await page.locator('#date-text [data-relphi-sky-link="date"]').click();
  const newPage=await opening;await newPage.waitForLoadState('domcontentloaded');
  const packet=JSON.parse(new URL(newPage.url()).searchParams.get('relphiDraft'));
  assert.equal(packet.date,'2026-11-09');
  assert.equal(packet.kind,'fields');
  assert.equal(new URL(newPage.url()).pathname,'/sky-chart-preview/sky-chart.html','Draft extension must launch the working preview receiver');
  assert.equal(new URL(newPage.url()).searchParams.get('ref'),'afa1a01b812d44cf25e4f2e2ffaca2eadf1c1879');
  assert.equal(packet.location,'','A date link cannot steal an existing location');
  assert.equal(packet.time,'','A date link cannot invent a birth time');
  await newPage.close();
  await options.locator('#addresses').check();
  await page.waitForFunction(()=>document.querySelectorAll('[data-relphi-sky-link="address"]').length>=2);
  await page.locator('#city-text [data-relphi-sky-link="address"]').focus();
  const openingAddress=browser.waitForEvent('page');
  await page.keyboard.press('Enter');
  const addressPage=await openingAddress;await addressPage.waitForLoadState('domcontentloaded');
  const value=JSON.parse(new URL(addressPage.url()).searchParams.get('relphiDraft'));
  assert.equal(value.kind,'fields');
  assert.equal(value.location,'Salt Lake City, Utah');
  assert.equal(value.date,'');
  await addressPage.close();
  await options.locator('#dates').uncheck();
  await options.locator('#addresses').uncheck();
  await options.locator('#dateOrder').selectOption('mdy');
  await options.locator('#target').selectOption('live');
  await page.waitForFunction(()=>document.querySelectorAll('[data-relphi-sky-link]').length===0);
  const stored=await worker.evaluate(()=>chrome.storage.local.get(['linkDates','linkAddresses','dateOrder','target']));
  assert.deepEqual(JSON.parse(JSON.stringify(stored)),{linkDates:false,linkAddresses:false,dateOrder:'mdy',target:'live'});
  await options.reload();
  assert.equal(await options.locator('#dateOrder').inputValue(),'mdy','Date order persists through settings reload');
  assert.equal(await options.locator('#target').inputValue(),'live','Destination persists through settings reload');
  await options.locator('#target').selectOption('preview');
  await page.waitForFunction(()=>document.querySelectorAll('[data-relphi-sky-link]').length===0);
  assert.deepEqual(errors,[],'No browser script exceptions');
  await page.screenshot({path:'sky-extension-links-desktop.png'});
  const preview=await browser.newPage();
  await preview.goto('http://127.0.0.1:4173/chrome-extension/relphi-sky-intake/preview.html');
  await preview.waitForFunction(()=>document.querySelector('#report')?.textContent.includes('2026-11-09'));
  assert.equal(await preview.locator('#open').isEnabled(),true,'Interactive parser preview recognizes complete Where and When');
  await preview.locator('#open').click();
  await preview.waitForURL(/sky-chart-preview\/sky-chart\.html\?ref=/,{timeout:15000});
  const previewPacket=JSON.parse(new URL(preview.url()).searchParams.get('relphiSingle')).event;
  assert.equal(previewPacket.time,'03:15');
  assert.equal(previewPacket.location,'Salt Lake City, Utah');
  await preview.screenshot({path:'sky-extension-preview-desktop.png'});
  await preview.close();
  // Exercise the real MV3 message handler with the reported full selected block.
  const birth=[
    '**Birth Data**',
    '- **Date of Birth:** June 14, 1946',
    '- **Time of Birth:** 10:54 AM EDT',
    '- **Location:** Jamaica, Queens, New York'
  ].join('\n');
  const openBirth=browser.waitForEvent('page');
  const sent=await options.evaluate(text=>new Promise(resolve=>
    chrome.runtime.sendMessage({action:'openCandidate',kind:'selection',text},resolve)),birth);
  assert.equal(sent.ok,true);
  const birthPage=await openBirth;
  await birthPage.waitForLoadState('domcontentloaded');
  const complete=JSON.parse(new URL(birthPage.url()).searchParams.get('relphiSingle')).event;
  assert.deepEqual({date:complete.date,time:complete.time,location:complete.location,zone:complete.timeZoneAbbreviation},
    {date:'1946-06-14',time:'10:54',location:'Jamaica, Queens, New York',zone:'EDT'});
  await birthPage.close();
  const openPartial=browser.waitForEvent('page');
  const partialSent=await options.evaluate(text=>new Promise(resolve=>
    chrome.runtime.sendMessage({action:'openCandidate',kind:'selection',text},resolve)),
    '**Date of Birth:** June 14, 1946\n**Time of Birth:** 10:54 AM EDT');
  assert.equal(partialSent.ok,true);
  const partialPage=await openPartial;
  await partialPage.waitForLoadState('domcontentloaded');
  const draft=JSON.parse(new URL(partialPage.url()).searchParams.get('relphiDraft'));
  assert.deepEqual({kind:draft.kind,date:draft.date,time:draft.time,location:draft.location},
    {kind:'fields',date:'1946-06-14',time:'10:54',location:''});
  await partialPage.close();
  await options.close();
  console.log('Extension Options UI and interactive preview passed in Chromium; independent links preserve existing controls and launch partial data.');
}finally{await browser.close()}
