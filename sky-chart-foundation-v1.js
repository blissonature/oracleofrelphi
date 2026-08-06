// Part 1 Sky Chart foundation: fast canonical shell, stable panels, rainbow comparison wheel.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyFoundationV1)return;
  window.__relphiSkyFoundationV1=true;

  const NS='http://www.w3.org/2000/svg',KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'},SKY={A:'#c9211e',B:'#2462d0'};
  const COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER=['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
  const ASPECTS=[
    {id:'conjunction',angle:0,orb:3,color:'#e53935'},
    {id:'semi-sextile',angle:30,orb:2,color:'#7c9b49'},
    {id:'octile',angle:45,orb:2,color:'#b86d43'},
    {id:'sextile',angle:60,orb:3,color:'#d3b727'},
    {id:'quintile',angle:72,orb:2,color:'#8b6cc2'},
    {id:'square',angle:90,orb:3,color:'#d6534d'},
    {id:'trine',angle:120,orb:3,color:'#4e9e69'},
    {id:'tri-octile',angle:135,orb:2,color:'#9f5944'},
    {id:'bi-quintile',angle:144,orb:2,color:'#7655aa'},
    {id:'quincunx',angle:150,orb:2,color:'#4b8e88'},
    {id:'opposition',angle:180,orb:3,color:'#5961c8'}
  ];
  const C={x:600,y:600},R={bIn:166,bOut:323,zIn:323,zOut:414,aIn:414,aOut:574,bDegree:323,aDegree:414};
  const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
  let lastSignature='',rendering=false,rerender=false;
  const svg=(name,attrs)=>{const node=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node};
  const norm=value=>((Number(value)%360)+360)%360;
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function placementSource(payload){
    if(!payload||typeof payload!=='object')return[];const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),source=known||payload;
    if(Array.isArray(source))return source.map((item,index)=>[String(item?.name||item?.label||item?.body||item?.planet||item?.point||item?.id||index),item]);
    return Object.entries(source).filter(([key,value])=>value&&typeof value==='object'&&!Array.isArray(value)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(value.longitude))||value.sign||value.zodiac));
  }
  function longitude(item){if(!item)return NaN;if(Number.isFinite(Number(item.longitude)))return norm(item.longitude);const sign=SIGNS.indexOf(String(item.sign||item.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600)}
  function canonicalEntry(key,item){
    const registry=window.RelphiGlyphRegistry;if(!registry)return null;
    for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),entry=registry.resolve(ALIASES[raw.toLowerCase()]||raw)||registry.get(ALIASES[raw.toLowerCase()]||raw);if(entry)return entry}
    return null;
  }
  function records(payload){
    const omitted=[];const result=placementSource(payload).map(([key,item])=>{const entry=canonicalEntry(key,item),value=longitude(item);if(!entry&&Number.isFinite(value))omitted.push(String(item?.name||item?.label||key));return{key,item,entry,id:entry?.id||'',value}}).filter(record=>record.entry&&Number.isFinite(record.value));
    if(omitted.length)console.info('Sky Chart omitted placements without approved canonical registry entries:',omitted);
    return result.sort((left,right)=>{const a=ORDER.indexOf(left.id),b=ORDER.indexOf(right.id);return(a<0?999:a)-(b<0?999:b)||left.value-right.value});
  }
  function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{}}
  function ascendant(payload,list){const record=list.find(item=>item.id==='asc');if(record)return record.value;const value=Number(profile(payload).ascendant??payload?.ascendant??payload?.asc);return Number.isFinite(value)?norm(value):0}
  function houseCusps(payload,list){
    const p=profile(payload);for(const raw of [p.houseCusps,p.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]){if(!raw)continue;const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);if(values.length===12&&values.every(Number.isFinite))return values.map(norm)}
    const asc=ascendant(payload,list),system=String(p.houseSystem||payload?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;return Array.from({length:12},(_,index)=>norm(start+index*30));
  }
  function houseFor(value,cusps){for(let index=0;index<12;index++){const start=cusps[index],span=norm(cusps[(index+1)%12]-start)||30;if(norm(value-start)<span)return index+1}return 12}
  function coordinate(record){const sign=Math.floor(record.value/30),within=record.value-sign*30,degree=Math.floor(within),minute=Math.round((within-degree)*60)%60;return{sign,text:`${degree}°${String(minute).padStart(2,'0')}′`}}
  function annular(inner,outer,start,end){const span=norm(end-start)||360,large=span>180?1:0,a=polar(outer,start),b=polar(outer,start+span),c=polar(inner,start+span),d=polar(inner,start);return`M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`}
  function radialLine(parent,inner,outer,degree,attrs){const a=polar(inner,degree),b=polar(outer,degree),line=svg('line',Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y},attrs||{}));parent.appendChild(line);return line}
  function radialText(parent,radius,degree,text){const point=polar(radius,degree),node=svg('text',{x:point.x,y:point.y,class:'sky-foundation-house-number'});node.textContent=text;parent.appendChild(node)}
  function shell(){
    let root=document.getElementById('skyFoundationRoot');if(root)return root;const panel=document.getElementById('chartPanel');if(!panel)return null;
    root=document.createElement('section');root.id='skyFoundationRoot';root.setAttribute('aria-label','Sky Chart foundation');root.innerHTML=`<aside id="skyFoundationA" class="sky-foundation-panel" aria-label="Sky A"><header class="sky-foundation-heading"><span class="sky-foundation-slot" style="--slot-color:${SKY.A}">Sky A</span><span class="sky-foundation-name">Sky A</span></header><div class="sky-foundation-body"></div></aside><section id="skyFoundationComparison" class="sky-foundation-panel" aria-label="Comparison zodiac wheel"><header class="sky-foundation-heading"><span>Comparison</span></header><div id="skyFoundationWheelMount"></div></section><aside id="skyFoundationB" class="sky-foundation-panel" aria-label="Sky B"><header class="sky-foundation-heading"><span class="sky-foundation-slot" style="--slot-color:${SKY.B}">Sky B</span><span class="sky-foundation-name">Sky B</span></header><div class="sky-foundation-body"></div></aside>`;panel.prepend(root);document.body.classList.add('sky-foundation-active');return root;
  }
  function mountCanonical(parent,id,options){const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry?.get(id)||registry?.resolve(id);if(!entry||!component?.mount)throw new Error('Approved glyph unavailable: '+id);return component.mount(parent,entry.id,options)}
  function renderCard(slot,payload,list,cusps){
    const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');if(!panel)return[];panel.querySelector('.sky-foundation-name').textContent=payload?.name||`Sky ${slot}`;const body=panel.querySelector('.sky-foundation-body');body.replaceChildren();
    if(!list.length){body.innerHTML='<p class="sky-foundation-empty">No approved canonical placements are available for this sky.</p>';return[]}
    const ledger=document.createElement('div');ledger.className='sky-foundation-ledger';body.appendChild(ledger);const jobs=[];
    list.forEach(record=>{const position=coordinate(record),row=document.createElement('div');row.className='sky-foundation-row';row.innerHTML=`<span class="sky-foundation-row-glyph" aria-label="${esc(record.entry.name)}"></span><span class="sky-foundation-row-name">${esc(record.entry.name)}</span><span class="sky-foundation-coordinate">${position.text} ${SIGN_NAMES[position.sign]}</span><span class="sky-foundation-house">H${houseFor(record.value,cusps)}</span>`;ledger.appendChild(row);try{mountCanonical(row.querySelector('.sky-foundation-row-glyph'),record.id,{size:32,circle:false,color:SKY[slot]})}catch(error){row.remove();console.error(error)}});return jobs;
  }
  function spreadPlacements(list,exactRadius,direction){const laneA=exactRadius+direction*36,laneB=laneA+direction*38,result=list.slice().sort((a,b)=>a.value-b.value).map((record,index)=>({...record,display:record.value,lane:index%4===3?laneB:laneA})),gap=7.5;for(let pass=0;pass<10;pass++){let changed=false;for(let index=1;index<result.length;index++){if(result[index].lane!==result[index-1].lane)continue;const difference=result[index].display-result[index-1].display;if(difference>=gap)continue;const push=(gap-difference)/2;result[index-1].display-=push;result[index].display+=push;changed=true}if(!changed)break}result.forEach(record=>record.display=norm(record.display));return result}
  function relationships(a,b){const result=[];a.forEach(left=>b.forEach(right=>{const distance=separation(left.value,right.value);ASPECTS.forEach(aspect=>{const orb=Math.abs(distance-aspect.angle);if(orb<=aspect.orb)result.push({left,right,aspect,orb})})}));return result.sort((x,y)=>x.orb-y.orb)}
  function buildWheel(listA,listB,cuspsA,cuspsB){
    const chart=svg('svg',{viewBox:'0 0 1200 1200',role:'img','aria-label':'Sky A and Sky B rainbow comparison wheel',class:'sky-foundation-wheel relphi-canonical-ready'});chart.appendChild(svg('circle',{cx:C.x,cy:C.y,r:R.aOut+8,fill:'#fffdf8',stroke:'rgba(31,27,24,.14)'}));const layers={};['b-houses','zodiac','a-houses','ticks','aspects','outlines','leaders','placements'].forEach(name=>{layers[name]=svg('g',{'data-layer':name});chart.appendChild(layers[name])});
    function houses(layer,cusps,inner,outer,slot){cusps.forEach((start,index)=>{const end=cusps[(index+1)%12];layer.appendChild(svg('path',{d:annular(inner,outer,start,end),fill:COLORS[index],'fill-opacity':'.5'}));radialLine(layer,inner,outer,end,{stroke:SKY[slot],class:'sky-foundation-divider'});radialText(layer,(inner+outer)/2,start+(norm(end-start)||30)/2,index+1)})}
    houses(layers['b-houses'],cuspsB,R.bIn,R.bOut,'B');houses(layers['a-houses'],cuspsA,R.aIn,R.aOut,'A');const jobs=[];
    SIGNS.forEach((id,index)=>{const start=index*30;layers.zodiac.appendChild(svg('path',{d:annular(R.zIn,R.zOut,start,start+30),fill:COLORS[index],'fill-opacity':'.82'}));radialLine(layers.zodiac,R.zIn,R.zOut,start,{stroke:'#423b35','stroke-width':'1.35','vector-effect':'non-scaling-stroke'});const point=polar((R.zIn+R.zOut)/2,start+15),host=svg('g',{transform:`translate(${point.x} ${point.y})`});layers.zodiac.appendChild(host);try{mountCanonical(host,id,{size:38,circle:false,color:'#171717'})}catch(error){host.remove();console.error(error)}});
    [R.bIn,R.zIn,R.zOut,R.aOut].forEach(radius=>layers.outlines.appendChild(svg('circle',{cx:C.x,cy:C.y,r:radius,class:'sky-foundation-ring'})));for(let degree=0;degree<360;degree++){const length=degree%10===0?12:degree%5===0?8:5,className=degree%10===0?'sky-foundation-tick sky-foundation-tick-major':'sky-foundation-tick';radialLine(layers.ticks,R.bDegree-length,R.bDegree+length,degree,{class:className});radialLine(layers.ticks,R.aDegree-length,R.aDegree+length,degree,{class:className})}
    relationships(listA,listB).forEach(relation=>{const from=polar(R.bIn-1,relation.left.value),to=polar(R.bIn-1,relation.right.value);layers.aspects.appendChild(svg('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:relation.aspect.color,class:'sky-foundation-aspect','data-aspect':relation.aspect.id,'data-left-placement':relation.left.id,'data-right-placement':relation.right.id,'data-orb':relation.orb.toFixed(6)}))});
    function placements(list,slot,exactRadius,direction,cusps){spreadPlacements(list,exactRadius,direction).forEach(record=>{const exact=polar(exactRadius,record.value),display=polar(record.lane,record.display);layers.leaders.appendChild(svg('line',{x1:display.x,y1:display.y,x2:exact.x,y2:exact.y,stroke:SKY[slot],class:'sky-foundation-leader'}));const host=svg('g',{transform:`translate(${display.x} ${display.y})`,'data-sky':slot,'data-placement':record.id,'data-house':houseFor(record.value,cusps)});layers.placements.appendChild(host);try{mountCanonical(host,record.id,{size:32,circle:true,color:SKY[slot]})}catch(error){host.remove();console.error(error)}})}
    placements(listA,'A',R.aDegree,1,cuspsA);placements(listB,'B',R.bDegree,-1,cuspsB);return{chart,jobs};
  }
  function signature(a,b){try{return JSON.stringify([a,b])}catch(_){return String(Date.now())}}
  async function render(force){
    if(rendering){rerender=true;return}const root=shell();if(!root)return;const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent;if(!registry||!component?.mount){setTimeout(()=>render(true),20);return}
    const payloadA=read(KEYS.A),payloadB=read(KEYS.B),nextSignature=signature(payloadA,payloadB);if(!force&&nextSignature===lastSignature)return;rendering=true;rerender=false;
    try{const listA=records(payloadA),listB=records(payloadB),cuspsA=houseCusps(payloadA,listA),cuspsB=houseCusps(payloadB,listB),cardJobs=[...renderCard('A',payloadA,listA,cuspsA),...renderCard('B',payloadB,listB,cuspsB)],mount=document.getElementById('skyFoundationWheelMount');if(!listA.length||!listB.length){mount.innerHTML=`<p class="sky-foundation-empty">${!listA.length?'Sky A needs approved canonical placements.':'Sky B needs approved canonical placements.'}</p>`;await Promise.allSettled(cardJobs)}else{const wheel=buildWheel(listA,listB,cuspsA,cuspsB);mount.replaceChildren(wheel.chart);await Promise.allSettled([...cardJobs,...wheel.jobs])}root.setAttribute('aria-busy','false');document.body.classList.remove('sky-foundation-booting');lastSignature=nextSignature;window.dispatchEvent(new Event('relphi:sky-foundation-ready'))}catch(error){console.error('Sky Chart foundation render failed:',error);document.getElementById('skyFoundationWheelMount').innerHTML='<p class="sky-foundation-empty">The canonical foundation could not render.</p>';document.body.classList.remove('sky-foundation-booting')}finally{rendering=false;if(rerender)requestAnimationFrame(()=>render(true))}
  }
  function start(){shell();render(true);window.addEventListener('storage',event=>{if(!event.key||event.key===KEYS.A||event.key===KEYS.B)render(true)});setInterval(()=>{const next=signature(read(KEYS.A),read(KEYS.B));if(next!==lastSignature)render(true)},1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
