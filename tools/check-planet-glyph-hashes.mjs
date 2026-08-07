import fs from 'node:fs';
import crypto from 'node:crypto';

const expected = Object.freeze({
  'assets/planet-glyphs/sun.svg':'ffa32a9333f2bf6b67390b6ec48b212c9fe4c2e6',
  'assets/planet-glyphs/moon.svg':'f61f2a28f17e093d861d72cc01665a19ba1a8e8c',
  'assets/planet-glyphs/mercury.svg':'4d506fcbfefe2738227f80d5e4908df308c293c8',
  'assets/planet-glyphs/venus.svg':'a26c815dba50d2531eec90ec6efa58da15651139',
  'assets/planet-glyphs/mars.svg':'73ea0d1076872e0d24caf8f5c1f973f7203ac400',
  'assets/planet-glyphs/jupiter.svg':'b6c2c3e381828ebb6726cb9913142161dff53f49',
  'assets/planet-glyphs/saturn.svg':'75356b0a6d2749c43bd717bf384a5fb357cce18b',
  'assets/planet-glyphs/uranus.svg':'ae90688f3deb7342391bb4bf2238a8e71a920d70',
  'assets/planet-glyphs/neptune.svg':'1e8b13349792de54562d829829ac1cb60f48b2cb',
  'assets/planet-glyphs/pluto.svg':'7b7729d393461767d65083c720fe9ca099048f50'
});

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return crypto.createHash('sha1').update(header).update(buffer).digest('hex');
}

const failures = [];
for (const [file, sha] of Object.entries(expected)) {
  if (!fs.existsSync(file)) {
    failures.push(`${file} is missing`);
    continue;
  }
  const actual = gitBlobSha(fs.readFileSync(file));
  if (actual !== sha) failures.push(`${file} changed: expected ${sha}, got ${actual}`);
}

if (failures.length) {
  console.error('APPROVED PLANET GLYPH HASH CHECK FAILED');
  failures.forEach((failure, i) => console.error(`${i + 1}. ${failure}`));
  process.exit(1);
}

console.log('Approved planetary glyph bytes are pinned. Jagged replacements cannot pass this check.');
