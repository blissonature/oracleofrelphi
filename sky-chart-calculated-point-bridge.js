// Hidden placement enrichment stage for Sky A and Sky B.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const CANONICAL = {
    node:'North Node', northnode:'North Node', truenode:'North Node', meannode:'North Node',
    southnode:'South Node', descendingnode:'South Node', snode:'South Node',
    lilith:'Lilith', blackmoon:'Lilith', blackmoonlilith:'Lilith', meanlilith:'Lilith',
    chiron:'Chiron', vertex:'Vertex', vx:'Vertex',
    fortune:'Part of Fortune', partoffortune:'Part of Fortune', lotoffortune:'Part of Fortune', parsfortunae:'Part of Fortune', pof:'Part of Fortune',
    rising:'Ascendant', asc:'Ascendant', ascendant:'Ascendant'
  };
  const queues = new Map();
  const lastSignatures = new Map();

  function normalizeKey(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function canonicalLabel(value) {
    return CANONICAL[normalizeKey(value)] || String(value || '').trim();
  }

  function readJson(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }

  function placementSource(payload) {
    return payload && payload.placements && typeof payload.placements === 'object' ? payload.placements : payload;
  }

  function normalizePlacements(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
    const source = placementSource(payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return payload;
    const placements = {};
    Object.entries(source).forEach(function ([name, placement]) {
      placements[canonicalLabel(name)] = placement;
    });
    return payload.placements && typeof payload.placements === 'object'
      ? Object.assign({}, payload, { placements })
      : placements;
  }

  function longitude(placement) {
    if (!placement || typeof placement !== 'object') return null;
    const signIndex = SIGNS.findIndex(function (sign) { return normalizeKey(sign) === normalizeKey(placement.sign); });
    const degree = Number(placement.degree);
    const minute = Number(placement.minute || 0);
    if (signIndex < 0 || !Number.isFinite(degree) || !Number.isFinite(minute)) return null;
    return (signIndex * 30 + degree + minute / 60 + 360) % 360;
  }

  function placementFromLongitude(value, template) {
    const normalized = ((Number(value) % 360) + 360) % 360;
    const signIndex = Math.floor(normalized / 30);
    const within = normalized - signIndex * 30;
    let degree = Math.floor(within);
    let minute = Math.round((within - degree) * 60);
    if (minute === 60) { minute = 0; degree += 1; }
    if (degree === 30) { degree = 0; return Object.assign({}, template || {}, { sign:SIGNS[(signIndex + 1) % 12], degree, minute }); }
    return Object.assign({}, template || {}, { sign:SIGNS[signIndex], degree, minute });
  }

  function deriveSouthNode(placements) {
    if (placements['South Node']) return null;
    const north = placements['North Node'];
    const northLongitude = longitude(north);
    return northLongitude == null ? null : placementFromLongitude(northLongitude + 180, north);
  }

  function dayChart(payload, placements) {
    const profile = payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
    if (typeof profile.isDayChart === 'boolean') return profile.isDayChart;
    if (typeof profile.dayChart === 'boolean') return profile.dayChart;
    const sunHouse = Number(placements.Sun && placements.Sun.house);
    if (Number.isFinite(sunHouse) && sunHouse >= 1 && sunHouse <= 12) return sunHouse >= 7 && sunHouse <= 12;
    return null;
  }

  function deriveFortune(payload, placements) {
    if (placements['Part of Fortune']) return null;
    const asc = longitude(placements.Ascendant);
    const sun = longitude(placements.Sun);
    const moon = longitude(placements.Moon);
    const isDay = dayChart(payload, placements);
    if (asc == null || sun == null || moon == null || isDay == null) return null;
    return placementFromLongitude(isDay ? asc + moon - sun : asc + sun - moon);
  }

  function mergePlacements(payload, additions) {
    const normalized = normalizePlacements(payload);
    const placements = Object.assign({}, placementSource(normalized) || {});
    Object.entries(additions || {}).forEach(function ([name, placement]) {
      if (placement && typeof placement === 'object') placements[canonicalLabel(name)] = placement;
    });
    return normalized && normalized.placements && typeof normalized.placements === 'object'
      ? Object.assign({}, normalized, { placements })
      : placements;
  }

  async function externalEnrichment(slot, payload) {
    const candidates = [
      window.RelphiSkyPlacementEnricher,
      window.RelphiSkyChartCalculator,
      window.RelphiSkyCalculator
    ];
    for (const candidate of candidates) {
      if (candidate && typeof candidate.enrichPlacements === 'function') {
        const result = await candidate.enrichPlacements(payload, { slot, silent:true });
        if (result) return result;
      }
    }
    return await new Promise(function (resolve) {
      let settled = false;
      const finish = function (result) { if (!settled) { settled = true; resolve(result || null); } };
      window.dispatchEvent(new CustomEvent('relphi:request-placement-enrichment', {
        detail:{ slot, payload, complete:finish }
      }));
      setTimeout(function () { finish(null); }, 1200);
    });
  }

  function signature(payload) {
    const source = placementSource(normalizePlacements(payload)) || {};
    return Object.keys(source).sort().map(function (name) {
      const item = source[name] || {};
      return [name,item.sign || '',item.degree ?? '',item.minute ?? '',item.house ?? ''].join(':');
    }).join('|');
  }

  async function enrichPayload(slot, payload) {
    let enriched = normalizePlacements(payload);
    const external = await externalEnrichment(slot, enriched);
    if (external) enriched = mergePlacements(enriched, placementSource(normalizePlacements(external)) || {});
    const placements = Object.assign({}, placementSource(enriched) || {});
    const southNode = deriveSouthNode(placements);
    if (southNode) placements['South Node'] = southNode;
    const fortune = deriveFortune(enriched, placements);
    if (fortune) placements['Part of Fortune'] = fortune;
    enriched = enriched && enriched.placements && typeof enriched.placements === 'object'
      ? Object.assign({}, enriched, { placements })
      : placements;
    return enriched;
  }

  function reloadSlot(slot) {
    document.getElementById(slot === 'skyB' ? 'loadCurrentSky' : 'loadChart')?.click();
    window.RelphiCanonicalSkyGlyphs?.refresh?.();
  }

  function queueSlot(slot, reason) {
    const key = SLOT_KEYS[slot];
    const previous = queues.get(slot) || Promise.resolve();
    const next = previous.then(async function () {
      const payload = readJson(key, null);
      if (!payload) return null;
      const before = signature(payload);
      if (reason === 'observer' && lastSignatures.get(slot) === before) return payload;
      const enriched = await enrichPayload(slot, payload);
      const after = signature(enriched);
      lastSignatures.set(slot, after);
      if (after !== before) {
        writeJson(key, enriched);
        reloadSlot(slot);
        window.dispatchEvent(new CustomEvent('relphi:placements-enriched', {
          detail:{ slot, reason, before, after, payload:enriched }
        }));
      }
      return enriched;
    }).catch(function (error) {
      console.error('Sky placement enrichment failed:', slot, error);
      return null;
    });
    queues.set(slot, next);
    return next;
  }

  function enrichLibrary() {
    const records = readJson(LIBRARY_KEY, []);
    if (!Array.isArray(records)) return Promise.resolve(false);
    return Promise.all(records.map(function (record, index) {
      return enrichPayload('library', record).then(function (enriched) { return { index, enriched }; });
    })).then(function (results) {
      let changed = false;
      results.forEach(function ({ index, enriched }) {
        if (signature(records[index]) !== signature(enriched)) { records[index] = enriched; changed = true; }
      });
      if (changed) writeJson(LIBRARY_KEY, records);
      return changed;
    });
  }

  function slotFromTarget(target) {
    const explicit = target && target.closest && target.closest('[data-slot="skyB"],[data-sky="b"],#currentSkyOutput');
    if (explicit) return 'skyB';
    const nativeTarget = document.getElementById('skyCalcTarget')?.value || document.getElementById('skyCreatorTarget')?.value || '';
    return normalizeKey(nativeTarget) === 'currentsky' ? 'skyB' : 'skyA';
  }

  function installTriggers() {
    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('#skyCalcRun,#skyCreatorSaveWizard,#saveChart,#saveCurrentSky,[data-action="finish-placements"],[data-load-name],[data-action="load-saved"]');
      if (!trigger) return;
      const slot = slotFromTarget(trigger);
      setTimeout(function () { queueSlot(slot, trigger.id || trigger.dataset.action || 'user'); }, 0);
      setTimeout(function () { queueSlot(slot, 'settled'); }, 250);
    }, true);

    window.addEventListener('storage', function (event) {
      if (event.key === SLOT_KEYS.skyA) queueSlot('skyA', 'storage');
      if (event.key === SLOT_KEYS.skyB) queueSlot('skyB', 'storage');
    });

    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        queueSlot('skyA', 'observer');
        queueSlot('skyB', 'observer');
      });
    }).observe(document.body, { childList:true, subtree:true });
  }

  function start() {
    installTriggers();
    queueSlot('skyA', 'startup');
    queueSlot('skyB', 'startup');
    enrichLibrary();
    window.addEventListener('relphi:sky-builder-v4-loaded', function () {
      queueSlot('skyA', 'builder');
      queueSlot('skyB', 'builder');
    });
    window.RelphiCalculatedPointBridge = Object.freeze({
      enrich:function (slot, payload) { return enrichPayload(slot, payload); },
      refresh:function () { return Promise.all([queueSlot('skyA','manual'), queueSlot('skyB','manual')]); },
      canonicalLabel
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();