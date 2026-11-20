/**
 * The run sheet: the night's jobs in their fixed order (Michele, 11 Nov 2026: a fixed
 * order; D3 still open on how the booth uses it). A job without a definition yet is
 * listed so the run sheet shows the whole night.
 */

import { LIGHTS_BACK } from './lights-back';
import type { Job } from './types';

export interface RunSheetLine {
  id: string;
  title: string;
  act: 'before' | 'after';
  job?: Job;
}

export const RUN_SHEET: RunSheetLine[] = [
  { id: LIGHTS_BACK.id, title: LIGHTS_BACK.title, act: 'before', job: LIGHTS_BACK },
  { id: 'b3-keypad', title: 'The B3 keypad', act: 'before' },
  { id: 'set-the-room', title: 'Set the room', act: 'before' },
  { id: 'coat-rush', title: 'The coat rush', act: 'after' },
  { id: 'the-beer', title: 'The beer', act: 'after' },
  { id: 'the-keynote', title: 'The keynote', act: 'after' },
];

export type { Job, JobCtx, Objective, Prop } from './types';
