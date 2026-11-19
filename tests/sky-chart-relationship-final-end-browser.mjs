import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const source=path=>readFileSync(path,'utf8');
const DAY=86400000;
const ends=[
  ['short',Date.parse('2027-01-03T00:00:00Z'),9000],
  ['long',Date.parse('2028-02-20T00:00:00Z'),1],
  ['middle',Date.parse('2027-10-03T00:00:00Z'),50],
  ['unknown',null,999999]
];
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://test.example/sky-chart.html',route=>route.fulfill({
     contentType:'text/html',
     body:`<!doctype html><html><head></head><body><div id="skyFoundationRoot"><section id="skyFoundationRelationships"><div class="sky-foundation-relationships-heading">Relationships</div><div id="skyFoundationRelationshipList"></div></section></div></body></html>`
   }));
   await page.goto('https://test.example/sky-chart.html');
   await page.evaluate(({entries})=>{
     const list=document.getElementById('skyFoundationRelationshipList');
     window.RelphiRelationshipTransitMeta={
       exportTimingForRow(row){
         const item=entries.find(x=>x[0]===row.dataset.relationIndex);
         return item?.[1]!=null?{
           kind:'dynamic',startMs:item[1]-30*86400000,endMs:item[1],
           durationDays:30,exacts:[item[1]-15*86400000]
         }:{kind:'unavailable',reason:'static reference'};
       },
       clearDurationCache(){}
     };
     for(const [id,end,misleadingDays] of entries){
       const row=document.createElement('article');
       row.className='sky-foundation-relationship-row';
       Object.assign(row.dataset,{
         relationIndex:id,relationshipMode:'A-B',
         leftPlacement:'sun',rightPlacement:'pluto',
         leftSky:'A',rightSky:'B',aspect:'trine',
         sourceOrb:'0.5',phaseError:'0.5',harmonicOrder:'3',
         transitEndsInDays:String(misleadingDays)
       });
       list.appendChild(row);
     }
   },{entries:ends});
   await page.addScriptTag({content:source('sky-chart-relationship-timing-fix-v1.js')});
   await page.addScriptTag({content:source('sky-chart-relationship-sort-v1.js')});
   const sorter=page.locator('select[data-relationship-sort]');
   await sorter.selectOption('ends-last');
   await page.waitForFunction(()=>document.querySelector('select[data-relationship-sort]')?.getAttribute('aria-busy')==='false' &&
     document.documentElement.dataset.skyRelationshipSort==='ends-last' &&
     document.querySelector('[data-relation-index="long"]')?.dataset.transitEndMs);
   await page.waitForTimeout(120);
   const extract=()=>page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].map(r=>({
     id:r.dataset.relationIndex,endMs:r.dataset.transitEndMs??null
   })));
   let rows=await extract();
   assert.deepEqual(rows.map(x=>x.id),['long','middle','short','unknown'],
      'Ends Last must sort the final absolute End, not misleading local-day estimates');
   assert.equal(rows.at(-1).endMs,null,'Unknown end dates must sort after known dates');
   for(const row of rows.slice(0,3)){
      const expected=ends.find(x=>x[0]===row.id)[1];
      assert.equal(Number(row.endMs),expected);
   }
   await sorter.selectOption('ends-soonest');
   await page.waitForFunction(()=>document.querySelector('select[data-relationship-sort]')?.getAttribute('aria-busy')==='false' &&
     document.documentElement.dataset.skyRelationshipSort==='ends-soonest');
   await page.waitForTimeout(120);
   rows=await extract();
   assert.deepEqual(rows.map(x=>x.id),['short','middle','long','unknown'],
      'Ends Soonest must reverse the absolute End ordering while retaining unknown at bottom');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:`relationship-final-end-${viewport.width}.png`,fullPage:true});
   await page.close();
 }
 console.log('PASS: Desktop and mobile Ends Last / Ends Soonest sort actual final timeline end; missing end dates last.');
}finally{await browser.close()}
