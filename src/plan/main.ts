/**
 * The 2D plan check: the digitised Palazzo drawn over its own 1:200 drawing, with
 * the three robots driveable on it at true scale. Reads `src/sim` only — the
 * driving is `createSandbox`'s, this file draws and forwards keys.
 */

import { DEFS } from '../sim/constants';
import { createSandbox } from '../sim/sandbox';
import { m } from '../sim/units';
import { inPoly, polyArea, type FloorPlan, type P } from '../sim/venue';
import type { RobotKind, Wall } from '../sim/types';
import groundPng from '../../plans/ground-floor.png';
import firstPng from '../../plans/first-floor.png';

const PLAN_PX_PER_M = 20;
const IMG: Record<FloorPlan['id'], HTMLImageElement> = { ground: new Image(), first: new Image() };
IMG.ground.src = groundPng;
IMG.first.src = firstPng;

type Trace = { lines: number[][][] };
const traces: Partial<Record<FloorPlan['id'], Trace>> = {};
async function loadTrace(id: FloorPlan['id']): Promise<void> {
  if (traces[id]) return;
  const mod = id === 'ground' ? await import('../../plans/trace-ground.json') : await import('../../plans/trace-first.json');
  traces[id] = mod.default as Trace;
}

const sb = createSandbox('ground');
const cv = document.getElementById('c') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

// View: metres -> screen. scale = screen px per metre.
const view = { x: 60, y: 30, scale: 14 };
const toScreen = (x: number, y: number): [number, number] => [(x - view.x) * view.scale + cv.width / 2, (y - view.y) * view.scale + cv.height / 2];
const toWorld = (sx: number, sy: number): [number, number] => [(sx - cv.width / 2) / view.scale + view.x, (sy - cv.height / 2) / view.scale + view.y];

function resize(): void {
  cv.width = innerWidth * devicePixelRatio;
  cv.height = innerHeight * devicePixelRatio;
}
addEventListener('resize', resize);
resize();

/* ------------------------------------------------------------------ panel */

const KINDS: RobotKind[] = ['voxxy', 'droid', 'biggy'];
function panel(): void {
  const floors = $('floors');
  floors.innerHTML = '';
  for (const id of ['ground', 'first'] as const) {
    const b = document.createElement('button');
    b.textContent = id === 'ground' ? 'Ground floor' : 'First floor';
    b.className = sb.floor.id === id ? 'on' : '';
    b.onclick = () => setFloor(id);
    floors.appendChild(b);
  }
  const robots = $('robots');
  robots.innerHTML = '';
  KINDS.forEach((k, i) => {
    const b = document.createElement('button');
    b.textContent = `${i + 1} ${DEFS[k].name}`;
    b.className = sb.active === k ? 'on' : '';
    b.style.borderColor = DEFS[k].color;
    b.onclick = () => {
      sb.select(k);
      panel();
    };
    robots.appendChild(b);
  });
  const fold = $('folding');
  fold.innerHTML = '';
  for (const id of Object.keys(sb.folding)) {
    const b = document.createElement('button');
    b.textContent = `${id} ${sb.folding[id] ? 'shut' : 'open'}`;
    b.className = sb.folding[id] ? 'on' : '';
    b.onclick = () => {
      sb.toggleFolding(id);
      panel();
    };
    fold.appendChild(b);
  }
  const rooms = $('rooms');
  rooms.innerHTML = '';
  for (const r of sb.floor.rooms) {
    const a = polyArea(r.poly);
    const off = r.area ? (a - r.area) / r.area : 0;
    const d = document.createElement('div');
    d.innerHTML = `<span>${r.name}${r.public ? '' : ' <small>(staff)</small>'}</span><span class="${Math.abs(off) > 0.1 ? 'bad' : ''}">${a.toFixed(0)} m²${r.area ? ` / ${r.area}` : ''}</span>`;
    d.onclick = () => {
      $<HTMLInputElement>('follow').checked = false;
      [view.x, view.y] = r.label;
    };
    rooms.appendChild(d);
  }
}

function setFloor(id: FloorPlan['id']): void {
  sb.setFloor(id);
  if ($<HTMLInputElement>('trace').checked) void loadTrace(id);
  panel();
}
$('trace').addEventListener('change', () => void loadTrace(sb.floor.id));

/* ------------------------------------------------------------------ input */

const keys = new Set<string>();
addEventListener('keydown', (e) => {
  if (e.key === 'g' || e.key === 'G') return setFloor(sb.floor.id === 'ground' ? 'first' : 'ground');
  const n = Number(e.key);
  if (n >= 1 && n <= 3) {
    sb.select(KINDS[n - 1]);
    panel();
    return;
  }
  keys.add(e.key.toLowerCase());
  if (e.key.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

let drag: [number, number] | null = null;
cv.addEventListener('pointerdown', (e) => {
  drag = [e.clientX, e.clientY];
  $<HTMLInputElement>('follow').checked = false;
});
addEventListener('pointerup', () => (drag = null));
cv.addEventListener('pointermove', (e) => {
  const [wx, wy] = toWorld(e.clientX * devicePixelRatio, e.clientY * devicePixelRatio);
  const zone = sb.floor.zones.find((z) => inPoly(wx, wy, z.poly));
  $('coords').textContent = `x ${wx.toFixed(2)} m   y ${wy.toFixed(2)} m   (${sb.floor.id} floor)${zone ? '   · ' + zone.note : ''}`;
  if (!drag) return;
  view.x -= ((e.clientX - drag[0]) * devicePixelRatio) / view.scale;
  view.y -= ((e.clientY - drag[1]) * devicePixelRatio) / view.scale;
  drag = [e.clientX, e.clientY];
});
cv.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const [wx, wy] = toWorld(e.clientX * devicePixelRatio, e.clientY * devicePixelRatio);
    view.scale = Math.max(3, Math.min(200, view.scale * Math.exp(-e.deltaY * 0.0015)));
    const [sx, sy] = toScreen(wx, wy);
    view.x += (sx - e.clientX * devicePixelRatio) / view.scale;
    view.y += (sy - e.clientY * devicePixelRatio) / view.scale;
  },
  { passive: false },
);

/* ------------------------------------------------------------------- draw */

const WALL_COLOUR: Record<string, string> = { wall: '#c0262d', glass: '#1d8fd1', rail: '#e08a00', folding: '#8a3ccf', column: '#c0262d', pillar: '#c0262d' };

function path(pts: readonly P[], close: boolean): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const [sx, sy] = toScreen(x, y);
    if (i) ctx.lineTo(sx, sy);
    else ctx.moveTo(sx, sy);
  });
  if (close) ctx.closePath();
}

function drawWall(w: Wall): void {
  ctx.fillStyle = WALL_COLOUR[w.kind ?? 'wall'] ?? '#c0262d';
  ctx.globalAlpha = 0.85;
  if (w.obb) {
    const o = w.obb;
    const c: P[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [m(o.cx + a * o.hx * o.c - b * o.hy * o.s), m(o.cy + a * o.hx * o.s + b * o.hy * o.c)]);
    path(c, true);
    ctx.fill();
  } else {
    const [x, y] = toScreen(m(w.x), m(w.y));
    ctx.fillRect(x, y, m(w.w) * view.scale, m(w.h) * view.scale);
  }
  ctx.globalAlpha = 1;
}

function draw(): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, cv.width, cv.height);
  const f = sb.floor;
  // The drawing underneath.
  const img = IMG[f.id];
  const alpha = Number($<HTMLInputElement>('plan').value) / 100;
  if (img.complete && alpha > 0) {
    ctx.globalAlpha = alpha;
    const [x, y] = toScreen(0, 0);
    ctx.drawImage(img, x, y, (img.width / PLAN_PX_PER_M) * view.scale, (img.height / PLAN_PX_PER_M) * view.scale);
    ctx.globalAlpha = 1;
  }
  // Rooms.
  for (const r of f.rooms) {
    path(r.poly, true);
    ctx.fillStyle = r.public ? 'rgba(60,130,220,.10)' : 'rgba(120,120,120,.22)';
    ctx.fill();
  }
  // Conference zones (Michele's sketch): booths red, buffet green.
  for (const z of f.zones) {
    path(z.poly, true);
    ctx.fillStyle = z.kind === 'booths' ? 'rgba(220,40,40,.10)' : 'rgba(40,170,70,.12)';
    ctx.fill();
    ctx.strokeStyle = z.kind === 'booths' ? '#d22' : '#2a2';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Stairs, steps, lifts.
  for (const s of f.stairs) {
    path(s.poly, true);
    ctx.fillStyle = s.kind === 'lift' ? 'rgba(40,160,90,.35)' : 'rgba(40,160,90,.18)';
    ctx.fill();
    ctx.strokeStyle = '#289f5a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // Vector trace.
  const tr = traces[f.id];
  if (tr && $<HTMLInputElement>('trace').checked) {
    ctx.strokeStyle = 'rgba(0,0,0,.55)';
    ctx.lineWidth = 1;
    for (const l of tr.lines) {
      path(l as unknown as P[], false);
      ctx.stroke();
    }
  }
  // Collision, exactly what the robots hit.
  for (const w of sb.walls) drawWall(w);
  // Doors.
  for (const d of f.doors) {
    path([d.a, d.b], false);
    ctx.strokeStyle = d.kind === 'exit' ? '#1d8fd1' : '#289f5a';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Labels.
  ctx.font = `${Math.max(10, Math.min(16, view.scale * 0.8)) * devicePixelRatio}px system-ui`;
  ctx.textAlign = 'center';
  for (const r of f.rooms) {
    const [x, y] = toScreen(r.label[0], r.label[1]);
    ctx.fillStyle = r.public ? '#123' : '#666';
    ctx.fillText(r.name, x, y);
  }
  // Robots, at their true collision radius.
  for (const b of sb.bots) {
    const [x, y] = toScreen(m(b.x), m(b.y));
    ctx.beginPath();
    ctx.arc(x, y, m(b.r) * view.scale, 0, Math.PI * 2);
    ctx.fillStyle = DEFS[b.kind].color;
    ctx.fill();
    ctx.lineWidth = b.kind === sb.active ? 3 : 1;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(b.face) * m(b.r) * view.scale * 1.6, y + Math.sin(b.face) * m(b.r) * view.scale * 1.6);
    ctx.stroke();
  }
}

/* ------------------------------------------------------------------- loop */

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const ix = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
  const iy = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
  sb.setStick(ix, iy);
  // Fixed sub-steps at most DT_MAX each, as the sim expects.
  let left = dt;
  while (left > 1e-6) {
    const s = Math.min(left, 1 / 60);
    sb.update(s);
    left -= s;
  }
  if ($<HTMLInputElement>('follow').checked) {
    const b = sb.bots.find((q) => q.kind === sb.active)!;
    view.x = m(b.x);
    view.y = m(b.y);
  }
  draw();
  requestAnimationFrame(frame);
}

/*
 * A position you can send someone: ?floor=first&x=52&y=48&z=30 opens there,
 * follow off. Handy for "this wall is wrong" and for review screenshots.
 */
const q = new URLSearchParams(location.search);
if (q.get('floor') === 'first') sb.setFloor('first');
if (q.has('x') && q.has('y')) {
  $<HTMLInputElement>('follow').checked = false;
  view.x = Number(q.get('x'));
  view.y = Number(q.get('y'));
}
if (q.has('z')) view.scale = Number(q.get('z')) * devicePixelRatio;
if (q.has('plan')) $<HTMLInputElement>('plan').value = q.get('plan')!;

panel();
requestAnimationFrame(frame);
