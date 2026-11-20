/**
 * Keyboard and gamepad, mapped to the same game actions (Michele, 11 Nov 2026: a gamepad
 * at the booth, but the game must be keyboard friendly — every action works on both).
 *
 * Pure functions plus one small edge detector, so the mapping is tested without a
 * browser; the page feeds it `KeyboardEvent.code`s and `navigator.getGamepads()`.
 */

import type { Action } from '../sim/game';

export type Device = 'keyboard' | 'pad';

/** Keyboard: one key per action, and a second key where a stranger might reach for one. */
export const KEYS: Record<string, Action> = {
  Space: 'start',
  Enter: 'start',
  Tab: 'next',
  KeyQ: 'prev',
  Digit1: 'voxxy',
  Digit2: 'droid',
  Digit3: 'biggy',
  KeyE: 'trick',
  KeyF: 'mount',
  KeyR: 'restart',
  Escape: 'menu',
};

const MOVE: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

/** The stick from the movement keys held down. */
export function keyStick(held: ReadonlySet<string>): [number, number] {
  let x = 0;
  let y = 0;
  for (const c of held) {
    const v = MOVE[c];
    if (v) {
      x += v[0];
      y += v[1];
    }
  }
  return [Math.sign(x), Math.sign(y)];
}

export const isMoveKey = (code: string): boolean => code in MOVE;

/** Standard-mapping gamepad buttons (W3C "standard" layout). */
export const PAD: Record<number, Action> = {
  0: 'start', // A / Cross
  2: 'trick', // X / Square
  3: 'mount', // Y / Triangle
  4: 'prev', // LB
  5: 'next', // RB
  8: 'restart', // Back / Select
  9: 'menu', // Start
};
const DPAD: Record<number, [number, number]> = { 12: [0, -1], 13: [0, 1], 14: [-1, 0], 15: [1, 0] };

/** Below this the left stick reads as centred. */
export const DEADZONE = 0.25;

export interface PadLike {
  axes: readonly number[];
  buttons: ReadonlyArray<{ pressed: boolean }>;
}

/** The stick from a pad: left stick past the dead zone, else the d-pad. */
export function padStick(p: PadLike): [number, number] {
  const x = p.axes[0] ?? 0;
  const y = p.axes[1] ?? 0;
  const l = Math.hypot(x, y);
  if (l > DEADZONE) {
    // Rescale so the dead zone's edge is zero: no jump when the stick leaves it.
    const k = Math.min(1, (l - DEADZONE) / (1 - DEADZONE)) / l;
    return [x * k, y * k];
  }
  let dx = 0;
  let dy = 0;
  for (const [i, v] of Object.entries(DPAD)) {
    if (p.buttons[Number(i)]?.pressed) {
      dx += v[0];
      dy += v[1];
    }
  }
  return [Math.sign(dx), Math.sign(dy)];
}

/** Pad buttons fire once per press: remembers last frame's state. */
export class PadEdges {
  private was = new Set<number>();
  /** Actions for buttons that went down since the last call. */
  poll(p: PadLike): Action[] {
    const out: Action[] = [];
    const now = new Set<number>();
    p.buttons.forEach((b, i) => {
      if (!b.pressed) return;
      now.add(i);
      const a = PAD[i];
      if (a && !this.was.has(i)) out.push(a);
    });
    this.was = now;
    return out;
  }
  /** Anything at all pressed or pushed: the pad is the device in use. */
  static active(p: PadLike): boolean {
    return p.buttons.some((b) => b.pressed) || Math.hypot(p.axes[0] ?? 0, p.axes[1] ?? 0) > DEADZONE;
  }
}

const KEY_LABEL: Partial<Record<Action, string>> = {
  start: 'Space',
  next: 'Tab',
  prev: 'Q',
  trick: 'E',
  mount: 'F',
  restart: 'R',
  menu: 'Esc',
};
const PAD_LABEL: Partial<Record<Action, string>> = {
  start: 'Ⓐ',
  next: 'RB',
  prev: 'LB',
  trick: 'Ⓧ',
  mount: 'Ⓨ',
  restart: 'Back',
  menu: 'Start',
};

/** What to print in a prompt for an action, on the device last touched. */
export function glyph(a: Action, d: Device): string {
  return (d === 'pad' ? PAD_LABEL[a] : KEY_LABEL[a]) ?? a;
}

/** The move prompt. */
export const moveGlyph = (d: Device): string => (d === 'pad' ? 'Left stick' : 'Arrows / WASD');
