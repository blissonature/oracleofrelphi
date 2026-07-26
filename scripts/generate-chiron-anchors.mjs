#!/usr/bin/env node
// Generates heliocentric EQJ Chiron state-vector anchors from JPL Horizons.
// Run during development/build only. Runtime sky calculations remain fully local.
import fs from 'node:fs/promises';

const START_YEAR = 1900;
const END_YEAR = 2100;
const STEP_YEARS = 5;
const DATA_PATH = 'data/chiron-anchors.json';
const MODULE_PATH = 'sky-chart-chiron-local-v1.js';
const START_MARKER = '  // CHIRON_ANCHORS_START';
const END_MARKER = '  // CHIRON_ANCHORS_END';

const years = [];
for (let year = START_YEAR; year <= END_YEAR; year += STEP_YEARS) years.push(year);

function queryUrl(year) {
  const start = `${year}-01-01 00:00`;
  const stop = `${year}-01-02 00:00`;
  const p = new URLSearchParams({
    format:'json', COMMAND:"'2060'", OBJ_DATA:"'NO'", MAKE_EPHEM:"'YES'", EPHEM_TYPE:"'VECTORS'",
    CENTER:"'500@10'", START_TIME:`'${start}'`, STOP_TIME:`'${stop}'`, STEP_SIZE:"'1 d'",
    VEC_TABLE:"'2'", CSV_FORMAT:"'YES'", OUT_UNITS:"'AU-D'", REF_PLANE:"'FRAME'", REF_SYSTEM:"'J2000'"
  });
  return `https://ssd.jpl.nasa.gov/api/horizons.api?${p}`;
}

function parseVector(result, year) {
  const block = String(result || '').match(/\$\$SOE([\s\S]*?)\$\$EOE/);
  if (!block) throw new Error(`No Horizons vector block for ${year}`);
  const line = block[1].split(/\r?\n/).map(s => s.trim()).find(Boolean);
  const fields = line.split(',').map(s => s.trim());
  const nums = fields
    .filter(s => /^[-+]?\d+(?:\.\d+)?(?:E[-+]?\d+)?$/i.test(s))
    .map(Number);
  if (nums.length < 7) throw new Error(`Could not parse state vector for ${year}: ${line}`);
  const [jd, x, y, z, vx, vy, vz] = nums;
  return {
    epoch:new Date((jd - 2440587.5) * 86400000).toISOString(),
    x, y, z, vx, vy, vz
  };
}

async function fetchAnchor(year) {
  const response = await fetch(queryUrl(year), {
    headers:{ 'User-Agent':'Oracle-of-Relphi-Chiron-anchor-generator/1.0' }
  });
  if (!response.ok) throw new Error(`Horizons ${response.status} for ${year}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  return parseVector(payload.result, year);
}

const anchors = [];
for (const year of years) {
  anchors.push(await fetchAnchor(year));
  console.log(`Generated Chiron anchor ${year}`);
  await new Promise(resolve => setTimeout(resolve, 150));
}

await fs.mkdir('data', { recursive:true });
const dataset = {
  source:'NASA/JPL Horizons',
  target:'2060 Chiron',
  frame:'heliocentric EQJ',
  units:'AU and AU/day',
  range:{ startYear:START_YEAR, endYear:END_YEAR, stepYears:STEP_YEARS },
  generatedAt:new Date().toISOString(),
  anchors
};
await fs.writeFile(DATA_PATH, JSON.stringify(dataset, null, 2) + '\n');

let moduleSource = await fs.readFile(MODULE_PATH, 'utf8');
const startIndex = moduleSource.indexOf(START_MARKER);
const endIndex = moduleSource.indexOf(END_MARKER);
if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
  throw new Error(`Could not find Chiron anchor markers in ${MODULE_PATH}`);
}
const embedded = `${START_MARKER}\n  const ANCHORS = ${JSON.stringify(anchors, null, 2).replace(/^/gm, '  ')};\n  ${END_MARKER}`;
moduleSource = moduleSource.slice(0, startIndex) + embedded + moduleSource.slice(endIndex + END_MARKER.length);
await fs.writeFile(MODULE_PATH, moduleSource);

console.log(`Wrote ${anchors.length} anchors to ${DATA_PATH} and embedded them in ${MODULE_PATH}`);
