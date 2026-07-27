// Final comparison-wheel overlay: placements inside the sign border, exact-degree leaders, and aspect endpoints on the degree ring.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const WHEELS = '.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  const STRUCTURE = 'relphi-dual-house-rings';
  const ZODIAC = 'relphi-zodiac-structure-ring';
  const OVERLAY = 'relphi-wheel-geometry-v2';
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  let queued = false;
  let applying = false;

  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function placements(payload) { const value = payload && (payload.placements || payload); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function normalize(value) { value %= 360; return value < 0 ? value + 360 : value; }
  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return normalize(Number(item.longitude));
    const sign = SIGNS.findIndex(function (name) { return name.toLowerCase() === String(item.sign || '').trim().toLowerCase(); });
    return sign < 0 ? NaN : sign * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60 + Number(item.second || 0) / 3600;
  }
  function resolveId(value) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.resolve(value) || registry.get(value));
    return entry && entry.id || String(value || '').trim().toLowerCase();
  }
  function mapFor(sky) { return placements(read(KEYS[sky])); }
  function placementFor(id, sky) {
    const map = mapFor(sky);
    const key = Object.keys(map).find(function (name) { return resolveId(name) === id; });
    return key ? map[key] : null;
  }
  function ascLongitude() {
    const map = mapFor('skyA');
    const key = Object.keys(map).find(function (name) { const id = resolveId(name); return id === 'asc' || /^(rising|ascendant|asc|ac)$/i.test(name); });
    return key ? longitude(map[key]) : NaN;
  }
  function point(cx, cy, radius, degrees) {
    const radians = degrees * Math.PI / 180;
    return { x:cx + Math.cos(radians) * radius, y:cy + Math.sin(radians) * radius };
  }
  function angleFor(value, asc) { return normalize(180 + value - asc); }
  function num(node, name) { const value = Number(node && node.getAttribute(name)); return Number.isFinite(value) ? value : NaN; }

  function frameFor(svg) {
    const structures = Array.from(svg.querySelectorAll(':scope > .' + STRUCTURE + '[data-ready="true"]'));
    const structure = structures[structures.length - 1];
    const zodiac = structure && structure.querySelector('.' + ZODIAC);
    const circles = zodiac && zodiac.querySelectorAll(':scope > circle');
    if (!structure || !zodiac || !circles || circles.length < 2) return null;
    const cx = Number(structure.dataset.cx), cy = Number(structure.dataset.cy);
    const outer = num(circles[0], 'r'), inner = num(circles[1], 'r');
    if (![cx,cy,outer,inner].every(Number.isFinite)) return null;
    return { structure, zodiac, cx, cy, outer, inner };
  }

  function skyFor(host) {
    if (host.dataset.sky === 'skyB') return 'skyB';
    if (host.dataset.sky === 'skyA') return 'skyA';
    const circle = host.querySelector('.relphi-glyph-bubble>circle,.relphi-approved-inscribed-unit .relphi-glyph-bubble>circle');
    const stroke = String(circle && circle.getAttribute('stroke') || '').toLowerCase();
    return /3166e2|blue/.test(stroke) ? 'skyB' : 'skyA';
  }
  function hostForBubble(bubble) {
    let node = bubble;
    while (node && node.parentElement && node.parentElement.namespaceURI === NS) {
      if (node.classList && node.classList.contains('relphi-canonical-marker-host')) return node;
      if (node.dataset && (node.dataset.glyphId || node.dataset.sky) && node !== bubble) return node;
      node = node.parentElement;
      if (node && node.tagName && node.tagName.toLowerCase() === 'svg') break;
    }
    return bubble.parentElement;
  }
  function radiusFor(host) {
    const circle = host.querySelector('.relphi-glyph-bubble>circle,.relphi-approved-inscribed-unit .relphi-glyph-bubble>circle');
    const r = Number(circle && circle.getAttribute('r'));
    if (Number.isFinite(r) && r > 0) {
      const match = String(host.querySelector('.relphi-approved-inscribed-unit')?.getAttribute('transform') || '').match(/scale\(([-+\d.]+)\)/);
      return match ? r * Number(match[1]) : r;
    }
    return 18;
  }
  function collect(svg, frame) {
    const seen = new Set();
    const result = [];
    svg.querySelectorAll('.relphi-glyph-bubble').forEach(function (bubble) {
      if (bubble.closest('.' + STRUCTURE + ',.' + OVERLAY + ',.relphi-ph-portal,#relphiPlanetaryHoursPortal')) return;
      const host = hostForBubble(bubble);
      if (!host || seen.has(host)) return;
      const id = host.dataset.glyphId || host.querySelector('[data-glyph-id]')?.dataset.glyphId || resolveId(host.getAttribute('aria-label') || '');
      const sky = skyFor(host);
      if (!id || !placementFor(id, sky)) return;
      seen.add(host);
      result.push({ host, id, sky, radius:radiusFor(host) });
    });
    return result;
  }

  function collisionLayout(items) {
    for (let pass=0; pass<120; pass+=1) {
      let changed=false;
      for (let i=0;i<items.length;i+=1) for (let j=i+1;j<items.length;j+=1) {
        const a=items[i], b=items[j];
        const p=point(a.cx,a.cy,a.lane,a.angle+a.shift), q=point(b.cx,b.cy,b.lane,b.angle+b.shift);
        const min=a.radius+b.radius+5, dist=Math.hypot(q.x-p.x,q.y-p.y);
        if (dist>=min) continue;
        const direction=normalize(b.angle-a.angle)<180?1:-1;
        const push=Math.min(1.5,Math.max(.2,(min-dist)/Math.max(a.lane,b.lane)*24));
        a.shift=Math.max(-16,Math.min(16,a.shift-direction*push/2));
        b.shift=Math.max(-16,Math.min(16,b.shift+direction*push/2));
        changed=true;
      }
      if(!changed)break;
    }
  }

  function svgNode(name, attrs) {
    const node=document.createElementNS(NS,name);
    Object.keys(attrs||{}).forEach(function(key){node.setAttribute(key,String(attrs[key]));});
    return node;
  }

  function redrawAspects(svg, frame, overlay) {
    const aspectLayer=svgNode('g',{class:'relphi-degree-anchored-aspects','pointer-events':'none'});
    const candidates=Array.from(svg.querySelectorAll('line,path')).filter(function(node){
      if(node.closest('.'+STRUCTURE+',.'+OVERLAY+',.relphi-final-degree-leaders'))return false;
      const cls=String(node.getAttribute('class')||'');
      const stroke=String(node.getAttribute('stroke')||getComputedStyle(node).stroke||'').toLowerCase();
      return /aspect|relationship|connection/i.test(cls)||(/rgb|#/.test(stroke)&&!/none|transparent|#111|#000|black|dc1f18|3166e2/.test(stroke));
    });
    candidates.forEach(function(node){
      if(node.tagName.toLowerCase()!=='line')return;
      const x1=num(node,'x1'),y1=num(node,'y1'),x2=num(node,'x2'),y2=num(node,'y2');
      if(![x1,y1,x2,y2].every(Number.isFinite))return;
      const r1=Math.hypot(x1-frame.cx,y1-frame.cy),r2=Math.hypot(x2-frame.cx,y2-frame.cy);
      if(r1<frame.inner*.45||r2<frame.inner*.45||r1>frame.outer+8||r2>frame.outer+8)return;
      const a1=Math.atan2(y1-frame.cy,x1-frame.cx)*180/Math.PI;
      const a2=Math.atan2(y2-frame.cy,x2-frame.cx)*180/Math.PI;
      const p1=point(frame.cx,frame.cy,frame.outer,a1),p2=point(frame.cx,frame.cy,frame.outer,a2);
      const clone=node.cloneNode(false);
      clone.setAttribute('x1',p1.x.toFixed(3));clone.setAttribute('y1',p1.y.toFixed(3));
      clone.setAttribute('x2',p2.x.toFixed(3));clone.setAttribute('y2',p2.y.toFixed(3));
      clone.classList.add('relphi-degree-anchored-aspect');
      aspectLayer.appendChild(clone);
      node.dataset.relphiOriginalAspect='true';node.style.visibility='hidden';
    });
    overlay.appendChild(aspectLayer);
  }

  function render(svg) {
    const frame=frameFor(svg), asc=ascLongitude();
    if(!frame||!Number.isFinite(asc))return false;
    const records=collect(svg,frame);
    if(!records.length)return false;
    const old=svg.querySelector(':scope>.'+OVERLAY);if(old)old.remove();
    const overlay=svgNode('g',{class:OVERLAY,'pointer-events':'none'});
    svg.appendChild(overlay);
    const largest=records.reduce(function(v,r){return Math.max(v,r.radius);},18);
    const laneOuter=Math.max(frame.inner-largest-10,frame.inner*.78);
    const laneInner=Math.max(laneOuter-largest*2-8,frame.inner*.60);
    const items=records.map(function(record){
      const value=longitude(placementFor(record.id,record.sky));
      if(!Number.isFinite(value))return null;
      return {...record,cx:frame.cx,cy:frame.cy,angle:angleFor(value,asc),shift:0,lane:record.sky==='skyB'?laneInner:laneOuter};
    }).filter(Boolean);
    collisionLayout(items);
    const leaderLayer=svgNode('g',{class:'relphi-exact-degree-leaders','pointer-events':'none'});
    const markerLayer=svgNode('g',{class:'relphi-inside-sign-placements'});
    overlay.append(leaderLayer,markerLayer);
    applying=true;
    items.forEach(function(item){
      const anchor=point(frame.cx,frame.cy,frame.outer,item.angle);
      const display=point(frame.cx,frame.cy,item.lane,item.angle+item.shift);
      const clone=item.host.cloneNode(true);
      clone.removeAttribute('style');
      clone.setAttribute('transform','translate('+display.x.toFixed(3)+' '+display.y.toFixed(3)+')');
      clone.dataset.sky=item.sky;clone.dataset.glyphId=item.id;
      markerLayer.appendChild(clone);
      item.host.dataset.relphiV2Hidden='true';item.host.style.visibility='hidden';item.host.style.opacity='0';
      leaderLayer.appendChild(svgNode('line',{class:'relphi-exact-degree-leader','data-sky':item.sky,'data-glyph-id':item.id,x1:anchor.x.toFixed(3),y1:anchor.y.toFixed(3),x2:display.x.toFixed(3),y2:display.y.toFixed(3)}));
    });
    redrawAspects(svg,frame,overlay);
    applying=false;
    return true;
  }

  function run(){queued=false;let pending=false;document.querySelectorAll(WHEELS).forEach(function(svg){if(!render(svg))pending=true;});if(pending)setTimeout(queue,140);}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){requestAnimationFrame(run);});}
  function relevant(records){if(applying)return false;return records.some(function(record){return Array.from(record.addedNodes||[]).concat(Array.from(record.removedNodes||[])).some(function(node){return node&&node.nodeType===1&&((node.matches&&node.matches('.'+STRUCTURE+',.relphi-glyph-bubble,.relphi-canonical-marker-layer'))||(node.querySelector&&node.querySelector('.'+STRUCTURE+',.relphi-glyph-bubble,.relphi-canonical-marker-layer')));});});}
  function styles(){if(document.getElementById('relphi-wheel-geometry-v2-style'))return;const style=document.createElement('style');style.id='relphi-wheel-geometry-v2-style';style.textContent='.'+OVERLAY+'{pointer-events:none}.relphi-exact-degree-leader{stroke:#111;stroke-width:1.15;stroke-linecap:round;opacity:.9;vector-effect:non-scaling-stroke}.relphi-degree-anchored-aspect{vector-effect:non-scaling-stroke}';document.head.appendChild(style);}
  function start(){styles();queue();new MutationObserver(function(records){if(relevant(records))queue();}).observe(document.body,{childList:true,subtree:true});window.addEventListener('relphi:wheel-structure-ready',queue);window.addEventListener('relphi:extra-points-updated',queue);window.addEventListener('relphi:house-system-changed',queue);window.addEventListener('storage',queue);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();