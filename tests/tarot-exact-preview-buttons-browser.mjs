import {chromium} from 'playwright';
const sha=process.env.PREVIEW_REF||'a7ec1ad5329fa1bf3affd823a9040c471e1ef235';
const target='https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref='+sha+'&view=tarot';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 for(const width of [1280,390]){
 const ctx=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
 const page=await ctx.newPage();const failures=[],errors=[],logs=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')logs.push(message.type()+': '+message.text())});
 page.on('requestfailed',r=>failures.push(r.url()+' '+r.failure()?.errorText));
 page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url())});
 await page.goto(target,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForTimeout(8000);
 const status=()=>page.evaluate(()=>{
 const root=document.querySelector('#browsePanel'),app=window.RelphiTarotLedger;
 const all=document.querySelector('#showAllCards'),board=document.querySelector('#relphiOpenDrawingBoardCurrent');
 return{href:location.href,title:document.title,base:document.baseURI,origin:location.origin,
      buttonCount:document.querySelectorAll('button').length,
      allPresent:!!all,boardPresent:!!board,allVisible:all?getComputedStyle(all).display:null,
      appType:typeof app,cardLength:window.TAROT_CARDS?.length??window.tarotCards?.length??null,
      browseHidden:root?.hidden,boardHidden:document.querySelector('#shortListPanel')?.hidden,
      scriptUrls:[...document.scripts].filter(s=>s.src).map(s=>s.src).slice(-22),
      previewMarker:window.__relphiTarotPreviewDocument,previewPending:window.__relphiTarotPreviewPending,
      bodySnippet:document.body?.innerText?.slice(0,180)};
 });
 console.log('BEFORE',width,JSON.stringify(await status()));
 for(const [name,selector] of [['show','#showAllCards'],['board','#relphiOpenDrawingBoardCurrent']]){
  if(await page.locator(selector).count()){
   await page.locator(selector).click({force:true,timeout:12000}).catch(e=>errors.push('click '+name+': '+e.message.slice(0,220)));
   await page.waitForTimeout(600);
   console.log('AFTER',width,name,JSON.stringify(await status()));
  }
 }
 console.log('ERRORS',width,JSON.stringify(errors.slice(0,28)));
 console.log('FAILURES',width,JSON.stringify(failures.slice(0,38)));
 console.log('LOGS',width,JSON.stringify(logs.slice(0,24)));
 await page.screenshot({path:'tarot-preview-diagnostic-'+width+'.png',fullPage:false});
 await ctx.close();
 }
}finally{await browser.close()}
