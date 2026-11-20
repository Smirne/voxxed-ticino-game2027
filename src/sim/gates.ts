/**
 * The building's own gates, and what each robot says at one.
 *
 * CLAUDE.md: *"every gate says why a robot is blocked, in that robot's voice"*, and the
 * Palazzo's gates are its doorways. A doorway (a `VenueDoor`) or the mouth of a stair or
 * lift is an opening; a robot wider than the opening cannot pass, and the frozen radii
 * make that true of real places: Droid (1.00 m) at the 0.90 m lift door and Sala D,
 * Biggy (1.44 m) at every single door and the Sala C doors.
 *
 * `gateAhead` finds the opening a driven robot is pushing into when it is too narrow
 * for it; the game throttles and speaks the line. Exits are left out: they are sealed
 * with glass, and the glass is not the reason a robot stays in.
 */

import { m } from './units';
import type { Bot, RobotKind } from './types';
import { FLOORS, type FloorPlan } from './venue';

type P = readonly [number, number];

export interface Opening {
  id: string;
  a: P;
  b: P;
  /** Clear width, metres. */
  width: number;
  /** What it is, for the line: a door, or a lift. */
  what: 'door' | 'lift' | 'stair';
}

function openingsOf(f: FloorPlan): Opening[] {
  const out: Opening[] = [];
  for (const d of f.doors) {
    if (d.kind === 'exit') continue;
    const id = d.id ?? `${d.a.join(',')}`;
    out.push({ id, a: d.a, b: d.b, width: Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]), what: id.includes('lift') ? 'lift' : 'door' });
  }
  for (const s of f.stairs) {
    if (!s.mouth || s.kind === 'steps') continue;
    // A lift door may also be listed as a door: one opening per place.
    if (out.some((o) => Math.hypot(o.a[0] - s.mouth![0][0], o.a[1] - s.mouth![0][1]) < 0.3)) continue;
    const [a, b] = s.mouth;
    out.push({ id: s.id, a, b, width: Math.hypot(b[0] - a[0], b[1] - a[1]), what: s.kind === 'lift' ? 'lift' : 'stair' });
  }
  return out;
}

export const OPENINGS: Record<FloorPlan['id'], Opening[]> = { ground: openingsOf(FLOORS.ground), first: openingsOf(FLOORS.first) };

/**
 * The opening too narrow for `b` that it is pushing into, if any: the stick points at
 * it (within ~50°), and the robot is within half a metre of its line.
 */
export function gateAhead(b: Bot, floor: FloorPlan['id']): Opening | undefined {
  const il = Math.hypot(b.ix, b.iy);
  if (il === 0) return undefined;
  const r = m(b.r);
  const x = m(b.x);
  const y = m(b.y);
  for (const o of OPENINGS[floor]) {
    if (o.width >= 2 * r) continue;
    const mx = (o.a[0] + o.b[0]) / 2;
    const my = (o.a[1] + o.b[1]) / 2;
    const d = Math.hypot(mx - x, my - y);
    if (d > r + 0.5 + o.width / 2) continue;
    const aim = ((mx - x) * b.ix + (my - y) * b.iy) / (d * il || 1);
    if (aim > 0.64) return o;
  }
  return undefined;
}

const W = (o: Opening): string => o.width.toFixed(2);

/** The line a robot says at a gate it does not fit. Several per robot, taken in turn. */
export const GATE_LINES: Record<RobotKind, Array<(o: Opening) => string>> = {
  voxxy: [(o) => `Ma dai. ${W(o)} m and even I don't fit? Somebody measured this wrong.`],
  droid: [
    (o) => (o.what === 'lift' ? `The lift door is ${W(o)} m. I am 1.00 m. I will take the stairs, like a gentleman.` : `That door is ${W(o)} m. I am 1.00 m. In Switzerland we measure first.`),
    (o) => `${W(o)} m of door, 1.00 m of Droid. The numbers do not negotiate.`,
  ],
  biggy: [
    (o) => (o.what === 'lift' ? `Lift? Me? It's ${W(o)} m, I'm 1.44. Stairs it is.` : `I'm 1.44 m wide. That door is ${W(o)}. Not happening.`),
    () => `Nope. I'd take the frame with me. Double doors, please.`,
    () => `If I go through there, the door comes too.`,
  ],
};
