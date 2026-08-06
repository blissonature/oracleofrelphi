import '../../relphi-canonical-glyph-element-v1.js';
import { createCanonicalGlyphLoader } from '../../relphi-canonical-glyph-loader-v1.js';

const STATES = ['plain', 'circled', 'day-ruler', 'hour-ruler', 'day-and-hour-ruler'];
const manifestUrl = '../../assets/canonical-glyphs/v1/manifest.json';
const manifest = await (await fetch(manifestUrl)).json();
const matrix = document.querySelector('#matrix');
const summary = document.querySelector('#summary');
const live = document.querySelector('#live');
const errors = document.querySelector('#errors');
const elements = [];
let completed = 0;
let failed = 0;
document.addEventListener('relphi-canonical-glyph-load', () => { completed += 1; updateSummary(); });
document.addEventListener('relphi-canonical-glyph-error', () => { failed += 1; updateSummary(); });

for (const [index, entry] of manifest.identities.entries()) {
  const card = document.createElement('article');
  card.className = `card${index % 2 ? ' dark' : ''}`;
  card.dataset.identity = entry.canonical_identity;
  card.dataset.availability = entry.candidate_path ? 'available' : 'unavailable';
  card.dataset.sourceStatus = entry.status;
  const heading = document.createElement('h3');
  heading.textContent = `${entry.display_name} (${entry.canonical_identity})`;
  const states = document.createElement('div');
  states.className = 'states';
  for (const state of STATES) {
    const glyph = document.createElement('relphi-canonical-glyph');
    glyph.identity = entry.canonical_identity;
    glyph.state = state;
    glyph.title = `${entry.display_name}, ${state}`;
    glyph.setAttribute('tabindex', '0');
    glyph.dataset.contractState = state;
    elements.push(glyph);
    states.append(glyph);
  }
  card.append(heading, states);
  if (entry.status === 'approved-with-documented-raster-difference') {
    const provenance = document.createElement('p');
    provenance.className = 'provenance';
    provenance.textContent = 'Approved documented raster difference';
    card.append(provenance);
  }
  matrix.append(card);
}

const fixtureModes = [
  ['missing-file', async url => String(url).includes('/mercury.svg') ? new Response('', { status: 404 }) : fetch(url)],
  ['hash-mismatch', async url => String(url).includes('/mercury.svg') ? new Response(`${await (await fetch(url)).text()} `) : fetch(url)],
  ['malformed-manifest', async url => String(url).endsWith('/manifest.json') ? new Response('{}') : fetch(url)]
];
for (const [name, fetchImpl] of fixtureModes) {
  const panel = document.createElement('div');
  panel.className = 'error-scenario';
  panel.dataset.scenario = name;
  const loader = createCanonicalGlyphLoader({ manifestUrl, fetchImpl });
  try {
    await loader.loadCanonicalGlyph('mercury');
    panel.textContent = `${name}: UNEXPECTED SUCCESS`;
  } catch (error) {
    panel.textContent = `${name}: ${error.code}`;
    panel.dataset.errorCode = error.code;
  }
  errors.append(panel);
}

function updateSummary() {
  summary.textContent = `${completed} completed / ${failed} explicit failures / ${elements.length} requests`;
  summary.dataset.settled = completed + failed === elements.length ? 'true' : 'false';
}

document.querySelector('#size').addEventListener('input', event => document.documentElement.style.setProperty('--relphi-glyph-size', `${event.target.value}px`));
document.querySelector('#color').addEventListener('input', event => document.documentElement.style.setProperty('--relphi-glyph-color', event.target.value));
document.querySelector('#rapid').addEventListener('click', async () => {
  const probe = elements[0];
  probe.identity = 'mercury'; probe.state = 'circled'; probe.identity = 'venus'; probe.state = 'plain';
  await new Promise(resolve => probe.addEventListener('relphi-canonical-glyph-load', resolve, { once: true }));
  live.textContent = `Rapid switch committed ${probe.dataset.identity}/${probe.dataset.state}.`;
});
document.querySelector('#concurrent').addEventListener('click', async () => {
  const loader = createCanonicalGlyphLoader({ manifestUrl });
  const nodes = await Promise.all(Array.from({ length: 24 }, () => loader.loadCanonicalGlyph('neptune', { state: 'circled' })));
  live.textContent = `Concurrent load completed ${new Set(nodes).size} independent static instances.`;
});
document.querySelector('#clear-cache').addEventListener('click', () => {
  const loader = createCanonicalGlyphLoader({ manifestUrl });
  loader.clearCanonicalGlyphCache();
  live.textContent = 'A review loader cache was cleared without mutating package files.';
});

window.canonicalContractHarness = Object.freeze({ manifest, elements, states: STATES });
