import assert from 'node:assert/strict';
import test from 'node:test';

const circlePcs = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function strikeGroups(sides, direction = -1) {
  const crossings = [];
  const epsilon = 1e-9;
  for (let vertex = 0; vertex < sides; vertex += 1) {
    const vertexOffset = vertex / sides;
    for (let noteIndex = 0; noteIndex < 12; noteIndex += 1) {
      const target = noteIndex / 12;
      let turnFraction = direction > 0
        ? ((target - vertexOffset) % 1 + 1) % 1
        : ((vertexOffset - target) % 1 + 1) % 1;
      if (turnFraction < epsilon) turnFraction = 1;
      crossings.push({ turnFraction, noteIndex, pc: circlePcs[noteIndex] });
    }
  }
  crossings.sort((a, b) => a.turnFraction - b.turnFraction || a.noteIndex - b.noteIndex);
  const groups = [];
  for (const crossing of crossings) {
    const previous = groups.at(-1);
    if (!previous || Math.abs(previous.turnFraction - crossing.turnFraction) > 1e-8) {
      groups.push({ turnFraction: crossing.turnFraction, pcs: [crossing.pc] });
    } else {
      previous.pcs.push(crossing.pc);
    }
  }
  return groups;
}

function sortedIntervals(pcs) {
  const sorted = [...pcs].sort((a, b) => a - b);
  return sorted.map((pc, index) => {
    const next = sorted[(index + 1) % sorted.length] + (index === sorted.length - 1 ? 12 : 0);
    return next - pc;
  });
}

test('common-factor law controls simultaneous notes and strike count', () => {
  for (let sides = 3; sides <= 12; sides += 1) {
    const groups = strikeGroups(sides);
    assert.equal(groups.length, lcm(sides, 12), `${sides} sides strike count`);
    assert.ok(groups.every(group => group.pcs.length === gcd(sides, 12)), `${sides} sides chord size`);
    assert.equal(groups.reduce((sum, group) => sum + group.pcs.length, 0), sides * 12, `${sides} sides contact count`);
  }
});

test('triangle and nonagon produce augmented triads', () => {
  for (const sides of [3, 9]) {
    for (const group of strikeGroups(sides)) assert.deepEqual(sortedIntervals(group.pcs), [4, 4, 4]);
  }
});

test('square and octagon produce diminished seventh chords', () => {
  for (const sides of [4, 8]) {
    for (const group of strikeGroups(sides)) assert.deepEqual(sortedIntervals(group.pcs), [3, 3, 3, 3]);
  }
});

test('hexagon alternates the two whole-tone pitch collections', () => {
  const groups = strikeGroups(6);
  for (const group of groups) assert.deepEqual(sortedIntervals(group.pcs), [2, 2, 2, 2, 2, 2]);
  const unique = new Set(groups.map(group => [...group.pcs].sort((a, b) => a - b).join(',')));
  assert.equal(unique.size, 2);
});

test('counterclockwise pentagon is chromatic ascending and heptagon reverses it', () => {
  const pentagon = strikeGroups(5).slice(0, 12).map(group => group.pcs[0]);
  const heptagon = strikeGroups(7).slice(0, 12).map(group => group.pcs[0]);
  assert.deepEqual(pentagon, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]);
  assert.deepEqual(heptagon, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
});

test('decagon produces simultaneous tritone pairs at the pentagon strike rate', () => {
  const decagon = strikeGroups(10);
  assert.equal(decagon.length, strikeGroups(5).length);
  for (const group of decagon) {
    assert.equal(group.pcs.length, 2);
    assert.equal((Math.abs(group.pcs[0] - group.pcs[1]) + 12) % 12, 6);
  }
});

test('hendecagon note order opposes rotation by sounding fifths counterclockwise', () => {
  const firstCycle = strikeGroups(11, -1).slice(0, 12).map(group => group.pcs[0]);
  assert.deepEqual(firstCycle, [7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5, 0]);
});

test('dodecagon sounds all twelve pitch classes at every strike', () => {
  const groups = strikeGroups(12);
  assert.equal(groups.length, 12);
  for (const group of groups) assert.deepEqual([...group.pcs].sort((a, b) => a - b), [...Array(12).keys()]);
});
