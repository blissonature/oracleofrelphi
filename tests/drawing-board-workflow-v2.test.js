const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, 'drawing-board-workflow-v2.js'), 'utf8');
const interactions = fs.readFileSync(path.join(root, 'drawing-board-interactions-v1.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');
const tarot = fs.readFileSync(path.join(root, 'tarot-app.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'tarot.html'), 'utf8');

assert.match(nav, /drawing-board-workflow-v2\.js\?v=24/);
assert.match(nav, /drawing-board-interactions-v1\.js\?v=5/);
assert.match(nav, /drawing-board-spread-prefabs-v1\.js\?v=10/);
assert.match(page, /navloader\.js\?v=56/);
assert.match(page, /tarot-app\.js\?v=366/);

assert.match(workflow, /Show position stickers/);
assert.match(workflow, /Position #/);
assert.doesNotMatch(workflow, /relphiDrawingBoardStickerPrefabsV1/);
assert.doesNotMatch(workflow, /Save as prefab/);
assert.doesNotMatch(workflow, /data-custom-sticker-prefab/);
assert.doesNotMatch(workflow, /function addPrefabControls/);
assert.doesNotMatch(workflow, /const PREFAB_KEY/);
assert.doesNotMatch(interactions, /select\.id = 'rowPositionPrefabSelect'/);
assert.doesNotMatch(interactions, /Choose a position-sticker prefab/);
assert.doesNotMatch(workflow, /rowStickerPrefabLoad/);
assert.doesNotMatch(workflow, /rowStickerPrefabApply/);
assert.doesNotMatch(workflow, /location\.reload\(\)/);
assert.doesNotMatch(workflow, /compactDefaultCards/);
assert.match(workflow, /user-select:text!important/);
assert.match(workflow, /function beginDescriptionSelection/);
assert.match(workflow, /card\.draggable = false/);
assert.match(workflow, /card\.draggable = true/);
assert.match(workflow, /descriptionSelecting/);
assert.match(workflow, /document\.addEventListener\('selectstart'/);
assert.match(workflow, /document\.addEventListener\('dragstart'/);
assert.match(workflow, /-webkit-user-drag:none!important/);
assert.match(workflow, /Helpful tip/);
assert.match(workflow, /removeUnavailableSelectionControls/);
assert.match(workflow, /'resetRowCardTransform', 'selectAllRow', 'clearRowSelection'/);
assert.match(workflow, /function organizeBoardOptions/);
assert.match(workflow, /function organizeBoardHeader/);
assert.match(workflow, /board-header-group--create/);
assert.match(workflow, /board-history-menu/);
assert.doesNotMatch(workflow, /Spread design', 'Choose a reusable design or type position stickers for a custom one/);
assert.match(workflow, /> Show position stickers/);
assert.match(workflow, /Reading details', 'Name the reading and keep its notes together/);
assert.match(workflow, /Draw settings', 'Choose the cards available for this reading/);
assert.match(workflow, /labelsStaging\.className = 'board-labels-staging'/);
assert.match(workflow, /move\(labelsStaging, control\('rowPositionLabels'\)\)/);
assert.match(workflow, /move\(labelsStaging, control\('rowPositionStickersQuick'\)\)/);
assert.match(workflow, /move\(drawSetup, control\('rowAllowRepeats'\)\)/);
assert.match(workflow, /move\(drawSetup, control\('rowAllowReversalsQuick'\)\)/);
assert.match(workflow, /board-setup-group--draw \.spread-toggle,html body #shortListPanel \.board-setup-group--draw \.quick-reversal-toggle\{display:flex!important;flex-direction:row!important;align-items:center!important;gap:\.4rem!important;width:100%!important/);
assert.match(workflow, /board-setup-group--draw \.quick-reversal-toggle input\{flex:0 0 auto!important;width:1rem!important;height:1rem!important;margin:0!important\}/);
assert.match(workflow, /function normalizeDisabledButtonCursors\(panel\)/);
assert.match(workflow, /button\.style\.setProperty\('cursor', 'default', 'important'\)/);
assert.match(workflow, /#undoShortList:disabled[\s\S]*#redoShortList:disabled[\s\S]*#clearShortList:disabled\{[\s\S]*cursor:default!important\}/);
assert.match(workflow, /#undoShortList:disabled[\s\S]*#redoShortList:disabled[\s\S]*#clearShortList:disabled\{opacity:\.4!important;border:1px solid rgba\(17,17,17,\.28\)!important;background:#fffdf8!important;color:rgba\(17,17,17,\.48\)!important/);
assert.match(interactions, /html body #shortListPanel \.board-history-icon:disabled\{opacity:\.4!important;border:1px solid rgba\(17,17,17,\.28\)!important;background:#fffdf8!important;color:rgba\(17,17,17,\.48\)!important;box-shadow:none!important;cursor:default!important\}/);
assert.doesNotMatch(workflow, /move\(choices, '\.quick-position-sticker-toggle'\)/);
assert.match(workflow, /panel\.querySelector\('#rowPositionStickersQuick'\)/);
assert.match(workflow, /settingsPanel.*Board options/);
assert.match(workflow, /Reading setup/);
assert.match(workflow, /Arrange board/);
assert.match(workflow, /Alignment snap controls/);
assert.match(workflow, /Rotation snap controls/);
assert.match(workflow, /Save & export/);
assert.match(workflow, /Download board data \(JSON\)/);
assert.match(workflow, /Download web version/);
assert.match(workflow, /Print \/ save PDF/);
assert.match(workflow, /Card \/ placeholder color/);
assert.match(workflow, /Upload board image/);
assert.match(workflow, /Remove board image/);
assert.match(workflow, /applyEnvelopeColor/);
assert.match(workflow, /background-color', color, 'important'/);
assert.match(workflow, /card-row-workspace-toolbar\{border-radius:12px!important\}/);
assert.match(workflow, /board-options-toggle/);
assert.match(workflow, /board-options-tabs/);
assert.match(workflow, /board-arrange-flyout/);
assert.match(workflow, /board-arrange-trigger/);
assert.match(workflow, /workspaceToolbar\.appendChild\(flyout\)/);
assert.match(workflow, /card-row-position-label\{grid-column:1\/-1!important;grid-row:1!important\}/);
assert.match(workflow, /repeat\(3,minmax\(0,1fr\)\)/);
assert.match(workflow, /role', 'tablist/);
assert.match(workflow, /board-options-body/);
assert.match(workflow, /is-collapsed/);
assert.match(workflow, /aria-expanded/);
assert.match(workflow, /grid-template-columns:1fr!important/);
assert.match(workflow, /accent-color:#111!important/);
assert.match(workflow, /card-row-placeholder-item\{height:max-content!important;min-height:0!important/);
assert.match(workflow, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
assert.match(workflow, /card-row-control-block--layout \.board-options-body\{display:grid!important;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(workflow, /board-snap-control\{grid-template-columns:minmax\(6\.5rem,1fr\) 2rem/);
assert.match(workflow, /'downloadRowHtml', 'downloadRowTextHtml', 'printCardRowImage', 'snapshotCardRowArrangement'/);
assert.match(page, />Hide Cards<\/button>/);
assert.match(page, /<details open>/);

assert.match(workflow, /assets\/tarot\/rws-export\//);
assert.match(workflow, /\.webp/);
assert.match(workflow, /Download web version/);
assert.match(workflow, /Oracle of Relphi/);
assert.match(workflow, /A Relphi reading/);
assert.match(workflow, /logo\.png/);
assert.match(workflow, /reading-notes/);
assert.match(workflow, /\.orientation\.is-reversed/);
assert.match(workflow, /printWindow\.print\(\)/);
assert.match(workflow, /card img\.reversed\{transform:rotate\(180deg\)\}/);

assert.match(tarot, /function rowCardInterpretation[\s\S]*layerInterpretationForOrientation/);
assert.match(tarot, /return reversed \? reversedDerivedMeaning\(card\) : layerInterpretation\(card\)/);
assert.match(tarot, /data-row-reverse=/);
assert.match(tarot, /reversed shows its core operation turning inward/);
assert.doesNotMatch(tarot, /Number layer under reversal/);
assert.match(tarot, /CARD_ROW_DEFAULT_GAP_X_PX = 0/);
assert.match(tarot, /CARD_ROW_DEFAULT_GAP_Y_PX = 0/);
assert.match(tarot, /CARD_ROW_LEGACY_DEFAULT_GAPS/);

const sandbox = {
  location:{ pathname:'/tarot.html', search:'', hash:'', href:'https://oracleofrelphi.com/tarot.html' },
  document:{ readyState:'loading', addEventListener(){} },
  localStorage:{ getItem(){ return null; }, setItem(){}, removeItem(){} },
  sessionStorage:{ getItem(){ return null; }, setItem(){}, removeItem(){} },
  URL, Intl, Date, Event, Blob, console
};
vm.createContext(sandbox);
vm.runInContext(workflow.replace(/\}\)\(\);\s*$/, 'globalThis.__printableHtml = printableHtml;\n})();'), sandbox);
const card = {
  dataset:{ rowCard:'the_fool', rowReversed:'false' },
  querySelector(selector) {
    if (selector === '.or-card-title-banner') return { textContent:'The Fool' };
    if (selector === '.or-layer-scroll span') return { textContent:'Breath before form and movement before identity.' };
    return null;
  }
};
const item = {
  classList:{ contains(){ return false; } },
  querySelector(selector) {
    if (selector === '[data-row-card]') return card;
    if (selector === '.card-row-position-editor') return { textContent:'The beginning' };
    return null;
  }
};
const panel = {
  querySelectorAll(){ return [item]; },
  querySelector(selector) {
    if (selector === '#rowName') return { value:'Sample Reading' };
    if (selector === '#rowNotes') return { value:'A sample note.' };
    return null;
  }
};
const exportedHtml = sandbox.__printableHtml(panel);
assert.match(exportedHtml, /<strong>Oracle of Relphi<\/strong>/);
assert.match(exportedHtml, /Sample Reading/);
assert.match(exportedHtml, /The beginning/);
assert.match(exportedHtml, /the_fool\.webp/);
assert.match(exportedHtml, /assets\/tarot\/rws-export\/the_fool\.webp/);
assert.match(exportedHtml, /A sample note\./);

console.log('Drawing Board workflow v2 regression checks passed.');
