// Compact Planetary Hours portals for Sky Chart. The heptagram itself is rendered by the
// reusable copy extracted from planetaryhours.html; this file only supplies each sky's moment.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS={skyA:'relphiSkyChartA',skyB:'relphiSkyChartB'};
  const CHALDEAN=['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const WEEKDAY_RULER={0:'sun',1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn'};
  let queued=false,dependenciesPromise=null;
  const signatures=new Map();

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
    return{slot:slot,payload:payload,datetime:String(p.dateTime),lat:lat,lon:lon,tz:String(p.timeZone),loc:String(p.location||'')};
  }
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
  function linkFor(data){const url=new URL('planetaryhours.html',location.href);url.searchParams.set('datetime',data.datetime);url.searchParams.set('lat',data.lat);url.searchParams.set('lon',data.lon);url.searchParams.set('tz',data.tz);if(data.loc)url.searchParams.set('loc',data.loc);url.searchParams.set('useSystem','0');return url.pathname+url.search}
  function ensureCardLayout(slot){
    const card=document.querySelector('.relphi-workspace-sky[data-workspace-slot="'+slot+'"]');
    if(!card)return null;
    let summary=card.querySelector('.relphi-workspace-summary');
    if(!summary){
      const title=card.querySelector('.relphi-workspace-title-row');
      const meta=card.querySelector('.relphi-workspace-meta');
      if(!title||!meta)return null;
      summary=document.createElement('div');summary.className='relphi-workspace-summary';
      const copy=document.createElement('div');copy.className='relphi-workspace-summary-copy';
      title.before(summary);copy.append(title,meta);summary.append(copy);
    }
    let portal=summary.querySelector('.relphi-ph-portal[data-slot="'+slot+'"]');
    if(!portal){
      portal=document.createElement('a');portal.className='relphi-ph-portal';portal.dataset.slot=slot;portal.href='planetaryhours.html';portal.setAttribute('aria-label','Open this sky in Planetary Hours');
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','img');svg.setAttribute('aria-label','Living planetary-hours heptagram');portal.appendChild(svg);summary.appendChild(portal);
    }
    return portal;
  }
  async function drawSlot(slot){
    const portal=ensureCardLayout(slot),data=dataForSlot(slot);
    if(!portal)return;
    if(!data){portal.hidden=true;signatures.delete(slot);return}
    try{
      await dependencies();const moment=planetaryMoment(data),signature=[data.datetime,data.lat,data.lon,data.tz,moment.dayRuler,moment.hourRuler,moment.selectedPosition.toFixed(3)].join('|');
      if(signature===signatures.get(slot)&&portal.querySelector('svg')?.dataset.ready==='true')return;
      signatures.set(slot,signature);portal.hidden=false;portal.href=linkFor(data);portal.setAttribute('aria-label','Open '+(data.payload.name||'this sky')+' at its selected moment in Planetary Hours');
      portal.onclick=function(){try{localStorage.setItem('relphiPlanetaryHoursWhereWhen',JSON.stringify({datetime:data.datetime,lat:data.lat,lon:data.lon,tz:data.tz,loc:data.loc,useSystem:false,savedAt:new Date().toISOString()}))}catch(_){}};
      const svg=portal.querySelector('svg');svg.dataset.ready='pending';
      const result=window.RelphiPlanetaryHoursHeptagram.render(svg,{dayRuler:moment.dayRuler,sequence24:moment.sequence24,selectedPosition:moment.selectedPosition,glyphComponent:window.RelphiGlyphComponent,showLabels:false,showRulerRings:true});
      await result.ready;svg.dataset.ready='true';
    }catch(error){portal.hidden=true;signatures.delete(slot)}
  }
  function draw(){queued=false;drawSlot('skyA');drawSlot('skyB');document.querySelectorAll('.relphi-ph-portal').forEach(function(portal){if(!document.querySelector('.relphi-workspace-sky[data-workspace-slot="'+portal.dataset.slot+'"]'))portal.remove()})}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(draw)}
  function styles(){
    if(document.getElementById('relphi-ph-portal-style'))return;
    const style=document.createElement('style');style.id='relphi-ph-portal-style';style.textContent=`
      .relphi-workspace-summary{display:grid;grid-template-columns:minmax(0,1fr) minmax(132px,176px);gap:.35rem;align-items:start;padding:0 12px 8px}.relphi-workspace-summary-copy{min-width:0}.relphi-workspace-summary .relphi-workspace-title-row{padding:14px 4px 8px}.relphi-workspace-summary .relphi-workspace-meta{padding:0 4px 4px}
      .relphi-ph-portal{display:block;width:100%;max-width:176px;justify-self:end;align-self:start;margin:12px 0 0;border:1px solid rgba(220,31,24,.16);border-radius:.8rem;background:#fff;text-decoration:none;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}.relphi-workspace-sky.is-blue .relphi-ph-portal{border-color:rgba(118,81,201,.2)}
      .relphi-ph-portal svg{display:block;width:100%;height:auto;aspect-ratio:1/1}.relphi-ph-portal:hover{transform:translateY(-1px);box-shadow:0 .45rem 1rem rgba(0,0,0,.08);border-color:color-mix(in srgb,var(--panel-accent) 52%,transparent)}.relphi-ph-portal:focus-visible{outline:3px solid color-mix(in srgb,var(--panel-accent) 28%,transparent);outline-offset:3px}.relphi-ph-portal .relphi-glyph-bubble>circle{fill:#fff!important}
      @media(max-width:520px){.relphi-workspace-summary{grid-template-columns:minmax(0,1fr) 132px;gap:.2rem;padding-left:12px;padding-right:12px}.relphi-ph-portal{max-width:132px;margin-top:14px}.relphi-workspace-summary .relphi-workspace-title-row{align-items:flex-start;flex-direction:column}.relphi-workspace-summary .relphi-workspace-status{white-space:normal}}
      @media(max-width:370px){.relphi-workspace-summary{grid-template-columns:1fr}.relphi-ph-portal{width:132px;justify-self:center;margin-top:0}}
      @media(prefers-reduced-motion:reduce){.relphi-ph-portal{transition:none}.relphi-ph-portal:hover{transform:none}}
    `;document.head.appendChild(style);
  }
  function start(){styles();schedule();window.addEventListener('storage',schedule);window.addEventListener('relphi:sky-builder-v4-loaded',schedule);window.addEventListener('relphi:extra-points-updated',schedule);new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();