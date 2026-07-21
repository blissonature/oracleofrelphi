// Branch preview: glyph-first Sky Chart lollipops aligned with Planetary Hours.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  document.getElementById('relphiPhGlyphStyle')?.remove();
  const style = document.createElement('style');
  style.id = 'relphiPhGlyphStyle';
  style.textContent = [
    '.unified-sky-wheel svg:not(.relphi-layout-ready),#chartOutput svg:not(.relphi-layout-ready),#currentSkyOutput svg:not(.relphi-layout-ready),.sky-output-box svg:not(.relphi-layout-ready){visibility:hidden!important}',
    '.unified-sky-wheel svg.relphi-layout-ready,#chartOutput svg.relphi-layout-ready,#currentSkyOutput svg.relphi-layout-ready,.sky-output-box svg.relphi-layout-ready{visibility:visible!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick{--ph-marker:#dc1f18;outline:none}',
    '.unified-sky-wheel .chart-wheel-placement-stick.sky-b{--ph-marker:#3166e2}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-center-ray{stroke:#222!important;stroke-width:.55!important;opacity:.13!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick{stroke:#222!important;stroke-width:1.25!important;stroke-linecap:round!important;opacity:.86!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-preview-active .chart-wheel-stick{stroke-width:1.9!important;opacity:1!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-contact-dot{fill:var(--ph-marker)!important;stroke:#fff!important;stroke-width:.7!important;r:1.8px}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{fill:#fff!important;stroke:var(--ph-marker)!important;stroke-width:2.35!important;r:17.5px!important;filter:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-preview-active .chart-wheel-stick-knob{stroke-width:3!important;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.18))!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-name,.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-degree{display:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.has-preview-inline-glyph .chart-wheel-marker-glyph{display:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick:not(.has-preview-inline-glyph) .chart-wheel-marker-glyph{display:block!important;fill:var(--ph-marker)!important;font-family:"Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","DejaVu Sans",sans-serif!important;font-size:18px!important;font-weight:900!important;text-anchor:middle!important;dominant-baseline:central!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.has-preview-angle-text .chart-wheel-marker-glyph{display:block!important;fill:var(--ph-marker)!important;font-family:system-ui,sans-serif!important;font-size:11.5px!important;font-weight:750!important;letter-spacing:-.3px!important;text-anchor:middle!important;dominant-baseline:central!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick image.relphi-bubble-glyph-image,.unified-sky-wheel .chart-wheel-placement-stick svg.relphi-colored-glyph{display:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick svg.relphi-bold-inline-glyph{display:block!important;pointer-events:none!important;overflow:visible}',
    '.unified-sky-wheel .is-preview-aspect-active{opacity:1!important;stroke-width:2.5!important;filter:drop-shadow(0 1px 1px rgba(0,0,0,.18))}',
    '@media(max-width:600px){.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{r:18px!important}.unified-sky-wheel .chart-wheel-placement-stick:not(.has-preview-inline-glyph) .chart-wheel-marker-glyph{font-size:18.5px!important}.unified-sky-wheel .chart-wheel-placement-stick.has-preview-angle-text .chart-wheel-marker-glyph{font-size:12px!important;font-weight:750!important}}'
  ].join('');
  document.head.appendChild(style);

  const selector = '.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg';

  function markReady(svg) {
    if (!(svg instanceof SVGElement)) return;
    const placements = Array.from(svg.querySelectorAll('.chart-wheel-placement-stick'));
    if (!placements.length) return;
    const glyphsReady = placements.every(function (group) {
      return group.classList.contains('has-preview-inline-glyph') ||
        group.classList.contains('has-preview-angle-text');
    });
    const layoutFinished = svg.dataset.relphiLayoutBusy !== 'true' && svg.style.opacity === '1';
    if (glyphsReady && layoutFinished) svg.classList.add('relphi-layout-ready');
  }

  function scan(root) {
    if (root instanceof SVGElement && root.matches(selector)) markReady(root);
    root.querySelectorAll?.(selector).forEach(markReady);
  }

  function installGuard() {
    scan(document);
    new MutationObserver(function (records) {
      const svgs = new Set();
      records.forEach(function (record) {
        const targetSvg = record.target instanceof Element ? record.target.closest('svg') : null;
        if (targetSvg && targetSvg.matches(selector)) svgs.add(targetSvg);
        Array.from(record.addedNodes || []).forEach(function (node) {
          if (!(node instanceof Element)) return;
          if (node.matches?.(selector)) svgs.add(node);
          node.querySelectorAll?.(selector).forEach(function (svg) { svgs.add(svg); });
        });
      });
      svgs.forEach(markReady);
    }).observe(document.body, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','style','data-relphi-layout-busy']
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installGuard, { once:true });
  else installGuard();
})();
