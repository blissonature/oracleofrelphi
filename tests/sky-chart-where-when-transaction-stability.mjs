import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return{name,longitude:value,sign:signs[sign],degree,minute,second:0};
};
function sample(name,offset,dateTime,instant,location,timeZone,latitude,longitude){
  const asc=(168.38+offset)%360,mc=(76.28+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:asc,Midheaven:mc};
  return{
    name,
    houseSystem:'equal-house',
    houseCusps:cusps,
    calcProfile:{dateTime,instant,location,locationQuery:location,timeZone,latitude,longitude,houseCusps:cusps,houseSystem:'equal-house'},
    placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,typeof value==='number'?value+offset:value)]))
  };
}

const skyA=sample('Alpha sky',0,'1985-10-08T04:37','1985-10-08T08:37:00.000Z','Malden, Massachusetts, United States','America/New_York',42.4251,-71.0662);
const skyB=sample('Beta sky',29.27,'2026-08-27T08:00','2026-08-27T14:00:00.000Z','Salt Lake City, Utah, United States','America/Denver',40.7608,-111.891);

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));

await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));

await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.setItem('relphiSkyChartLastModeV1','comparison');
}, {a:skyA,b:skyB});

await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]',{timeout:20000});
await page.waitForSelector('.sky-relationship-family-heading[data-relationship-family-heading="intersky"]',{timeout:20000});
await page.waitForSelector('[data-ww-disclosure="A"]',{timeout:20000});
await page.waitForSelector('[data-ww-disclosure="B"]',{timeout:20000});

await page.evaluate(()=>{
  window.__wwTransactionCounts={foundation:0,interactions:0};
  window.addEventListener('relphi:sky-foundation-ready',()=>window.__wwTransactionCounts.foundation++);
  window.addEventListener('relphi:sky-foundation-interactions-ready',()=>window.__wwTransactionCounts.interactions++);
});

const relationshipState=()=>page.evaluate(()=>[...document.querySelector('#skyFoundationRelationshipList').children].map(node=>{
  if(node.matches('.sky-foundation-relationship-row'))return ['row',node.dataset.relationshipMode,node.dataset.relationIndex,node.dataset.leftPlacement,node.dataset.aspect,node.dataset.rightPlacement,node.dataset.sourceOrb].join(':');
  if(node.matches('.sky-relationship-family-heading'))return 'family:'+node.dataset.relationshipFamilyHeading;
  if(node.matches('.sky-relationship-scope-heading'))return 'scope:'+node.dataset.relationshipScopeHeading;
  return 'other:'+node.className;
}));

await page.locator('[data-ww-disclosure="A"]').click();
await page.locator('[data-ww-disclosure="B"]').click();
await page.waitForFunction(()=>document.documentElement.dataset.skyWhereWhenEditing==='true'&&document.documentElement.dataset.skyWhereWhenEditingSlots==='A,B');

const editorA=page.locator('#skyFoundationA .sky-where-when-editor');
const editorB=page.locator('#skyFoundationB .sky-where-when-editor');
await editorA.waitFor();
await editorB.waitFor();

const beforeSubmit=await relationshipState();
const countsBefore=await page.evaluate(()=>({...window.__wwTransactionCounts}));

await editorA.locator('[data-ww-field="date"]').fill('1990-04-15');
await editorA.locator('[data-ww-field="time"]').fill('13:30');
await editorA.locator('button[type="submit"]').click();
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).calcProfile.dateTime==='1990-04-15T13:30');
assert.equal(await page.locator('#skyFoundationA .sky-where-when-editor').count(),0);
assert.equal(await page.locator('#skyFoundationB .sky-where-when-editor').count(),1);
assert.equal(await page.locator('html').getAttribute('data-sky-where-when-editing'),'true');
assert.equal(await page.locator('html').getAttribute('data-sky-where-when-editing-slots'),'B');

await page.waitForTimeout(1400);
assert.deepEqual(await relationshipState(),beforeSubmit,'Relationships must remain frozen after Sky A is saved while Sky B is still being edited.');
assert.deepEqual(await page.evaluate(()=>({...window.__wwTransactionCounts})),countsBefore,'No foundation or relationship rebuild may run while another Where and When editor remains open.');

await editorB.locator('[data-ww-field="date"]').fill('2026-09-01');
await editorB.locator('[data-ww-field="time"]').fill('09:15');
await editorB.locator('button[type="submit"]').click();
await page.waitForFunction(()=>document.documentElement.dataset.skyWhereWhenEditing==='false');
await page.waitForFunction(()=>window.__wwTransactionCounts.foundation>=1,{timeout:20000});
await page.waitForFunction(()=>window.__wwTransactionCounts.interactions>=1,{timeout:20000});
await page.waitForTimeout(700);

const countsAfterCommit=await page.evaluate(()=>({...window.__wwTransactionCounts}));
assert.equal(countsAfterCommit.foundation,1,'Both confirmed skies should produce one foundation rebuild.');
assert.equal(countsAfterCommit.interactions,1,'Both confirmed skies should produce one relationship interaction rebuild.');
assert.notDeepEqual(await relationshipState(),beforeSubmit,'Relationships should update after the last open Where and When editor is confirmed.');

await page.waitForTimeout(1400);
assert.deepEqual(await page.evaluate(()=>({...window.__wwTransactionCounts})),countsAfterCommit,'The removed one-second polling loop must not restart rendering after the committed rebuild.');

const orders=await page.evaluate(async()=>{
  const samples=[];
  for(let i=0;i<8;i+=1){
    samples.push([...document.querySelectorAll('#skyFoundationRelationshipList>.sky-relationship-family-heading')].filter(node=>!node.hidden).map(node=>node.dataset.relationshipFamilyHeading).join('|'));
    await new Promise(resolve=>setTimeout(resolve,220));
  }
  return samples;
});
assert.ok(orders.every(order=>order==='intersky|intrasky'),`Relationship families must remain Intersky then Intrasky without flashing: ${orders.join(', ')}`);

await page.locator('[data-saved-sky-trigger="A"]').click();
await page.locator('[data-saved-as]').click();
const dialog=page.locator('.sky-save-name-dialog');
await dialog.waitFor();
const nameSizes=await dialog.evaluate(node=>{
  const input=node.querySelector('[data-save-sky-name-input]');
  return{dialog:node.getBoundingClientRect().width,input:input.getBoundingClientRect().width};
});
assert.ok(nameSizes.dialog>=500,`Sky name dialog should be wide on desktop, got ${nameSizes.dialog}px`);
assert.ok(nameSizes.input>=450,`Sky name field should be wide on desktop, got ${nameSizes.input}px`);
await dialog.locator('[data-save-sky-name-cancel]').click();

assert.deepEqual(errors,[]);
await browser.close();
console.log('Where and When transaction stability passed.');
