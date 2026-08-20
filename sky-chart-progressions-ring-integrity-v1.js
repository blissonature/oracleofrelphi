// Progressions visual integrity: Sky A/red is fixed natal; blue is the actual sky at the selected calendar date.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsRingIntegrityV1)return;
  window.__relphiSkyProgressionsRingIntegrityV1=true;

  const DAY=86400000;
  const YEAR=365.2422*DAY;
  const NS='http://www.w3.org/2000/svg';
  const C={x:600,y:600};
  const EXACT=414;
  const LANES=[450,440,460];
  const BODIES=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const BODY_SET=new Set(BODIES);
  const BODY_NAME={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
  const DERIVED=new Set(['asc','ascendant','dsc','descendant','mc','midheaven','ic','imum-coeli','imumcoeli','part-of-fortune','fortune','pof']);
  let frame=0;

  const canonical=value=>String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-');
  const norm=value=>((Number(value)%360)+360)%360;
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const svg=(name,attrs={})=>{const node=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));return node};
  const esc=value=>window.CSS?.escape?CSS.escape(String(value)):String(value).replace(/["\\]/g,'\\$&');

  function panel(){return document.getElementById('skyProgressionsPanel')}
  function progressionWheel(){return panel()?.querySelector('[data-progression-shared-wheel="true"]')}
  function readA(){try{return JSON.parse(localStorage.getItem('relphiSkyChartA')||'null')}catch(_){return null}}
  function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:payload||{}}
  function natalEpoch(){const payload=readA(),p=profile(payload),stamp=p?.instant||p?.dateTime||payload?.instant||payload?.dateTime;if(!stamp)return NaN;const value=new Date(stamp).getTime();return Number.isFinite(value)?value:NaN}
  function dateValue(ms){const d=new Date(ms);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function parseDate(value){const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return NaN;return new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12,0,0,0).getTime()}
  function rangeStart(){const root=panel(),epoch=natalEpoch(),raw=root?.querySelector('[data-progression-range-start]')?.value;if(Number.isFinite(epoch)&&raw===dateValue(epoch))return epoch;const parsed=parseDate(raw);return Number.isFinite(parsed)?parsed:epoch}
  function targetTime(){const start=rangeStart(),days=Number(panel()?.querySelector('[data-progression-scrubber]')?.value)||0;return start+days*DAY}
  function suppress(node){if(!node)return;node.hidden=true;node.style.setProperty('display','none','important');node.setAttribute('aria-hidden','true')}
  function reveal(node){if(!node)return;node.hidden=false;node.style.removeProperty('display');node.removeAttribute('aria-hidden')}
  function parseTranslate(node){const match=String(node?.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[,\s]+([-+\d.eE]+)/);return match?{x:Number(match[1]),y:Number(match[2])}:null}

  function astronomyLongitude(id,ms){
    const astronomy=window.Astronomy;if(!astronomy)return NaN;
    try{const body=astronomy.Body?.[BODY_NAME[id]]||BODY_NAME[id],vector=astronomy.GeoVector(body,new Date(ms),true);return norm(astronomy.Ecliptic(vector).elon)}catch(_){return NaN}
  }
  function actualRecords(ms){return BODIES.map(id=>({id,name:BODY_NAME[id],value:astronomyLongitude(id,ms)})).filter(record=>Number.isFinite(record.value))}

  function placementSource(payload){if(!payload||typeof payload!=='object')return[];const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),source=known||payload;return Array.isArray(source)?source.map((item,index)=>[String(item?.id||item?.name||index),item]):Object.entries(source)}
  function itemLongitude(item){
    if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
    const signs=window.RelphiSkyProgressionsCore?.SIGNS||['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const sign=signs.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').trim().toLowerCase());if(sign<0)return NaN;
    return norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600);
  }
  function natalRecords(){
    const aliases={sol:'sun',luna:'moon'},byId=new Map(),registry=window.RelphiGlyphRegistry;
    for(const [key,item] of placementSource(readA())){
      if(!item||typeof item!=='object')continue;let id='';
      for(const candidate of [item.glyphId,item.id,item.name,item.label,item.body,item.planet,key]){
        if(candidate==null)continue;const raw=canonical(candidate),resolved=registry&&(registry.resolve?.(raw)||registry.get?.(raw)),test=canonical(resolved?.id||aliases[raw]||raw);if(BODY_SET.has(test)){id=test;break}
      }
      const value=itemLongitude(item);if(id&&Number.isFinite(value)&&!byId.has(id))byId.set(id,{id,name:BODY_NAME[id],value});
    }
    return BODIES.map(id=>byId.get(id)).filter(Boolean);
  }

  function spread(records){
    const placed=[],result=[];
    for(const record of records.slice().sort((a,b)=>a.value-b.value)){
      let chosen=null;
      for(let step=0;step<=20&&!chosen;step+=1){
        const amount=step*.75,offsets=step===0?[0]:[amount,-amount];
        for(const offset of offsets){
          for(const lane of LANES){
            const display=norm(record.value+offset),point=polar(lane,display),collision=placed.some(other=>Math.hypot(point.x-other.x,point.y-other.y)<40.4);
            if(collision)continue;chosen={...record,lane,display,point};placed.push(point);break;
          }
          if(chosen)break;
        }
      }
      if(!chosen){const lane=LANES[0],point=polar(lane,record.value);chosen={...record,lane,display:record.value,point};placed.push(point)}
      result.push(chosen);
    }
    return result;
  }

  function enforceVisibleSet(wheel){
    wheel.querySelectorAll('[data-placement]').forEach(node=>{
      const id=canonical(node.dataset.placement);
      if(DERIVED.has(id)||node.dataset.angleAxis==='true'){suppress(node);return}
      if(node.dataset.sky==='B'&&!BODY_SET.has(id)){suppress(node);return}
      if(node.dataset.sky==='B'&&BODY_SET.has(id))reveal(node);
    });
    wheel.querySelectorAll('.sky-foundation-angle-axis').forEach(suppress);
    wheel.querySelectorAll('[data-layer="leaders"] [data-sky="B"][data-placement]').forEach(leader=>{if(!BODY_SET.has(canonical(leader.dataset.placement)))suppress(leader)});
  }

  function placeActualBlue(wheel,records){
    const points=new Map();
    for(const record of spread(records)){
      const host=wheel.querySelector(`[data-layer="placements"] [data-sky="B"][data-placement="${esc(record.id)}"]:not([data-angle-axis="true"])`),leader=wheel.querySelector(`[data-layer="leaders"] .sky-foundation-leader[data-sky="B"][data-placement="${esc(record.id)}"]`);
      if(!host)continue;const exact=polar(EXACT,record.value);reveal(host);host.setAttribute('transform',`translate(${record.point.x} ${record.point.y})`);host.dataset.placementLane=String(record.lane);host.dataset.displayLongitude=record.display.toFixed(8);host.dataset.exactLongitude=record.value.toFixed(8);host.dataset.progressionVisualRing='calendar-blue';points.set(record.id,record.point);
      if(leader){reveal(leader);leader.setAttribute('x1',record.point.x);leader.setAttribute('y1',record.point.y);leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y);leader.dataset.exactLongitude=record.value.toFixed(8)}
    }
    return points;
  }

  function redPoints(wheel){const result=new Map();for(const id of BODIES){const node=wheel.querySelector(`[data-layer="placements"] [data-sky="A"][data-placement="${esc(id)}"]:not([data-angle-axis="true"])`),point=parseTranslate(node);if(point&&!node?.hidden&&node?.style.display!=='none')result.set(id,point)}return result}
  function filterEnabled(id){return panel()?.querySelector(`[data-progression-filter="${id}"]`)?.getAttribute('aria-pressed')!=='false'}
  function currentOrb(){const value=Number(document.querySelector('[data-filter="orb"]')?.value);return Number.isFinite(value)&&value>=0?value:1}
  function drawAspects(wheel,moving,natal,movingPoints){
    const core=window.RelphiSkyProgressionsCore,layer=wheel.querySelector('[data-layer="aspects"]');if(!core?.activeRelationships||!layer)return;
    const rows=[],orb=currentOrb();if(filterEnabled('intra'))rows.push(...core.activeRelationships(moving,moving,orb,{mode:'intra'}));if(filterEnabled('inter'))rows.push(...core.activeRelationships(moving,natal,orb,{mode:'inter'}));
    const reds=redPoints(wheel);layer.replaceChildren();
    for(const relation of rows.filter(row=>!(row.mode==='inter'&&row.aspect.id==='conjunction'&&row.left.id===row.right.id)).sort((a,b)=>a.error-b.error).slice(0,40)){
      const from=movingPoints.get(relation.left.id),to=relation.mode==='intra'?movingPoints.get(relation.right.id):reds.get(relation.right.id);if(!from||!to)continue;
      layer.appendChild(svg('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:relation.aspect.color,class:`sky-foundation-aspect sky-progression-aspect is-${relation.mode}`,'data-aspect':relation.aspect.id,'data-left-placement':relation.left.id,'data-right-placement':relation.right.id,'data-orb':relation.error.toFixed(6),'data-progression-scope':relation.mode}));
    }
  }

  function relabel(){
    const root=panel();if(!root)return;
    const methods=root.querySelectorAll('.sky-progressions-method');if(methods[0])methods[0].textContent='Sky A natal fixed · blue sky moves through time';if(methods[1])methods[1].textContent='Calendar sky · actual planetary motion';
    const ring=root.querySelector('[data-progression-ring-label]');if(ring)ring.textContent='Red: Sky A natal (fixed) · Blue: actual sky at selected date';
    const age=root.querySelector('[data-progression-age-label]');if(age){age.textContent=age.textContent.replace('Secondary progression','Calendar sky').replace('after epoch','after natal')}
    const rule=root.querySelector('.sky-progression-rule');if(rule)rule.textContent='Red placements are the fixed natal Sky A. Blue placements are the actual planetary sky at the selected calendar date. Ingress/egress conditions and aspect windows follow that moving sky.';
    root.querySelectorAll('.sky-progression-annotation strong').forEach(node=>{node.textContent=node.textContent.replace(/^Progressed /,'Moving ').replace(/ progressed /g,' moving ')});
    const wheel=progressionWheel();if(wheel){wheel.dataset.progressionRingIntegrity='red-natal-fixed-blue-calendar-sky';wheel.setAttribute('aria-label','Progressions wheel. Sky A red placements are fixed natal positions; blue planetary placements show the actual sky at the selected calendar date.')}
  }

  function enforce(){
    relabel();if(document.documentElement.hasAttribute('data-progression-live-playing'))return;
    const wheel=progressionWheel(),ms=targetTime();if(!wheel||!Number.isFinite(ms)||!window.Astronomy)return;
    enforceVisibleSet(wheel);const moving=actualRecords(ms),natal=natalRecords(),points=placeActualBlue(wheel,moving);drawAspects(wheel,moving,natal,points);
  }
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>requestAnimationFrame(enforce))}

  document.addEventListener('click',event=>{if(event.target.closest?.('[data-sky-middle-tab="progressions"], [data-progression-now], [data-progression-filter]'))schedule()});
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]'))schedule()});
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-progression-range-start], [data-progression-range-end]'))schedule()});
  window.addEventListener('relphi:sky-foundation-ready',schedule);
  window.addEventListener('relphi:sky-orb-limit-changed',schedule);

  function start(){
    schedule();
    const root=panel();if(!root)return;
    const observer=new MutationObserver(()=>{relabel()});
    const age=root.querySelector('[data-progression-age-label]'),annotations=root.querySelector('[data-progression-annotations]');
    if(age)observer.observe(age,{subtree:true,childList:true,characterData:true});if(annotations)observer.observe(annotations,{subtree:true,childList:true,characterData:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
