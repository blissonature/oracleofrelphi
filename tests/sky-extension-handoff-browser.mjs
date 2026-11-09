import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const DATA={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,
  Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
function sky(name){
  return{name,calcProfile:{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',
    location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662,
    houseSystem:'porphyry',houseCusps:Array.from({length:12},(_,i)=>(168+i*30)%360)},
    placements:Object.fromEntries(Object.entries(DATA).map(([k,longitude])=>[k,{name:k,longitude}]))};
}
const handoff=p=>'http://127.0.0.1:4173/sky-chart.html#relphiSkyIntake='+encodeURIComponent(JSON.stringify({v:1,...p}));
const browser=await chromium.launch({headless:true});
async function setup(width,height,hasA=true,hasB=false){
  const context=await browser.newContext({viewport:{width,height}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://nominatim.openstreetmap.org/search**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify([{lat:'40.7608',lon:'-111.891',display_name:'Salt Lake City, Salt Lake County, Utah, United States',address:{city:'Salt Lake City',state:'Utah',country:'United States'}}])}));
  await page.route('https://api.open-meteo.com/v1/forecast**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({timezone:'America/Denver',current:{temperature_2m:21}})}));
  await page.addInitScript(({a,b})=>{
    if(a)localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    if(b)localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1',b?'comparison':'single');
  },{a:hasA?sky('Saved Sky A'):null,b:hasB?sky('Saved Sky B'):null});
  return{context,page,errors};
}
try{
  for(const [width,height,device] of [[1440,1000,'desktop'],[390,844,'mobile']]){
    // A exists, B empty: a date-only link must ask which sky and never inherit A.
    const{context,page,errors}=await setup(width,height,true,false);
    await page.goto(handoff({date:'2026-11-09',time:'',timeUnknown:false,location:''}),{waitUntil:'domcontentloaded',timeout:35000});
    await page.waitForSelector('.sky-ph-handoff-dialog[open]',{timeout:25000});
    assert.match(await page.locator('.sky-ph-handoff-dialog').innerText(),/selected Where and When/);
    assert.equal(await page.locator('.sky-ph-handoff-dialog [data-ph-handoff-clear]').count(),0,'Extension cannot clear two skies');
    await page.locator('.sky-ph-handoff-dialog [data-ph-handoff-slot="B"]').click();
    const form=page.locator('#skyFoundationB .sky-where-when-editor');
    await form.waitFor({state:'visible',timeout:15000});
    assert.equal(await form.locator('[data-ww-field="date"]').inputValue(),'2026-11-09');
    assert.equal(await form.locator('[data-ww-field="time"]').inputValue(),'','No inherited time');
    assert.equal(await form.locator('[data-ww-field="location-query"]').inputValue(),'','No inherited location');
    assert.equal(await form.locator('[data-ww-field="timezone"]').inputValue(),'','No inherited time zone');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).name),'Saved Sky A','Existing sky is unchanged');
    assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartB')),null,'Opening a candidate does not create a sky prematurely');
    assert.equal(new URL(page.url()).hash,'','Handoff fragment is cleared after intake');
    await page.screenshot({path:'sky-extension-date-'+device+'.png'});
    await form.locator('[data-ww-action="cancel"]').click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartB')),null,'Cancel is non-destructive');
    assert.deepEqual(errors.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)),[],device+' no critical errors');
    await context.close();
    console.log('SKY_EXTENSION_DATE_'+device,'PASS');

    // Address-only: search canonical place; date and time must remain blank.
    const b=await setup(width,height,false,false);
    await b.page.goto(handoff({date:'',time:'',timeUnknown:false,location:'Salt Lake City, Utah'}),{waitUntil:'domcontentloaded'});
    const editor=b.page.locator('#skyFoundationA .sky-where-when-editor');
    await editor.waitFor({state:'visible',timeout:30000});
    assert.equal(await editor.locator('[data-ww-field="date"]').inputValue(),'');
    assert.equal(await editor.locator('[data-ww-field="time"]').inputValue(),'');
    assert.equal(await editor.locator('[data-ww-field="location-query"]').inputValue(),'Salt Lake City, Utah');
    await editor.locator('.sky-location-result').first().waitFor({state:'visible',timeout:15000});
    await editor.locator('.sky-location-result').first().click();
    assert.equal(await editor.locator('[data-ww-field="timezone"]').inputValue(),'America/Denver');
    assert.equal(await editor.locator('[data-ww-field="date"]').inputValue(),'','No guessed date after geocoding');
    assert.equal(await b.page.evaluate(()=>localStorage.getItem('relphiSkyChartA')),null,'Geocoding does not silently create a sky');
    await b.page.screenshot({path:'sky-extension-address-'+device+'.png'});
    assert.deepEqual(b.errors.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)),[],device+' no address intake errors');
    await b.context.close();
    console.log('SKY_EXTENSION_ADDRESS_'+device,'PASS');
  }
  // With both skies filled, clicking Cancel leaves BOTH untouched.
  const{context,page}=await setup(1100,900,true,true);
  await page.goto(handoff({date:'2026-11-09',time:'15:15',timeUnknown:false,location:'Salt Lake City, Utah'}));
  await page.waitForSelector('.sky-ph-handoff-dialog[open]',{timeout:25000});
  const before=await page.evaluate(()=>[localStorage.getItem('relphiSkyChartA'),localStorage.getItem('relphiSkyChartB')]);
  await page.locator('.sky-ph-handoff-dialog [data-ph-handoff-cancel]').click();
  const after=await page.evaluate(()=>[localStorage.getItem('relphiSkyChartA'),localStorage.getItem('relphiSkyChartB')]);
  assert.deepEqual(before,after,'Cancel must not replace either occupied sky');
  await context.close();
}finally{await browser.close()}
console.log('Site received date-only, address-only and complete candidate in the existing Sky Card flow, desktop/mobile, safely.');
