/**
 * The plan-check sandbox: the three robots loose in the Palazzo, driven by the
 * real `stepBot` against the digitised walls. No story, no chapters — it exists
 * so a human can walk the building at robot scale and say "this wall is in the
 * wrong place" before anything is built on it.
 *
 * Each robot is on a floor of its own; the view shows one floor. A robot that
 * walks fully onto a stair or into a lift that changes floor comes out on the
 * other floor at the same spot (the two drawings share one registration), and
 * the view follows the active robot.
 *
 * Headless, like everything in `src/sim`; `src/plan` only draws it.
 */

import { botsCollide, mkBot, stepBot } from './bot';
import { DT_MAX } from './constants';
import { m, px } from './units';
import { circleWall } from './walls';
import type { Bot, RobotKind, Wall } from './types';
import { buildWalls, FLOORS, inPoly, type FloorPlan, type VenueStair } from './venue';

type FloorId = FloorPlan['id'];
type P = readonly [number, number];

export interface Sandbox {
  /** The floor on view. */
  floor: FloorPlan;
  walls: Wall[];
  /** The robots on the floor on view. */
  bots: Bot[];
  active: RobotKind;
  /** Which robot is on which floor. */
  on: Record<RobotKind, FloorId>;
  /** Which folding walls stand shut, both floors. */
  folding: Record<string, boolean>;
  setStick(ix: number, iy: number): void;
  /** Make a robot the active one; the view goes to its floor. */
  select(kind: RobotKind): void;
  /** Start over: all three robots at the hub of this floor, folding walls as in the Voxxed layout. */
  setFloor(id: FloorId): void;
  toggleFolding(id: string): void;
  update(dt: number): void;
}

const START: Record<FloorId, string> = { ground: 'foyer-principale', first: 'atrio-b' };
const KINDS: RobotKind[] = ['voxxy', 'droid', 'biggy'];

const floorOf = (room: string): FloorId | undefined =>
  (Object.keys(FLOORS) as FloorId[]).find((f) => FLOORS[f].rooms.some((r) => r.id === room));

/** The floor a stair or lift leads to from `here`, or undefined if it stays on this floor. */
function otherEnd(s: VenueStair, here: FloorId): FloorId | undefined {
  if (s.kind === 'steps') return undefined;
  for (const id of [s.from, s.to]) {
    const f = floorOf(id);
    if (f && f !== here) return f;
  }
  return undefined;
}

function distToSeg([x, y]: P, [ax, ay]: P, [bx, by]: P): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

/** The whole disc (centre and radius in metres) lies inside the polygon. */
function discInside(c: P, r: number, poly: readonly P[]): boolean {
  if (!inPoly(c[0], c[1], poly)) return false;
  return poly.every((a, i) => distToSeg(c, a, poly[(i + 1) % poly.length]) >= r);
}

const centroid = (poly: readonly P[]): P => [
  poly.reduce((a, p) => a + p[0], 0) / poly.length,
  poly.reduce((a, p) => a + p[1], 0) / poly.length,
];

export function createSandbox(floorId: FloorId = 'ground'): Sandbox {
  let all: Bot[] = [];
  /** Robots that just came off a stair: no going back until they step off it. */
  const arrived = new Set<RobotKind>();
  const wallsOf = (f: FloorId): Wall[] =>
    buildWalls(FLOORS[f], { foldingShut: (id) => (id ? sb.folding[id] !== false : true) });

  const sb: Sandbox = {
    floor: FLOORS[floorId],
    walls: [],
    bots: [],
    active: 'voxxy',
    on: { voxxy: floorId, droid: floorId, biggy: floorId },
    folding: {},
    setStick(ix, iy) {
      for (const b of all) {
        b.ix = b.kind === sb.active ? ix : 0;
        b.iy = b.kind === sb.active ? iy : 0;
      }
    },
    select(kind) {
      sb.active = kind;
      sb.setStick(0, 0);
      view(sb.on[kind]);
    },
    setFloor(id) {
      sb.folding = {};
      for (const f of Object.values(FLOORS)) for (const w of f.walls) if (w.kind === 'folding' && w.id) sb.folding[w.id] = !w.open;
      const [x, y] = (FLOORS[id].rooms.find((r) => r.id === START[id]) ?? FLOORS[id].rooms[0]).label;
      all = KINDS.map((k, i) => mkBot(k, px(x - 2 + 2 * i), px(y + 2)));
      for (const k of KINDS) sb.on[k] = id;
      arrived.clear();
      view(id);
    },
    toggleFolding(id) {
      sb.folding[id] = !sb.folding[id];
      sb.walls = wallsOf(sb.floor.id);
    },
    update(dt) {
      const step = Math.min(dt, DT_MAX);
      for (const b of sb.bots) stepBot(b, step, sb.walls);
      for (let i = 0; i < sb.bots.length; i++) for (let j = i + 1; j < sb.bots.length; j++) botsCollide(sb.bots[i], sb.bots[j]);
      for (const b of [...sb.bots]) changeFloor(b);
    },
  };

  /** Show floor `id`: its walls and the robots standing on it. */
  function view(id: FloorId): void {
    sb.floor = FLOORS[id];
    sb.walls = wallsOf(id);
    sb.bots = all.filter((b) => sb.on[b.kind] === id);
  }

  function changeFloor(b: Bot): void {
    const here = sb.on[b.kind];
    const c: P = [m(b.x), m(b.y)];
    const stairs = FLOORS[here].stairs.filter((s) => otherEnd(s, here));
    if (arrived.has(b.kind)) {
      if (!stairs.some((s) => inPoly(c[0], c[1], s.poly))) arrived.delete(b.kind);
      return;
    }
    const s = stairs.find((q) => discInside(c, m(b.r), q.poly));
    if (!s) return;
    const there = otherEnd(s, here)!;
    // Same spot on the other floor if the robot fits there; otherwise the
    // middle of that floor's matching stair.
    if (wallsOf(there).some((w) => circleWall({ x: b.x, y: b.y, r: b.r }, w))) {
      const twin = FLOORS[there].stairs.find((q) => q.kind === s.kind && q.from === s.from && q.to === s.to);
      if (twin) [b.x, b.y] = centroid(twin.poly).map(px);
    }
    sb.on[b.kind] = there;
    arrived.add(b.kind);
    view(b.kind === sb.active ? there : here);
  }

  sb.setFloor(floorId);
  return sb;
}
