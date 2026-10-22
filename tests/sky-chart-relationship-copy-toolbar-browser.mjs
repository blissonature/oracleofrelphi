import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{
  const n=((longitude%360)+360)%360,d=n%30;
  return{name,longitude:n,sign:signs[Math.floor(n/30)],degree:Math.floor(d),minute:Math.floor((d%1)*60),second:0};
};
function sky(name,offset,instant,zone){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  const location=zone==='America/New_York'?'Boston, Massachusetts':'Salt Lake City, Utah';
  return{name,houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{instant,dateTime:instant.slice(0,16),location,locationQuery:location,timeZone:zone,latitude:40.76,longitude:-111.89,houseCusps:cusps,houseSystem:'equal-house'},
    placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const a=sky('Alpha',0,'1985-10-08T08:37:00.000Z','America/New_York');
const b=sky('Beta',29.27,'2026-10-21T22:00:00.000Z','America/Denver');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:630,height:900}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.setItem('relphiSkyChartLastModeV1','comparison');
},{a,b});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRelationshipCount',{timeout:30000});
await page.waitForSelector('.sky-relationship-copy-button.relphi-copy-icon-button',{timeout:30000});
await page.waitForSelector('.sky-relationship-sort-select',{timeout:30000});
await page.waitForSelector('.sky-relationship-limit-control',{timeout:30000});
await page.waitForSelector('#skyChartRelationshipsExport',{timeout:30000});

for(const width of [320,390,510,540,630,740,760,900,1200]){
  await page.setViewportSize({width,height:900});
  await page.waitForTimeout(170);
  const result=await page.evaluate(()=>{
    const header=document.querySelector('#skyFoundationRelationships .sky-foundation-relationships-heading');
    const button=header?.querySelector('.sky-relationship-copy-button');
    const nodes={
      sort:header?.querySelector('.sky-relationship-sort-control'),
      limit:header?.querySelector('.sky-relationship-limit-control'),
      count:header?.querySelector('#skyFoundationRelationshipCount'),
      copy:button,
      download:header?.querySelector('#skyChartRelationshipsExport')
    };
    const hdr=header?.getBoundingClientRect();
    const container=document.getElementById('skyFoundationRelationships')?.getBoundingClientRect();
    const bounds=Object.fromEntries(Object.entries(nodes).map(([key,node])=>{
      if(!node)return[key,null];
      const r=node.getBoundingClientRect(),style=getComputedStyle(node);
      return[key,{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:style.display,visibility:style.visibility}];
    }));
    const pseudo=button?getComputedStyle(button,'::before'):null;
    return{width:innerWidth,header:{left:hdr.left,right:hdr.right,scrollWidth:header.scrollWidth,clientWidth:header.clientWidth},container:{left:container.left,right:container.right},bounds,
      documentScroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
      button:{class:button?.className,label:button?.getAttribute('aria-label'),title:button?.title,text:button?.textContent,iconContent:pseudo?.content,iconWidth:pseudo?.width,iconMask:pseudo?.maskImage,iconColor:pseudo?.backgroundColor}
    };
  });
  for(const [key,b] of Object.entries(result.bounds)){
    assert.ok(b&&b.width>0&&b.height>0,JSON.stringify({width,key,error:'not visible',result}));
    assert.ok(b.left>=result.container.left-2&&b.right<=result.container.right+2,
      JSON.stringify({width,key,error:'toolbar button outside comparison panel',result}));
    assert.equal(b.visibility,'visible',width+': '+key+' must be visible');
  }
  assert.ok(result.header.scrollWidth<=result.header.clientWidth+3,JSON.stringify({width,error:'header overflow',result}));
  assert.ok(result.button.iconMask.includes('data:image/svg'),width+': icon must be a standard two-rectangle SVG');
  assert.equal(result.button.iconWidth,'18px',width+': copy glyph should stay legible');
  assert.match(result.button.label,/Copy included relationships/i,width+': copy retains its accessible action');
  if(width===630)await page.screenshot({path:'relationships-copy-toolbar-630px.png',fullPage:false});
}
await page.setViewportSize({width:630,height:900});
await page.evaluate(()=>{
  window.__copiedRelationshipText='';
  document.execCommand=function(command){
    if(command==='copy'){
      window.__copiedRelationshipText=document.activeElement?.value||'';
      return true;
    }
    return false;
  };
});
await page.locator('.sky-relationship-copy-button').click();
await page.waitForFunction(()=>Boolean(window.__copiedRelationshipText),null,{timeout:8000});
assert.ok((await page.evaluate(()=>window.__copiedRelationshipText)).includes('Sky A:'),'Icon button must still invoke existing relationship serializer');
await page.waitForFunction(()=>document.querySelector('.sky-relationship-copy-button')?.dataset.relphiCopyFeedback==='done',null,{timeout:3000});
assert.match(await page.locator('.sky-relationship-copy-button').getAttribute('aria-label'),/^Copied/i,'Feedback is accessible');
await page.waitForFunction(()=>document.querySelector('.sky-relationship-copy-button')?.dataset.relphiCopyFeedback==='idle',null,{timeout:5000});

// The same convention must attach to copy controls inserted asynchronously.
const dynamic=await page.evaluate(async()=>{
  const container=document.createElement('div');container.id='copy-convention-fixtures';document.body.appendChild(container);
  for(const [selectorName,label] of [
    ['sky-wheel-copy-button','Copy'],['sky-card-hits-copy-all','Copy All'],
    ['sky-configuration-copy-button','Copy'],['sky-configuration-tile-copy','Copy'],
    ['relphi-copy-reading','Copy'],['sky-quick-copy-button','Copy']
  ]){
    const button=document.createElement('button');button.className=selectorName;button.textContent=label;container.appendChild(button);
  }
  return true;
});
await page.waitForFunction(()=>document.querySelectorAll('#copy-convention-fixtures .relphi-copy-icon-button').length===6,null,{timeout:4000});
const consistent=await page.locator('#copy-convention-fixtures .relphi-copy-icon-button').evaluateAll(nodes=>nodes.every(node=>
  getComputedStyle(node,'::before').maskImage.includes('data:image/svg')&&!!node.getAttribute('aria-label')));
assert.equal(consistent,true,'All dynamically inserted Copy controls share the SVG icon and accessible name');
assert.deepEqual(errors.filter(e=>/Uncaught|SyntaxError|ReferenceError/.test(e)),[],'No critical page errors');
await context.close();
await browser.close();
console.log('Relationship toolbar containment, copy action, icon and feedback checks passed at nine widths.');
