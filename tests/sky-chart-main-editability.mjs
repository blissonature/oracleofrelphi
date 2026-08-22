import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:signs[sign],degree,minute,second:0}};
const raw={Sun:25.4,Moon:268.6,Mercury:14.2,Venus:42.8,Mars:315.6,Jupiter:92.1,Saturn:294.5,Uranus:278.3,Neptune:283.7,Pluto:226.6,Ascendant:122.5,Midheaven:15.0};
const cusps=Array.from({length:12},(_,i)=>(120+i*30)%360);
const sky={
  name:'Editable test sky',title:'Editable test sky',displayName:'Editable test sky',skyName:'Editable test sky',
  placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value)])),
  houseCusps:cusps,
  calcProfile:{
    name:'Editable test sky',title:'Editable test sky',dateTime:'1990-04-15T13:30',instant:'1990-04-15T17:30:00.000Z',
    latitude:'42.42510',longitude:'-71.06620',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',
    houseSystem:'whole-sign',houseCusps:cusps,cusps
  }
};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error'&&!/favicon|wsrv\.nl/i.test(message.text()))errors.push(message.text())});
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(value=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(value));
  localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyChartLastModeV1','single');
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
},sky);

await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
const edit=page.locator('#skyFoundationA [data-ww-action="edit"]');
await edit.waitFor({state:'visible',timeout:15000});
assert.equal(await edit.isEnabled(),true,'Where and When must remain an enabled edit affordance on the current Sky Chart.');
await edit.click();
const editor=page.locator('#skyFoundationA .sky-where-when-editor');
await editor.waitFor({state:'visible',timeout:5000});
const date=editor.locator('[data-ww-field="date"]'),time=editor.locator('[data-ww-field="time"]');
assert.equal(await date.isEnabled(),true,'Existing saved sky date must be editable.');
assert.equal(await time.isEnabled(),true,'Existing saved sky time must be editable.');
await date.fill('1990-04-16');
await time.fill('14:45');
await editor.locator('button[type="submit"]').click();
await page.waitForFunction(()=>{
  try{return JSON.parse(localStorage.getItem('relphiSkyChartA')||'null')?.calcProfile?.dateTime?.startsWith('1990-04-16T14:45')}catch{return false}
},{timeout:15000});
const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')));
assert.ok(String(stored.calcProfile.dateTime).startsWith('1990-04-16T14:45'),'Submitting edits must replace Sky A with the recalculated sky.');
assert.deepEqual(errors,[]);
await browser.close();
console.log('Current Sky Chart editability check passed.');
