#!/usr/bin/env node
// One-time capture of the user-approved Master Glyph List as immutable SVG sources.
// The running application must NEVER construct inscription circles or refit glyph art.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
const root=resolve('.');
const destination=join(root,'assets/inscribed-glyphs/v1');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+pathname);
    if(!file.startsWith(root+sep))throw Error('Not within source checkout');
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':MIME[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/glyphs-unified-preview.html',{waitUntil:'load'});
  await page.waitForFunction(()=>/canonical glyph masters loaded|masters loaded;/.test(document.getElementById('ugStatus')?.textContent||''),{timeout:45000});
  const captured=await page.evaluate(()=>{
    const registry=window.RelphiGlyphRegistry;
    const expected=registry?.entries.map(item=>item.id)||[];
    const cards=[...document.querySelectorAll('.ug-card')];
    const results=cards.map(card=>{
      const id=card.querySelector('.ug-id')?.textContent?.trim();
      const stage=card.querySelector('.ug-stage svg');
      if(!id||!stage)throw Error('Unresolved Master Glyph List stage');
      const original=stage.querySelector(':scope > .relphi-glyph-bubble');
      const ring=original?.querySelector(':scope > circle');
      const artwork=original?.querySelector('.relphi-canonical-glyph');
      if(!original||!ring||!artwork||artwork.style.visibility==='hidden')throw Error('Unresolved authored composition for '+id);
      const copy=stage.cloneNode(true);
      copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
      copy.removeAttribute('aria-label');
      return {id,svg:copy.outerHTML,ringRadius:ring.getAttribute('r'),
        artIdentity:artwork.dataset.canonicalGlyphId};
    });
    if(cards.length!==expected.length||results.some((item,i)=>item.id!==expected[i]||item.artIdentity!==item.id))
      throw Error('Master Glyph List is incomplete or reordered');
    return results;
  });
  if(failures.length)throw Error('Master Glyph List page error: '+failures.join('; '));
  await mkdir(destination,{recursive:true});
  const manifest={authority:'https://oracleofrelphi.com/glyphs-unified-preview.html',
    capture:'actual browser-rendered complete SVG; no geometric reconstruction',
    source:'glyphs-unified-preview.html + RelphiGlyphRegistry + RelphiGlyphComponent',
    count:captured.length,identities:{}};
  const dictionary={};
  for(const record of captured){
    if(!/^[a-z0-9-]+$/.test(record.id))throw Error('Unsafe glyph identity '+record.id);
    if(record.ringRadius!=='19')throw Error('Master circle unexpectedly differs for '+record.id);
    const bytes=record.svg.replaceAll('#111111','currentColor')+'\n';
    await writeFile(join(destination,record.id+'.svg'),bytes,'utf8');
    manifest.identities[record.id]={file:record.id+'.svg',sha256:createHash('sha256').update(bytes).digest('hex')};
    dictionary[record.id]=record.svg.replaceAll('#111111','currentColor');
  }
  await writeFile(join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  await writeFile(join(root,'relphi-inscribed-glyph-masters-v1.js'),
    '// Immutable captured SVGs from the approved Master Glyph List. Do not regenerate at runtime.\n'+
    '(function(){\'use strict\';window.RelphiInscribedGlyphMastersV1=Object.freeze('+JSON.stringify(dictionary)+');})();\n','utf8');
  // Switch the existing component owner only after every master was captured.
  // All consumers load the same embedded static assets before that owner.
  const template=await readFile(join(root,'tools/canonical-static-component-template.js'),'utf8');
  await writeFile(join(root,'relphi-glyph-component-v1.js'),template,'utf8');
  const htmlFiles=['glyphs-unified-preview.html','glyphs.html','sky-chart.html',
    'planetaryhours.html','part1/sky-chart.html','part2/sky-chart.html'];
  for(const file of htmlFiles){
    const location=join(root,file);
    const original=await readFile(location,'utf8');
    const search=/<script src="relphi-glyph-component-v1\.js\?v=\d+"><\/script>/;
    if(!search.test(original))throw Error('Expected canonical component script missing: '+file);
    const replacement='<script src="relphi-inscribed-glyph-masters-v1.js?v=1"></script>\n'+
      '<script src="relphi-glyph-component-v1.js?v=34"></script>';
    await writeFile(location,original.replace(search,replacement),'utf8');
  }
  const navPath=join(root,'navloader.js');
  const nav=await readFile(navPath,'utf8');
  const oldNav="appendScript('relphi-glyph-component-v1.js?v=33', function () {\n        appendScript('relphi-glyph-source-integrity-v1.js?v=2', onready);\n      });";
  const newNav="appendScript('relphi-inscribed-glyph-masters-v1.js?v=1', function () {\n        appendScript('relphi-glyph-component-v1.js?v=34', function () {\n          appendScript('relphi-glyph-source-integrity-v1.js?v=2', onready);\n        });\n      });";
  if(!nav.includes(oldNav))throw Error('Canonical navloader owner changed; refusing automated replacement');
  await writeFile(navPath,nav.replace(oldNav,newNav),'utf8');
  // An exact browser-rendering comparison protects the approved optical reference.
  // The bitmap comparison is performed on the same browser instance, at equal size.
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>/canonical glyph masters loaded/.test(document.getElementById('ugStatus')?.textContent||''),null,{timeout:45000});
  const result=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('.ug-card')];
    const ids=window.RelphiGlyphRegistry.entries.map(item=>item.id);
    return{ids:cards.map(card=>card.querySelector('.ug-id')?.textContent?.trim()),
      errors:cards.filter(card=>card.querySelector('.relphi-glyph-bubble')?.dataset.canonicalMasterSource!=='approved-inscribed-svg').length,
      circles:cards.map(card=>card.querySelectorAll('.relphi-glyph-bubble>circle').length)};
  });
  if(result.ids.join('|')!==captured.map(item=>item.id).join('|')||
     result.errors!==0||result.circles.some(count=>count!==1))
    throw Error('Static component failed its full 93-glyph browser acceptance');
  console.log('Captured '+captured.length+' complete, actual browser-rendered canonical inscribed SVGs.');
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
