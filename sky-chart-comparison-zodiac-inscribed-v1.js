// Comparison zodiac ring pinned to the exact approved glyph canon at commit 0d56ee7.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const CANON_COMMIT = '0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
  const CANON_ROOT = 'https://raw.githubusercontent.com/blissonature/oracleofrelphi/' + CANON_COMMIT + '/assets/zodiac-glyphs/';
  const WHEELS = '.unified-sky-wheel svg,#currentSkyOutput svg,.sky-output-box[data-sky="comparison"] svg,.sky-output-box[data-slot="skyB"] svg';
  const OWN = 'relphi-comparison-zodiac-inscribed-layer';
  const cache = new Map();
  let queued = false;

  const SIGNS = Object.freeze({
    aries:{name:'Aries',scale:1,dx:0,dy:0.9},
    taurus:{name:'Taurus',scale:1,dx:0,dy:0.9},
    gemini:{name:'Gemini',scale:0.95,dx:0,dy:0},
    cancer:{name:'Cancer',scale:1,dx:0,dy:0},
    leo:{name:'Leo',scale:1,dx:0,dy:-0.9},
    virgo:{name:'Virgo',scale:1,dx:0,dy:0.45},
    libra:{name:'Libra',scale:1,dx:0,dy:-0.9},
    scorpio:{name:'Scorpio',scale:1,dx:0,dy:0.45},
    sagittarius:{name:'Sagittarius',scale:0.95,dx:0,dy:0},
    capricorn:{name:'Capricorn',scale:1,dx:0,dy:0.9},
    aquarius:{name:'Aquarius',scale:1,dx:0,dy:0},
    pisces:{name:'Pisces',scale:1,dx:0,dy:0}
  });

  function normalize(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim().toLowerCase();
  }

  function signFor(node) {
    const raw = normalize(node.dataset?.glyphId || node.dataset?.sign || node.textContent);
    return SIGNS[raw] ? raw : '';
  }

  async function sourceFor(sign) {
    if (cache.has(sign)) return cache.get(sign).cloneNode(true);
    const response = await fetch(CANON_ROOT + sign + '.svg');
    if (!response.ok) throw new Error('Could not load pinned canonical zodiac glyph: ' + sign);
    const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
    cache.set(sign, source);
    return source.cloneNode(true);
  }

  function recolor(root, color) {
    root.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(function (node) {
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      if (fill && fill !== 'none') node.setAttribute('fill', color);
      if (stroke && stroke !== 'none') node.setAttribute('stroke', color);
      node.style.opacity = '1';
    });
  }

  function availableRadius(radius, padding, strokeWidth) {
    return Math.max(1, radius - Math.max(0, strokeWidth) / 2 - Math.max(1, padding));
  }

  function fit(art, radius, settings, strokeWidth) {
    art.removeAttribute('transform');
    const box = art.getBBox();
    if (!box || !box.width || !box.height) return;
    const usable = availableRadius(radius, 1, strokeWidth);
    const maximumScale = usable / (Math.hypot(box.width / 2, box.height / 2) || 1);
    const scale = maximumScale * settings.scale;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    art.setAttribute('transform', 'translate(' + settings.dx + ' ' + settings.dy + ') scale(' + scale + ') translate(' + (-cx) + ' ' + (-cy) + ')');
  }

  function pointInRoot(svg, node, x, y) {
    try {
      const a = node.getScreenCTM(), b = svg.getScreenCTM();
      if (a && b) return new DOMPoint(x, y).matrixTransform(a).matrixTransform(b.inverse());
    } catch (_) {}
    return { x:x, y:y };
  }

  function candidates(svg) {
    return Array.from(svg.querySelectorAll('text')).filter(function (node) {
      if (node.closest('.chart-wheel-placement-stick,.' + OWN + ',.relphi-canonical-marker-layer,.relphi-sky-glyph-layer')) return false;
      return Boolean(signFor(node));
    });
  }

  async function drawPinnedBubble(host, sign, radius) {
    const settings = SIGNS[sign];
    const strokeWidth = 2;
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', '#fff');
    circle.setAttribute('stroke', '#111');
    circle.setAttribute('stroke-width', String(strokeWidth));
    host.appendChild(circle);

    const source = await sourceFor(sign);
    const art = document.createElementNS(NS, 'g');
    Array.from(source.children).forEach(function (child) { art.appendChild(document.importNode(child, true)); });
    recolor(art, '#111');
    host.appendChild(art);
    await new Promise(function (resolve) { requestAnimationFrame(resolve); });
    fit(art, radius, settings, strokeWidth);
  }

  function renderWheel(svg) {
    const labels = candidates(svg);
    if (labels.length < 12) return;
    svg.querySelector(':scope > .' + OWN)?.remove();
    const layer = document.createElementNS(NS, 'g');
    layer.classList.add(OWN);
    layer.dataset.canonCommit = CANON_COMMIT;
    layer.setAttribute('aria-label', 'Pinned canonical circled zodiac glyphs');
    svg.appendChild(layer);

    const view = svg.viewBox && svg.viewBox.baseVal;
    const span = view && view.width ? Math.min(view.width, view.height) : Math.min(svg.clientWidth || 700, svg.clientHeight || 700);
    const radius = Math.max(11.5, Math.min(15, span * 0.019));
    const jobs = labels.slice(0, 12).map(function (label) {
      const sign = signFor(label);
      let x = Number(label.getAttribute('x')) || 0;
      let y = Number(label.getAttribute('y')) || 0;
      const box = label.getBBox?.();
      if (box && box.width && box.height) { x = box.x + box.width / 2; y = box.y + box.height / 2; }
      const point = pointInRoot(svg, label, x, y);
      const host = document.createElementNS(NS, 'g');
      host.dataset.glyphId = sign;
      host.dataset.glyphVariant = 'inscribed';
      host.dataset.canonCommit = CANON_COMMIT;
      host.setAttribute('transform', 'translate(' + point.x.toFixed(3) + ' ' + point.y.toFixed(3) + ')');
      host.setAttribute('aria-label', SIGNS[sign].name);
      layer.appendChild(host);
      label.style.display = 'none';
      return drawPinnedBubble(host, sign, radius);
    });

    Promise.allSettled(jobs).then(function (results) {
      const failed = results.filter(function (result) { return result.status === 'rejected'; }).length;
      svg.dataset.relphiComparisonZodiacGlyphs = JSON.stringify({ sourceCommit:CANON_COMMIT, variant:'inscribed', count:jobs.length, failed:failed });
    });
  }

  function render() {
    queued = false;
    document.querySelectorAll(WHEELS).forEach(renderWheel);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(render); });
  }

  function start() {
    queue();
    [150, 500, 1200].forEach(function (delay) { setTimeout(queue, delay); });
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();