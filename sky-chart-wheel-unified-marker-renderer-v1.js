// Sky Chart preview: one authoritative grouped marker renderer.
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

  const TEXT_GLYPHS = {
    SUN:'☉', MOON:'☽', MERCURY:'☿', VENUS:'♀', MARS:'♂',
    JUPITER:'♃', SATURN:'♄', URANUS:'♅', NEPTUNE:'♆', PLUTO:'PLUTO_VECTOR',
    NO:'☊', SO:'☋', PA:'⊗',
    'NORTH NODE':'☊', NODE:'☊', 'TRUE NODE':'☊', 'MEAN NODE':'☊',
    'SOUTH NODE':'☋',
    'PART OF FORTUNE':'⊗', FORTUNE:'⊗', POF:'⊗', 'HEART OF FORTUNE':'⊗',
    LILITH:'⚸', 'BLACK MOON LILITH':'⚸',
    DS:'DSC', DSC:'DSC', DESCENDANT:'DSC',
    V:'Vx', VX:'Vx', VERTEX:'Vx',
    AC:'ASC', ASC:'ASC', RISING:'ASC', ASCENDANT:'ASC',
    MC:'MC', MIDHEAVEN:'MC', IC:'IC', IMUMCOELI:'IC', 'IMUM COELI':'IC'
  };

  const PLANETS = new Set(['☉','☽','☿','♀','♂','♃','♄','♅','♆']);
  const SYMBOLS = new Set(['☊','☋','⊗','⚸']);
  const ANGLES = new Set(['ASC','DSC','MC','IC','VX']);

  // Profiles target equal apparent line weight and fill ratio, not equal nominal font size.
  const GLYPH_PROFILE = {
    '☉':{ size:28.5, weight:500, offset:[0,0.6] },
    '☽':{ size:28.5, weight:500, offset:[0.3,0] },
    '☿':{ size:28, weight:500, offset:[0,0.3] },
    '♀':{ size:25, weight:400, offset:[0,0.1] },
    '♂':{ size:25, weight:400, offset:[-0.2,0.05] },
    '♃':{ size:28, weight:500, offset:[0.15,0] },
    '♄':{ size:28, weight:500, offset:[0.1,0.15] },
    '♅':{ size:28, weight:500, offset:[0,0.2] },
    '♆':{ size:27.5, weight:450, offset:[0,0.25] },
    '☊':{ size:27.5, weight:500, offset:[0,0.2] },
    '☋':{ size:27.5, weight:500, offset:[0,0.2] },
    '⊗':{ size:26, weight:400, offset:[0,0.45] },
    '⚸':{ size:25.5, weight:400, offset:[0,0.45] }
  };

  const ANGLE_PROFILE = { size:15.75, weight:650, offset:[0,0.2] };
  let queued = false;

  function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function color(group) {
    return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18';
  }

  function rootPoint(node, x, y) {
    const matrix = node.getCTM?.();
    return matrix ? new DOMPoint(x, y).matrixTransform(matrix) : new DOMPoint(x, y);
  }

  function localPoint(node, point) {
    const matrix = node.getCTM?.();
    if (!matrix) return point;
    try { return point.matrixTransform(matrix.inverse()); }
    catch (_) { return point; }
  }

  function canonicalText(group, text) {
    const visible = bare(text.textContent);
    const name = bare(group.querySelector('.chart-wheel-marker-name')?.textContent).toUpperCase();
    const dataName = bare(group.dataset.name || group.dataset.placement || group.getAttribute('data-name') || '').toUpperCase();
    const key = name || dataName;
    return TEXT_GLYPHS[key] || TEXT_GLYPHS[visible.toUpperCase()] || visible;
  }

  function removeLegacyGlyphLayers(group) {
    group.querySelectorAll('svg.relphi-bold-inline-glyph,svg.relphi-colored-glyph,image.relphi-bubble-glyph-image').forEach(function (node) {
      node.remove();
    });
    group.classList.remove('has-preview-inline-glyph', 'has-preview-angle-text');
  }

  function ensureUnit(group) {
    let unit = group.querySelector(':scope > g.relphi-marker-unit');
    if (!unit) {
      unit = document.createElementNS(NS, 'g');
      unit.classList.add('relphi-marker-unit');
      group.appendChild(unit);
    }
    const knob = group.querySelector(':scope > circle.chart-wheel-stick-knob, g.relphi-marker-unit > circle.chart-wheel-stick-knob');
    let text = group.querySelector(':scope > .chart-wheel-marker-glyph, g.relphi-marker-unit > .chart-wheel-marker-glyph');
    if (!text && knob) {
      text = document.createElementNS(NS, 'text');
      text.classList.add('chart-wheel-marker-glyph');
      text.textContent = bare(group.dataset.glyph || group.dataset.symbol || group.getAttribute('data-glyph') || '');
    }
    if (knob && knob.parentNode !== unit) unit.appendChild(knob);
    if (text && text.parentNode !== unit) unit.appendChild(text);
    return { unit, knob, text };
  }

  function resetUnit(unit) {
    unit.removeAttribute('transform');
  }

  function opticalCenter(node, cx, cy, offset) {
    node.removeAttribute('transform');
    let box;
    try { box = node.getBBox(); }
    catch (_) { return; }
    if (!box || !Number.isFinite(box.width) || !Number.isFinite(box.height)) return;
    const visualX = box.x + box.width / 2;
    const visualY = box.y + box.height / 2;
    const dx = cx - visualX + offset[0];
    const dy = cy - visualY + offset[1];
    node.setAttribute('transform', 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')');
  }

  function ensurePlutoVector(unit, cx, cy, markerColor) {
    let vector = unit.querySelector(':scope > g.relphi-pluto-vector');
    if (!vector) {
      vector = document.createElementNS(NS, 'g');
      vector.classList.add('relphi-pluto-vector');
      vector.innerHTML = [
        '<circle class="pluto-head" r="3.15"/>',
        '<path class="pluto-crescent" d="M -7 -1.5 Q 0 5.2 7 -1.5"/>',
        '<line class="pluto-stem" x1="0" y1="2.4" x2="0" y2="10"/>',
        '<line class="pluto-cross" x1="-5" y1="7" x2="5" y2="7"/>'
      ].join('');
      unit.appendChild(vector);
    }
    vector.setAttribute('transform', 'translate(' + cx.toFixed(2) + ' ' + (cy - 0.15).toFixed(2) + ')');
    vector.setAttribute('fill', 'none');
    vector.setAttribute('stroke', markerColor);
    vector.setAttribute('stroke-width', '2.05');
    vector.setAttribute('stroke-linecap', 'round');
    vector.setAttribute('stroke-linejoin', 'round');
    vector.style.setProperty('display', 'inline', 'important');
    vector.style.setProperty('opacity', '1', 'important');
    return vector;
  }

  function hidePlutoVector(unit) {
    const vector = unit.querySelector(':scope > g.relphi-pluto-vector');
    if (vector) vector.style.setProperty('display', 'none', 'important');
  }

  function styleGlyph(group, unit, knob, text) {
    if (!knob || !text) return;
    const cx = num(knob.getAttribute('cx'));
    const cy = num(knob.getAttribute('cy'));
    if (![cx, cy].every(Number.isFinite)) return;

    const value = canonicalText(group, text);
    const markerColor = color(group);
    const isPluto = value === 'PLUTO_VECTOR';

    if (isPluto) {
      text.textContent = '';
      text.style.setProperty('display', 'none', 'important');
      ensurePlutoVector(unit, cx, cy, markerColor);
    } else {
      hidePlutoVector(unit);
      text.textContent = value;
      const normalized = value.toUpperCase();
      const isPlanet = PLANETS.has(value);
      const isSymbol = SYMBOLS.has(value);
      const isAngle = ANGLES.has(normalized);
      const profile = GLYPH_PROFILE[value] || (isAngle ? ANGLE_PROFILE : { size:27, weight:600, offset:[0,0] });

      text.setAttribute('x', cx.toFixed(2));
      text.setAttribute('y', cy.toFixed(2));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', markerColor);
      text.style.setProperty('display', 'inline', 'important');
      text.style.setProperty('visibility', 'visible', 'important');
      text.style.setProperty('font-family', (isPlanet || isSymbol)
        ? 'Apple Symbols, Segoe UI Symbol, Noto Sans Symbols 2, Noto Sans Symbols, Arial Unicode MS, serif'
        : 'system-ui, sans-serif', 'important');
      text.style.setProperty('font-size', profile.size + 'px', 'important');
      text.style.setProperty('font-weight', String(profile.weight), 'important');
      text.style.setProperty('letter-spacing', isAngle ? '-0.35px' : '0', 'important');
      text.style.setProperty('opacity', '1', 'important');
      text.style.removeProperty('stroke');
      text.style.removeProperty('stroke-width');
      text.style.removeProperty('paint-order');
      text.style.removeProperty('stroke-linejoin');
      opticalCenter(text, cx, cy, profile.offset);
    }

    knob.setAttribute('r', String(BUBBLE_RADIUS));
    knob.style.setProperty('fill', '#fff', 'important');
    knob.style.setProperty('fill-opacity', '1', 'important');
    knob.style.setProperty('stroke', markerColor, 'important');
    knob.style.setProperty('opacity', '1', 'important');
  }

  function collect(svg) {
    const box = svg.viewBox?.baseVal;
    const center = box && box.width ? { x:box.x + box.width / 2, y:box.y + box.height / 2 } : { x:400, y:400 };
    return Array.from(svg.querySelectorAll(PLACEMENT)).map(function (group, index) {
      removeLegacyGlyphLayers(group);
      const marker = ensureUnit(group);
      resetUnit(marker.unit);
      const contact = group.querySelector('circle.chart-wheel-contact-dot');
      const leader = group.querySelector('line.chart-wheel-stick');
      if (!marker.knob || !marker.text || !contact || !leader) return null;
      styleGlyph(group, marker.unit, marker.knob, marker.text);

      const cx = num(marker.knob.getAttribute('cx'));
      const cy = num(marker.knob.getAttribute('cy'));
      const ax = num(contact.getAttribute('cx'));
      const ay = num(contact.getAttribute('cy'));
      if (![cx,cy,ax,ay].every(Number.isFinite)) return null;
      const vx = ax - center.x;
      const vy = ay - center.y;
      const length = Math.hypot(vx, vy) || 1;
      return {
        index, group, unit:marker.unit, knob:marker.knob, text:marker.text, contact, leader,
        original:{x:cx,y:cy}, anchor:{x:ax,y:ay},
        radial:{x:vx/length,y:vy/length}, tangent:{x:-vy/length,y:vx/length}, offset:0
      };
    }).filter(Boolean);
  }

  function finalPosition(item) {
    return {
      x:item.anchor.x + item.radial.x * OUTWARD_DISTANCE + item.tangent.x * item.offset,
      y:item.anchor.y + item.radial.y * OUTWARD_DISTANCE + item.tangent.y * item.offset
    };
  }

  function solve(items) {
    for (let pass = 0; pass < 56; pass += 1) {
      let changed = false;
      for (let a = 0; a < items.length; a += 1) {
        for (let b = a + 1; b < items.length; b += 1) {
          const first = items[a], second = items[b];
          const p = finalPosition(first), q = finalPosition(second);
          const distance = Math.hypot(q.x - p.x, q.y - p.y);
          if (distance >= MIN_CENTER_GAP) continue;
          const cross = first.radial.x * second.radial.y - first.radial.y * second.radial.x;
          const direction = Math.sign(cross) || (first.index < second.index ? 1 : -1);
          const push = Math.min(7, (MIN_CENTER_GAP - distance) * 0.64 + 0.5);
          first.offset = Math.max(-MAX_TANGENTIAL, Math.min(MAX_TANGENTIAL, first.offset - direction * push / 2));
          second.offset = Math.max(-MAX_TANGENTIAL, Math.min(MAX_TANGENTIAL, second.offset + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  function connectLeader(item, target) {
    const contactRoot = rootPoint(item.contact, item.anchor.x, item.anchor.y);
    const unitMatrix = item.unit.getCTM?.();
    const bubbleRoot = unitMatrix ? new DOMPoint(item.original.x, item.original.y).matrixTransform(unitMatrix) : new DOMPoint(target.x, target.y);
    const contactLocal = localPoint(item.leader, contactRoot);
    const bubbleLocal = localPoint(item.leader, bubbleRoot);

    const x1 = num(item.leader.getAttribute('x1'));
    const y1 = num(item.leader.getAttribute('y1'));
    const x2 = num(item.leader.getAttribute('x2'));
    const y2 = num(item.leader.getAttribute('y2'));
    const oneRoot = rootPoint(item.leader, x1, y1);
    const twoRoot = rootPoint(item.leader, x2, y2);
    const oneIsContact = Math.hypot(oneRoot.x-contactRoot.x, oneRoot.y-contactRoot.y) <= Math.hypot(twoRoot.x-contactRoot.x, twoRoot.y-contactRoot.y);

    if (oneIsContact) {
      item.leader.setAttribute('x1', contactLocal.x.toFixed(2));
      item.leader.setAttribute('y1', contactLocal.y.toFixed(2));
      item.leader.setAttribute('x2', bubbleLocal.x.toFixed(2));
      item.leader.setAttribute('y2', bubbleLocal.y.toFixed(2));
    } else {
      item.leader.setAttribute('x2', contactLocal.x.toFixed(2));
      item.leader.setAttribute('y2', contactLocal.y.toFixed(2));
      item.leader.setAttribute('x1', bubbleLocal.x.toFixed(2));
      item.leader.setAttribute('y1', bubbleLocal.y.toFixed(2));
    }
    item.leader.style.setProperty('opacity', '1', 'important');
  }

  function layout(svg) {
    const items = collect(svg);
    if (!items.length) return;
    solve(items);
    items.forEach(function (item) {
      const target = finalPosition(item);
      const dx = target.x - item.original.x;
      const dy = target.y - item.original.y;
      item.unit.setAttribute('transform', 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')');
      connectLeader(item, target);
      item.group.style.setProperty('opacity', '1', 'important');
    });
    svg.classList.add('relphi-layout-ready');
  }

  function scan(root) {
    if (root instanceof SVGElement && root.matches(SVG_SELECTOR)) layout(root);
    root.querySelectorAll?.(SVG_SELECTOR).forEach(layout);
  }

  function schedule(root) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      scan(root || document);
    });
  }

  function install() {
    schedule(document);
    new MutationObserver(function (records) {
      if (records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE &&
            (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT) || node.matches?.(SVG_SELECTOR));
        });
      })) schedule(document);
    }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('resize', function () { schedule(document); }, { passive:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', function () { schedule(document); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();