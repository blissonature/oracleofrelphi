import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const html=read('sky-chart.html');
const shell=read('sky-chart-card-shell-v2.js');
const whereWhen=read('sky-chart-where-when-v3.js');
const draft=read('sky-chart-where-when-draft-heptagram-v4.js');
const paste=read('sky-chart-where-when-paste-inference-v2.js');
const viewport=read('sky-chart-where-when-viewport-v3.js');
const stability=read('sky-chart-render-stability-v2.js');
const foundation=read('sky-chart-foundation-v2.js');
const finalBehavior=read('sky-chart-final-behavior-v2.js');
const quickCopy=read('sky-chart-quick-copy-v2.js');
const identity=read('sky-chart-sky-identity-affordance-v1.js');

const retired=[
  'sky-chart-card-shell-v1.js',
  'sky-chart-quick-copy-v1.js',
  'sky-chart-render-stability-v1.js',
  'sky-chart-where-when-v2.js',
  'sky-chart-where-when-draft-heptagram-v3.js',
  'sky-chart-where-when-paste-inference-v1.js',
  'sky-chart-where-when-viewport-v2.js',
  'sky-chart-static-heptagram-v1.js',
  'sky-chart-update-now-stability-v1.js',
  'sky-chart-regression-integrity-v1.js'
];
for(const source of retired){
  assert.equal(fs.existsSync(source),false,`${source} should be removed after consolidation`);
  assert.equal(html.includes(source),false,`${source} must not be loaded`);
}

assert.equal(html.includes('sky-inferred-location-presentation'),false,'Inferred-location presentation must not be an inline repair script');
for(const source of [
  'sky-chart-card-shell-v2.js',
  'sky-chart-quick-copy-v2.js',
  'sky-chart-render-stability-v2.js',
  'sky-chart-where-when-v3.js',
  'sky-chart-where-when-draft-heptagram-v4.js',
  'sky-chart-where-when-paste-inference-v2.js',
  'sky-chart-where-when-viewport-v3.js'
])assert.ok(html.includes(source),`${source} must be loaded`);

assert.match(shell,/sky-placement-copy-title">Placements</,'Placements header must exist in shell markup before first paint');
assert.match(shell,/data-sky-drawer-mount="placements"/,'Foundation must receive a stable placements content mount');
assert.match(shell,/relphi:sky-drawer-preparing/,'Where and When must prepare synchronously before drawer reveal');
assert.equal(shell.includes('afterFrames('),false,'Drawer switching must not rely on frame-count timing');
assert.equal(shell.includes('data-where-prewarming'),false,'Drawer switching must not require a prewarm repair state');

assert.match(whereWhen,/>Here and Now</,'Where and When owns Here and Now');
assert.match(whereWhen,/>Current local time</,'Where and When owns selected-location current time');
assert.equal(whereWhen.includes('data-ww-action="use-current-location"'),false,'No competing current-location control should be repaired away later');
assert.equal(whereWhen.includes('data-final-now'),false,'Legacy final-now control must not exist');
assert.match(whereWhen,/sky-where-when-footer-actions/,'Footer action structure must be source markup');
assert.match(whereWhen,/data-ww-heptagram-slot/,'Footer heptagram mount must be source markup');
assert.match(whereWhen,/data-ww-paste-inference-host/,'Advanced must expose an explicit placement-inference extension host');
assert.match(whereWhen,/Location inferred from pasted placements/,'Inference confirmation semantics belong to Where and When');
assert.match(whereWhen,/window\.RelphiSkyWhereWhen=Object\.freeze/,'Where and When must expose an explicit extension contract');
assert.match(whereWhen,/finishExternalCommit/,'External placement imports must finish through the controller lifecycle');
assert.match(whereWhen,/relphi:sky-where-when-location-selected/,'Location state changes must be published explicitly');

assert.equal(draft.includes('MutationObserver'),false,'Draft heptagram must render from explicit events, not DOM repair observation');
assert.equal(draft.includes('preview.before(advanced)'),false,'Draft heptagram must not reorder the editor after creation');
assert.match(draft,/relphi:sky-where-when-editor-ready/,'Draft heptagram must start from the editor-ready contract');

assert.equal(paste.includes('MutationObserver'),false,'Paste inference must mount from the explicit editor lifecycle, not DOM observation');
assert.equal(paste.includes('stopImmediatePropagation'),false,'Paste inference must not intercept the controller submit lifecycle');
assert.equal(paste.includes("choice.click()"),false,'Paste inference must not bridge location state through hidden synthetic clicks');
assert.equal(paste.includes("document.createElement('button')"),false,'Paste inference must not create hidden location bridge buttons');
assert.match(paste,/RelphiSkyWhereWhen\.selectPacket/,'Paste inference must select locations through the Where and When API');
assert.match(paste,/RelphiSkyWhereWhen\.finishExternalCommit/,'Paste inference must finish commits through the Where and When API');
assert.match(paste,/window\.RelphiSkyWhereWhenPasteInference=Object\.freeze/,'Paste inference must expose its narrow extension API');
assert.equal(paste.includes('Inferred from pasted placements'),false,'Paste inference must not manufacture the old fake search query marker');
assert.equal(paste.includes('Preview ready.'),false,'Completed inference must not restore obsolete preview-status copy');
assert.equal(paste.includes('Estimated where:'),false,'Completed inference must not restore obsolete estimate summary copy');

assert.match(identity,/pendingResolve/,'Sky naming must queue unresolved identities instead of interrupting an active editor');
assert.match(identity,/relphi:sky-where-when-committed/,'Queued Sky naming must resume only after the Where and When transaction completes');
assert.match(identity,/transactionActive\(\)/,'Sky naming must check the transaction before opening its modal');
assert.equal(identity.includes('requestAnimationFrame(()=>resolve(s))'),false,'Sky naming must not open immediately from a per-slot working-copy update');

assert.equal(viewport.includes('MutationObserver'),false,'Viewport behavior must size only and never repair editor DOM');
assert.equal(stability.includes('window.addEventListener=function'),false,'Render stability must never monkeypatch addEventListener');
assert.equal(foundation.includes("relphi:sky-where-when-edit-state-changed',event=>{if(event.detail?.active===false)void render(true)"),false,'Unchanged editor closes must not force a foundation render');
assert.equal(finalBehavior.includes('loadRegressionIntegrity'),false,'Final behavior must not dynamically load regression hotfixes');
assert.equal(quickCopy.includes("title.textContent='Placements'"),false,'Copy behavior must not create the Placements heading');
assert.equal(quickCopy.includes('sky-placement-copy-row'),false,'Copy behavior must not own persistent Placements chrome');

console.log('Sky Chart architecture contract passed.');