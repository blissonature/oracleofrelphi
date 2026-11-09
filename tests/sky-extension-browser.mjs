import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
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
  await worker.evaluate(()=>chrome.storage.local.set({linkDates:false,linkAddresses:false,dateOrder:'unambiguous'}));
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await browser.route('https://oracleofrelphi.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Sky Chart launch</title>'}));
  await page.goto('http://127.0.0.1:4173/tests/fixtures/sky-extension-sample.html');
  await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-relphi-sky-link]').count(),0,'Default page remains untouched');
  await worker.evaluate(()=>chrome.storage.local.set({linkDates:false,linkAddresses:true}));
  await page.waitForFunction(()=>document.querySelectorAll('[data-relphi-sky-link="address"]').length>=2);
  assert.equal(await page.locator('[data-relphi-sky-link="date"]').count(),0,'Dates still off');
  assert.equal(await page.locator('#existing a').count(),0,'No nested anchor modification');
  assert.equal(await page.locator('a#existing [data-relphi-sky-link]').count(),0,'Original hyperlink is untouched');
  assert.equal(await page.locator('input#editable').inputValue(),'November 9, 2026 in Salt Lake City, Utah');
  assert.equal(await page.locator('code [data-relphi-sky-link]').count(),0);
  await worker.evaluate(()=>chrome.storage.local.set({linkDates:true,linkAddresses:false}));
  await page.waitForFunction(()=>document.querySelectorAll('[data-relphi-sky-link="date"]').length>=1);
  assert.equal(await page.locator('[data-relphi-sky-link="address"]').count(),0,'Address-link option toggles independently');
  const opening=browser.waitForEvent('page');
  await page.locator('#date-text [data-relphi-sky-link="date"]').click();
  const newPage=await opening;await newPage.waitForLoadState('domcontentloaded');
  const packet=JSON.parse(new URLSearchParams(new URL(newPage.url()).hash.slice(1)).get('relphiSkyIntake'));
  assert.equal(packet.date,'2026-11-09');
  assert.equal(new URL(newPage.url()).pathname,'/sky-chart-preview/sky-chart.html','Draft extension must launch the working preview receiver');
  assert.equal(new URL(newPage.url()).searchParams.get('ref'),'a2cd9105d2ace34f3a12264203c41fb503eb7d7a');
  assert.equal(packet.location,'','A date link cannot steal an existing location');
  assert.equal(packet.time,'','A date link cannot invent a birth time');
  await newPage.close();
  await worker.evaluate(()=>chrome.storage.local.set({linkDates:true,linkAddresses:true}));
  await page.waitForFunction(()=>document.querySelectorAll('[data-relphi-sky-link="address"]').length>=2);
  await page.locator('#city-text [data-relphi-sky-link="address"]').focus();
  const openingAddress=browser.waitForEvent('page');
  await page.keyboard.press('Enter');
  const addressPage=await openingAddress;await addressPage.waitForLoadState('domcontentloaded');
  const value=JSON.parse(new URLSearchParams(new URL(addressPage.url()).hash.slice(1)).get('relphiSkyIntake'));
  assert.equal(value.location,'Salt Lake City, Utah');
  assert.equal(value.date,'');
  await addressPage.close();
  await worker.evaluate(()=>chrome.storage.local.set({linkDates:false,linkAddresses:false}));
  await page.waitForFunction(()=>document.querySelectorAll('[data-relphi-sky-link]').length===0);
  assert.deepEqual(errors,[],'No browser script exceptions');
  await page.screenshot({path:'sky-extension-links-desktop.png'});
  console.log('Extension automatic links independently toggled, original elements stayed intact, date/address opened correct partial Sky Chart URLs.');
}finally{await browser.close()}
