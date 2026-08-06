const LEGAL_STATES = Object.freeze([
  'plain',
  'circled',
  'day-ruler',
  'hour-ruler',
  'day-and-hour-ruler'
]);

const LEGAL_STATE_SET = new Set(LEGAL_STATES);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const APPROVED_DIFFERENCE_STATUS = 'approved-with-documented-raster-difference';
const EXACT_STATUS = 'exact-static-candidate';
const PROHIBITED_MARKUP = /<(?:text|script|foreignObject|image|filter|mask|clipPath|symbol|use|animate|animateMotion|animateTransform|set|style)\b|\btransform\s*=|\bfont(?:-[\w-]+)?\s*=|\b(?:href|src)\s*=/i;

export const CANONICAL_GLYPH_ERROR_CODES = Object.freeze({
  UNKNOWN_IDENTITY: 'UNKNOWN_IDENTITY',
  UNKNOWN_STATE: 'UNKNOWN_STATE',
  UNAVAILABLE_MASTER: 'UNAVAILABLE_MASTER',
  UNAVAILABLE_OVERLAY: 'UNAVAILABLE_OVERLAY',
  MANIFEST_INVALID: 'MANIFEST_INVALID',
  ASSET_MISSING: 'ASSET_MISSING',
  ASSET_HASH_MISMATCH: 'ASSET_HASH_MISMATCH',
  PROHIBITED_MARKUP: 'PROHIBITED_MARKUP',
  REQUEST_ABORTED: 'REQUEST_ABORTED',
  NETWORK_FAILURE: 'NETWORK_FAILURE',
  INCOMPLETE_COMPOSITION: 'INCOMPLETE_COMPOSITION'
});

export class CanonicalGlyphError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CanonicalGlyphError';
    this.code = code;
    this.details = Object.freeze({ ...details });
    Object.freeze(this);
  }
}

const throwGlyphError = (code, message, details) => {
  throw new CanonicalGlyphError(code, message, details);
};

const abortError = details => new CanonicalGlyphError(
  CANONICAL_GLYPH_ERROR_CODES.REQUEST_ABORTED,
  'Canonical glyph request was aborted.',
  details
);

const joinUrl = (base, relative) => new URL(relative, new URL('.', base)).href;

function validateAbortSignal(signal) {
  if (signal !== undefined && (!signal || typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function')) {
    throw new TypeError('signal must be an AbortSignal.');
  }
  if (signal?.aborted) throw abortError({ reason: signal.reason ?? null });
}

function raceAbort(promise, signal) {
  validateAbortSignal(signal);
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError({ reason: signal.reason ?? null }));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

async function sha256(bytes, cryptoImpl) {
  if (!cryptoImpl?.subtle) {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.INCOMPLETE_COMPOSITION, 'Web Crypto SHA-256 is unavailable.');
  }
  const digest = await cryptoImpl.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `${label} must be an object.`);
  }
}

function validateManifest(value) {
  assertPlainObject(value, 'Canonical manifest');
  if (value.schema !== 'relphi-canonical-source-package/v1') {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, 'Canonical manifest schema is invalid.');
  }
  if (!Array.isArray(value.identities) || value.identities.length !== 93 || !Array.isArray(value.states)) {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, 'Canonical manifest must contain 93 identities and a state table.');
  }
  const identities = new Map();
  for (const entry of value.identities) {
    assertPlainObject(entry, 'Canonical identity entry');
    const identity = entry.canonical_identity;
    if (typeof identity !== 'string' || !identity || identities.has(identity)) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, 'Canonical identities must be unique non-empty strings.');
    }
    const available = entry.status === EXACT_STATUS || entry.status === APPROVED_DIFFERENCE_STATUS;
    if (available !== Boolean(entry.candidate_path && entry.candidate_sha256)) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Availability fields disagree for ${identity}.`);
    }
    if (entry.candidate_sha256 !== null && !SHA256_PATTERN.test(entry.candidate_sha256)) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Invalid master hash for ${identity}.`);
    }
    if (available && (typeof entry.viewBox !== 'string' || !entry.viewBox.trim())) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Missing authored viewBox for ${identity}.`);
    }
    if (entry.status === APPROVED_DIFFERENCE_STATUS) {
      const approvalPath = entry.source_provenance?.approval_record;
      if (typeof approvalPath !== 'string' || !approvalPath) {
        throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Missing approval record for ${identity}.`);
      }
    }
    identities.set(identity, Object.freeze({ ...entry }));
  }

  const states = new Map();
  for (const entry of value.states) {
    assertPlainObject(entry, 'Canonical state entry');
    if (!LEGAL_STATE_SET.has(entry.state) || states.has(entry.state)) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Invalid or duplicate canonical state: ${entry.state ?? 'unknown'}.`);
    }
    if (entry.state === 'plain') {
      if (entry.overlay_path !== null || entry.sha256 !== null) {
        throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, 'Plain state cannot have an overlay.');
      }
    } else if (Boolean(entry.overlay_path) !== Boolean(entry.sha256)) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Overlay availability fields disagree for ${entry.state}.`);
    } else if (entry.sha256 !== null && !SHA256_PATTERN.test(entry.sha256)) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Invalid overlay hash for ${entry.state}.`);
    }
    states.set(entry.state, Object.freeze({ ...entry }));
  }
  if (states.size !== LEGAL_STATES.length || LEGAL_STATES.some(state => !states.has(state))) {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, 'Canonical manifest must define exactly the five legal states.');
  }
  return Object.freeze({ raw: value, identities, states });
}

function parseStaticSvg(bytes, { documentImpl, label, expectedViewBox }) {
  const source = new TextDecoder().decode(bytes);
  if (PROHIBITED_MARKUP.test(source)) {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.PROHIBITED_MARKUP, `${label} contains prohibited markup.`);
  }
  const Parser = documentImpl?.defaultView?.DOMParser ?? globalThis.DOMParser;
  if (!Parser || !documentImpl?.importNode) {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.INCOMPLETE_COMPOSITION, 'A browser DOM is required to complete a glyph instance.');
  }
  const parsed = new Parser().parseFromString(source, 'image/svg+xml');
  if (parsed.querySelector('parsererror') || parsed.documentElement?.localName !== 'svg') {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.PROHIBITED_MARKUP, `${label} is not valid static SVG markup.`);
  }
  const sourceRoot = parsed.documentElement;
  const authoredViewBox = sourceRoot.getAttribute('viewBox');
  if (!authoredViewBox || (expectedViewBox && authoredViewBox !== expectedViewBox)) {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.INCOMPLETE_COMPOSITION, `${label} does not preserve its authored viewBox.`, { expectedViewBox, actualViewBox: authoredViewBox });
  }
  return documentImpl.importNode(sourceRoot, true);
}

function validateApproval(record, entry, referencePackageHash) {
  assertPlainObject(record, `Approval record for ${entry.canonical_identity}`);
  const unsigned = { ...record };
  delete unsigned.signature;
  const confirmations = record.geometry_confirmation;
  const valid = record.record_type === 'failed-equivalence-decision'
    && record.identity === entry.canonical_identity
    && record.candidate_sha256 === entry.candidate_sha256
    && record.reference_package_hash === referencePackageHash
    && record.decision_type === 'approve-named-baked-candidate-with-documented-raster-difference'
    && record.no_geometry_value_changed_to_force_equivalence === true
    && record.no_fallback_or_runtime_fitting_authorized === true
    && ['geometry', 'whitespace', 'scale', 'position', 'proportions', 'strokes'].every(key => confirmations?.[key] === true)
    && SHA256_PATTERN.test(record.signature?.signed_payload_sha256 ?? '');
  if (!valid) {
    throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Approval record is invalid for ${entry.canonical_identity}.`);
  }
  return { unsigned, expectedPayloadHash: record.signature.signed_payload_sha256 };
}

export function createCanonicalGlyphLoader({
  manifestUrl = './assets/canonical-glyphs/v1/manifest.json',
  fetchImpl = globalThis.fetch,
  documentImpl = globalThis.document,
  cryptoImpl = globalThis.crypto
} = {}) {
  if (!documentImpl?.baseURI) throw new TypeError('documentImpl with a baseURI is required.');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function.');
  const resolvedManifestUrl = new URL(manifestUrl, documentImpl.baseURI).href;
  const verifiedBytes = new Map();
  const inFlightBytes = new Map();
  let manifestPromise;

  async function fetchResponse(url, kind) {
    let response;
    try {
      response = await fetchImpl(url);
    } catch (cause) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.NETWORK_FAILURE, `Network failure while loading canonical ${kind}.`, { url, cause: cause?.message ?? String(cause) });
    }
    if (!response?.ok) {
      const code = response?.status === 404 || response?.status === 410
        ? CANONICAL_GLYPH_ERROR_CODES.ASSET_MISSING
        : CANONICAL_GLYPH_ERROR_CODES.NETWORK_FAILURE;
      throwGlyphError(code, `Canonical ${kind} could not be loaded.`, { url, status: response?.status ?? null });
    }
    return response;
  }

  async function getManifest() {
    if (!manifestPromise) {
      manifestPromise = (async () => {
        const response = await fetchResponse(resolvedManifestUrl, 'manifest');
        let value;
        try {
          value = JSON.parse(await response.text());
        } catch {
          throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, 'Canonical manifest is not valid JSON.');
        }
        return validateManifest(value);
      })();
      manifestPromise.catch(() => { manifestPromise = undefined; });
    }
    return manifestPromise;
  }

  function getVerifiedBytes(url, expectedHash, kind) {
    const cacheKey = `${expectedHash} ${url}`;
    if (verifiedBytes.has(cacheKey)) return Promise.resolve(verifiedBytes.get(cacheKey).slice(0));
    if (!inFlightBytes.has(cacheKey)) {
      const task = (async () => {
        const response = await fetchResponse(url, kind);
        const bytes = await response.arrayBuffer();
        const actualHash = await sha256(bytes, cryptoImpl);
        if (!SHA256_PATTERN.test(expectedHash) || actualHash !== expectedHash) {
          throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.ASSET_HASH_MISMATCH, `SHA-256 mismatch for canonical ${kind}.`, { url, expected: expectedHash, actual: actualHash });
        }
        verifiedBytes.set(cacheKey, bytes.slice(0));
        return bytes;
      })();
      inFlightBytes.set(cacheKey, task);
      task.finally(() => inFlightBytes.delete(cacheKey)).catch(() => {});
    }
    return inFlightBytes.get(cacheKey).then(bytes => bytes.slice(0));
  }

  async function verifyApproval(entry, manifest) {
    if (entry.status !== APPROVED_DIFFERENCE_STATUS) return;
    const approvalUrl = joinUrl(resolvedManifestUrl, entry.source_provenance.approval_record);
    const response = await fetchResponse(approvalUrl, `approval record for ${entry.canonical_identity}`);
    let record;
    try {
      record = JSON.parse(await response.text());
    } catch {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Approval record is malformed for ${entry.canonical_identity}.`);
    }
    const { unsigned, expectedPayloadHash } = validateApproval(record, entry, manifest.raw.approval_reference_package_sha256);
    const payload = new TextEncoder().encode(JSON.stringify(unsigned));
    const actualPayloadHash = await sha256(payload, cryptoImpl);
    if (actualPayloadHash !== expectedPayloadHash) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.MANIFEST_INVALID, `Approval signature payload is stale for ${entry.canonical_identity}.`);
    }
  }

  function availabilityFrom(manifest, identity, state) {
    if (!LEGAL_STATE_SET.has(state)) {
      return Object.freeze({ identity, state, available: false, code: CANONICAL_GLYPH_ERROR_CODES.UNKNOWN_STATE, blocker: null });
    }
    const entry = manifest.identities.get(identity);
    if (!entry) return Object.freeze({ identity, state, available: false, code: CANONICAL_GLYPH_ERROR_CODES.UNKNOWN_IDENTITY, blocker: null });
    if (!entry.candidate_path) return Object.freeze({ identity, state, available: false, code: CANONICAL_GLYPH_ERROR_CODES.UNAVAILABLE_MASTER, blocker: entry.blocker ?? null });
    const stateEntry = manifest.states.get(state);
    if (state !== 'plain' && !stateEntry.overlay_path) return Object.freeze({ identity, state, available: false, code: CANONICAL_GLYPH_ERROR_CODES.UNAVAILABLE_OVERLAY, blocker: stateEntry.blocker ?? null });
    return Object.freeze({ identity, state, available: true, code: null, blocker: null, sourceStatus: entry.status });
  }

  async function loadCanonicalGlyph(identity, { state = 'plain', signal } = {}) {
    validateAbortSignal(signal);
    if (!LEGAL_STATE_SET.has(state)) throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.UNKNOWN_STATE, `Unknown canonical glyph state: ${state}.`, { identity, state });
    const manifest = await raceAbort(getManifest(), signal);
    const entry = manifest.identities.get(identity);
    if (!entry) throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.UNKNOWN_IDENTITY, `Unknown canonical glyph identity: ${identity}.`, { identity, state });
    if (!entry.candidate_path || !entry.candidate_sha256) throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.UNAVAILABLE_MASTER, `Canonical master is unavailable: ${identity}.`, { identity, state, blocker: entry.blocker ?? null });
    const stateEntry = manifest.states.get(state);
    if (state !== 'plain' && (!stateEntry.overlay_path || !stateEntry.sha256)) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.UNAVAILABLE_OVERLAY, `Canonical overlay is unavailable: ${state}.`, { identity, state, blocker: stateEntry.blocker ?? null });
    }

    const masterUrl = joinUrl(resolvedManifestUrl, entry.candidate_path);
    const overlayUrl = state === 'plain' ? null : joinUrl(resolvedManifestUrl, stateEntry.overlay_path);
    const completed = Promise.all([
      getVerifiedBytes(masterUrl, entry.candidate_sha256, `master ${identity}`),
      overlayUrl ? getVerifiedBytes(overlayUrl, stateEntry.sha256, `overlay ${state}`) : null,
      verifyApproval(entry, manifest)
    ]);
    const [masterBytes, overlayBytes] = await raceAbort(completed, signal);
    validateAbortSignal(signal);

    const master = parseStaticSvg(masterBytes, { documentImpl, label: `Master ${identity}`, expectedViewBox: entry.viewBox });
    const overlay = overlayBytes ? parseStaticSvg(overlayBytes, { documentImpl, label: `Overlay ${state}`, expectedViewBox: entry.viewBox }) : null;
    validateAbortSignal(signal);
    const host = documentImpl.createElement('span');
    host.className = 'relphi-canonical-glyph';
    host.dataset.identity = identity;
    host.dataset.state = state;
    host.dataset.sourceStatus = entry.status;
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', entry.display_name || identity);
    if (entry.status === APPROVED_DIFFERENCE_STATUS) host.setAttribute('aria-description', 'Approved with documented raster difference');
    if (overlay) {
      overlay.classList.add('relphi-canonical-glyph__overlay');
      overlay.setAttribute('aria-hidden', 'true');
      host.append(overlay);
    }
    master.classList.add('relphi-canonical-glyph__master');
    master.setAttribute('aria-hidden', 'true');
    host.append(master);
    const expectedLayerCount = state === 'plain' ? 1 : 2;
    if (host.children.length !== expectedLayerCount) {
      throwGlyphError(CANONICAL_GLYPH_ERROR_CODES.INCOMPLETE_COMPOSITION, 'Canonical glyph composition is incomplete.', { identity, state });
    }
    return host;
  }

  async function preloadCanonicalGlyphs(requests, { signal } = {}) {
    if (!Array.isArray(requests)) throw new TypeError('requests must be an array.');
    const nodes = await raceAbort(Promise.all(requests.map(request => {
      if (typeof request === 'string') return loadCanonicalGlyph(request, { signal });
      return loadCanonicalGlyph(request?.identity, { state: request?.state ?? 'plain', signal });
    })), signal);
    return Object.freeze(nodes.map(node => node.cloneNode(true)));
  }

  async function inspectCanonicalGlyphAvailability(identity, state = 'plain') {
    return availabilityFrom(await getManifest(), identity, state);
  }

  function clearCanonicalGlyphCache() {
    verifiedBytes.clear();
    inFlightBytes.clear();
    manifestPromise = undefined;
  }

  return Object.freeze({
    loadCanonicalGlyph,
    preloadCanonicalGlyphs,
    inspectCanonicalGlyphAvailability,
    clearCanonicalGlyphCache
  });
}

let defaultLoader;
function getDefaultLoader() {
  if (!defaultLoader) defaultLoader = createCanonicalGlyphLoader();
  return defaultLoader;
}

export const loadCanonicalGlyph = (identity, options) => getDefaultLoader().loadCanonicalGlyph(identity, options);
export const preloadCanonicalGlyphs = (requests, options) => getDefaultLoader().preloadCanonicalGlyphs(requests, options);
export const inspectCanonicalGlyphAvailability = (identity, state) => getDefaultLoader().inspectCanonicalGlyphAvailability(identity, state);
export const clearCanonicalGlyphCache = () => getDefaultLoader().clearCanonicalGlyphCache();

