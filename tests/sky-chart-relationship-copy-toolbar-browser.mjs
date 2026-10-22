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

for(const width of [320,390,451,480,510,540,595,600,630,740,760,900,1200]){
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
    const svg=button?.querySelector('svg.relphi-copy-icon');
    const use=svg?.querySelector('use');
    const br=button.getBoundingClientRect(),sr=svg?.getBoundingClientRect();
    const title=header?.querySelector('h2,.sky-relationship-vocab-tabs');
    const tr=title?.getBoundingClientRect();
    const sortRect=nodes.sort?.getBoundingClientRect();
    const titleAndSort={titleTop:tr?.top,titleBottom:tr?.bottom,titleCenter:tr?(tr.top+tr.bottom)/2:null,
      sortTop:sortRect?.top,sortBottom:sortRect?.bottom,sortCenter:sortRect?(sortRect.top+sortRect.bottom)/2:null,
      titleRight:tr?.right,sortLeft:sortRect?.left};
    const bbox=use?.getBBox(),matrix=use?.getScreenCTM();
    const mark=bbox&&matrix?new DOMPoint(bbox.x+bbox.width/2,bbox.y+bbox.height/2).matrixTransform(matrix):null;
    const duplicateCount=button.querySelectorAll('svg').length;
    const pseudoBefore=getComputedStyle(button,'::before');
    const pseudoAfter=getComputedStyle(button,'::after');
    return{width:innerWidth,header:{left:hdr.left,right:hdr.right,scrollWidth:header.scrollWidth,clientWidth:header.clientWidth},container:{left:container.left,right:container.right,width:container.width},titleAndSort,bounds,
      documentScroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
      button:{class:button?.className,label:button?.getAttribute('aria-label'),title:button?.title,text:button?.textContent,iconHref:use?.getAttribute('href'),iconWidth:svg?getComputedStyle(svg).width:'',iconHeight:svg?getComputedStyle(svg).height:'',
        duplicates:duplicateCount, before:pseudoBefore.content,after:pseudoAfter.content,
        offsetX:sr?(sr.left+sr.width/2)-(br.left+br.width/2):null,
        offsetY:sr?(sr.top+sr.height/2)-(br.top+br.height/2):null,
        glyphOffsetX:mark?mark.x-(br.left+br.width/2):null,
        glyphOffsetY:mark?mark.y-(br.top+br.height/2):null}
    };
  });
  for(const [key,b] of Object.entries(result.bounds)){
    assert.ok(b&&b.width>0&&b.height>0,JSON.stringify({width,key,error:'not visible',result}));
    assert.ok(b.left>=result.container.left-2&&b.right<=result.container.right+2,
      JSON.stringify({width,key,error:'toolbar button outside comparison panel',result}));
    assert.equal(b.visibility,'visible',width+': '+key+' must be visible');
  }
  assert.ok(result.header.scrollWidth<=result.header.clientWidth+3,JSON.stringify({width,error:'header overflow',result}));
  if(result.container.width>451){
    const ts=result.titleAndSort;
    assert.ok(Math.abs(ts.titleCenter-ts.sortCenter)<=6,
      JSON.stringify({width,error:'Relationships heading and controls must remain in ONE ROW',result}));
    assert.ok(ts.titleRight<=ts.sortLeft+1,
      JSON.stringify({width,error:'sort dropdown may not overlap Relationships title',result}));
    const baseline=result.bounds.sort.top;
    for(const key of ['limit','count','copy','download']){
      const b=result.bounds[key];
      assert.ok(Math.abs((b.top+b.bottom)/2-(result.bounds.sort.top+result.bounds.sort.bottom)/2)<=6,
        JSON.stringify({width,key,error:'all controls must be vertically aligned in the same row',result}));
    }
  }
  assert.equal(result.button.iconHref,'relphi-icons.svg#relphi-copy',width+': all Copy buttons must reference the one canonical path');
  assert.equal(result.button.iconWidth,'20px',width+': canonical icon width is fixed');
  assert.equal(result.button.iconHeight,'20px',width+': canonical icon height is fixed');
  assert.equal(result.button.duplicates,1,width+': exactly one SVG exists inside the Copy button');
  assert.equal(result.button.before,'none',width+': no legacy pseudo-icon before the SVG');
  assert.equal(result.button.after,'none',width+': no legacy pseudo-icon after the SVG');
  assert.ok(Math.abs(result.button.offsetX)<=.65&&Math.abs(result.button.offsetY)<=.65,
    width+': SVG frame must be precisely centered independently of hidden text: '+JSON.stringify(result.button));
  assert.ok(Math.abs(result.button.glyphOffsetX)<=1.05&&Math.abs(result.button.glyphOffsetY)<=1.05,
    width+': actual mark must be optically centered within the button: '+JSON.stringify(result.button));
  assert.match(result.button.label,/Copy included relationships/i,width+': copy retains its accessible action');
  if(width===630)await page.screenshot({path:'relationships-copy-toolbar-630px.png',fullPage:false});
  if(width===595)await page.screenshot({path:'relationships-copy-toolbar-595px.png',fullPage:false});
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
assert.equal(await page.locator('.sky-relationship-copy-button svg use').getAttribute('href'),'relphi-icons.svg#relphi-copy','Successful copy must NOT substitute a different glyph');
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
  node.querySelector('svg.relphi-copy-icon use')?.getAttribute('href')==='relphi-icons.svg#relphi-copy'&&!!node.getAttribute('aria-label')));
assert.equal(consistent,true,'All dynamically inserted Copy controls share the SVG icon and accessible name');
const noDuplicates=await page.locator('#copy-convention-fixtures .relphi-copy-icon-button').evaluateAll(nodes=>nodes.every(node=>
  node.querySelectorAll('svg').length===1&&
  getComputedStyle(node,'::before').content==='none'&&
  getComputedStyle(node,'::after').content==='none'));
assert.equal(noDuplicates,true,'All clipboard buttons must have one SVG and zero competing pseudo-icons');
// Simulate an old module appending a second icon *after* the shared controller mounted.
await page.evaluate(()=>{
  const button=document.querySelector('#copy-convention-fixtures .relphi-copy-icon-button');
  const stray=document.createElementNS('http://www.w3.org/2000/svg','svg');
  stray.setAttribute('data-old-copy-icon','true');
  button.appendChild(stray);
});
await page.waitForFunction(()=>{
  const button=document.querySelector('#copy-convention-fixtures .relphi-copy-icon-button');
  return button?.querySelectorAll('svg').length===1&&
    button.querySelector('svg use')?.getAttribute('href')==='relphi-icons.svg#relphi-copy';
},null,{timeout:4000});
assert.deepEqual(errors.filter(e=>/Uncaught|SyntaxError|ReferenceError/.test(e)),[],'No critical page errors');
await context.close();
await browser.close();
console.log('Relationship toolbar containment, copy action, icon and feedback checks passed at nine widths.');
