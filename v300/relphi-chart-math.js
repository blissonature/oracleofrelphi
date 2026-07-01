/* Relphi Chart Math v203
   Browser-safe chart geometry helpers for Oracle of Relphi.
   No Swiss Ephemeris, no flatlib, no pyswisseph dependency.
   Exposes window.RelphiChartMath for static pages and Node tests. */
(function (global) {
  'use strict';

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  function normalizeDegrees(deg) {
    return ((Number(deg) % 360) + 360) % 360;
  }

  function angularDifference(a, b) {
    let diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
    return diff > 180 ? 360 - diff : diff;
  }

  function longitudeToZodiac(longitudeDegrees) {
    const longitude = normalizeDegrees(longitudeDegrees);
    const signIndex = Math.floor(longitude / 30);
    return {
      longitude,
      signIndex,
      sign: ZODIAC_SIGNS[signIndex],
      degree: longitude - signIndex * 30
    };
  }

  function julianDay(dateInput) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) throw new Error('Invalid UTC date.');
    return date.getTime() / 86400000 + 2440587.5;
  }

  function julianCenturies(jd) {
    return (jd - 2451545.0) / 36525;
  }

  function calculateMeanObliquityDegrees(julianCenturiesValue) {
    const t = Number(julianCenturiesValue);
    return 23.4392911 - (46.8150 / 3600) * t - (0.00059 / 3600) * t * t + (0.001813 / 3600) * t * t * t;
  }

  function meanSiderealTimeDegrees(jd) {
    const t = julianCenturies(jd);
    return normalizeDegrees(
      280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * t * t -
      (t * t * t) / 38710000
    );
  }

  function localSiderealTimeDegrees(dateInput, longitudeDegreesEastPositive) {
    const jd = julianDay(dateInput);
    return normalizeDegrees(meanSiderealTimeDegrees(jd) + Number(longitudeDegreesEastPositive || 0));
  }

  function calculateMidheavenFormula(lstRadians, obliquityRadians) {
    const mcRad = Math.atan2(
      Math.sin(lstRadians),
      Math.cos(lstRadians) * Math.cos(obliquityRadians)
    );
    return normalizeDegrees(mcRad * RAD);
  }

  function calculateAscendantFormula(lstRadians, obliquityRadians, latitudeDegrees) {
    const latRad = Number(latitudeDegrees) * DEG;
    const numerator = -Math.cos(lstRadians);
    const denominator =
      Math.sin(lstRadians) * Math.cos(obliquityRadians) +
      Math.tan(latRad) * Math.sin(obliquityRadians);
    // The raw closed-form result under this east-positive, north-zero azimuth convention
    // returns the western horizon point. Add 180 degrees to select the eastern
    // rising point, then verify against solveAscendantByHorizon().
    return normalizeDegrees(Math.atan2(numerator, denominator) * RAD + 180);
  }

  function eclipticLongitudeToEquatorial(longitudeDegrees, obliquityRadians) {
    const lambda = normalizeDegrees(longitudeDegrees) * DEG;
    const ra = normalizeDegrees(Math.atan2(
      Math.sin(lambda) * Math.cos(obliquityRadians),
      Math.cos(lambda)
    ) * RAD);
    const dec = Math.asin(Math.sin(lambda) * Math.sin(obliquityRadians)) * RAD;
    return { ra, dec };
  }

  function equatorialToHorizontal(raDegrees, decDegrees, lstDegrees, latitudeDegrees) {
    const hourAngle = normalizeDegrees(lstDegrees - raDegrees);
    const h = hourAngle > 180 ? hourAngle - 360 : hourAngle;
    const hRad = h * DEG;
    const decRad = decDegrees * DEG;
    const latRad = Number(latitudeDegrees) * DEG;

    const sinAlt =
      Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hRad);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD;

    const azimuth = normalizeDegrees(Math.atan2(
      -Math.sin(hRad),
      Math.tan(decRad) * Math.cos(latRad) - Math.sin(latRad) * Math.cos(hRad)
    ) * RAD);

    return { altitude, azimuth, hourAngle: h };
  }

  function eclipticToHorizontal(longitudeDegrees, frame) {
    const eq = eclipticLongitudeToEquatorial(longitudeDegrees, frame.obliquityRadians);
    const hor = equatorialToHorizontal(eq.ra, eq.dec, frame.lstDegrees, frame.latitudeDegrees);
    return { ...hor, ...eq, longitude: normalizeDegrees(longitudeDegrees) };
  }

  function isEasternAzimuth(azimuthDegrees) {
    const az = normalizeDegrees(azimuthDegrees);
    return az > 0 && az < 180;
  }

  function solveAscendantByHorizon(frame, options) {
    const tolerance = options?.altitudeToleranceDegrees ?? 0.0005;
    const samples = options?.samples ?? 720;
    let best = null;

    function altAt(longitude) {
      return eclipticToHorizontal(longitude, frame).altitude;
    }
    function considerRoot(rootLongitude) {
      const point = eclipticToHorizontal(rootLongitude, frame);
      const score = Math.abs(point.altitude) + (isEasternAzimuth(point.azimuth) ? 0 : 1000);
      if (!best || score < best.score) best = { longitude: normalizeDegrees(rootLongitude), point, score };
    }

    let prevLon = 0;
    let prevAlt = altAt(prevLon);
    for (let i = 1; i <= samples; i++) {
      const lon = i * (360 / samples);
      const alt = altAt(lon);
      if (prevAlt === 0 || alt === 0 || prevAlt * alt < 0) {
        let low = prevLon;
        let high = lon;
        let lowAlt = prevAlt;
        for (let iter = 0; iter < 48; iter++) {
          const mid = (low + high) / 2;
          const midAlt = altAt(mid);
          if (Math.abs(midAlt) <= tolerance) { low = high = mid; break; }
          if (lowAlt * midAlt <= 0) high = mid;
          else { low = mid; lowAlt = midAlt; }
        }
        considerRoot((low + high) / 2);
      }
      prevLon = lon;
      prevAlt = alt;
    }

    if (!best || !isEasternAzimuth(best.point.azimuth)) {
      let closest = null;
      for (let i = 0; i < samples; i++) {
        const lon = i * (360 / samples);
        const point = eclipticToHorizontal(lon, frame);
        if (!isEasternAzimuth(point.azimuth)) continue;
        const score = Math.abs(point.altitude);
        if (!closest || score < closest.score) closest = { longitude: lon, point, score };
      }
      if (closest) best = closest;
    }

    if (!best) throw new Error('Could not solve Ascendant by horizon geometry.');
    return normalizeDegrees(best.longitude);
  }

  function compareAscendantMethods(formulaDeg, solverDeg) {
    return angularDifference(formulaDeg, solverDeg);
  }

  function wholeSignHouses(ascendantLongitude) {
    const { signIndex } = longitudeToZodiac(ascendantLongitude);
    return Array.from({ length: 12 }, (_, i) => normalizeDegrees((signIndex + i) * 30));
  }

  function equalHouses(ascendantLongitude) {
    const start = normalizeDegrees(ascendantLongitude);
    return Array.from({ length: 12 }, (_, i) => normalizeDegrees(start + i * 30));
  }

  function buildFrame(input) {
    const jd = julianDay(input.utc || input.date || input.time);
    const t = julianCenturies(jd);
    const obliquityDegrees = input.obliquityDegrees ?? calculateMeanObliquityDegrees(t);
    const lstDegrees = input.lstDegrees ?? localSiderealTimeDegrees(input.utc || input.date || input.time, input.lng ?? input.longitude ?? 0);
    return {
      jd,
      julianCenturies: t,
      utc: new Date(input.utc || input.date || input.time),
      latitudeDegrees: Number(input.lat ?? input.latitude ?? 0),
      longitudeDegreesEastPositive: Number(input.lng ?? input.longitude ?? 0),
      obliquityDegrees,
      obliquityRadians: obliquityDegrees * DEG,
      lstDegrees,
      lstRadians: lstDegrees * DEG
    };
  }

  function validateChartFrame(input, options) {
    const tolerance = options?.toleranceDegrees ?? RelphiChartMath.TOLERANCE;
    const frame = buildFrame(input);
    const formulaAsc = calculateAscendantFormula(frame.lstRadians, frame.obliquityRadians, frame.latitudeDegrees);
    const solverAsc = solveAscendantByHorizon(frame, options);
    const formulaMC = calculateMidheavenFormula(frame.lstRadians, frame.obliquityRadians);
    const delta = compareAscendantMethods(formulaAsc, solverAsc);
    const isValidated = delta <= tolerance;
    return {
      ascendant: longitudeToZodiac(isValidated ? formulaAsc : formulaAsc),
      ascendantSolver: longitudeToZodiac(solverAsc),
      midheaven: longitudeToZodiac(formulaMC),
      houses: {
        wholeSign: wholeSignHouses(formulaAsc),
        equal: equalHouses(formulaAsc)
      },
      frame: {
        jd: frame.jd,
        lstDegrees: frame.lstDegrees,
        obliquityDegrees: frame.obliquityDegrees,
        latitudeDegrees: frame.latitudeDegrees,
        longitudeDegreesEastPositive: frame.longitudeDegreesEastPositive
      },
      validation: {
        ascendantFormulaVsSolverDelta: Number(delta.toFixed(4)),
        toleranceDegrees: tolerance,
        status: isValidated ? 'validated' : 'needs_validation'
      }
    };
  }

  const RelphiChartMath = {
    TOLERANCE: 0.25,
    ZODIAC_SIGNS,
    normalizeDegrees,
    angularDifference,
    longitudeToZodiac,
    julianDay,
    julianCenturies,
    calculateMeanObliquityDegrees,
    meanSiderealTimeDegrees,
    localSiderealTimeDegrees,
    calculateMidheavenFormula,
    calculateAscendantFormula,
    eclipticLongitudeToEquatorial,
    equatorialToHorizontal,
    eclipticToHorizontal,
    solveAscendantByHorizon,
    compareAscendantMethods,
    wholeSignHouses,
    equalHouses,
    buildFrame,
    validateChartFrame
  };

  global.RelphiChartMath = RelphiChartMath;
  if (typeof module !== 'undefined' && module.exports) module.exports = RelphiChartMath;
})(typeof window !== 'undefined' ? window : globalThis);
