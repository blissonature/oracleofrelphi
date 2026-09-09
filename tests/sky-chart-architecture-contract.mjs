import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const html=read('sky-chart.html');
const shell=read('sky-chart-card-shell-v2.js');
const whereWhen=read('sky-chart-where-when-v3.js');
const draft=read('sky-chart-where-when-draft-heptagram-v4.js');
const stability=read('sky-chart-render-stability-v2.js');
const foundation=read('sky-chart-foundation-v2.js');
const finalBehavior=read('sky-chart-final-behavior-v2.js');
const quickCopy=read('sky-chart-quick-copy-v2.js');

for(const source of ['sky-chart-static-heptagram-v1.js','sky-chart-update-now-stability-v1.js','sky-chart-regression-integrity-v1.js']){
  assert.equal(fs.existsSync(source),false,`${source} should be removed after consolidation`);
  assert.equal(html.includes(source),false,`${source} must not be loaded`);
}
assert.equal(html.includes('sky-inferred-location-presentation'),false,'Inferred-location presentation must not be an inline repair script');
assert.match(html,/sky-chart-card-shell-v2\.js/);
assert.match(html,/sky-chart-where-when-v3\.js/);
assert.match(html,/sky-chart-where-when-draft-heptagram-v4\.js/);
assert.match(html,/sky-chart-where-when-viewport-v3\.js/);
assert.match(html,/sky-chart-render-stability-v2\.js/);

assert.match(shell,/sky-placement-copy-title">Placements</,'Placements header must exist in shell markup before first paint');
assert.match(shell,/data-sky-drawer-mount="placements"/,'Foundation must receive a stable placements content mount');
assert.match(shell,/relphi:sky-drawer-preparing/,'Where and When must prepare synchronously before drawer reveal');
assert.equal(shell.includes('afterFrames('),false,'Drawer switching must not rely on frame-count timing');

assert.match(whereWhen,/>Here and Now</,'Where and When owns Here and Now');
assert.match(whereWhen,/>Current local time</,'Where and When owns selected-location current time');
assert.equal(whereWhen.includes('data-ww-action="use-current-location"'),false,'No competing current-location control should be repaired away later');
assert.equal(whereWhen.includes('data-final-now'),false,'Legacy final-now control must not exist');
assert.match(whereWhen,/sky-where-when-footer-actions/,'Footer action structure must be source markup');
assert.match(whereWhen,/data-ww-heptagram-slot/,'Footer heptagram mount must be source markup');
assert.match(whereWhen,/Location inferred from pasted placements/,'Inference confirmation semantics belong to Where and When');

assert.equal(draft.includes('MutationObserver'),false,'Draft heptagram must render from explicit events, not DOM repair observation');
assert.equal(draft.includes('preview.before(advanced)'),false,'Draft heptagram must not reorder the editor after creation');
assert.equal(stability.includes('window.addEventListener=function'),false,'Render stability must never monkeypatch addEventListener');
assert.equal(foundation.includes("relphi:sky-where-when-edit-state-changed',event=>{if(event.detail?.active===false)void render(true)"),false,'Unchanged editor closes must not force a foundation render');
assert.equal(finalBehavior.includes('loadRegressionIntegrity'),false,'Final behavior must not dynamically load regression hotfixes');
assert.equal(quickCopy.includes("title.textContent='Placements'"),false,'Copy behavior must not create the Placements heading');

console.log('Sky Chart architecture contract passed.');
