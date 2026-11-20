/**
 * The game: the run sheet, one job at a time, on the shared world.
 *
 * Phases: `menu` (the run sheet, the next job highlighted) → `play` → `ending` (its own
 * small ending card) → back to `menu`. The order is fixed (Michele, 11 Nov 2026); "start"
 * always plays the first job not yet done, and the run sheet remembers what is done
 * until `reset`. Booth mode adds the soft-failure rules of D8:
 *
 * - hints escalate after 30, 60 and 120 s without progress (always on);
 * - after 180 s without progress, booth mode finishes the job with its fail-forward gag
 *   and no stars, so no visitor walks away on a failure;
 * - nothing ever ends a job except finishing it (or that gag).
 *
 * Input is device-free: the page maps keys and pads to `setStick` and `action`.
 * Headless, deterministic, tested; renderers read `snapshot()`.
 */

import { partyTrick, toggleMount } from './bot';
import { BLOCKED_THROTTLE, TOAST_MS } from './constants';
import { GATE_LINES, gateAhead } from './gates';
import { RUN_SHEET, type Job, type JobCtx, type Objective, type Prop } from './jobs';
import type { Bot, RobotKind } from './types';
import { createWorld, KINDS, type FloorId, type World } from './world';

export type Action =
  /** Start the next job (menu), skip the ending card, or act while playing (press, pull, use). */
  | 'start'
  /** Drive the next / previous robot. */
  | 'next'
  | 'prev'
  | 'voxxy'
  | 'droid'
  | 'biggy'
  /** The party trick: Voxxy hops, Droid unfolds, Biggy rolls. */
  | 'trick'
  /** Droid climbs onto Biggy, or down. */
  | 'mount'
  /** Start the current job over. */
  | 'restart'
  /** Back to the run sheet. */
  | 'menu';

export type Phase = 'menu' | 'play' | 'ending';

export interface Toast {
  text: string;
  who?: RobotKind;
  /** Game time it disappears, seconds. */
  until: number;
}

export interface SheetLine {
  id: string;
  title: string;
  act: 'before' | 'after';
  /** `soon`: on the run sheet, not playable yet. */
  status: 'todo' | 'done' | 'soon';
  stars: number;
}

export interface Ending {
  title: string;
  line: string;
  stars: number;
  /** Finished by the fail-forward gag, not by the player. */
  forwarded: boolean;
  seconds: number;
}

export interface GameOptions {
  /** Booth mode: fail forward after 180 s without progress. */
  booth?: boolean;
}

/** Seconds without progress before each hint, and before booth mode fails forward. */
export const HINT_AFTER: readonly [number, number, number] = [30, 60, 120];
export const FORWARD_AFTER = 180;
/** How long the ending card stays before the run sheet comes back. */
export const ENDING_S = 6;

export interface Game {
  readonly world: World;
  readonly phase: Phase;
  readonly active: RobotKind;
  readonly sheet: SheetLine[];
  /** The job being played, if any. */
  readonly job: Job | undefined;
  /** Seconds into the current job. */
  readonly jobTime: number;
  readonly objective: Objective | undefined;
  /** What the job puts in the building to draw. */
  readonly props: Prop[];
  /** The current hint, once one is due. */
  readonly hint: string | undefined;
  readonly ending: Ending | undefined;
  readonly toasts: Toast[];
  /** The floor on view: the driven robot's. */
  readonly floor: FloorId;
  setStick(x: number, y: number): void;
  action(a: Action): void;
  update(dt: number): void;
  /** Forget the run sheet and go back to the menu. */
  reset(): void;
}

export function createGame(opts: GameOptions = {}): Game {
  let world = createWorld('ground');
  let phase: Phase = 'menu';
  let active: RobotKind = 'voxxy';
  let job: Job | undefined;
  let t = 0;
  let jobT = 0;
  let lastProgress = 0;
  let progressAt = 0;
  let ending: Ending | undefined;
  let endingUntil = 0;
  let stick: [number, number] = [0, 0];
  let toasts: Toast[] = [];
  const lastGateLine: Record<RobotKind, number> = { voxxy: -Infinity, droid: -Infinity, biggy: -Infinity };
  const gateTurn: Record<RobotKind, number> = { voxxy: 0, droid: 0, biggy: 0 };
  let sheet: SheetLine[] = [];

  const say = (text: string, who?: RobotKind): void => {
    toasts.push({ text, who, until: t + TOAST_MS / 1000 + text.length * 0.03 });
    if (toasts.length > 4) toasts = toasts.slice(-4);
  };
  const ctx = (): JobCtx => ({ world, t: jobT, say });

  function resetSheet(): void {
    sheet = RUN_SHEET.map((l) => ({ id: l.id, title: l.title, act: l.act, status: l.job ? 'todo' : 'soon', stars: 0 }));
  }

  function start(j: Job): void {
    world = createWorld('ground');
    job = j;
    phase = 'play';
    jobT = 0;
    progressAt = 0;
    toasts = [];
    j.setup(ctx());
    lastProgress = j.progress(ctx());
    active = 'voxxy';
    say(j.brief);
  }

  function finish(forwarded: boolean): void {
    if (!job) return;
    const stars = forwarded ? 0 : jobT <= job.par[0] ? 3 : jobT <= job.par[1] ? 2 : 1;
    const line = sheet.find((l) => l.id === job!.id);
    if (line) {
      line.status = 'done';
      line.stars = Math.max(line.stars, stars);
    }
    ending = { title: job.title, line: forwarded ? job.forward : job.ending, stars, forwarded, seconds: Math.round(jobT) };
    phase = 'ending';
    endingUntil = t + ENDING_S;
    for (const b of world.bots) b.ix = b.iy = 0;
  }

  function drive(): void {
    for (const b of world.bots) {
      b.ix = b.kind === active ? stick[0] : 0;
      b.iy = b.kind === active ? stick[1] : 0;
    }
  }

  const sameFloor = (k: RobotKind): Bot[] => world.bots.filter((b) => world.on[b.kind] === world.on[k]);

  const game: Game = {
    get world() {
      return world;
    },
    get phase() {
      return phase;
    },
    get active() {
      return active;
    },
    get sheet() {
      return sheet;
    },
    get job() {
      return job;
    },
    get jobTime() {
      return jobT;
    },
    get objective() {
      return phase === 'play' && job ? job.objective(ctx(), active) : undefined;
    },
    get props() {
      return job?.props?.(ctx()) ?? [];
    },
    get hint() {
      if (phase !== 'play' || !job) return undefined;
      const idle = jobT - progressAt;
      const level = HINT_AFTER.filter((s) => idle >= s).length;
      return level ? job.hints[level - 1] : undefined;
    },
    get ending() {
      return ending;
    },
    get toasts() {
      return toasts.filter((x) => x.until > t);
    },
    get floor() {
      return world.on[active];
    },
    setStick(x, y) {
      const l = Math.hypot(x, y);
      stick = l > 1 ? [x / l, y / l] : [x, y];
    },
    action(a) {
      if (phase === 'menu') {
        if (a === 'start') {
          const next = RUN_SHEET.find((l) => l.job && sheet.find((s) => s.id === l.id)?.status === 'todo') ?? RUN_SHEET.find((l) => l.job);
          if (next?.job) start(next.job);
        }
        return;
      }
      if (phase === 'ending') {
        if (a === 'start' || a === 'menu') phase = 'menu';
        return;
      }
      // Playing.
      const i = KINDS.indexOf(active);
      if (a === 'start') job?.use?.(ctx(), active);
      else if (a === 'next') active = KINDS[(i + 1) % 3];
      else if (a === 'prev') active = KINDS[(i + 2) % 3];
      else if (a === 'voxxy' || a === 'droid' || a === 'biggy') active = a;
      else if (a === 'trick') partyTrick(sameFloor(active), world.bot(active), (s) => say(s, active));
      else if (a === 'mount') {
        if (world.on.droid !== world.on.biggy) say('Droid: "Biggy is on another floor. I am good, not magic."', 'droid');
        else toggleMount(sameFloor('droid'), (s) => say(s, 'droid'));
      } else if (a === 'restart' && job) start(job);
      else if (a === 'menu') phase = 'menu';
      drive();
    },
    update(dt) {
      t += dt;
      if (phase === 'ending') {
        if (t >= endingUntil) phase = 'menu';
        return;
      }
      if (phase !== 'play' || !job) return;
      jobT += dt;
      drive();
      world.update(dt);
      job.update?.(ctx(), dt);
      // A robot pushing into a gate it does not fit says why, at most every BLOCKED_THROTTLE s.
      const b = world.bot(active);
      const gate = gateAhead(b, world.on[active]);
      if (gate && t - lastGateLine[active] >= BLOCKED_THROTTLE) {
        const lines = GATE_LINES[active];
        say(lines[gateTurn[active]++ % lines.length](gate), active);
        lastGateLine[active] = t;
      }
      const p = job.progress(ctx());
      if (p > lastProgress) {
        lastProgress = p;
        progressAt = jobT;
      }
      if (p >= job.goals) finish(false);
      else if (opts.booth && jobT - progressAt >= FORWARD_AFTER) finish(true);
    },
    reset() {
      resetSheet();
      phase = 'menu';
      job = undefined;
      ending = undefined;
    },
  };
  resetSheet();
  return game;
}
