import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const instant='2026-09-10T18:00:00.000Z';
const profile={instant,dateTime:instant,timeZone:'America/Denver',latitude:40.7608,longitude:-111.8910,houseSystem:'whole-sign'};
const sky=(name,offset)=>({
  name,houseSystem:'whole-sign',calcProfile:profile,
  houseCusps:Array.from({length:12},(_,i)=>(165+offset+i*30)%360),
  placements:{
    Sun:{name:'Sun',glyphId:'sun',longitude:168+offset},
    Moon:{name:'Moon',glyphId:'moon',longitude:167+offset},
    Mercury:{name:'Mercury',glyphId:'mercury',longitude:180+offset},
    Venus:{name:'Venus',glyphId:'venus',longitude:210+offset},
    Mars:{name:'Mars',glyphId:'mars',longitude:110+offset},
    Jupiter:{name:'Jupiter',glyphId:'jupiter',longitude:135+offset},
    Saturn:{name:'Saturn',glyphId:'saturn',longitude:13+offset},
    Uranus:{name:'Uranus',glyphId:'uranus',longitude:65+offset},
    Neptune:{name:'Neptune',glyphId:'neptune',longitude:3+offset},
    Pluto:{name:'Pluto',glyphId:'pluto',longitude:303+offset},
    Ascendant:{name:'Ascendant',glyphId:'asc',longitude:180+offset}
  }
});

async function runMobileTap(browserType,label){
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3});
  try{
    const page=await context.newPage();
    await page.addInitScript(({a,b})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
      localStorage.setItem('relphiSkyRelationshipDisplayV1','glyphs');
    },{a:sky('Natal',0),b:sky('Transit',1)});
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle',timeout:30000});
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
    await page.waitForFunction(()=>document.documentElement.dataset.skyBPresent==='true',null,{timeout:10000});

    const sort=page.locator('select[data-relationship-sort]');
    await sort.selectOption('ends-last');
    await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipSort==='ends-last',null,{timeout:45000});
    await page.waitForFunction(()=>document.querySelector('select[data-relationship-sort]')?.getAttribute('aria-busy')==='false',null,{timeout:45000});

    const row=page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]:visible').first();
    await row.scrollIntoViewIfNeeded();

    // A completed scroll gesture must not poison the next distinct tap. The mobile
    // scroll guard used to suppress every click for 650 ms, including a new tap.
    const p1={pointerType:'touch',pointerId:41,isPrimary:true,clientX:120,clientY:300,buttons:1};
    await row.dispatchEvent('pointerdown',p1);
    await row.dispatchEvent('pointermove',{...p1,clientY:325});
    await row.dispatchEvent('pointerup',{...p1,clientY:325,buttons:0});
    const p2={pointerType:'touch',pointerId:42,isPrimary:true,clientX:120,clientY:300,buttons:1};
    await row.dispatchEvent('pointerdown',p2);
    await row.dispatchEvent('pointerup',{...p2,buttons:0});
    await row.dispatchEvent('click',{detail:1});
    await page.waitForFunction(()=>Boolean(document.querySelector('#skyFoundationRelationshipList>.sky-foundation-relationship-row.is-inline-expanded')),null,{timeout:5000});
    assert.equal(await row.getAttribute('aria-expanded'),'true',`${label}: a new tap after scrolling must expand a relationship tile`);

    // Collapse, then verify the browser's normal synthesized touch tap path too.
    await row.tap();
    await page.waitForFunction(()=>!document.querySelector('#skyFoundationRelationshipList>.sky-foundation-relationship-row.is-inline-expanded'),null,{timeout:5000});
    await row.tap();
    await page.waitForFunction(()=>Boolean(document.querySelector('#skyFoundationRelationshipList>.sky-foundation-relationship-row.is-inline-expanded')),null,{timeout:5000});
    assert.equal(await row.getAttribute('aria-expanded'),'true',`${label}: touch tap should expand a relationship tile after Ends Last sorting`);
    console.log(`${label}: relationship tile taps survive timing sort and a preceding scroll gesture`);
  }finally{
    await context.close();
    await browser.close();
  }
}

await runMobileTap(chromium,'Chromium');
await runMobileTap(webkit,'WebKit');
