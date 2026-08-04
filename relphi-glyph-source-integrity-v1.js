// Development assertion: observe the approved glyph registry/component without modifying them.
(function () {
  'use strict';
  if (window.__relphiGlyphSourceIntegrityV1) return;
  window.__relphiGlyphSourceIntegrityV1 = true;

  const APPROVED_PAGE = 'https://oracleofrelphi.com/glyphs-unified-preview.html';
  const APPROVED_COMMIT = '0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
  const registry = window.RelphiGlyphRegistry;
  const component = window.RelphiGlyphComponent;
  if (!registry || !component) throw new Error('Approved glyph registry/component did not load.');

  const fields = ['id','name','aliases','asset','scale','dx','dy','fallback','fitMode','fontWeight'];
  const snapshot = JSON.stringify(registry.entries.map(entry =>
    Object.fromEntries(fields.map(field => [field, entry[field] ?? null]))
  ));

  function assertIntegrity(context) {
    const failures = [];
    if (window.RelphiGlyphRegistry !== registry) failures.push('RelphiGlyphRegistry was reassigned');
    if (window.RelphiGlyphComponent !== component) failures.push('RelphiGlyphComponent was reassigned');
    const current = JSON.stringify(registry.entries.map(entry =>
      Object.fromEntries(fields.map(field => [field, entry[field] ?? null]))
    ));
    if (current !== snapshot) failures.push('approved registry entries were mutated');
    if (failures.length) {
      throw new Error(`[Glyph source integrity · ${context}] ${failures.join('; ')}. Approved source: ${APPROVED_PAGE} (${APPROVED_COMMIT})`);
    }
    document.documentElement.dataset.relphiGlyphSourcePage = APPROVED_PAGE;
    document.documentElement.dataset.relphiGlyphSourceCommit = APPROVED_COMMIT;
    document.documentElement.dataset.relphiGlyphSourceIntegrity = 'approved';
    return true;
  }

  window.RelphiGlyphSourceIntegrity = Object.freeze({
    sourcePage:APPROVED_PAGE,
    sourceCommit:APPROVED_COMMIT,
    assert:assertIntegrity
  });

  queueMicrotask(() => assertIntegrity('microtask'));
  document.addEventListener('DOMContentLoaded', () => assertIntegrity('DOMContentLoaded'), { once:true });
  window.addEventListener('relphi:sky-foundation-ready', () => assertIntegrity('sky-foundation-ready'));
  window.addEventListener('relphi:selected-relationship-rendered', () => assertIntegrity('selected-relationship-rendered'));
})();
