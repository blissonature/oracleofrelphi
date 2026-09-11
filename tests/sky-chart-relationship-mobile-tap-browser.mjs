import assert from 'node:assert/strict';
import { chromium } from 'playwright';

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

const browser=await chromium.launch({headless:true});
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
  await row.tap();
  await page.waitForFunction(()=>Boolean(document.querySelector('#skyFoundationRelationshipList>.sky-foundation-relationship-row.is-inline-expanded')),null,{timeout:5000});
  assert.equal(await row.getAttribute('aria-expanded'),'true','touch tap should expand a relationship tile after Ends Last sorting');
  console.log('mobile touch tap expands relationship tile after timing sort');
}finally{
  await context.close();
  await browser.close();
}
