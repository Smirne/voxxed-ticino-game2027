/**
 * Walls that are not axis-aligned.
 *
 * Kinepolis Antwerp is a box of boxes, and the Devoxx engine only ever needed
 * axis-aligned slabs: `Wall extends Rect`. The Palazzo dei Congressi is not — the
 * Sala A drum is a polygon, the foyers are cut by 30° and 60° walls, the steps run
 * on the diagonal. So a wall may carry an oriented box (`Wall.obb`), and the two
 * consumers of a wall's shape — circle collision in `bot.ts` and ray casting in
 * `lights.ts` — go through `circleWall` / `rayWall` here, which move the query into
 * the wall's own frame and reuse the axis-aligned maths unchanged.
 *
 * An axis-aligned wall takes exactly the old path (`obb` absent), so the frozen
 * behaviour the Devoxx tests pin is untouched. For an oriented wall `x, y, w, h`
 * is its world bounding box, which is what the lamps' range culling reads.
 *
 * Sim pixels, like everything else in `src/sim`.
 */

import { circleRect } from './bot';
import { rayRect } from './lights';
import type { Hit, Wall } from './types';

/** Circle vs wall, in either form. Same contract as `circleRect`. */
export function circleWall(c: { x: number; y: number; r: number }, w: Wall): Hit | null {
  const o = w.obb;
  if (!o) return circleRect(c, w);
  const dx = c.x - o.cx;
  const dy = c.y - o.cy;
  const lx = dx * o.c + dy * o.s;
  const ly = -dx * o.s + dy * o.c;
  const hit = circleRect({ x: lx, y: ly, r: c.r }, { x: -o.hx, y: -o.hy, w: 2 * o.hx, h: 2 * o.hy });
  if (!hit) return null;
  return { nx: hit.nx * o.c - hit.ny * o.s, ny: hit.nx * o.s + hit.ny * o.c, pen: hit.pen };
}

/** Ray vs wall, in either form. Same contract as `rayRect`: (dx, dy) is a unit vector. */
export function rayWall(px: number, py: number, dx: number, dy: number, w: Wall): number {
  const o = w.obb;
  if (!o) return rayRect(px, py, dx, dy, w);
  const qx = px - o.cx;
  const qy = py - o.cy;
  return rayRect(
    qx * o.c + qy * o.s,
    -qx * o.s + qy * o.c,
    dx * o.c + dy * o.s,
    -dx * o.s + dy * o.c,
    { x: -o.hx, y: -o.hy, w: 2 * o.hx, h: 2 * o.hy },
  );
}

/**
 * A wall slab of thickness `t` whose centre line runs from (ax, ay) to (bx, by).
 *
 * The slab is lengthened by `t / 2` at both ends, so two segments that share an
 * end point overlap at the corner instead of leaving a notch on its outside — a
 * polyline of these is closed at every joint, at any angle up to a hairpin.
 */
export function segWall(ax: number, ay: number, bx: number, by: number, t: number, extra: Partial<Wall> = {}): Wall {
  const len = Math.hypot(bx - ax, by - ay);
  const c = len > 0 ? (bx - ax) / len : 1;
  const s = len > 0 ? (by - ay) / len : 0;
  const hx = len / 2 + t / 2;
  const hy = t / 2;
  const cx = (ax + bx) / 2;
  const cy = (ay + by) / 2;
  // World bounding box of the oriented box.
  const ex = Math.abs(c) * hx + Math.abs(s) * hy;
  const ey = Math.abs(s) * hx + Math.abs(c) * hy;
  return { ...extra, x: cx - ex, y: cy - ey, w: 2 * ex, h: 2 * ey, obb: { cx, cy, hx, hy, c, s } };
}

/** One slab per segment of a polyline; `closed` adds the segment back to the start. */
export function polyWalls(pts: ReadonlyArray<readonly [number, number]>, t: number, closed = false, extra: Partial<Wall> = {}): Wall[] {
  const out: Wall[] = [];
  const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % n];
    out.push(segWall(ax, ay, bx, by, t, extra));
  }
  return out;
}
