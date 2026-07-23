// Applies the canonized Relphi glyph registry and component to Sky Chart.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const BODY_IDS = [
    'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
    'chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'
  ];
  const SYMBOL_PATTERN = /[☉⊙☽☾☿♀♂♃♄♅⛢♆♇⯓⚷☊☋⚸⊗]/;
  const COLOR_A = '#dc1f18';
  const COLOR_B = '#3166e2';

  function loadScript(src, ready) {
    return new Promise(function (resolve, reject) {
      if (ready()) return resolve();
      const base = src.split('?')[0];
      let script = document.querySelector('script[src^="' + base + '"]');
      if (!script) {
        script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.body.appendChild(script);
      }
      const check = function () {
        if (ready()) resolve();
        else reject(new Error('Loaded ' + src + ' without its expected API.'));
      };
      script.addEventListener('load', check, { once:true });
      script.addEventListener('error', reject, { once:true });
      if (ready()) resolve();
    });
  }

  function dependencies() {
    return loadScript('relphi-glyph-registry-v1.js?v=19', function () {
      return !!window.RelphiGlyphRegistry;
    }).then(function () {
      return loadScript('relphi-glyph-component-v1.js?v=19', function () {
        return !!window.RelphiGlyphComponent;
      });
    });
  }

  function resolve(value) {
    const entry = window.RelphiGlyphRegistry?.resolve?.(value) || window.RelphiGlyphRegistry?.get?.(value);
    return entry && BODY_IDS.includes(entry.id) ? entry : null;
  }

  function colorFor(element) {
    if (element?.closest?.('#currentSkyOutput,[data-sky="b"],[data-sky-id="skyB"],.sky-b,.current-sky')) return COLOR_B;
    const stroke = element?.getAttribute?.('stroke') || element?.style?.stroke || '';
    if (stroke && stroke !== 'none') return stroke;
    const computed = element && getComputedStyle(element).color;
    return computed && computed !== 'rgb(0, 0, 0)' ? computed : COLOR_A;
  }

  function identityFor(element) {
    if (!element) return null;
    const candidates = [
      element.dataset?.glyphId, element.dataset?.planet, element.dataset?.body,
      element.dataset?.object, element.dataset?.name, element.getAttribute?.('aria-label'),
      element.getAttribute?.('title'), element.textContent
    ];
    for (const candidate of candidates) {
      const entry = resolve(candidate);
      if (entry) return entry;
    }
    const symbol = String(element.textContent || '').match(SYMBOL_PATTERN)?.[0];
    return symbol ? resolve(symbol) : null;
  }

  function makeSvg(entry, color, size) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-32 -32 64 64');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('relphi-canonical-body-glyph');
    svg.dataset.glyphId = entry.id;
    window.RelphiGlyphComponent.draw(svg, entry.id, {
      radius: Math.max(8, size * .43), padding:1, color:color
    }).catch(function (error) { console.error('Relphi canonical glyph failed:', entry.id, error); });
    return svg;
  }

  function replaceSvgText(element) {
    if (!(element instanceof SVGTextElement) || element.dataset.relphiCanonicalGlyph === 'true') return;
    const entry = identityFor(element);
    if (!entry) return;
    const box = (function () { try { return element.getBBox(); } catch (_) { return null; } })();
    const fontSize = parseFloat(getComputedStyle(element).fontSize) || 18;
    const size = Math.max(20, Math.min(44, Math.max(fontSize * 1.55, box?.height || 0)));
    const x = Number(element.getAttribute('x') || box?.x + (box?.width || 0) / 2 || 0);
    const y = Number(element.getAttribute('y') || box?.y + (box?.height || 0) / 2 || 0);
    const svg = makeSvg(entry, colorFor(element), size);
    svg.setAttribute('x', String(x - size / 2));
    svg.setAttribute('y', String(y - size / 2));
    ['class','transform','opacity','style'].forEach(function (name) {
      const value = element.getAttribute(name);
      if (value) svg.setAttribute(name, value);
    });
    svg.classList.add('relphi-canonical-body-glyph');
    svg.dataset.relphiCanonicalGlyph = 'true';
    svg.setAttribute('aria-label', entry.name);
    element.replaceWith(svg);
  }

  function replaceHtmlSymbol(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue) return;
    const match = node.nodeValue.match(SYMBOL_PATTERN);
    if (!match) return;
    const parent = node.parentElement;
    if (!parent || parent.closest('script,style,textarea,input,option,svg')) return;
    const entry = resolve(match[0]);
    if (!entry) return;
    const fragment = document.createDocumentFragment();
    const before = node.nodeValue.slice(0, match.index);
    const after = node.nodeValue.slice(match.index + match[0].length);
    if (before) fragment.appendChild(document.createTextNode(before));
    const span = document.createElement('span');
    span.className = 'relphi-canonical-inline-glyph';
    span.appendChild(makeSvg(entry, colorFor(parent), 22));
    span.setAttribute('aria-label', entry.name);
    fragment.appendChild(span);
    if (after) fragment.appendChild(document.createTextNode(after));
    parent.replaceChild(fragment, node);
  }

  function replaceNamedGlyph(element) {
    if (!element || element.namespaceURI === NS || element.dataset.relphiCanonicalGlyph === 'true') return;
    if (!/glyph|planet|body|marker/i.test(String(element.className || ''))) return;
    const entry = identityFor(element);
    if (!entry) return;
    element.replaceChildren(makeSvg(entry, colorFor(element), 24));
    element.dataset.relphiCanonicalGlyph = 'true';
    element.setAttribute('aria-label', element.getAttribute('aria-label') || entry.name);
  }

  function ensureOptions(root) {
    (root?.querySelectorAll ? root : document).querySelectorAll('select').forEach(function (select) {
      const existing = new Set(Array.from(select.options).map(function (option) {
        return resolve(option.value || option.textContent)?.id;
      }).filter(Boolean));
      if (!existing.size) return;
      BODY_IDS.forEach(function (id) {
        if (existing.has(id)) return;
        const entry = window.RelphiGlyphRegistry.get(id);
        if (entry) select.appendChild(new Option(entry.name, entry.name));
      });
    });
  }

  function run(root) {
    const scope = root?.querySelectorAll ? root : document;
    scope.querySelectorAll('svg text').forEach(replaceSvgText);
    scope.querySelectorAll('*').forEach(replaceNamedGlyph);
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(replaceHtmlSymbol);
    ensureOptions(scope);
  }

  function start() {
    dependencies().then(function () {
      run(document);
      let queued = false;
      new MutationObserver(function (mutations) {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
              if (node.nodeType === Node.ELEMENT_NODE) run(node);
              else if (node.nodeType === Node.TEXT_NODE) replaceHtmlSymbol(node);
            });
          });
        });
      }).observe(document.body, { childList:true, subtree:true });
      window.RelphiCanonicalSkyGlyphs = {
        registry:window.RelphiGlyphRegistry,
        component:window.RelphiGlyphComponent,
        refresh:function () { run(document); }
      };
      window.dispatchEvent(new CustomEvent('relphi:canonical-sky-glyphs-ready', {
        detail:{ source:'RelphiGlyphRegistry', skyA:true, skyB:true, bodies:BODY_IDS.slice() }
      }));
      if (!document.querySelector('script[src^="sky-chart-calculated-point-bridge.js"]')) {
        const bridge = document.createElement('script');
        bridge.src = 'sky-chart-calculated-point-bridge.js?v=1';
        bridge.async = false;
        document.body.appendChild(bridge);
      }
    }).catch(function (error) {
      console.error('Relphi canonical glyph system did not load.', error);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();