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
  function parseViewBox(root,path){
    const raw=String(root.getAttribute('viewBox')||'').trim();
    const values=raw.split(/[ ,]+/).map(Number);
    if(values.length===4&&values.every(Number.isFinite)&&values[2]>0&&values[3]>0){
      return{x:values[0],y:values[1],width:values[2],height:values[3]};
    }
    const width=parseFloat(root.getAttribute('width'));
    const height=parseFloat(root.getAttribute('height'));
    if(Number.isFinite(width)&&width>0&&Number.isFinite(height)&&height>0){
      return{x:0,y:0,width,height};
    }
    throw new Error('Canonical glyph has no usable viewBox: '+path);
  }
  async function source(path){
    if(cache.has(path)){
      const cached=cache.get(path);
      return{root:cached.root.cloneNode(true),box:{...cached.box}};
    }
    const response=await fetch(path);
    if(!response.ok)throw new Error('Canonical glyph asset unavailable: '+path);
    const root=new DOMParser().parseFromString(await response.text(),'image/svg+xml').documentElement;
    if(!root||String(root.nodeName).toLowerCase()==='parsererror')throw new Error('Canonical glyph asset could not be parsed: '+path);
    const box=parseViewBox(root,path);
    cache.set(path,{root:root.cloneNode(true),box});
    return{root,box:{...box}};
  }
  function recolor(root,color){
    [root,...root.querySelectorAll('*')].forEach(node=>{
      if(!node.getAttribute)return;
      const fill=node.getAttribute('fill');const stroke=node.getAttribute('stroke');
      if(fill&&fill!=='none')node.setAttribute('fill',color);
      if(stroke&&stroke!=='none')node.setAttribute('stroke',color);
      if(node.style){
        if(node.style.fill&&node.style.fill!=='none')node.style.fill=color;
        if(node.style.stroke&&node.style.stroke!=='none')node.style.stroke=color;
      }
    });
  }
  async function draw(parent,id,{radius=18,color='#171717'}={}){
    const entry=entries[id];if(!entry)throw new Error('Unknown canonical glyph: '+id);
    const [,path,scale=1,dx=0,dy=0]=entry;
    const loaded=await source(path);const art=svg('g');
    Array.from(loaded.root.children).forEach(child=>art.appendChild(document.importNode(child,true)));
    if(!art.childNodes.length)throw new Error('Empty canonical glyph asset: '+id);
    parent.appendChild(art);recolor(art,color);
    const box=loaded.box;
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