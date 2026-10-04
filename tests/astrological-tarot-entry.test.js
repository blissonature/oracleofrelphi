const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css=fs.readFileSync('drawing-board-workflow-v2.css','utf8');
const app=fs.readFileSync('tarot-app.js','utf8');
assert.match(js,/Astrological Tarot Reading/);
assert.match(js,/\+ Compare a second sky/);
assert.match(js,/data-remove-astrology-sky="B"/);
assert.match(js,/Connected · /);
assert.match(js,/relphiConnectSky/);
assert.match(js,/RELPHI_ASTROLOGICAL_TAROT_CONTEXT/);
assert.match(js,/options\.textContent='Crafted'/);
assert.match(js,/boardTab\.textContent='Free'/);
assert.match(js,/const scrollTop=body\?\.scrollTop\|\|0/);
assert.match(css,/\.relphi-astrology-surface/);
assert.match(app,/drawing-board-mode-switch/);
assert.match(app,/role="radiogroup" aria-label="Drawing mode"/);
assert.match(app,/>Mode:<\/strong>/);
assert.doesNotMatch(app,/drawing-board-mode-tabs/);
console.log('Crafted Draw exposes the Astrological Tarot Reading setup and preserves pack-selector scroll position.');

assert.match(js,/function astrologyAnalyzeResolved/);
assert.match(js,/function astrologyCardHits/);
assert.match(js,/function astrologyPatterns/);
assert.match(js,/function astrologyQuestionSuggestions/);
assert.match(js,/Suggested questions/);
assert.doesNotMatch(js,/Each sky is a disposable reading copy/);
assert.doesNotMatch(js,/Zodiacal Majors locate houses/);

assert.match(app,/relphi:sky-calculated/);
assert.doesNotMatch(js,/<strong>Sky '\+slot\+'<\/strong>/);
assert.match(js,/Use '\+\(count>1\?'These Skies':'This Sky'\)/);
assert.doesNotMatch(js,/Connect Sky A or Sky A \+ Sky B/);

assert.match(js,/relphi-astrology-factor-number/);
assert.match(js,/Why this factor/);
assert.match(js,/organizing factor/);
assert.match(css,/\.relphi-astrology-factor-list/);
assert.match(css,/\.relphi-astrology-factor-number/);
assert.match(css,/var\(--relphi-board-red/);

assert.doesNotMatch(js,/data-astrology-evidence="/);
assert.doesNotMatch(js,/data-astrology-evidence-master/);
assert.match(js,/Technical evidence/);
assert.match(js,/Inspect raw sky evidence/);
assert.match(js,/astrologyQuestionSuggestions\(analysis,null\)/);

assert.match(js,/astrologyOwnPack\|\|'full'/);
assert.doesNotMatch(js,/Choose sub-pack…/);

assert.doesNotMatch(js,/astrologyDisabledEvidence/);
assert.doesNotMatch(js,/astrologyEvidenceKey/);
assert.doesNotMatch(js,/astrologyEvidenceCategory/);
