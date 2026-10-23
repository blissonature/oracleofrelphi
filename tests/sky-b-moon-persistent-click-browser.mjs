import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const fixture=offset=>{
 const houseCusps=Array.from({length:12},(_,i)=>(168+offset+i*30)%360);
 return {name:offset?'Sky B':'Sky A',houseSystem:'porphyry',
 calcProfile:{instant:'2026-10-20T12:00:00.000Z',dateTime:'2026-10-20T06:00:00',timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'porphyry',houseCusps},
 houseCusps,placements:{
 Moon:{name:'Moon',longitude:279+offset},Sun:{name:'Sun',longitude:170+offset},
 Mercury:{name:'Mercury',longitude:195+offset},Venus:{name:'Venus',longitude:215+offset},
 Mars:{name:'Mars',longitude:118+offset},Jupiter:{name:'Jupiter',longitude:142+offset},
 Saturn:{name:'Saturn',longitude:13+offset},Uranus:{name:'Uranus',longitude:65+offset},
 Neptune:{name:'Neptune',longitude:3+offset},Pluto:{name:'Pluto',longitude:303+offset},
 Ascendant:{name:'Ascendant',longitude:168+offset},Descendant:{name:'Descendant',longitude:348+offset},
 'Medium Coeli':{name:'Medium Coeli',longitude:258+offset},
 'Imum Coeli':{name:'Imum Coeli',longitude:78+offset}}};
};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:880}});
 await page.addInitScript(({a,b})=>{
 localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
 localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
 localStorage.setItem('relphiSkyChartLastModeV1','comparison');
 },{a:fixture(0),b:fixture(17)});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
 const moon=page.locator('#skyFoundationWheelMount [data-interactive="placement"][data-sky="B"][data-placement="moon"]').first();
 await moon.waitFor({timeout:15000});
 await moon.evaluate(node=>node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})));
 await page.waitForTimeout(100);
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Click locks Sky B Moon');
 await moon.evaluate(node=>node.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,pointerType:'mouse'})));
 await page.waitForTimeout(100);
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Pointer leave must preserve Sky B Moon lock');
 await page.evaluate(()=>{const list=document.getElementById('skyFoundationRelationshipList');if(list)list.scrollTop=200});
 await page.waitForTimeout(100);
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Relationship panel scroll must preserve Sky B Moon lock');
 console.log('PASS Sky B Moon click remains locked after leave and panel scroll');
}finally{await browser.close()}
