/**
 * Job 1, "Lights back" (Michele, 20 Nov 2026: "Voxxy must go first and unlock the stairs").
 *
 * The storm has cut the power: the lift is dead, and the main stair is closed for the
 * night by a security shutter at its foot, released only from the first floor.
 *
 * 1. Droid throws the breakers: the panel is on the lift core, too high for the others.
 * 2. The lift wakes. Its door is 0.90 m: only Voxxy fits. She rides it up.
 * 3. Voxxy releases the shutter from the top of the stair.
 * 4. Droid and Biggy walk up. All three in Atrio B.
 *
 * Each robot does the one thing only it can. The shutter and the breaker panel are
 * invented (not on the plans; Michele: "invent it"), see docs/venue.md. Biggy's ram is
 * kept for a closed room in a later job (Michele, same day).
 */

import { BLOCKED_THROTTLE } from '../constants';
import { m, px } from '../units';
import { segWall } from '../walls';
import type { Bot, RobotKind } from '../types';
import type { World } from '../world';
import { FLOORS, inPoly } from '../venue';
import type { Job, JobCtx, Prop } from './types';

const ATRIO_B = FLOORS.first.rooms.find((r) => r.id === 'atrio-b')!;
const LIFT_GROUND = FLOORS.ground.stairs.find((s) => s.id === 'lift-main')!;

/** Stairs and lifts by id, both floors (the main stair's id differs between the two drawings). */
const LIFT = ['lift-main'];
const STAIR = ['stair-main', 'main-stair'];

/** The breaker panel: south face of the lift core, main foyer. High: Droid only. */
const PANEL = { floor: 'ground' as const, x: 67.1, y: 33.55 };
/** The shutter's release: on the wall beside the top of the main stair, Atrio B side. */
const RELEASE = { floor: 'first' as const, x: 69.6, y: 26.55 };
/** The shutter: across the foot of the main stair, a grille (passes light, stops robots). */
const SHUTTER = { x: 62.55, y0: 24.81, y1: 29.73 };
/** Where the stair is entered from on the ground floor, and the lift door. */
const STAIR_FOOT = { x: 61.6, y: 27.3 };
const LIFT_DOOR = { x: 65.2, y: 31.87 };

/** How close a robot's edge must be to a panel or button to use it, metres. */
const REACH = 0.75;

interface State {
  power: boolean;
  shutter: boolean;
  /** Game-time of the last line per topic, for throttling. */
  said: Map<string, number>;
}
const STATE = new WeakMap<World, State>();
const st = (ctx: JobCtx): State => {
  let s = STATE.get(ctx.world);
  if (!s) {
    s = { power: false, shutter: false, said: new Map() };
    STATE.set(ctx.world, s);
  }
  return s;
};

const near = (b: Bot, p: { x: number; y: number }): boolean => Math.hypot(m(b.x) - p.x, m(b.y) - p.y) - m(b.r) <= REACH;
const inB = (ctx: JobCtx, k: RobotKind): boolean => {
  const b = ctx.world.bot(k);
  return ctx.world.on[k] === 'first' && inPoly(m(b.x), m(b.y), ATRIO_B.poly);
};

function sayOnce(ctx: JobCtx, key: string, text: string, who?: RobotKind): void {
  const s = st(ctx);
  const last = s.said.get(key) ?? -Infinity;
  if (ctx.t - last < BLOCKED_THROTTLE * 2) return;
  s.said.set(key, ctx.t);
  ctx.say(text, who);
}

const SHUTTER_LINE: Record<RobotKind, string> = {
  voxxy: 'Voxxy: "Shut for the night. And the release is upstairs, of course."',
  droid: 'Droid: "A security shutter. It opens from the first floor only. Logical, and inconvenient."',
  biggy: 'Biggy: "I could go through it. I promised I wouldn\'t. Somebody open it from upstairs."',
};
const PANEL_LINE: Record<RobotKind, string> = {
  voxxy: 'Voxxy: "The breakers are up there. I am down here. Droid?"',
  droid: 'Droid: "Breakers on. Emergency power. The lift is breathing again."',
  biggy: 'Biggy: "I could reach it if I stood on Droid. He says no."',
};

export const LIGHTS_BACK: Job = {
  id: 'lights-back',
  title: 'Lights back',
  act: 'before',
  brief: 'The storm took the power. The lift is dead and the main stair is shuttered for the night. Get all three of you up to Atrio B.',
  setup(ctx) {
    STATE.delete(ctx.world);
    // A line across the main foyer, south of its round pillar (51.0, 37.9).
    ctx.world.place('voxxy', 'ground', 48.5, 40.3, -Math.PI / 2);
    ctx.world.place('droid', 'ground', 51, 40.3, -Math.PI / 2);
    ctx.world.place('biggy', 'ground', 53.5, 40.3, -Math.PI / 2);
    for (const id of [...LIFT, ...STAIR]) ctx.world.locked.add(id);
    ctx.world.extra.ground.set('shutter', [segWall(px(SHUTTER.x), px(SHUTTER.y0), px(SHUTTER.x), px(SHUTTER.y1), px(0.12), { glass: true, kind: 'shutter' })]);
  },
  use(ctx, who) {
    const s = st(ctx);
    const b = ctx.world.bot(who);
    const on = ctx.world.on[who];
    if (on === PANEL.floor && near(b, PANEL)) {
      if (s.power) return false;
      ctx.say(PANEL_LINE[who], who);
      if (who !== 'droid') return true;
      s.power = true;
      for (const id of LIFT) ctx.world.locked.delete(id);
      return true;
    }
    if (on === RELEASE.floor && near(b, RELEASE)) {
      if (s.shutter) return false;
      s.shutter = true;
      for (const id of STAIR) ctx.world.locked.delete(id);
      ctx.world.extra.ground.delete('shutter');
      ctx.say(`${who === 'voxxy' ? 'Voxxy' : who === 'droid' ? 'Droid' : 'Biggy'}: "Click. Shutter up. Come on up, you two."`, who);
      return true;
    }
    return false;
  },
  update(ctx) {
    const s = st(ctx);
    for (const b of ctx.world.bots) {
      if (ctx.world.on[b.kind] !== 'ground' || !(b.ix || b.iy)) continue;
      const x = m(b.x);
      const y = m(b.y);
      // Pushing at the shutter.
      if (!s.shutter && x < SHUTTER.x && x > SHUTTER.x - m(b.r) - 0.4 && y > SHUTTER.y0 && y < SHUTTER.y1 && b.ix > 0) {
        sayOnce(ctx, `shutter-${b.kind}`, SHUTTER_LINE[b.kind], b.kind);
      }
      // Into the dead lift.
      if (!s.power && inPoly(x, y, LIFT_GROUND.poly)) {
        sayOnce(ctx, 'lift-dead', `${b.kind === 'voxxy' ? 'Voxxy' : b.kind === 'droid' ? 'Droid' : 'Biggy'}: "No power, no lift. Somebody find the breakers."`, b.kind);
      }
    }
  },
  goals: 5,
  progress(ctx) {
    const s = st(ctx);
    return Number(s.power) + Number(s.shutter) + (['voxxy', 'droid', 'biggy'] as RobotKind[]).filter((k) => inB(ctx, k)).length;
  },
  objective(ctx, active) {
    const s = st(ctx);
    const here = ctx.world.on[active];
    if (!s.power) {
      if (active === 'droid') return { text: 'Throw the breakers: the panel on the lift core. Press Act there.', at: { ...PANEL } };
      return { text: 'No power. The breaker panel is too high for you: switch to Droid.' };
    }
    if (!s.shutter) {
      if (active !== 'voxxy') return { text: 'The stair is shuttered. Only Voxxy fits the lift: switch to her.' };
      if (here === 'ground') return { text: 'Take the lift up to the first floor.', at: { floor: 'ground', ...LIFT_DOOR } };
      return { text: 'Release the stair shutter at the top of the stairs. Press Act there.', at: { ...RELEASE } };
    }
    if (inB(ctx, active)) return { text: 'Up. Switch robot to bring the others.' };
    if (here === 'first') return { text: 'Into Atrio B.', at: { floor: 'first', x: ATRIO_B.label[0], y: ATRIO_B.label[1] } };
    return { text: 'Up the main stair to Atrio B.', at: { floor: 'ground', ...STAIR_FOOT } };
  },
  props(ctx): Prop[] {
    const s = st(ctx);
    return [
      { id: 'breakers', kind: 'panel', ...PANEL, on: s.power, label: 'Breakers' },
      { id: 'shutter-release', kind: 'button', ...RELEASE, on: s.shutter, label: 'Shutter release' },
    ];
  },
  hints: [
    'Nothing works without power. The breaker panel is on the lift core, in the main foyer.',
    'Droid: "The breakers are high. I am tall. Put me in front of the lift core and press Act."',
    'Droid at the breakers (south side of the lift, Act). Then Voxxy rides the lift up and presses Act at the shutter release at the top of the stairs. Then bring Droid and Biggy up the main stair.',
  ],
  par: [120, 200],
  forward: 'Federico wanders in in his socks, flips every switch in the building, carries everyone up one by one, and goes back to bed.',
  ending: 'Lights on, everyone upstairs. Federico and Tiziano are still asleep.',
};
