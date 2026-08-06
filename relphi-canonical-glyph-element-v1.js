import {
  createCanonicalGlyphLoader,
  CANONICAL_GLYPH_ERROR_CODES,
  CanonicalGlyphError
} from './relphi-canonical-glyph-loader-v1.js';

const TAG_NAME = 'relphi-canonical-glyph';
const DEFAULT_STATE = 'plain';
const MANIFEST_URL = new URL('./assets/canonical-glyphs/v1/manifest.json', import.meta.url).href;

const STYLE = `
  :host {
    display: inline-block;
    inline-size: var(--relphi-glyph-size, 1em);
    block-size: var(--relphi-glyph-size, 1em);
    color: var(--relphi-glyph-color, currentColor);
    opacity: var(--relphi-glyph-opacity, 1);
    vertical-align: middle;
  }
  #frame {
    position: relative;
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
  #frame > .relphi-canonical-glyph {
    position: relative;
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
  #frame svg {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
  }
  #frame .relphi-canonical-glyph__master [stroke] {
    stroke: var(--relphi-glyph-color, currentColor);
  }
  #frame .relphi-canonical-glyph__master [fill]:not([fill="none"]) {
    fill: var(--relphi-glyph-color, currentColor);
  }
  #frame .relphi-canonical-glyph__overlay [stroke] {
    stroke: var(--relphi-glyph-color, currentColor);
  }
  #error {
    box-sizing: border-box;
    display: grid;
    place-items: center;
    inline-size: 100%;
    block-size: 100%;
    border: 1px solid currentColor;
    padding: .15em;
    font: 600 .28em/1.15 system-ui, sans-serif;
    text-align: center;
    overflow-wrap: anywhere;
  }
  [hidden] { display: none !important; }
`;

function immutableEventDetail(detail) {
  return Object.freeze({ ...detail });
}

export class RelphiCanonicalGlyphElement extends HTMLElement {
  static get observedAttributes() { return ['identity', 'state']; }

  #loader;
  #controller;
  #revision = 0;
  #frame;
  #error;

  constructor() {
    super();
    this.#loader = createCanonicalGlyphLoader({ documentImpl: this.ownerDocument, manifestUrl: MANIFEST_URL });
    const shadow = this.attachShadow({ mode: 'open' });
    const style = this.ownerDocument.createElement('style');
    style.textContent = STYLE;
    this.#frame = this.ownerDocument.createElement('span');
    this.#frame.id = 'frame';
    this.#frame.setAttribute('part', 'frame');
    this.#error = this.ownerDocument.createElement('span');
    this.#error.id = 'error';
    this.#error.hidden = true;
    this.#error.setAttribute('part', 'error');
    this.#error.setAttribute('role', 'status');
    shadow.append(style, this.#frame, this.#error);
  }

  get identity() { return this.getAttribute('identity') ?? ''; }
  set identity(value) { value === null ? this.removeAttribute('identity') : this.setAttribute('identity', String(value)); }
  get state() { return this.getAttribute('state') || DEFAULT_STATE; }
  set state(value) { value === null ? this.removeAttribute('state') : this.setAttribute('state', String(value)); }

  connectedCallback() {
    this.#render();
  }

  disconnectedCallback() {
    this.#revision += 1;
    this.#controller?.abort('element detached');
    this.#controller = undefined;
    this.#frame.replaceChildren();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) this.#render();
  }

  async #render() {
    const identity = this.identity.trim();
    const state = this.state;
    const revision = ++this.#revision;
    this.#controller?.abort('superseded glyph request');
    this.#controller = new AbortController();
    this.#frame.replaceChildren();
    this.#error.hidden = true;
    this.#error.textContent = '';
    this.removeAttribute('data-status');
    this.setAttribute('aria-busy', 'true');
    this.setAttribute('data-identity', identity);
    this.setAttribute('data-state', state);

    if (!identity) {
      this.#commitError(new CanonicalGlyphError(
        CANONICAL_GLYPH_ERROR_CODES.UNKNOWN_IDENTITY,
        'Canonical glyph identity is required.',
        { identity, state }
      ), revision, identity, state);
      return;
    }

    try {
      const instance = await this.#loader.loadCanonicalGlyph(identity, { state, signal: this.#controller.signal });
      if (!this.isConnected || revision !== this.#revision) return;
      this.#frame.replaceChildren(instance);
      this.#error.hidden = true;
      this.setAttribute('data-status', 'ready');
      this.setAttribute('aria-label', instance.getAttribute('aria-label') || identity);
      this.setAttribute('aria-busy', 'false');
      this.dispatchEvent(new CustomEvent('relphi-canonical-glyph-load', {
        bubbles: true,
        composed: true,
        detail: immutableEventDetail({ identity, state, sourceStatus: instance.dataset.sourceStatus })
      }));
    } catch (error) {
      this.#commitError(error, revision, identity, state);
    }
  }

  #commitError(error, revision, identity, state) {
    if (!this.isConnected || revision !== this.#revision || error?.code === CANONICAL_GLYPH_ERROR_CODES.REQUEST_ABORTED) return;
    const structured = error instanceof CanonicalGlyphError
      ? error
      : new CanonicalGlyphError(CANONICAL_GLYPH_ERROR_CODES.INCOMPLETE_COMPOSITION, 'Canonical glyph element could not complete.', { cause: error?.message ?? String(error) });
    this.#frame.replaceChildren();
    this.#error.textContent = `${structured.code}: ${structured.message}`;
    this.#error.hidden = false;
    this.setAttribute('data-status', 'error');
    this.setAttribute('data-error-code', structured.code);
    this.setAttribute('aria-label', `${identity || 'Unknown glyph'} unavailable`);
    this.setAttribute('aria-busy', 'false');
    this.dispatchEvent(new CustomEvent('relphi-canonical-glyph-error', {
      bubbles: true,
      composed: true,
      detail: immutableEventDetail({ identity, state, code: structured.code, message: structured.message, details: structured.details })
    }));
  }
}

if (!customElements.get(TAG_NAME)) customElements.define(TAG_NAME, RelphiCanonicalGlyphElement);
