(function () {
  const ShadowCircuit = window.ShadowCircuit || (window.ShadowCircuit = {});

  ShadowCircuit.utils = {
    clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    },

    lerp(a, b, t) {
      return a + (b - a) * t;
    },

    distance(ax, ay, bx, by) {
      return Math.hypot(bx - ax, by - ay);
    },

    normalize(x, y) {
      const length = Math.hypot(x, y) || 1;
      return { x: x / length, y: y / length };
    },

    overlapsCircleRect(x, y, radius, rect) {
      const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
      const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
      return Math.hypot(x - closestX, y - closestY) < radius;
    },

    pushCircleOutOfRect(circle, rect) {
      const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
      const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
      const dx = circle.x - closestX;
      const dy = circle.y - closestY;
      const distance = Math.hypot(dx, dy);

      if (distance === 0 || distance >= circle.radius) {
        return false;
      }

      const overlap = circle.radius - distance;
      const nx = dx / distance;
      const ny = dy / distance;
      circle.x += nx * overlap;
      circle.y += ny * overlap;
      return true;
    },

    pointInRect(x, y, rect) {
      return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    },

    formatCooldown(value) {
      return value <= 0 ? "READY" : value.toFixed(1) + "s";
    }
  };
}());
