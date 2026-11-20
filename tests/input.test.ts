/**
 * Keyboard-first, gamepad at the booth: every game action has a key and a pad button.
 */
import { describe, expect, it } from 'vitest';
import { DEADZONE, KEYS, PAD, PadEdges, glyph, keyStick, padStick, type PadLike } from '../src/input/input';
import type { Action } from '../src/sim/game';

const ALL: Action[] = ['start', 'next', 'prev', 'voxxy', 'droid', 'biggy', 'trick', 'mount', 'restart', 'menu'];
const pad = (axes: number[], pressed: number[] = []): PadLike => ({
  axes,
  buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })),
});

describe('every action works on both devices', () => {
  it('has a key for every action', () => {
    for (const a of ALL) expect(Object.values(KEYS), a).toContain(a);
  });

  it('has a pad button for every action except picking a robot by name (the pad cycles with LB/RB)', () => {
    for (const a of ALL.filter((x) => !['voxxy', 'droid', 'biggy'].includes(x))) expect(Object.values(PAD), a).toContain(a);
  });

  it('prompts name the device last touched', () => {
    expect(glyph('trick', 'keyboard')).toBe('E');
    expect(glyph('trick', 'pad')).toBe('Ⓧ');
  });
});

describe('moving', () => {
  it('arrows and WASD both move; opposite keys cancel', () => {
    expect(keyStick(new Set(['ArrowUp']))).toEqual([0, -1]);
    expect(keyStick(new Set(['KeyD', 'KeyS']))).toEqual([1, 1]);
    expect(keyStick(new Set(['ArrowLeft', 'ArrowRight']))).toEqual([0, 0]);
  });

  it('the left stick has a dead zone and no jump at its edge', () => {
    expect(padStick(pad([0.1, -0.1]))).toEqual([0, 0]);
    const [x] = padStick(pad([DEADZONE + 0.01, 0]));
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(0.05);
    expect(padStick(pad([1, 0]))[0]).toBeCloseTo(1, 6);
  });

  it('the d-pad moves when the stick is centred', () => {
    expect(padStick(pad([0, 0], [12, 15]))).toEqual([1, -1]);
  });
});

describe('pad buttons fire once per press', () => {
  it('holding A is one start, releasing and pressing again is another', () => {
    const e = new PadEdges();
    expect(e.poll(pad([0, 0], [0]))).toEqual(['start']);
    expect(e.poll(pad([0, 0], [0]))).toEqual([]);
    expect(e.poll(pad([0, 0], []))).toEqual([]);
    expect(e.poll(pad([0, 0], [0, 5]))).toEqual(['start', 'next']);
  });

  it('knows when the pad is the device in use', () => {
    expect(PadEdges.active(pad([0, 0]))).toBe(false);
    expect(PadEdges.active(pad([0.9, 0]))).toBe(true);
    expect(PadEdges.active(pad([0, 0], [3]))).toBe(true);
  });
});
