// Site-wide adapter: isolated glyph tokens are rendered from the canonical registry/component.
(function () {
  'use strict';
  if (window.RelphiGlyphSiteCanonical) return;

  const NS = 'http://www.w3.org/2000/svg';
  const symbolPattern = /^(☉|⊙|☽|☾|☿|♀|♂|♃|♄|♅|⛢|♆|♇|⚷|♈|♉|♊|♋|♌|♍|♎|♏|♐|♑|♒|♓|🜂|🜄|🜁|🜃|☌|☍|△|▲|□|■|✶|⚹|⚺|⚻|⚼|☊|☋|⚸|⊗)(?:\s+|$)/;
  const skipTags = new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION','SELECT','CODE','PRE']);
  const processing = new WeakSet();

  function colorFor(element) {
    const computed = getComputedStyle(element);
    return computed.color && computed.color !== 'rgba(0, 0, 0, 0)' ? computed.color : '#111111';
  }

  function makeInlineSvg(entry, element) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-20 -20 40 40');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.classList.add('relphi-site-glyph', 'relphi-site-glyph-' + entry.id);
    svg.style.width = '1.15em';
    svg.style.height = '1.15em';
    svg.style.display = 'inline-block';
    svg.style.verticalAlign = '-0.18em';
    svg.style.overflow = 'visible';
    window.RelphiGlyphComponent.draw(svg, entry.id, {
      radius: 17.5,
      padding: 1,
      color: colorFor(element)
    }).catch(function (error) { console.error(error); });
    return svg;
  }

  function replaceHtmlToken(element, entry, remainder) {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(makeInlineSvg(entry, element));
    if (remainder) fragment.appendChild(document.createTextNode(' ' + remainder));
    element.replaceChildren(fragment);
    element.dataset.relphiCanonicalGlyph = entry.id;
  }

  function replaceSvgToken(element, entry) {
    if (element.namespaceURI !== NS || element.localName !== 'text') return false;
    const parent = element.parentNode;
    if (!parent) return false;
    const x = element.getAttribute('x') || '0';
    const y = element.getAttribute('y') || '0';
    const group = document.createElementNS(NS, 'g');
    group.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    group.setAttribute('aria-hidden', 'true');
    group.dataset.relphiCanonicalGlyph = entry.id;
    parent.insertBefore(group, element);
    element.style.opacity = '0';
    window.RelphiGlyphComponent.draw(group, entry.id, {
      radius: 12,
      padding: 1,
      color: colorFor(element)
    }).catch(function (error) { console.error(error); });
    return true;
  }

  function canonicalizeElement(element) {
    if (!(element instanceof Element) || processing.has(element) || skipTags.has(element.tagName)) return;
    if (element.closest('[data-relphi-canonical-skip="true"]')) return;
    if (element.querySelector('.relphi-site-glyph,[data-relphi-canonical-glyph]')) return;

    const explicit = element.getAttribute('data-relphi-glyph');
    const text = String(element.textContent || '').trim();
    const match = explicit ? null : text.match(symbolPattern);
    const identity = explicit || (match && match[1]);
    if (!identity) return;

    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry) return;

    processing.add(element);
    if (!explicit && replaceSvgToken(element, entry)) return;

    const remainder = explicit ? '' : text.slice(match[0].length).trim();
    replaceHtmlToken(element, entry, remainder);
  }

  function scan(root) {
    if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
    if (root instanceof Element) canonicalizeElement(root);
    root.querySelectorAll('[data-relphi-glyph],body *').forEach(canonicalizeElement);
  }

  const observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) scan(node);
        else if (node.nodeType === 3 && node.parentElement) canonicalizeElement(node.parentElement);
      });
      if (record.type === 'characterData' && record.target.parentElement) canonicalizeElement(record.target.parentElement);
    });
  });

  function start() {
    scan(document);
    observer.observe(document.documentElement, {subtree:true, childList:true, characterData:true});
    document.documentElement.dataset.relphiGlyphSource = 'canonical-registry-v1';
    window.dispatchEvent(new CustomEvent('relphi:glyph-source-ready', {detail:{source:'relphi-glyph-registry-v1.js'}}));
  }

  window.RelphiGlyphSiteCanonical = Object.freeze({scan, canonicalizeElement, source:'relphi-glyph-registry-v1.js'});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
