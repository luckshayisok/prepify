// Small geometry helpers for the hand-built SVG charts.

/**
 * Monotone cubic path through points (Fritsch–Carlson): smooth, but never overshoots,
 * so a score line can't dip below 0 or rise above 100 between points.
 */
export function monotonePath(points) {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0][0]},${points[0][1]}`;

  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    slope[i] = (points[i + 1][1] - points[i][1]) / dx[i];
  }
  const t = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) t[i] = 0;
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }
  t[n - 1] = slope[n - 2];

  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + t[i] * h} ${x1 - h},${y1 - t[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

// Point on a circle, with angle 0 at 12 o'clock going clockwise.
export function polar(cx, cy, r, angle) {
  return [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
