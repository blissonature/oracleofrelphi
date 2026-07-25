// Decorates Sky Chart controls with the unified inscribed glyph registry.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let observer;
  let running = false;
  let queued = false;

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

  function contextualColor(node) {
    if (!node) return '#111111';
    const style = getComputedStyle(node);
    const candidates = [
      node.dataset.glyphColor,
      node.dataset.color,
      style.getPropertyValue('--glyph-color'),
      style.getPropertyValue('--sky-color'),
      style.getPropertyValue('--relationship-color'),
      style.getPropertyValue('--aspect-color'),
      style.color
    ];
    return candidates.map(value => String(value || '').trim()).find(Boolean) || '#111111';
  }

  function inscribedIcon(entry, color, className) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','-32 -32 64 64');
    svg.setAttribute('aria-hidden','true');
    svg.classList.add(className || 'relphi-unified-glyph');
    const bubble = window.RelphiGlyphComponent.createBubble(svg, entry.id, { color: color });
    bubble.ready.catch(function () {});
    return svg;
  }

  function decorateControl(node) {
    if (!node || node.dataset.relphiUnifiedGlyph === 'done') return;
    if (node.closest('.relphi-unified-label,.relphi-unified-glyph,.relphi-progressive-token')) return;
    if (node.matches('input,select,textarea,option') || node.querySelector('input,select,textarea,img,svg')) return;
    const source = node.dataset.glyphIdentity || node.dataset.body || node.dataset.planet || node.dataset.point || node.dataset.sign || node.dataset.aspect || node.getAttribute('aria-label') || node.textContent;
    const entry = resolve(source) || resolve(node.textContent);
    if (!entry) return;
    const color = contextualColor(node);
    node.replaceChildren(inscribedIcon(entry, color));
    const label = document.createElement('span');
    label.className = 'relphi-unified-name';
    label.textContent = entry.name;
    node.appendChild(label);
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
    style.textContent = '.relphi-unified-glyph{width:1.65em;height:1.65em;display:inline-block;flex:0 0 1.65em;vertical-align:-.42em;overflow:visible}.relphi-unified-name{min-width:0;margin-left:.32em}';
    document.head.appendChild(style);
  }

  function run() {
    if (running) return;
    if (!ready()) { setTimeout(schedule,80); return; }
    running = true;
    observer?.disconnect();
    styles();
    document.querySelectorAll('option').forEach(function (option) {
      if (relevant(option)) cleanOption(option);
    });
    document.querySelectorAll('button,[role="option"],[role="checkbox"],[data-body],[data-planet],[data-point],[data-sign],[data-aspect]').forEach(function (node) {
      if (relevant(node) && !node.closest('.relationship-list-row,.relphi-progressive-reading')) decorateControl(node);
    });
    observer?.observe(document.body,{childList:true,subtree:true});
    running = false;
  }

  function schedule() {
    if (queued || running) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; run(); });
  }

  function start() {
    observer = new MutationObserver(function (records) {
      if (records.some(function (record) {
        return Array.from(record.addedNodes).some(function (node) {
          return node.nodeType === 1 && !node.matches?.('.relphi-unified-glyph,.relphi-unified-name,.relphi-progressive-token');
        });
      })) schedule();
    });
    run();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.RelphiSkyFilterGlyphs = Object.freeze({ refresh:schedule });
})();