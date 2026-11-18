import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const d=((longitude%360)+360)%360,within=d%30;
  return{name,longitude:d,sign:SIGNS[Math.floor(d/30)],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0};
}
function sky(name,offset){
  const asc=168.38+offset,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28,Chiron:74.48};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{source:'where-when-v3',dateTime:'2026-11-18T10:30',instant:'2026-11-18T17:30:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'equal-house',houseCusps:cusps},
    placements:Object.fromEntries(Object.entries(raw).map(([id,d])=>[id,placement(id,d+offset)]))};
}
async function readPdf(download){
  const bytes=await fs.readFile(await download.path());
  assert.equal(bytes.subarray(0,5).toString(),'%PDF-','Download must be a real PDF document');
  const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:true,disableFontFace:true});
  const document=await task.promise;
  const text=[];
  for(let i=1;i<=document.numPages;i++){
    const page=await document.getPage(i);
    text.push((await page.getTextContent()).items.map(item=>item.str).join(' '));
  }
  await document.destroy();
  return{pages:text.length,text:text.join('\n'),bytes:bytes.length};
}
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
page.route('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',route=>route.fulfill({path:path.resolve('node_modules/jspdf/dist/jspdf.umd.min.js'),contentType:'application/javascript'}));
page.route('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js',route=>route.fulfill({path:path.resolve('node_modules/html-to-image/dist/html-to-image.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  localStorage.setItem('relphiSkyVocabDisplayV1',JSON.stringify({glyphs:false,names:false,referents:true}));
},{a:sky('First Sky',0),b:sky('Second Sky',29.27)});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
await page.waitForSelector('#skyFoundationRelationshipList .sky-foundation-relationship-row',{timeout:30000});
await page.waitForSelector('#skyChartRelationshipsPdf',{timeout:20000});
await page.waitForSelector('#skyChartDictionaryPdf',{timeout:20000});
const dictionaryData=await page.evaluate(()=>window.RelphiRelationshipCopySerializer.fullDictionary());
assert.deepEqual(dictionaryData.map(g=>g.category),['Planets, Angles, and Other Points','Signs','Houses','Aspect Types']);
assert.equal(dictionaryData[1].sections[0].entries.length,12);
assert.equal(dictionaryData[2].sections[0].entries.length,12);
assert.ok(dictionaryData[0].sections[1].entries.some(x=>x.label.includes('m.c.')));
assert.ok(dictionaryData[3].sections[0].entries.some(x=>x.label==='Trine'));

const dictionaryDownload=page.waitForEvent('download',{timeout:30000});
await page.locator('#skyChartDictionaryPdf').click();
const dictionaryFile=await dictionaryDownload;
assert.equal(dictionaryFile.suggestedFilename(),'oracle-of-relphi-reference-dictionary.pdf');
const reference=await readPdf(dictionaryFile);
assert.ok(reference.pages>=4,'Four categories should be clear page-separated sections');
for(const heading of ['Planets, Angles, and Other Points','Signs','Houses','Aspect Types','Trine','Virgo','First House']){
  assert.ok(reference.text.includes(heading),'Dictionary PDF missing '+heading);
}
assert.ok(!reference.text.includes('First Sky'),'Dictionary must be independent of the loaded sky');
console.log('DICTIONARY_PDF',JSON.stringify({pages:reference.pages,bytes:reference.bytes,entries:dictionaryData.flatMap(g=>g.sections.flatMap(s=>s.entries)).length}));

await page.locator('[data-relationship-limit-preset]').selectOption('5');
await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipLimit==='5');
await page.waitForFunction(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].filter(row=>{const s=getComputedStyle(row);return !row.hidden&&s.display!=='none'&&s.visibility!=='hidden'}).length===5);
const relationshipsDownload=page.waitForEvent('download',{timeout:60000});
await page.locator('#skyChartRelationshipsPdf').click();
const relationshipsFile=await relationshipsDownload;
assert.match(relationshipsFile.suggestedFilename(),/relationships\.pdf$/);
const relationships=await readPdf(relationshipsFile);
assert.ok(relationships.pages>=2,'Five illustrated relationships should paginate');
assert.ok(relationships.bytes>10000,'Illustrated PDF must not be empty');
console.log('RELATIONSHIPS_PDF',JSON.stringify({pages:relationships.pages,bytes:relationships.bytes}));
assert.deepEqual(errors,[],'PDF exports must not throw page errors');
await browser.close();
console.log('PDF browser download and four-category standalone dictionary checks passed.');
