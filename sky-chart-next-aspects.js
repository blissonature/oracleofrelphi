(function(){
  'use strict';
  if(window.__skyChartNextCombinedAspectsInstalled)return;
  window.__skyChartNextCombinedAspectsInstalled=true;

  const NS='http://www.w3.org/2000/svg';
  const CENTER={x:600,y:600};
  const ASPECT_RADIUS=145;
  const MAX_ORB=3;
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

  function drawCombinedSpace(svg){
    const existing=svg.querySelector('[data-layer="combinedAspects"]');
    if(existing)existing.remove();

    const group=svgEl('g');
    group.dataset.layer='combinedAspects';
    group.setAttribute('aria-label','Major cross-sky aspects in one combined central space');

    const chamber=svgEl('circle');
    chamber.setAttribute('cx',String(CENTER.x));
    chamber.setAttribute('cy',String(CENTER.y));
    chamber.setAttribute('r',String(ASPECT_RADIUS));
    chamber.setAttribute('fill','rgba(255,253,248,.22)');
    chamber.setAttribute('stroke','rgba(23,23,23,.18)');
    chamber.setAttribute('stroke-width','1.4');
    chamber.setAttribute('vector-effect','non-scaling-stroke');
    group.appendChild(chamber);

    relationships(svg).forEach(relation=>{
      const from=polar(ASPECT_RADIUS,relation.a.longitude);
      const to=polar(ASPECT_RADIUS,relation.b.longitude);
      const line=svgEl('line');
      line.setAttribute('x1',String(from.x));
      line.setAttribute('y1',String(from.y));
      line.setAttribute('x2',String(to.x));
      line.setAttribute('y2',String(to.y));
      line.setAttribute('stroke',relation.aspect.color);
      line.setAttribute('stroke-width','2.15');
      line.setAttribute('stroke-linecap','round');
      line.setAttribute('opacity','.68');
      line.setAttribute('vector-effect','non-scaling-stroke');
      line.dataset.interactive='aspect';
      line.dataset.aspect=relation.aspect.id;
      line.dataset.skyAPlacement=relation.a.id;
      line.dataset.skyBPlacement=relation.b.id;
      line.dataset.orb=relation.orb.toFixed(2);
      const title=svgEl('title');
      title.textContent=`Sky A ${relation.a.id} ${relation.aspect.id} Sky B ${relation.b.id} · orb ${relation.orb.toFixed(2)}°`;
      line.appendChild(title);
      group.appendChild(line);
    });

    const glyphLayer=svg.querySelector('[data-layer="glyphs"]');
    if(glyphLayer)svg.insertBefore(group,glyphLayer);
    else svg.appendChild(group);
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
