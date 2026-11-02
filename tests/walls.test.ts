/**
 * Oriented walls: the Palazzo's diagonals have to behave exactly like the
 * Kinepolis slabs the frozen constants were tuned against, just turned.
 */
import { describe, expect, it } from 'vitest';
import { circleRect, mkBot, speed, stepBot } from '../src/sim/bot';
import { DT_MAX } from '../src/sim/constants';
import { rayRect } from '../src/sim/lights';
import { circleWall, polyWalls, rayWall, segWall } from '../src/sim/walls';
import type { Wall } from '../src/sim/types';

describe('segWall', () => {
  it('a horizontal segment wall collides exactly like the axis-aligned slab it is', () => {
    const seg = segWall(10, 20, 50, 20, 6);
    const box = { x: 7, y: 17, w: 46, h: 6 };
    for (const [x, y] of [[30, 12], [30, 28], [4, 20], [55, 19], [52, 25], [30, 21]]) {
      const a = circleWall({ x, y, r: 6 }, seg);
      const b = circleRect({ x, y, r: 6 }, box);
      expect(a === null).toBe(b === null);
      if (a && b) {
        expect(a.nx).toBeCloseTo(b.nx, 9);
        expect(a.ny).toBeCloseTo(b.ny, 9);
        expect(a.pen).toBeCloseTo(b.pen, 9);
      }
    }
  });

  it('its bounding box contains the whole slab, at any angle', () => {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const w = segWall(100, 100, 100 + 40 * Math.cos(a), 100 + 40 * Math.sin(a), 6);
      const o = w.obb!;
      for (const [sx, sy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        const cx = o.cx + sx * o.hx * o.c - sy * o.hy * o.s;
        const cy = o.cy + sx * o.hx * o.s + sy * o.hy * o.c;
        expect(cx).toBeGreaterThanOrEqual(w.x - 1e-9);
        expect(cx).toBeLessThanOrEqual(w.x + w.w + 1e-9);
        expect(cy).toBeGreaterThanOrEqual(w.y - 1e-9);
        expect(cy).toBeLessThanOrEqual(w.y + w.h + 1e-9);
      }
    }
  });

  it('pushes out along the wall normal on a diagonal', () => {
    // 45° wall through the origin; a circle just above-left of it.
    const w = segWall(-50, -50, 50, 50, 4);
    const hit = circleWall({ x: -3, y: 3, r: 5 }, w)!;
    expect(hit).not.toBeNull();
    expect(hit.nx).toBeCloseTo(-Math.SQRT1_2, 6);
    expect(hit.ny).toBeCloseTo(Math.SQRT1_2, 6);
    expect(hit.pen).toBeCloseTo(5 + 2 - Math.hypot(3, 3), 6);
  });
});

describe('robots against a diagonal wall', () => {
  // The line x + y = 200, long enough that 13 s of sliding never reaches an end.
  const diag: Wall[] = [segWall(-3000, 3200, 3200, -3000, 6)];

  for (const kind of ['voxxy', 'droid', 'biggy'] as const) {
    it(`${kind} driven straight into it never crosses, and slides along it`, () => {
      const b = mkBot(kind, 40, 40);
      for (let i = 0; i < 400; i++) {
        b.ix = 1;
        b.iy = 0.6;
        stepBot(b, DT_MAX, diag);
        // Signed distance from the wall's centre line, positive on the start side.
        const d = (200 - b.x - b.y) / Math.SQRT2;
        // Resolved to within a hundredth of a pixel (under a millimetre) every frame.
        expect(d).toBeGreaterThan(b.r + 3 - 0.01);
      }
      // Pressed into a 45° wall with a stick that is not normal to it: it keeps moving along it.
      expect(speed(b)).toBeGreaterThan(0.2 * b.max);
    });
  }

  it('a polyline is closed at its joints: nobody squeezes through an outside corner', () => {
    // A V with its point at (100, 100); the robot pushes into the point from inside.
    const walls = polyWalls([[0, 0], [100, 100], [200, 0]], 6);
    for (const kind of ['voxxy', 'droid', 'biggy'] as const) {
      const b = mkBot(kind, 100, 30);
      for (let i = 0; i < 300; i++) {
        b.ix = 0;
        b.iy = 1;
        stepBot(b, DT_MAX, walls);
      }
      expect(b.y).toBeLessThan(100);
    }
  });
});

describe('rayWall', () => {
  it('matches rayRect for an axis-aligned segment wall', () => {
    const seg = segWall(10, 20, 50, 20, 6);
    const box = { x: 7, y: 17, w: 46, h: 6 };
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      expect(rayWall(30, 60, Math.cos(a), Math.sin(a), seg)).toBeCloseTo(rayRect(30, 60, Math.cos(a), Math.sin(a), box), 9);
    }
  });

  it('hits a diagonal wall at the right distance', () => {
    const w = segWall(0, 200, 200, 0, 6);
    // From the origin along the diagonal: the near face is 3 px before the centre line.
    const t = rayWall(0, 0, Math.SQRT1_2, Math.SQRT1_2, w);
    expect(t).toBeCloseTo(200 / Math.SQRT2 - 3, 6);
  });
});
