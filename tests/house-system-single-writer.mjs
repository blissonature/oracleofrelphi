import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const controller=readFileSync('sky-chart-placement-house-system-v1.js','utf8');
const integrity=readFileSync('sky-chart-house-integrity-v1.js','utf8');
assert.match(controller,/__relphiHouseSystemCommitDepth=\(window\.__relphiHouseSystemCommitDepth\|\|0\)\+1/,'House owner marks active commit');
assert.match(controller,/finally\{window\.__relphiHouseSystemCommitDepth=Math\.max\(0,window\.__relphiHouseSystemCommitDepth-1\)\}/,'Commit ownership resets even if dispatch fails');
assert.match(integrity,/running\|\|window\.__relphiHouseSystemCommitDepth>0/,'Integrity must not rewrite House System commits');
console.log('House System single-writer transaction guard passed');
