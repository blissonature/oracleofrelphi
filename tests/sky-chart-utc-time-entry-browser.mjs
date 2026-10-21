import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value%30;
  return{name,longitude:value,sign:signs[sign],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0};
};
const sky=(zone,location)=>{
  const asc=168.38,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  return{name:'Existing sky',houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{dateTime:'2026-01-15T12:00',instant:'2026-01-15T17:00:00.000Z',location,locationQuery:location,timeZone:zone,latitude:40.7128,longitude:-74.006,houseCusps:cusps,houseSystem:'equal-house'},
    placements:Object.fromEntries(Object.entries(raw).map(([name,longitude])=>[name,placement(name,longitude)]))};
};
const browser=await chromium.launch({headless:true});
const cases=[
  {name:'UTC passes across the New York local date boundary',date:'2026-10-21',time:'00:30',expectedLocal:'2026-10-20T20:30',zone:'America/New_York',offset:'-04:00'},
  {name:'UTC correctly applies New York daylight-saving spring transition',date:'2026-03-08',time:'07:30',expectedLocal:'2026-03-08T03:30',zone:'America/New_York',offset:'-04:00'},
  {name:'first occurrence of a repeated autumn hour',date:'2026-11-01',time:'05:30',expectedLocal:'2026-11-01T01:30',zone:'America/New_York',offset:'-04:00'},
  {name:'second occurrence of a repeated autumn hour',date:'2026-11-01',time:'06:30',expectedLocal:'2026-11-01T01:30',zone:'America/New_York',offset:'-05:00'},
  {name:'London summer time',date:'2026-08-01',time:'00:20',expectedLocal:'2026-08-01T01:20',zone:'Europe/London',offset:'+01:00',mobile:true}
];
let checked=0;
for(const spec of cases){
  const context=await browser.newContext({viewport:spec.mobile?{width:390,height:844}:{width:1280,height:960},hasTouch:!!spec.mobile,isMobile:!!spec.mobile});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  const initial=sky(spec.zone,spec.zone==='Europe/London'?'London, United Kingdom':'New York, NY, United States');
  await page.addInitScript(value=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(value));
    localStorage.removeItem('relphiSkyChartB');
    localStorage.setItem('relphiSkyChartLastModeV1','single');
  },initial);
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  await page.locator('#skyFoundationA [data-sky-drawer-tab="where"]').click();
  const editor=page.locator('#skyFoundationA .sky-where-when-editor');
  await editor.waitFor();
  assert.equal(await editor.locator('[data-ww-field="time-basis"][value="local"]').isChecked(),true,'Local remains the default');
  await editor.locator('[data-ww-field="time-basis"][value="utc"]').check();
  assert.equal(await editor.locator('[data-ww-local-fields]').isHidden(),true,'Local fields are hidden when UTC is selected');
  assert.equal(await editor.locator('[data-ww-utc-fields]').isVisible(),true,'UTC fields are available');

  await editor.locator('[data-ww-field="utc-date"]').fill(spec.date);
  await editor.locator('[data-ww-field="utc-time"]').fill(spec.time);
  const preview=await editor.evaluate(form=>({
    date:form.querySelector('[data-ww-field="date"]').value,
    time:form.querySelector('[data-ww-field="time"]').value,
    utcDate:form.querySelector('[data-ww-field="utc-date"]').value,
    utcTime:form.querySelector('[data-ww-field="utc-time"]').value,
    localLabel:form.querySelector('[data-ww-time-equivalent]').textContent,
    width:form.clientWidth,scrollWidth:form.scrollWidth
  }));
  assert.equal(preview.date+'T'+preview.time,spec.expectedLocal,spec.name+': translated local civil date and time');
  assert.equal(preview.utcDate+'T'+preview.utcTime,spec.date+'T'+spec.time,'UTC input remains unchanged');
  assert.ok(preview.localLabel.includes(spec.zone)&&preview.localLabel.includes(spec.offset),spec.name+': visible equivalent with offset');
  assert.ok(preview.scrollWidth<=preview.width+5,spec.name+': editor must not overflow horizontally');

  // Planetary Hours' draft link must use the UTC instant directly. In a
  // repeated DST hour its local HH:mm cannot identify which occurrence.
  await page.waitForFunction(expected=>{
    const link=document.querySelector('#skyFoundationA [data-draft-where-when-link="true"]');
    const dt=new URLSearchParams(String(link?.getAttribute('href')||'').split('#')[1]||'').get('dt');
    return !!dt&&Date.parse(dt)===Date.parse(expected);
  },spec.date+'T'+spec.time+':00.000Z',{timeout:15000});
  const linkedInstant=await page.evaluate(()=>{
    const link=document.querySelector('#skyFoundationA [data-draft-where-when-link="true"]');
    return new URLSearchParams(String(link.getAttribute('href')||'').split('#')[1]||'').get('dt');
  });
  assert.equal(new Date(linkedInstant).toISOString(),spec.date+'T'+spec.time+':00.000Z',spec.name+': the draft heptagram must use the exact UTC instant');

  if(spec.name.includes('date boundary')){
    // Toggle back: the enhanced 12-hour picker must show the UTC-derived local time.
    await editor.locator('[data-ww-field="time-basis"][value="local"]').check();
    await page.waitForFunction(()=>!!document.querySelector('#skyFoundationA [data-sky-time-entry]'),null,{timeout:5000});
    assert.equal(await editor.locator('[data-sky-time-entry]').inputValue(),'8:30 PM','Enhanced Local picker must reflect converted time');
    await editor.locator('[data-ww-field="time-basis"][value="utc"]').check();
    const now=editor.locator('[data-ww-field="now"]');
    await now.check();await now.uncheck();
    assert.equal(await editor.locator('[data-ww-field="utc-date"]').inputValue(),spec.date,'Now toggle restores custom UTC date');
    assert.equal(await editor.locator('[data-ww-field="utc-time"]').inputValue(),spec.time,'Now toggle restores custom UTC time');
  }

  const preserved=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).calcProfile.instant);
  assert.equal(preserved,initial.calcProfile.instant,'Changing the editor must not commit prematurely');
  await editor.locator('button[type="submit"]').click();
  await page.waitForFunction(expected=>{
    const raw=localStorage.getItem('relphiSkyChartA');if(!raw)return false;
    return JSON.parse(raw).calcProfile.instant===expected;
  },spec.date+'T'+spec.time+':00.000Z',{timeout:30000});
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).calcProfile);
  assert.equal(stored.dateTime,spec.expectedLocal,spec.name+': persist location-local civil time');
  assert.equal(stored.instant,spec.date+'T'+spec.time+':00.000Z',spec.name+': retain exact UTC instant through daylight-saving ambiguity');
  assert.equal(stored.timeZone,spec.zone);
  assert.equal(await page.locator('#skyFoundationA .sky-where-when-editor').count(),0,'Confirmed editor closes');
  assert.deepEqual(errors.filter(error=>/SyntaxError|ReferenceError|sky-where-when-v3/i.test(error)),[],spec.name+': no core JS errors');
  checked++;
  await context.close();
}

// Changing the selected location while UTC is active must preserve UTC input,
// recompute the local date, and never change the represented instant.
{
  const context=await browser.newContext({viewport:{width:1280,height:960}});
  const page=await context.newPage();
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(value=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(value));localStorage.removeItem('relphiSkyChartB');localStorage.setItem('relphiSkyChartLastModeV1','single')},sky('America/New_York','New York, NY'));
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
  await page.locator('#skyFoundationA [data-sky-drawer-tab="where"]').click();
  const editor=page.locator('#skyFoundationA .sky-where-when-editor');await editor.waitFor();
  await editor.locator('[data-ww-field="time-basis"][value="utc"]').check();
  await editor.locator('[data-ww-field="utc-date"]').fill('2026-10-21');
  await editor.locator('[data-ww-field="utc-time"]').fill('00:30');
  await page.evaluate(()=>window.RelphiSkyWhereWhen.selectPacket('A',{
    source:'search',query:'London',canonical:'London, United Kingdom',
    latitude:51.5072,longitude:-0.1276,timezone:'Europe/London'
  }));
  assert.equal(await editor.locator('[data-ww-field="utc-date"]').inputValue(),'2026-10-21');
  assert.equal(await editor.locator('[data-ww-field="utc-time"]').inputValue(),'00:30');
  assert.equal(await editor.locator('[data-ww-field="date"]').inputValue(),'2026-10-21');
  assert.equal(await editor.locator('[data-ww-field="time"]').inputValue(),'01:30');
  const unknown=editor.locator('[data-ww-field="time-unknown"]');await unknown.check();
  assert.equal(await editor.locator('[data-ww-field="time-basis"][value="local"]').isChecked(),true,'Unknown time switches to local calendar date');
  assert.equal(await editor.locator('[data-ww-field="time-basis"][value="utc"]').isDisabled(),true,'Unknown time disables UTC clock entry');
  await unknown.uncheck();
  assert.equal(await editor.locator('[data-ww-field="time-basis"][value="utc"]').isEnabled(),true,'Known time restores the UTC option');
  await context.close();
}
await browser.close();
console.log('UTC date/time browser checks passed: '+checked+' exact instant scenarios and location/unknown-time transitions.');
