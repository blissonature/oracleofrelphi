import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';

// Design-system contract: one master path, no CSS SVG masks or app-local paths.
const sprite=readFileSync('relphi-icons.svg','utf8');
const css=readFileSync('relphi-copy-icon-convention-v1.css','utf8');
const js=readFileSync('relphi-copy-icon-convention-v1.js','utf8');
assert.equal((sprite.match(/<path\b/g)||[]).length,1,'Master sprite must contain exactly ONE SVG path');
assert.equal((sprite.match(/<symbol\b/g)||[]).length,1,'Copy glyph must have one symbol');
assert.match(sprite,/id="relphi-copy"/);
assert.match(sprite,/translate\(-\.28 \.23\)/,'Optical centering remains part of master SVG geometry');
assert.match(sprite,/stroke-width="1\.9"/);
assert.doesNotMatch(sprite,/<rect\b|<circle\b|<polygon\b|<polyline\b/i,'No second primitive in master icon');
assert.doesNotMatch(css,/data:image\/svg|mask:url\(/i,'No duplicate CSS-drawn Copy icon');
assert.doesNotMatch(js,/createElementNS\([^\n]*['"]path['"]/i,'Consumers must never author new Copy path geometry');

const browser=await chromium.launch({headless:true});
const urls=['sky-chart.html','tarot.html?board=workflow-v2#tarot','planetaryhours.html','index.html','tools.html'];
const SOURCE='relphi-icons.svg#relphi-copy';
for(const url of urls){
  const page=await browser.newPage({viewport:{width:630,height:840}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.goto('http://127.0.0.1:4173/'+url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.RelphiCopyIcon&&!!document.querySelector('link[href*="relphi-copy-icon-convention-v1.css"]'),null,{timeout:20000});
  // Detect every present Copy button, not just a hand-curated selector list.
  await page.evaluate(()=>{
    const root=document.createElement('section');
    root.id='copy-canon-fixture';
    const actions=[
      {text:'Copy'}, {text:'Copy link'}, {text:'Copy Text'}, {text:'Copy PNG'},
      {text:'Copy all questions',label:'Copy chosen questions'},
      {text:'Create a copy'}, {text:'Duplicate'}
    ];
    for(const action of actions){
      const node=document.createElement('button');
      node.type='button';
      node.textContent=action.text;
      if(action.label)node.setAttribute('aria-label',action.label);
      root.appendChild(node);
    }
    const delayed=document.createElement('button');delayed.type='button';
    delayed.dataset.relphiClipboardAction='true';delayed.textContent='Share';
    delayed.setAttribute('aria-label','Copy share text');
    root.appendChild(delayed);
    document.body.appendChild(root);
  });
  await page.waitForFunction(()=>document.querySelectorAll('#copy-canon-fixture .relphi-copy-icon-button').length===6,null,{timeout:10000});
  const results=await page.evaluate(()=>{
    const fixture=document.querySelector('#copy-canon-fixture');
    return [...fixture.querySelectorAll('button')].map(button=>{
      const svg=button.querySelector(':scope > svg.relphi-copy-icon');
      const use=svg?.querySelector('use');
      return{label:button.getAttribute('aria-label'),raw:button.textContent.trim(),
        decorated:button.classList.contains('relphi-copy-icon-button'),
        href:use?.getAttribute('href')||'',
        embeddedPaths:button.querySelectorAll('path,rect,circle,polygon').length,
        dimensions:svg?[getComputedStyle(svg).width,getComputedStyle(svg).height]:[],
        bbox:svg?(()=>{try{const b=use.getBBox();return[b.width,b.height]}catch(_){return[0,0]}})():[]
      };
    });
  });
  assert.equal(results.length,8,url+': expected fixture commands');
  for(const entry of results.slice(0,5).concat(results.slice(7))){
    assert.equal(entry.decorated,true,url+': clipboard button must be decorated '+entry.raw);
    assert.equal(entry.href,SOURCE,url+': canonical referenced SVG '+entry.raw);
    assert.equal(entry.embeddedPaths,0,url+': not a single inline Copy path is allowed '+entry.raw);
    assert.deepEqual(entry.dimensions,['20px','20px'],url+': fixed optical scale for '+entry.raw);
    assert.ok(entry.label?.length,url+': accessible action name required '+entry.raw);
  }
  for(const entry of results.slice(5,7))assert.equal(entry.decorated,false,url+': duplicate/clone must not receive clipboard icon');
  // Feedback may change color or accessible text but NEVER swaps paths.
  await page.evaluate(()=>{
    document.querySelector('#copy-canon-fixture button').textContent='Copied';
  });
  await page.waitForFunction(()=>document.querySelector('#copy-canon-fixture button svg use')?.getAttribute('href')==='relphi-icons.svg#relphi-copy',null,{timeout:5000});
  assert.equal(await page.locator('#copy-canon-fixture button').getAttribute('data-relphi-copy-feedback'),'done');
  assert.equal(await page.locator('#copy-canon-fixture button').getAttribute('aria-label'),'Copied');
  assert.equal(await page.locator('#copy-canon-fixture button svg use').getAttribute('href'),SOURCE);
  // Shared source must also appear on existing owner controls when they render.
  const existing=await page.locator('button.relphi-copy-icon-button:not(#copy-canon-fixture button)').count();
  if(url.startsWith('sky-chart'))assert.ok(existing>=1,url+': actual Sky Chart toolbar uses master glyph');
  if(url.startsWith('planetaryhours'))assert.ok(existing>=1,url+': Copy link uses master glyph');
  if(url.startsWith('index.html')){
    await page.waitForFunction(()=>[...document.querySelectorAll('.question-card .copy-icon')].every(n=>n.querySelector('svg.relphi-copy-icon use')?.getAttribute('href')==='relphi-icons.svg#relphi-copy'),null,{timeout:6000});
    assert.equal(await page.locator('.question-card .copy-icon svg use').count(),4,'Every Invocation Card uses the same mark');
  }
  if(url.startsWith('sky-chart')){
    // Verifies the icon is really painted, not just that the <use> exists.
    await page.waitForFunction(()=>{
      const node=document.querySelector('.sky-relationship-copy-button svg.relphi-copy-icon use');
      if(!node)return false;
      try{return node.getBBox().width>10&&node.getBBox().height>10}catch(_){return false}
    },null,{timeout:12000});
    await page.locator('.sky-relationship-copy-button').screenshot({path:'canonical-copy-icon-relationships.png'});
  }
  assert.deepEqual(errors.filter(s=>/SyntaxError|ReferenceError/.test(s)),[],url+': no syntax or reference errors');
  await page.close();
}
await browser.close();
console.log('Copy SVG single-source contract and five-page/browser render audit passed.');
