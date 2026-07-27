// Reusable copy of the living heptagram renderer from planetaryhours.html.
// Keeps the source geometry, week/day/hour layers, colors, and progression model.
(function () {
  'use strict';
  if (window.RelphiPlanetaryHoursHeptagram) return;

  const NS = 'http://www.w3.org/2000/svg';
  const CHALDEAN = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const WEEK_PATH = ['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
  const PLANETS = {
    saturn:{name:'Saturn',sym:'♄'}, jupiter:{name:'Jupiter',sym:'♃'}, mars:{name:'Mars',sym:'♂'},
    sun:{name:'Sun',sym:'☉'}, venus:{name:'Venus',sym:'♀'}, mercury:{name:'Mercury',sym:'☿'}, moon:{name:'Moon',sym:'☽'}
  };
  let instanceCount = 0;

  function pointFor(key) {
    const idx = CHALDEAN.indexOf(key);
    const angle = (-90 + idx * (360 / CHALDEAN.length)) * Math.PI / 180;
    return { x:180 + Math.cos(angle) * 118, y:180 + Math.sin(angle) * 118 };
  }
  function labelPointFor(key) {
    const idx = CHALDEAN.indexOf(key);
    const angle = (-90 + idx * (360 / CHALDEAN.length)) * Math.PI / 180;
    const radius = ({saturn:144,jupiter:158,mars:160,sun:154,venus:154,mercury:170,moon:154})[key] || 154;
    return { x:180 + Math.cos(angle) * radius, y:180 + Math.sin(angle) * radius };
  }
  function svgNode(name, attrs) {
    const node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
    return node;
  }
  function line(aKey, bKey, className, fraction) {
    const a = pointFor(aKey), b = pointFor(bKey);
    const t = fraction == null ? 1 : Math.max(0, Math.min(1, Number(fraction) || 0));
    return svgNode('line', {
      class:className,
      x1:a.x.toFixed(2), y1:a.y.toFixed(2),
      x2:(a.x + (b.x-a.x)*t).toFixed(2), y2:(a.y + (b.y-a.y)*t).toFixed(2)
    });
  }
  function rulerRing(host, radius, word, id) {
    host.appendChild(svgNode('circle',{class:'relphi-phc-ruler-ring',cx:0,cy:0,r:radius}));
    const textRadius = radius - 4.5;
    host.appendChild(svgNode('path',{id:id,class:'relphi-phc-ring-text-path',d:'M '+(-textRadius)+' 0 A '+textRadius+' '+textRadius+' 0 0 0 '+textRadius+' 0',fill:'none'}));
    const text = svgNode('text',{class:'relphi-phc-ring-word'});
    const path = svgNode('textPath',{href:'#'+id,startOffset:'50%','text-anchor':'middle'});
    path.textContent = word;
    text.appendChild(path);
    host.appendChild(text);
  }
  function ensureStyles() {
    if (document.getElementById('relphi-phc-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-phc-style';
    style.textContent = `
      .relphi-phc{--relphi-red:#dc1f18;--relphi-line:rgba(220,31,24,.16);--saturn:#8c7a42;--jupiter:#41752f;--mars:#dc1f18;--sun:#d08a00;--venus:#b23b79;--mercury:#277390;--moon:#58628a;display:block;width:100%;height:auto;overflow:visible}
      .relphi-phc-circle{fill:none;stroke:rgba(220,31,24,.28);stroke-width:1.2}.relphi-phc-guide{fill:none;stroke:rgba(220,31,24,.14);stroke-width:1;stroke-dasharray:3 4}
      .relphi-phc-star.past{stroke:var(--relphi-red);stroke-width:3.1;opacity:.92}.relphi-phc-star.future{stroke:rgba(220,31,24,.16);stroke-width:2}.relphi-phc-star.current{stroke:var(--relphi-red);stroke-width:4;filter:drop-shadow(0 0 6px rgba(220,31,24,.42))}
      .relphi-phc-hour.past{stroke:rgba(220,31,24,.58);stroke-width:1.65}.relphi-phc-hour.future{stroke:rgba(220,31,24,.10);stroke-width:1.2}.relphi-phc-hour.current{stroke:var(--relphi-red);stroke-width:3;filter:drop-shadow(0 0 5px rgba(220,31,24,.34))}
      .relphi-phc-star,.relphi-phc-hour{fill:none;stroke-linecap:round;stroke-linejoin:round}
      .relphi-phc-node{fill:#fff;stroke:currentColor;stroke-width:2}.relphi-phc-node.current{filter:drop-shadow(0 0 9px currentColor)}.relphi-phc-node.day-ruler{filter:drop-shadow(0 0 12px rgba(220,31,24,.42))}.relphi-phc-node.week-complete{filter:drop-shadow(0 0 6px rgba(220,31,24,.28))}
      .relphi-phc .p-saturn{color:var(--saturn)}.relphi-phc .p-jupiter{color:var(--jupiter)}.relphi-phc .p-mars{color:var(--mars)}.relphi-phc .p-sun{color:var(--sun)}.relphi-phc .p-venus{color:var(--venus)}.relphi-phc .p-mercury{color:var(--mercury)}.relphi-phc .p-moon{color:var(--moon)}
      .relphi-phc-glyph{font:900 28px/1 "Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","Arial Unicode MS",sans-serif;fill:currentColor;paint-order:stroke;stroke:currentColor;stroke-width:.65px}
      .relphi-phc-label{font:800 12px/1 system-ui,sans-serif;fill:currentColor;paint-order:stroke;stroke:rgba(255,250,240,.78);stroke-width:3px}
      .relphi-phc-ruler-ring{fill:none;stroke:currentColor;stroke-width:1.8;vector-effect:non-scaling-stroke}.relphi-phc-ring-text-path{stroke:none}.relphi-phc-ring-word{fill:currentColor;font:900 6.5px/1 system-ui,sans-serif;letter-spacing:1.1px}
      @media(prefers-reduced-motion:no-preference){.relphi-phc-star.current{animation:relphiPhcTrace 1.8s ease-in-out infinite alternate}}@keyframes relphiPhcTrace{from{filter:drop-shadow(0 0 3px rgba(220,31,24,.28));opacity:.82}to{filter:drop-shadow(0 0 13px rgba(220,31,24,.62));opacity:1}}
    `;
    document.head.appendChild(style);
  }

  function render(target, options) {
    ensureStyles();
    if (!target) throw new Error('A target SVG is required.');
    const opts = options || {};
    const dayKey = CHALDEAN.includes(opts.dayRuler) ? opts.dayRuler : 'sun';
    const sequence24 = Array.isArray(opts.sequence24) && opts.sequence24.length >= 24 ? opts.sequence24.slice(0,24) : Array.from({length:24},function(_,i){return CHALDEAN[(CHALDEAN.indexOf(dayKey)+i)%7];});
    const selectedPosition = Math.max(1, Math.min(24, Number(opts.selectedPosition) || 1));
    const selectedHour = Math.max(1, Math.min(24, Math.floor(selectedPosition)));
    const hourFraction = selectedPosition >= 24 ? 1 : Math.max(0, Math.min(.999, selectedPosition-selectedHour));
    const currentKey = sequence24[selectedHour-1] || dayKey;
    const weekIndex = Math.max(0, WEEK_PATH.indexOf(dayKey));
    const dayFraction = selectedPosition >= 24 ? 1 : Math.max(0, Math.min(1,(selectedPosition-1)/23));
    const idBase = 'relphiPhc'+(++instanceCount)+'-';

    target.setAttribute('viewBox','0 0 360 360');
    target.classList.add('relphi-phc');
    target.replaceChildren();
    target.appendChild(svgNode('circle',{class:'relphi-phc-circle',cx:180,cy:180,r:118}));
    target.appendChild(svgNode('circle',{class:'relphi-phc-guide',cx:180,cy:180,r:78}));

    for (let i=0;i<7;i++) {
      const a=WEEK_PATH[i], b=WEEK_PATH[i+1];
      if (i<weekIndex) target.appendChild(line(a,b,'relphi-phc-star past'));
      else if (i===weekIndex) { target.appendChild(line(a,b,'relphi-phc-star future')); target.appendChild(line(a,b,'relphi-phc-star current',dayFraction)); }
      else target.appendChild(line(a,b,'relphi-phc-star future'));
    }
    const currentSegment = Math.max(0,selectedHour-1);
    for (let i=0;i<23;i++) {
      if (i<currentSegment) target.appendChild(line(sequence24[i],sequence24[i+1],'relphi-phc-hour past'));
      else if (i===currentSegment) { target.appendChild(line(sequence24[i],sequence24[i+1],'relphi-phc-hour future')); target.appendChild(line(sequence24[i],sequence24[i+1],'relphi-phc-hour current',hourFraction)); }
      else target.appendChild(line(sequence24[i],sequence24[i+1],'relphi-phc-hour future'));
    }

    const ready=[];
    CHALDEAN.forEach(function (key) {
      const p=pointFor(key), lp=labelPointFor(key), planet=PLANETS[key];
      const host=svgNode('g',{class:'p-'+key,'data-planet':key,transform:'translate('+p.x.toFixed(2)+' '+p.y.toFixed(2)+')'});
      const node=svgNode('circle',{class:'relphi-phc-node'+(key===currentKey?' current':'')+(key===dayKey?' day-ruler':'')+(WEEK_PATH.slice(0,weekIndex+1).includes(key)?' week-complete':''),cx:0,cy:0,r:18});
      host.appendChild(node);
      if (opts.glyphComponent && typeof opts.glyphComponent.createBubble === 'function') {
        node.remove();
        const bubble=opts.glyphComponent.createBubble(host,key,{radius:18,padding:1,color:'currentColor',fill:'#fff',strokeWidth:2.35});
        if (bubble && bubble.ready) ready.push(bubble.ready);
      } else {
        const glyph=svgNode('text',{class:'relphi-phc-glyph',x:0,y:9,'text-anchor':'middle'}); glyph.textContent=planet.sym; host.appendChild(glyph);
      }
      if (opts.showRulerRings !== false && key===dayKey) rulerRing(host,31,'DAY',idBase+'day-'+key);
      if (opts.showRulerRings !== false && key===currentKey) rulerRing(host,24,'HOUR',idBase+'hour-'+key);
      target.appendChild(host);
      if (opts.showLabels !== false) { const label=svgNode('text',{class:'relphi-phc-label p-'+key,x:lp.x.toFixed(2),y:lp.y.toFixed(2),'text-anchor':'middle'}); label.textContent=planet.name; target.appendChild(label); }
    });
    return {ready:Promise.allSettled(ready),dayRuler:dayKey,hourRuler:currentKey,selectedHour:selectedHour,hourFraction:hourFraction,dayFraction:dayFraction};
  }

  window.RelphiPlanetaryHoursHeptagram = { render:render, chaldean:CHALDEAN.slice(), weekPath:WEEK_PATH.slice() };
})();