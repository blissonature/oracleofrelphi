import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const { chromium }=require('playwright');
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const previewFile=path.join(repo,'canonical-glyphs-v1-preview.html');
const manifestFile=path.join(repo,'assets/canonical-glyphs/v1/manifest.json');

async function serverFixture(t){
  const server=createServer(async(request,response)=>{
    try{
      const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
      const file=path.resolve(repo,`.${pathname}`);
      if(file!==repo&&!file.startsWith(`${repo}${path.sep}`)) throw new Error('outside root');
      const info=await stat(file);
      if(!info.isFile()) throw new Error('not a file');
      const extension=path.extname(file);
      response.writeHead(200,{'content-type':extension==='.html'?'text/html; charset=utf-8':extension==='.json'?'application/json; charset=utf-8':extension==='.svg'?'image/svg+xml':'application/octet-stream','cache-control':'no-store'});
      response.end(await readFile(file));
    }catch{response.writeHead(404,{'content-type':'text/plain'});response.end('not found')}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('static preview source excludes every competing renderer and geometry repair',async()=>{
  const source=await readFile(previewFile,'utf8');
  for(const prohibited of ['relphi-glyph-component-v1.js','relphi-glyph-registry-v1.js','createBubble','getBBox','<circle','font-family','Unicode glyph','padding','radius','transform=','fit(']) assert.equal(source.includes(prohibited),false,`preview contains prohibited source token ${prohibited}`);
  assert.equal(/<script\s+src=/i.test(source),false);
  assert.match(source,/assets\/canonical-glyphs\/v1\/manifest\.json/);
});

test('static preview renders 33 exact sources and 60 explicit failures only',async t=>{
  const origin=await serverFixture(t);
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||chromium.executablePath()});
  t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
  await page.goto(`${origin}/canonical-glyphs-v1-preview.html`);
  await page.locator('.card').first().waitFor();
  const manifest=JSON.parse(await readFile(manifestFile,'utf8'));
  assert.equal(await page.locator('.card').count(),93);
  assert.equal(await page.locator('.card[data-availability="available"] img.master').count(),33);
  assert.equal(await page.locator('.card[data-availability="unavailable"]').count(),60);
  assert.equal(await page.locator('.card[data-availability="unavailable"] img').count(),0);
  assert.equal(await page.locator('.unavailable-box',{hasText:'SOURCE UNAVAILABLE'}).count(),60);
  assert.deepEqual(await page.locator('.card').evaluateAll(cards=>cards.map(card=>card.dataset.identity)),manifest.identities.map(record=>record.canonical_identity));
  assert.equal(await page.locator('#available-count').textContent(),'33 available');
  assert.equal(await page.locator('#unavailable-count').textContent(),'60 unavailable');
  assert.equal(await page.locator('#total-count').textContent(),'93 total');
  const sourceUrls=await page.locator('img.master').evaluateAll(images=>images.map(image=>new URL(image.src).pathname));
  const expectedUrls=manifest.identities.filter(record=>record.candidate_path).map(record=>`/assets/canonical-glyphs/v1/${record.candidate_path}`);
  assert.deepEqual(sourceUrls.sort(),expectedUrls.sort());
  assert.equal(requests.some(request=>/^\/assets\/(?:planet|zodiac|element|aspect|hebrew|greek)-glyphs\//.test(request)),false);
  assert.equal(await page.locator('svg, circle').count(),0,'glyph SVGs must stay external static documents');
  for(const record of manifest.identities.filter(item=>item.candidate_path)){
    const source=await readFile(path.join(repo,'assets/canonical-glyphs/v1',record.candidate_path),'utf8');
    assert.equal(/<text\b|\bfont/i.test(source),false,record.canonical_identity);
  }
  for(const state of ['day-ruler','hour-ruler','day-and-hour-ruler']) assert.equal(await page.locator(`[data-unavailable-state="${state}"]`).isDisabled(),true);
  await page.locator('[data-global-state="circled"]').click();
  assert.equal(await page.locator('.card[data-availability="available"] img.overlay:not([hidden])').count(),33);
  assert.equal(requests.includes('/assets/canonical-glyphs/v1/overlays/circled.svg'),true);
  const first=page.locator('.card[data-availability="available"]').first();
  await first.locator('[data-card-state="plain"]').click();
  assert.equal(await first.locator('img.overlay').isHidden(),true);
  assert.equal(await first.locator('img.master').isVisible(),true);

  const manifestFailure=await browser.newPage();
  await manifestFailure.route('**/assets/canonical-glyphs/v1/manifest.json',route=>route.abort());
  await manifestFailure.goto(`${origin}/canonical-glyphs-v1-preview.html`);
  await manifestFailure.locator('#page-state.error').waitFor();
  assert.match(await manifestFailure.locator('#page-state').textContent(),/CANONICAL MANIFEST ERROR/);
  assert.equal(await manifestFailure.locator('.card,img').count(),0);

  const assetFailure=await browser.newPage();
  const firstPath=manifest.identities.find(record=>record.candidate_path).candidate_path;
  await assetFailure.route(`**/assets/canonical-glyphs/v1/${firstPath}`,route=>route.abort());
  await assetFailure.goto(`${origin}/canonical-glyphs-v1-preview.html`);
  await assetFailure.locator('.asset-error').waitFor();
  const failedCard=assetFailure.locator(`.card[data-identity="${manifest.identities.find(record=>record.candidate_path).canonical_identity}"]`);
  assert.match(await failedCard.locator('.asset-error').textContent(),/no fallback rendered/i);
  assert.equal(await failedCard.locator('img,svg').count(),0);
});
