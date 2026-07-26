// Local Chiron propagation using Astronomy Engine GravitySimulator.
(function () {
  'use strict';
  if (window.RelphiChironLocal) return;

  // Generated offline by scripts/generate-chiron-anchors.mjs.
  // Each anchor is heliocentric EQJ in AU and AU/day.
  // CHIRON_ANCHORS_START
  const ANCHORS = [];
  // CHIRON_ANCHORS_END

  function norm(value) { return ((Number(value) % 360) + 360) % 360; }

  function nearestAnchor(date) {
    if (!ANCHORS.length) throw new Error('Local Chiron ephemeris anchors have not been generated yet.');
    return ANCHORS.reduce(function (best, item) {
      const itemDistance = Math.abs(new Date(item.epoch).getTime() - date.getTime());
      const bestDistance = Math.abs(new Date(best.epoch).getTime() - date.getTime());
      return itemDistance < bestDistance ? item : best;
    }, ANCHORS[0]);
  }

  function propagateTo(date) {
    const A = window.Astronomy;
    if (!A || !A.GravitySimulator || !A.StateVector || !A.Vector || !A.Ecliptic) {
      throw new Error('Astronomy Engine GravitySimulator is unavailable.');
    }

    const anchor = nearestAnchor(date);
    const epoch = new Date(anchor.epoch);
    const initial = new A.StateVector(anchor.x, anchor.y, anchor.z, anchor.vx, anchor.vy, anchor.vz, epoch);
    const sim = new A.GravitySimulator(A.Body.Sun, epoch, [initial]);
    const direction = date.getTime() >= epoch.getTime() ? 1 : -1;
    const stepDays = 5 * direction;
    let cursor = new Date(epoch);
    let state = initial;

    while ((direction > 0 && cursor < date) || (direction < 0 && cursor > date)) {
      const remaining = (date.getTime() - cursor.getTime()) / 86400000;
      const delta = Math.abs(remaining) < 5 ? remaining : stepDays;
      cursor = new Date(cursor.getTime() + delta * 86400000);
      state = sim.Update(cursor)[0];
    }

    const earth = sim.SolarSystemBodyState(A.Body.Earth);
    const geocentric = new A.Vector(
      state.x - earth.x,
      state.y - earth.y,
      state.z - earth.z,
      state.t
    );
    return norm(A.Ecliptic(geocentric).elon);
  }

  function calculate(date) {
    date = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(date.getTime())) throw new Error('Chiron requires a valid date and time.');

    const longitude = propagateTo(date);
    const before = propagateTo(new Date(date.getTime() - 12 * 3600000));
    const after = propagateTo(new Date(date.getTime() + 12 * 3600000));
    const motion = ((after - before + 540) % 360) - 180;

    return {
      longitude:longitude,
      retrograde:motion < 0,
      source:'Astronomy Engine GravitySimulator with embedded JPL Horizons anchors'
    };
  }

  window.RelphiChironLocal = Object.freeze({ calculate:calculate, anchors:ANCHORS });
})();
