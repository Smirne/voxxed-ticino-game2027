/**
 * The digitised Palazzo against its own drawing.
 *
 * The plans print an area for most rooms; a room polygon that lands far from it is
 * a misread wall. And the floors have to be floors: every public room reachable
 * from the foyer, nothing reachable outside the building.
 */
import { describe, expect, it } from 'vitest';
import { DEFS } from '../src/sim/constants';
import { px } from '../src/sim/units';
import { circleWall } from '../src/sim/walls';
import { FLOORS, buildWalls, inPoly, polyArea, type FloorPlan } from '../src/sim/venue';
import type { RobotKind, Wall } from '../src/sim/types';

/** Cells a robot of radius r (px) can stand in, on a grid of `cell` metres over the sheet. */
function freeGrid(walls: Wall[], r: number, cell = 0.2) {
  const W = Math.ceil(127 / cell);
  const H = Math.ceil(75 / cell);
  const blocked = new Uint8Array(W * H);
  for (const w of walls) {
    const i0 = Math.max(0, Math.floor((w.x - r) / px(cell)));
    const i1 = Math.min(W - 1, Math.ceil((w.x + w.w + r) / px(cell)));
    const j0 = Math.max(0, Math.floor((w.y - r) / px(cell)));
    const j1 = Math.min(H - 1, Math.ceil((w.y + w.h + r) / px(cell)));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (blocked[j * W + i]) continue;
        if (circleWall({ x: px((i + 0.5) * cell), y: px((j + 0.5) * cell), r }, w)) blocked[j * W + i] = 1;
      }
    }
  }
  return { W, H, cell, blocked };
}

/** Flood fill from several seeds (metres). */
function reach(g: ReturnType<typeof freeGrid>, floor: FloorPlan): Uint8Array {
  const seen = new Uint8Array(g.W * g.H);
  const q: number[] = [];
  // A seed must land on a public floor: a stair too narrow for Biggy must not
  // start him on the pavement outside.
  const polys = [...floor.rooms.filter((r) => r.public).map((r) => r.poly), ...floor.stairs.map((s) => s.poly)];
  const onFloor = (x: number, y: number): boolean => polys.some((p) => inPoly(x, y, p));
  for (const [x, y] of seeds(floor)) {
    const k = nearestFree(g, x, y, onFloor);
    if (k >= 0 && !seen[k]) {
      seen[k] = 1;
      q.push(k);
    }
  }
  while (q.length) {
    const k = q.pop()!;
    const i = k % g.W;
    const j = (k - i) / g.W;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= g.W || nj >= g.H) continue;
      const nk = nj * g.W + ni;
      if (seen[nk] || g.blocked[nk]) continue;
      seen[nk] = 1;
      q.push(nk);
    }
  }
  return seen;
}

/** The free cell nearest (x, y) metres within 1.5 m (and inside `within`, if given), or -1. */
function nearestFree(g: ReturnType<typeof freeGrid>, x: number, y: number, within?: (x: number, y: number) => boolean): number {
  let best = -1;
  let bd = Infinity;
  const ci = Math.floor(x / g.cell);
  const cj = Math.floor(y / g.cell);
  const n = Math.ceil(1.5 / g.cell);
  for (let j = cj - n; j <= cj + n; j++) {
    for (let i = ci - n; i <= ci + n; i++) {
      if (i < 0 || j < 0 || i >= g.W || j >= g.H || g.blocked[j * g.W + i]) continue;
      if (within && !within((i + 0.5) * g.cell, (j + 0.5) * g.cell)) continue;
      const d = (i - ci) ** 2 + (j - cj) ** 2;
      if (d < bd) {
        bd = d;
        best = j * g.W + i;
      }
    }
  }
  return best;
}

const reached = (g: ReturnType<typeof freeGrid>, seen: Uint8Array, x: number, y: number): boolean => {
  const k = nearestFree(g, x, y);
  return k >= 0 && seen[k] === 1;
};

const HUB: Record<FloorPlan['id'], string> = { ground: 'foyer-principale', first: 'atrio-b' };

/**
 * Where a robot can arrive on a floor: its hub, and the middle of every stair and
 * lift — the Sala A balcony, for one, is reached only by its own stairs from the
 * ground floor, not across the first floor.
 */
function seeds(floor: FloorPlan): Array<[number, number]> {
  const hub = floor.rooms.find((r) => r.id === HUB[floor.id])!;
  const out: Array<[number, number]> = [[hub.label[0], hub.label[1]]];
  for (const s of floor.stairs) {
    const n = s.poly.length;
    out.push([s.poly.reduce((a, p) => a + p[0], 0) / n, s.poly.reduce((a, p) => a + p[1], 0) / n]);
  }
  return out;
}

for (const floor of Object.values(FLOORS)) {
  describe(`${floor.id} floor`, () => {
    it('has its rooms, with unique ids, labels inside their own outline', () => {
      expect(floor.rooms.length).toBeGreaterThan(3);
      const ids = floor.rooms.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const r of floor.rooms) expect(inPoly(r.label[0], r.label[1], r.poly), r.id).toBe(true);
    });

    it("each room's outline is within 12% of the area the plan prints for it", () => {
      for (const r of floor.rooms) {
        if (!r.area) continue;
        const a = polyArea(r.poly);
        expect(Math.abs(a - r.area) / r.area, `${r.id}: ${a.toFixed(1)} m² vs ${r.area} m²`).toBeLessThan(0.12);
      }
    });

    it('every wall is on the drawing sheet and has a length', () => {
      for (const w of floor.walls) {
        expect(w.pts.length).toBeGreaterThanOrEqual(2);
        for (const [x, y] of w.pts) {
          expect(x).toBeGreaterThan(0);
          expect(x).toBeLessThan(127);
          expect(y).toBeGreaterThan(0);
          expect(y).toBeLessThan(75);
        }
      }
    });

    const walls = buildWalls(floor);
    const hub = floor.rooms.find((r) => r.id === HUB[floor.id])!;

    it(`Voxxy can walk to every public room from ${HUB[floor.id]} or a stair`, () => {
      expect(hub).toBeDefined();
      const g = freeGrid(walls, DEFS.voxxy.r);
      const seen = reach(g, floor);
      const missing = floor.rooms.filter((r) => r.public && !reached(g, seen, r.label[0], r.label[1])).map((r) => r.id);
      expect(missing).toEqual([]);
    });

    it('the building is sealed: nobody walks out onto the sheet margin, or into a private room', () => {
      for (const kind of ['voxxy', 'droid', 'biggy'] as RobotKind[]) {
        const g = freeGrid(walls, DEFS[kind].r);
        const seen = reach(g, floor);
        // The sheet's four corners are outside the building on both drawings.
        for (const [x, y] of [[1, 1], [125, 1], [1, 73], [125, 73]]) expect(reached(g, seen, x, y), `${kind} at ${x},${y}`).toBe(false);
        for (const r of floor.rooms.filter((r) => !r.public)) expect(reached(g, seen, r.label[0], r.label[1]), `${kind} in ${r.id}`).toBe(false);
      }
    });
  });
}

describe('the two floors agree', () => {
  it('every stair and lift names rooms that exist, on one floor or the other', () => {
    const ids = new Set([...FLOORS.ground.rooms, ...FLOORS.first.rooms].map((r) => r.id));
    for (const f of Object.values(FLOORS)) {
      for (const s of f.stairs) {
        expect(ids.has(s.from), `${f.id} ${s.id} from ${s.from}`).toBe(true);
        expect(ids.has(s.to), `${f.id} ${s.id} to ${s.to}`).toBe(true);
      }
    }
  });

  it('a stair that changes floor lands on public rooms at both ends', () => {
    const room = new Map([...FLOORS.ground.rooms, ...FLOORS.first.rooms].map((r) => [r.id, r]));
    for (const f of Object.values(FLOORS)) {
      for (const s of f.stairs) {
        if (s.kind === 'steps') continue;
        expect(room.get(s.from)?.public && room.get(s.to)?.public, `${f.id} ${s.id}`).toBe(true);
      }
    }
  });
});

describe('the Voxxed Days layout (Michele, 2 Nov 2026)', () => {
  const first = FLOORS.first;

  it('B3 is the only folding section closed off: B1+B2 merged, Sala C one room', () => {
    const shut = first.walls.filter((w) => w.kind === 'folding' && !w.open).map((w) => w.id);
    expect(shut).toEqual(['fold-b2-b3']);
    const built = buildWalls(first).length;
    expect(buildWalls(first, { foldingShut: () => true }).length).toBeGreaterThan(built);
  });

  it('with every folding wall shut, each section still has its own way in', () => {
    const g = freeGrid(buildWalls(first, { foldingShut: () => true }), DEFS.voxxy.r);
    const seen = reach(g, first);
    const missing = first.rooms.filter((r) => r.public && !reached(g, seen, r.label[0], r.label[1])).map((r) => r.id);
    expect(missing).toEqual([]);
  });

  it('each podium stands inside the Sala B section it is for', () => {
    const podiums = first.zones.filter((z) => z.kind === 'podium');
    expect(podiums.map((z) => z.id).sort()).toEqual(['podium-b1', 'podium-b2', 'podium-b3']);
    for (const z of podiums) {
      const room = first.rooms.find((r) => r.id === `sala-${z.id.slice('podium-'.length)}`)!;
      for (const [x, y] of z.poly) expect(inPoly(x, y, room.poly), `${z.id} corner ${x},${y}`).toBe(true);
    }
  });

  it('the Sala A balcony and galleria are closed during the conference, yet a robot can still get in', () => {
    const g = freeGrid(buildWalls(first), DEFS.voxxy.r);
    const seen = reach(g, first);
    for (const id of ['sala-a-balcony', 'sala-a-galleria']) {
      const room = first.rooms.find((r) => r.id === id)!;
      expect(room.conference, id).toBe('closed');
      expect(reached(g, seen, room.label[0], room.label[1]), id).toBe(true);
    }
  });

  it('the east stair by the WC leads to the galleria, the big west stair to the balcony (Michele, 3 Nov 2026)', () => {
    for (const f of Object.values(FLOORS)) {
      for (const s of f.stairs.filter((q) => q.to.startsWith('sala-a-') && q.kind === 'stair')) {
        const east = s.poly.every(([x]) => x > 30);
        expect(s.to, `${f.id} ${s.id}`).toBe(east ? 'sala-a-galleria' : 'sala-a-balcony');
      }
    }
  });
});
