// Serialize visual glyphs as portable Unicode plus semantic names when copied.
(function () {
  'use strict';
  if (window.__relphiGlyphCopySerializerV1) return;
  const registry = window.RelphiGlyphRegistry;
  if (!registry) throw new Error('Relphi glyph registry must load before the copy serializer.');
  window.__relphiGlyphCopySerializerV1 = true;

  const UNICODE = Object.freeze({
    sun:'☉', moon:'☽', mercury:'☿', venus:'♀', mars:'♂', jupiter:'♃', saturn:'♄',
    uranus:'♅', neptune:'♆', pluto:'♇', chiron:'⚷',
    aries:'♈', taurus:'♉', gemini:'♊', cancer:'♋', leo:'♌', virgo:'♍',
    libra:'♎', scorpio:'♏', sagittarius:'♐', capricorn:'♑', aquarius:'♒', pisces:'♓',
    fire:'🜂', water:'🜄', air:'🜁', earth:'🜃',
    conjunction:'☌', opposition:'☍', trine:'△', square:'□', sextile:'✶',
    'semi-sextile':'⚺', quincunx:'⚻', octile:'∠', 'tri-octile':'⚼',
    'north-node':'☊', 'south-node':'☋', lilith:'⚸', 'part-of-fortune':'⊗'
  });

  const selector = '[data-relphi-copy-id],[data-glyph-id],[data-relphi-atomic-identity]';

  function entryFor(value) {
    return registry.get(value) || registry.resolve(value);
  }

  function identityFor(node) {
    return node?.dataset?.relphiCopyId || node?.dataset?.glyphId || node?.dataset?.relphiAtomicIdentity || '';
  }

  function serializeGlyph(identity, mode) {
    const entry = entryFor(identity);
    if (!entry) return String(identity || '');
    const selectedMode = mode || document.documentElement.dataset.glyphCopyMode || 'unicode-name';
    const unicode = entry.copyUnicode || entry.canonicalUnicode || UNICODE[entry.id] || '';
    if (selectedMode === 'name' || !unicode) return entry.name;
    if (selectedMode === 'unicode') return unicode;
    return `${unicode} ${entry.name}`;
  }

  function outermostGlyphs(root) {
    return Array.from(root.querySelectorAll(selector)).filter(node => {
      let parent = node.parentElement;
      while (parent && parent !== root) {
        if (parent.matches?.(selector)) return false;
        parent = parent.parentElement;
      }
      return true;
    });
  }

  function domText(root) {
    const blocks = new Set(['ARTICLE','ASIDE','DIV','FIGCAPTION','FIGURE','FOOTER','HEADER','LI','P','SECTION','TR']);
    let output = '';
    function visit(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        output += node.nodeValue || '';
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.tagName === 'BR') {
        output += '\n';
        return;
      }
      const block = blocks.has(node.tagName);
      if (block && output && !output.endsWith('\n')) output += '\n';
      node.childNodes.forEach(visit);
      if (block && !output.endsWith('\n')) output += '\n';
    }
    root.childNodes.forEach(visit);
    return output;
  }

  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function normalize(text, mode) {
    let value = String(text || '')
      .replace(/[\t\f\v ]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    registry.entries.forEach(entry => {
      const token = serializeGlyph(entry.id, mode);
      if (!token) return;
      const repeated = new RegExp(`${escapeRegex(token)}\\s+${escapeRegex(entry.name)}(?=\\s|$)`, 'gi');
      value = value.replace(repeated, token);
      if (token === entry.name) {
        const doubled = new RegExp(`${escapeRegex(entry.name)}\\s+${escapeRegex(entry.name)}(?=\\s|$)`, 'gi');
        value = value.replace(doubled, entry.name);
      }
    });
    return value;
  }

  function serializeFragment(fragment, mode) {
    const holder = document.createElement('div');
    holder.appendChild(fragment.cloneNode(true));
    const glyphs = outermostGlyphs(holder);
    glyphs.forEach(node => {
      const identity = identityFor(node) || identityFor(node.querySelector?.(selector));
      node.replaceWith(document.createTextNode(serializeGlyph(identity, mode)));
    });
    return {
      found:glyphs.length > 0,
      text:normalize(domText(holder), mode)
    };
  }

  function htmlFor(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  document.addEventListener('copy', event => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed || !event.clipboardData) return;
    const range = selection.getRangeAt(0);
    const result = serializeFragment(range.cloneContents());
    if (!result.found) return;
    event.clipboardData.setData('text/plain', result.text);
    event.clipboardData.setData('text/html', htmlFor(result.text));
    event.preventDefault();
  });

  window.RelphiGlyphCopySerializer = Object.freeze({
    serializeGlyph,
    serializeFragment,
    unicodeFor:identity => {
      const entry = entryFor(identity);
      return entry ? (entry.copyUnicode || entry.canonicalUnicode || UNICODE[entry.id] || '') : '';
    }
  });
})();
