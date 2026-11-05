import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1060,height:940}});
 await page.goto('http://127.0.0.1:4173/astrology-foundations.html',{waitUntil:'domcontentloaded'});
 await page.locator('[data-kind="systems"]').click();
 await page.locator('[data-system="Placidus"]').click();
 assert.equal(await page.locator('.house-system-stage svg .hs-house-fill').count(),12,'Valid default draws twelve wedges');
 let widths=await page.locator('.hs-span-table tbody tr').evaluateAll(rows=>rows.map(row=>Number(row.querySelector('td:nth-child(2)')?.textContent?.match(/\d+\.\d+/)?.[0])));
 assert.equal(await page.locator('#houseTeachMcSign').inputValue(),'Gemini');
 const spans=await page.locator('.hs-span-table tbody tr').evaluateAll(rows=>rows.map(row=>Number(rows.length&&row.cells[2].textContent.replace('°',''))));
 assert.ok(spans.every(x=>x>0&&x<180), 'No wraparound quadrants in valid example: '+spans);
 await page.locator('#houseTeachMcSign').selectOption('Capricorn');
 assert.equal(await page.locator('.house-engine-status.is-error').count(),1,'Impossible quadrant geometry gets a clear explanation');
 assert.equal(await page.locator('.hs-house-fill').count(),0,'Impossible angles never produce erroneous sector wedges');
 await page.locator('[data-system="Equal House"]').click();
 assert.equal(await page.locator('.hs-house-fill').count(),12,'Equal House remains calculable with independent MC');
 await page.locator('[data-system="Porphyry"]').click();
 assert.equal(await page.locator('.house-engine-status.is-error').count(),1);
 await page.locator('#houseTeachMcSign').selectOption('Gemini');
 assert.equal(await page.locator('.house-engine-status.is-error').count(),0);
 assert.equal(await page.locator('.hs-house-fill').count(),12);
 console.log('Foundations house quadrant ordering and validation passed.');
}finally{await browser.close()}
