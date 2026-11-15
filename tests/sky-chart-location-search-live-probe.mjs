import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:25000});
 for(const query of ['1600 pennsylvania ave','1600 Pennsylvania Ave, Washington, DC']){
  const result=await page.evaluate(async query=>{
   const u=new URL('https://photon.komoot.io/api/');
   u.searchParams.set('q',query);u.searchParams.set('limit','10');u.searchParams.set('lang','en');
   try{
    const response=await fetch(u,{signal:AbortSignal.timeout(5000),headers:{Accept:'application/json'}});
    const data=await response.json();
    return{query,httpStatus:response.status,count:data?.features?.length||0,
      matches:(data?.features||[]).slice(0,6).map(f=>({name:f.properties?.name,street:f.properties?.street,
        number:f.properties?.housenumber,city:f.properties?.city,state:f.properties?.state,
        lat:f.geometry?.coordinates?.[1],lon:f.geometry?.coordinates?.[0]}))};
   }catch(error){return{query,error:error?.name+': '+error?.message}}
  },query);
  console.log('LIVE PHOTON',JSON.stringify(result));
  await page.waitForTimeout(1200);
 }
}finally{await browser.close()}
