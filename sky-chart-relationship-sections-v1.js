// Separates structural chart relationships from the ordinary aspect list.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const HOST_ID = 'relphiStructuralRelationshipSections';
  let queued = false;
  let running = false;

  function text(row) { return String(row.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function hasAny(value, terms) { return terms.some(function (term) { return value.indexOf(term) !== -1; }); }
  function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } }
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
  function rowSkyName(row) {
    const value = String(row.textContent || '').replace(/\s+/g, ' ').trim();
    let match = value.match(/^Between\s+(.+?)\s+and\s+(.+?),/i);
    if (match && match[1].trim().toLowerCase() === match[2].trim().toLowerCase()) return match[1].trim().toLowerCase();
    match = value.match(/^(.+?)[’']s\s+.+?\s+connects with\s+(.+?)[’']s\s+/i);
    if (match && match[1].trim().toLowerCase() === match[2].trim().toLowerCase()) return match[1].trim().toLowerCase();
    return '';
  }
  function skyNames() {
    const a = readJson('relphiSkyChartA', {}), b = readJson('relphiSkyChartB', {});
    return { a:String(a && a.name || '').trim().toLowerCase(), b:String(b && b.name || '').trim().toLowerCase() };
  }
  function skyRole(row) {
    const name = rowSkyName(row), names = skyNames();
    if (name && names.b && name === names.b) return 'b';
    return 'a';
  }
  function structuralKey(row) {
    return skyRole(row) + '|' + aspect(row) + '|' + Array.from(identities(row)).sort().join('|');
  }
  function axisOrder(row) {
    const found = identities(row);
    if (pair(found, 'ASC', 'DSC')) return 1;
    if (pair(found, 'MC', 'IC')) return 2;
    if (pair(found, 'NN', 'SN')) return 3;
    return 9;
  }
  function section(kind, title) {
    const node = document.createElement('section');
    node.className = 'relphi-relationship-subsection relphi-relationship-' + kind;
    node.dataset.relationshipSection = kind;
    if (kind === 'axes') {
      node.innerHTML = '<div class="relphi-relationship-subsection-heading"><h3>' + title + '</h3></div><div class="relphi-axis-columns"><section class="relphi-axis-column" data-axis-sky="a"><h4>A</h4><div class="relphi-axis-stack" role="list"></div></section><section class="relphi-axis-column" data-axis-sky="b"><h4>B</h4><div class="relphi-axis-stack" role="list"></div></section></div>';
    } else {
      node.innerHTML = '<div class="relphi-relationship-subsection-heading"><h3>' + title + '</h3></div><div class="relphi-relationship-subsection-list" role="list"></div>';
    }
    return node;
  }
  function styles() {
    if (document.getElementById('relphi-relationship-section-styles')) return;
    const style = document.createElement('style');
    style.id = 'relphi-relationship-section-styles';
    style.textContent = [
      '.relphi-structural-relationship-sections{display:grid;gap:1rem;margin:0 0 1rem;padding:1rem;border:1px solid rgba(0,0,0,.14);border-radius:1.15rem;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.035)}',
      '.relphi-relationship-subsection{display:grid;gap:.7rem}',
      '.relphi-relationship-subsection-heading{display:flex;align-items:center;justify-content:space-between;gap:.75rem}',
      '.relphi-relationship-subsection-heading h3{margin:0;font-size:1.05rem;line-height:1.2}',
      '.relphi-relationship-subsection-list,.relphi-axis-stack{display:grid;gap:.55rem}',
      '.relphi-axis-columns{display:grid;grid-template-columns:1fr;gap:.85rem}',
      '.relphi-axis-column{display:grid;gap:.5rem;min-width:0}',
      '.relphi-axis-column h4{margin:0;padding:0 0 .35rem;border-bottom:1px solid rgba(0,0,0,.12);font-size:.82rem;letter-spacing:.08em;text-transform:uppercase}',
      '.relphi-structural-relationship-sections[data-two-skies="true"] .relphi-axis-columns{grid-template-columns:repeat(2,minmax(0,1fr))}',
      '.relphi-structural-relationship-sections[data-two-skies="false"] .relphi-axis-column[data-axis-sky="b"]{display:none}',
      '.relphi-relationship-subsection[hidden]{display:none}',
      '@media(max-width:680px){.relphi-structural-relationship-sections[data-two-skies="true"] .relphi-axis-columns{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(style);
  }
  function ordinaryHeading() {
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')).find(function (node) { return /^relationships$/i.test(String(node.textContent || '').trim()); }) || null;
  }
  function relationshipsPanel(list) {
    const heading = ordinaryHeading();
    if (!heading) return list.parentElement || list;
    let node = heading, candidate = null;
    while (node && node !== document.body) {
      if (node.contains(list)) candidate = node;
      if (candidate && node.parentElement && !node.parentElement.contains(list)) break;
      node = node.parentElement;
    }
    return candidate || list.parentElement || list;
  }
  function ordinaryCount(count) {
    const heading = ordinaryHeading(), row = heading && heading.parentElement;
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
    if (!sectionNode) return;
    const count = sectionNode.querySelectorAll('.relationship-list-row').length;
    sectionNode.hidden = count === 0;
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
      const axisA = host.querySelector('[data-axis-sky="a"] .relphi-axis-stack');
      const axisB = host.querySelector('[data-axis-sky="b"] .relphi-axis-stack');
      const frame = host.querySelector('[data-relationship-section="frame"] .relphi-relationship-subsection-list');
      const seenAxes = new Set();
      rows.forEach(function (row) {
        const group = classify(row);
        if (axisSelf(row)) { row.remove(); return; }
        if (group === 'axes') {
          const key = structuralKey(row);
          if (seenAxes.has(key)) { row.remove(); return; }
          seenAxes.add(key);
          row.dataset.axisSky = skyRole(row);
          row.dataset.axisOrder = String(axisOrder(row));
        }
        const target = group === 'axes' ? (skyRole(row) === 'b' ? axisB : axisA) : group === 'frame' ? frame : list;
        if (row.parentElement !== target) target.appendChild(row);
      });
      [axisA, axisB].forEach(function (stack) {
        Array.from(stack.children).sort(function (a,b) { return Number(a.dataset.axisOrder || 9) - Number(b.dataset.axisOrder || 9); }).forEach(function (row) { stack.appendChild(row); });
      });
      update(host.querySelector('[data-relationship-section="axes"]'));
      update(host.querySelector('[data-relationship-section="frame"]'));
      ordinaryCount(list.querySelectorAll(':scope > .relationship-list-row').length);
    } finally { running = false; }
  }
  function queue() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; organize(); }); }
  function start() {
    organize();
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true, characterData:true });
    document.addEventListener('relphi:skyroleschange', queue);
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();