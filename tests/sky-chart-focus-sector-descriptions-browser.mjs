import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#skyFoundationWheelMount > .sky-foundation-wheel',{timeout:20000});
 const texts=await page.evaluate(()=>{
  const api=window.RelphiSkyVocab;
  return ['house','sign','placement'].map((kind,i)=>api?.describeFocus?.(kind,[4,5,'Venus'][i])||null);
 });
 assert.ok(texts.every(x=>x?.description),'All three wheel kinds use shared Vocab meanings');
 // Test visual layer without needing private user skies: supplied synthetic
 // controls activate the wheel's existing click selection.
 const house=page.locator('#skyFoundationWheelMount [data-interactive="house"]').first();
 assert.ok(await house.count()>0,'Foundation House sector exists');
 await house.dispatchEvent('click',{bubbles:true});
 const callout=page.locator('#skyFoundationWheelMount .sky-wheel-sector-description');
 await callout.waitFor({state:'visible',timeout:4000});
 assert.ok((await callout.innerText()).length>12,'House has semantic meaning');
 const position=await callout.evaluate(node=>{
  const a=node.getBoundingClientRect(),b=node.parentElement.getBoundingClientRect();
  return {inside:a.left>=b.left&&a.right<=b.right+1&&a.top>=b.top&&a.bottom<=b.bottom+1,
    pointer:getComputedStyle(node).pointerEvents,tag:node.tagName};
 });
 assert.equal(position.inside,true,'Description stays inside the wheel viewport');
 assert.equal(position.pointer,'none','Description cannot intercept wheel clicks');
 assert.equal(position.tag,'DIV','Accessible HTML callout is mounted outside the SVG');
 await page.locator('#skyFoundationWheelMount [data-interactive="sign"]').first().dispatchEvent('click',{bubbles:true});
 assert.match(await callout.innerText(),/Aries|initiative/i,'Sign description replaces house description');
 console.log('Wheel Focus sector description test passed.');
}finally{await browser.close()}
