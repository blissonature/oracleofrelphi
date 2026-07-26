// Separates structural chart relationships from the ordinary aspect list.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const HOST_ID = 'relphiStructuralRelationshipSections';
  let queued = false;
  let running = false;

  function text(row) { return String(row.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function hasAny(value, terms) { return terms.some(function (term) { return value.indexOf(term) !== -1; }); }
  function identities(row) {
    const value = text(row);
    const found = new Set();
    if (hasAny(value, ['asc', 'ascendant', 'rising'])) found.add('ASC');
    if (hasAny(value, ['dsc', 'descendant'])) found.add('DSC');
    if (hasAny(value, ['mc', 'midheaven'])) found.add('MC');
    if (hasAny(value, ['ic', 'imum coeli'])) found.add('IC');
    if (hasAny(value, ['☊', 'north node'])) found.add('NN');
    if (hasAny(value, ['☋', 'south node'])) found.add('SN');
    return found;
  }
  function pair(found, a, b) { return found.size === 2 && found.has(a) && found.has(b); }
  function aspect(row) {
    if (row.classList.contains('aspect-opposition')) return 'opposition';
    if (row.classList.contains('aspect-square')) return 'square';
    if (row.classList.contains('aspect-conjunction')) return 'conjunction';
    const value = text(row);
    if (value.includes('☍') || /\bopposition\b/.test(value)) return 'opposition';
    if (value.includes('□') || /\bsquare\b/.test(value)) return 'square';
    if (value.includes('☌') || /\bconjunction\b/.test(value)) return 'conjunction';
    return '';
  }
  function classify(row) {
    const found = identities(row), kind = aspect(row);
    if (kind === 'opposition' && (pair(found, 'ASC', 'DSC') || pair(found, 'MC', 'IC') || pair(found, 'NN', 'SN'))) return 'axes';
    if (kind === 'square' && (pair(found, 'ASC', 'MC') || pair(found, 'ASC', 'IC') || pair(found, 'DSC', 'MC') || pair(found, 'DSC', 'IC'))) return 'frame';
    return '';
  }
  function axisSelf(row) {
    const found = identities(row);
    return aspect(row) === 'conjunction' && found.size === 1 && ['ASC','DSC','MC','IC','NN','SN'].includes(Array.from(found)[0]);
  }
  function structuralKey(row) {
    return aspect(row) + '|' + Array.from(identities(row)).sort().join('|');
  }
  function section(kind, title) {
    const node = document.createElement('section');
    node.className = 'relphi-relationship-subsection relphi-relationship-' + kind;
    node.dataset.relationshipSection = kind;
    node.innerHTML = '<div class="relphi-relationship-subsection-heading"><h3>' + title + '</h3><span class="relphi-relationship-subsection-count" aria-label="0 relationships">0</span></div><div class="relphi-relationship-subsection-list" role="list"></div>';
    return node;
  }
  function styles() {
    if (document.getElementById('relphi-relationship-section-styles')) return;
    const style = document.createElement('style');
    style.id = 'relphi-relationship-section-styles';
    style.textContent = [
      '.relphi-structural-relationship-sections{display:grid;gap:1rem;margin:0 0 1rem;padding:1rem;border:1px solid rgba(0,0,0,.14);border-radius:1.15rem;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.035)}',
      '.relphi-relationship-subsection{display:grid;gap:.65rem}',
      '.relphi-relationship-subsection-heading{display:flex;align-items:center;justify-content:space-between;gap:.75rem}',
      '.relphi-relationship-subsection-heading h3{margin:0;font-size:1.05rem;line-height:1.2}',
      '.relphi-relationship-subsection-count{display:inline-flex;align-items:center;justify-content:center;min-width:2rem;min-height:2rem;padding:.2rem .55rem;border-radius:999px;background:rgba(220,31,24,.08);border:1px solid rgba(220,31,24,.22);font-size:.78rem;font-weight:900}',
      '.relphi-relationship-subsection-list{display:grid;gap:.55rem}',
      '.relphi-structural-relationship-sections[data-two-skies="true"] .relphi-relationship-axes .relphi-relationship-subsection-list{grid-template-columns:repeat(2,minmax(0,1fr))}',
      '.relphi-relationship-subsection[hidden]{display:none}',
      '@media(max-width:680px){.relphi-structural-relationship-sections[data-two-skies="true"] .relphi-relationship-axes .relphi-relationship-subsection-list{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(style);
  }
  function ordinaryHeading() {
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')).find(function (node) { return /^relationships$/i.test(String(node.textContent || '').trim()); }) || null;
  }
  function relationshipsPanel(list) {
    const heading = ordinaryHeading();
    if (!heading) return list.parentElement || list;
    let node = heading;
    let candidate = null;
    while (node && node !== document.body) {
      if (node.contains(list)) candidate = node;
      if (candidate && node.parentElement && !node.parentElement.contains(list)) break;
      node = node.parentElement;
    }
    return candidate || list.parentElement || list;
  }
  function ordinaryCount(count) {
    const heading = ordinaryHeading();
    const row = heading && heading.parentElement;
    if (!row) return;
    const candidates = Array.from(row.querySelectorAll('span,strong,output,div')).filter(function (node) { return node !== heading && /^\d+$/.test(String(node.textContent || '').trim()); });
    const badge = candidates.find(function (node) { return /count|badge/i.test(node.className || '') || node.getAttribute('aria-label'); }) || candidates[candidates.length - 1];
    if (!badge) return;
    badge.textContent = String(count);
    badge.setAttribute('aria-label', count + (count === 1 ? ' relationship' : ' relationships'));
  }
  function ensureHost(list) {
    const panel = relationshipsPanel(list);
    let host = document.getElementById(HOST_ID);
    if (!host) {
      host = document.createElement('div');
      host.id = HOST_ID;
      host.className = 'relphi-structural-relationship-sections';
      host.appendChild(section('axes', 'Chart Axes'));
      host.appendChild(section('frame', 'Angular Frame'));
    }
    if (panel && panel.parentElement && (host.parentElement !== panel.parentElement || host.nextElementSibling !== panel)) panel.parentElement.insertBefore(host, panel);
    host.dataset.twoSkies = localStorage.getItem('relphiSkyChartB') ? 'true' : 'false';
    return host;
  }
  function update(sectionNode) {
    const count = sectionNode.querySelectorAll(':scope > .relphi-relationship-subsection-list > .relationship-list-row').length;
    sectionNode.hidden = count === 0;
    const badge = sectionNode.querySelector('.relphi-relationship-subsection-count');
    if (badge) {
      badge.textContent = String(count);
      badge.setAttribute('aria-label', count + (count === 1 ? ' relationship' : ' relationships'));
    }
  }
  function organize() {
    if (running) return;
    running = true;
    try {
      styles();
      const rows = Array.from(document.querySelectorAll('.relationship-list-row'));
      if (!rows.length) return;
      const list = rows.find(function (row) { return !classify(row) && !axisSelf(row) && !row.closest('.relphi-structural-relationship-sections'); })?.parentElement || rows.find(function (row) { return !row.closest('.relphi-structural-relationship-sections'); })?.parentElement;
      if (!list) return;
      const host = ensureHost(list);
      const axes = host.querySelector('[data-relationship-section="axes"] .relphi-relationship-subsection-list');
      const frame = host.querySelector('[data-relationship-section="frame"] .relphi-relationship-subsection-list');
      const seenAxes = new Set();
      rows.forEach(function (row) {
        const group = classify(row);
        if (axisSelf(row)) {
          row.remove();
          return;
        }
        if (group === 'axes') {
          const key = structuralKey(row);
          if (seenAxes.has(key)) {
            row.remove();
            return;
          }
          seenAxes.add(key);
        }
        const target = group === 'axes' ? axes : group === 'frame' ? frame : list;
        if (row.parentElement !== target) target.appendChild(row);
      });
      update(host.querySelector('[data-relationship-section="axes"]'));
      update(host.querySelector('[data-relationship-section="frame"]'));
      ordinaryCount(list.querySelectorAll(':scope > .relationship-list-row').length);
    } finally { running = false; }
  }
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; organize(); });
  }
  function start() {
    organize();
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true, characterData:true });
    document.addEventListener('relphi:skyroleschange', queue);
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();