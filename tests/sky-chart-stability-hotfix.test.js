const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const stability = fs.readFileSync(path.join(root, 'sky-chart-stability-hotfix.js'), 'utf8');
const colors = fs.readFileSync(path.join(root, 'sky-chart-relationship-color-hints.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');

function includes(source, fragment, message) {
  if (!source.includes(fragment)) throw new Error(message);
}
function excludes(source, fragment, message) {
  if (source.includes(fragment)) throw new Error(message);
}

includes(stability, 'data-sky-builder-ui="wizard"', 'Wizard isolation CSS is missing.');
includes(stability, 'data-sky-builder-ui="advanced"', 'Advanced isolation CSS is missing.');
includes(stability, "localStorage.removeItem(BROKEN_SESSION_KEY)", 'Broken cross-sky restore is not disabled.');
includes(stability, "['skyCreatorTarget', 'skyCalcTarget']", 'Sky A and Sky B target guards are missing.');
includes(stability, 'Create sky from pasted placements', 'Paste creation action is missing.');

includes(colors, '.relationship-list-row::before', 'Vertical aspect cue is missing.');
includes(colors, '.relationship-list-row.is-selected', 'Selected-row outline is missing.');
includes(colors, 'border-color:#dc1f18', 'Selected-row Relphi-red stroke is missing.');
includes(colors, "row.querySelectorAll('.relationship-line-sample')", 'Old horizontal row samples are not removed.');
excludes(colors, 'points.prepend(sample(aspect))', 'Horizontal samples are still being added to relationship rows.');

excludes(nav, "appendScript('sky-chart-refresh-persistence.js", 'Broken refresh persistence is still loaded.');
includes(nav, "appendScript('sky-chart-stability-hotfix.js?v=1')", 'Stability layer is not loaded first.');
includes(nav, "appendScript('sky-chart-relationship-color-hints.js?v=2')", 'Revised color cue is not cache-busted.');

console.log('sky chart stability hotfix: ok');
