// Regression: mobile virtual tip must acquire actual aspect lines through SVG overlays.
// Run with an app server on port 4173 and Playwright installed.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
  await page.addInitScript(()=>{
    const sky=(name,offset)=>({
      name,houseSystem:'porphyry',
      calcProfile:{instant:'2026-10-20T12:00:00.000Z',dateTime:'2026-10-20T06:00:00',timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'porphyry',houseCusps:Array.from({length:12},(_,i)=>(168+offset+i*30)%360)},
      houseCusps:Array.from({length:12},(_,i)=>(168+offset+i*30)%360),
      placements:Object.fromEntries(Object.entries({Sun:170,Moon:279,Mercury:195,Venus:215,Mars:118,Jupiter:142,Saturn:13,Uranus:65,Neptune:3,Pluto:303,Ascendant:168,Descendant:348,'Medium Coeli':258,'Imum Coeli':78}).map(([key,value])=>[key,{name:key,longitude:value+offset}]))
    });
    localStorage.setItem('relphiSkyChartA',JSON.stringify(sky('A',0)));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(sky('B',17)));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    localStorage.setItem('relphiSkyHarmonicWindowV1','7');
  });
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('#skyFoundationRoot[aria-busy="false"]').waitFor({timeout:25000});
  await page.waitForFunction(()=>!!window.RelphiSkyFoundationInteractions?.previewVirtualPointer&&document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').length>0,null,{timeout:20000});
  await page.locator('#skyFoundationWheelMount').scrollIntoViewIfNeeded();
  const result=await page.evaluate(()=>{
    const controller=window.RelphiSkyFoundationInteractions;
    const wheel=document.querySelector('#skyFoundationWheelMount > svg');
    const lines=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
      .filter(line=>{const s=getComputedStyle(line);return !line.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0;});
    let observed=null;
    for(const line of lines){
      const matrix=line.getScreenCTM();
      if(!matrix)continue;
      for(const fraction of [.3,.5,.7]){
        const point=wheel.createSVGPoint();
        point.x=Number(line.getAttribute('x1'))*(1-fraction)+Number(line.getAttribute('x2'))*fraction;
        point.y=Number(line.getAttribute('y1'))*(1-fraction)+Number(line.getAttribute('y2'))*fraction;
        const p=point.matrixTransform(matrix);
        const bounds=wheel.getBoundingClientRect();
        if(p.x<bounds.left+20||p.x>bounds.right-20||p.y<bounds.top+20||p.y>bounds.bottom-20)continue;
        // An actual visible aspect should resolve even when a different SVG
        // layer wins elementFromPoint at its center.
        const direct=controller.previewVirtualPointer(p.x,p.y);
        if(direct?.kind!=='aspect')continue;
        // A small perpendicular offset must still acquire the same line.
        const a=wheel.createSVGPoint(),b=wheel.createSVGPoint();
        a.x=Number(line.getAttribute('x1'));a.y=Number(line.getAttribute('y1'));
        b.x=Number(line.getAttribute('x2'));b.y=Number(line.getAttribute('y2'));
        const u=a.matrixTransform(matrix),v=b.matrixTransform(matrix),dx=v.x-u.x,dy=v.y-u.y,length=Math.hypot(dx,dy);
        if(length<20)continue;
        const offset=controller.previewVirtualPointer(p.x-dy/length*5,p.y+dx/length*5);
        if(offset?.kind==='aspect'&&offset.value===direct.value){observed={direct,offset};break}
      }
      if(observed)break;
    }
    controller.clearVirtualPointer();
    return observed;
  });
  assert.ok(result,'Visible aspect line and adjacent 5px position must both acquire an aspect');
  assert.equal(result.direct.value,result.offset.value,'Adjacent hover must retain the same aspect identity');
  assert.deepEqual(errors,[],'No browser JavaScript errors');
  await page.screenshot({path:'/tmp/sky-chart-virtual-aspect-hover.png',fullPage:false});
  console.log('PASS mobile virtual aspect proximity: center + 5px offset');
}finally{
  await context.close();
  await browser.close();
}
