const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('tarot.html','utf8');
const connector = fs.readFileSync('relphi-sky-connector-v1.js','utf8');
const app = fs.readFileSync('tarot-app.js','utf8');

assert.match(html,/id="relphiLedgerSkyConnectorHost"/);
assert.match(connector,/const ledgerHost=document.getElementById('relphiLedgerSkyConnectorHost')/);
assert.match(connector,/host=ledgerHost||actions/);

assert.match(app,/function connectedSkyEntryHtml(card)/);
assert.match(app,/Connected Sky/);
assert.match(app,/connectedSkyEntryHtml(card)/);

assert.match(app,/['connector','Sky Connector']/);
assert.match(app,/['connected sky','Search Connected Sky Cards']/);
assert.match(app,/lower === 'connector'/);
assert.match(app,/runSearch('connected sky')/);

assert.match(app,/function isConnectedSkyQuery(value)/);
assert.match(app,/if (isConnectedSkyQuery(raw)) return connectedSkyCards()/);
assert.match(app,/Cards activated by ${connectedSkyName()}/);
assert.match(app,/window.addEventListener('relphi:sky-context-change'/);

console.log('Tarot Ledger owns Sky Connector context across entry, command, and search.');
