import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../relphi-house-systems.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: 'relphi-house-systems.js' });
const houses = sandbox.window.RelphiHouseSystems;

function close(actual, expected, tolerance = 1e-7) {
  const delta = Math.abs((((actual - expected) % 360) + 540) % 360 - 180);
  assert.ok(delta <= tolerance, `expected ${actual} to be within ${tolerance}° of ${expected}; delta=${delta}`);
}

function checkVector({ armc, latitude, obliquity, expected }) {
  const ascendant = houses._debug.ascFromLst(armc, latitude, obliquity);
  const midheaven = houses._debug.mcFromLst(armc, obliquity);
  const result = houses.calculateCusps({
    system: 'koch',
    ascendant,
    midheaven,
    siderealDegrees: armc,
    latitude,
    obliquityDegrees: obliquity
  });
  assert.equal(result.cusps.length, 12);
  result.cusps.forEach((value, i) => close(value, expected[i]));
}

test('Koch cusps match reference vectors in northern and southern latitudes', () => {
  checkVector({
    armc: 285.5261011687223,
    latitude: 40.7608,
    obliquity: 23.4367,
    expected: [
      26.317926753, 58.912018263, 83.792811355, 104.299927372,
      131.543862683, 167.134639162, 206.317926753, 238.912018263,
      263.792811355, 284.299927372, 311.543862683, 347.134639162
    ]
  });

  checkVector({
    armc: 250.25,
    latitude: -33.8688,
    obliquity: 23.4367,
    expected: [
      343.357867317, 13.110477358, 42.499048117, 71.767280816,
      104.650818859, 134.03895031, 163.357867317, 193.110477358,
      222.499048117, 251.767280816, 284.650818859, 314.03895031
    ]
  });
});

test('Koch cusps progress forward through the zodiac instead of reversing within a house', () => {
  const armc = 285.5261011687223;
  const latitude = 40.7608;
  const obliquity = 23.4367;
  const ascendant = houses._debug.ascFromLst(armc, latitude, obliquity);
  const midheaven = houses._debug.mcFromLst(armc, obliquity);
  const { cusps } = houses.calculateCusps({
    system: 'koch',
    ascendant,
    midheaven,
    siderealDegrees: armc,
    latitude,
    obliquityDegrees: obliquity
  });

  for (let i = 0; i < 12; i++) {
    const arc = ((cusps[(i + 1) % 12] - cusps[i]) + 360) % 360;
    assert.ok(arc > 0 && arc < 90, `house ${i + 1} has invalid forward arc ${arc}°`);
  }
});
