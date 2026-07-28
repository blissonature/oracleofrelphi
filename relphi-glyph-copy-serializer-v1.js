// Serializes canonical glyph-rich UI as readable names for clipboard output.
(function () {
  'use strict';
  if (window.RelphiGlyphCopySerializer) return;

  function registryEntry(identity) {
    try {
      const registry = window.RelphiGlyphRegistry;
      return registry && (registry.get(identity) || registry.resolve(identity));
    } catch (_) { return null; }
  }

  function nameFor(identity, fallback) {
    const entry = registryEntry(identity);
    return entry && entry.name || String(fallback || identity || '').trim();
  }

  function coordinate(item) {
    if (!item) return '';
    const degree = item.degree == null || item.degree === '' ? '' : Number(item.degree) + '°';
    const minute = item.minute == null || item.minute === '' ? '' : String(Number(item.minute)).padStart(2, '0') + '′';
    return degree + minute;
  }

  function placements(payload) {
    const value = payload && (payload.placements || payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function serializeSky(payload) {
    const map = placements(payload);
    return Object.keys(map).map(function (key) {
      const item = map[key] || {};
      const body = nameFor(key, key);
      const sign = item.sign ? nameFor(item.sign, item.sign) : '';
      const house = item.house == null || item.house === '' ? '' : 'House ' + item.house;
      return [body, sign, coordinate(item), house, item.retrograde ? 'retrograde' : ''].filter(Boolean).join(' · ');
    }).join('\n');
  }

  function serializeNode(root) {
    if (!root) return '';
    const clone = root.cloneNode(true);
    clone.querySelectorAll('[data-glyph-id],[data-workspace-glyph],[data-relphi-glyph]').forEach(function (node) {
      const identity = node.dataset.glyphId || node.dataset.workspaceGlyph || node.dataset.relphiGlyph;
      node.replaceWith(document.createTextNode(nameFor(identity, node.getAttribute('aria-label') || '')));
    });
    clone.querySelectorAll('svg[aria-label],img[aria-label],img[alt]').forEach(function (node) {
      const label = node.getAttribute('aria-label') || node.getAttribute('alt') || '';
      if (label) node.replaceWith(document.createTextNode(label));
      else node.remove();
    });
    return String(clone.innerText || clone.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  async function copySky(payload) {
    const text = serializeSky(payload);
    if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
    return text;
  }

  document.addEventListener('copy', function (event) {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    const glyphUi = container && container.closest && container.closest('#relphiSkyWorkspace,.sky-output-box,.relphi-canonical-relationship-reading,.relphi-progressive-reading');
    if (!glyphUi) return;
    const fragment = range.cloneContents();
    const holder = document.createElement('div');
    holder.appendChild(fragment);
    const text = serializeNode(holder);
    if (!text) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', text);
  });

  window.RelphiGlyphCopySerializer = Object.freeze({ nameFor:nameFor, serializeSky:serializeSky, serializeNode:serializeNode, copySky:copySky });
})();