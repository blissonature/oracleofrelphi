// Relphi glyph source-integrity guard.
// Observes and locks the approved registry/component. It never draws or repairs artwork.
(function () {
  'use strict';
  if (window.__relphiGlyphSourceIntegrityV1) return;
  window.__relphiGlyphSourceIntegrityV1 = true;

  const registry = window.RelphiGlyphRegistry;
  const component = window.RelphiGlyphComponent;
  if (!registry || !component) throw new Error('[Relphi glyph integrity] Registry and component must load before the integrity guard.');

  const fields = ['id','name','asset','scale','dx','dy','fallback','fitMode','fontWeight'];
  // Master Glyph List identities whose approved artwork is authored by the shared
  // component rather than an external SVG asset.
  const componentMasterIds = Object.freeze(['chiron','north-node','south-node','part-of-fortune','vertex','asc','dsc','mc','ic']);
  const componentMasters = new Set(componentMasterIds);
  function masterAvailable(entry) {
    return !!entry && (!!entry.asset || componentMasters.has(entry.id));
  }
  function resolveMaster(identity) {
    const entry = registry.get(identity) || registry.resolve(identity);
    return masterAvailable(entry) ? entry : null;
  }
  const signature = () => JSON.stringify(registry.entries.map(entry => [
    ...fields.map(field => entry[field] ?? null),
    Array.isArray(entry.aliases) ? entry.aliases.slice() : []
  ]));
  const approvedSignature = signature();

  registry.entries.forEach(entry => {
    if (Array.isArray(entry.aliases) && !Object.isFrozen(entry.aliases)) Object.freeze(entry.aliases);
    if (!Object.isFrozen(entry)) Object.freeze(entry);
  });

  try {
    Object.defineProperty(window, 'RelphiGlyphRegistry', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: registry
    });
    Object.defineProperty(window, 'RelphiGlyphComponent', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: component
    });
  } catch (error) {
    throw new Error('[Relphi glyph integrity] Could not lock the approved glyph globals: ' + error.message);
  }

  function assertIntegrity() {
    if (window.RelphiGlyphRegistry !== registry) throw new Error('[Relphi glyph integrity] RelphiGlyphRegistry was replaced.');
    if (window.RelphiGlyphComponent !== component) throw new Error('[Relphi glyph integrity] RelphiGlyphComponent was replaced.');
    if (signature() !== approvedSignature) throw new Error('[Relphi glyph integrity] Approved registry entries were mutated.');
    return true;
  }

  window.RelphiGlyphMasterSource = Object.freeze({
    componentMasterIds,
    masterAvailable,
    resolve: resolveMaster
  });
  window.RelphiGlyphIntegrity = Object.freeze({ assert: assertIntegrity });
  queueMicrotask(assertIntegrity);
  window.addEventListener('load', assertIntegrity, { once: true });
})();
