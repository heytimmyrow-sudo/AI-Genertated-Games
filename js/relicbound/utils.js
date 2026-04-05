(function () {
window.Relicbound = window.Relicbound || {};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function circleIntersectsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function angleFromVector(x, y, fallback = 0) {
  if (x === 0 && y === 0) return fallback;
  return Math.atan2(y, x);
}

Object.assign(window.Relicbound, {
  clamp,
  lerp,
  distance,
  normalizeVector,
  circleIntersectsRect,
  rectsIntersect,
  angleFromVector
});
}());
