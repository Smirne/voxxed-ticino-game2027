/**
 * A test pilot: drives the game's active robot to a point with the stick, the way a
 * player would, along a breadth-first path on a 0.25 m grid that keeps the robot's own
 * radius clear of every wall. Not a test file (no `.test.`): imported by tests.
 */
import { px, m } from '../src/sim/units';
import { circleWall } from '../src/sim/walls';
import type { Game } from '../src/sim/game';

const CELL = 0.25;
const W = Math.ceil(127 / CELL);
const H = Math.ceil(75 / CELL);

/** Cells from the robot to (x, y) metres on its floor, or [] if there is no way. */
export function pathTo(g: Game, x: number, y: number): Array<[number, number]> {
  const b = g.world.bot(g.active);
  const walls = g.world.walls(g.world.on[g.active]);
  const r = b.r + px(0.05);
  const free = new Map<number, boolean>();
  const ok = (i: number, j: number): boolean => {
    const k = j * W + i;
    let v = free.get(k);
    if (v === undefined) {
      const c = { x: px((i + 0.5) * CELL), y: px((j + 0.5) * CELL), r };
      v = !walls.some((w) => circleWall(c, w));
      free.set(k, v);
    }
    return v;
  };
  const s = Math.floor(m(b.y) / CELL) * W + Math.floor(m(b.x) / CELL);
  const goal = Math.floor(y / CELL) * W + Math.floor(x / CELL);
  const prev = new Map<number, number>([[s, -1]]);
  const q = [s];
  for (let h = 0; h < q.length; h++) {
    const n = q[h];
    if (n === goal) break;
    const i = n % W;
    const j = (n - i) / W;
    for (const [a, c] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ni = i + a;
      const nj = j + c;
      const nk = nj * W + ni;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H || prev.has(nk) || !ok(ni, nj)) continue;
      // No corner cutting on diagonals.
      if (a && c && (!ok(i + a, j) || !ok(i, j + c))) continue;
      prev.set(nk, n);
      q.push(nk);
    }
  }
  if (!prev.has(goal)) return [];
  const out: Array<[number, number]> = [];
  for (let n = goal; n !== -1; n = prev.get(n)!) out.unshift([((n % W) + 0.5) * CELL, (Math.floor(n / W) + 0.5) * CELL]);
  return out;
}

/**
 * Drive the active robot to (x, y) metres, at most `secs` seconds of game time. Stops early
 * when `until` holds (checked every frame). Returns true if it got there (or `until` held).
 */
export function driveTo(g: Game, x: number, y: number, secs = 60, until?: () => boolean): boolean {
  const path = pathTo(g, x, y);
  if (!path.length) return false;
  let i = 0;
  const floor = g.world.on[g.active];
  for (let t = 0; t < secs; t += 1 / 60) {
    if (until?.()) break;
    if (g.world.on[g.active] !== floor) break;
    const b = g.world.bot(g.active);
    const bx = m(b.x);
    const by = m(b.y);
    // Aim a little ahead along the path.
    while (i < path.length - 1 && Math.hypot(path[i][0] - bx, path[i][1] - by) < 0.6) i++;
    const [tx, ty] = path[i];
    const d = Math.hypot(tx - bx, ty - by);
    if (i === path.length - 1 && d < 0.3) break;
    g.setStick((tx - bx) / (d || 1), (ty - by) / (d || 1));
    g.update(1 / 60);
  }
  g.setStick(0, 0);
  g.update(1 / 60);
  const b = g.world.bot(g.active);
  return (until?.() ?? false) || Math.hypot(m(b.x) - x, m(b.y) - y) < 0.6;
}

/** Hold a fixed stick for up to `secs` seconds, or until `until` holds. */
export function hold(g: Game, ix: number, iy: number, secs: number, until?: () => boolean): void {
  for (let t = 0; t < secs && !until?.(); t += 1 / 60) {
    g.setStick(ix, iy);
    g.update(1 / 60);
  }
  g.setStick(0, 0);
}
