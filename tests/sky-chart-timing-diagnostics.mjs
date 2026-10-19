import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const instant='2026-09-10T18:00:00.000Z';
const profile={instant,dateTime:instant,timeZone:'America/Denver',latitude:40.7608,longitude:-111.8910,houseSystem:'whole-sign'};
const points={Venus:{name:'Venus',glyphId:'venus',longitude:210.3},Chiron:{name:'Chiron',glyphId:'chiron',longitude:30.3,source:'swiss-ephemeris-chiron'},Sun:{name:'Sun',glyphId:'sun',longitude:170}};
const sky={name:'Timed sky',houseSystem:'whole-sign',calcProfile:profile,placements:points};
try {
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(a=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(a));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},sky);
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  await page.waitForTimeout(2500);
  const diag=await page.evaluate(()=>{
    const row=[...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')].find(row=>new Set([row.dataset.leftPlacement,row.dataset.rightPlacement]).has('chiron'));
    try{row?.click()}catch(_){}
    return {row:row?.dataset,api:window.RelphiRelationshipTransitMeta?.exportTimingForRow?.(row),chironReady:window.RelphiChironEphemeris?.isReady?.(),chironNow:window.RelphiChironEphemeris?.calculateSync?.(new Date('2026-09-10T18:00:00Z')),meta:row?.querySelector('.inline-rel-transit-window')?.outerHTML};
  });
  await page.waitForTimeout(1200);
  console.log('TIMING_DIAG',JSON.stringify(diag),JSON.stringify(errors));
  console.log('TIMING_DIAG_AFTER',JSON.stringify(await page.evaluate(()=>{const row=[...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')].find(row=>new Set([row.dataset.leftPlacement,row.dataset.rightPlacement]).has('chiron'));return{expanded:row?.classList.contains('is-inline-expanded'),meta:row?.querySelector('.inline-rel-transit-window')?.outerHTML}})));
}finally{await browser.close()}
