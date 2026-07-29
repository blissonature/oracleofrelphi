(function(){
  'use strict';
  if(window.SkyChartNextGlyphs)return;
  const NS='http://www.w3.org/2000/svg';
  const entries={
    sun:['Sun','assets/planet-glyphs/sun.svg',1,0,0],moon:['Moon','assets/planet-glyphs/moon.svg',1.083,2.7,1],mercury:['Mercury','assets/planet-glyphs/mercury.svg',1,0,0],venus:['Venus','assets/planet-glyphs/venus.svg',1,0,0],mars:['Mars','assets/planet-glyphs/mars.svg',1,-.95,.9],jupiter:['Jupiter','assets/planet-glyphs/jupiter.svg',1,0,0],saturn:['Saturn','assets/planet-glyphs/saturn.svg',1,0,0],uranus:['Uranus','assets/planet-glyphs/uranus.svg',1,.05,.8],neptune:['Neptune','assets/planet-glyphs/neptune.svg',1,0,1.3],pluto:['Pluto','assets/planet-glyphs/pluto.svg',1,0,0],lilith:['Lilith','assets/planet-glyphs/lilith.svg',1.05,0,0],
    aries:['Aries','assets/zodiac-glyphs/aries.svg',1,0,.9],taurus:['Taurus','assets/zodiac-glyphs/taurus.svg',1,0,.9],gemini:['Gemini','assets/zodiac-glyphs/gemini.svg',.95,0,0],cancer:['Cancer','assets/zodiac-glyphs/cancer.svg',1,0,0],leo:['Leo','assets/zodiac-glyphs/leo.svg',1,0,-.9],virgo:['Virgo','assets/zodiac-glyphs/virgo.svg',1,0,.45],libra:['Libra','assets/zodiac-glyphs/libra.svg',1,0,-.9],scorpio:['Scorpio','assets/zodiac-glyphs/scorpio.svg',1,0,.45],sagittarius:['Sagittarius','assets/zodiac-glyphs/sagittarius.svg',.95,0,0],capricorn:['Capricorn','assets/zodiac-glyphs/capricorn.svg',1,0,.9],aquarius:['Aquarius','assets/zodiac-glyphs/aquarius.svg',1,0,0],pisces:['Pisces','assets/zodiac-glyphs/pisces.svg',1,0,0]
  };
  const cache=new Map();
  const svg=name=>document.createElementNS(NS,name);
  async function source(path){
    if(cache.has(path))return cache.get(path).cloneNode(true);
    const response=await fetch(path);
    if(!response.ok)throw new Error('Canonical glyph asset unavailable: '+path);
    const node=new DOMParser().parseFromString(await response.text(),'image/svg+xml').documentElement;
    cache.set(path,node);
    return node.cloneNode(true);
  }
  function recolor(root,color){
    root.querySelectorAll('*').forEach(node=>{
      const fill=node.getAttribute('fill');const stroke=node.getAttribute('stroke');
      if(fill&&fill!=='none')node.setAttribute('fill',color);
      if(stroke&&stroke!=='none')node.setAttribute('stroke',color);
    });
  }
  async function draw(parent,id,{radius=18,color='#171717'}={}){
    const entry=entries[id];if(!entry)throw new Error('Unknown canonical glyph: '+id);
    const [,path,scale=1,dx=0,dy=0]=entry;
    const imported=await source(path);const art=svg('g');
    Array.from(imported.children).forEach(child=>art.appendChild(document.importNode(child,true)));
    parent.appendChild(art);recolor(art,color);
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const box=art.getBBox();
    if(!box.width||!box.height)throw new Error('Empty canonical glyph: '+id);
    const fit=(radius*1.72)/Math.max(box.width,box.height)*scale;
    const cx=box.x+box.width/2,cy=box.y+box.height/2;
    art.setAttribute('transform',`translate(${dx} ${dy}) scale(${fit}) translate(${-cx} ${-cy})`);
    art.dataset.canonicalGlyph=id;
    return art;
  }
  async function bubble(parent,id,{radius=19,color='#c9211e',fill='#fffdf8',strokeWidth=2.35}={}){
    const group=svg('g');group.dataset.canonicalBubble=id;
    const circle=svg('circle');circle.setAttribute('r',radius);circle.setAttribute('fill',fill);circle.setAttribute('stroke',color);circle.setAttribute('stroke-width',strokeWidth);
    group.appendChild(circle);parent.appendChild(group);await draw(group,id,{radius:radius-2.5,color});return group;
  }
  window.SkyChartNextGlyphs=Object.freeze({draw,bubble,entries});
})();
