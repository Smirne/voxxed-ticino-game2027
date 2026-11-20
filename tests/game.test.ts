/**
 * The game skeleton: the run sheet, job 1's first cut ("everyone upstairs"), the gate
 * lines, hints and booth-mode fail forward. Driven through the same `setStick` /
 * `action` a keyboard or pad uses.
 */
import { describe, expect, it } from 'vitest';
import { createGame, FORWARD_AFTER, HINT_AFTER, type Game } from '../src/sim/game';
import { RUN_SHEET } from '../src/sim/jobs';
import { m } from '../src/sim/units';
import { circleWall } from '../src/sim/walls';
import type { RobotKind } from '../src/sim/types';
import { driveTo, hold } from './pilot';

const idle = (g: Game, secs: number): void => {
  for (let t = 0; t < secs; t += 1 / 30) g.update(1 / 30);
};

describe('the run sheet', () => {
  it('lists the six jobs in the night\'s order, three before the doors and three after', () => {
    expect(RUN_SHEET.map((l) => l.id)).toEqual(['lights-back', 'b3-keypad', 'set-the-room', 'coat-rush', 'the-beer', 'the-keynote']);
    expect(RUN_SHEET.map((l) => l.act)).toEqual(['before', 'before', 'before', 'after', 'after', 'after']);
  });

  it('starts on the menu; "start" plays the first job, with its brief said out loud', () => {
    const g = createGame();
    expect(g.phase).toBe('menu');
    expect(g.sheet.map((l) => l.status)).toEqual(['todo', 'soon', 'soon', 'soon', 'soon', 'soon']);
    g.action('start');
    expect(g.phase).toBe('play');
    expect(g.job?.id).toBe('lights-back');
    expect(g.toasts[0].text).toMatch(/Atrio B/);
  });
});

describe('job 1, Lights back: Droid powers up, Voxxy rides the lift and opens the stair', () => {
  const act = (g: Game, k: RobotKind): void => {
    g.action(k);
    g.action('start');
  };

  /** Take robot k up the (open) main stair, from wherever it is on the ground floor. */
  function upTheStair(g: Game, k: RobotKind): void {
    g.action(k);
    expect(driveTo(g, 60.5, 27.3, 40), `${k} reaches the foot of the main stair`).toBe(true);
    hold(g, 1, 0, 15, () => g.phase !== 'play' || (g.world.on[k] === 'first' && m(g.world.bot(k).x) > 71));
    expect(g.phase !== 'play' || g.world.on[k] === 'first', `${k} upstairs`).toBe(true);
    // Out of the way of the next one, into Atrio B; the last one up may already finish the job.
    if (g.phase === 'play') driveTo(g, k === 'voxxy' ? 74 : k === 'droid' ? 78 : 82, 28, 30, () => g.phase !== 'play');
  }

  it('the whole chain, played through the controls, ends the job', () => {
    const g = createGame();
    g.action('start');
    expect(g.objective?.text).toMatch(/Droid/);
    // 1. Droid to the breakers on the lift core.
    g.action('droid');
    expect(driveTo(g, 67.1, 34.3, 40), 'Droid reaches the breakers').toBe(true);
    act(g, 'droid');
    expect(g.toasts.some((t) => /Breakers on/.test(t.text))).toBe(true);
    // 2. Voxxy into the lift, up.
    g.action('voxxy');
    expect(driveTo(g, 64.9, 31.87, 40), 'Voxxy reaches the lift door').toBe(true);
    hold(g, 1, 0, 6, () => g.world.on.voxxy === 'first');
    expect(g.world.on.voxxy).toBe('first');
    // 3. The release at the top of the stairs.
    expect(driveTo(g, 69.6, 27.3, 30), 'Voxxy reaches the shutter release').toBe(true);
    act(g, 'voxxy');
    expect(g.world.locked.has('stair-main')).toBe(false);
    expect(driveTo(g, 74, 28, 30)).toBe(true);
    // 4. The other two by the stair.
    upTheStair(g, 'droid');
    upTheStair(g, 'biggy');
    expect(g.phase).toBe('ending');
    expect(g.ending?.forwarded).toBe(false);
    expect(g.sheet[0]).toMatchObject({ status: 'done' });
  });

  it('every robot starts clear of every wall', () => {
    const g = createGame();
    g.action('start');
    for (const b of g.world.bots) {
      const walls = g.world.walls(g.world.on[b.kind]);
      expect(walls.some((w) => circleWall(b, w)), b.kind).toBe(false);
    }
  });

  it('before the power, the lift is dead even for Voxxy, and says so', () => {
    const g = createGame();
    g.action('start');
    g.world.place('voxxy', 'ground', 64.9, 31.87, 0);
    hold(g, 1, 0, 4);
    expect(g.world.on.voxxy).toBe('ground');
    expect(g.toasts.some((t) => /No power, no lift/.test(t.text))).toBe(true);
  });

  it('the breakers are too high for Voxxy and Biggy: they say so, nothing switches on', () => {
    for (const k of ['voxxy', 'biggy'] as RobotKind[]) {
      const g = createGame();
      g.action('start');
      g.world.place(k, 'ground', 67.1, 33.55 + 0.1 + m(g.world.bot(k).r), -Math.PI / 2);
      act(g, k);
      expect(g.toasts.some((t) => t.who === k && /reach|up there/.test(t.text)), k).toBe(true);
      expect(g.world.locked.has('lift-main'), k).toBe(true);
    }
  });

  it('the shutter stops everyone at the foot of the stair until it is released, and they say why', () => {
    const g = createGame();
    g.action('start');
    g.action('biggy');
    g.world.place('biggy', 'ground', 60.5, 27.3, 0);
    hold(g, 1, 0, 5);
    expect(g.world.on.biggy).toBe('ground');
    expect(m(g.world.bot('biggy').x)).toBeLessThan(62.55);
    expect(g.toasts.some((t) => t.who === 'biggy' && /upstairs/.test(t.text))).toBe(true);
  });

  it('points the driven robot at what it can do next', () => {
    const g = createGame();
    g.action('start');
    expect(g.objective?.text).toMatch(/switch to Droid/);
    g.action('droid');
    expect(g.objective?.at?.floor).toBe('ground');
    expect(g.props.map((p) => p.id)).toEqual(['breakers', 'shutter-release']);
  });
});

describe('gates speak', () => {
  it('Biggy pushing into the lift says why, in his voice, and not every frame', () => {
    const g = createGame();
    g.action('start');
    g.action('biggy');
    // In front of the ground-floor lift door (west face, x 65.84, y 31.42–32.32).
    g.world.place('biggy', 'ground', 64.6, 31.87, 0);
    hold(g, 1, 0, 1.5);
    const lines = g.toasts.filter((t) => t.who === 'biggy');
    expect(lines.length).toBe(1);
    expect(lines[0].text).toMatch(/1\.44/);
    expect(g.world.on.biggy).toBe('ground');
  });
});

describe('soft failure (D8)', () => {
  it('hints escalate after 30, 60 and 120 s without progress', () => {
    const g = createGame();
    g.action('start');
    expect(g.hint).toBeUndefined();
    idle(g, HINT_AFTER[0] + 0.5);
    expect(g.hint).toBe(g.job!.hints[0]);
    idle(g, HINT_AFTER[1] - HINT_AFTER[0]);
    expect(g.hint).toBe(g.job!.hints[1]);
    idle(g, HINT_AFTER[2] - HINT_AFTER[1]);
    expect(g.hint).toBe(g.job!.hints[2]);
  });

  it('booth mode fails forward after 180 s stuck: the job ends with its gag and no stars', () => {
    const g = createGame({ booth: true });
    g.action('start');
    idle(g, FORWARD_AFTER + 1);
    expect(g.phase).toBe('ending');
    expect(g.ending).toMatchObject({ forwarded: true, stars: 0 });
    expect(g.ending?.line).toMatch(/Federico/);
  });

  it('outside booth mode nothing ends a job but finishing it', () => {
    const g = createGame();
    g.action('start');
    idle(g, FORWARD_AFTER * 2);
    expect(g.phase).toBe('play');
  });
});

describe('the mount across floors', () => {
  it('a Droid riding Biggy goes up the stair with him', () => {
    const g = createGame();
    g.action('start');
    // The stair open (job 1 done that far).
    g.world.locked.clear();
    g.world.extra.ground.clear();
    g.world.place('biggy', 'ground', 60.5, 27.3, 0);
    g.world.place('droid', 'ground', 60.5 - 0.72 - 0.5 - 0.02, 27.3, 0);
    g.action('mount');
    expect(g.world.bot('droid').mounted).toBe(true);
    g.action('biggy');
    hold(g, 1, 0, 15, () => g.world.on.biggy === 'first');
    expect(g.world.on.biggy).toBe('first');
    expect(g.world.on.droid).toBe('first');
  });
});
