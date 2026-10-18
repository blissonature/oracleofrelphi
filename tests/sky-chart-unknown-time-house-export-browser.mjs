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
    window.htmlToImage={
      toBlob:async node=>{
        window.__relphiHouseExportSnapshot={
          unknownMedallions:[...node.querySelectorAll('.rex-row')].reduce((sum,row)=>{
            const mode=String(row.dataset.relationshipMode||'').toUpperCase(),left=String(row.dataset.leftSky||'').toUpperCase(),right=String(row.dataset.rightSky||'').toUpperCase();
            const skyLeft=left==='A'||left==='B'?left:mode==='B-B'?'B':'A';
            const skyRight=right==='A'||right==='B'?right:mode==='A-A'?'A':'B';
            return sum+(skyLeft==='A'?row.querySelectorAll('.sky-foundation-relationship-placement--left .relphi-house-medallion').length:0)+(skyRight==='A'?row.querySelectorAll('.sky-foundation-relationship-placement--right .relphi-house-medallion').length:0);
          },0),
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

  // A is time-unknown and B has a confirmed time. No stale A house may escape.
  const included=await page.evaluate(()=>({
    A:window.RelphiRelationshipExportHouses?.include?.('A'),
    B:window.RelphiRelationshipExportHouses?.include?.('B')
  }));
  assert.deepEqual(included,{A:false,B:true});
  await page.evaluate(()=>{
    const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
    const chosen=rows.find(row=>String(row.dataset.relationshipMode)==='A-B'&&String(row.dataset.leftSky)==='A'&&String(row.dataset.rightSky)==='B'&&!row.hidden);
    if(!chosen)throw new Error('Missing A-B comparison row');
    rows.forEach(row=>{if(row!==chosen)row.hidden=true});
    chosen.dataset.leftHouse='7';chosen.dataset.rightHouse='5';
    const left=chosen.querySelector('.sky-foundation-relationship-placement--left .sky-foundation-relationship-copy small');
    if(left){const stale=document.createElement('span');stale.className='relphi-house-medallion';stale.textContent='7';left.appendChild(stale)}
    const sky=JSON.parse(localStorage.getItem('relphiSkyChartA'));sky.calcProfile.houseCusps=Array.from({length:12},(_,i)=>i*30);
    localStorage.setItem('relphiSkyChartA',JSON.stringify(sky));
    window.__relphiCopiedText='';
    document.execCommand=()=>false;
    const clipboard={writeText:async text=>{window.__relphiCopiedText=String(text)}};
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:clipboard});
  });
  assert.equal(await page.evaluate(()=>window.RelphiRelationshipExportHouses.include('A')),false,'Stale cusps must not re-enable unknown-time houses.');

  const row=page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relationship-mode="A-B"]:not([hidden])').first();
  const semantic=await row.evaluate(el=>window.RelphiRelationshipCopySerializer.serialize(el,{level:2,includeScope:true}));
  assert.doesNotMatch(semantic,/Seventh House/,'Unknown-time A must not contribute semantic house labels.');
  assert.match(semantic,/Fifth House/,'Known-time Sky B house remains available.');

  await page.locator('.sky-relationship-copy-button').click();
  await page.waitForFunction(()=>Boolean(window.__relphiCopiedText),null,{timeout:4000});
  const copied=await page.evaluate(()=>window.__relphiCopiedText);
  assert.match(copied,/H5|Fifth House/,'Known-time B retains its house in the active reveal mode.');
  assert.doesNotMatch(copied,/Lilith in Taurus[^\n]*Seventh House/,'Unknown-time A house must be suppressed in Relationships Copy.');
  const onScreenStale=await row.locator('.sky-foundation-relationship-placement--left .relphi-house-medallion').count();
  assert.ok(onScreenStale>=1,'Export policy must not alter the live chart.');

  await page.locator('#skyChartRelationshipsExport').click();
  await page.waitForFunction(()=>Boolean(window.__relphiHouseExportSnapshot),null,{timeout:12000});
  const png=await page.evaluate(()=>window.__relphiHouseExportSnapshot);
  assert.ok(png.rows>0,'PNG export must include a relationship.');
  assert.equal(png.unknownMedallions,0,'PNG clone must discard unknown-time house medallions but retain known-time ones.');
  assert.ok(png.houseConcepts.includes('Fifth House'),'PNG must preserve known-time B house concepts.');
  assert.ok(!png.houseConcepts.includes('Seventh House'),'PNG must omit unknown-time A house concepts.');
  assert.equal(await row.locator('.sky-foundation-relationship-placement--left .relphi-house-medallion').count(),onScreenStale,'PNG must leave the live chart unchanged.');
  assert.deepEqual(errors.filter(x=>!/Unexpected identifier ['"]astronomy['"]/.test(x)),[]);
  console.log('Unknown-time house suppression passed for semantic, bulk Copy and PNG.');
}finally{
  await browser.close();
}
