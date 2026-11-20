/**
 * Job 1, "Lights back" — for now its second half: everyone upstairs.
 *
 * Run sheet (docs/challenges-brainstorm.md): Droid throws the breakers, Biggy shoulders
 * the seized service door, the lift wakes; then Voxxy rides the lift and Droid and Biggy
 * take the main stair, because the lift door is 0.90 m. This first cut is the second
 * half, which already teaches every gate in the building; the breakers and the service
 * door come in the next step.
 */

import { m } from '../units';
import { centroid } from '../world';
import { FLOORS, inPoly } from '../venue';
import type { RobotKind } from '../types';
import type { Job, JobCtx } from './types';

const ATRIO_B = FLOORS.first.rooms.find((r) => r.id === 'atrio-b')!;
const STAIR = FLOORS.ground.stairs.find((s) => s.id === 'stair-main')!;
const LIFT = FLOORS.ground.stairs.find((s) => s.id === 'lift-main')!;

const upstairs = (ctx: JobCtx, k: RobotKind): boolean => {
  const b = ctx.world.bot(k);
  return ctx.world.on[k] === 'first' && inPoly(m(b.x), m(b.y), ATRIO_B.poly);
};

const mouthOf = (s: typeof STAIR): { x: number; y: number } => {
  const [[ax, ay], [bx, by]] = s.mouth ?? [centroid(s.poly), centroid(s.poly)];
  return { x: (ax + bx) / 2, y: (ay + by) / 2 };
};

export const LIGHTS_BACK: Job = {
  id: 'lights-back',
  title: 'Lights back',
  act: 'before',
  brief: 'The storm took the power. First, all three of you up to Atrio B.',
  setup(ctx) {
    ctx.world.place('voxxy', 'ground', 49, 38, -Math.PI / 2);
    ctx.world.place('droid', 'ground', 51, 38, -Math.PI / 2);
    ctx.world.place('biggy', 'ground', 53.5, 38.5, -Math.PI / 2);
  },
  goals: 3,
  progress: (ctx) => (['voxxy', 'droid', 'biggy'] as RobotKind[]).filter((k) => upstairs(ctx, k)).length,
  objective(ctx, active) {
    if (upstairs(ctx, active)) return { text: 'Up. Switch robot to bring the others.' };
    if (ctx.world.on[active] === 'first') return { text: 'Into Atrio B.', at: { floor: 'first', x: ATRIO_B.label[0], y: ATRIO_B.label[1] } };
    if (active === 'voxxy') return { text: 'Up to Atrio B: the lift fits you, or the main stair.', at: { floor: 'ground', ...mouthOf(LIFT) } };
    return { text: 'Up to Atrio B by the main stair.', at: { floor: 'ground', ...mouthOf(STAIR) } };
  },
  hints: [
    'The main stair rises behind the lift, at the north end of the foyer.',
    'Droid: "Wide, honest stairs. West of the lift. Enter from the west side."',
    'Drive each robot onto the main stair from its west side, just north of the lift. Voxxy can also take the lift.',
  ],
  par: [70, 140],
  forward: 'Federico wanders in in his socks, carries everyone up one by one, and goes back to bed.',
  ending: 'Everyone upstairs. Next: find the breakers.',
};
