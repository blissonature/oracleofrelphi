(function(){
  'use strict';
  if(window.__skyChartNextCombinedAspectsInstalled)return;
  window.__skyChartNextCombinedAspectsInstalled=true;

  const NS='http://www.w3.org/2000/svg';
  const CENTER={x:600,y:600};
  const ASPECT_RADIUS=165;
  const MAX_ORB=3;
  const ASPECT_TICK={one:4,five:7,ten:10};
  const ASPECTS=[
    {id:'conjunction',angle:0,color:'#e53935'},
    {id:'sextile',angle:60,color:'#f1dc43'},
    {id:'square',angle:90,color:'#43a85b'},
    {id:'trine',angle:120,color:'#2ca69b'},
    {id:'opposition',angle:180,color:'#5961c8'}
  ];

  const svgEl=name=>document.createElementNS(NS,name);
  const polar=(radius,degree)=>{
    const angle=(degree-180)*Math.PI/180;
    return{x:CENTER.x+radius*Math.cos(angle),y:CENTER.y+radius*Math.sin(angle)};
  };
  const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
  const signIndex=longitude=>Math.floor(((longitude%360)+360)%360/30);

  function placementData(svg,sky){
    return Array.from(svg.querySelectorAll(`[data-interactive="placement"][data-sky="${sky}"]`)).map(node=>({
      id:node.dataset.placement,
      longitude:Number(node.dataset.longitude)
    })).filter(item=>Number.isFinite(item.longitude));
  }

  function relationships(svg){
    const skyA=placementData(svg,'A');
    const skyB=placementData(svg,'B');
    const result=[];
    skyA.forEach(a=>skyB.forEach(b=>{
      const distance=separation(a.longitude,b.longitude);
      ASPECTS.forEach(aspect=>{
        const orb=Math.abs(distance-aspect.angle);
        if(orb<=MAX_ORB)result.push({a,b,aspect,orb});
      });
    }));
    return result.sort((left,right)=>left.orb-right.orb||left.aspect.angle-right.aspect.angle||left.a.longitude-right.a.longitude);
  }

  function annotateExistingPieces(svg){
    const annotateHouseLayer=(layerName,sky)=>{
      const layer=svg.querySelector(`[data-layer="${layerName}"]`);
      if(!layer)return;
      for(let house=1;house<=12;house++){
        Array.from(layer.children).slice((house-1)*3,house*3).forEach(node=>{
          node.dataset.focusablePiece='house';
          node.dataset.sky=sky;
          node.dataset.house=String(house);
        });
      }
    };
    annotateHouseLayer('aHouses','A');
    annotateHouseLayer('bHouses','B');

    const zodiac=svg.querySelector('[data-layer="zodiac"]');
    if(zodiac){
      for(let sign=0;sign<12;sign++){
        Array.from(zodiac.children).slice(sign*3,sign*3+3).forEach(node=>{
          node.dataset.focusablePiece='sign';
          node.dataset.signIndex=String(sign);
        });
      }
    }

    const placements=Array.from(svg.querySelectorAll('[data-interactive="placement"]'));
    const leaders=Array.from(svg.querySelectorAll('[data-layer="leaders"] .placement-leader'));
    placements.forEach((node,index)=>{
      node.dataset.focusablePiece='placement';
      const leader=leaders[index];
      if(!leader)return;
      leader.dataset.focusablePiece='placement-leader';
      leader.dataset.sky=node.dataset.sky;
      leader.dataset.placement=node.dataset.placement;
      leader.dataset.longitude=node.dataset.longitude;
    });
  }

  function drawAspectTicks(group){
    const tickGroup=svgEl('g');
    tickGroup.dataset.layer='combinedAspectTicks';
    tickGroup.setAttribute('aria-hidden','true');
    for(let degree=0;degree<360;degree++){
      let length=ASPECT_TICK.one,tickClass='combined-aspect-tick combined-aspect-tick-one';
      if(degree%10===0){length=ASPECT_TICK.ten;tickClass='combined-aspect-tick combined-aspect-tick-ten';}
      else if(degree%5===0){length=ASPECT_TICK.five;tickClass='combined-aspect-tick combined-aspect-tick-five';}
      const outer=polar(ASPECT_RADIUS,degree);
      const inner=polar(ASPECT_RADIUS-length,degree);
      const tick=svgEl('line');
      tick.setAttribute('x1',String(outer.x));tick.setAttribute('y1',String(outer.y));
      tick.setAttribute('x2',String(inner.x));tick.setAttribute('y2',String(inner.y));
      tick.setAttribute('class',tickClass);
      tickGroup.appendChild(tick);
    }
    group.appendChild(tickGroup);
  }

  function drawCombinedSpace(svg){
    const existing=svg.querySelector('[data-layer="combinedAspects"]');
    if(existing)existing.remove();
    annotateExistingPieces(svg);

    const group=svgEl('g');
    group.dataset.layer='combinedAspects';
    group.setAttribute('aria-label','Major cross-sky aspects in one combined central space');

    const chamber=svgEl('circle');
    chamber.setAttribute('cx',String(CENTER.x));
    chamber.setAttribute('cy',String(CENTER.y));
    chamber.setAttribute('r',String(ASPECT_RADIUS));
    chamber.setAttribute('fill','rgba(255,253,248,.08)');
    chamber.setAttribute('stroke','rgba(23,23,23,.24)');
    chamber.setAttribute('stroke-width','1.4');
    chamber.setAttribute('vector-effect','non-scaling-stroke');
    chamber.dataset.clearFocus='true';
    group.appendChild(chamber);

    relationships(svg).forEach((relation,index)=>{
      const from=polar(ASPECT_RADIUS,relation.a.longitude);
      const to=polar(ASPECT_RADIUS,relation.b.longitude);
      const line=svgEl('line');
      line.setAttribute('x1',String(from.x));line.setAttribute('y1',String(from.y));
      line.setAttribute('x2',String(to.x));line.setAttribute('y2',String(to.y));
      line.setAttribute('stroke',relation.aspect.color);
      line.setAttribute('stroke-width','2.15');
      line.setAttribute('stroke-linecap','round');
      line.setAttribute('opacity','.68');
      line.setAttribute('vector-effect','non-scaling-stroke');
      line.dataset.interactive='aspect';
      line.dataset.focusablePiece='aspect';
      line.dataset.aspectIndex=String(index);
      line.dataset.aspect=relation.aspect.id;
      line.dataset.skyAPlacement=relation.a.id;
      line.dataset.skyBPlacement=relation.b.id;
      line.dataset.orb=relation.orb.toFixed(2);
      const title=svgEl('title');
      title.textContent=`Sky A ${relation.a.id} ${relation.aspect.id} Sky B ${relation.b.id} · orb ${relation.orb.toFixed(2)}°`;
      line.appendChild(title);
      group.appendChild(line);
    });

    drawAspectTicks(group);

    const glyphLayer=svg.querySelector('[data-layer="glyphs"]');
    if(glyphLayer)svg.insertBefore(group,glyphLayer);
    else svg.appendChild(group);
    installInteractions(svg);
  }

  function allFocusable(svg){return Array.from(svg.querySelectorAll('[data-focusable-piece]'));}
  function placementNode(svg,sky,id){return svg.querySelector(`[data-interactive="placement"][data-sky="${sky}"][data-placement="${id}"]`);}
  function placementLeader(svg,sky,id){return svg.querySelector(`[data-focusable-piece="placement-leader"][data-sky="${sky}"][data-placement="${id}"]`);}
  function addPlacementPair(set,svg,sky,id){
    const node=placementNode(svg,sky,id),leader=placementLeader(svg,sky,id);
    if(node)set.add(node);if(leader)set.add(leader);
  }

  function relatedSet(svg,target,mode){
    const keep=new Set();
    const type=target.dataset.interactive||target.dataset.focusablePiece;
    if(type==='sign'){
      const sign=Number(target.dataset.signIndex);
      svg.querySelectorAll(`[data-focusable-piece="sign"][data-sign-index="${sign}"]`).forEach(node=>keep.add(node));
      svg.querySelectorAll('[data-interactive="placement"]').forEach(node=>{
        if(signIndex(Number(node.dataset.longitude))===sign)addPlacementPair(keep,svg,node.dataset.sky,node.dataset.placement);
      });
    }else if(type==='house'){
      const sky=target.dataset.sky,house=target.dataset.house;
      svg.querySelectorAll(`[data-focusable-piece="house"][data-sky="${sky}"][data-house="${house}"]`).forEach(node=>keep.add(node));
      svg.querySelectorAll(`[data-interactive="placement"][data-sky="${sky}"][data-house="${house}"]`).forEach(node=>addPlacementPair(keep,svg,sky,node.dataset.placement));
    }else if(type==='placement'){
      const sky=target.dataset.sky,id=target.dataset.placement;
      addPlacementPair(keep,svg,sky,id);
      svg.querySelectorAll('[data-interactive="aspect"]').forEach(line=>{
        const connected=sky==='A'?line.dataset.skyAPlacement===id:line.dataset.skyBPlacement===id;
        if(!connected)return;
        keep.add(line);
        addPlacementPair(keep,svg,'A',line.dataset.skyAPlacement);
        addPlacementPair(keep,svg,'B',line.dataset.skyBPlacement);
      });
    }else if(type==='aspect'){
      keep.add(target);
      addPlacementPair(keep,svg,'A',target.dataset.skyAPlacement);
      addPlacementPair(keep,svg,'B',target.dataset.skyBPlacement);
    }else if(type==='placement-leader'){
      addPlacementPair(keep,svg,target.dataset.sky,target.dataset.placement);
    }
    if(mode==='hover'&&keep.size===0)keep.add(target);
    return keep;
  }

  function clearHover(svg){svg.querySelectorAll('.is-hovered').forEach(node=>node.classList.remove('is-hovered'));}
  function clearIsolation(svg){
    svg.classList.remove('has-isolation');
    svg.querySelectorAll('.is-kept,.is-selected,.is-dim').forEach(node=>node.classList.remove('is-kept','is-selected','is-dim'));
  }
  function applyIsolation(svg,target){
    clearIsolation(svg);
    const keep=relatedSet(svg,target,'click');
    if(!keep.size)return;
    svg.classList.add('has-isolation');
    keep.forEach(node=>node.classList.add('is-kept'));
    target.classList.add('is-selected');
  }

  function updateInspector(target){
    const inspector=document.getElementById('inspector');
    if(!inspector)return;
    const type=target.dataset.interactive;
    if(type==='aspect')inspector.innerHTML=`<p class="scn-eyebrow">Aspect relationship</p><h2>${target.dataset.aspect}</h2><p>Sky A ${target.dataset.skyAPlacement} to Sky B ${target.dataset.skyBPlacement} · orb ${target.dataset.orb}°</p>`;
    else if(type==='placement')inspector.innerHTML=`<p class="scn-eyebrow">Placement focus</p><h2>Sky ${target.dataset.sky} · ${target.dataset.placement}</h2><p>Only this placement, its connected aspect lines, and their counterpart placements remain emphasized.</p>`;
    else if(type==='sign')inspector.innerHTML=`<p class="scn-eyebrow">Sign focus</p><h2>Selected sign</h2><p>The sign and every placement within its 30° span remain emphasized.</p>`;
    else if(type==='house')inspector.innerHTML=`<p class="scn-eyebrow">House focus</p><h2>Sky ${target.dataset.sky} · House ${target.dataset.house}</h2><p>Only this house and the placements from the same sky within it remain emphasized.</p>`;
  }

  function installInteractions(svg){
    if(svg.dataset.combinedInteractionReady==='true')return;
    svg.dataset.combinedInteractionReady='true';

    svg.addEventListener('pointerover',event=>{
      const target=event.target.closest('[data-focusable-piece]');
      if(!target||!svg.contains(target))return;
      clearHover(svg);
      relatedSet(svg,target,'hover').forEach(node=>node.classList.add('is-hovered'));
    },true);
    svg.addEventListener('pointerout',event=>{
      if(event.relatedTarget&&svg.contains(event.relatedTarget)&&event.relatedTarget.closest('[data-focusable-piece]')===event.target.closest('[data-focusable-piece]'))return;
      clearHover(svg);
    },true);

    svg.addEventListener('click',event=>{
      const target=event.target.closest('[data-interactive]');
      event.stopImmediatePropagation();
      if(!target||!svg.contains(target)){
        clearIsolation(svg);
        return;
      }
      applyIsolation(svg,target);
      updateInspector(target);
    },true);
  }

  function refresh(){
    const svg=document.querySelector('#wheelMount svg.scn-wheel');
    if(svg)drawCombinedSpace(svg);
  }

  const mount=document.getElementById('wheelMount');
  if(mount)new MutationObserver(refresh).observe(mount,{childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
})();