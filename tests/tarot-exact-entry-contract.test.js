const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'tarot-app.js'),'utf8');
const interactions=fs.readFileSync(path.join(root,'drawing-board-interactions-v1.js'),'utf8');
const navloader=fs.readFileSync(path.join(root,'navloader.js'),'utf8');
const revealFullCard=interactions.match(/function revealFullCard\(identity\) \{[\s\S]*?\n  \}/)?.[0]||'';

assert.match(app,/window\.RelphiTarotLedger = Object\.freeze\(\{/);
assert.match(app,/openFullEntry\(cardId,presentationMode='ledger'\)[\s\S]{0,240}cardById\(String\(cardId \|\| ''\)\.trim\(\)\)/);
assert.match(app,/presentationMode === 'inspector'\) openDedicatedSkyCardInspector\(card\)/);
assert.match(app,/else openFullEntryById\(card\.card_id\)/);
assert.match(app,/openFromLocation\(\)[\s\S]{0,180}searchParams\.get\('card'\)/);
assert.match(app,/function openFullEntryById\(id\)[\s\S]{0,700}renderDetail\(card\)/);
assert.match(interactions,/RelphiTarotLedger\?\.openFullEntry\(identity\.id, 'ledger'\)/);
assert.doesNotMatch(revealFullCard,/oracleCommand|runSearch|requestAnimationFrame|setTimeout/);
assert.match(navloader,/relphi:tarot-enhancements-ready/);
assert.match(navloader,/RelphiTarotLedger\?\.openFromLocation\(\)/);

console.log('Tarot exact-entry contract regression checks passed');
