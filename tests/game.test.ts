/**
 * The game skeleton: the run sheet, job 1's first cut ("everyone upstairs"), the gate
 * lines, hints and booth-mode fail forward. Driven through the same `setStick` /
 * `action` a keyboard or pad uses.
 */
import { describe, expect, it } from 'vitest';
import { createGame, FORWARD_AFTER, HINT_AFTER, type Game } from '../src/sim/game';
import { RUN_SHEET } from '../src/sim/jobs';
import { m } from '../src/sim/units';
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

describe('job 1, first cut: everyone upstairs', () => {
  /** Take robot k up the main stair, from wherever it is on the ground floor. */
  function upTheStair(g: Game, k: RobotKind): void {
    g.action(k);
    expect(driveTo(g, 60.5, 27.3, 40), `${k} reaches the foot of the main stair`).toBe(true);
    hold(g, 1, 0, 15, () => g.phase !== 'play' || (g.world.on[k] === 'first' && m(g.world.bot(k).x) > 71));
    expect(g.world.on[k], `${k} upstairs`).toBe('first');
    // Out of the way of the next one, into Atrio B; the last one up may already finish the job.
    if (g.phase === 'play') driveTo(g, k === 'voxxy' ? 74 : k === 'droid' ? 78 : 82, 28, 30, () => g.phase !== 'play');
  }

  it('is done when all three stand in Atrio B, and the ending card says so', () => {
    const g = createGame();
    g.action('start');
    expect(g.job!.progress({ world: g.world, t: 0, say: () => {} })).toBe(0);
    for (const k of ['voxxy', 'droid', 'biggy'] as RobotKind[]) upTheStair(g, k);
    expect(g.phase).toBe('ending');
    expect(g.ending?.forwarded).toBe(false);
    expect(g.ending?.stars).toBeGreaterThanOrEqual(1);
    expect(g.sheet[0]).toMatchObject({ status: 'done' });
    idle(g, 7);
    expect(g.phase).toBe('menu');
  });

  it('points the driven robot somewhere: Voxxy to the lift, the others to the stair', () => {
    const g = createGame();
    g.action('start');
    expect(g.objective?.text).toMatch(/lift/);
    g.action('biggy');
    expect(g.objective?.text).toMatch(/main stair/);
    expect(g.objective?.at?.floor).toBe('ground');
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

  it('Voxxy fits the lift and rides it up', () => {
    const g = createGame();
    g.action('start');
    g.world.place('voxxy', 'ground', 64.9, 31.87, 0);
    hold(g, 1, 0, 6, () => g.world.on.voxxy === 'first');
    expect(g.world.on.voxxy).toBe('first');
    expect(g.toasts.some((t) => t.who === 'voxxy')).toBe(false);
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
