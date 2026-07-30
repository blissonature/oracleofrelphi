// Live Sky Chart Next focus graph for the rainbow-house wheel embedded in sky-chart.html.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyChartNextLiveInteractions)return;
  window.__relphiSkyChartNextLiveInteractions=true;

  const NS='http://www.w3.org/2000/svg';
  const CENTER={x:600,y:600};
  const ASPECT_RADIUS=165;
  const MAX_ORB=3;
  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const ASPECTS=[
    {id:'conjunction',angle:0,color:'#e53935'},
    {id:'sextile',angle:60,color:'#f1dc43'},
    {id:'square',angle:90,color:'#43a85b'},
    {id:'trine',angle:120,color:'#2ca69b'},
    {id:'opposition',angle:180,color:'#5961c8'}
  ];

  const svgEl=name=>document.createElementNS(NS,name);
  const norm=value=>((Number(value)%360)+360)%360;
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:CENTER.x+radius*Math.cos(angle),y:CENTER.y+radius*Math.sin(angle)};};
  const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
  const signIndex=longitude=>Math.floor(norm(longitude)/30);
  const placementKey=(sky,id)=>sky+':'+id;
  const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}};

  function placementEntries(payload){
    if(!payload)return[];
    const candidates=[payload.placements,payload.positions,payload.points,payload.bodies,payload];
    const source=candidates.find(value=>value&&typeof value==='object');
    if(!source)return[];
    if(Array.isArray(source))return source.map((item,index)=>[String(item?.name||item?.label||item?.body||item?.planet||item?.point||item?.id||index),item]);
    return Object.entries(source).filter(([,item])=>item&&typeof item==='object'&&!Array.isArray(item));
  }

  function longitude(item){
    if(!item)return NaN;
    if(Number.isFinite(Number(item.longitude)))return norm(item.longitude);
    const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    const sign=signs.indexOf(String(item.sign||item.zodiac||'').trim().toLowerCase());
    if(sign<0)return NaN;
    return norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600);
  }

  function ascLongitude(payload){
    const found=placementEntries(payload).find(([key,item])=>/^(asc|ascendant|rising|ac)$/i.test(String(key))||/^(asc|ascendant|rising|ac)$/i.test(String(item?.name||item?.label||item?.body||'')));
    return found?longitude(found[1]):0;
  }

  function houseCusps(payload){
    const asc=ascLongitude(payload);
    for(const candidate of [payload?.houseCusps,payload?.cusps,payload?.houses]){
      if(!candidate)continue;
      const values=(Array.isArray(candidate)?candidate:Object.values(candidate)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).filter(Number.isFinite).slice(0,12);
      if(values.length===12)return values.map(norm);
    }
    const system=String(payload?.houseSystem||payload?.house_system||'').toLowerCase();
    const start=system.includes('whole')?Math.floor(asc/30)*30:asc;
    return Array.from({length:12},(_,index)=>norm(start+index*30));
  }

  function houseFor(value,cusps){
    for(let index=0;index<12;index++){
      const start=cusps[index],span=norm(cusps[(index+1)%12]-start),delta=norm(value-start);
      if(delta<span||Math.abs(delta-span)<1e-6)return index+1;
    }
    return 12;
  }

  function annotateBand(layer,kind,sky){
    if(!layer)return;
    Array.from(layer.children).forEach((node,index)=>{
      const sector=Math.floor(index/3);
      node.dataset.focusablePiece=kind;
      node.dataset.interactive=kind;
      if(kind==='house'){
        node.dataset.sky=sky;
        node.dataset.house=String(sector+1);
      }else node.dataset.signIndex=String(sector);
    });
  }

  function annotatePlacements(svg){
    const cusps={A:houseCusps(read(KEYS.A)),B:houseCusps(read(KEYS.B))};
    const placements=Array.from(svg.querySelectorAll('[data-layer="placement-glyphs"] > g[data-glyph-id]'));
    const leaders=Array.from(svg.querySelectorAll('[data-layer="placement-leaders"] > line'));
    placements.forEach((node,index)=>{
      const sky=node.dataset.sky;
      const id=node.dataset.glyphId;
      const value=Number(node.dataset.longitude);
      node.dataset.interactive='placement';
      node.dataset.focusablePiece='placement';
      node.dataset.placement=id;
      node.dataset.signIndex=String(signIndex(value));
      node.dataset.house=String(houseFor(value,cusps[sky]||cusps.A));
      node.setAttribute('tabindex','0');
      node.setAttribute('role','button');
      const leader=leaders[index];
      if(!leader)return;
      leader.dataset.interactive='placement-leader';
      leader.dataset.focusablePiece='placement-leader';
      leader.dataset.sky=sky;
      leader.dataset.placement=id;
      leader.dataset.longitude=String(value);
      leader.dataset.house=node.dataset.house;
    });
  }

  function placementData(svg,sky){
    return Array.from(svg.querySelectorAll(`[data-interactive="placement"][data-sky="${sky}"]`)).map(node=>({id:node.dataset.placement,longitude:Number(node.dataset.longitude)})).filter(item=>Number.isFinite(item.longitude));
  }

  function relationships(svg){
    const result=[];
    placementData(svg,'A').forEach(a=>placementData(svg,'B').forEach(b=>{
      const distance=separation(a.longitude,b.longitude);
      ASPECTS.forEach(aspect=>{const orb=Math.abs(distance-aspect.angle);if(orb<=MAX_ORB)result.push({a,b,aspect,orb});});
    }));
    return result.sort((left,right)=>left.orb-right.orb||left.aspect.angle-right.aspect.angle);
  }

  function drawAspects(svg){
    svg.querySelector('[data-layer="combined-aspects"]')?.remove();
    const group=svgEl('g');group.dataset.layer='combined-aspects';
    const chamber=svgEl('circle');
    chamber.setAttribute('cx',CENTER.x);chamber.setAttribute('cy',CENTER.y);chamber.setAttribute('r',ASPECT_RADIUS);
    chamber.setAttribute('fill','rgba(255,253,248,.08)');chamber.setAttribute('stroke','rgba(23,23,23,.24)');chamber.setAttribute('stroke-width','1.4');
    chamber.dataset.clearFocus='true';group.appendChild(chamber);
    relationships(svg).forEach((relation,index)=>{
      const from=polar(ASPECT_RADIUS,relation.a.longitude),to=polar(ASPECT_RADIUS,relation.b.longitude),line=svgEl('line');
      line.setAttribute('x1',from.x);line.setAttribute('y1',from.y);line.setAttribute('x2',to.x);line.setAttribute('y2',to.y);
      line.setAttribute('stroke',relation.aspect.color);line.setAttribute('stroke-width','2.15');line.setAttribute('stroke-linecap','round');line.setAttribute('opacity','.68');line.setAttribute('vector-effect','non-scaling-stroke');
      line.dataset.interactive='aspect';line.dataset.focusablePiece='aspect';line.dataset.aspectIndex=String(index);line.dataset.aspect=relation.aspect.id;line.dataset.skyAPlacement=relation.a.id;line.dataset.skyBPlacement=relation.b.id;line.dataset.orb=relation.orb.toFixed(2);
      const title=svgEl('title');title.textContent=`Sky A ${relation.a.id} ${relation.aspect.id} Sky B ${relation.b.id} · orb ${relation.orb.toFixed(2)}°`;line.appendChild(title);group.appendChild(line);
    });
    const glyphLayer=svg.querySelector('[data-layer="placement-glyphs"]');
    if(glyphLayer)svg.insertBefore(group,glyphLayer);else svg.appendChild(group);
  }

  function placementNode(svg,sky,id){return svg.querySelector(`[data-interactive="placement"][data-sky="${sky}"][data-placement="${id}"]`);}
  function placementLeader(svg,sky,id){return svg.querySelector(`[data-focusable-piece="placement-leader"][data-sky="${sky}"][data-placement="${id}"]`);}
  function addSign(set,svg,sign){svg.querySelectorAll(`[data-focusable-piece="sign"][data-sign-index="${sign}"]`).forEach(node=>set.add(node));}
  function addHouse(set,svg,sky,house){svg.querySelectorAll(`[data-focusable-piece="house"][data-sky="${sky}"][data-house="${house}"]`).forEach(node=>set.add(node));}

  function addPlacementContext(set,svg,sky,id){
    const node=placementNode(svg,sky,id),leader=placementLeader(svg,sky,id);
    if(!node)return;
    set.add(node);if(leader)set.add(leader);
    addSign(set,svg,node.dataset.signIndex);
    addHouse(set,svg,sky,node.dataset.house);
  }

  function addAspectContext(set,svg,line){set.add(line);addPlacementContext(set,svg,'A',line.dataset.skyAPlacement);addPlacementContext(set,svg,'B',line.dataset.skyBPlacement);}
  function addDirectAspects(set,svg,seedKeys){svg.querySelectorAll('[data-interactive="aspect"]').forEach(line=>{const aKey=placementKey('A',line.dataset.skyAPlacement),bKey=placementKey('B',line.dataset.skyBPlacement);if(seedKeys.has(aKey)||seedKeys.has(bKey))addAspectContext(set,svg,line);});}

  function relatedSet(svg,target){
    const keep=new Set(),seedKeys=new Set(),type=target.dataset.interactive||target.dataset.focusablePiece;
    if(type==='sign'){
      const sign=Number(target.dataset.signIndex);addSign(keep,svg,sign);
      svg.querySelectorAll('[data-interactive="placement"]').forEach(node=>{if(Number(node.dataset.signIndex)!==sign)return;seedKeys.add(placementKey(node.dataset.sky,node.dataset.placement));addPlacementContext(keep,svg,node.dataset.sky,node.dataset.placement);});
      addDirectAspects(keep,svg,seedKeys);
    }else if(type==='house'){
      const sky=target.dataset.sky,house=target.dataset.house;addHouse(keep,svg,sky,house);
      svg.querySelectorAll(`[data-interactive="placement"][data-sky="${sky}"][data-house="${house}"]`).forEach(node=>{seedKeys.add(placementKey(sky,node.dataset.placement));addPlacementContext(keep,svg,sky,node.dataset.placement);});
      addDirectAspects(keep,svg,seedKeys);
    }else if(type==='placement'||type==='placement-leader'){
      const sky=target.dataset.sky,id=target.dataset.placement;seedKeys.add(placementKey(sky,id));addPlacementContext(keep,svg,sky,id);addDirectAspects(keep,svg,seedKeys);
    }else if(type==='aspect')addAspectContext(keep,svg,target);
    return keep;
  }

  function clearHover(svg){svg.querySelectorAll('.is-hovered').forEach(node=>node.classList.remove('is-hovered'));}
  function clearIsolation(svg){svg.classList.remove('has-isolation');svg.querySelectorAll('.is-kept,.is-selected').forEach(node=>node.classList.remove('is-kept','is-selected'));}
  function applyIsolation(svg,target){clearIsolation(svg);const keep=relatedSet(svg,target);if(!keep.size)return;svg.classList.add('has-isolation');keep.forEach(node=>node.classList.add('is-kept'));target.classList.add('is-selected');}

  function installInteractions(svg){
    if(svg.dataset.liveInteractionReady==='true')return;
    svg.dataset.liveInteractionReady='true';
    svg.addEventListener('pointerover',event=>{const target=event.target.closest?.('[data-focusable-piece]');if(!target||!svg.contains(target))return;clearHover(svg);relatedSet(svg,target).forEach(node=>node.classList.add('is-hovered'));},true);
    svg.addEventListener('pointerout',event=>{const from=event.target.closest?.('[data-focusable-piece]'),to=event.relatedTarget?.closest?.('[data-focusable-piece]');if(from&&from===to)return;clearHover(svg);},true);
    svg.addEventListener('click',event=>{const target=event.target.closest?.('[data-interactive]');if(!target||!svg.contains(target)){clearIsolation(svg);return;}event.preventDefault();applyIsolation(svg,target);},true);
    svg.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const target=event.target.closest?.('[data-interactive]');if(!target)return;event.preventDefault();applyIsolation(svg,target);},true);
  }

  function ensureStyle(){
    if(document.getElementById('sky-chart-next-live-interactions-style'))return;
    const style=document.createElement('style');style.id='sky-chart-next-live-interactions-style';style.textContent=`
      .scn-live-wheel [data-focusable-piece]{cursor:pointer;transition:opacity .16s ease,filter .16s ease,stroke-width .16s ease}
      .scn-live-wheel [data-interactive="aspect"]{pointer-events:stroke}
      .scn-live-wheel [data-interactive="placement"],.scn-live-wheel [data-interactive="house"],.scn-live-wheel [data-interactive="sign"]{pointer-events:all}
      .scn-live-wheel [data-focusable-piece].is-hovered{opacity:1!important;filter:drop-shadow(0 0 7px rgba(0,0,0,.38))}
      .scn-live-wheel [data-interactive="aspect"].is-hovered{stroke-width:4!important}
      .scn-live-wheel.has-isolation [data-focusable-piece]{opacity:.1}
      .scn-live-wheel.has-isolation [data-focusable-piece].is-kept{opacity:1}
      .scn-live-wheel .is-selected{filter:drop-shadow(0 0 8px rgba(0,0,0,.48))}
    `;document.head.appendChild(style);
  }

  function enhance(svg){
    if(!svg||!svg.matches('.scn-live-wheel[data-ready="true"]'))return;
    ensureStyle();
    annotateBand(svg.querySelector('[data-layer="sky-a-houses"]'),'house','A');
    annotateBand(svg.querySelector('[data-layer="sky-b-houses"]'),'house','B');
    annotateBand(svg.querySelector('[data-layer="fixed-zodiac"]'),'sign','');
    annotatePlacements(svg);
    drawAspects(svg);
    installInteractions(svg);
  }

  window.addEventListener('relphi:sky-chart-next-display-ready',event=>enhance(event.detail?.svg));
  function activateExisting(){enhance(document.querySelector('.unified-sky-wheel > .scn-live-wheel[data-ready="true"]'));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',activateExisting,{once:true});else activateExisting();
})();