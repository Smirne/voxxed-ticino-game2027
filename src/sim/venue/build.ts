/**
 * Venue data (metres) -> sim walls (pixels).
 *
 * The one place the digitised Palazzo becomes collision. Everything downstream —
 * `stepBot`, the lamps' visibility polygons — sees ordinary `Wall`s; diagonals are
 * oriented slabs from `../walls`.
 */

import { px } from '../units';
import { polyWalls } from '../walls';
import type { Wall } from '../types';
import { WALL_T_M, type FloorPlan, type P, type VenueWall, type VenueZone } from './types';

export interface BuildOptions {
  /** Folding walls (Sala B, Sala C) that stand shut. Default: all of them. */
  foldingShut?: (id: string | undefined) => boolean;
}

const toPx = (pts: P[]): Array<[number, number]> => pts.map(([x, y]) => [px(x), px(y)]);

function wallFlags(w: VenueWall): Partial<Wall> {
  const kind = w.kind ?? 'wall';
  const out: Partial<Wall> = { kind };
  // Glass and rails stop robots but not light — the engine's `glass` and `low`.
  if (kind === 'glass') out.glass = true;
  if (kind === 'rail') out.low = true;
  // A ledge stops robots in the air too (only `low` is skipped by a hop) and passes light.
  if (kind === 'ledge') out.glass = true;
  return out;
}

/** Every solid thing on one floor, in sim pixels. */
export function buildWalls(floor: FloorPlan, opts: BuildOptions = {}): Wall[] {
  const shut = opts.foldingShut ?? (() => true);
  const out: Wall[] = [];
  for (const w of floor.walls) {
    if (w.kind === 'folding' && !shut(w.id)) continue;
    out.push(...polyWalls(toPx(w.pts), px(w.t ?? WALL_T_M), w.closed ?? false, wallFlags(w)));
  }
  for (const c of floor.columns) {
    // A round pillar is collided as its square: at 1 m across the corners stand
    // 0.2 m proud, which no robot can tell from the curve at walking speed.
    out.push({ x: px(c.x - c.w / 2), y: px(c.y - c.h / 2), w: px(c.w), h: px(c.h), kind: c.round ? 'pillar' : 'column' });
  }
  return out;
}

/** Shoelace area of a polygon, m². */
export function polyArea(poly: readonly P[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

/** Even-odd point-in-polygon. */
export function inPoly(x: number, y: number, poly: readonly P[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Is (x, y) metres inside the zone: in one of its rooms, not kept clear, not on steps? */
export function inZone(floor: FloorPlan, zone: VenueZone, x: number, y: number): boolean {
  const inRoom = floor.rooms.some((r) => zone.rooms.includes(r.id) && inPoly(x, y, r.poly));
  if (!inRoom) return false;
  if (zone.keepClear?.some((p) => inPoly(x, y, p))) return false;
  return !floor.stairs.some((s) => inPoly(x, y, s.poly));
}
