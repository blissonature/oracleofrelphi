// Branch-only tuning: one stable owner for marker geometry, spacing, glyphs, and leaders.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const OUTWARD_DISTANCE = 58;
  const BUBBLE_RADIUS = 17.5;
  const MIN_CENTER_GAP = 43;
  const MAX_TANGENTIAL = 84;
  const GLYPH_SIZE = 26;
  const ASSETS = {
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto'
  };
  const cache = new Map();
  let queued = false;
  let running = false;

  function num(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : NaN;
  }

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim().toUpperCase();
  }

  function markerColor(group) {
    return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18';
  }

  function rememberTransform(node) {
    if (node.dataset.relphiLayoutBaseTransform != null) return;
    node.dataset.relphiLayoutBaseTransform = node.getAttribute('transform') || '__none__';
  }

  function restoreTransform(node) {
    const base = node.dataset.relphiLayoutBaseTransform;
    if (base == null) return;
    if (base === '__none__') node.removeAttribute('transform');
    else node.setAttribute('transform', base);
  }

  function move(node, dx, dy) {
    rememberTransform(node);
    restoreTransform(node);
    const base = node.dataset.relphiLayoutBaseTransform;
    const translation = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? translation : base + ' ' + translation);
  }

  function rememberLeader(line) {
    if (line.dataset.relphiLayoutLeader) return;
    line.dataset.relphiLayoutLeader = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['relphiLayout' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }

  function restoreLeader(line) {
    rememberLeader(line);
    ['x1','y1','x2','y2'].forEach(function (name) {
      const value = line.dataset['relphiLayout' + name.toUpperCase()];
      if (value != null) line.setAttribute(name, value);
    });
  }

  function fetchAsset(asset) {
    if (!cache.has(asset)) {
      cache.set(asset, fetch('assets/planet-glyphs/' + asset + '.svg?v=4').then(function (response) {
        if (!response.ok) throw new Error('Glyph asset failed');
        return response.text();
      }));
    }
    return cache.get(asset);
  }

  function styleAsset(root, color) {
    root.querySelectorAll('path,circle,ellipse,line,polyline,polygon,rect').forEach(function (node) {
      const fill = node.getAttribute('fill');
      if (fill !== 'none') node.setAttribute('fill', color);
      node.setAttribute('stroke', color);
      node.setAttribute('stroke-width', '1.55');
      node.setAttribute('stroke-linecap', 'round');
      node.setAttribute('stroke-linejoin', 'round');
      node.setAttribute('paint-order', 'stroke fill');
    });
  }

  function centerAsset(inline) {
    const content = inline.querySelector('.relphi-glyph-content');
    if (!content) return;
    try {
      const box = content.getBBox();
      if (!box.width || !box.height) return;
      const pad = Math.max(box.width, box.height) * 0.11;
      inline.setAttribute('viewBox', [box.x - pad, box.y - pad, box.width + pad * 2, box.height + pad * 2].join(' '));
    } catch (_) {}
  }

  function prepareGlyph(group) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const text = group.querySelector('.chart-wheel-marker-glyph');
    if (!knob || !text) return Promise.resolve();

    const key = bare(text.textContent);
    if (key === 'AC') text.textContent = 'ASC';
    const asset = ASSETS[key];
    const cx = num(knob.getAttribute('cx'));
    const cy = num(knob.getAttribute('cy'));
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return Promise.resolve();

    if (!asset) {
      group.classList.add('has-preview-angle-text');
      group.classList.remove('has-preview-inline-glyph');
      text.style.removeProperty('display');
      text.setAttribute('x', String(cx));
      text.setAttribute('y', String(cy));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', markerColor(group));
      return Promise.resolve();
    }

    group.classList.remove('has-preview-angle-text');
    text.style.display = 'none';
    const oldImage = group.querySelector('image.relphi-bubble-glyph-image');
    if (oldImage) oldImage.style.display = 'none';

    let inline = group.querySelector('svg.relphi-bold-inline-glyph');
    if (inline) {
      inline.setAttribute('x', String(cx - GLYPH_SIZE / 2));
      inline.setAttribute('y', String(cy - GLYPH_SIZE / 2));
      inline.setAttribute('width', String(GLYPH_SIZE));
      inline.setAttribute('height', String(GLYPH_SIZE));
      styleAsset(inline, markerColor(group));
      group.classList.add('has-preview-inline-glyph');
      return Promise.resolve();
    }

    return fetchAsset(asset).then(function (markup) {
      if (group.querySelector('svg.relphi-bold-inline-glyph')) return;
      const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
      inline = document.createElementNS(NS, 'svg');
      inline.classList.add('relphi-bold-inline-glyph');
      inline.setAttribute('x', String(cx - GLYPH_SIZE / 2));
      inline.setAttribute('y', String(cy - GLYPH_SIZE / 2));
      inline.setAttribute('width', String(GLYPH_SIZE));
      inline.setAttribute('height', String(GLYPH_SIZE));
      inline.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      inline.setAttribute('pointer-events', 'none');
      const content = document.createElementNS(NS, 'g');
      content.classList.add('relphi-glyph-content');
      Array.from(parsed.childNodes).forEach(function (node) {
        if (node.nodeType === Node.ELEMENT_NODE) content.appendChild(document.importNode(node, true));
      });
      inline.appendChild(content);
      styleAsset(inline, markerColor(group));
      group.appendChild(inline);
      group.classList.add('has-preview-inline-glyph');
      centerAsset(inline);
    }).catch(function () {
      text.style.removeProperty('display');
    });
  }

  function collect(svg) {
    const box = svg.viewBox && svg.viewBox.baseVal;
    const center = box && box.width ? { x:box.x + box.width / 2, y:box.y + box.height / 2 } : { x:400, y:400 };
    return Array.from(svg.querySelectorAll(PLACEMENT)).map(function (group, index) {
      const knob = group.querySelector('circle.chart-wheel-stick-knob');
      const contact = group.querySelector('circle.chart-wheel-contact-dot');
      const leader = group.querySelector('line.chart-wheel-stick');
      if (!knob || !contact || !leader) return null;
      const cx = num(knob.getAttribute('cx'));
      const cy = num(knob.getAttribute('cy'));
      const ax = num(contact.getAttribute('cx'));
      const ay = num(contact.getAttribute('cy'));
      if (![cx,cy,ax,ay].every(Number.isFinite)) return null;
      const vx = ax - center.x;
      const vy = ay - center.y;
      const length = Math.hypot(vx, vy) || 1;
      return {
        index:index, group:group, knob:knob, contact:contact, leader:leader,
        original:{ x:cx, y:cy }, anchor:{ x:ax, y:ay },
        radial:{ x:vx / length, y:vy / length },
        tangent:{ x:-vy / length, y:vx / length },
        offset:0
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
          const first = items[a];
          const second = items[b];
          const p = finalPosition(first);
          const q = finalPosition(second);
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
    restoreLeader(item.leader);
    const vx = target.x - item.anchor.x;
    const vy = target.y - item.anchor.y;
    const length = Math.hypot(vx, vy) || 1;
    const edge = {
      x:target.x - vx / length * (BUBBLE_RADIUS + 0.5),
      y:target.y - vy / length * (BUBBLE_RADIUS + 0.5)
    };
    item.leader.setAttribute('x1', item.anchor.x.toFixed(2));
    item.leader.setAttribute('y1', item.anchor.y.toFixed(2));
    item.leader.setAttribute('x2', edge.x.toFixed(2));
    item.leader.setAttribute('y2', edge.y.toFixed(2));
  }

  function apply(item) {
    const target = finalPosition(item);
    const dx = target.x - item.original.x;
    const dy = target.y - item.original.y;
    [
      item.knob,
      item.group.querySelector('.chart-wheel-marker-glyph'),
      item.group.querySelector('svg.relphi-bold-inline-glyph')
    ].filter(Boolean).forEach(function (node) { move(node, dx, dy); });
    connectLeader(item, target);
  }

  function layoutSvg(svg) {
    if (svg.dataset.relphiLayoutBusy === 'true') return Promise.resolve();
    svg.dataset.relphiLayoutBusy = 'true';
    svg.style.opacity = '0';
    svg.style.transition = 'none';
    const groups = Array.from(svg.querySelectorAll(PLACEMENT));
    return Promise.all(groups.map(prepareGlyph)).then(function () {
      groups.forEach(function (group) {
        [group.querySelector('.chart-wheel-stick-knob'), group.querySelector('.chart-wheel-marker-glyph'), group.querySelector('svg.relphi-bold-inline-glyph')]
          .filter(Boolean).forEach(restoreTransform);
        const leader = group.querySelector('line.chart-wheel-stick');
        if (leader) restoreLeader(leader);
      });
      const items = collect(svg);
      solve(items);
      items.forEach(apply);
      requestAnimationFrame(function () {
        svg.style.opacity = '1';
        delete svg.dataset.relphiLayoutBusy;
      });
    }).catch(function () {
      svg.style.opacity = '1';
      delete svg.dataset.relphiLayoutBusy;
    });
  }

  function run() {
    queued = false;
    if (running) return;
    running = true;
    Promise.all(Array.from(document.querySelectorAll('.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg')).map(layoutSvg))
      .finally(function () { running = false; });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  function install() {
    schedule();
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    window.addEventListener('resize', schedule, { passive:true });
    new MutationObserver(function (records) {
      if (running) return;
      const relevant = records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE &&
            !node.matches?.('svg.relphi-bold-inline-glyph') &&
            !node.closest?.('svg.relphi-bold-inline-glyph') &&
            (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT));
        });
      });
      if (relevant) schedule();
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
