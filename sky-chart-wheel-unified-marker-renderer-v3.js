// Sky Chart preview: single grouped marker renderer with native vector special points.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const SVG_SELECTOR = '.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg';
  const OUTWARD_DISTANCE = 58;
  const MIN_CENTER_GAP = 43;
  const MAX_TANGENTIAL = 84;
  const BUBBLE_RADIUS = 17.5;

  const GLYPHS = {
    SUN:'☉', MOON:'☽', MERCURY:'☿', VENUS:'♀', MARS:'♂', JUPITER:'♃', SATURN:'♄',
    URANUS:'♅', NEPTUNE:'♆', PLUTO:'PLUTO_VECTOR',
    NO:'☊', NODE:'☊', 'NORTH NODE':'☊', 'TRUE NODE':'☊', 'MEAN NODE':'☊',
    SO:'☋', 'SOUTH NODE':'☋',
    PA:'FORTUNE_VECTOR', POF:'FORTUNE_VECTOR', FORTUNE:'FORTUNE_VECTOR',
    'PART OF FORTUNE':'FORTUNE_VECTOR', 'HEART OF FORTUNE':'FORTUNE_VECTOR',
    LILITH:'⚸', 'BLACK MOON LILITH':'⚸',
    DS:'DSC', DSC:'DSC', DESCENDANT:'DSC', V:'Vx', VX:'Vx', VERTEX:'Vx',
    AC:'ASC', ASC:'ASC', RISING:'ASC', ASCENDANT:'ASC',
    MC:'MC', MIDHEAVEN:'MC', IC:'IC', IMUMCOELI:'IC', 'IMUM COELI':'IC'
  };

  const PROFILES = {
    '☉':{size:28.5,weight:500,offset:[0,1.2]}, '☽':{size:28.5,weight:600,offset:[0.3,0]},
    '☿':{size:28,weight:500,offset:[0,0.3]}, '♀':{size:25,weight:400,offset:[0,0.1]},
    '♂':{size:25,weight:400,offset:[-0.2,0.05]}, '♃':{size:28,weight:500,offset:[1,0]},
    '♄':{size:28,weight:500,offset:[0.1,0.15]}, '♅':{size:29.5,weight:500,offset:[0,0.2]},
    '♆':{size:29.5,weight:450,offset:[0,0.15]}, '☊':{size:27.5,weight:500,offset:[0,-0.4]},
    '☋':{size:27.5,weight:500,offset:[0,0.2]}, '⚸':{size:25.5,weight:400,offset:[0,-0.55]}
  };
  const ANGLES = new Set(['ASC','DSC','MC','IC','VX']);
  const ANGLE_OFFSETS = {ASC:[1,0.2],DSC:[1,0.2],MC:[0,0.2],IC:[0,0.2],VX:[0,0.2]};
  let queued = false;

  function num(value) { const n = Number(value); return Number.isFinite(n) ? n : NaN; }
  function bare(value) { return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim(); }
  function markerColor(group) { return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18'; }
  function rootPoint(node,x,y) { const m=node.getCTM?.(); return m ? new DOMPoint(x,y).matrixTransform(m) : new DOMPoint(x,y); }
  function localPoint(node,p) { const m=node.getCTM?.(); if(!m) return p; try{return p.matrixTransform(m.inverse());}catch(_){return p;} }

  function identity(group, text) {
    const candidates = [
      group.dataset.body, group.dataset.name, group.dataset.placement,
      group.getAttribute('data-body'), group.getAttribute('data-name'),
      group.querySelector('.chart-wheel-marker-name')?.textContent,
      group.getAttribute('aria-label'), text?.textContent
    ];
    for (const candidate of candidates) {
      const value = bare(candidate).toUpperCase();
      if (GLYPHS[value]) return GLYPHS[value];
      const first = value.split(/[·,\s]/)[0];
      if (GLYPHS[first]) return GLYPHS[first];
    }
    return bare(text?.textContent);
  }

  function ensureUnit(group) {
    let unit = group.querySelector(':scope > g.relphi-marker-unit');
    if (!unit) {
      unit = document.createElementNS(NS,'g');
      unit.classList.add('relphi-marker-unit');
      group.appendChild(unit);
    }
    const knob = group.querySelector(':scope > circle.chart-wheel-stick-knob, g.relphi-marker-unit > circle.chart-wheel-stick-knob');
    let text = group.querySelector(':scope > .chart-wheel-marker-glyph, g.relphi-marker-unit > .chart-wheel-marker-glyph');
    if (!text && knob) {
      text = document.createElementNS(NS,'text');
      text.classList.add('chart-wheel-marker-glyph');
    }
    if (knob && knob.parentNode !== unit) unit.appendChild(knob);
    if (text && text.parentNode !== unit) unit.appendChild(text);
    return {unit,knob,text};
  }

  function clearLegacy(group, unit, knob, text) {
    group.querySelectorAll('svg.relphi-bold-inline-glyph,svg.relphi-colored-glyph,image.relphi-bubble-glyph-image').forEach(n=>n.remove());
    group.classList.remove('has-preview-inline-glyph','has-preview-angle-text');
    Array.from(unit.children).forEach(function (child) {
      if (child !== knob && child !== text) child.remove();
    });
  }

  function centerText(node,cx,cy,offset) {
    node.removeAttribute('transform');
    let box; try{box=node.getBBox();}catch(_){return;}
    if (!box || !Number.isFinite(box.width) || !Number.isFinite(box.height)) return;
    const dx=cx-(box.x+box.width/2)+offset[0];
    const dy=cy-(box.y+box.height/2)+offset[1];
    node.setAttribute('transform',`translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
  }

  function vectorGroup(unit, className, cx, cy, color) {
    const g=document.createElementNS(NS,'g');
    g.classList.add(className);
    g.setAttribute('transform',`translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
    g.setAttribute('fill','none');
    g.setAttribute('stroke',color);
    g.setAttribute('color',color);
    g.setAttribute('stroke-linecap','round');
    g.setAttribute('stroke-linejoin','round');
    unit.appendChild(g);
    return g;
  }

  function drawPluto(unit,cx,cy,color) {
    const g=vectorGroup(unit,'relphi-pluto-vector',cx,cy-0.2,color);
    g.setAttribute('stroke-width','1.9');
    g.innerHTML = '<circle cx="0" cy="-7" r="3.2"/><path d="M-8 -1.8 Q0 5.7 8 -1.8"/><path d="M0 3.4 V11 M-5 8 H5"/>';
    g.querySelectorAll('*').forEach(n=>{n.setAttribute('fill','none');n.setAttribute('stroke',color);});
  }

  function drawFortune(unit,cx,cy,color) {
    const g=vectorGroup(unit,'relphi-fortune-vector',cx,cy-0.15,color);
    g.setAttribute('stroke-width','1.85');
    g.innerHTML = '<circle cx="0" cy="0" r="10.8"/><path d="M-7.6 -7.6 L7.6 7.6 M7.6 -7.6 L-7.6 7.6"/>';
    g.querySelectorAll('*').forEach(n=>{n.setAttribute('fill','none');n.setAttribute('stroke',color);});
  }

  function styleMarker(group, unit, knob, text) {
    if (!knob || !text) return false;
    const cx=num(knob.getAttribute('cx')), cy=num(knob.getAttribute('cy'));
    if (![cx,cy].every(Number.isFinite)) return false;
    const value=identity(group,text), color=markerColor(group);
    clearLegacy(group,unit,knob,text);

    text.textContent='';
    text.style.setProperty('display','none','important');
    text.style.setProperty('visibility','hidden','important');

    if (value === 'PLUTO_VECTOR') {
      drawPluto(unit,cx,cy,color);
    } else if (value === 'FORTUNE_VECTOR') {
      drawFortune(unit,cx,cy,color);
    } else {
      text.textContent=value;
      const normalized=value.toUpperCase();
      const angle=ANGLES.has(normalized);
      const profile=PROFILES[value] || (angle ? {size:15.75,weight:650,offset:ANGLE_OFFSETS[normalized]||[0,0.2]} : {size:27,weight:500,offset:[0,0]});
      text.setAttribute('x',cx.toFixed(2)); text.setAttribute('y',cy.toFixed(2));
      text.setAttribute('text-anchor','middle'); text.setAttribute('dominant-baseline','central');
      text.setAttribute('fill',color);
      text.style.setProperty('display','inline','important');
      text.style.setProperty('visibility','visible','important');
      text.style.setProperty('font-family',angle?'system-ui,sans-serif':'Apple Symbols, Segoe UI Symbol, Noto Sans Symbols 2, Noto Sans Symbols, Arial Unicode MS, serif','important');
      text.style.setProperty('font-size',profile.size+'px','important');
      text.style.setProperty('font-weight',String(profile.weight),'important');
      text.style.setProperty('letter-spacing',angle?'-0.35px':'0','important');
      text.style.setProperty('opacity','1','important');
      text.style.removeProperty('stroke'); text.style.removeProperty('stroke-width'); text.style.removeProperty('paint-order');
      centerText(text,cx,cy,profile.offset);
    }

    knob.setAttribute('r',String(BUBBLE_RADIUS));
    knob.style.setProperty('fill','#fff','important');
    knob.style.setProperty('fill-opacity','1','important');
    knob.style.setProperty('stroke',color,'important');
    knob.style.setProperty('opacity','1','important');
    return true;
  }

  function collect(svg) {
    const box=svg.viewBox?.baseVal;
    const center=box&&box.width?{x:box.x+box.width/2,y:box.y+box.height/2}:{x:400,y:400};
    return Array.from(svg.querySelectorAll(PLACEMENT)).map(function(group,index){
      const marker=ensureUnit(group); marker.unit.removeAttribute('transform');
      const contact=group.querySelector('circle.chart-wheel-contact-dot');
      const leader=group.querySelector('line.chart-wheel-stick');
      if(!marker.knob||!marker.text||!contact||!leader||!styleMarker(group,marker.unit,marker.knob,marker.text)) return null;
      const cx=num(marker.knob.getAttribute('cx')),cy=num(marker.knob.getAttribute('cy'));
      const ax=num(contact.getAttribute('cx')),ay=num(contact.getAttribute('cy'));
      if(![cx,cy,ax,ay].every(Number.isFinite)) return null;
      const vx=ax-center.x,vy=ay-center.y,length=Math.hypot(vx,vy)||1;
      return {index,group,unit:marker.unit,contact,leader,original:{x:cx,y:cy},anchor:{x:ax,y:ay},radial:{x:vx/length,y:vy/length},tangent:{x:-vy/length,y:vx/length},offset:0};
    }).filter(Boolean);
  }

  function position(item){return{x:item.anchor.x+item.radial.x*OUTWARD_DISTANCE+item.tangent.x*item.offset,y:item.anchor.y+item.radial.y*OUTWARD_DISTANCE+item.tangent.y*item.offset};}
  function solve(items){
    for(let pass=0;pass<56;pass++){
      let changed=false;
      for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
        const p=position(items[a]),q=position(items[b]),distance=Math.hypot(q.x-p.x,q.y-p.y);
        if(distance>=MIN_CENTER_GAP)continue;
        const cross=items[a].radial.x*items[b].radial.y-items[a].radial.y*items[b].radial.x;
        const direction=Math.sign(cross)||(items[a].index<items[b].index?1:-1);
        const push=Math.min(7,(MIN_CENTER_GAP-distance)*0.64+0.5);
        items[a].offset=Math.max(-MAX_TANGENTIAL,Math.min(MAX_TANGENTIAL,items[a].offset-direction*push/2));
        items[b].offset=Math.max(-MAX_TANGENTIAL,Math.min(MAX_TANGENTIAL,items[b].offset+direction*push/2));
        changed=true;
      }
      if(!changed)break;
    }
  }

  function connect(item){
    const contactRoot=rootPoint(item.contact,item.anchor.x,item.anchor.y);
    const matrix=item.unit.getCTM?.();
    const bubbleRoot=matrix?new DOMPoint(item.original.x,item.original.y).matrixTransform(matrix):new DOMPoint(item.original.x,item.original.y);
    const c=localPoint(item.leader,contactRoot),b=localPoint(item.leader,bubbleRoot);
    const x1=num(item.leader.getAttribute('x1')),y1=num(item.leader.getAttribute('y1')),x2=num(item.leader.getAttribute('x2')),y2=num(item.leader.getAttribute('y2'));
    const p1=rootPoint(item.leader,x1,y1),p2=rootPoint(item.leader,x2,y2);
    const first=Math.hypot(p1.x-contactRoot.x,p1.y-contactRoot.y)<=Math.hypot(p2.x-contactRoot.x,p2.y-contactRoot.y);
    if(first){item.leader.setAttribute('x1',c.x.toFixed(2));item.leader.setAttribute('y1',c.y.toFixed(2));item.leader.setAttribute('x2',b.x.toFixed(2));item.leader.setAttribute('y2',b.y.toFixed(2));}
    else{item.leader.setAttribute('x2',c.x.toFixed(2));item.leader.setAttribute('y2',c.y.toFixed(2));item.leader.setAttribute('x1',b.x.toFixed(2));item.leader.setAttribute('y1',b.y.toFixed(2));}
    item.leader.style.setProperty('opacity','1','important');
  }

  function layout(svg){
    const items=collect(svg); if(!items.length)return; solve(items);
    items.forEach(function(item){const target=position(item);item.unit.setAttribute('transform',`translate(${(target.x-item.original.x).toFixed(2)} ${(target.y-item.original.y).toFixed(2)})`);connect(item);item.group.style.setProperty('opacity','1','important');});
    svg.classList.add('relphi-layout-ready');
  }
  function scan(root){if(root instanceof SVGElement&&root.matches(SVG_SELECTOR))layout(root);root.querySelectorAll?.(SVG_SELECTOR).forEach(layout);}
  function schedule(root){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;scan(root||document);});}
  function install(){
    schedule(document);
    new MutationObserver(function(records){if(records.some(r=>Array.from(r.addedNodes||[]).some(n=>n.nodeType===Node.ELEMENT_NODE&&(n.matches?.(PLACEMENT)||n.querySelector?.(PLACEMENT)||n.matches?.(SVG_SELECTOR)))))schedule(document);}).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('resize',()=>schedule(document),{passive:true});
    window.addEventListener('relphi:sky-builder-v4-loaded',()=>schedule(document));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();