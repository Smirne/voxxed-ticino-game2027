/**
 * The game, in 2D: a top-down view of the driven robot's floor, the run sheet, the
 * robots' lines, the hint and the ending card. Reads `src/sim/game.ts` and draws it;
 * no game logic here. The 3D renderer replaces the floor drawing later, not the rules.
 *
 * Keyboard-first, gamepad welcome (src/input). `?booth=1` turns on booth mode (fail
 * forward after 180 s stuck); `?start=1` skips the run sheet.
 */

import { DEFS } from '../sim/constants';
import { createGame } from '../sim/game';
import { m } from '../sim/units';
import { FLOORS, type P } from '../sim/venue';
import type { RobotKind, Wall } from '../sim/types';
import { glyph, isMoveKey, KEYS, keyStick, moveGlyph, padStick, PadEdges, type Device } from '../input/input';
import groundPng from '../../plans/ground-floor.png';
import firstPng from '../../plans/first-floor.png';

const params = new URLSearchParams(location.search);
const game = createGame({ booth: params.get('booth') === '1' });

const cv = document.getElementById('c') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;
const IMG = { ground: new Image(), first: new Image() };
IMG.ground.src = groundPng;
IMG.first.src = firstPng;
const PLAN_PX_PER_M = 20;

let dpr = 1;
function resize(): void {
  dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
}
addEventListener('resize', resize);
resize();

/* ------------------------------------------------------------------ input */

let device: Device = 'keyboard';
const held = new Set<string>();
const edges = new PadEdges();

addEventListener('keydown', (e) => {
  device = 'keyboard';
  if (isMoveKey(e.code)) {
    held.add(e.code);
    e.preventDefault();
    return;
  }
  const a = KEYS[e.code];
  if (!a) return;
  e.preventDefault();
  if (!e.repeat) game.action(a);
});
addEventListener('keyup', (e) => held.delete(e.code));
addEventListener('blur', () => held.clear());

function pollPad(): [number, number] | undefined {
  const pads = navigator.getGamepads?.() ?? [];
  for (const p of pads) {
    if (!p) continue;
    if (PadEdges.active(p)) device = 'pad';
    for (const a of edges.poll(p)) game.action(a);
    const s = padStick(p);
    if (s[0] || s[1]) return s;
  }
  return undefined;
}

/* ------------------------------------------------------------------- draw */

const COLOUR: Record<RobotKind, string> = { voxxy: '#ff7a1a', droid: '#9aa3ad', biggy: '#4f8fd6' };
const view = { x: 55, y: 32, scale: 22 };
const S = (x: number, y: number): [number, number] => [(x - view.x) * view.scale * dpr + cv.width / 2, (y - view.y) * view.scale * dpr + cv.height / 2];

function poly(pts: readonly P[], close = true): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(...S(x, y)) : ctx.moveTo(...S(x, y))));
  if (close) ctx.closePath();
}

function wall(w: Wall): void {
  ctx.fillStyle = w.kind === 'shutter' ? '#e0b44a' : w.glass ? 'rgba(120,190,255,.55)' : w.low ? '#7a6a52' : '#d9d4c7';
  if (w.obb) {
    const o = w.obb;
    poly(([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([a, b]) => [m(o.cx + a * o.hx * o.c - b * o.hy * o.s), m(o.cy + a * o.hx * o.s + b * o.hy * o.c)] as P));
    ctx.fill();
  } else {
    const [x, y] = S(m(w.x), m(w.y));
    ctx.fillRect(x, y, m(w.w) * view.scale * dpr, m(w.h) * view.scale * dpr);
  }
}

const px = (n: number): number => n * dpr;
const font = (size: number, weight = 400): string => `${weight} ${px(size)}px system-ui, sans-serif`;

function text(s: string, x: number, y: number, size: number, colour: string, align: CanvasTextAlign = 'left', weight = 400): void {
  ctx.font = font(size, weight);
  ctx.textAlign = align;
  ctx.fillStyle = colour;
  ctx.fillText(s, x, y);
}

/** Wrap a line to a width, returns the lines. */
function wrap(s: string, width: number, size: number): string[] {
  ctx.font = font(size);
  const out: string[] = [];
  let line = '';
  for (const w of s.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > width && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

function panel(x: number, y: number, w: number, h: number, alpha = 0.82): void {
  ctx.fillStyle = `rgba(14,17,22,${alpha})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, px(8));
  ctx.fill();
}

function drawFloor(): void {
  const f = FLOORS[game.floor];
  const img = IMG[f.id];
  if (img.complete) {
    ctx.globalAlpha = 0.12;
    const [x, y] = S(0, 0);
    ctx.drawImage(img, x, y, (img.width / PLAN_PX_PER_M) * view.scale * dpr, (img.height / PLAN_PX_PER_M) * view.scale * dpr);
    ctx.globalAlpha = 1;
  }
  for (const r of f.rooms) {
    poly(r.poly);
    ctx.fillStyle = r.public ? 'rgba(235,230,215,.10)' : 'rgba(0,0,0,.35)';
    ctx.fill();
  }
  for (const s of f.stairs) {
    poly(s.poly);
    ctx.fillStyle = s.kind === 'lift' ? 'rgba(220,60,60,.35)' : 'rgba(255,255,255,.08)';
    ctx.fill();
  }
  for (const w of game.world.walls(f.id)) wall(w);
  ctx.textAlign = 'center';
  for (const r of f.rooms) if (r.public) text(r.name, ...S(r.label[0], r.label[1]), 12, 'rgba(255,255,255,.35)', 'center');
}

function drawRobots(): void {
  for (const b of game.world.bots) {
    if (game.world.on[b.kind] !== game.floor) continue;
    const [x, y] = S(m(b.x), m(b.y));
    const r = m(b.r) * view.scale * dpr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = COLOUR[b.kind];
    ctx.fill();
    ctx.lineWidth = px(b.kind === game.active ? 3 : 1);
    ctx.strokeStyle = b.kind === game.active ? '#fff' : 'rgba(0,0,0,.6)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(b.face) * r * 1.5, y + Math.sin(b.face) * r * 1.5);
    ctx.stroke();
    text(DEFS[b.kind].name, x, y - r - px(6), 12, '#fff', 'center', b.kind === game.active ? 700 : 400);
  }
}

/** Panels and buttons a job put in the building; "Act" over the one in reach. */
function drawProps(): void {
  const b = game.world.bot(game.active);
  for (const p of game.props) {
    if (p.floor !== game.floor) continue;
    const [x, y] = S(p.x, p.y);
    const s = px(p.kind === 'panel' ? 16 : 11);
    ctx.fillStyle = p.on ? '#5fd17a' : '#e04a3c';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = px(1.5);
    if (p.kind === 'panel') {
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.strokeRect(x - s / 2, y - s / 2, s, s);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, s / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    text(p.label, x, y + s + px(10), 11, 'rgba(255,255,255,.8)', 'center');
    const reach = Math.hypot(m(b.x) - p.x, m(b.y) - p.y) - m(b.r) <= 0.75;
    if (reach && !p.on) {
      const [bx, by] = S(m(b.x), m(b.y));
      panel(bx + px(14), by - px(44), px(78), px(24), 0.9);
      text(`${glyph('start', device)} Act`, bx + px(53), by - px(27), 13, '#ffd65a', 'center', 700);
    }
  }
}

const dark = document.createElement('canvas');

/** No power: dark, with a little light around each robot (their own lamps). */
function drawDark(): void {
  const breakers = game.props.find((p) => p.id === 'breakers');
  if (!breakers || breakers.on) return;
  ctx.save();
  if (dark.width !== cv.width || dark.height !== cv.height) {
    dark.width = cv.width;
    dark.height = cv.height;
  }
  const d = dark.getContext('2d')!;
  d.globalCompositeOperation = 'source-over';
  d.clearRect(0, 0, dark.width, dark.height);
  d.fillStyle = 'rgba(4,6,10,.78)';
  d.fillRect(0, 0, dark.width, dark.height);
  d.globalCompositeOperation = 'destination-out';
  for (const b of game.world.bots) {
    if (game.world.on[b.kind] !== game.floor) continue;
    const [x, y] = S(m(b.x), m(b.y));
    const r = 5 * view.scale * dpr;
    const g = d.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g;
    d.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  ctx.drawImage(dark, 0, 0);
  ctx.restore();
}

/** An arrow from the driven robot toward the objective, or toward the stair if it is on the other floor. */
function drawChevron(): void {
  const at = game.objective?.at;
  if (!at || at.floor !== game.floor) return;
  const b = game.world.bot(game.active);
  const [bx, by] = S(m(b.x), m(b.y));
  const [tx, ty] = S(at.x, at.y);
  const d = Math.hypot(tx - bx, ty - by);
  if (d < px(30)) return;
  const a = Math.atan2(ty - by, tx - bx);
  const k = Math.min(d - px(10), px(70));
  const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 180);
  ctx.save();
  ctx.translate(bx + Math.cos(a) * k, by + Math.sin(a) * k);
  ctx.rotate(a);
  ctx.fillStyle = `rgba(255,214,90,${pulse})`;
  ctx.beginPath();
  ctx.moveTo(px(14), 0);
  ctx.lineTo(-px(8), -px(10));
  ctx.lineTo(-px(3), 0);
  ctx.lineTo(-px(8), px(10));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // The target itself.
  ctx.beginPath();
  ctx.arc(tx, ty, px(10) + px(4) * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,214,90,${pulse})`;
  ctx.lineWidth = px(2);
  ctx.stroke();
}

const STAR = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n);

/** The run sheet, in the site's own `git log` look (vdt27.voxxeddays.ch). */
function drawSheet(x: number, y: number, big: boolean): number {
  const size = big ? 18 : 12;
  const lh = px(size * 1.6);
  const w = px(big ? 520 : 300);
  const h = lh * (game.sheet.length + 3);
  panel(x, y, w, h);
  let yy = y + lh;
  text('$ git log --oneline voxxed/ticino', x + px(14), yy, size, '#7fd18b', 'left', 600);
  yy += lh * 0.4;
  const next = game.sheet.find((l) => l.status === 'todo');
  for (const l of game.sheet) {
    yy += lh;
    const head = game.job?.id === l.id && game.phase === 'play' ? '(HEAD) ' : l === next && game.phase === 'menu' ? '▶ ' : '';
    const colour = l.status === 'done' ? '#9fe0a8' : l.status === 'todo' ? '#ffd65a' : 'rgba(255,255,255,.4)';
    const mark = l.status === 'done' ? STAR(l.stars) : l.status === 'soon' ? 'soon' : '';
    text(`${l.act === 'before' ? '🌩' : '☀'}  ${head}${l.title}`, x + px(14), yy, size, colour);
    text(mark, x + w - px(14), yy, size, colour, 'right');
  }
  return h;
}

function drawHud(): void {
  const W = cv.width;
  const H = cv.height;
  const pad = px(14);
  // Job title, robot, floor, clock.
  if (game.job) {
    panel(pad, pad, px(360), px(64));
    text(game.job.title, pad + px(14), pad + px(26), 18, '#fff', 'left', 700);
    const t = Math.floor(game.jobTime);
    text(`${DEFS[game.active].name} · ${game.floor === 'ground' ? 'ground floor' : 'first floor'} · ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, pad + px(14), pad + px(50), 13, 'rgba(255,255,255,.75)');
  }
  // Objective and hint, top centre.
  const obj = game.objective?.text;
  if (obj) {
    const lines = [obj, ...(game.hint ? wrap(`Hint: ${game.hint}`, px(560), 14) : [])];
    const h = px(22) * lines.length + px(16);
    panel(W / 2 - px(300), pad, px(600), h);
    lines.forEach((l, i) => text(l, W / 2, pad + px(26) + i * px(22), i ? 14 : 16, i ? '#ffd65a' : '#fff', 'center', i ? 400 : 600));
  }
  // The run sheet, small, top right.
  drawSheet(W - px(300) - pad, pad, false);
  // Toasts, bottom centre.
  const toasts = game.toasts;
  let y = H - px(70);
  for (const t of [...toasts].reverse()) {
    const lines = wrap(t.text, px(620), 15);
    const h = px(22) * lines.length + px(14);
    y -= h + px(6);
    panel(W / 2 - px(330), y, px(660), h);
    if (t.who) {
      ctx.fillStyle = COLOUR[t.who];
      ctx.fillRect(W / 2 - px(330), y, px(5), h);
    }
    lines.forEach((l, i) => text(l, W / 2 - px(312), y + px(24) + i * px(22), 15, '#fff'));
  }
  // Prompts, bottom.
  const d = device;
  const prompts = `${moveGlyph(d)} move · ${glyph('start', d)} act · ${glyph('next', d)} switch robot · ${glyph('trick', d)} trick · ${glyph('mount', d)} Droid climbs Biggy · ${glyph('restart', d)} restart · ${glyph('menu', d)} run sheet`;
  text(prompts, W / 2, H - px(20), 13, 'rgba(255,255,255,.6)', 'center');
}

function drawMenu(): void {
  const W = cv.width;
  const H = cv.height;
  ctx.fillStyle = 'rgba(10,12,16,.75)';
  ctx.fillRect(0, 0, W, H);
  text('Voxxed Days Ticino · the night before', W / 2, H * 0.16, 30, '#fff', 'center', 800);
  text('A storm took the power. Federico and Tiziano are asleep. The robots have a run sheet.', W / 2, H * 0.16 + px(36), 16, 'rgba(255,255,255,.75)', 'center');
  const h = drawSheet(W / 2 - px(260), H * 0.16 + px(64), true);
  const next = game.sheet.find((l) => l.status === 'todo');
  const pulse = 0.65 + 0.35 * Math.sin(performance.now() / 300);
  text(next ? `${glyph('start', device)} to start: ${next.title}` : `${glyph('start', device)} to play again`, W / 2, H * 0.16 + px(64) + h + px(44), 22, `rgba(255,214,90,${pulse})`, 'center', 700);
}

function drawEnding(): void {
  const e = game.ending;
  if (!e) return;
  const W = cv.width;
  const H = cv.height;
  ctx.fillStyle = 'rgba(10,12,16,.6)';
  ctx.fillRect(0, 0, W, H);
  panel(W / 2 - px(320), H / 2 - px(120), px(640), px(240), 0.92);
  text(e.title, W / 2, H / 2 - px(66), 28, '#fff', 'center', 800);
  text(e.forwarded ? '—' : STAR(e.stars), W / 2, H / 2 - px(20), 34, '#ffd65a', 'center');
  wrap(e.line, px(580), 17).forEach((l, i) => text(l, W / 2, H / 2 + px(24) + i * px(24), 17, 'rgba(255,255,255,.85)', 'center'));
  text(`${Math.floor(e.seconds / 60)}:${String(e.seconds % 60).padStart(2, '0')} · ${glyph('start', device)} continue`, W / 2, H / 2 + px(96), 14, 'rgba(255,255,255,.6)', 'center');
}

/* ------------------------------------------------------------------- loop */

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const padS = pollPad();
  const keyS = keyStick(held);
  const s = padS ?? keyS;
  game.setStick(s[0], s[1]);
  for (let left = dt; left > 1e-6; left -= 1 / 60) game.update(Math.min(left, 1 / 60));
  // Follow the driven robot, smoothly.
  const b = game.world.bot(game.active);
  view.x += (m(b.x) - view.x) * Math.min(1, dt * 6);
  view.y += (m(b.y) - view.y) * Math.min(1, dt * 6);
  ctx.fillStyle = '#14171c';
  ctx.fillRect(0, 0, cv.width, cv.height);
  drawFloor();
  drawDark();
  drawProps();
  drawChevron();
  drawRobots();
  if (game.phase === 'play') drawHud();
  if (game.phase === 'menu') drawMenu();
  if (game.phase === 'ending') drawEnding();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Dev builds only: the game on window, for staging screenshots and poking at it from the console.
if (import.meta.env.DEV) (window as unknown as { game: typeof game }).game = game;

// For the talk and for testing: ?start=1 skips the run sheet and plays the next job.
if (params.get('start') === '1') game.action('start');
