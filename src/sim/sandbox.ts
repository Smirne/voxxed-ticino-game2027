/**
 * The plan-check sandbox: the three robots loose on one floor of the Palazzo,
 * driven by the real `stepBot` against the digitised walls. No story, no
 * chapters — it exists so a human can walk the building at robot scale and say
 * "this wall is in the wrong place" before anything is built on it.
 *
 * Headless, like everything in `src/sim`; `src/plan` only draws it.
 */

import { botsCollide, mkBot, stepBot } from './bot';
import { DT_MAX } from './constants';
import { px } from './units';
import type { Bot, RobotKind, Wall } from './types';
import { buildWalls, FLOORS, type FloorPlan } from './venue';

export interface Sandbox {
  floor: FloorPlan;
  walls: Wall[];
  bots: Bot[];
  active: RobotKind;
  /** Which folding walls stand shut. */
  folding: Record<string, boolean>;
  setStick(ix: number, iy: number): void;
  select(kind: RobotKind): void;
  setFloor(id: FloorPlan['id']): void;
  toggleFolding(id: string): void;
  update(dt: number): void;
}

const START: Record<FloorPlan['id'], string> = { ground: 'foyer-principale', first: 'atrio-b' };

export function createSandbox(floorId: FloorPlan['id'] = 'ground'): Sandbox {
  const sb: Sandbox = {
    floor: FLOORS[floorId],
    walls: [],
    bots: [],
    active: 'voxxy',
    folding: {},
    setStick(ix, iy) {
      for (const b of sb.bots) {
        b.ix = b.kind === sb.active ? ix : 0;
        b.iy = b.kind === sb.active ? iy : 0;
      }
    },
    select(kind) {
      sb.active = kind;
      sb.setStick(0, 0);
    },
    setFloor(id) {
      sb.floor = FLOORS[id];
      sb.folding = {};
      for (const w of sb.floor.walls) if (w.kind === 'folding' && w.id) sb.folding[w.id] = true;
      rebuild();
      const room = sb.floor.rooms.find((r) => r.id === START[id]) ?? sb.floor.rooms[0];
      const [x, y] = room.label;
      sb.bots = (['voxxy', 'droid', 'biggy'] as RobotKind[]).map((k, i) => mkBot(k, px(x - 2 + 2 * i), px(y + 2)));
    },
    toggleFolding(id) {
      sb.folding[id] = !sb.folding[id];
      rebuild();
    },
    update(dt) {
      const step = Math.min(dt, DT_MAX);
      for (const b of sb.bots) stepBot(b, step, sb.walls);
      for (let i = 0; i < sb.bots.length; i++) for (let j = i + 1; j < sb.bots.length; j++) botsCollide(sb.bots[i], sb.bots[j]);
    },
  };
  const rebuild = (): void => {
    sb.walls = buildWalls(sb.floor, { foldingShut: (id) => (id ? sb.folding[id] !== false : true) });
  };
  sb.setFloor(floorId);
  return sb;
}
