// Mathematical contract shared by the small Three.js smoke test and its assertions.
export const norm = degree => ((Number(degree) % 360) + 360) % 360;
export const signed = degree => ((norm(degree) + 180) % 360) - 180;
export const delta = (longitude, focus) => signed(longitude - focus);
export const polar = (longitude, radius = 1) => {
  const angle = longitude * Math.PI / 180;
  return { x: radius * Math.sin(angle), z: radius * Math.cos(angle) };
};
// Matches the existing Relphi miniature relationship-wheel convention:
// Aries 0 degrees is left, 90 above, 180 right, and 270 below.
export const miniPoint = (degree, radius = 54, cx = 75, cy = 75) => {
  const angle = (norm(degree) - 180) * Math.PI / 180;
  return {x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle)};
};
export const miniLongitude = (x, y, cx = 75, cy = 75) => norm(
  Math.atan2(y - cy, x - cx) * 180 / Math.PI + 180
);

// Rotating-mini-map contract: the world turns while the foreground indicator
// stays at the left edge (the exact Relphi 0° position).
// All placement/aspect endpoints retain their unmodified source longitude.
export const rotatedMiniPoint = (longitude, focus, radius = 54, cx = 75, cy = 75) =>
  miniPoint(longitude - focus, radius, cx, cy);
export const mapLongitudeAt = (x, y, focus, cx = 75, cy = 75) =>
  norm(miniLongitude(x, y, cx, cy) + focus);
// Preserve where the finger first grabbed the world: avoid a jump on drag start.
export const draggedMapFocus = (startFocus, startDisplayLongitude, currentDisplayLongitude) =>
  norm(startFocus - signed(currentDisplayLongitude - startDisplayLongitude));
