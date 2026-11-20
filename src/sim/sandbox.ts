/**
 * The plan-check sandbox: the three robots loose in the Palazzo, driven by the
 * real `stepBot` against the digitised walls. No story, no jobs — it exists so a
 * human can walk the building at robot scale and say "this wall is in the wrong
 * place" before anything is built on it.
 *
 * A thin view over `world.ts`: every robot moves on its own floor; the sandbox
 * shows one floor at a time and follows the active robot when it changes floor.
 *
 * Headless, like everything in `src/sim`; `src/plan` only draws it.
 */

import { createWorld, type FloorId, type World } from './world';
import type { Bot, RobotKind, Wall } from './types';
import { FLOORS, type FloorPlan } from './venue';

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

export function createSandbox(floorId: FloorId = 'ground'): Sandbox {
  let world: World = createWorld(floorId);

  const sb: Sandbox = {
    floor: FLOORS[floorId],
    walls: [],
    bots: [],
    active: 'voxxy',
    on: world.on,
    folding: world.folding,
    setStick(ix, iy) {
      for (const b of world.bots) {
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
      world = createWorld(id);
      sb.on = world.on;
      sb.folding = world.folding;
      view(id);
    },
    toggleFolding(id) {
      world.toggleFolding(id);
      sb.walls = world.walls(sb.floor.id);
    },
    update(dt) {
      world.update(dt, (b, from, to) => {
        if (b.kind === sb.active) view(to);
        else if (from === sb.floor.id || to === sb.floor.id) view(sb.floor.id);
      });
    },
  };

  /** Show floor `id`: its walls and the robots standing on it. */
  function view(id: FloorId): void {
    sb.floor = FLOORS[id];
    sb.walls = world.walls(id);
    sb.bots = world.bots.filter((b) => sb.on[b.kind] === id);
  }

  sb.setFloor(floorId);
  return sb;
}
