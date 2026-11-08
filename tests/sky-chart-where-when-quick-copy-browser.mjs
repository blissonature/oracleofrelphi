import assert from 'node:assert/strict';
import {chromium} from 'playwright';

function sky(slot){
  const data={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,
    Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  const isA=slot==='A';
  return {name:isA?'Alpha sky':'Beta sky',calcProfile:{
    dateTime:isA?'1985-10-08T04:37':'2026-09-09T21:00',
    instant:isA?'1985-10-08T08:37:00.000Z':'2026-09-10T03:00:00.000Z',
    location:isA?'Malden, Massachusetts, United States':'Salt Lake City, Utah, United States',
    locationQuery:isA?'Malden, MA':'Salt Lake City, UT',
    timeZone:isA?'America/New_York':'America/Denver',
    latitude:isA?42.4251:40.7608,longitude:isA?-71.0662:-111.891,
    houseSystem:'porphyry',
    houseCusps:Array.from({length:12},(_,i)=>(168.38+i*30)%360)
  },placements:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,{name:k,longitude:v+(isA?0:22)}]))};
}
const browser=await chromium.launch({headless:true});
try{
  for(const [width,height,device] of [[1440,1000,'desktop'],[390,844,'mobile']]){
    const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(({a,b})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    },{a:sky('A'),b:sky('B')});
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:35000});
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:35000});
    const tabA=page.locator('#skyFoundationA [data-sky-drawer-tab="where"]');
    await tabA.scrollIntoViewIfNeeded();await tabA.click();
    const form=page.locator('#skyFoundationA .sky-where-when-editor');
    await form.waitFor({state:'visible'});
    const copy=form.locator('[data-copy-where-when]');
    assert.equal(await copy.count(),1,device+' exactly one copy button in Where and When');
    assert.equal(await copy.getAttribute('type'),'button','Copy never submits the editor');
    async function clipboardHas(needle){
      await page.waitForFunction(value=>navigator.clipboard.readText().then(text=>text.includes(value)),needle,{timeout:5000});
      return page.evaluate(()=>navigator.clipboard.readText());
    }
    await copy.scrollIntoViewIfNeeded();await copy.click();
    const initial=await clipboardHas('Alpha sky — Where and When');
    assert.equal(initial,[
      'Alpha sky — Where and When','Where: Malden, Massachusetts, United States',
      'Date: 1985-10-08','Time: 04:37','Time zone: America/New_York'
    ].join('\n'),device+' selected name, place, date, time and zone');
    const initialStorage=await page.evaluate(()=>localStorage.getItem('relphiSkyChartA'));
    await form.locator('[data-ww-field="date"]').fill('2027-03-22');
    const timeEntry=form.locator('[data-sky-time-entry]');
    await timeEntry.fill('6:42 PM');
    await timeEntry.press('Enter');
    assert.equal(await form.locator('[data-ww-field="time"]').inputValue(),'18:42',
      device+' visible time editor commits to its canonical HH:MM source');
    await copy.click();
    const draft=await clipboardHas('Date: 2027-03-22');
    assert.match(draft,/Date: 2027-03-22\nTime: 18:42/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartA')),initialStorage,
      device+' Copy must not commit a sky');
    await form.locator('[data-ww-field="time-unknown"]').check();
    await copy.click();
    const unknown=await clipboardHas('Time: Unknown');
    assert.match(unknown,/Date: 2027-03-22\nTime: Unknown\nTime zone: America\/New_York/);
    assert.doesNotMatch(unknown,/18:42/,device+' must not invent known time');
    await form.locator('[data-ww-field="time-unknown"]').uncheck();
    await form.locator('[data-ww-field="now"]').check();
    await copy.click();
    const now=await clipboardHas('(captured Now)');
    assert.match(now,/Time: \d\d:\d\d \(captured Now\)/);
    assert.match(now,/Time zone: America\/New_York/);
    await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-copy-where-when] svg.relphi-copy-icon'));
    assert.equal(await copy.locator('svg.relphi-copy-icon > use').count(),1,
      device+' Copy has exactly one canonical clipboard glyph');
    await copy.scrollIntoViewIfNeeded();
    const box=await copy.boundingBox();
    const geometry=await copy.evaluate(node=>{const b=node.getBoundingClientRect(),row=node.closest('.sky-where-when-main-actions'),r=row?.getBoundingClientRect();return{button:{x:b.x,y:b.y,width:b.width,height:b.height},actions:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,window:{width:innerWidth,height:innerHeight},scroll:{x:scrollX,y:scrollY},buttonDisplay:getComputedStyle(node).display}});
    console.log('WHERE_WHEN_COPY_GEOMETRY_'+device,JSON.stringify(geometry));
    await page.screenshot({path:'where-when-quick-copy-'+device+'.png'});
    assert.ok(box&&box.width>=48&&box.height>=28&&box.x>=0&&box.x+box.width<=width+1,
      device+' visible accessible copy control in viewport: '+JSON.stringify(geometry));
    const tabB=page.locator('#skyFoundationB [data-sky-drawer-tab="where"]');
    await tabB.scrollIntoViewIfNeeded();await tabB.click();
    const copyB=page.locator('#skyFoundationB .sky-where-when-editor [data-copy-where-when]');
    await copyB.waitFor({state:'visible'});await copyB.focus();await page.keyboard.press('Enter');
    const other=await clipboardHas('Beta sky — Where and When');
    assert.match(other,/^Beta sky — Where and When\nWhere: Salt Lake City, Utah, United States\nDate: 2026-09-09\nTime: 21:00\nTime zone: America\/Denver$/);
    assert.ok(await page.locator('#skyFoundationB .sky-where-when-editor').isVisible(),
      device+' keyboard Copy leaves the editor open');
    assert.deepEqual(errors.filter(s=>/TypeError|ReferenceError|SyntaxError/.test(s)),[],
      device+' no critical browser errors');
    console.log('WHERE_WHEN_COPY_'+device,JSON.stringify({initial,draft,unknown,now,other,copyBounds:box}));
    await context.close();
  }
}finally{await browser.close()}
console.log('Where and When Copy verified in Chromium on desktop/mobile including clipboard, draft, unknown time, Now, and slot isolation.');
