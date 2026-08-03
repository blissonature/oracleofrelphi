// Keep placement ledgers on the shared canonical glyph component and completed arcminutes.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyChartLiveIntegrityV6) return;
  window.__relphiSkyChartLiveIntegrityV6 = true;

  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
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
  let sequence = 0;
  let timer = 0;

  const norm = value => ((Number(value) % 360) + 360) % 360;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function sourceEntries(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const source = [payload.placements, payload.positions, payload.points, payload.bodies]
      .find(value => value && typeof value === 'object') || payload;
    if (Array.isArray(source)) {
      return source.map((item, index) => [String(item?.name || item?.label || item?.id || index), item]);
    }
    return Object.entries(source).filter(([key, item]) =>
      item && typeof item === 'object' && !Array.isArray(item) &&
      !/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)
    );
  }

  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const sign = SIGN_NAMES.findIndex(name => name.toLowerCase() === String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60 + Number(item.second || 0) / 3600);
  }

  function canonicalEntry(key, item) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    for (const candidate of [item?.glyphId, item?.id, item?.name, item?.label, key]) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const alias = ALIASES[raw.toLowerCase()] || raw;
      const entry = registry.resolve(alias) || registry.get(alias);
      if (entry) return entry;
    }
    return null;
  }

  function records(payload) {
    const map = new Map();
    sourceEntries(payload).forEach(([key, item]) => {
      const entry = canonicalEntry(key, item);
      const value = longitude(item);
      if (entry && Number.isFinite(value)) map.set(entry.id, { entry, value });
    });
    return map;
  }

  function completedArcminute(value) {
    const total = Math.floor(norm(value) * 60 + 1e-7);
    const sign = Math.floor(total / 1800) % 12;
    const within = total % 1800;
    const degree = Math.floor(within / 60);
    const minute = within % 60;
    return { sign, text:`${degree}°${String(minute).padStart(2, '0')}′` };
  }

  async function ensureCanonicalGlyph(target, entry, color, currentSequence) {
    if (!target || !entry || currentSequence !== sequence) return;
    const existing = target.querySelector(`.relphi-glyph-${entry.id}[data-relphi-atomic-commit="true"]`);
    if (!existing) {
      target.replaceChildren();
      target.setAttribute('viewBox', '-20 -20 40 40');
      target.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      target.setAttribute('aria-label', entry.name);
      const component = window.RelphiGlyphComponent;
      if (!component?.draw) throw new Error(`Canonical glyph component unavailable: ${entry.id}`);
      await component.draw(target, entry.id, { radius:16, padding:1, color });
    }
    if (currentSequence !== sequence || !target.isConnected) return;
    target.dataset.canonicalGlyphId = entry.id;
    target.dataset.canonicalSource = window.RelphiGlyphComponent?.canonicalSource || 'registry-component';
    target.dataset.canonicalFit = 'registry-component';
  }

  async function repairLedger(slot, currentSequence) {
    const panel = document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
    if (!panel) return;
    const byId = records(read(KEYS[slot]));
    const jobs = [];
    panel.querySelectorAll('.sky-foundation-row').forEach(row => {
      const name = row.querySelector('.sky-foundation-row-name')?.textContent?.trim() || '';
      const resolved = window.RelphiGlyphRegistry?.resolve(row.dataset.placement || name);
      const id = resolved?.id || row.dataset.placement;
      const record = byId.get(id);
      if (!record) return;
      const position = completedArcminute(record.value);
      const coordinate = row.querySelector('.sky-foundation-coordinate');
      if (coordinate) coordinate.textContent = `${position.text} ${SIGN_NAMES[position.sign]}`;
      row.dataset.placement = record.entry.id;
      row.dataset.sign = String(position.sign);
      const target = row.querySelector('svg');
      if (target) jobs.push(ensureCanonicalGlyph(target, record.entry, SKY[slot], currentSequence));
    });
    await Promise.allSettled(jobs);
  }

  function repairLedgers() {
    const currentSequence = ++sequence;
    Promise.allSettled([repairLedger('A', currentSequence), repairLedger('B', currentSequence)])
      .then(() => {
        if (currentSequence === sequence) document.documentElement.dataset.skyChartLiveIntegrity = 'v6';
      });
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => requestAnimationFrame(repairLedgers), 0);
  }

  function addsLedger(record) {
    return Array.from(record.addedNodes || []).some(node => node.nodeType === 1 && (
      node.matches?.('.sky-foundation-ledger,.sky-foundation-row') ||
      node.querySelector?.('.sky-foundation-ledger,.sky-foundation-row')
    ));
  }

  function start() {
    new MutationObserver(records => {
      if (records.some(addsLedger)) schedule();
    }).observe(document.documentElement, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-foundation-ready', schedule);
    window.addEventListener('relphi:sky-foundation-interactions-ready', schedule);
    window.addEventListener('storage', event => {
      if (!event.key || event.key === KEYS.A || event.key === KEYS.B) schedule();
    });
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
