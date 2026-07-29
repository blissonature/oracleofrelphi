(function(){
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const BODY_NAMES={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
  const SKY_A='#c9211e',SKY_B='#2462d0';
  const C={x:600,y:600};
  const R={bIn:165,bOut:330,bDegree:330,zIn:330,zOut:420,aDegree:420,aIn:420,aOut:575};
  const skies={
    A:{name:'Natal',color:SKY_A,asc:168.3833,placements:[['sun',195],['moon',118.4167],['mercury',206.1667],['venus',169.8833],['mars',167.8667],['jupiter',307.15],['saturn',235.5667],['uranus',254.85],['neptune',271.0167],['pluto',213.8833]]},
    B:{name:'Comparison',color:SKY_B,asc:284,placements:[['sun',126],['moon',302],['mercury',112],['venus',172],['mars',82],['jupiter',128],['saturn',14.7],['uranus',64.8],['neptune',4.4],['pluto',304.3]]}
  };
  const svgEl=name=>document.createElementNS(NS,name);
  const norm=n=>((n%360)+360)%360;
  function polar(r,deg){const a=(deg-180)*Math.PI/180;return{x:C.x+r*Math.cos(a),y:C.y+r*Math.sin(a)}}
  function annularPath(r0,r1,start,end){
    const span=norm(end-start)||360,large=span>180?1:0,p1=polar(r1,start),p2=polar(r1,start+span),p3=polar(r0,start+span),p4=polar(r0,start);
    return`M${p1.x} ${p1.y} A${r1} ${r1} 0 ${large} 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${r0} ${r0} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }
  function line(parent,r0,r1,deg,className,color){const p1=polar(r0,deg),p2=polar(r1,deg),el=svgEl('line');el.setAttribute('x1',p1.x);el.setAttribute('y1',p1.y);el.setAttribute('x2',p2.x);el.setAttribute('y2',p2.y);el.setAttribute('class',className||'');if(color)el.setAttribute('stroke',color);parent.appendChild(el);return el}
  function text(parent,r,deg,value,className){const p=polar(r,deg),el=svgEl('text');el.setAttribute('x',p.x);el.setAttribute('y',p.y);el.setAttribute('class',className||'');el.textContent=value;parent.appendChild(el);return el}
  function houseCusps(sky,system){const start=system==='whole-sign'?Math.floor(sky.asc/30)*30:sky.asc;return Array.from({length:12},(_,i)=>norm(start+i*30))}
  function houseFor(longitude,cusps){for(let i=0;i<12;i++){const start=cusps[i],span=norm(cusps[(i+1)%12]-start),delta=norm(longitude-start);if(delta<span||Math.abs(delta-span)<1e-6)return i+1}return 12}
  function addStandaloneSign(parent,id,radius,longitude){
    const p=polar(radius,longitude),size=40,image=svgEl('image');
    image.setAttribute('href',`assets/zodiac-glyphs/${id}.svg`);
    image.setAttribute('x',String(p.x-size/2));image.setAttribute('y',String(p.y-size/2));
    image.setAttribute('width',String(size));image.setAttribute('height',String(size));
    image.setAttribute('preserveAspectRatio','xMidYMid meet');image.setAttribute('pointer-events','none');
    parent.appendChild(image);
  }
  function render(){
    const status=document.getElementById('wheelStatus');status.hidden=false;status.textContent='Building clean wheel…';
    const system=document.getElementById('houseSystem').value;
    const svg=svgEl('svg');svg.setAttribute('viewBox','0 0 1200 1200');svg.setAttribute('class','scn-wheel');svg.setAttribute('role','img');svg.setAttribute('aria-label','Two-sky rainbow house comparison wheel');
    const title=svgEl('title');title.textContent='Sky Chart comparison wheel';svg.appendChild(title);
    const bg=svgEl('circle');bg.setAttribute('cx',C.x);bg.setAttribute('cy',C.y);bg.setAttribute('r',R.aOut+8);bg.setAttribute('fill','#fffdf8');bg.setAttribute('stroke','rgba(23,23,23,.12)');svg.appendChild(bg);
    const cuspA=houseCusps(skies.A,system),cuspB=houseCusps(skies.B,system);
    const groups={};['bHouses','zodiac','aHouses','ticks','dots'].forEach(k=>{groups[k]=svgEl('g');groups[k].dataset.layer=k;svg.appendChild(groups[k])});
    cuspB.forEach((start,i)=>{const end=cuspB[(i+1)%12],p=svgEl('path');p.setAttribute('d',annularPath(R.bIn,R.bOut,start,end));p.setAttribute('fill',COLORS[i]);p.setAttribute('fill-opacity','.5');p.dataset.interactive='house';p.dataset.sky='B';p.dataset.house=String(i+1);groups.bHouses.appendChild(p);line(groups.bHouses,R.bIn,R.bOut,end,'house-divider',SKY_B);text(groups.bHouses,(R.bIn+R.bOut)/2,start+norm(end-start)/2,String(i+1),'house-number')});
    cuspA.forEach((start,i)=>{const end=cuspA[(i+1)%12],p=svgEl('path');p.setAttribute('d',annularPath(R.aIn,R.aOut,start,end));p.setAttribute('fill',COLORS[i]);p.setAttribute('fill-opacity','.5');p.dataset.interactive='house';p.dataset.sky='A';p.dataset.house=String(i+1);groups.aHouses.appendChild(p);line(groups.aHouses,R.aIn,R.aOut,end,'house-divider',SKY_A);text(groups.aHouses,(R.aIn+R.aOut)/2,start+norm(end-start)/2,String(i+1),'house-number')});
    for(let i=0;i<12;i++){
      const start=i*30,end=start+30,p=svgEl('path');p.setAttribute('d',annularPath(R.zIn,R.zOut,start,end));p.setAttribute('fill',COLORS[i]);p.setAttribute('fill-opacity','.78');p.dataset.interactive='sign';p.dataset.sign=SIGNS[i];groups.zodiac.appendChild(p);line(groups.zodiac,R.zIn,R.zOut,start,'zodiac-cusp');addStandaloneSign(groups.zodiac,SIGNS[i],(R.zIn+R.zOut)/2,start+15);
    }
    [R.bIn,R.zIn,R.zOut,R.aOut].forEach(r=>{const c=svgEl('circle');c.setAttribute('cx',C.x);c.setAttribute('cy',C.y);c.setAttribute('r',r);c.setAttribute('class','ring-outline');svg.appendChild(c)});
    for(let d=0;d<360;d++){const major=d%10===0;line(groups.ticks,R.bDegree-(major?7:3),R.bDegree+(major?7:3),d,'degree-tick'+(major?' major':''));line(groups.ticks,R.aDegree-(major?7:3),R.aDegree+(major?7:3),d,'degree-tick'+(major?' major':''))}
    function drawDots(skyId,cusps){const sky=skies[skyId],degreeR=skyId==='A'?R.aDegree:R.bDegree;sky.placements.forEach(([id,longitude])=>{const anchor=polar(degreeR,longitude),dot=svgEl('circle');dot.setAttribute('cx',anchor.x);dot.setAttribute('cy',anchor.y);dot.setAttribute('r','5');dot.setAttribute('fill',sky.color);dot.setAttribute('class','placement-dot');dot.dataset.interactive='placement';dot.dataset.sky=skyId;dot.dataset.placement=id;dot.dataset.house=String(houseFor(longitude,cusps));dot.dataset.longitude=String(longitude);groups.dots.appendChild(dot)})}
    drawDots('A',cuspA);drawDots('B',cuspB);
    wireInteractions(svg,cuspA,cuspB,system);
    document.getElementById('wheelMount').replaceChildren(svg);status.hidden=true;renderLedgers(cuspA,cuspB);
  }
  function renderLedgers(cuspA,cuspB){
    function ledger(id,sky,cusps){const mount=document.getElementById(id);mount.replaceChildren();sky.placements.forEach(([body,long])=>{const row=document.createElement('div');row.className='scn-ledger-row scn-ledger-row-text';const sign=Math.floor(long/30),deg=long-sign*30;const label=document.createElement('span');label.textContent=`${BODY_NAMES[body]} in ${SIGN_NAMES[sign]} ${Math.floor(deg)}°`;const house=document.createElement('strong');house.textContent=`H${houseFor(long,cusps)}`;row.append(label,house);mount.appendChild(row)})}
    ledger('skyALedger',skies.A,cuspA);ledger('skyBLedger',skies.B,cuspB);
  }
  function wireInteractions(svg,cuspA,cuspB,system){svg.querySelectorAll('[data-interactive]').forEach(node=>node.addEventListener('click',()=>{svg.querySelectorAll('[data-interactive]').forEach(n=>{n.classList.remove('is-selected');n.classList.add('is-dim')});node.classList.remove('is-dim');node.classList.add('is-selected');const inspector=document.getElementById('inspector');if(node.dataset.interactive==='house'){const sky=node.dataset.sky,house=Number(node.dataset.house),cusps=sky==='A'?cuspA:cuspB,placements=skies[sky].placements.filter(([,lon])=>houseFor(lon,cusps)===house).map(([id])=>BODY_NAMES[id]);inspector.innerHTML=`<p class="scn-eyebrow">Walk-through</p><h2>Sky ${sky} · House ${house}</h2><p><strong>House system:</strong> ${system==='whole-sign'?'Whole Sign':'Equal House'}</p><p><strong>Placements:</strong> ${placements.length?placements.join(', '):'None'}</p>`}else if(node.dataset.interactive==='sign'){const i=SIGNS.indexOf(node.dataset.sign);inspector.innerHTML=`<p class="scn-eyebrow">Shared zodiac</p><h2>${SIGN_NAMES[i]}</h2><p>This sign remains fixed while both rainbow house wheels rotate independently around it.</p>`}else{const sky=node.dataset.sky,id=node.dataset.placement,long=Number(node.dataset.longitude),sign=Math.floor(long/30),deg=long-sign*30;inspector.innerHTML=`<p class="scn-eyebrow">Placement</p><h2>Sky ${sky} · ${BODY_NAMES[id]}</h2><p>${SIGN_NAMES[sign]} ${Math.floor(deg)}° · House ${node.dataset.house}</p><p>The exact placement is shown as a dot until the verified inscribed canon is connected.</p>`}}))}
  document.getElementById('houseSystem').addEventListener('change',render);
  document.getElementById('resetSelection').addEventListener('click',render);
  try{render()}catch(error){console.error(error);const status=document.getElementById('wheelStatus');status.hidden=false;status.textContent='The clean chart could not be completed: '+error.message}
})();