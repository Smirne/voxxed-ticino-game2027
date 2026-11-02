/**
 * Changing floor in the plan-check sandbox, by walking (Michele's 2D run, 2 Nov 2026: "I can't
 * pass from floor 0 to 1"). The reachability tests seed every stair, so they cannot see this.
 */
import { describe, expect, it } from 'vitest';
import { createSandbox, type Sandbox } from '../src/sim/sandbox';
import { m, px } from '../src/sim/units';
import type { RobotKind } from '../src/sim/types';

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
