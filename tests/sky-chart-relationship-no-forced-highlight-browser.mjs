import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const sky=(name,offset)=>({
  name,houseSystem:'whole-sign',
  calcProfile:{instant:'2026-11-20T12:00:00.000Z',dateTime:'2026-11-20T12:00',timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'whole-sign'},
  houseCusps:Array.from({length:12},(_,i)=>(165+offset+i*30)%360),
  placements:Object.fromEntries([
    ['Sun',195],['Moon',118.4],['Mercury',206.1],['Venus',169.8],['Mars',167.8],
    ['Jupiter',307.1],['Saturn',235.5],['Uranus',254.8],['Neptune',271],
    ['Pluto',213.8],['Ascendant',165],['Midheaven',82],['Chiron',49]
  ].map(([name,longitude])=>[name,{name,longitude:(longitude+offset)%360}]))
});
const rows='#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relationship-mode="A-B"]:visible';
const selector='#skyFoundationRelationshipList > .sky-foundation-relationship-row';
const browser=await chromium.launch({headless:true});
async function pageFor(context){
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  },{a:sky('Sky A',0),b:sky('Sky B',1)});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false'&&document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relationship-mode="A-B"]').length>1&&!!window.RelphiInlineRelationship,{timeout:30000});
  await page.waitForTimeout(450);
  return {page,errors};
}
function selection(page){
  return page.evaluate(()=>{
    const rows=[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')];
    return {
      current:rows.filter(r=>r.getAttribute('aria-current')==='true').map(r=>r.dataset.relationIndex),
      wheelTargets:rows.filter(r=>r.classList.contains('is-wheel-target')).map(r=>r.dataset.relationIndex),
      selected:rows.filter(r=>r.classList.contains('is-selected')).map(r=>r.dataset.relationIndex),
      expanded:rows.filter(r=>r.classList.contains('is-inline-expanded')).map(r=>r.dataset.relationIndex),
      legacyHidden:document.querySelector('#skySelectedRelationship')?.hidden
    };
  });
}
try {
  for(const [label,width,height,mobile] of [
    ['desktop',1280,900,false],['mobile',390,844,true]
  ]){
    const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
    try{
      const {page,errors}=await pageFor(context);
      const initial=await selection(page);
      assert.deepEqual(initial.current,[],label+': no relationship is implicitly selected');
      assert.deepEqual(initial.wheelTargets,[],label+': no wheel-target class without a user selection');
      assert.deepEqual(initial.selected,[],label+': no is-selected tile without a user selection');
      assert.deepEqual(initial.expanded,[],label+': no relationship should open on load');
      assert.equal(initial.legacyHidden,true,label+': legacy selected panel stays hidden until deliberate selection');
      const first=page.locator(rows).first(),second=page.locator(rows).nth(1);
      await first.scrollIntoViewIfNeeded();
      if(!mobile){
        await page.mouse.move(0,0);
        const unhovered=await first.evaluate(row=>getComputedStyle(row).backgroundColor);
        await first.hover();await second.hover();
        const restored=await first.evaluate(row=>({background:getComputedStyle(row).backgroundColor,hover:row.matches(':hover')}));
        assert.equal(restored.hover,false,'Hovering another tile removes previous hover');
        assert.equal(restored.background,unhovered,'Previous tile returns to its default background');
        assert.deepEqual((await selection(page)).current,[],'Hover never creates a selected relationship');
        await page.mouse.move(0,0);
      }
      await page.screenshot({path:'relationship-highlight-unselected-'+label+'.png'});
      if(mobile)await first.tap();else await first.click();
      await page.waitForFunction(()=>!!document.querySelector('#skyFoundationRelationshipList > .sky-foundation-relationship-row.is-inline-expanded'),null,{timeout:10000});
      const expanded=await selection(page);
      assert.equal(expanded.expanded.length,1,label+': deliberate activation expands exactly one tile');
      if(!mobile){
        assert.equal(expanded.current.length,1,'Desktop explicit selection still highlights the expanded row');
      }
      if(mobile)await first.tap();else await first.click();
      await page.waitForFunction(()=>!document.querySelector('#skyFoundationRelationshipList > .sky-foundation-relationship-row.is-inline-expanded'),null,{timeout:10000});
      await page.waitForTimeout(180);
      const closed=await selection(page);
      assert.deepEqual(closed.current,[],label+': collapsed relationship must not remain selected');
      assert.deepEqual(closed.wheelTargets,[],label+': collapse must not force a wheel highlight');
      assert.deepEqual(closed.selected,[],label+': collapse must not force is-selected');
      if(!mobile){
        await second.hover();
        assert.deepEqual((await selection(page)).current,[],label+': hovering another tile after collapse must not revive prior highlight');
      }
      await page.screenshot({path:'relationship-highlight-after-collapse-'+label+'.png'});
      assert.deepEqual(errors,[],label+': no unexpected script exceptions');
      console.log(label+' relationship highlight PASS',JSON.stringify({initial,expanded,closed}));
    }finally{await context.close()}
  }
}finally{await browser.close()}
