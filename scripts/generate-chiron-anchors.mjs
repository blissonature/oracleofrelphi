#!/usr/bin/env node
// Generates heliocentric EQJ Chiron state-vector anchors from JPL Horizons.
// Run during development only; JPL explicitly disallows embedding its API in websites.
import fs from 'node:fs/promises';

const years = [];
for (let year = 1900; year <= 2100; year += 5) years.push(year);

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
  const f = line.split(',').map(s => s.trim());
  const nums = f.filter(s => /^[-+]?\d+(?:\.\d+)?(?:E[-+]?\d+)?$/i.test(s)).map(Number);
  if (nums.length < 7) throw new Error(`Could not parse state vector for ${year}: ${line}`);
  const [jd, x, y, z, vx, vy, vz] = nums;
  return { epoch:new Date((jd - 2440587.5) * 86400000).toISOString(), x, y, z, vx, vy, vz };
}

const anchors = [];
for (const year of years) {
  const response = await fetch(queryUrl(year), { headers:{ 'User-Agent':'Oracle-of-Relphi-Chiron-anchor-generator/1.0' } });
  if (!response.ok) throw new Error(`Horizons ${response.status} for ${year}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  anchors.push(parseVector(payload.result, year));
  console.log(`Generated Chiron anchor ${year}`);
}

await fs.writeFile('data/chiron-anchors.json', JSON.stringify({ source:'NASA/JPL Horizons', frame:'heliocentric EQJ', units:'AU and AU/day', generatedAt:new Date().toISOString(), anchors }, null, 2) + '\n');
console.log(`Wrote ${anchors.length} anchors to data/chiron-anchors.json`);
