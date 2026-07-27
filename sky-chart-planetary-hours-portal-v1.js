// Compact Planetary Hours portal for Sky Chart. Reuses the site's canonical glyph component
// and the Planetary Hours sunrise-to-sunrise / Chaldean-order model.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const SLOT_KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const CHALDEAN = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const WEEKDAY_RULER = { 0:'sun', 1:'moon', 2:'mars', 3:'mercury', 4:'jupiter', 5:'venus', 6:'saturn' };
  let activeSlot = 'skyA';
  let queued = false;
  let dependenciesPromise = null;
  let lastSignature = '';

  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function profile(payload) { return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {}; }
  function loadScript(src, test) {
    if (test()) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const base = src.split('?')[0];
      let script = document.querySelector('script[src^="' + base + '"]');
      if (script) { script.addEventListener('load', resolve, {once:true}); script.addEventListener('error', reject, {once:true}); return; }
      script = document.createElement('script'); script.src = src; script.async = true;
      script.addEventListener('load', resolve, {once:true}); script.addEventListener('error', reject, {once:true});
      document.head.appendChild(script);
    });
  }
  function dependencies() {
    if (!dependenciesPromise) dependenciesPromise = Promise.all([
      loadScript('https://unpkg.com/suncalc@1.9.0/suncalc.js', function(){ return !!window.SunCalc; }),
      loadScript('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js', function(){ return !!window.luxon?.DateTime; })
    ]);
    return dependenciesPromise;
  }
  function dataForSlot(slot) {
    const payload = read(SLOT_KEYS[slot]);
    const p = profile(payload);
    const lat = Number(p.latitude), lon = Number(p.longitude);
    if (!payload || !p.dateTime || !Number.isFinite(lat) || !Number.isFinite(lon) || !p.timeZone) return null;
    return { payload:payload, datetime:String(p.dateTime), lat:lat, lon:lon, tz:String(p.timeZone), loc:String(p.location || ''), houseSystem:String(p.houseSystem || '') };
  }
  function selectedData() { return dataForSlot(activeSlot) || dataForSlot('skyA') || dataForSlot('skyB'); }
  function localNoon(dt) { return dt.startOf('day').plus({hours:12}).toJSDate(); }
  function planetaryMoment(data) {
    const DateTime = window.luxon.DateTime;
    const selected = DateTime.fromISO(data.datetime, {zone:data.tz});
    if (!selected.isValid) throw new Error('Invalid selected date or time');
    const instant = selected.toJSDate();
    const today = window.SunCalc.getTimes(localNoon(selected), data.lat, data.lon);
    let sunrise = today.sunrise, sunset = today.sunset, dayDate = selected;
    if (!(sunrise instanceof Date) || !(sunset instanceof Date)) throw new Error('Sunrise or sunset unavailable');
    if (instant < sunrise) {
      dayDate = selected.minus({days:1});
      const prior = window.SunCalc.getTimes(localNoon(dayDate), data.lat, data.lon);
      sunrise = prior.sunrise; sunset = prior.sunset;
    }
    const nextSunrise = window.SunCalc.getTimes(localNoon(dayDate.plus({days:1})), data.lat, data.lon).sunrise;
    if (!(nextSunrise instanceof Date)) throw new Error('Next sunrise unavailable');
    const bright = instant >= sunrise && instant < sunset;
    const halfStart = bright ? sunrise : sunset;
    const halfEnd = bright ? sunset : nextSunrise;
    const hourLength = (halfEnd - halfStart) / 12;
    const halfIndex = Math.max(0, Math.min(11, Math.floor((instant - halfStart) / hourLength)));
    const ordinal = bright ? halfIndex : 12 + halfIndex;
    const localSunrise = DateTime.fromJSDate(sunrise).setZone(data.tz);
    const dayRuler = WEEKDAY_RULER[localSunrise.weekday % 7];
    const hourRuler = CHALDEAN[(CHALDEAN.indexOf(dayRuler) + ordinal) % 7];
    return { dayRuler:dayRuler, hourRuler:hourRuler, bright:bright, ordinal:ordinal + 1 };
  }
  function el(name, attrs) { const node=document.createElementNS(NS,name); Object.keys(attrs||{}).forEach(function(key){node.setAttribute(key,attrs[key]);}); return node; }
  function point(index, radius) { const angle=(-90+index*360/7)*Math.PI/180; return {x:180+Math.cos(angle)*radius,y:180+Math.sin(angle)*radius}; }
  function ring(group, radius, word, id) {
    const circle=el('circle',{cx:'0',cy:'0',r:String(radius),class:'relphi-ph-ruler-ring'});
    const arc=el('path',{id:id,d:'M '+(-radius)+' 0 A '+radius+' '+radius+' 0 0 1 '+radius+' 0',fill:'none'});
    const text=el('text',{class:'relphi-ph-ring-word'});
    const path=el('textPath',{href:'#'+id,startOffset:'50%','text-anchor':'middle'}); path.textContent=word;
    text.appendChild(path); group.append(circle,arc,text);
  }
  function portalMarkup() { return '<a id="relphiPlanetaryHoursPortal" class="relphi-ph-portal" href="planetaryhours.html" aria-label="Open this selected moment in Planetary Hours"><svg viewBox="0 0 360 360" role="img" aria-label="Planetary day and hour heptagram"></svg></a>'; }
  function ensurePortal() {
    let portal=document.getElementById('relphiPlanetaryHoursPortal'); if(portal)return portal;
    const center=document.querySelector('#relphiSkyWorkspace .relphi-workspace-center')||document.querySelector('.sky-output-box'); if(!center)return null;
    const holder=document.createElement('div'); holder.innerHTML=portalMarkup(); portal=holder.firstElementChild; center.insertAdjacentElement('afterbegin',portal); return portal;
  }
  function linkFor(data) {
    const url=new URL('planetaryhours.html',location.href);
    url.searchParams.set('datetime',data.datetime); url.searchParams.set('lat',data.lat); url.searchParams.set('lon',data.lon); url.searchParams.set('tz',data.tz);
    if(data.loc)url.searchParams.set('loc',data.loc); url.searchParams.set('useSystem','0'); return url.pathname+url.search;
  }
  async function draw() {
    queued=false;
    const portal=ensurePortal(); if(!portal)return;
    const data=selectedData(); if(!data){portal.hidden=true;lastSignature='';return;}
    try {
      await dependencies();
      const moment=planetaryMoment(data);
      const signature=[activeSlot,data.datetime,data.lat,data.lon,data.tz,moment.dayRuler,moment.hourRuler,moment.bright?'day':'night'].join('|');
      if(signature===lastSignature&&portal.querySelector('svg')?.dataset.ready==='true')return;
      lastSignature=signature; portal.hidden=false;
      portal.classList.toggle('is-night',!moment.bright); portal.classList.toggle('is-daylight',moment.bright);
      portal.href=linkFor(data); portal.dataset.slot=activeSlot;
      portal.setAttribute('aria-label','Open '+data.payload.name+' at its selected moment in Planetary Hours');
      portal.onclick=function(){try{localStorage.setItem('relphiPlanetaryHoursWhereWhen',JSON.stringify({datetime:data.datetime,lat:data.lat,lon:data.lon,tz:data.tz,loc:data.loc,useSystem:false,savedAt:new Date().toISOString()}));}catch(_){}};
      const svg=portal.querySelector('svg'); svg.replaceChildren(); svg.dataset.ready='pending';
      const ink=moment.bright?'#111111':'#f8f0e5'; const surface=moment.bright?'#fffaf3':'#111111';
      const order=[0,3,6,2,5,1,4,0];
      svg.appendChild(el('path',{class:'relphi-ph-heptagram-star',d:order.map(function(i,n){const p=point(i,116);return(n?'L ':'M ')+p.x.toFixed(2)+' '+p.y.toFixed(2);}).join(' ')}));
      const ready=[];
      CHALDEAN.forEach(function(id,index){
        const p=point(index,116); const host=el('g',{class:'relphi-ph-node','data-planet':id,transform:'translate('+p.x+' '+p.y+')'}); svg.appendChild(host);
        const bubble=window.RelphiGlyphComponent?.createBubble(host,id,{radius:15,padding:1,color:ink,fill:surface,strokeWidth:2.35}); if(bubble?.ready)ready.push(bubble.ready);
        if(id===moment.dayRuler)ring(host,31,'DAY','relphiPhDayArc'+index);
        if(id===moment.hourRuler)ring(host,24,'HOUR','relphiPhHourArc'+index);
      });
      await Promise.allSettled(ready); svg.dataset.ready='true';
    } catch(error){portal.hidden=true;lastSignature='';}
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(draw);}
  function styles(){
    if(document.getElementById('relphi-ph-portal-style'))return;
    const style=document.createElement('style'); style.id='relphi-ph-portal-style'; style.textContent=`
      .relphi-ph-portal{--portal-surface:#fffaf3;--portal-ink:#111;display:block;width:min(100%,260px);margin:0 auto .75rem;border:1px solid rgba(220,31,24,.22);border-radius:1rem;background:var(--portal-surface);color:var(--portal-ink);text-decoration:none;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
      .relphi-ph-portal.is-night{--portal-surface:#111;--portal-ink:#f8f0e5;border-color:rgba(255,255,255,.18)}.relphi-ph-portal svg{display:block;width:100%;height:auto;max-height:230px}.relphi-ph-portal:hover{transform:translateY(-1px);box-shadow:0 .6rem 1.4rem rgba(0,0,0,.10);border-color:rgba(220,31,24,.5)}.relphi-ph-portal:focus-visible{outline:3px solid rgba(220,31,24,.3);outline-offset:3px}
      .relphi-ph-heptagram-star{fill:none;stroke:currentColor;stroke-width:1.4;opacity:.34}.relphi-ph-node{color:currentColor}.relphi-ph-ruler-ring{fill:none;stroke:currentColor;stroke-width:1.8;vector-effect:non-scaling-stroke}.relphi-ph-ring-word{fill:currentColor;font:900 6.5px/1 system-ui,sans-serif;letter-spacing:1.1px}.relphi-ph-portal .relphi-glyph-bubble>circle{fill:var(--portal-surface)!important;stroke:currentColor!important}
      @media(max-width:760px){.relphi-ph-portal{width:min(100%,220px)}.relphi-ph-portal svg{max-height:195px}}@media(prefers-reduced-motion:reduce){.relphi-ph-portal{transition:none}.relphi-ph-portal:hover{transform:none}}
    `; document.head.appendChild(style);
  }
  function start(){
    styles();schedule();
    window.addEventListener('relphi:placement-focus',function(event){if(event.detail?.slot){activeSlot=event.detail.slot;schedule();}});
    window.addEventListener('storage',schedule); window.addEventListener('relphi:sky-builder-v4-loaded',schedule);
    const chart=document.getElementById('chartPanel'); if(chart)new MutationObserver(schedule).observe(chart,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();