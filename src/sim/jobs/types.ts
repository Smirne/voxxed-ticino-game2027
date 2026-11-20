/**
 * A job: one room or one floor, 2–4 minutes, its own small ending, one line on the
 * run sheet (`docs/challenges-brainstorm.md`). The game runs one job at a time and
 * owns the clock, the hints and the ending; a job only says what the world looks
 * like at the start, what counts as progress, and when it is done.
 */

import type { RobotKind } from '../types';
import type { FloorId, World } from '../world';

export interface JobCtx {
  world: World;
  /** Seconds since the job started. */
  t: number;
  /** A line in a robot's voice (or the narrator's, without `who`). */
  say(text: string, who?: RobotKind): void;
}

export interface Objective {
  text: string;
  /** Where the chevron points, if anywhere: floor and metres. */
  at?: { floor: FloorId; x: number; y: number };
}

/** Something a job puts in the building for the renderer to draw: a panel, a button. */
export interface Prop {
  id: string;
  kind: 'panel' | 'button';
  floor: FloorId;
  x: number;
  y: number;
  /** Switched on / used. */
  on: boolean;
  label: string;
}

export interface Job {
  id: string;
  title: string;
  act: 'before' | 'after';
  /** One line on the card before it starts. */
  brief: string;
  /** Put the world as the job starts (robots, folding walls, props). */
  setup(ctx: JobCtx): void;
  update?(ctx: JobCtx, dt: number): void;
  /** The act key (Space / Enter / A) pressed while driving `who`. True if it did something. */
  use?(ctx: JobCtx, who: RobotKind): boolean;
  /** What to draw: panels, buttons. */
  props?(ctx: JobCtx): Prop[];
  /** Sub-goals done so far, 0..goals. Hints wait on this going up. */
  progress(ctx: JobCtx): number;
  goals: number;
  /** What to do next, for the driven robot. */
  objective(ctx: JobCtx, active: RobotKind): Objective;
  /** Said after 30, 60 and 120 s without progress: a nudge, the robot who should act, then exactly how. */
  hints: [string, string, string];
  /** Seconds for three and for two stars. */
  par: [number, number];
  /** The gag that finishes the job for a stuck booth visitor (fail forward). */
  forward: string;
  /** The ending card's line. */
  ending: string;
}
