// Live Sky Chart integrity repair: native-canvas ledger glyphs and completed arcminutes.
(function () {
  'use strict';
  if (window.__relphiSkyChartLiveIntegrityV1) return;
  window.__relphiSkyChartLiveIntegrityV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_IDS = SIGN_NAMES.map(name => name.toLowerCase());
  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const SKY = { A:'#c9211e', B:'#2462d0' };
  const ALIASES = {
    rising:'asc', ascendant:'asc', asc:'asc', ac:'asc',
    descendant:'dsc', dsc:'dsc', dc:'dsc',
    midheaven:'mc', mc:'mc', 'imum coeli':'ic', imumcoeli:'ic', ic:'ic',
    vertex:'vertex', vx:'vertex',
    'north node':'north-node', node:'north-node', 'true node':'north-node',
    'south node':'south-node', fortune:'part-of-fortune',
    'part of fortune':'part-of-fortune', pof:'part-of-fortune'
  };
  const assetCache = new Map();
  let repairSequence = 0;
  let ledgerMutationTimer = 0;

  const norm = value => ((Number(value) % 360) + 360) % 360;
  const svg = name => document.createElementNS(NS, name);

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placementSource(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const known = [payload.placements, payload.positions, payload.points, payload.bodies]
      .find(value => value && typeof value === 'object');
    const source = known || payload;
    if (Array.isArray(source)) {
      return source.map((item, index) => [String(item?.name || item?.label || item?.body || item?.planet || item?.point || item?.id || index), item]);
    }
    return Object.entries(source).filter(([key, value]) =>
      value && typeof value === 'object' && !Array.isArray(value) &&
      !/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key) &&
      (Number.isFinite(Number(value.longitude)) || value.sign || value.zodiac)
    );
  }

  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(item.longitude);
    const sign = SIGN_IDS.indexOf(String(item.sign || item.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(
      sign * 30 +
      Number(item.degree || item.degrees || 0) +
      Number(item.minute || item.minutes || 0) / 60 +
      Number(item.second || item.seconds || 0) / 3600
    );
  }

  function canonicalEntry(key, item) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    for (const candidate of [item?.glyphId, item?.id, item?.name, item?.label, item?.body, item?.planet, item?.point, key]) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const alias = ALIASES[raw.toLowerCase()] || raw;
      const entry = registry.resolve(alias) || registry.get(alias);
      if (entry) return entry;
    }
    return null;
  }

  function recordsById(payload) {
    const result = new Map();
    placementSource(payload).forEach(([key, item]) => {
      const entry = canonicalEntry(key, item);
      const value = longitude(item);
      if (entry && Number.isFinite(value)) result.set(entry.id, { entry, value, item });
    });
    return result;
  }

  function completedArcminute(value) {
    const total = Math.floor(norm(value) * 60 + 1e-7);
    const sign = Math.floor(total / 1800) % 12;
    const withinSign = total % 1800;
    const degree = Math.floor(withinSign / 60);
    const minute = withinSign % 60;
    return { sign, degree, minute, text:`${degree}°${String(minute).padStart(2, '0')}′` };
  }

  async function loadAsset(path) {
    const url = new URL(path, document.baseURI).href;
    if (!assetCache.has(url)) {
      assetCache.set(url, fetch(url, { cache:'force-cache' }).then(async response => {
        if (!response.ok) throw new Error(`Could not load canonical glyph asset: ${path}`);
        const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
        if (!source || source.nodeName.toLowerCase() !== 'svg') throw new Error(`Invalid canonical glyph asset: ${path}`);
        return source;
      }));
    }
    return (await assetCache.get(url)).cloneNode(true);
  }

  function recolor(root, color) {
    const nodes = [root, ...root.querySelectorAll('[fill],[stroke],text')];
    nodes.forEach(node => {
      const tag = node.localName;
      const fill = node.getAttribute?.('fill');
      const stroke = node.getAttribute?.('stroke');
      if (tag === 'text' || (fill && fill !== 'none' && !fill.startsWith('url('))) {
        node.setAttribute('fill', color);
        node.style.setProperty('fill', color, 'important');
      }
      if (stroke && stroke !== 'none' && !stroke.startsWith('url(')) {
        node.setAttribute('stroke', color);
        node.style.setProperty('stroke', color, 'important');
      }
    });
  }

  function hiddenFrame(target, entry) {
    const root = svg('g');
    root.classList.add('relphi-glyph-bubble', 'relphi-glyph-framed');
    root.dataset.glyphId = entry.id;
    root.dataset.canonicalFraming = 'hidden-bubble';
    const circle = svg('circle');
    circle.setAttribute('r', '19');
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke', 'transparent');
    circle.setAttribute('opacity', '0');
    circle.setAttribute('aria-hidden', 'true');
    root.appendChild(circle);
    target.appendChild(root);
    return { root, circle };
  }

  async function drawAssetOnNativeCanvas(target, entry, color) {
    const source = await loadAsset(entry.asset);
    const raw = String(source.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    const [x, y, width, height] = raw.length === 4 && raw.every(Number.isFinite)
      ? raw
      : [0, 0, Number(source.getAttribute('width')) || 100, Number(source.getAttribute('height')) || 100];
    const frame = hiddenFrame(target, entry);
    const art = svg('g');
    Array.from(source.children).forEach(child => art.appendChild(document.importNode(child, true)));
    const scale = 38 / Math.max(width || 1, height || 1);
    const cx = x + width / 2;
    const cy = y + height / 2;
    art.setAttribute('transform', `matrix(${scale} 0 0 ${scale} ${-scale * cx} ${-scale * cy})`);
    art.classList.add('relphi-canonical-glyph', `relphi-glyph-${entry.id}`);
    art.dataset.relphiWhitespaceAware = 'true';
    art.dataset.relphiCanonicalGlyphId = entry.id;
    recolor(art, color);
    frame.root.appendChild(art);
    return art;
  }

  async function drawFallbackInFrame(target, entry, color) {
    const component = window.RelphiGlyphComponent;
    if (!component?.createBubble) throw new Error(`Canonical glyph component unavailable: ${entry.id}`);
    const bubble = component.createBubble(target, entry.id, {
      radius:19,
      padding:1,
      color,
      fill:'transparent',
      strokeWidth:2.35
    });
    bubble.root.classList.add('relphi-glyph-framed');
    bubble.root.dataset.canonicalFraming = 'hidden-bubble';
    bubble.circle.setAttribute('opacity', '0');
    bubble.circle.setAttribute('aria-hidden', 'true');
    bubble.circle.style.setProperty('opacity', '0', 'important');
    const art = await bubble.ready;
    recolor(art, color);
    art.dataset.relphiWhitespaceAware = 'true';
    art.dataset.relphiCanonicalGlyphId = entry.id;
    return art;
  }

  async function drawLedgerGlyph(target, entry, color, sequence) {
    if (!target || !entry || sequence !== repairSequence) return;
    target.replaceChildren();
    target.setAttribute('viewBox', '-22 -22 44 44');
    target.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    target.setAttribute('aria-label', entry.name);

    if (entry.asset) await drawAssetOnNativeCanvas(target, entry, color);
    else await drawFallbackInFrame(target, entry, color);

    if (sequence !== repairSequence || !target.isConnected) return;
    target.dataset.canonicalGlyphId = entry.id;
    target.dataset.canonicalSource = entry.asset || 'approved-registry-fallback';
    target.dataset.canonicalCircle = 'hidden';
    target.dataset.canonicalFit = entry.asset ? 'native-canvas' : 'fallback-frame';
  }

  async function repairLedger(slot, sequence) {
    const panel = document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
    if (!panel) return;
    const records = recordsById(read(KEYS[slot]));
    const jobs = [];

    panel.querySelectorAll('.sky-foundation-row').forEach(row => {
      const name = row.querySelector('.sky-foundation-row-name')?.textContent?.trim() || '';
      const resolved = window.RelphiGlyphRegistry?.resolve(row.dataset.placement || name);
      const id = resolved?.id || row.dataset.placement;
      const record = records.get(id);
      if (!record) return;

      const position = completedArcminute(record.value);
      const coordinate = row.querySelector('.sky-foundation-coordinate');
      if (coordinate) coordinate.textContent = `${position.text} ${SIGN_NAMES[position.sign]}`;

      row.dataset.placement = record.entry.id;
      row.dataset.sign = String(position.sign);
      const target = row.querySelector('svg');
      if (target) jobs.push(drawLedgerGlyph(target, record.entry, SKY[slot], sequence));
    });

    await Promise.allSettled(jobs);
  }

  function repairLedgers() {
    const sequence = ++repairSequence;
    Promise.allSettled([repairLedger('A', sequence), repairLedger('B', sequence)])
      .then(() => {
        if (sequence === repairSequence) document.documentElement.dataset.skyChartLiveIntegrity = 'v5';
      });
  }

  function repairProgressiveDegree(section, field, record) {
    if (!section || !record || !Number.isFinite(Number(record.value))) return;
    const token = section.querySelector(`[data-progressive-field="${field}"]`);
    if (!token) return;
    const position = completedArcminute(record.value);
    const sign = SIGN_NAMES[position.sign];
    const glyphButton = token.querySelector('[data-progressive-level="glyph"]');
    const glyphText = glyphButton?.querySelector('span');
    if (glyphText) glyphText.textContent = position.text;
    if (glyphButton) glyphButton.setAttribute('aria-label', `Reveal ${position.text} in ${sign}`);
    const nameButton = token.querySelector('[data-progressive-level="name"]');
    if (nameButton) nameButton.textContent = `${position.text} in ${sign}`;
  }

  function repairProgressive(event) {
    const relation = event.detail?.relation;
    if (!relation) return;
    setTimeout(() => {
      const section = document.querySelector('#skySelectedRelationship .sky-selected-progressive');
      repairProgressiveDegree(section, 'A-degree', relation.left);
      repairProgressiveDegree(section, 'B-degree', relation.right);
    }, 0);
  }

  function scheduleRepair() {
    requestAnimationFrame(() => {
      repairLedgers();
      setTimeout(repairLedgers, 80);
    });
  }

  function mutationAddsLedger(mutation) {
    return Array.from(mutation.addedNodes || []).some(node =>
      node.nodeType === 1 && (
        node.matches?.('.sky-foundation-ledger,.sky-foundation-row') ||
        node.querySelector?.('.sky-foundation-ledger,.sky-foundation-row')
      )
    );
  }

  const ledgerObserver = new MutationObserver(mutations => {
    if (!mutations.some(mutationAddsLedger)) return;
    clearTimeout(ledgerMutationTimer);
    ledgerMutationTimer = setTimeout(scheduleRepair, 0);
  });

  function start() {
    ledgerObserver.observe(document.documentElement, { childList:true, subtree:true });
    scheduleRepair();
  }

  window.addEventListener('relphi:sky-foundation-ready', scheduleRepair);
  window.addEventListener('relphi:selected-relationship-rendered', repairProgressive);
  window.addEventListener('storage', event => {
    if (!event.key || event.key === KEYS.A || event.key === KEYS.B) scheduleRepair();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
