// Live Sky Chart integrity repair: canonical ledger glyphs and completed-arcminute coordinates.
(function () {
  'use strict';
  if (window.__relphiSkyChartLiveIntegrityV1) return;
  window.__relphiSkyChartLiveIntegrityV1 = true;

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
  let repairSequence = 0;

  const norm = value => ((Number(value) % 360) + 360) % 360;

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
    return {
      sign,
      degree,
      minute,
      text:`${degree}°${String(minute).padStart(2, '0')}′`
    };
  }

  async function drawLedgerGlyph(target, entry, color, sequence) {
    if (!target || !entry || sequence !== repairSequence) return;
    const component = window.RelphiGlyphComponent;
    if (!component?.createBubble) throw new Error(`Canonical glyph component unavailable: ${entry.id}`);

    target.replaceChildren();
    target.setAttribute('viewBox', '-32 -32 64 64');
    target.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    target.setAttribute('aria-label', entry.name);

    // The canonical uncircled glyph is the canonical circled composition with only
    // the calibration circle hidden. No visible-mark fitting or recentering occurs.
    const bubble = component.createBubble(target, entry.id, {
      radius:19,
      padding:1,
      color,
      fill:'transparent',
      strokeWidth:2.35
    });
    bubble.circle.style.opacity = '0';
    bubble.circle.setAttribute('aria-hidden', 'true');
    await bubble.ready;

    if (sequence !== repairSequence || !target.isConnected) return;
    target.dataset.canonicalGlyphId = entry.id;
    target.dataset.canonicalSource = component.canonicalSource || 'canonical-bubble-component';
    target.dataset.canonicalCircle = 'hidden';
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
        if (sequence === repairSequence) document.documentElement.dataset.skyChartLiveIntegrity = 'v2';
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

  window.addEventListener('relphi:sky-foundation-ready', scheduleRepair);
  window.addEventListener('relphi:selected-relationship-rendered', repairProgressive);
  window.addEventListener('storage', event => {
    if (!event.key || event.key === KEYS.A || event.key === KEYS.B) scheduleRepair();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleRepair, { once:true });
  else scheduleRepair();
})();
