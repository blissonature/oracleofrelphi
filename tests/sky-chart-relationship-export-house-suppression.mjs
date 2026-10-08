import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23};

function unknownSky(name,offset){
  return{
    name,
    houseSystem:'none',
    houseCusps:[],
    calcProfile:{timeUnknown:true,houseSystem:'none',houseCusps:[],cusps:[],dateTime:'1970-05-05',location:'Unknown-time natal',timeZone:'America/Denver'},
    placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))
  };
}
function knownSky(name,offset){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const points={...raw,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28};
  return{
    name,
    houseSystem:'equal-house',
    houseCusps:cusps,
    calcProfile:{timeUnknown:false,houseSystem:'equal-house',houseCusps:cusps,cusps,dateTime:'2026-10-08T12:00',instant:'2026-10-08T18:00:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891},
    placements:Object.fromEntries(Object.entries(points).map(([key,value])=>[key,placement(key,value+offset)]))
  };
}

const skyA=unknownSky('Unknown-time A',0);
const skyB=knownSky('Known-time B',29.27);
const browser=await chromium.launch({headless:true});

try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    localStorage.removeItem('relphiRelationshipExportHouseInfoV1');
    window.htmlToImage={
      toBlob:async node=>{
        window.__relphiHouseExportSnapshot={
          medallions:node.querySelectorAll('.relphi-house-medallion').length,
          houseConcepts:[...node.querySelectorAll('.rex-chip strong')].map(n=>(n.textContent||'').trim()).filter(text=>/House$/.test(text)),
          rows:node.querySelectorAll('.rex-row').length
        };
        return new Blob(['png'],{type:'image/png'});
      },
      toPng:async()=> 'data:image/png;base64,cG5n'
    };
  },{a:skyA,b:skyB});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]').length>5,null,{timeout:20000});
  await page.waitForSelector('.sky-relationship-export-houses summary',{timeout:10000});

  const control=page.locator('.sky-relationship-export-houses');
  assert.equal((await control.locator('summary').textContent()||'').trim(),'Houses B','Unknown-time Sky A must not be offered as a house-bearing export source.');
  await control.locator('summary').click();
  const aToggle=control.locator('[data-export-house-slot="A"]');
  const bToggle=control.locator('[data-export-house-slot="B"]');
  assert.equal(await aToggle.isDisabled(),true,'Unknown-time Sky A house export toggle must be disabled.');
  assert.equal(await bToggle.isDisabled(),false,'Known-time Sky B house export toggle must remain available.');
  assert.equal(await bToggle.isChecked(),true,'Known-time Sky B houses should be included by default.');

  const onScreenBHouseData=await page.evaluate(()=>({
    rows:[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].filter(row=>Number(row.dataset.rightHouse)>=1||String(row.dataset.relationshipMode||'').toUpperCase()==='B-B'&&Number(row.dataset.leftHouse)>=1).length,
    medallions:document.querySelectorAll('#skyFoundationRelationshipList .relphi-house-medallion').length
  }));
  assert.ok(onScreenBHouseData.rows>0,'Fixture must expose known-time Sky B house data on screen.');
  assert.ok(onScreenBHouseData.medallions>0,'Fixture must visibly render house medallions before export suppression.');

  await bToggle.uncheck();
  assert.equal((await control.locator('summary').textContent()||'').trim(),'Houses off');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiRelationshipExportHouseInfoV1')||'{}'));
  assert.equal(stored.B,false,'Sky B export-house suppression must persist as an explicit export preference.');

  await page.evaluate(()=>{
    window.__relphiCopiedText='';
    document.execCommand=()=>false;
    const clipboard={writeText:async text=>{window.__relphiCopiedText=String(text)}};
    try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:clipboard})}catch(_){try{navigator.clipboard.writeText=clipboard.writeText}catch(__){}}
  });
  await page.locator('.sky-relationship-copy-button').click();
  await page.waitForFunction(()=>Boolean(window.__relphiCopiedText),null,{timeout:3000});
  const suppressedCopy=await page.evaluate(()=>window.__relphiCopiedText);
  assert.match(suppressedCopy,/Relationships/);
  assert.equal(/\bH(?:[1-9]|1[0-2])\b/.test(suppressedCopy),false,'Copy must omit compact H# house tokens when A is unknown-time and B house export is suppressed.');
  assert.equal(/First House|Second House|Third House|Fourth House|Fifth House|Sixth House|Seventh House|Eighth House|Ninth House|Tenth House|Eleventh House|Twelfth House/.test(suppressedCopy),false,'Copy must omit semantic house names and meanings when Sky B house export is suppressed.');

  const afterCopyScreen=await page.evaluate(()=>({
    rows:[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].filter(row=>Number(row.dataset.rightHouse)>=1||String(row.dataset.relationshipMode||'').toUpperCase()==='B-B'&&Number(row.dataset.leftHouse)>=1).length,
    medallions:document.querySelectorAll('#skyFoundationRelationshipList .relphi-house-medallion').length
  }));
  assert.deepEqual(afterCopyScreen,onScreenBHouseData,'Export suppression must not alter on-screen relationship house data.');

  await page.locator('#skyChartRelationshipsExport').click();
  await page.waitForFunction(()=>Boolean(window.__relphiHouseExportSnapshot),null,{timeout:8000});
  const png=await page.evaluate(()=>window.__relphiHouseExportSnapshot);
  assert.ok(png.rows>0,'PNG fixture must export relationship rows.');
  assert.equal(png.medallions,0,'PNG export must remove suppressed Sky B house medallions from cloned relationship rows.');
  assert.deepEqual(png.houseConcepts,[],'PNG export must omit suppressed Sky B house concept chips.');

  if(!(await control.evaluate(node=>node.open)))await control.locator('summary').click();
  await bToggle.check();
  await page.evaluate(()=>{window.__relphiCopiedText=''});
  await page.locator('.sky-relationship-copy-button').click();
  await page.waitForFunction(()=>Boolean(window.__relphiCopiedText),null,{timeout:3000});
  const restoredCopy=await page.evaluate(()=>window.__relphiCopiedText);
  assert.ok(/\bH(?:[1-9]|1[0-2])\b/.test(restoredCopy)||/First House|Second House|Third House|Fourth House|Fifth House|Sixth House|Seventh House|Eighth House|Ninth House|Tenth House|Eleventh House|Twelfth House/.test(restoredCopy),'Re-enabling Sky B house export must restore house information in the active copy format.');

  const relevantErrors=errors.filter(message=>!/Unexpected identifier ['"]astronomy['"]/.test(message));
  assert.deepEqual(relevantErrors,[]);
  console.log('Relationship exports can suppress house information per sky without changing the live chart.');
}finally{
  await browser.close();
}
