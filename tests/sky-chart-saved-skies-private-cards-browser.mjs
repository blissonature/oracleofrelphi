import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,lon)=>{
  const v=((lon%360)+360)%360,d=v%30;
  return{name,longitude:v,sign:SIGNS[Math.floor(v/30)],degree:Math.floor(d),minute:Math.round((d%1)*60)};
};
function fixture(name,id,offset,unknown=false){
  const asc=168.38+offset,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28};
  return{name,id,houseSystem:'equal-house',houseCusps:cusps,
    metadata:{savedSkyId:id,savedSkyName:name},
    calcProfile:{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Private address · Malden, Massachusetts',timeZone:'America/New_York',latitude:42.425,longitude:-71.066,timeUnknown:unknown,houseCusps:cusps,houseSystem:'equal-house'},
    placements:Object.fromEntries(Object.entries(raw).map(([key,v])=>[key,placement(key,v+offset)]))};
}
const privateSky=fixture('Sensitive Person One','private-person-one',0);
const secondSky=fixture('Sensitive Person Two','private-person-two',18,true);
const original=fixture('Active Test Sky','active-test',2);
const browser=await chromium.launch({headless:true});
async function load(page){
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({current,library})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(current));
    localStorage.removeItem('relphiSkyChartB');
    localStorage.setItem('relphiSkyLibraryV1',JSON.stringify(library));
    localStorage.setItem('relphiSkyChartLastModeV1','single');
  },{current:original,library:[privateSky,secondSky]});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.locator('[data-saved-sky-trigger="A"]').click({timeout:20000});
  await page.waitForSelector('#skySavedSkiesPopover .sky-saved-list-row [data-private-sky-fingerprint="true"]',{timeout:20000});
  assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row').count(),2,'Both saved fingerprints are visible in the canonical picker');
}
function row(page,id){return page.locator('#skySavedSkiesPopover .sky-saved-list-row').filter({has:page.locator('[data-saved-sky-ref="'+id+'"]')})}


try{
  for(const config of [{viewport:{width:630,height:940},mobile:false},{viewport:{width:390,height:844},mobile:true}]){
    const context=await browser.newContext({viewport:config.viewport,isMobile:config.mobile,hasTouch:config.mobile});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await load(page);
    await page.waitForSelector('#skySavedSkiesPopover [data-saved-sky-ref="private-person-one"] .sky-library-identity-overlay',{timeout:12000});
    const rows=page.locator('#skySavedSkiesPopover .sky-saved-list-row');
    assert.equal(await rows.count(),2,'Canonical Saved Skies picker must show both fixture skies');
    for(const id of ['private-person-one','private-person-two']){
      const button=row(page,id).locator('[data-saved-sky-ref]');
      assert.equal(await button.locator('.sky-saved-fingerprint-piece').count(),3,'Three independent fingerprints retained');
      assert.equal(await button.locator('.sky-library-identity-overlay').count(),1,'Canonical library retains one identity overlay inside fingerprint footprint');
      assert.equal(await button.locator('.sky-saved-list-name,.sky-saved-list-meta').count(),0,'No competing identity column');
      assert.equal(await button.locator('[data-saved-fingerprint-copy]').count(),1,'Canonical identity copy remains present for the owner to manage');
      const copyHidden=await button.locator('[data-saved-fingerprint-copy]').evaluate(node=>node.hidden);
      assert.equal(copyHidden,true,'The superseded external identity copy remains hidden under the canonical overlay');
    }
    await row(page,'private-person-one').locator('[data-saved-sky-ref]').click();
    await page.waitForFunction(()=>{
      try{return JSON.parse(localStorage.getItem('relphiSkyChartA')||'null')?.metadata?.savedSkyId==='private-person-one'}catch{return false}
    },null,{timeout:15000});
    const selected=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')));
    assert.equal(selected.metadata.savedSkyId,'private-person-one','Selecting a canonical fingerprint loads the requested sky');
    assert.deepEqual(errors.filter(e=>/SyntaxError|TypeError|ReferenceError/.test(e)),[],'No critical runtime errors');
    console.log('PASS Saved Skies fingerprint and click '+(config.mobile?'mobile':'desktop'));
    await context.close();
  }
}finally{await browser.close()}
