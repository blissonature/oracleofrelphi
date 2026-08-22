import{chromium}from'playwright';
import assert from'node:assert/strict';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:signs[sign],degree,minute,second:0}};
function sample(id,name,offset=0){
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,'Imum Coeli':256.28,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  const cusps=Array.from({length:12},(_,i)=>(150+i*30)%360);
  return{id,name,placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)])),houseCusps:cusps,metadata:{savedSkyId:id,savedSkyName:name},calcProfile:{dateTime:'2026-08-21T18:00',instant:'2026-08-22T00:00:00.000Z',latitude:'40.7608',longitude:'-111.891',location:'Salt Lake City, Utah',timeZone:'America/Denver',houseSystem:'whole-sign',houseCusps:cusps}};
}
const library=[sample('sky-a','Natal'),sample('sky-b','Transit',18)];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(lib=>{
  localStorage.setItem('relphiSkyLibraryV1',JSON.stringify(lib));sessionStorage.removeItem('relphiSkyVNextWorkspaceV1');
  window.__nativeDispatchEvent=Function.prototype.toString.call(EventTarget.prototype.dispatchEvent);
},library);
await page.goto('http://127.0.0.1:4173/sky-chart-vnext.html',{waitUntil:'networkidle'});
assert.equal(await page.locator('[data-add-sky="A"]').count(),1,'Sky A must start as an explicit empty slot.');
assert.equal(await page.locator('[data-add-sky="B"]').count(),0,'Sky B is unavailable until Sky A exists.');
await page.locator('[data-add-sky="A"]').click();
await page.locator('[data-add-existing="A"]').click();
await page.locator('[data-load-saved="sky-a"]').click();
await page.waitForSelector('.sky-wheel .placement');
assert.equal(await page.locator('[data-add-sky="B"]').count(),1,'Sky B becomes available after Sky A exists.');
await page.locator('[data-add-sky="B"]').click();
await page.locator('[data-add-existing="B"]').click();
await page.locator('[data-load-saved="sky-b"]').click();
await page.waitForSelector('.sky-slot[data-slot="B"] .sky-ledger-row');
assert.ok(await page.locator('.aspect-line').count()>0,'Comparison relationships must be rendered from one relationship calculation.');

const contract=await page.evaluate(()=>{
  window.__vnextWheel=document.querySelector('.sky-wheel');
  const resources=performance.getEntriesByType('resource').map(entry=>new URL(entry.name).pathname);
  const legacy=resources.filter(path=>/\/sky-chart-(?!vnext\/).+\.js$/.test(path));
  return{dispatchUnchanged:window.__nativeDispatchEvent===Function.prototype.toString.call(EventTarget.prototype.dispatchEvent),legacy};
});
assert.equal(contract.dispatchUnchanged,true,'Sky Chart vNext must not monkey-patch EventTarget.dispatchEvent.');
assert.deepEqual(contract.legacy,[],'Sky Chart vNext must not load the legacy Sky Chart runtime chain.');

await page.locator('.sky-slot[data-slot="A"] .sky-ledger-row').first().hover();
await page.waitForTimeout(80);
assert.equal(await page.evaluate(()=>window.__vnextWheel===document.querySelector('.sky-wheel')),true,'Hover must not rebuild the wheel.');
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart vNext browser smoke test passed.');
