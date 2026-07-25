// Decorates Sky Chart controls with the unified glyph registry and renderer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let observer;
  let running = false;

  function ready() {
    return window.RelphiGlyphRegistry && window.RelphiGlyphComponent;
  }

  function resolve(value) {
    if (!ready()) return null;
    return window.RelphiGlyphRegistry.resolve(String(value || '').trim());
  }

  function relevant(node) {
    return !!node.closest && !!node.closest([
      '#chartPanel','#chartOutput','#currentSkyOutput',
      '.relationship-list','.relationship-filters','.aspect-relationship-filters',
      '[data-sky-chart-mode]','[data-comparison-filter]','[data-aspect-filter]',
      '[data-zodiac-filter]','.relationship-list-row','.relphi-progressive-reading'
    ].join(','));
  }

  function icon(entry) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','-12 -12 24 24');
    svg.setAttribute('aria-hidden','true');
    svg.classList.add('relphi-unified-glyph');
    const group = document.createElementNS('http://www.w3.org/2000/svg','g');
    svg.appendChild(group);
    window.RelphiGlyphComponent.draw(group, entry.id, { radius:9.5, padding:.5, color:'#111' }).catch(function () {});
    return svg;
  }

  function decorate(node) {
    if (!node || node.dataset.relphiUnifiedGlyph === 'done') return;
    if (node.closest('.relphi-unified-label,.relphi-unified-glyph')) return;
    if (node.matches('input,select,textarea,option') || node.querySelector('input,select,textarea,img,svg')) return;
    const source = node.dataset.glyphIdentity || node.dataset.body || node.dataset.planet || node.dataset.point || node.dataset.sign || node.dataset.aspect || node.getAttribute('aria-label') || node.textContent;
    const entry = resolve(source) || resolve(node.textContent);
    if (!entry) return;
    const glyphOnly = node.classList.contains('relphi-progressive-glyph') || /^\s*[\u2600-\u2BFF]+\s*$/.test(node.textContent || '');
    node.replaceChildren(icon(entry));
    if (!glyphOnly) {
      const label = document.createElement('span');
      label.className = 'relphi-unified-name';
      label.textContent = entry.name;
      node.appendChild(label);
    } else {
      node.setAttribute('aria-label','Reveal ' + entry.name);
    }
    node.dataset.relphiUnifiedGlyph = 'done';
  }

  function cleanOption(option) {
    if (!option || option.dataset.relphiUnifiedGlyph === 'done') return;
    const entry = resolve(option.value) || resolve(option.textContent) || resolve(option.label);
    if (!entry) return;
    option.textContent = entry.name;
    option.label = entry.name;
    option.dataset.relphiUnifiedGlyph = 'done';
  }

  function styles() {
    if (document.getElementById('relphi-unified-glyph-styles')) return;
    const style = document.createElement('style');
    style.id = 'relphi-unified-glyph-styles';
    style.textContent = '.relphi-unified-glyph{width:1.35em;height:1.35em;display:inline-block;flex:0 0 1.35em;vertical-align:-.28em;overflow:visible}.relphi-unified-name{min-width:0;margin-left:.28em}.relphi-progressive-glyph .relphi-unified-glyph{width:1.2em;height:1.2em;vertical-align:-.22em}';
    document.head.appendChild(style);
  }

  function run() {
    if (running) return;
    if (!ready()) { setTimeout(schedule,80); return; }
    running = true;
    observer?.disconnect();
    styles();
    document.querySelectorAll('option').forEach(function (option) { if (relevant(option)) cleanOption(option); });
    document.querySelectorAll('button,[role="option"],[role="checkbox"],[data-body],[data-planet],[data-point],[data-sign],[data-aspect],.relationship-list-row span,.relationship-list-row strong,.relphi-progressive-glyph').forEach(function (node) {
      if (relevant(node)) decorate(node);
    });
    observer?.observe(document.body,{childList:true,subtree:true});
    running = false;
  }

  let queued = false;
  function schedule() {
    if (queued || running) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; run(); });
  }

  function start() {
    observer = new MutationObserver(function (records) {
      if (records.some(function (record) { return Array.from(record.addedNodes).some(function (node) { return node.nodeType === 1 && !node.matches?.('.relphi-unified-glyph,.relphi-unified-name'); }); })) schedule();
    });
    run();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.RelphiSkyFilterGlyphs = Object.freeze({ refresh:schedule });
})();