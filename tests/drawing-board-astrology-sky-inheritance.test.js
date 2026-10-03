const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const connector = fs.readFileSync('relphi-sky-connector-v1.js','utf8');

assert.match(connector,/window\.RelphiSkyConnector=Object\.freeze\(\{state:\(\)=>\(\{\.\.\.state\(\)\}\),context/);
assert.match(js,/function astrologySharedConnectorSky\(\)/);
assert.match(js,/window\.RelphiSkyConnector\?\.context\?\.\(\)/);
assert.match(js,/relphiDrawingBoardSkyConnectorV1/);
assert.match(js,/function astrologySeedFromSharedConnector\(session\)/);
assert.match(js,/session\.astrologySkyASource=shared\?'saved:'\+shared\.id:'here-now'/);
assert.match(js,/session\.astrologySkyCount=1/);
assert.match(js,/Connected · /);
assert.match(js,/replace it for this reading only/);
assert.match(js,/\+ Compare a second sky/);
assert.match(js,/data-remove-astrology-sky="B"/);
assert.match(js,/session\.astrologySkyCount=1;\s*session\.astrologySkyBSource='here-now'/);
assert.match(js,/function invalidateAstrologyConnection\(session\)/);
assert.match(js,/invalidateAstrologyConnection\(session\);\s*renderOptions\(root,\{preserveScroll:true\}\)/);
assert.match(js,/function astrologySavedSkyRef\(record\)/);

console.log('Astrological Reading inherits the shared sky, supports override/compare, and can remove Sky B.');
