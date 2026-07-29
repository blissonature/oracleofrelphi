#!/usr/bin/env node
import fs from 'node:fs/promises';
import * as Astronomy from 'astronomy-engine';

const data = JSON.parse(await fs.readFile('data/chiron-anchors.json', 'utf8'));
const anchors = data.anchors;
const TEST_DATES = [
  '1902-07-01T00:00:00Z','1917-11-13T12:00:00Z','1933-03-21T06:00:00Z',
  '1950-06-15T18:00:00Z','1967-12-02T00:00:00Z','1985-10-08T08:37:00Z',
  '2001-04-19T12:00:00Z','2012-09-17T00:00:00Z','2026-07-26T02:00:00Z',
  '2038-02-14T06:00:00Z','2051-08-30T18:00:00Z','2074-05-12T00:00:00Z',
  '2097-10-01T12:00:00Z'
].map(s => new Date(s));

const norm = x => ((Number(x) % 360) + 360) % 360;
const signed = x => ((x + 540) % 360) - 180;

function nearestAnchor(date) {
  return anchors.reduce((best, item) =>
    Math.abs(new Date(item.epoch) - date) < Math.abs(new Date(best.epoch) - date) ? item : best,
    anchors[0]);
}

function localLongitude(date) {
  const a = nearestAnchor(date);
  const epoch = new Date(a.epoch);
  const initial = new Astronomy.StateVector(a.x,a.y,a.z,a.vx,a.vy,a.vz,epoch);
  const sim = new Astronomy.GravitySimulator(Astronomy.Body.Sun, epoch, [initial]);
  const direction = date >= epoch ? 1 : -1;
  let cursor = new Date(epoch);
  let state = initial;
  while ((direction > 0 && cursor < date) || (direction < 0 && cursor > date)) {
    const remaining = (date - cursor) / 86400000;
    const delta = Math.abs(remaining) < 5 ? remaining : 5 * direction;
    cursor = new Date(cursor.getTime() + delta * 86400000);
    state = sim.Update(cursor)[0];
  }
  const earth = sim.SolarSystemBodyState(Astronomy.Body.Earth);
  const geo = new Astronomy.Vector(state.x-earth.x, state.y-earth.y, state.z-earth.z, state.t);
  return norm(Astronomy.Ecliptic(geo).elon);
}

function vectorUrl(command, date) {
  const start = date.toISOString().replace('T',' ').slice(0,16);
  const stop = new Date(date.getTime()+60000).toISOString().replace('T',' ').slice(0,16);
  const p = new URLSearchParams({
    format:'json', COMMAND:`'${command}'`, OBJ_DATA:"'NO'", MAKE_EPHEM:"'YES'", EPHEM_TYPE:"'VECTORS'",
    CENTER:"'500@10'", START_TIME:`'${start}'`, STOP_TIME:`'${stop}'`, STEP_SIZE:"'1 m'",
    VEC_TABLE:"'2'", CSV_FORMAT:"'YES'", OUT_UNITS:"'AU-D'", REF_PLANE:"'FRAME'", REF_SYSTEM:"'J2000'"
  });
  return `https://ssd.jpl.nasa.gov/api/horizons.api?${p}`;
}

async function horizonsVector(command, date) {
  const r = await fetch(vectorUrl(command,date), {headers:{'User-Agent':'Oracle-of-Relphi-Chiron-validator/1.0'}});
  if (!r.ok) throw new Error(`Horizons ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  const block = String(j.result||'').match(/\$\$SOE([\s\S]*?)\$\$EOE/);
  if (!block) throw new Error('No Horizons vector block');
  const line = block[1].split(/\r?\n/).map(s=>s.trim()).find(Boolean);
  const nums = line.split(',').map(s=>s.trim()).filter(s=>/^[-+]?\d+(?:\.\d+)?(?:E[-+]?\d+)?$/i.test(s)).map(Number);
  if (nums.length < 7) throw new Error(`Could not parse vector: ${line}`);
  return {x:nums[1],y:nums[2],z:nums[3]};
}

async function horizonsLongitude(date) {
  const [c,e] = await Promise.all([horizonsVector('2060',date), horizonsVector('399',date)]);
  const geo = new Astronomy.Vector(c.x-e.x,c.y-e.y,c.z-e.z,date);
  return norm(Astronomy.Ecliptic(geo).elon);
}

const rows=[];
for (const date of TEST_DATES) {
  const local=localLongitude(date);
  const truth=await horizonsLongitude(date);
  const errorArcmin=Math.abs(signed(local-truth))*60;
  rows.push({date:date.toISOString(),localLongitude:local,horizonsLongitude:truth,errorArcmin});
  console.log(`${date.toISOString()}  ${errorArcmin.toFixed(4)} arcmin`);
}
const max=Math.max(...rows.map(r=>r.errorArcmin));
const mean=rows.reduce((s,r)=>s+r.errorArcmin,0)/rows.length;
const report={generatedAt:new Date().toISOString(),method:'Astronomy Engine GravitySimulator vs independent JPL heliocentric EQJ vectors',sampleCount:rows.length,maxErrorArcmin:max,meanErrorArcmin:mean,pass:max<=1,rows};
await fs.writeFile('data/chiron-validation-report.json', JSON.stringify(report,null,2)+'\n');
console.log(`Maximum error: ${max.toFixed(4)} arcmin; mean: ${mean.toFixed(4)} arcmin; ${report.pass?'PASS':'FAIL'}`);
process.exitCode = report.pass ? 0 : 1;
