import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'sky-chart-foundation-v1.js'), 'utf8');

function block(name) {
  const match = source.match(new RegExp(`const ${name} = Object\\.freeze\\(\\{([\\s\\S]*?)\\n  \\}\\);`));
  assert.ok(match, `${name} must remain an explicit frozen layout contract.`);
  return match[1];
}

function lanes(layoutBlock, slot) {
  const match = layoutBlock.match(new RegExp(`${slot}:Object\\.freeze\\(\\[([^\\]]+)\\]\\)`));
  assert.ok(match, `${slot} lanes must be explicit.`);
  return match[1].split(',').map(value => Number(value.trim()));
}

const angleBlock = block('ANGLE_LAYOUT');
const placementBlock = block('PLACEMENT_LAYOUT');
const angleLanes = { A:lanes(angleBlock,'A'), B:lanes(angleBlock,'B') };
const placementLanes = { A:lanes(placementBlock,'A'), B:lanes(placementBlock,'B') };
const bands = { A:[414,574], B:[166,323] };
const angleHalf = 19 + 2.35 / 2;
const bubbleRadius = 17.2;
const clearance = 6;
const requiredSeparation = angleHalf + bubbleRadius + clearance;

for (const slot of ['A','B']) {
  const [inner,outer] = bands[slot];
  for (const lane of placementLanes[slot]) {
    assert.ok(lane - bubbleRadius - clearance > inner, `Sky ${slot} placement lane ${lane} must clear its inner ring boundary.`);
    assert.ok(lane + bubbleRadius + clearance < outer, `Sky ${slot} placement lane ${lane} must clear its outer ring boundary.`);
    for (const angleLane of angleLanes[slot]) {
      assert.ok(Math.abs(lane - angleLane) >= requiredSeparation,
        `Sky ${slot} placement lane ${lane} must not intrude into reserved Angle lane ${angleLane}.`);
    }
  }
}

test('ordinary placements have their own radial lanes, separate from Angle lanes', () => {
  assert.deepEqual(placementLanes.A, [450,440,460]);
  assert.deepEqual(placementLanes.B, [287,299,283]);
  assert.doesNotMatch(source, /laneA \+ direction \* 38|index % 4 === 3 \? laneB : laneA/);
});

test('Angle collision failure is explicit instead of forcing an overlap', () => {
  assert.match(source, /No legal radial lane for Sky \$\{slot\} \$\{record\.entry\.name\}/);
  assert.doesNotMatch(source, /fallback:true|used its deterministic extreme lane/);
});

test('ordinary placement crowding preserves exact longitude through leaders', () => {
  assert.match(source, /data-display-longitude/);
  assert.match(source, /const exact = polar\(record\.exactRadius,record\.value\)/);
  assert.match(source, /const display = polar\(record\.lane,record\.display\)/);
});
