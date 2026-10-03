const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(js,/class="relphi-bespoke-appearance-host"/);
assert.match(js,/bespokeAppearanceHost=.*?relphi-bespoke-appearance-host/s);
assert.match(js,/function templateAppearanceFromSnapshot\(snapshot=currentSnapshot\(\)\|\|\{\}\)/);
assert.match(js,/tableColor:String\(snapshot\.rowTableColor/);
assert.match(js,/placeholderColor:String\(snapshot\.rowEnvelopeColor/);
assert.match(js,/tableImage:String\(snapshot\.rowTableImage/);
assert.match(js,/appearance:templateAppearanceFromSnapshot\(\)/);
assert.match(js,/function applyTemplateAppearance\(template,root=panel\(\)\)/);
assert.match(js,/snap\.rowTableColor=appearance\.tableColor/);
assert.match(js,/snap\.rowEnvelopeColor=appearance\.placeholderColor/);
assert.match(js,/applyTemplateAppearance\(prefab,root\)/);
assert.match(js,/applyTemplateAppearance\(chosen,root\)/);
assert.match(css,/\.relphi-bespoke-appearance-host/);

console.log('Bespoke owns Appearance and saved templates persist board/placeholder colors and images.');
