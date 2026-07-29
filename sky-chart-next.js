(function(){
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SKY_A='#c9211e',SKY_B='#2462d0';
  const C={x:600,y:600};
  const R={bIn:165,bOut:300,bDegree:312,zIn:330,zOut:420,aDegree:438,aIn:450,aOut:575};
  const skies={
    A:{name:'Natal',color:SKY_A,asc:168.3833,placements:[['sun',195],['moon',118.4167],['mercury',206.1667],['venus',169.8833],['mars',167.8667],['jupiter',307.15],['saturn',235.5667],['uranus',254.85],['neptune',271.0167],['pluto',213.8833]]},
    B:{name:'Comparison',color:SKY_B,asc:284,placements:[['sun',126],['moon',302],['mercury',112],['venus',172],['mars',82],['jupiter',128],['saturn',14.7],['uranus',64.8],['neptune',4.4],['pluto',304.3]]}
  };
  const svgEl=name=>document.createElementNS(NS,name);
  const norm=n=>((n%360)+360)%360;
  function polar(r,deg){const a=(deg-90)*Math.PI/180;return{x:C.x+r*Math.cos(a),y:C.y+r*Math.sin(a)}}
  function annularPath(r0,r1,start,end){
    const span=norm(end-start)||360,large=span>180?1:0,p1=polar(r1,start),p2=polar(r1,start+span),p3=polar(r0,start+span),p4=polar(r0,start);
    return`M${p1.x} ${p1.y} A${r1} ${r1} 0 ${large} 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${r0} ${r0} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }
  function line(parent,r0,r1,deg,className,color){const p1=polar(r0,deg),p2=polar(r1,deg),el=svgEl('line');el.setAttribute('x1',p1.x);el.setAttribute('y1',p1.y);el.setAttribute('x2',p2.x);el.setAttribute('y2',p2.y);el.setAttribute('class',className||'');if(color)el.setAttribute('stroke',color);parent.appendChild(el);return el}
  function text(parent,r,deg,value,className){const p=polar(r,deg),el=svgEl('text');el.setAttribute('x',p.x);el.setAttribute('y',p.y);el.setAttribute('class',className||'');el.textContent=value;parent.appendChild(el);return el}
  function houseCusps(sky,system){
    const start=system==='whole-sign'?Math.floor(sky.asc/30)*30:sky.asc;
    return Array.from({length:12},(_,i)=>norm(start+i*30));
  }
  function houseFor(longitude,cusps){
    for(let i=0;i<12;i++){const start=cusps[i],span=norm(cusps[(i+1)%12]-start),delta=norm(longitude-start);if(delta<span||Math.abs(delta-span)<1e-6)return i+1}return 12;
  }
  function layoutPlacements(sky,cusps,lanes){
    const grouped=Array.from({length:12},()=>[]);
    sky.placements.forEach(([id,longitude])=>grouped[houseFor(longitude,cusps)-1].push({id,longitude}));
    const out=[];
    grouped.forEach((items,houseIndex)=>{
      items.sort((a,b)=>a.longitude-b.longitude);
      const count=items.length;
      items.forEach((item,index)=>{
        const lane=lanes[index%lanes.length];
        const offset=count>1?(index-(count-1)/2)*5.5:0;
        out.push({...item,house:houseIndex+1,displayLongitude:norm(item.longitude+offset),lane});
      });
    });
    return out;
  }
  async function render(){
    const status=document.getElementById('wheelStatus');status.textContent='Resolving canonical glyphs…';
    const system=document.getElementById('houseSystem').value;
    const svg=svgEl('svg');svg.setAttribute('viewBox','0 0 1200 1200');svg.setAttribute('class','scn-wheel');svg.setAttribute('role','img');svg.setAttribute('aria-label','Two-sky rainbow house comparison wheel');
    const title=svgEl('title');title.textContent='Sky Chart comparison wheel';svg.appendChild(title);
    const bg=svgEl('circle');bg.setAttribute('cx',C.x);bg.setAttribute('cy',C.y);bg.setAttribute('r',R.aOut+8);bg.setAttribute('fill','#fffdf8');bg.setAttribute('stroke','rgba(23,23,23,.12)');svg.appendChild(bg);

    const cuspA=houseCusps(skies.A,system),cuspB=houseCusps(skies.B,system);
    const groups={};['bHouses','zodiac','aHouses','ticks','leaders','dots','glyphs','separators'].forEach(k=>{groups[k]=svgEl('g');groups[k].dataset.layer=k;svg.appendChild(groups[k])});

    cuspB.forEach((start,i)=>{const end=cuspB[(i+1)%12];const p=svgEl('path');p.setAttribute('d',annularPath(R.bIn,R.bOut,start,end));p.setAttribute('fill',COLORS[i]);p.setAttribute('fill-opacity','.5');p.dataset.interactive='house';p.dataset.sky='B';p.dataset.house=String(i+1);groups.bHouses.appendChild(p);line(groups.bHouses,R.bIn,R.bOut,start,'house-cusp');text(groups.bHouses,(R.bIn+R.bOut)/2,start+norm(end-start)/2,String(i+1),'house-number')});
    cuspA.forEach((start,i)=>{const end=cuspA[(i+1)%12];const p=svgEl('path');p.setAttribute('d',annularPath(R.aIn,R.aOut,start,end));p.setAttribute('fill',COLORS[i]);p.setAttribute('fill-opacity','.5');p.dataset.interactive='house';p.dataset.sky='A';p.dataset.house=String(i+1);groups.aHouses.appendChild(p);line(groups.aHouses,R.aIn,R.aOut,start,'house-cusp');text(groups.aHouses,(R.aIn+R.aOut)/2,start+norm(end-start)/2,String(i+1),'house-number')});

    const glyphJobs=[];
    for(let i=0;i<12;i++){
      const start=i*30,end=start+30,p=svgEl('path');p.setAttribute('d',annularPath(R.zIn,R.zOut,start,end));p.setAttribute('fill',COLORS[i]);p.setAttribute('fill-opacity','.78');p.dataset.interactive='sign';p.dataset.sign=SIGNS[i];groups.zodiac.appendChild(p);line(groups.zodiac,R.zIn,R.zOut,start,'zodiac-cusp');
      const gp=polar((R.zIn+R.zOut)/2,start+15),g=svgEl('g');g.setAttribute('transform',`translate(${gp.x} ${gp.y})`);groups.zodiac.appendChild(g);glyphJobs.push(window.SkyChartNextGlyphs.draw(g,SIGNS[i],{radius:19,color:'#171717'}));
    }
    [R.bIn,R.bOut,R.zIn,R.zOut,R.aIn,R.aOut].forEach(r=>{const c=svgEl('circle');c.setAttribute('cx',C.x);c.setAttribute('cy',C.y);c.setAttribute('r',r);c.setAttribute('class','ring-outline');svg.appendChild(c)});
    for(let d=0;d<360;d++){const major=d%10===0;line(groups.ticks,R.bDegree-(major?7:3),R.bDegree+(major?7:3),d,'degree-tick'+(major?' major':''));line(groups.ticks,R.aDegree-(major?7:3),R.aDegree+(major?7:3),d,'degree-tick'+(major?' major':''))}

    const placeA=layoutPlacements(skies.A,cuspA,[468,505,542]);const placeB=layoutPlacements(skies.B,cuspB,[282,245,208]);
    async function drawPlacement(item,skyId){const sky=skies[skyId],degreeR=skyId==='A'?R.aDegree:R.bDegree;const anchor=polar(degreeR,item.longitude),bubble=polar(item.lane,item.displayLongitude);const leader=svgEl('line');leader.setAttribute('x1',bubble.x);leader.setAttribute('y1',bubble.y);leader.setAttribute('x2',anchor.x);leader.setAttribute('y2',anchor.y);leader.setAttribute('stroke',sky.color);leader.setAttribute('class','placement-leader');groups.leaders.appendChild(leader);const dot=svgEl('circle');dot.setAttribute('cx',anchor.x);dot.setAttribute('cy',anchor.y);dot.setAttribute('r','4.3');dot.setAttribute('fill',sky.color);dot.setAttribute('class','placement-dot');groups.dots.appendChild(dot);const g=svgEl('g');g.setAttribute('transform',`translate(${bubble.x} ${bubble.y})`);g.dataset.interactive='placement';g.dataset.sky=skyId;g.dataset.placement=item.id;g.dataset.house=String(item.house);g.dataset.longitude=String(item.longitude);groups.glyphs.appendChild(g);await window.SkyChartNextGlyphs.bubble(g,item.id,{radius:item.id==='sun'||item.id==='moon'?19:16,color:sky.color})}
    placeA.forEach(item=>glyphJobs.push(drawPlacement(item,'A')));placeB.forEach(item=>glyphJobs.push(drawPlacement(item,'B')));

    line(groups.separators,R.bIn,R.bOut,90,'sky-separator',SKY_B);line(groups.separators,R.aIn,R.aOut,90,'sky-separator',SKY_A);
    await Promise.all(glyphJobs);
    wireInteractions(svg,cuspA,cuspB,system);
    document.getElementById('wheelMount').replaceChildren(svg);status.hidden=true;renderLedgers(cuspA,cuspB);
  }
  function renderLedgers(cuspA,cuspB){
    function ledger(id,sky,cusps){const mount=document.getElementById(id);mount.replaceChildren();sky.placements.forEach(([glyph,long])=>{const row=document.createElement('div');row.className='scn-ledger-row';const stage=document.createElement('span');stage.className='scn-ledger-glyph';const s=svgEl('svg');s.setAttribute('viewBox','-16 -16 32 32');stage.appendChild(s);window.SkyChartNextGlyphs.draw(s,glyph,{radius:11,color:sky.color});const sign=Math.floor(long/30),deg=long-sign*30;const label=document.createElement('span');label.textContent=`${window.SkyChartNextGlyphs.entries[glyph][0]} in ${SIGN_NAMES[sign]} ${Math.floor(deg)}°`;const house=document.createElement('strong');house.textContent=`H${houseFor(long,cusps)}`;row.append(stage,label,house);mount.appendChild(row)})}
    ledger('skyALedger',skies.A,cuspA);ledger('skyBLedger',skies.B,cuspB);
  }
  function wireInteractions(svg,cuspA,cuspB,system){svg.querySelectorAll('[data-interactive]').forEach(node=>node.addEventListener('click',()=>{svg.querySelectorAll('[data-interactive]').forEach(n=>n.classList.add('is-dim'));node.classList.remove('is-dim');node.classList.add('is-selected');const inspector=document.getElementById('inspector');if(node.dataset.interactive==='house'){const sky=node.dataset.sky,house=Number(node.dataset.house),cusps=sky==='A'?cuspA:cuspB,placements=skies[sky].placements.filter(([,lon])=>houseFor(lon,cusps)===house).map(([id])=>window.SkyChartNextGlyphs.entries[id][0]);inspector.innerHTML=`<p class="scn-eyebrow">Walk-through</p><h2>Sky ${sky} · House ${house}</h2><p><strong>House system:</strong> ${system==='whole-sign'?'Whole Sign':'Equal House'}</p><p><strong>Placements:</strong> ${placements.length?placements.join(', '):'None'}</p>`}else if(node.dataset.interactive==='sign'){const i=SIGNS.indexOf(node.dataset.sign);inspector.innerHTML=`<p class="scn-eyebrow">Shared zodiac</p><h2>${SIGN_NAMES[i]}</h2><p>This sign remains fixed while both rainbow house wheels rotate independently around it.</p>`}else{const sky=node.dataset.sky,id=node.dataset.placement,long=Number(node.dataset.longitude),sign=Math.floor(long/30),deg=long-sign*30;inspector.innerHTML=`<p class="scn-eyebrow">Placement</p><h2>Sky ${sky} · ${window.SkyChartNextGlyphs.entries[id][0]}</h2><p>${SIGN_NAMES[sign]} ${Math.floor(deg)}° · House ${node.dataset.house}</p>`}}))}
  document.getElementById('houseSystem').addEventListener('change',()=>{document.getElementById('wheelStatus').hidden=false;document.getElementById('wheelStatus').textContent='Recalculating rainbow house wheels…';render().catch(showError)});
  document.getElementById('resetSelection').addEventListener('click',()=>render().catch(showError));
  function showError(error){console.error(error);const status=document.getElementById('wheelStatus');status.hidden=false;status.textContent='The canonical chart could not be completed: '+error.message}
  render().catch(showError);
})();
