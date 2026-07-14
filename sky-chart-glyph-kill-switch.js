// Emergency guard for Sky Chart wheel glyph artifacts.
//
// The former SVG-path enhancer could mount raw glyph paths into the wheel without
// preserving each source SVG coordinate system. This guard blocks that renderer,
// removes every enhanced path instance from the marker layer, and keeps the
// original Unicode glyph text visible.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SYMBOLS = new Set(['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇','⯓']);
  let queued = false;

  function installSafetyStyle() {
    if (document.getElementById('relphi-wheel-glyph-kill-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-wheel-glyph-kill-style';
    style.textContent = [
      '.chart-wheel-markers .relphi-wheel-planet-glyph,',
      '.chart-wheel-markers g[data-relphi-glyph-for],',
      '.chart-wheel-markers path[data-relphi-wheel-glyph],',
      '.chart-wheel-markers use[data-relphi-wheel-glyph]{display:none!important}',
      '.chart-wheel-markers text{visibility:visible!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function isPlanetGlyphText(text) {
    return text && SYMBOLS.has((text.textContent || '').trim());
  }

  function blockEnhancerFor(text) {
    if (!isPlanetGlyphText(text)) return;
    text.removeAttribute('visibility');
    text.style.setProperty('visibility', 'visible', 'important');

    // The retired enhancer checks these flags before an asynchronous install.
    // Keep them set so an already-pending stale copy cannot put the paths back.
    text.dataset.relphiWheelGlyphAligned = 'true';
    text.dataset.relphiWheelGlyphPending = 'true';
  }

  function removeArtifactGroups(scope) {
    scope.querySelectorAll([
      '.relphi-wheel-planet-glyph',
      'g[data-relphi-glyph-for]',
      '.chart-wheel-markers path[data-relphi-wheel-glyph]',
      '.chart-wheel-markers use[data-relphi-wheel-glyph]'
    ].join(',')).forEach(function (node) {
      node.remove();
    });
  }

  function clean(root) {
    installSafetyStyle();
    const scope = root && root.querySelectorAll ? root : document;
    removeArtifactGroups(scope);
    scope.querySelectorAll('.chart-wheel-markers text, svg text[data-relphi-wheel-glyph-aligned], svg text[data-relphi-wheel-glyph-pending]').forEach(blockEnhancerFor);
    if (root && root.matches && root.matches('text')) blockEnhancerFor(root);
  }

  function scheduleClean() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      clean(document);
    });
  }

  function start() {
    window.RelphiDisableWheelPathGlyphs = true;
    clean(document);
    new MutationObserver(scheduleClean).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['visibility', 'class', 'transform']
    });
  }

  window.RelphiSkyGlyphKillSwitch = { clean: clean };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
