/**
 * Changing floor in the plan-check sandbox, by walking (Michele's 2D run, 2 Nov 2026: "I can't
 * pass from floor 0 to 1"). The reachability tests seed every stair, so they cannot see this.
 */
import { describe, expect, it } from 'vitest';
import { createSandbox, type Sandbox } from '../src/sim/sandbox';
import { m, px } from '../src/sim/units';
import { DEFS } from '../src/sim/constants';
import { circleWall } from '../src/sim/walls';
import { FLOORS, buildWalls, type FloorPlan } from '../src/sim/venue';
import type { RobotKind } from '../src/sim/types';

type FloorId = FloorPlan['id'];

/** Drive the active robot with a fixed stick until `done`, at most `secs` seconds. */
function drive(sb: Sandbox, ix: number, iy: number, secs: number, done: () => boolean): void {
  for (let t = 0; t < secs && !done(); t += 1 / 60) {
    sb.setStick(ix, iy);
    sb.update(1 / 60);
  }
  sb.setStick(0, 0);
}

const bot = (sb: Sandbox, k: RobotKind) => sb.bots.find((b) => b.kind === k)!;

describe('the main stair, ground <-> first', () => {
  for (const k of ['voxxy', 'droid', 'biggy'] as RobotKind[]) {
    it(`${k} walks up from the Villa Ciani foyer into Atrio B, and back down`, () => {
      const sb = createSandbox('ground');
      sb.select(k);
      // West of the flight, where the plan's "1° PIANO" arrow points in; the others out of the way.
      for (const b of sb.bots) [b.x, b.y] = b.kind === k ? [px(60.5), px(27.3)] : [px(50), px(36 + b.r)];
      drive(sb, 1, 0, 20, () => sb.on[k] === 'first' && m(bot(sb, k).x) > 70);
      expect(sb.on[k]).toBe('first');
      expect(sb.floor.id).toBe('first');
      expect(m(bot(sb, k).x)).toBeGreaterThan(70);

      drive(sb, -1, 0, 20, () => sb.on[k] === 'ground' && m(bot(sb, k).x) < 62);
      expect(sb.on[k]).toBe('ground');
      expect(m(bot(sb, k).x)).toBeLessThan(62);
    });
  }

  it('the robots left behind stay on their floor, and picking one shows it', () => {
    const sb = createSandbox('ground');
    const v = bot(sb, 'voxxy');
    [v.x, v.y] = [px(60.5), px(27.3)];
    drive(sb, 1, 0, 20, () => sb.on.voxxy === 'first');
    expect(sb.bots.map((b) => b.kind)).toEqual(['voxxy']);
    sb.select('biggy');
    expect(sb.floor.id).toBe('ground');
    expect(sb.bots.map((b) => b.kind).sort()).toEqual(['biggy', 'droid']);
  });
});

/** Cells (metres, 0.25 m grid) reachable by a robot of kind k on a floor, from (x, y). */
function reachable(f: FloorId, k: RobotKind, x: number, y: number): (x: number, y: number) => boolean {
  const walls = buildWalls(FLOORS[f]);
  const c = 0.25;
  const W = Math.ceil(127 / c);
  const H = Math.ceil(75 / c);
  const ok = (i: number, j: number): boolean => !walls.some((w) => circleWall({ x: px((i + 0.5) * c), y: px((j + 0.5) * c), r: DEFS[k].r }, w));
  const seen = new Set<number>();
  const k0 = Math.floor(y / c) * W + Math.floor(x / c);
  const q = [k0];
  seen.add(k0);
  while (q.length) {
    const n = q.pop()!;
    const i = n % W;
    const j = (n - i) / W;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + a;
      const nj = j + b;
      const nk = nj * W + ni;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H || seen.has(nk) || !ok(ni, nj)) continue;
      seen.add(nk);
      q.push(nk);
    }
  }
  return (px_, py_) => seen.has(Math.floor(py_ / c) * W + Math.floor(px_ / c));
}

describe('every stair and lift works both ways (Voxxy)', () => {
  for (const f of Object.keys(FLOORS) as FloorId[]) {
    for (const s of FLOORS[f].stairs.filter((q) => q.kind !== 'steps')) {
      it(`${f} ${s.id}: walk on from ${s.from === s.to ? s.from : 'its room'}, come off on the other floor in the right room`, () => {
        const here = FLOORS[f];
        const near = here.rooms.find((r) => r.id === s.from) ?? here.rooms.find((r) => r.id === s.to)!;
        const room = [s.from, s.to].map((id) => here.rooms.find((r) => r.id === id)).find(Boolean)!;
        const fromRoom = reachable(f, 'voxxy', room.label[0], room.label[1]);
        // A spot on the stair where all of Voxxy fits, reachable from the room on this side.
        const xs = s.poly.map((p) => p[0]);
        const ys = s.poly.map((p) => p[1]);
        const sb = createSandbox(f);
        const v = bot(sb, 'voxxy');
        let moved = false;
        for (let x = Math.min(...xs); x <= Math.max(...xs) && !moved; x += 0.25) {
          for (let y = Math.min(...ys); y <= Math.max(...ys) && !moved; y += 0.25) {
            if (!fromRoom(x, y)) continue;
            for (const b of sb.bots) if (b !== v) [b.x, b.y] = [px(1), px(1)];
            [v.x, v.y, v.vx, v.vy] = [px(x), px(y), 0, 0];
            sb.update(1 / 60);
            moved = sb.on.voxxy !== f;
          }
        }
        expect(moved, `${near.id}: no spot on ${s.id} sends Voxxy to the other floor`).toBe(true);
        const there = sb.on.voxxy;
        const target = [s.from, s.to].map((id) => FLOORS[there].rooms.find((r) => r.id === id)).find(Boolean)!;
        const landed = reachable(there, 'voxxy', m(v.x), m(v.y));
        expect(landed(target.label[0], target.label[1]), `landed at ${m(v.x).toFixed(1)},${m(v.y).toFixed(1)} on ${there}, cut off from ${target.id}`).toBe(true);
      });
    }
  }
});

describe('the Sala A balcony, east stair by the WC (Michele\'s 2D run)', () => {
  it('Voxxy walks up from the WC corner, steps off on the balcony side, and walks back down', () => {
    const sb = createSandbox('ground');
    const v = bot(sb, 'voxxy');
    for (const b of sb.bots) if (b !== v) [b.x, b.y] = [px(50), px(36 + b.r)];
    [v.x, v.y] = [px(35.8), px(35.0)];
    drive(sb, 1, 0.55, 10, () => sb.on.voxxy === 'first');
    expect(sb.on.voxxy).toBe('first');
    // Off the stair on the first floor, towards the balcony doors...
    drive(sb, -1, -0.3, 10, () => m(v.x) < 35);
    expect(m(v.x)).toBeLessThan(35);
    expect(sb.on.voxxy).toBe('first');
    // ...and back on: down to the ground floor.
    drive(sb, 1, 0.55, 10, () => sb.on.voxxy === 'ground');
    expect(sb.on.voxxy).toBe('ground');
  });
});
