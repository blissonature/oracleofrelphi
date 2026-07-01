/* Relphi Chart Math v203 validation fixtures.
   These fixtures validate internal formula-vs-geometry agreement only.
   External ephemeris comparison should be added before claiming published-grade Ascendant output. */
(function (global) {
  'use strict';
  const fixtures = [
    { name: 'Equatorial baseline', utc: '2026-06-23T06:00:00Z', lat: 0.0, lng: 0.0 },
    { name: 'Southern hemisphere baseline', utc: '2026-06-23T18:00:00Z', lat: -33.8688, lng: 151.2093 },
    { name: 'High latitude baseline', utc: '2026-06-23T00:00:00Z', lat: 64.1466, lng: -21.9426 },
    { name: 'Timezone boundary baseline', utc: '2026-01-01T00:03:00Z', lat: 40.7608, lng: -111.8910 },
    { name: 'Sign-boundary stress', utc: '2026-03-20T09:01:00Z', lat: 51.5074, lng: -0.1278 }
  ];

  function runRelphiChartMathFixtures(options) {
    if (!global.RelphiChartMath) throw new Error('RelphiChartMath is not loaded.');
    return fixtures.map(fixture => {
      try {
        const result = global.RelphiChartMath.validateChartFrame(fixture, options || {});
        return { fixture, result };
      } catch (error) {
        return { fixture, error: String(error && error.message ? error.message : error) };
      }
    });
  }

  global.RelphiChartMathFixtures = { fixtures, run: runRelphiChartMathFixtures };
  if (typeof module !== 'undefined' && module.exports) module.exports = { fixtures, run: runRelphiChartMathFixtures };
})(typeof window !== 'undefined' ? window : globalThis);
