import {chromium} from 'playwright';
import path from 'node:path';

// Observational browser CPU profile; never alters app code or replaces listeners.
const positions={
 Sun:170,Moon:279,Mercury:195,Venus:215,Mars:118,Jupiter:142,
 Saturn:13,Uranus:65,Neptune:3,Pluto:303,
 Ascendant:168,Descendant:348,Midheaven:258,IC:78,
 Chiron:109,'North Node':22,'South Node':202,Lilith:335,
 Vertex:42,'Anti-Vertex':222,'Part of Fortune':155
};
function sky(slot){
 const offset=slot==='A'?0:17,cusps=Array.from({length:12},(_,i)=>(168+offset+i*30)%360);
 const placements=Object.fromEntries(Object.entries(positions).map(([name,lng])=>[name,{name,longitude:(lng+offset)%360}]));
 return{name:'Interaction benchmark '+slot,houseSystem:'porphyry',houseCusps:cusps,placements,
  calcProfile:{dateTime:'2026-10-20T06:00',instant:'2026-10-20T12:00:00.000Z',
   timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'porphyry',houseCusps:cusps}};
}
function metrics(rows){
 return Object.fromEntries(rows.metrics.map(x=>[x.name,x.value]));
}
function delta(before,after,k){return Math.round(((after[k]||0)-(before[k]||0))*1000)/1000}
async function run(browser,{comparison,flashlight}){
 const context=await browser.newContext({viewport:{width:1390,height:1060}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({
  path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({
  path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 if(!flashlight)await page.route('**/sky-chart-house-flashlight-v1.js*',route=>route.abort());
 await page.addInitScript(({a,b,comparison})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  if(comparison)localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  else localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyChartLastModeV1',comparison?'comparison':'standalone');
  localStorage.setItem('relphiSkyHarmonicWindowV1','12');
  localStorage.removeItem('relphiSkyAspectMatrixV1');
 },{a:sky('A'),b:sky('B'),comparison});
 const startup=Date.now();
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#skyFoundationRoot[aria-busy="false"]').waitFor({timeout:35000});
 await page.waitForFunction(comparison?()=>document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel')?.getAttribute('data-outer-sky')==='B':()=>!!document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel[data-single-sky="A"]'),null,{timeout:20000});
 await page.waitForTimeout(750);
 const readyMs=Date.now()-startup;
 await page.locator('#skyFoundationWheelMount > .sky-foundation-wheel').scrollIntoViewIfNeeded();
 const setup=await page.evaluate(()=>{
  const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
  const layer=wheel.querySelector('[data-layer="aspects"]');
  const bounds=wheel.getBoundingClientRect(), svg=wheel.createSVGPoint(),matrix=wheel.getScreenCTM();
  const moves=[];
  for(let i=0;i<36;i++){
   const deg=(i*137.508)%360,r= i%3===0?240:i%3===1?485:330,
     rad=deg*Math.PI/180;
   svg.x=600+r*Math.cos(rad);svg.y=600+r*Math.sin(rad);
   const pos=svg.matrixTransform(matrix);
   if(pos.x>15&&pos.x<innerWidth-15&&pos.y>15&&pos.y<innerHeight-15)moves.push([pos.x,pos.y]);
  }
  return{
   visible:wheel.getAttribute('data-outer-sky')||wheel.getAttribute('data-single-sky'),
   lines:layer?.querySelectorAll('line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').length||0,
   hitClones:layer?.querySelectorAll('.sky-foundation-aspect-hit').length||0,
   relationshipTiles:document.querySelectorAll('.sky-foundation-relationship-row').length,
   focusPieces:wheel.querySelectorAll('[data-focus-piece]').length,
   bound:{width:bounds.width,height:bounds.height},moves
  };
 });
 if(setup.moves.length<20)throw Error('Too few in-viewport probes '+JSON.stringify(setup));
 const cdp=await context.newCDPSession(page);
 await cdp.send('Performance.enable');
 await cdp.send('Profiler.enable');
 // Warm the same path to exclude first wheel hit and layout initialization.
 for(const [x,y] of setup.moves.slice(0,8))await page.mouse.move(x,y);
 await page.waitForTimeout(150);
 const before=metrics(await cdp.send('Performance.getMetrics'));
 await cdp.send('Profiler.start');
 const wallStart=Date.now();
 for(let k=0;k<2;k++)for(const [x,y] of setup.moves)await page.mouse.move(x,y);
 await page.waitForTimeout(250);
 const wallMs=Date.now()-wallStart;
 const {profile}=await cdp.send('Profiler.stop');
 const after=metrics(await cdp.send('Performance.getMetrics'));
 const nodes=new Map(profile.nodes.map(n=>[n.id,n]));
 const owners=new Map(),fnSelf=new Map();
 for(const id of profile.samples||[]){
  const f=nodes.get(id)?.callFrame;
  if(!f)continue;
  const script=f.url.split('/').pop()||'(browser/unknown)';
  owners.set(script,(owners.get(script)||0)+1);
  const name=script+'::'+f.functionName;
  fnSelf.set(name,(fnSelf.get(name)||0)+1);
 }
 const rank=m=>[...m].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k,v])=>({owner:k,samples:v}));
 const parents=new Map();
 profile.nodes.forEach(node=>(node.children||[]).forEach(child=>parents.set(child,node.id)));
 const criticalCallers=new Map();
 for(const id of profile.samples||[]){
  const self=nodes.get(id)?.callFrame;
  if(self?.functionName!=='hasStoredSkyB'&&self?.functionName!=='patternScope'&&self?.functionName!=='resultHouseFor')continue;
  let parent=parents.get(id),depth=0,ancestry=[];
  while(parent&&depth<5){
   const frame=nodes.get(parent)?.callFrame;
   if(frame)ancestry.push((frame.url.split('/').pop()||'?')+'::'+frame.functionName);
   parent=parents.get(parent);depth++;
  }
  const label=self.functionName+' ← '+ancestry.join(' ← ');
  criticalCallers.set(label,(criticalCallers.get(label)||0)+1);
 }
 const result={
  comparison,flashlight,readyMs,wallMs,moveCount:setup.moves.length*3,
  lines:setup.lines,hitClones:setup.hitClones,relationshipTiles:setup.relationshipTiles,
  focusPieces:setup.focusPieces,
  taskSeconds:delta(before,after,'TaskDuration'),
  scriptSeconds:delta(before,after,'ScriptDuration'),
  layoutSeconds:delta(before,after,'LayoutDuration'),
  recalcStyleSeconds:delta(before,after,'RecalcStyleDuration'),
  cpuSamples:profile.samples?.length||0,
  topScripts:rank(owners),topFunctions:rank(fnSelf),criticalCallers:rank(criticalCallers),
  errors
 };
 console.log('HOVER_PROFILE',JSON.stringify(result));
 await cdp.detach();await context.close();
 return result;
}
const browser=await chromium.launch({headless:true});
try{
 const order=[
  {comparison:false,flashlight:true},
  {comparison:true,flashlight:true},
  {comparison:true,flashlight:false},
  {comparison:false,flashlight:false}
 ];
 const results=[];
 for(const option of order)results.push(await run(browser,option));
 console.log('HOVER_PROFILE_SUMMARY',JSON.stringify(results.map(({comparison,flashlight,readyMs,wallMs,moveCount,lines,hitClones,relationshipTiles,taskSeconds,scriptSeconds,layoutSeconds,recalcStyleSeconds,cpuSamples,errors})=>({comparison,flashlight,readyMs,wallMs,moveCount,lines,hitClones,relationshipTiles,taskSeconds,scriptSeconds,layoutSeconds,recalcStyleSeconds,cpuSamples,errorCount:errors.length}))));
}finally{await browser.close()}
