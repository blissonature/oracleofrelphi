// Compact Planetary Hours portal for Sky Chart. The heptagram itself is rendered by the
// reusable copy extracted from planetaryhours.html; this file only supplies the selected moment.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS={skyA:'relphiSkyChartA',skyB:'relphiSkyChartB'};
  const CHALDEAN=['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const WEEKDAY_RULER={0:'sun',1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn'};
  let activeSlot='skyA',queued=false,dependenciesPromise=null,lastSignature='';

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function profile(payload){return payload&&payload.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{}}
  function loadScript(src,test){
    if(test())return Promise.resolve();
    return new Promise(function(resolve,reject){
      const base=src.split('?')[0];let script=document.querySelector('script[src^="'+base+'"]');
      if(script){script.addEventListener('load',resolve,{once:true});script.addEventListener('error',reject,{once:true});return}
      script=document.createElement('script');script.src=src;script.async=true;script.addEventListener('load',resolve,{once:true});script.addEventListener('error',reject,{once:true});document.head.appendChild(script);
    });
  }
  function dependencies(){
    if(!dependenciesPromise)dependenciesPromise=Promise.all([
      loadScript('https://unpkg.com/suncalc@1.9.0/suncalc.js',function(){return !!window.SunCalc}),
      loadScript('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',function(){return !!window.luxon?.DateTime}),
      loadScript('planetary-hours-heptagram-component-v1.js?v=1',function(){return !!window.RelphiPlanetaryHoursHeptagram})
    ]);
    return dependenciesPromise;
  }
  function dataForSlot(slot){
    const payload=read(SLOT_KEYS[slot]),p=profile(payload),lat=Number(p.latitude),lon=Number(p.longitude);
    if(!payload||!p.dateTime||!Number.isFinite(lat)||!Number.isFinite(lon)||!p.timeZone)return null;
    return{payload:payload,datetime:String(p.dateTime),lat:lat,lon:lon,tz:String(p.timeZone),loc:String(p.location||'')};
  }
  function selectedData(){return dataForSlot(activeSlot)||dataForSlot('skyA')||dataForSlot('skyB')}
  function localNoon(dt){return dt.startOf('day').plus({hours:12}).toJSDate()}
  function planetaryMoment(data){
    const DateTime=window.luxon.DateTime,selected=DateTime.fromISO(data.datetime,{zone:data.tz});
    if(!selected.isValid)throw new Error('Invalid selected date or time');
    const instant=selected.toJSDate(),today=SunCalc.getTimes(localNoon(selected),data.lat,data.lon);
    let sunrise=today.sunrise,sunset=today.sunset,dayDate=selected;
    if(!(sunrise instanceof Date)||!(sunset instanceof Date))throw new Error('Sunrise or sunset unavailable');
    if(instant<sunrise){dayDate=selected.minus({days:1});const prior=SunCalc.getTimes(localNoon(dayDate),data.lat,data.lon);sunrise=prior.sunrise;sunset=prior.sunset}
    const nextSunrise=SunCalc.getTimes(localNoon(dayDate.plus({days:1})),data.lat,data.lon).sunrise;
    if(!(nextSunrise instanceof Date))throw new Error('Next sunrise unavailable');
    const bright=instant>=sunrise&&instant<sunset,halfStart=bright?sunrise:sunset,halfEnd=bright?sunset:nextSunrise,hourLength=(halfEnd-halfStart)/12;
    const elapsed=Math.max(0,Math.min(12,(instant-halfStart)/hourLength)),halfIndex=Math.max(0,Math.min(11,Math.floor(elapsed))),ordinalIndex=bright?halfIndex:12+halfIndex,hourProgress=Math.max(0,Math.min(1,elapsed-halfIndex));
    const localSunrise=DateTime.fromJSDate(sunrise).setZone(data.tz),dayRuler=WEEKDAY_RULER[localSunrise.weekday%7],sequence24=Array.from({length:24},function(_,i){return CHALDEAN[(CHALDEAN.indexOf(dayRuler)+i)%7]});
    return{dayRuler:dayRuler,sequence24:sequence24,selectedPosition:ordinalIndex+1+hourProgress,hourRuler:sequence24[ordinalIndex]};
  }
  function portalMarkup(){return '<a id="relphiPlanetaryHoursPortal" class="relphi-ph-portal" href="planetaryhours.html" aria-label="Open this selected moment in Planetary Hours"><svg role="img" aria-label="Living planetary-hours heptagram"></svg></a>'}
  function ensurePortal(){
    let portal=document.getElementById('relphiPlanetaryHoursPortal');if(portal)return portal;
    const center=document.querySelector('#relphiSkyWorkspace .relphi-workspace-center')||document.querySelector('.sky-output-box');if(!center)return null;
    const holder=document.createElement('div');holder.innerHTML=portalMarkup();portal=holder.firstElementChild;center.insertAdjacentElement('afterbegin',portal);return portal;
  }
  function linkFor(data){const url=new URL('planetaryhours.html',location.href);url.searchParams.set('datetime',data.datetime);url.searchParams.set('lat',data.lat);url.searchParams.set('lon',data.lon);url.searchParams.set('tz',data.tz);if(data.loc)url.searchParams.set('loc',data.loc);url.searchParams.set('useSystem','0');return url.pathname+url.search}
  async function draw(){
    queued=false;const portal=ensurePortal();if(!portal)return;const data=selectedData();if(!data){portal.hidden=true;lastSignature='';return}
    try{
      await dependencies();const moment=planetaryMoment(data),signature=[activeSlot,data.datetime,data.lat,data.lon,data.tz,moment.dayRuler,moment.hourRuler,moment.selectedPosition.toFixed(3)].join('|');
      if(signature===lastSignature&&portal.querySelector('svg')?.dataset.ready==='true')return;
      lastSignature=signature;portal.hidden=false;portal.href=linkFor(data);portal.dataset.slot=activeSlot;portal.setAttribute('aria-label','Open '+(data.payload.name||'this sky')+' at its selected moment in Planetary Hours');
      portal.onclick=function(){try{localStorage.setItem('relphiPlanetaryHoursWhereWhen',JSON.stringify({datetime:data.datetime,lat:data.lat,lon:data.lon,tz:data.tz,loc:data.loc,useSystem:false,savedAt:new Date().toISOString()}))}catch(_){}};
      const svg=portal.querySelector('svg');svg.dataset.ready='pending';
      const result=window.RelphiPlanetaryHoursHeptagram.render(svg,{dayRuler:moment.dayRuler,sequence24:moment.sequence24,selectedPosition:moment.selectedPosition,glyphComponent:window.RelphiGlyphComponent,showLabels:false,showRulerRings:true});
      await result.ready;svg.dataset.ready='true';
    }catch(error){portal.hidden=true;lastSignature=''}
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(draw)}
  function styles(){
    if(document.getElementById('relphi-ph-portal-style'))return;
    const style=document.createElement('style');style.id='relphi-ph-portal-style';style.textContent=`
      .relphi-ph-portal{display:block;width:min(100%,260px);margin:0 auto .75rem;border:1px solid rgba(220,31,24,.16);border-radius:1rem;background:#fff;text-decoration:none;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
      .relphi-ph-portal svg{display:block;width:100%;height:auto;max-height:230px}.relphi-ph-portal:hover{transform:translateY(-1px);box-shadow:0 .6rem 1.4rem rgba(0,0,0,.08);border-color:rgba(220,31,24,.45)}.relphi-ph-portal:focus-visible{outline:3px solid rgba(220,31,24,.3);outline-offset:3px}
      .relphi-ph-portal .relphi-glyph-bubble>circle{fill:#fff!important}
      @media(max-width:760px){.relphi-ph-portal{width:min(100%,220px)}.relphi-ph-portal svg{max-height:195px}}@media(prefers-reduced-motion:reduce){.relphi-ph-portal{transition:none}.relphi-ph-portal:hover{transform:none}}
    `;document.head.appendChild(style);
  }
  function start(){styles();schedule();window.addEventListener('relphi:placement-focus',function(event){if(event.detail?.slot){activeSlot=event.detail.slot;schedule()}});window.addEventListener('storage',schedule);window.addEventListener('relphi:sky-builder-v4-loaded',schedule);const chart=document.getElementById('chartPanel');if(chart)new MutationObserver(schedule).observe(chart,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();