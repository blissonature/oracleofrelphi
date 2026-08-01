// Maps the canonical relationship list to the hidden native card/interpretation
// records by semantic identity. Index-only mismatches are blocked.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyContractNativeMapV1) return;
  window.__relphiSkyContractNativeMapV1 = true;

  const EXPLICIT = '[data-relationship-index],.relationship-row,.relphi-relationship-row,.relationship-list-row,[data-relphi-relationship]';
  const ASPECT_ALIASES = Object.freeze({
    conjunction:['conjunction','☌'],
    'semi-sextile':['semi-sextile','semisextile','⚺'],
    octile:['octile','semisquare','semi-square','∠'],
    sextile:['sextile','✶','⚹'],
    quintile:['quintile','q'],
    square:['square','□'],
    trine:['trine','△'],
    'tri-octile':['tri-octile','sesquiquadrate','sesquisquare','⚼'],
    'bi-quintile':['bi-quintile','biquintile','bq'],
    quincunx:['quincunx','inconjunct','⚻'],
    opposition:['opposition','☍']
  });
  const BODY_ALIASES = Object.freeze({
    sun:['sun','☉'], moon:['moon','☽'], mercury:['mercury','☿'], venus:['venus','♀'], mars:['mars','♂'],
    jupiter:['jupiter','♃'], saturn:['saturn','♄'], uranus:['uranus','♅'], neptune:['neptune','♆'], pluto:['pluto','⯓','♇'],
    chiron:['chiron','⚷'], lilith:['lilith'], 'north-node':['north node','true node'], 'south-node':['south node'],
    asc:['ascendant','rising',' asc '], dsc:['descendant',' dsc '], mc:['midheaven',' mc '], ic:['imum coeli',' ic '],
    vertex:['vertex',' vx '], 'part-of-fortune':['part of fortune','fortune']
  });

  let pending = null;
  let observer = null;
  let mapQueued = false;

  function normalize(value) {
    return (' ' + String(value || '').toLowerCase().replace(/[\s\u00a0]+/g, ' ').replace(/[–—]/g, '-') + ' ');
  }

  function canonicalId(value) {
    if (!value) return '';
    const entry = window.RelphiGlyphRegistry?.get(value) || window.RelphiGlyphRegistry?.resolve(value);
    return entry?.id || String(value).trim().toLowerCase().replace(/\s+/g, '-');
  }

  function semanticText(node) {
    if (!node) return '';
    const values = [node.textContent, node.getAttribute?.('aria-label'), node.getAttribute?.('title')];
    node.querySelectorAll?.('[aria-label],[title],img[alt],svg[aria-label]').forEach(child => {
      values.push(child.getAttribute('aria-label'), child.getAttribute('title'), child.getAttribute('alt'));
    });
    return normalize(values.filter(Boolean).join(' | '));
  }

  function explicitIdentity(host) {
    const source = host?.matches?.('button,summary,a,[role="button"]') ? host : host?.querySelector?.('button,summary,a,[role="button"]');
    const read = names => {
      for (const node of [host, source]) {
        for (const name of names) {
          const value = node?.dataset?.[name];
          if (value) return value;
        }
      }
      return '';
    };
    const aId = canonicalId(read(['relphiAId','skyAPlacement','aId','firstPlacement']));
    const bId = canonicalId(read(['relphiBId','skyBPlacement','bId','secondPlacement']));
    const aspectId = canonicalId(read(['relphiAspectId','aspect','aspectId']));
    const orb = Number(read(['relphiOrb','orb']));
    return { aId, bId, aspectId, orb };
  }

  function aliasesForBody(id) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry?.get(id) || registry?.resolve(id);
    return Array.from(new Set([id.replace(/-/g, ' '), entry?.name, ...(BODY_ALIASES[id] || [])].filter(Boolean).map(value => normalize(value).trim())));
  }

  function aliasesForAspect(id) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry?.get(id) || registry?.resolve(id);
    return Array.from(new Set([id.replace(/-/g, ' '), entry?.name, ...(ASPECT_ALIASES[id] || [])].filter(Boolean).map(value => normalize(value).trim())));
  }

  function containsAlias(text, aliases) {
    return aliases.some(alias => text.includes(' ' + alias + ' ') || text.includes(alias));
  }

  function relationModels() {
    const svg = document.querySelector('#relphiComparisonWheelMount>.scn-live-wheel[data-ready="true"]');
    if (!svg) return [];
    return Array.from(svg.querySelectorAll('[data-interactive="aspect"][data-aspect-index]')).map(line => ({
      index:Number(line.dataset.aspectIndex),
      aId:canonicalId(line.dataset.skyAPlacement),
      bId:canonicalId(line.dataset.skyBPlacement),
      aspectId:canonicalId(line.dataset.aspect),
      orb:Number(line.dataset.orb),
      line
    })).filter(model => Number.isInteger(model.index) && model.aId && model.bId && model.aspectId);
  }

  function clickable(node) {
    return node?.matches?.('button,summary,a,[role="button"]') ? node : node?.querySelector?.('button,summary,a,[role="button"]');
  }

  function candidateHosts() {
    const output = document.getElementById('chartOutput');
    if (!output) return [];
    const candidates = new Set(Array.from(output.querySelectorAll(EXPLICIT)));
    output.querySelectorAll('button,summary,a,[role="button"]').forEach(control => {
      let node = control;
      for (let depth = 0; node && node !== output && depth < 5; depth += 1, node = node.parentElement) {
        const identity = explicitIdentity(node);
        const text = semanticText(node);
        if ((identity.aId && identity.bId && identity.aspectId) || (text.length >= 20 && text.length <= 2400 && /orb|°|conjunction|opposition|square|trine|sextile|quincunx|quintile|octile|☌|☍|□|△|✶|⚻/.test(text))) candidates.add(node);
      }
    });
    const list = Array.from(candidates).filter(node => clickable(node));
    return list.filter(node => !list.some(other => other !== node && node.contains(other) && (explicitIdentity(other).aId || semanticText(other).length >= 20)));
  }

  function orbFromText(text) {
    let match = text.match(/orb\s*:?[ ]*(\d{1,2})°[ ]*(\d{1,2})[′']/i);
    if (match) return Number(match[1]) + Number(match[2]) / 60;
    match = text.match(/orb\s*:?[ ]*(\d+(?:\.\d+)?)°?/i);
    return match ? Number(match[1]) : NaN;
  }

  function score(model, host) {
    const identity = explicitIdentity(host);
    if (identity.aId || identity.bId || identity.aspectId) {
      if (identity.aId !== model.aId || identity.bId !== model.bId || identity.aspectId !== model.aspectId) return -1;
      let value = 30;
      if (Number.isFinite(identity.orb) && Number.isFinite(model.orb)) {
        const delta = Math.abs(identity.orb - model.orb);
        if (delta <= .03) value += 5;
        else if (delta > .5) value -= 8;
      }
      return value;
    }

    const text = semanticText(host);
    const aAliases = aliasesForBody(model.aId);
    const bAliases = aliasesForBody(model.bId);
    const aspectAliases = aliasesForAspect(model.aspectId);
    if (!containsAlias(text, aAliases) || !containsAlias(text, bAliases) || !containsAlias(text, aspectAliases)) return -1;
    let value = 12;
    const parsedOrb = orbFromText(text);
    if (Number.isFinite(parsedOrb) && Number.isFinite(model.orb)) {
      const delta = Math.abs(parsedOrb - model.orb);
      if (delta <= .03) value += 5;
      else if (delta <= .12) value += 3;
      else if (delta > .5) value -= 4;
    }
    if (clickable(host) === host) value += 1;
    return value;
  }

  function mapRows() {
    mapQueued = false;
    const models = relationModels();
    const hosts = candidateHosts();
    if (!models.length || !hosts.length) return false;
    const assigned = new Set();
    models.forEach(model => {
      const ranked = hosts.map(host => ({ host, score:score(model, host) })).filter(item => item.score >= 12 && !assigned.has(item.host)).sort((a, b) => b.score - a.score);
      const match = ranked[0]?.host;
      if (!match) return;
      assigned.add(match);
      match.dataset.relationshipIndex = String(model.index);
      match.dataset.relphiContractRelationKey = `${model.aId}|${model.aspectId}|${model.bId}`;
      const control = clickable(match);
      if (control) {
        control.dataset.relationshipIndex = String(model.index);
        control.dataset.relphiContractRelationKey = match.dataset.relphiContractRelationKey;
      }
    });
    return assigned.size > 0;
  }

  function queueMap() {
    if (mapQueued) return;
    mapQueued = true;
    requestAnimationFrame(mapRows);
  }

  function nativeHost(target) {
    return target?.closest?.('#chartOutput [data-relationship-index],#chartOutput .relationship-row,#chartOutput .relphi-relationship-row,#chartOutput .relationship-list-row,#chartOutput [data-relphi-relationship]') || null;
  }

  function showMatchFailure(index) {
    if (!pending || pending.index !== index) return;
    pending = null;
    const reveal = document.querySelector('#relphiSelectedRelationshipMount .relphi-contract-selected-reveal');
    if (reveal) reveal.innerHTML = '<p class="relphi-contract-selected-empty">The relationship was selected, but its native card interpretation could not be matched safely. No substitute or unrelated cards were shown.</p>';
  }

  document.addEventListener('click', event => {
    const publicRow = event.target.closest?.('.relphi-contract-relationship-row[data-relationship-index]');
    if (publicRow) {
      const index = Number(publicRow.dataset.relationshipIndex);
      if (Number.isInteger(index)) {
        pending = { index, started:Date.now() };
        queueMap();
        setTimeout(() => showMatchFailure(index), 700);
      }
      return;
    }

    if (!pending || !event.target.closest?.('#chartOutput')) return;
    const host = nativeHost(event.target);
    const index = Number(host?.dataset.relationshipIndex ?? event.target.closest?.('[data-relationship-index]')?.dataset.relationshipIndex);
    if (index !== pending.index) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    pending = null;
  }, true);

  function start() {
    queueMap();
    const output = document.getElementById('chartOutput');
    if (output && !observer) {
      observer = new MutationObserver(queueMap);
      observer.observe(output, { childList:true, subtree:true });
    }
    window.addEventListener('relphi:relationships-rendered', queueMap);
    window.addEventListener('relphi:sky-chart-next-display-ready', queueMap);
  }

  window.RelphiSkyContractNativeMap = Object.freeze({ mapRows, relationModels, candidateHosts, score });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
