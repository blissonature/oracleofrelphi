import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base='http://127.0.0.1:4173/sky-chart.html';

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.RelphiRelationshipPatterns,{timeout:30000});

  const result=await page.evaluate(()=>{
    const row=(a,b,aspect,sky='A')=>{
      const el=document.createElement('button');
      el.dataset.relationshipMode=sky+'-'+sky;
      el.dataset.leftSky=sky;el.dataset.rightSky=sky;
      el.dataset.leftPlacement=a;el.dataset.rightPlacement=b;
      el.dataset.aspect=aspect;el.dataset.phaseError='0';el.dataset.sourceOrb='0';
      return el;
    };
    const detect=rows=>window.RelphiRelationshipPatterns.detectRows(rows).map(item=>({
      id:item.id,name:item.name,scope:item.scope,
      members:item.members.slice(),
      apex:item.apex||'',focus:item.focus||'',
      rows:item.rows.length
    }));

    const mystic=[
      row('sun','moon','sextile'),
      row('sun','mars','opposition'),
      row('sun','saturn','trine'),
      row('moon','mars','trine'),
      row('moon','saturn','opposition'),
      row('mars','saturn','sextile')
    ];

    const yod=[
      row('mercury','venus','sextile'),
      row('jupiter','mercury','quincunx'),
      row('jupiter','venus','quincunx')
    ];

    const grandCross=[
      row('sun','moon','square'),row('moon','mars','square'),
      row('mars','saturn','square'),row('saturn','sun','square'),
      row('sun','mars','opposition'),row('moon','saturn','opposition')
    ];

    const kite=[
      row('sun','jupiter','trine'),row('sun','saturn','trine'),row('jupiter','saturn','trine'),
      row('mars','sun','opposition'),row('mars','jupiter','sextile'),row('mars','saturn','sextile')
    ];

    const cradle=[
      row('sun','mars','opposition'),
      row('sun','moon','sextile'),row('sun','venus','trine'),
      row('mars','moon','trine'),row('mars','venus','sextile'),
      row('moon','venus','sextile')
    ];

    const boomerang=[
      row('saturn','mercury','quincunx'),row('saturn','venus','quincunx'),
      row('mercury','venus','sextile'),row('saturn','jupiter','opposition'),
      row('jupiter','mercury','semi-sextile'),row('jupiter','venus','semi-sextile')
    ];

    const hammer=[
      row('uranus','moon','tri-octile'),row('uranus','mars','tri-octile'),row('moon','mars','square')
    ];

    return{
      mystic:detect(mystic),yod:detect(yod),grandCross:detect(grandCross),
      kite:detect(kite),cradle:detect(cradle),boomerang:detect(boomerang),hammer:detect(hammer)
    };
  });

  assert.equal(result.mystic.filter(item=>item.id==='mystic-rectangle').length,1,'Mystic Rectangle should be identified once');
  assert.equal(result.yod.filter(item=>item.id==='yod').length,1,'Yod should be identified once');
  assert.equal(result.yod.find(item=>item.id==='yod')?.apex,'A:jupiter','Yod apex should be the shared quincunx endpoint');

  assert.equal(result.grandCross.filter(item=>item.id==='grand-cross').length,1,'Grand Cross should be identified once');
  assert.equal(result.grandCross.some(item=>item.id==='t-square'),false,'T-Squares nested inside a Grand Cross should be suppressed');

  assert.equal(result.kite.filter(item=>item.id==='kite').length,1,'Kite should be identified once');
  assert.equal(result.kite.some(item=>item.id==='grand-trine'),false,'Grand Trine nested inside a Kite should be suppressed');

  assert.equal(result.cradle.filter(item=>item.id==='cradle').length,1,'Cradle should be identified once');
  assert.equal(result.cradle.some(item=>item.id==='minor-grand-trine'),false,'Minor Grand Trines nested inside a Cradle should be suppressed');

  assert.equal(result.boomerang.filter(item=>item.id==='boomerang-yod').length,1,'Boomerang Yod should be identified once');
  assert.equal(result.boomerang.some(item=>item.id==='yod'),false,'Yod nested inside a Boomerang should be suppressed');

  assert.equal(result.hammer.filter(item=>item.id==='thors-hammer').length,1,"Thor's Hammer should be identified once");

  console.log('Sky Chart relationship pattern recognition checks passed.');
}finally{
  await browser.close();
}
