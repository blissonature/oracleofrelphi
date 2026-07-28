// Atomic comparison-wheel lollipop renderer built directly from both saved skies.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const WHEELS = '.unified-sky-wheel > svg,.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  const STRUCTURE = 'relphi-dual-house-rings';
  const ZODIAC = 'relphi-zodiac-structure-ring';
  const OVERLAY = 'relphi-comparison-lollipop-v1';
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const COLORS = { skyA:'#dc1f18', skyB:'#3166e2' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  let queued = false;
  let generation = 0;

  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function normalize(value) { value %= 360; return value < 0 ? value + 360 : value; }
  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return normalize(Number(item.longitude));
    const sign = SIGNS.findIndex(name => name.toLowerCase() === String(item.sign || item.zodiac || '').trim().toLowerCase());
    return sign < 0 ? NaN : sign * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60 + Number(item.second || item.seconds || 0) / 3600;
  }
  function resolve(value) {
    try { return window.RelphiGlyphRegistry?.resolve(value)?.id || window.RelphiGlyphRegistry?.get(value)?.id || ''; }
    catch (_) { return ''; }
  }
  function point(cx, cy, radius, degrees) { const r = degrees * Math.PI / 180; return { x:cx + Math.cos(r) * radius, y:cy + Math.sin(r) * radius }; }
  function node(name, attrs) { const el = document.createElementNS(NS,name); Object.entries(attrs || {}).forEach(([k,v]) => el.setAttribute(k,String(v))); return el; }
  function num(el, attr) { const value = Number(el?.getAttribute(attr)); return Number.isFinite(value) ? value : NaN; }

  function placementEntries(payload) {
    if (!payload) return [];
    const candidates = [payload.placements, payload.positions, payload.points, payload.bodies, payload];
    const source = candidates.find(value => value && typeof value === 'object');
    if (!source) return [];
    if (Array.isArray(source)) {
      return source.map((item,index) => {
        const key = item?.name || item?.label || item?.body || item?.planet || item?.point || item?.id || String(index);
        return [String(key), item];
      });
    }
    return Object.entries(source).filter(([,item]) => item && typeof item === 'object' && !Array.isArray(item));
  }

  function glyphId(key, item) {
    const candidates = [key, item?.name, item?.label, item?.body, item?.planet, item?.point, item?.glyphId, item?.id];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const direct = resolve(candidate);
      if (direct) return direct;
      const cleaned = String(candidate).replace(/^[^A-Za-z]+/, '').replace(/\s+/g, ' ').trim();
      const fallback = resolve(cleaned);
      if (fallback) return fallback;
    }
    return '';
  }

  function frameFor(svg) {
    const structures = Array.from(svg.querySelectorAll('.' + STRUCTURE + '[data-ready="true"]'));
    const structure = structures[structures.length - 1];
    const zodiac = structure?.querySelector('.' + ZODIAC);
    const circles = zodiac?.querySelectorAll(':scope > circle');
    if (!structure || !zodiac || !circles || circles.length < 2) return null;
    const cx = Number(structure.dataset.cx), cy = Number(structure.dataset.cy);
    const outer = num(circles[0],'r'), inner = num(circles[1],'r');
    if (![cx,cy,outer,inner].every(Number.isFinite)) return null;
    return { structure,zodiac,cx,cy,outer,inner };
  }

  function ascLongitude() {
    const entries = placementEntries(read(KEYS.skyA));
    const found = entries.find(([key,item]) => /^(rising|ascendant|asc|ac)$/i.test(String(key)) || /^(rising|ascendant|asc|ac)$/i.test(String(item?.name || item?.label || '')));
    return found ? longitude(found[1]) : NaN;
  }
  function angleFor(value, asc) { return normalize(180 + value - asc); }

  function recordsBySky() {
    const result = { skyA:[], skyB:[] };
    Object.keys(result).forEach(sky => {
      result[sky] = placementEntries(read(KEYS[sky])).map(([key,item]) => ({
        sky,
        key,
        id:glyphId(key,item),
        item,
        value:longitude(item)
      })).filter(record => record.id && Number.isFinite(record.value));
    });
    return result;
  }

  function layout(items, lane, markerRadius) {
    const sorted = items.slice().sort((a,b) => a.angle - b.angle);
    const minimum = Math.max(7, Math.asin(Math.min(.98,(markerRadius * 2 + 3) / (2 * lane))) * 360 / Math.PI);
    for (let pass=0; pass<180; pass+=1) {
      let moved = false;
      for (let i=0; i<sorted.length; i+=1) {
        const a = sorted[i], b = sorted[(i+1)%sorted.length];
        const aPos = a.angle + a.shift;
        const bPos = b.angle + b.shift + (i === sorted.length - 1 ? 360 : 0);
        const gap = bPos - aPos;
        if (gap >= minimum) continue;
        const push = (minimum - gap) / 2;
        a.shift -= push;
        b.shift += push;
        moved = true;
      }
      if (!moved) break;
    }
    return sorted;
  }

  function aspectCandidates(svg, frame) {
    return Array.from(svg.querySelectorAll('line')).filter(line => {
      if (line.closest('.' + STRUCTURE + ',.' + OVERLAY + ',.relphi-wheel-geometry-v2')) return false;
      const x1=num(line,'x1'), y1=num(line,'y1'), x2=num(line,'x2'), y2=num(line,'y2');
      if (![x1,y1,x2,y2].every(Number.isFinite)) return false;
      const r1=Math.hypot(x1-frame.cx,y1-frame.cy), r2=Math.hypot(x2-frame.cx,y2-frame.cy);
      if (r1 < frame.inner*.3 || r2 < frame.inner*.3 || r1 > frame.outer+24 || r2 > frame.outer+24) return false;
      const cls=String(line.getAttribute('class')||'');
      const stroke=String(line.getAttribute('stroke')||getComputedStyle(line).stroke||'').toLowerCase();
      return /aspect|relationship|connection/i.test(cls) || (!/none|transparent|#111|#000|black|dc1f18|3166e2/.test(stroke) && stroke !== '');
    });
  }

  function hideLegacy(svg, overlay, frame) {
    svg.querySelectorAll('.relphi-wheel-geometry-v2,.relphi-canonical-marker-layer').forEach(el => { if (el !== overlay) el.style.display='none'; });
    svg.querySelectorAll('.relphi-glyph-bubble').forEach(bubble => {
      if (bubble.closest('.' + STRUCTURE + ',.' + OVERLAY)) return;
      const host = bubble.closest('.relphi-canonical-marker-host,[data-glyph-id]') || bubble.parentElement;
      if (host && !host.closest('.' + STRUCTURE + ',.' + OVERLAY)) host.style.display='none';
    });
    aspectCandidates(svg,frame).forEach(line => line.style.visibility='hidden');
  }

  function render(svg) {
    const component = window.RelphiGlyphComponent;
    const frame = frameFor(svg);
    const asc = ascLongitude();
    const grouped = recordsBySky();
    const hasSkyB = !!read(KEYS.skyB);
    if (!component?.createBubble || !frame || !Number.isFinite(asc) || !grouped.skyA.length || (hasSkyB && !grouped.skyB.length)) return false;
    const source = grouped.skyA.concat(grouped.skyB);

    const renderId = ++generation;
    const previous = svg.querySelector(':scope > .' + OVERLAY);
    const overlay = node('g',{class:OVERLAY,'data-render-id':renderId,'pointer-events':'none','data-sky-a-count':grouped.skyA.length,'data-sky-b-count':grouped.skyB.length});
    overlay.style.visibility='hidden';
    svg.appendChild(overlay);

    const markerRadius = Math.max(7.5,Math.min(9,(frame.outer-frame.inner)*.21));
    const anchorRadius = frame.inner;
    const lane = frame.outer + markerRadius + 5;
    const items = layout(source.map(record => ({...record,angle:angleFor(record.value,asc),shift:0})),lane,markerRadius);

    const aspects = node('g',{class:'relphi-comparison-aspects'});
    const guides = node('g',{class:'relphi-comparison-guides'});
    const leaders = node('g',{class:'relphi-comparison-leaders'});
    const markers = node('g',{class:'relphi-comparison-markers'});
    overlay.append(aspects,guides,leaders,markers);
    guides.appendChild(node('circle',{class:'relphi-comparison-anchor-ring',cx:frame.cx,cy:frame.cy,r:anchorRadius}));

    aspectCandidates(svg,frame).forEach(line => {
      const x1=num(line,'x1'),y1=num(line,'y1'),x2=num(line,'x2'),y2=num(line,'y2');
      const a1=Math.atan2(y1-frame.cy,x1-frame.cx)*180/Math.PI;
      const a2=Math.atan2(y2-frame.cy,x2-frame.cx)*180/Math.PI;
      const p1=point(frame.cx,frame.cy,anchorRadius,a1), p2=point(frame.cx,frame.cy,anchorRadius,a2);
      const clone=line.cloneNode(false);
      clone.setAttribute('x1',p1.x); clone.setAttribute('y1',p1.y); clone.setAttribute('x2',p2.x); clone.setAttribute('y2',p2.y);
      clone.classList.add('relphi-comparison-aspect'); aspects.appendChild(clone);
    });

    const jobs=[];
    items.forEach(item => {
      const anchor=point(frame.cx,frame.cy,anchorRadius,item.angle);
      const display=point(frame.cx,frame.cy,lane,item.angle+item.shift);
      const notchIn=point(frame.cx,frame.cy,anchorRadius-3.5,item.angle);
      const notchOut=point(frame.cx,frame.cy,anchorRadius+3.5,item.angle);
      guides.appendChild(node('line',{class:'relphi-comparison-notch',stroke:COLORS[item.sky],'data-sky':item.sky,x1:notchIn.x,y1:notchIn.y,x2:notchOut.x,y2:notchOut.y}));
      leaders.appendChild(node('line',{class:'relphi-comparison-stick',stroke:COLORS[item.sky],'data-sky':item.sky,x1:display.x,y1:display.y,x2:anchor.x,y2:anchor.y}));
      guides.appendChild(node('circle',{class:'relphi-comparison-placement-dot',fill:COLORS[item.sky],'data-sky':item.sky,cx:anchor.x,cy:anchor.y,r:2.25}));
      const host=node('g',{class:'relphi-comparison-candy','data-sky':item.sky,'data-glyph-id':item.id,transform:'translate('+display.x+' '+display.y+')'});
      markers.appendChild(host);
      try {
        const ready = component.createBubble(host,item.id,{radius:markerRadius,padding:1,color:COLORS[item.sky],fill:'#fff',strokeWidth:2.35}).ready;
        jobs.push(Promise.resolve(ready).then(() => ({sky:item.sky,host})).catch(error => Promise.reject({sky:item.sky,error})));
      } catch (error) { jobs.push(Promise.reject({sky:item.sky,error})); }
    });

    Promise.allSettled(jobs).then(results => {
      if (!svg.isConnected || overlay.dataset.renderId !== String(renderId)) return;
      const completed = { skyA:0, skyB:0 };
      results.forEach(result => { if (result.status === 'fulfilled') completed[result.value.sky] += 1; });
      const completeA = completed.skyA === grouped.skyA.length;
      const completeB = !hasSkyB || completed.skyB === grouped.skyB.length;
      if (!completeA || !completeB) { overlay.remove(); return; }
      overlay.dataset.skyAReady = String(completed.skyA);
      overlay.dataset.skyBReady = String(completed.skyB);
      hideLegacy(svg,overlay,frame);
      previous?.remove();
      overlay.style.visibility='visible';
      overlay.dataset.ready='true';
      window.dispatchEvent(new CustomEvent('relphi:comparison-lollipop-ready',{detail:{skyA:completed.skyA,skyB:completed.skyB}}));
    });
    return true;
  }

  function run() { queued=false; let pending=false; document.querySelectorAll(WHEELS).forEach(svg => { if (!render(svg)) pending=true; }); if (pending) setTimeout(queue,180); }
  function queue() { if (queued) return; queued=true; requestAnimationFrame(() => requestAnimationFrame(run)); }
  function styles() {
    if (document.getElementById('relphi-comparison-lollipop-style')) return;
    const style=document.createElement('style'); style.id='relphi-comparison-lollipop-style'; style.textContent=`
      .${OVERLAY}{pointer-events:none}
      .relphi-comparison-anchor-ring{fill:none;stroke:#aeb3ba;stroke-width:1;vector-effect:non-scaling-stroke}
      .relphi-comparison-notch{stroke-width:1.45;stroke-linecap:round;vector-effect:non-scaling-stroke}
      .relphi-comparison-stick{stroke-width:1.15;stroke-linecap:round;opacity:.88;vector-effect:non-scaling-stroke}
      .relphi-comparison-placement-dot{stroke:#fff;stroke-width:.7;vector-effect:non-scaling-stroke}
      .relphi-comparison-aspect{vector-effect:non-scaling-stroke;opacity:.72}
      .relphi-comparison-candy{pointer-events:auto}
    `; document.head.appendChild(style);
  }
  function start() {
    styles();
    queue();
    new MutationObserver(records => {
      if (records.some(record => Array.from(record.addedNodes || []).some(added => added.nodeType === 1 && (added.matches?.(WHEELS) || added.querySelector?.(WHEELS) || added.matches?.('.' + STRUCTURE))))) queue();
    }).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('storage',queue);
    window.addEventListener('relphi:extra-points-updated',queue);
    window.addEventListener('relphi:house-system-changed',queue);
    window.addEventListener('relphi:wheel-structure-ready',queue);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();