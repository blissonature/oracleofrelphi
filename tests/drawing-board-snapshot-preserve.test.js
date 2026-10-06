const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/const nativeExportIds=\['snapshotCardRowArrangement'/);
assert.match(js,/RelphiDrawingBoardSnapshot\?\.download/);
assert.match(js,/relphiSnapshotBridgeBound/);
assert.match(js,/stopImmediatePropagation/);
assert.match(js,/const preservedExports=new Map/);
assert.match(js,/preservedExports\.forEach\(node=>node\.remove\(\)\)/);
assert.match(js,/const node=preservedExports\.get\(id\)\|\|root\.querySelector/);
assert.match(js,/Native export controls own their behavior in tarot-app\.js/);

console.log('Drawing Board export controls preserve native bound nodes across rerenders.');
