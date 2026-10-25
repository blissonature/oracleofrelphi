const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

const sprite=fs.readFileSync('relphi-icons.svg','utf8');
const sky=fs.readFileSync('sky-chart-export-v2.js','utf8');
const copy=sprite.match(/<symbol\b[^>]*id="relphi-copy"[^>]*>[\s\S]*?<\/symbol>/)?.[0];
const snapshot=sprite.match(/<symbol\b[^>]*id="relphi-snapshot"[^>]*>[\s\S]*?<\/symbol>/)?.[0];
const download=sky.match(/const ICON='(<svg[^']+<\/svg>)';/)?.[1];
assert.ok(copy&&snapshot&&download,'production SVG definitions must be available');
assert.match(snapshot,/transform="translate\(0 -1\)"/,'optical adjustment belongs to shared master');
assert.match(snapshot,/stroke-width="1.9"/,'camera line weight matches Download');
assert.match(snapshot,/M9\.2 4\.1h5\.6l1\.8 2\.3H19\.9/,'camera master has the deliberately enlarged silhouette');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  try{
   const metrics=await page.evaluate(async({copy,snapshot,download})=>{
    const output={};
    for(const key of ['copy','snapshot','download']){
     const size=key==='copy'?20:17;
     const inset=(36-size)/2;
     const content=key==='download'
      ?download.replace('<svg viewBox=','<svg x="'+inset+'" y="'+inset+'" width="'+size+'" height="'+size+'" viewBox=')
      :'<defs>'+(key==='copy'?copy:snapshot)+'</defs><use href="#relphi-'+key+'" x="'+inset+'" y="'+inset+'" width="'+size+'" height="'+size+'"/>';
     const markup='<svg xmlns="http://www.w3.org/2000/svg" color="black" viewBox="0 0 36 36" width="360" height="360">'+content+'</svg>';
     const picture=new Image();
     await new Promise((resolve,reject)=>{
      picture.onload=resolve;picture.onerror=reject;
      picture.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(markup);
     });
     const canvas=document.createElement('canvas');canvas.width=360;canvas.height=360;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     ctx.fillStyle='#fff';ctx.fillRect(0,0,360,360);
     ctx.drawImage(picture,0,0);
     const pixels=ctx.getImageData(0,0,360,360).data;
     let ink=0,xSum=0,ySum=0,xMin=360,xMax=0,yMin=360,yMax=0;
     for(let y=0;y<360;y++)for(let x=0;x<360;x++){
      const i=(y*360+x)*4;
      const weight=(255-Math.min(pixels[i],pixels[i+1],pixels[i+2]))/255;
      if(weight<=0.01)continue;
      ink+=weight;xSum+=weight*x;ySum+=weight*y;
      xMin=Math.min(xMin,x);xMax=Math.max(xMax,x);
      yMin=Math.min(yMin,y);yMax=Math.max(yMax,y);
     }
     if(!ink)throw Error(key+' rendered no pixels');
     output[key]={cx:xSum/ink/10,cy:ySum/ink/10,width:(xMax-xMin)/10,height:(yMax-yMin)/10,ink:ink/100};
    }
    return output;
   },{copy,snapshot,download});
   const c=metrics.snapshot,d=metrics.download,k=metrics.copy;
   assert.ok(Math.abs(c.cx-18)<0.25&&Math.abs(c.cy-18)<0.25,
     'camera ink centroid must sit within 0.25px of the 36px button center: '+JSON.stringify(metrics));
   assert.ok(c.width>=15.5&&c.width<=16.3,
     'enlarged Snapshot must present a roughly 16px-wide visible silhouette');
   assert.ok(c.width>=k.width*.98&&c.width<=k.width*1.07,
     'Snapshot must match Copy in apparent width despite its 17px frame');
   assert.ok(c.width>d.width*1.30,
     'Snapshot must be substantially larger than the narrow Download mark');
   assert.ok(c.height>=d.height*.97&&c.height<=d.height*1.09,
     'camera visible height should match Download instead of being undersized');
   assert.ok(c.ink>=k.ink*.93&&c.ink<=k.ink*1.09,
     'camera total drawn ink should be comparable to Copy');
   console.log('Chromium raster optical alignment:',JSON.stringify(metrics));
  }finally{await page.close();}
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
