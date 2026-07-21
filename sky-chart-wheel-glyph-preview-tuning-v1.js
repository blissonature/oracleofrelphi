// Branch-only tuning: wide bubble orbit, stable bold glyphs, and exact leader connections.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const OUTWARD_SHIFT = 24;
  const GLYPH_SIZE = 26;
  const BUBBLE_RADIUS = 17.5;
  const MIN_CENTER_GAP = 44;
  const MAX_TANGENTIAL = 72;
  const ASSETS = {
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto'
  };
  const assetMarkup = new Map();
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

  function rootPoint(node, x, y) {
    const matrix = node.getCTM && node.getCTM();
    if (!matrix) return { x:x, y:y };
    const point = new DOMPoint(x, y).matrixTransform(matrix);
    return { x:point.x, y:point.y };
  }

  function localPoint(node, point) {
    const matrix = node.getCTM && node.getCTM();
    if (!matrix) return point;
    try {
      const local = new DOMPoint(point.x, point.y).matrixTransform(matrix.inverse());
      return { x:local.x, y:local.y };
    } catch (_) {
      return point;
    }
  }

  function rememberTransform(node) {
    if (node.dataset.previewWideBaseTransform != null) return;
    node.dataset.previewWideBaseTransform = node.getAttribute('transform') || '__none__';
  }

  function translate(node, dx, dy) {
    rememberTransform(node);
    const base = node.dataset.previewWideBaseTransform;
    const move = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? move : base + ' ' + move);
  }

  function rememberLeader(line) {
    if (line.dataset.previewWideLeader) return;
    line.dataset.previewWideLeader = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['previewWide' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }

  function boldAsset(root, color) {
    root.querySelectorAll('path,circle,ellipse,line,polyline,polygon,rect').forEach(function (node) {
      const fill = node.getAttribute('fill');
      if (fill !== 'none') node.setAttribute('fill', color);
      node.setAttribute('stroke', color);
      node.setAttribute('stroke-width', '1.65');
      node.setAttribute('stroke-linecap', 'round');
      node.setAttribute('stroke-linejoin', 'round');
      node.setAttribute('paint-order', 'stroke fill');
    });
  }

  function fetchAsset(asset) {
    if (!assetMarkup.has(asset)) {
      assetMarkup.set(asset, fetch('assets/planet-glyphs/' + asset + '.svg?v=4').then(function (response) {
        if (!response.ok) throw new Error('glyph fetch failed');
        return response.text();
      }));
    }
    return assetMarkup.get(asset);
  }

  function positionInlineGlyph(inline, knob) {
    const cx = num(knob.getAttribute('cx'));
    const cy = num(knob.getAttribute('cy'));
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;
    inline.setAttribute('x', String(cx - GLYPH_SIZE / 2));
    inline.setAttribute('y', String(cy - GLYPH_SIZE / 2));
    inline.setAttribute('width', String(GLYPH_SIZE));
    inline.setAttribute('height', String(GLYPH_SIZE));
  }

  function opticallyCenter(inline) {
    const content = inline.querySelector('.relphi-glyph-content');
    if (!content) return;
    try {
      const box = content.getBBox();
      if (![box.x, box.y, box.width, box.height].every(Number.isFinite) || !box.width || !box.height) return;
      const pad = Math.max(box.width, box.height) * 0.10;
      inline.setAttribute('viewBox', [
        box.x - pad,
        box.y - pad,
        box.width + pad * 2,
        box.height + pad * 2
      ].join(' '));
    } catch (_) {}
  }

  function installInlineGlyph(group) {
    const text = group.querySelector('.chart-wheel-marker-glyph');
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    if (!text || !knob) return;

    const key = bare(text.textContent);
    if (key === 'AC') text.textContent = 'ASC';
    const asset = ASSETS[key];
    const originalImage = group.querySelector('image.relphi-bubble-glyph-image');

    if (!asset) {
      group.classList.add('has-preview-angle-text');
      group.classList.remove('has-preview-inline-glyph');
      text.style.removeProperty('display');
      text.setAttribute('fill', markerColor(group));
      return;
    }

    group.classList.remove('has-preview-angle-text');
    if (originalImage) originalImage.style.display = 'none';
    text.style.display = 'none';

    const existing = group.querySelector('svg.relphi-bold-inline-glyph');
    if (existing) {
      positionInlineGlyph(existing, knob);
      boldAsset(existing, markerColor(group));
      group.classList.add('has-preview-inline-glyph');
      return;
    }

    if (group.dataset.previewInlineLoading === asset) return;
    group.dataset.previewInlineLoading = asset;
    fetchAsset(asset).then(function (markup) {
      if (group.querySelector('svg.relphi-bold-inline-glyph')) return;
      const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
      const inline = document.createElementNS(NS, 'svg');
      inline.classList.add('relphi-bold-inline-glyph');
      inline.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      inline.setAttribute('pointer-events', 'none');
      const knobTransform = knob.getAttribute('transform');
      if (knobTransform) inline.setAttribute('transform', knobTransform);
      positionInlineGlyph(inline, knob);

      const content = document.createElementNS(NS, 'g');
      content.classList.add('relphi-glyph-content');
      Array.from(parsed.childNodes).forEach(function (node) {
        if (node.nodeType === Node.ELEMENT_NODE) content.appendChild(document.importNode(node, true));
      });
      inline.appendChild(content);
      boldAsset(inline, markerColor(group));
      group.appendChild(inline);
      group.classList.add('has-preview-inline-glyph');
      requestAnimationFrame(function () { opticallyCenter(inline); });
    }).catch(function () {
      text.style.removeProperty('display');
    }).finally(function () {
      delete group.dataset.previewInlineLoading;
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

      const base = rootPoint(knob, cx, cy);
      const anchor = rootPoint(contact, ax, ay);
      const vx = anchor.x - center.x;
      const vy = anchor.y - center.y;
      const length = Math.hypot(vx, vy) || 1;
      const normal = { x:vx / length, y:vy / length };
      const tangent = { x:-normal.y, y:normal.x };
      return {
        index:index,
        group:group,
        knob:knob,
        contact:contact,
        leader:leader,
        base:base,
        anchor:anchor,
        normal:normal,
        tangent:tangent,
        tangential:0
      };
    }).filter(Boolean);
  }

  function position(item) {
    return {
      x:item.base.x + item.normal.x * OUTWARD_SHIFT + item.tangent.x * item.tangential,
      y:item.base.y + item.normal.y * OUTWARD_SHIFT + item.tangent.y * item.tangential
    };
  }

  function solve(items) {
    for (let pass = 0; pass < 44; pass += 1) {
      let changed = false;
      for (let a = 0; a < items.length; a += 1) {
        for (let b = a + 1; b < items.length; b += 1) {
          const first = items[a];
          const second = items[b];
          const p = position(first);
          const q = position(second);
          const distance = Math.hypot(q.x - p.x, q.y - p.y);
          if (distance >= MIN_CENTER_GAP) continue;
          const cross = first.normal.x * second.normal.y - first.normal.y * second.normal.x;
          const direction = Math.sign(cross) || (first.index < second.index ? 1 : -1);
          const push = Math.min(6.5, (MIN_CENTER_GAP - distance) * 0.62 + 0.45);
          first.tangential = Math.max(-MAX_TANGENTIAL, Math.min(MAX_TANGENTIAL, first.tangential - direction * push / 2));
          second.tangential = Math.max(-MAX_TANGENTIAL, Math.min(MAX_TANGENTIAL, second.tangential + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  function connectLeader(item, final) {
    rememberLeader(item.leader);
    const x1 = num(item.leader.dataset.previewWideX1);
    const y1 = num(item.leader.dataset.previewWideY1);
    const x2 = num(item.leader.dataset.previewWideX2);
    const y2 = num(item.leader.dataset.previewWideY2);
    if (![x1,y1,x2,y2].every(Number.isFinite)) return;

    const oneRoot = rootPoint(item.leader, x1, y1);
    const twoRoot = rootPoint(item.leader, x2, y2);
    const oneToAnchor = Math.hypot(oneRoot.x - item.anchor.x, oneRoot.y - item.anchor.y);
    const twoToAnchor = Math.hypot(twoRoot.x - item.anchor.x, twoRoot.y - item.anchor.y);

    const vx = final.x - item.anchor.x;
    const vy = final.y - item.anchor.y;
    const length = Math.hypot(vx, vy) || 1;
    const edgeRoot = {
      x:final.x - vx / length * (BUBBLE_RADIUS + 0.8),
      y:final.y - vy / length * (BUBBLE_RADIUS + 0.8)
    };
    const anchorLocal = localPoint(item.leader, item.anchor);
    const edgeLocal = localPoint(item.leader, edgeRoot);

    if (oneToAnchor <= twoToAnchor) {
      item.leader.setAttribute('x1', anchorLocal.x.toFixed(2));
      item.leader.setAttribute('y1', anchorLocal.y.toFixed(2));
      item.leader.setAttribute('x2', edgeLocal.x.toFixed(2));
      item.leader.setAttribute('y2', edgeLocal.y.toFixed(2));
    } else {
      item.leader.setAttribute('x2', anchorLocal.x.toFixed(2));
      item.leader.setAttribute('y2', anchorLocal.y.toFixed(2));
      item.leader.setAttribute('x1', edgeLocal.x.toFixed(2));
      item.leader.setAttribute('y1', edgeLocal.y.toFixed(2));
    }
  }

  function apply(item) {
    const final = position(item);
    const dx = final.x - item.base.x;
    const dy = final.y - item.base.y;
    [
      item.knob,
      item.group.querySelector('.chart-wheel-marker-glyph'),
      item.group.querySelector('image.relphi-bubble-glyph-image'),
      item.group.querySelector('svg.relphi-bold-inline-glyph')
    ].filter(Boolean).forEach(function (node) { translate(node, dx, dy); });
    connectLeader(item, final);
  }

  function tune(svg) {
    svg.querySelectorAll(PLACEMENT).forEach(installInlineGlyph);
    const items = collect(svg);
    solve(items);
    items.forEach(apply);
  }

  function run() {
    queued = false;
    if (running) return;
    running = true;
    try {
      document.querySelectorAll('.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg').forEach(tune);
    } finally {
      running = false;
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(run); });
  }

  function install() {
    schedule();
    [250, 700, 1400, 2600].forEach(function (delay) { setTimeout(schedule, delay); });
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
