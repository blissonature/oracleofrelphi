import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const instant='2026-09-19T18:30:00.000Z';
const profile={instant,dateTime:instant,timeZone:'America/Denver',latitude:40.7608,longitude:-111.8910,houseSystem:'whole-sign'};

function sky(name,offset){
  return {
    name,houseSystem:'whole-sign',calcProfile:profile,
    houseCusps:Array.from({length:12},(_,i)=>(168+offset+i*30)%360),
    placements:{
      Sun:{name:'Sun',glyphId:'sun',longitude:170+offset},
      Moon:{name:'Moon',glyphId:'moon',longitude:279+offset},
      Mercury:{name:'Mercury',glyphId:'mercury',longitude:195+offset},
      Venus:{name:'Venus',glyphId:'venus',longitude:215+offset},
      Mars:{name:'Mars',glyphId:'mars',longitude:118+offset},
      Jupiter:{name:'Jupiter',glyphId:'jupiter',longitude:142+offset},
      Saturn:{name:'Saturn',glyphId:'saturn',longitude:13+offset},
      Uranus:{name:'Uranus',glyphId:'uranus',longitude:65+offset},
      Neptune:{name:'Neptune',glyphId:'neptune',longitude:3+offset},
      Pluto:{name:'Pluto',glyphId:'pluto',longitude:303+offset},
      Ascendant:{name:'Ascendant',glyphId:'asc',longitude:180+offset},
      Descendant:{name:'Descendant',glyphId:'dsc',longitude:0+offset},
      'Medium Coeli':{name:'Medium Coeli',glyphId:'mc',longitude:285+offset},
      'Imum Coeli':{name:'Imum Coeli',glyphId:'ic',longitude:105+offset},
      'North Node':{name:'North Node',glyphId:'north-node',longitude:328+offset},
      'South Node':{name:'South Node',glyphId:'south-node',longitude:148+offset}
    }
  };
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
try{
  const page=await context.newPage();
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    localStorage.setItem('relphiSkyRelationshipDisplayV1','glyphs');
  },{a:sky('A',0),b:sky('B',2)});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle',timeout:30000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.skyBPresent==='true',null,{timeout:10000});
  await page.waitForFunction(()=>window.__relphiSkyHoverFastPathV4===true,null,{timeout:10000});
  await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationWheelMount .sky-foundation-aspect-hit').length>8,null,{timeout:10000});
  await page.waitForTimeout(200);

  const hitGeometry=await page.evaluate(()=>{
    const hit=document.querySelector('#skyFoundationWheelMount .sky-foundation-aspect-hit');
    const style=hit?getComputedStyle(hit):null;
    return hit?{
      width:parseFloat(style.strokeWidth),
      linecap:style.strokeLinecap,
      vectorEffect:style.vectorEffect,
      pointerEvents:style.pointerEvents
    }:null;
  });
  assert.ok(hitGeometry,'wide aspect hit target should exist');
  assert.ok(hitGeometry.width>=28,`aspect hit stroke should be at least 28px, got ${hitGeometry.width}`);
  assert.equal(hitGeometry.linecap,'round');
  assert.equal(hitGeometry.vectorEffect,'non-scaling-stroke');
  assert.equal(hitGeometry.pointerEvents,'stroke');

  const probe=await page.evaluate(()=>{
    const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')].filter(line=>{
      const s=getComputedStyle(line);
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0;
    });
    const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
    const bounds=wheel.getBoundingClientRect();
    const point=(line,x,y)=>{
      const p=new DOMPoint(x,y).matrixTransform(line.getScreenCTM());
      return{x:p.x,y:p.y};
    };
    const distance=(p,a,b)=>{
      const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
      if(!l)return Math.hypot(p.x-a.x,p.y-a.y);
      const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));
      return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
    };
    const segments=lines.map(line=>{
      const a=point(line,Number(line.getAttribute('x1')),Number(line.getAttribute('y1')));
      const b=point(line,Number(line.getAttribute('x2')),Number(line.getAttribute('y2')));
      return{line,a,b,length:Math.hypot(b.x-a.x,b.y-a.y)};
    }).filter(s=>s.length>70);
    let best=null;
    for(const segment of segments){
      const dx=segment.b.x-segment.a.x,dy=segment.b.y-segment.a.y,len=segment.length;
      const nx=-dy/len,ny=dx/len;
      for(const t of [.3,.5,.7]){
        const base={x:segment.a.x+dx*t,y:segment.a.y+dy*t};
        for(const sign of [-1,1]){
          const acquire={x:base.x+nx*12*sign,y:base.y+ny*12*sign};
          const retain={x:base.x+nx*16.5*sign,y:base.y+ny*16.5*sign};
          if(acquire.x<bounds.left+4||acquire.x>bounds.right-4||acquire.y<bounds.top+4||acquire.y>bounds.bottom-4)continue;
          if(retain.x<bounds.left+4||retain.x>bounds.right-4||retain.y<bounds.top+4||retain.y>bounds.bottom-4)continue;
          let clearance=Infinity;
          for(const other of segments){
            if(other===segment)continue;
            clearance=Math.min(clearance,distance(acquire,other.a,other.b),distance(retain,other.a,other.b));
          }
          if(!best||clearance>best.clearance){
            best={
              acquire,retain,clearance,
              relationIndex:segment.line.dataset.relationIndex,
              aspect:segment.line.dataset.aspect,
              leftPlacement:segment.line.dataset.leftPlacement,
              rightPlacement:segment.line.dataset.rightPlacement
            };
          }
        }
      }
    }
    return best;
  });
  assert.ok(probe,'fixture should provide an aspect segment with an off-line hover probe');
  assert.ok(probe.clearance>12,`the chosen aspect must still be the nearest line at the 12px off-line probe; clearance=${probe.clearance}`);

  const targetBefore=await page.evaluate(({x,y})=>{
    const node=document.elementFromPoint(x,y);
    return node?{tag:node.tagName,className:String(node.getAttribute('class')||''),interactive:String(node.dataset?.interactive||''),relationIndex:String(node.dataset?.relationIndex||'')}:null;
  },probe.acquire);
  await page.mouse.move(probe.acquire.x,probe.acquire.y);
  await page.waitForTimeout(250);
  const hoverState=await page.evaluate(()=>({
    isolated:document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')?.classList.contains('has-isolation')||false,
    hovered:[...document.querySelectorAll('#skyFoundationWheelMount [data-interactive].is-hovered')].map(node=>({
      interactive:String(node.dataset.interactive||''),
      relationIndex:String(node.dataset.relationIndex||''),
      placement:String(node.dataset.placement||''),
      house:String(node.dataset.house||''),
      sign:String(node.dataset.sign||'')
    }))
  }));
  console.log('ASPECT_HOVER_PROBE',JSON.stringify({probe,targetBefore,hoverState}));
  assert.equal(hoverState.isolated,true,'12px off-line pointer should engage wheel isolation');
  assert.ok(hoverState.hovered.some(node=>node.interactive==='aspect'&&node.relationIndex===probe.relationIndex),'12px off-line pointer should highlight the nearest aspect relation');

  console.log('Comparison-wheel aspect hover acquires 12px off the visible line.');
}finally{
  await context.close();
  await browser.close();
}
