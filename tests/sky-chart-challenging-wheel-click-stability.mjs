import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const instant='2026-09-19T18:30:00.000Z';
const profile={instant,dateTime:instant,timeZone:'America/Denver',latitude:40.7608,longitude:-111.8910,houseSystem:'whole-sign'};

function sky(name,offset){
  return {
    name,houseSystem:'whole-sign',calcProfile:profile,
    houseCusps:Array.from({length:12},(_,i)=>(168+offset+i*30)%360),
    placements:{
      Sun:{name:'Sun',glyphId:'sun',longitude:170+offset},
      Moon:{name:'Moon',glyphId:'moon',longitude:279+offset},
      Mercury:{name:'Mercury',glyphId:'mercury',longitude:195+offset},
      Venus:{name:'Venus',glyphId:'venus',longitude:215+offset},
      Mars:{name:'Mars',glyphId:'mars',longitude:118+offset},
      Jupiter:{name:'Jupiter',glyphId:'jupiter',longitude:142+offset},
      Saturn:{name:'Saturn',glyphId:'saturn',longitude:13+offset},
      Uranus:{name:'Uranus',glyphId:'uranus',longitude:65+offset},
      Neptune:{name:'Neptune',glyphId:'neptune',longitude:3+offset},
      Pluto:{name:'Pluto',glyphId:'pluto',longitude:303+offset},
      Ascendant:{name:'Ascendant',glyphId:'asc',longitude:180+offset},
      Descendant:{name:'Descendant',glyphId:'dsc',longitude:0+offset},
      'Medium Coeli':{name:'Medium Coeli',glyphId:'mc',longitude:285+offset},
      'Imum Coeli':{name:'Imum Coeli',glyphId:'ic',longitude:105+offset},
      'North Node':{name:'North Node',glyphId:'north-node',longitude:328+offset},
      'South Node':{name:'South Node',glyphId:'south-node',longitude:148+offset}
    }
  };
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
try{
  const page=await context.newPage();
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    localStorage.setItem('relphiSkyRelationshipDisplayV1','glyphs');
  },{a:sky('A',0),b:sky('B',2)});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle',timeout:30000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.skyBPresent==='true',null,{timeout:10000});

  const sort=page.locator('select[data-relationship-sort]');
  await sort.selectOption('most-challenging');
  await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipSort==='most-challenging',null,{timeout:10000});
  await page.waitForTimeout(250);

  const before=await page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')].map(row=>row.dataset.relationIndex));
  assert.ok(before.length>10,'fixture should produce enough relationships to exercise global significance sorting');

  const line=page.locator('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect[data-relation-index]:not(.sky-foundation-aspect-hit)').first();
  await line.waitFor({state:'attached',timeout:10000});
  await line.dispatchEvent('click',{clientX:1,clientY:1,button:0});

  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')?.classList.contains('has-isolation'),null,{timeout:5000});
  await page.waitForTimeout(250);

  const after=await page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')].map(row=>row.dataset.relationIndex));
  assert.deepEqual(after,before,'clicking a comparison-wheel aspect must not reorder the Most Challenging list');

  const isolated=await page.evaluate(()=>({
    visible:[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')].filter(row=>!row.hidden).length,
    selected:document.querySelectorAll('#skyFoundationWheelMount .sky-foundation-aspect.is-selected').length
  }));
  assert.ok(isolated.visible>=1,'aspect click should keep its matching relationship visible');
  assert.ok(isolated.selected>=1,'aspect click should remain selected after isolation settles');

  console.log('Most Challenging aspect-line click remains stable without a list reorder flash.');
}finally{
  await context.close();
  await browser.close();
}
