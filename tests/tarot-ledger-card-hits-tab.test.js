const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('tarot.html','utf8');
const app = fs.readFileSync('tarot-app.js','utf8');
const css = fs.readFileSync('tarot-sky-connector-v1.css','utf8');

assert.match(html,/id="ledgerSkyHitsTab"[^>]+role="tab"[^>]+Card Hits from Sky/);
assert.match(html,/id="cardHitsPanel"[^>]+role="tabpanel"/);
assert.match(html,/id="cardHitsList"/);
assert.match(html,/id="cardHitsDetail"/);

assert.match(app,/function openSkyHitsTab()/);
assert.match(app,/state.mode='sky-hits'/);
assert.match(app,/function renderSkyCardHits()/);
assert.match(app,/window.RelphiSkyConnector?.tarotActivations?.()/);
assert.match(app,/renderCardSurface(card,{context:'sky-hits',selectable:false})/);
assert.match(app,/data-card-hit-detail/);
assert.match(app,/cardDetailHtml(card,'Card Hit from Sky')/);
assert.match(app,/mode === 'sky-hits'/);
assert.match(app,/renderSkyCardHits()/);
assert.match(app,/['card hits','Card Hits from Sky']/);

assert.match(css,/.tarot-ledger-tabs/);
assert.match(css,/.tarot-card-hit-row/);
assert.match(css,/.tarot-card-hit-evidence/);

console.log('Tarot Ledger Card Hits from Sky tab is wired to Sky Connector evidence.');
