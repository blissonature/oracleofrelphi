import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const ref=process.env.PREVIEW_REF;
assert.match(ref||'',/^[0-9a-f]{40}$/);
const hosts=[
  ['githack',`https://raw.githack.com/blissonature/oracleofrelphi/${ref}/sky-chart-preview/sky-chart.html?ref=${ref}`],
  ['statically',`https://cdn.statically.io/gh/blissonature/oracleofrelphi@${ref}/sky-chart-preview/sky-chart.html?ref=${ref}`]
];
const instant='1985-10-08T08:37:00Z';
const positions={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.8833,Mars:167.8667,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
const payload={name:'Preview test',houseSystem:'porphyry',houseCusps:Array.from({length:12},(_,i)=>(168.38+30*i)%360),calcProfile:{dateTime:'1985-10-08T04:37',instant,latitude:42.4251,longitude:-71.0662,location:'Malden, Massachusetts',timeZone:'America/New_York',houseSystem:'porphyry'},placements:Object.fromEntries(Object.entries(positions).map(([name,longitude])=>[name,{name,longitude}]))};
const browser=await chromium.launch({headless:true});
let passed=0;
try {
  for(const [name,url] of hosts){
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('requestfailed',r=>{if(errors.length<18)errors.push(r.failure()?.errorText+' '+r.url().slice(0,140))});
    await page.addInitScript(p=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(p));
      localStorage.setItem('relphiSkyChartB',JSON.stringify({...p,name:'Preview B'}));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    },payload);
    try {
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>{
        const root=document.querySelector('#skyFoundationRoot');
        const wheel=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
        return root?.getAttribute('aria-busy')==='false'&&wheel&&
          getComputedStyle(document.querySelector('#skyFoundationWheelMount')).visibility!=='hidden';
      },null,{timeout:40000});
      const state=await page.evaluate(()=>{
        const mount=document.querySelector('#skyFoundationWheelMount');
        const wheel=mount?.querySelector(':scope > svg.sky-foundation-wheel');
        return{width:wheel?.getBoundingClientRect().width,scrollWidth:mount?.scrollWidth,client:mount?.clientWidth,bubbles:wheel?.querySelectorAll('[data-layer="placements"] > g[data-placement]').length,rootBusy:document.querySelector('#skyFoundationRoot')?.getAttribute('aria-busy')};
      });
      console.log('PREVIEW_HOST_PASS',name,url,JSON.stringify(state));
      assert.ok(state.bubbles>10,'Comparison wheel must show placement bubbles');
      assert.ok(state.width>=719,'Mobile wheel must be physically magnified');
      passed++;
    }catch(error){
      const details=await page.evaluate(()=>({
        href:location.href,title:document.title,base:document.baseURI,
        shell:document.getElementById('previewStatus')?.textContent?.slice(0,600),
        busy:document.querySelector('#skyFoundationRoot')?.getAttribute('aria-busy'),
        wheel:document.querySelectorAll('.sky-foundation-wheel').length,
        scripts:document.scripts.length,css:document.styleSheets.length,
        body:document.body?.innerText?.slice(0,450),
        state:document.readyState
      })).catch(e=>({evalError:String(e)}));
      console.log('PREVIEW_HOST_FAIL',name,url,String(error).slice(0,350),JSON.stringify({details,errors:errors.slice(0,30)}));
    }finally{await ctx.close()}
  }
}finally{await browser.close()}
assert.ok(passed>=1,'No working commit-specific browser preview host available');
