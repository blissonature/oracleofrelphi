const fs = require('fs');
const path = require('path');

const coherence = fs.readFileSync(path.join(__dirname, '..', 'sky-chart-coherence.js'), 'utf8');

function expectContains(fragment, message) {
  if (!coherence.includes(fragment)) throw new Error(message);
}

expectContains(".relationship-list-row.aspect-opposition", 'opposition color mapping is missing');
expectContains("--relationship-aspect-color: #7b1fa2", 'opposition color does not match the wheel key');
expectContains("--relationship-aspect-color: #1e88e5", 'trine color does not match the wheel key');
expectContains("--relationship-aspect-color: #dc1f18", 'square color does not match the wheel key');
expectContains("--relationship-aspect-color: #2e7d32", 'sextile color does not match the wheel key');
expectContains("--relationship-aspect-color: #d97706", 'quincunx color does not match the wheel key');
expectContains("document.querySelectorAll('.chart-wheel-aspect-key > span')", 'the aspect key is not enhanced');
expectContains("document.querySelectorAll('.relationship-list-row')", 'the relationship rows are not enhanced');
expectContains("points.prepend(createLineSample(aspect))", 'rows without a sample do not receive one');

console.log('sky relationship color hints: ok');
