/**
 * The Palazzo with three robots in it, both floors at once.
 *
 * Every robot is on a floor of its own and is stepped against that floor's walls,
 * whichever floor anyone is looking at. A robot that walks onto a stair or into a
 * lift that changes floor (its centre 0.3 m in) comes out on the other floor just
 * off that stair's mouth, facing out (or at the same spot, if no mouth is drawn: the
 * two drawings share one registration). To go back it steps off the stair and on again.
 *
 * Used by the plan check (`sandbox.ts`) and the game (`game.ts`). Headless.
 */

import { botsCollide, mkBot, stepBot, syncMount } from './bot';
import { DT_MAX } from './constants';
import { m, px } from './units';
import { circleWall } from './walls';
import type { Bot, RobotKind, Wall } from './types';
import { buildWalls, FLOORS, inPoly, type FloorPlan, type VenueStair } from './venue';

export type FloorId = FloorPlan['id'];
type P = readonly [number, number];

export const KINDS: readonly RobotKind[] = ['voxxy', 'droid', 'biggy'];
export const HUB: Record<FloorId, string> = { ground: 'foyer-principale', first: 'atrio-b' };

export interface World {
  /** All three robots, whatever floor they are on. */
  bots: Bot[];
  /** Which robot is on which floor. */
  on: Record<RobotKind, FloorId>;
  /** Which folding walls stand shut, both floors. */
  folding: Record<string, boolean>;
  bot(kind: RobotKind): Bot;
  /** The solid walls of a floor, folding walls as they stand now. */
  walls(f: FloorId): Wall[];
  /** Put a robot somewhere (metres), at rest. */
  place(kind: RobotKind, f: FloorId, x: number, y: number, face?: number): void;
  toggleFolding(id: string): void;
  /**
   * Step every robot on its own floor. `onFloorChange` hears each robot that took a
   * stair or lift this frame.
   */
  update(dt: number, onFloorChange?: (b: Bot, from: FloorId, to: FloorId) => void): void;
}

const floorOf = (room: string): FloorId | undefined =>
  (Object.keys(FLOORS) as FloorId[]).find((f) => FLOORS[f].rooms.some((r) => r.id === room));

/** The floor a stair or lift leads to from `here`, or undefined if it stays on this floor. */
export function otherEnd(s: VenueStair, here: FloorId): FloorId | undefined {
  if (s.kind === 'steps') return undefined;
  for (const id of [s.from, s.to]) {
    const f = floorOf(id);
    if (f && f !== here) return f;
  }
  return undefined;
}

export function distToSeg([x, y]: P, [ax, ay]: P, [bx, by]: P): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

/** How far onto a stair a robot's centre must be to change floor, metres. */
const STAIR_DEPTH = 0.3;

/** The point (metres) lies inside the polygon, at least r from its edges. */
function deepInside(c: P, r: number, poly: readonly P[]): boolean {
  if (!inPoly(c[0], c[1], poly)) return false;
  return poly.every((a, i) => distToSeg(c, a, poly[(i + 1) % poly.length]) >= r);
}

export const centroid = (poly: readonly P[]): P => [
  poly.reduce((a, p) => a + p[0], 0) / poly.length,
  poly.reduce((a, p) => a + p[1], 0) / poly.length,
];

/** All three robots at the hub of floor `start`, folding walls as in the Voxxed layout. */
export function createWorld(start: FloorId = 'ground'): World {
  const folding: Record<string, boolean> = {};
  for (const f of Object.values(FLOORS)) for (const w of f.walls) if (w.kind === 'folding' && w.id) folding[w.id] = !w.open;
  const cache: Partial<Record<FloorId, Wall[]>> = {};
  const wallsOf = (f: FloorId): Wall[] =>
    (cache[f] ??= buildWalls(FLOORS[f], { foldingShut: (id) => (id ? folding[id] !== false : true) }));
  /** Robots that just came off a stair: no going back until they step off it. */
  const arrived = new Set<RobotKind>();
  const [x, y] = (FLOORS[start].rooms.find((r) => r.id === HUB[start]) ?? FLOORS[start].rooms[0]).label;

  const w: World = {
    bots: KINDS.map((k, i) => mkBot(k, px(x - 2 + 2 * i), px(y + 2))),
    on: { voxxy: start, droid: start, biggy: start },
    folding,
    bot: (kind) => w.bots.find((b) => b.kind === kind)!,
    walls: wallsOf,
    place(kind, f, px_, py_, face) {
      const b = w.bot(kind);
      w.on[kind] = f;
      b.x = px(px_);
      b.y = px(py_);
      b.vx = 0;
      b.vy = 0;
      if (face !== undefined) b.face = face;
      arrived.delete(kind);
    },
    toggleFolding(id) {
      folding[id] = !folding[id];
      delete cache.ground;
      delete cache.first;
    },
    update(dt, onFloorChange) {
      const step = Math.min(dt, DT_MAX);
      for (const f of Object.keys(FLOORS) as FloorId[]) {
        const here = w.bots.filter((b) => w.on[b.kind] === f);
        for (const b of here) stepBot(b, step, wallsOf(f));
        // A mounted Droid is carried: he collides with nobody, Biggy does it for both.
        const solid = here.filter((b) => !b.mounted);
        for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) botsCollide(solid[i], solid[j]);
        syncMount(here);
      }
      for (const b of w.bots) {
        if (b.mounted) continue;
        const from = w.on[b.kind];
        if (!changeFloor(b)) continue;
        // Droid rides Biggy up the stair with him.
        const d = w.bot('droid');
        if (b.kind === 'biggy' && d.mounted) {
          w.on.droid = w.on.biggy;
          syncMount([d, b]);
        }
        onFloorChange?.(b, from, w.on[b.kind]);
        if (b.kind === 'biggy' && d.mounted) onFloorChange?.(d, from, w.on.droid);
      }
    },
  };

  /** Take a stair or lift if the robot is far enough onto one. True if it changed floor. */
  function changeFloor(b: Bot): boolean {
    const here = w.on[b.kind];
    const c: P = [m(b.x), m(b.y)];
    const stairs = FLOORS[here].stairs.filter((s) => otherEnd(s, here));
    if (arrived.has(b.kind)) {
      if (!stairs.some((s) => inPoly(c[0], c[1], s.poly))) arrived.delete(b.kind);
      return false;
    }
    const s = stairs.find((q) => deepInside(c, STAIR_DEPTH, q.poly));
    if (!s) return false;
    const there = otherEnd(s, here)!;
    // The same stair on the other floor: same kind and rooms, and the nearest (both Sala A balcony
    // stairs join the same two rooms).
    const [sx, sy] = centroid(s.poly);
    const dist = (q: VenueStair): number => Math.hypot(centroid(q.poly)[0] - sx, centroid(q.poly)[1] - sy);
    const twin = FLOORS[there].stairs
      .filter((q) => q.kind === s.kind && q.from === s.from && q.to === s.to)
      .sort((a, q) => dist(a) - dist(q))[0];
    const walls = wallsOf(there);
    const blocked = (): boolean => walls.some((wl) => circleWall({ x: b.x, y: b.y, r: b.r }, wl));
    if (twin?.mouth) {
      // Just off the twin's mouth, facing away from it: one step back takes it down again.
      const [[ax, ay], [bx, by]] = twin.mouth;
      const [cx, cy] = centroid(twin.poly);
      const len = Math.hypot(bx - ax, by - ay);
      let [nx, ny] = [(ay - by) / len, (bx - ax) / len];
      const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
      if ((cx - mx) * nx + (cy - my) * ny < 0) [nx, ny] = [-nx, -ny];
      for (let out = m(b.r) + 0.1; out < m(b.r) + 1.5; out += 0.1) {
        [b.x, b.y] = [px(mx - nx * out), px(my - ny * out)];
        if (!blocked()) break;
      }
      b.vx = 0;
      b.vy = 0;
      b.face = Math.atan2(-ny, -nx);
    } else if (twin && blocked()) {
      [b.x, b.y] = centroid(twin.poly).map(px) as [number, number];
    }
    w.on[b.kind] = there;
    arrived.add(b.kind);
    return true;
  }

  return w;
}
