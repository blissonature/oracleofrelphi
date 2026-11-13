import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const context={window:{}};
runInNewContext(readFileSync('tarot-cards.js','utf8'),context);
runInNewContext(readFileSync('relphi-locked-interpretations.js','utf8'),context);
const cards=context.window.RELPHI_TAROT_CARDS;
const locked=context.window.RELPHI_LOCKED_INTERPRETATIONS;
const record=id=>cards.find(card=>card.card_id===id);
const meaning=id=>locked.cards.find(card=>card.card_id===id)?.relphi_derived_interpretation;

test('both harmonic passages appear in existing locked Relphi-derived interpretation',()=>{
  const lovers=meaning('the_lovers'),art=meaning('temperance');
  assert.ok(lovers&&art);
  const passage='Self and other can cease to be opposites without ceasing to be themselves.';
  for(const text of [lovers,art]){
    assert.ok(text.includes(passage));
    assert.match(text,/two musical notes/);
    assert.match(text,/doesn't require either note to lose its pitch/);
    assert.match(text,/neither is distinguishable/);
  }
  assert.match(lovers,/independent voice and capacity to choose/);
  assert.match(art,/shared direction to distinct voices/);
  assert.match(art,/visual hypothesis, not a verified statement/);
  assert.equal(record('the_lovers')?.astrology.sign,'Gemini');
  assert.equal(record('temperance')?.astrology.sign,'Sagittarius');
});

test('the full entry remains single-owner and does not add a second Relphi interpretation',()=>{
  const app=readFileSync('tarot-app.js','utf8');
  const detail=app.slice(app.indexOf('function cardDetailHtml('),app.indexOf('function bindDetailCustomArt'));
  assert.match(detail,/lockedRelphiInterpretation\(card\)/);
  assert.doesNotMatch(app,/rel\.harmonic_union_reflection|rel\.toroidal_visual_observation/);
  for(const card of [record('the_lovers'),record('temperance')]){
    assert.equal(card.relphi.harmonic_union_reflection,undefined);
    assert.equal(card.relphi.toroidal_visual_observation,undefined);
  }
});

test('existing reversed owner carries distinct derived counterparts',()=>{
  const reverse=readFileSync('tarot-reversed-copy-v1.js','utf8');
  const lovers=reverse.match(/the_lovers: '([^']+)'/)?.[1]||'';
  const art=reverse.match(/temperance: '([^']+)'/)?.[1]||'';
  assert.match(lovers,/reluctant participation for freely chosen intimacy/);
  assert.match(lovers,/recovering an independent no/);
  assert.match(art,/conformity in place of communion/);
  assert.match(art,/does not require either participant to lose its pitch/);
  assert.match(reverse,/Relphi-derived reversed interpretation/);
});
