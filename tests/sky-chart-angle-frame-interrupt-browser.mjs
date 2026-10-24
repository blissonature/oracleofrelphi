import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const fixture=(offset=0)=>{
 const houseCusps=Array.from({length:12},(_,i)=>(168+offset+i*30)%360);
 return {
 name:offset?'Comparison B':'Birth A',
 houseSystem:'porphyry',
 calcProfile:{instant:'2026-10-20T12:00:00.000Z',dateTime:'2026-10-20T06:00:00',timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'porphyry',houseCusps},
 houseCusps,
 placements:{
  Sun:{name:'Sun',longitude:170+offset},Moon:{name:'Moon',longitude:279+offset},
  Mercury:{name:'Mercury',longitude:195+offset},Venus:{name:'Venus',longitude:215+offset},
  Mars:{name:'Mars',longitude:118+offset},Jupiter:{name:'Jupiter',longitude:142+offset},
  Saturn:{name:'Saturn',longitude:13+offset},Uranus:{name:'Uranus',longitude:65+offset},
  Neptune:{name:'Neptune',longitude:3+offset},Pluto:{name:'Pluto',longitude:303+offset},
  Ascendant:{name:'Ascendant',longitude:168+offset},Descendant:{name:'Descendant',longitude:348+offset},
  'Medium Coeli':{name:'Medium Coeli',longitude:258+offset},'Imum Coeli':{name:'Imum Coeli',longitude:78+offset}
 }
}};

const browser=await chromium.launch({headless:true});
try{
for(const compare of [false,true]){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({a,b,compare})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    if(compare)localStorage.setItem('relphiSkyChartB',JSON.stringify(b));else localStorage.removeItem('relphiSkyChartB');
    localStorage.setItem('relphiSkyChartLastModeV1',compare?'comparison':'standalone');
  },{a:fixture(),b:fixture(17),compare});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  await page.waitForTimeout(500);
  const result=await page.evaluate(()=>{
    const wheel=document.querySelector('#skyFoundationWheelMount > svg');
    const frames=[...wheel.querySelectorAll('[data-angle-axis="true"]')];
    const lines=[...wheel.querySelectorAll('.sky-foundation-divider,.sky-foundation-angle-axis')];
    const overlaps=[];
    for(const frame of frames){
      const deg=Number(frame.dataset.angleLongitude),radius=Number(frame.dataset.angleLane);
      const alpha=deg*Math.PI/180,theta=(deg+270)*Math.PI/180;
      const cx=600+radius*Math.cos(alpha),cy=600+radius*Math.sin(alpha),co=Math.cos(theta),si=Math.sin(theta);
      for(const line of lines){
        const group=line.closest('[data-layer]')?.dataset.layer;
        const sky=line.dataset.sky||(group==='a-houses'?'A':group==='b-houses'?'B':'');
        if(sky!==frame.dataset.sky)continue;
        const x=Number(line.getAttribute('x1'))-cx,y=Number(line.getAttribute('y1'))-cy;
        const dx=Number(line.getAttribute('x2'))-Number(line.getAttribute('x1')),dy=Number(line.getAttribute('y2'))-Number(line.getAttribute('y1'));
        const coordinates=[[x*co+y*si,dx*co+dy*si,18],[-x*si+y*co,-dx*si+dy*co,11]];
        let low=0,high=1;
        for(const [p,v,h] of coordinates){
          if(Math.abs(v)<1e-9){if(Math.abs(p)>=h){low=1;high=0;break;}continue;}
          const a=(-h-p)/v,b=(h-p)/v;low=Math.max(low,Math.min(a,b));high=Math.min(high,Math.max(a,b));
        }
        if(high>low+1e-6)overlaps.push({frame:frame.dataset.placement,sky:frame.dataset.sky,line:line.classList.value});
      }
    }
    return{frames:frames.map(f=>f.dataset.sky+':'+f.dataset.placement),lines:lines.length,overlaps};
  });
  // Dimming a selected angle frame must not reconnect divider/axis lines
  // through that still-rendered rectangular label.
  await page.evaluate(()=>{
    document.querySelectorAll('#skyFoundationWheelMount [data-angle-axis="true"]').forEach(host=>{
      host.style.opacity='0.4';
    });
  });
  await page.waitForTimeout(250);
  const dimmed=await page.evaluate(()=>{
    const wheel=document.querySelector('#skyFoundationWheelMount > svg');
    const frames=[...wheel.querySelectorAll('[data-angle-axis="true"]')];
    const lines=[...wheel.querySelectorAll('.sky-foundation-divider,.sky-foundation-angle-axis')];
    const overlaps=[];
    for(const frame of frames){
      const deg=Number(frame.dataset.angleLongitude),radius=Number(frame.dataset.angleLane);
      const p=deg*Math.PI/180,theta=(deg+270)*Math.PI/180;
      const cx=600+radius*Math.cos(p),cy=600+radius*Math.sin(p),co=Math.cos(theta),si=Math.sin(theta);
      for(const line of lines){
        const group=line.closest('[data-layer]')?.dataset.layer;
        const sky=line.dataset.sky||(group==='a-houses'?'A':group==='b-houses'?'B':'');
        if(sky!==frame.dataset.sky)continue;
        const x=Number(line.getAttribute('x1'))-cx,y=Number(line.getAttribute('y1'))-cy;
        const dx=Number(line.getAttribute('x2'))-Number(line.getAttribute('x1'));
        const dy=Number(line.getAttribute('y2'))-Number(line.getAttribute('y1'));
        let lo=0,hi=1;
        for(const [p,v,h] of [[x*co+y*si,dx*co+dy*si,18],[-x*si+y*co,-dx*si+dy*co,11]]){
          if(Math.abs(v)<1e-9){if(Math.abs(p)>=h){lo=1;hi=0;break}continue}
          const a=(-h-p)/v,b=(h-p)/v;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
        }
        if(hi>lo+1e-6)overlaps.push(frame.dataset.placement+':'+line.classList.value);
      }
    }
    return overlaps;
  });
  assert.deepEqual(dimmed,[],'Dimming angle labels must never cause house lines to cross them');
  console.log('ANGLE_FRAMES',compare?'comparison':'standalone',JSON.stringify(result));
  assert.ok(result.frames.length>=4,'Four angle frames should exist');
  assert.ok(result.lines>0,'The angle/divider lines must be rendered');
  assert.deepEqual(result.overlaps,[],'No line may pass through an angle frame');
  assert.deepEqual(errors,[]);
  await page.close();
}
}finally{await browser.close()}
console.log('PASS angle frame interruption on both wheel modes');
