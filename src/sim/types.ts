/**
 * After Dark — shared simulation types.
 *
 * `src/sim` is the only source of truth for game state. `src/render` may READ these
 * structures and must never mutate them or contain game logic. See CLAUDE.md.
 *
 * All sim coordinates are *map pixels* on the 1900x700 prototype canvas
 * (`reference/poc/10-after-dark-kinepolis.html`), +x right, +y down.
 * The renderer converts to metres with `PX_PER_M` from `./units`.
 */

export type RobotKind = 'voxxy' | 'droid' | 'biggy';

export interface Vec2 {
  x: number;
  y: number;
}

/** An axis-aligned rectangle in sim pixels. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A piece of floor that stands above its storey's datum — something a robot walks
 * ON rather than into.
 *
 * The raised lobby, the six steps up to it, the main flight, and the door leaf
 * Biggy has just put on the floor of cinema E are all the same thing said four
 * ways. See `src/sim/surface.ts` for why this is sim state and not a number the
 * renderer works out for itself, and `riseAt` for how it is read.
 */
export interface Plate extends Rect {
  /** What it is, for readability and for the sweeps' failure messages. */
  kind?: string;
  /**
   * Height of the surface above the storey datum, metres — at the LOW edge of
   * `axis` when this plate is a ramp, and everywhere when it is not.
   */
  lo: number;
  /** ...and at the high edge. Omitted, or equal to `lo`, means a flat plate. */
  hi?: number;
  /** Which axis a ramp climbs along. Ignored by a flat plate. Default `'x'`. */
  axis?: 'x' | 'y';
  /**
   * A ramp that climbs in this many equal TREADS rather than smoothly: every
   * point stands at the height of the high edge of the tread it is on. Room 8's
   * rake is built as rows (`KEYNOTE_RAKE`), and a smooth slope under stepped
   * rows sank whatever stood mid-row up to a step deep into the tread (Michele,
   * 29 Sep: "the projectors are eaten by the pavement").
   */
  steps?: number;
  /**
   * Yaw of the footprint about its own centre, radians — for a plate that is not
   * square to the world, which is every piece of scenery that was dropped rather
   * than built. `x/y/w/h` stay the un-rotated rect.
   */
  rot?: number;
}

export type LightType = 'cone' | 'pool';

/** A robot's lamp, as defined by its species. */
export interface LampDef {
  /** RGB 0-255, additive when light polygons overlap. */
  c: [number, number, number];
  type: LightType;
  /** Half-angle in radians. Cones only. */
  ang?: number;
  range: number;
}

/** Frozen per-robot physical identity. See `constants.ts`. */
export interface RobotDef {
  name: string;
  /** Collision radius, sim px. */
  r: number;
  /** Velocity approach rate toward the input target, s^-1. */
  accel: number;
  /** Top speed, px/s. */
  max: number;
  /** Velocity decay rate with no input, s^-1. */
  drag: number;
  /**
   * Decay rate, s^-1, when this is the robot being driven and the stick is let
   * go: the robot braking itself, as opposed to `drag`, which is how far it rolls
   * when something else set it moving (a shove, the tow bar). Absent means the
   * same as `drag`. Only Biggy has one: Michele, 29 Sep, *"If he's walking and I
   * want him to stop / turn, it takes some seconds"* — and a Biggy that rolls a
   * hall's length when Voxxy shoves him is still the game.
   */
  brake?: number;
  /** Relative mass for robot-robot impulses. */
  mass: number;
  color: string;
  eye: string;
  belly?: string;
  /** Too tall for low passages; can climb onto Biggy. */
  tall?: boolean;
  light: LampDef;
}

/** Mutable per-robot state. */
export interface Bot extends RobotDef {
  kind: RobotKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Heading in radians, updated only while actually moving. */
  face: number;
  /** Gait phase accumulator, advanced by distance travelled. */
  anim: number;
  /** Input stick, -1..1 each axis, normalised in stepBot. */
  ix: number;
  iy: number;
  /** Droid riding Biggy. */
  mounted: boolean;
  /** Planted: infinite effective mass, ignores input. */
  braced: boolean;
  /** This is the robot the player is driving (set each step); see `RobotDef.brake`. */
  driven?: boolean;
  /** Transient speed cap above `max`, granted by a push; decays at 1.5 s^-1. */
  boostCap?: number;
  /**
   * Seconds of airtime left on a hop; 0 or absent on the ground.
   *
   * The sim stays 2D: nothing here has a z. What being airborne means is precisely
   * one thing — `low` walls are not there for this body — and how high it reads is
   * the renderer's business, drawn from this clock and `JUMP_RISE_M`.
   */
  air?: number;
  /**
   * Seconds before this body may show off again, counted from the start of the
   * last party trick.
   *
   * The shared rest for all three of them — Voxxy's hop, Biggy's roll and Droid's
   * stretch — since 25 Sep 2026, when the other two got a flourish of their own.
   * One field, because `E` mashed is `E` mashed whoever is holding it, and because
   * it is already zeroed in the two places a robot's history stops mattering
   * (`restoreIdentity` and `place`, `game.ts`).
   */
  hopRest?: number;
  /**
   * Seconds left on a **cosmetic** flourish: Biggy's roll or Droid's stretch.
   * 0 or absent when the robot is not performing.
   *
   * Michele asked for these with *"not needed for gameplay"* attached, and that is
   * enforced rather than trusted: nothing in the sim branches on this field except
   * the party trick itself, and no code path that reads it writes a position or a
   * velocity. Voxxy never uses it — her flourish leaves the floor, which is `air`.
   */
  flair?: number;
  /**
   * How long the running flourish was given, so `flairPhase` can normalise it.
   *
   * It is stored rather than looked up per species because the length belongs to
   * the performance that is actually running: the renderer asks "how far through",
   * and the answer must not change under it if a duration is ever retimed mid-hop.
   */
  flairDur?: number;
  /** Timestamp of the last "X pushes Biggy" toast, sim seconds. */
  pushFlash?: number;
}

/**
 * A wall slab. Walls block robots; `glass` and `low` walls do not block light,
 * so they still cast no shadow in the visibility polygons.
 */
export interface Wall extends Rect {
  /**
   * Present on a wall that is not axis-aligned (`segWall` in `./walls`): the slab
   * as an oriented box — centre, half extents along its own axes, and the cosine
   * and sine of its angle. `x, y, w, h` is then the world bounding box.
   */
  obb?: { cx: number; cy: number; hx: number; hy: number; c: number; s: number };
  /** Its `why` is flavour, not a clue: the toast is drawn grey. See `Toast.flavour`. */
  flavour?: boolean;
  /** Blocks robots, passes light (kiosk glazing). */
  glass?: boolean;
  /** Blocks robots, passes light (seat rows, tables, desks). */
  low?: boolean;
  /** Not drawn (invisible collider, e.g. the Voxxy-sized kiosk hatch). */
  hidden?: boolean;
  /**
   * An opening that stops robots but not light — the kiosk hatch is a hole a
   * Voxxy fits through, and a lamp shone at a hole lights what is behind it
   * (Michele, 27 Sep: "his light should pass also from the opening").
   */
  open?: boolean;
  /** Robots for which this wall does not exist at all. */
  skipFor?: (b: Bot) => boolean;
  /**
   * Per-robot explanation shown on bump, in that robot's voice.
   * Return null to stay silent for that robot.
   */
  why?: (b: Bot) => string | null;
  /**
   * Custom response. Return true to consume the hit (no push-out, no bounce)
   * — used by breakable doors.
   */
  onHit?: (b: Bot, hit: Hit) => boolean;
  /** Marks a staircase mouth: -1 top niche, 1 bottom niche, 0 main staircase. */
  stair?: number;
  /** Tag used by chapter code and by the renderer to pick geometry/materials. */
  kind?: string;
}

export interface Hit {
  nx: number;
  ny: number;
  pen: number;
}


/** A computed light source with its visibility polygon. */
export interface LightSource {
  x: number;
  y: number;
  face: number;
  c: [number, number, number];
  type: LightType;
  ang?: number;
  range: number;
  /** Which robot's lamp this is (primary or its mirror bounce). */
  owner: RobotKind;
  /** False for mirror reflections. */
  primary: boolean;
  poly: Vec2[];
  /** Pool lights cover the full circle. */
  full?: boolean;
  /**
   * True for the short spill around a robot's own feet (`SKIRT_RANGE`).
   *
   * A label, not a rule: the skirt's polygon, range and ray count are exactly
   * what they were, so `clueLitBy` and `clueLit` cannot tell it from any other
   * pool and the puzzle is untouched. It exists because the RENDERER has to draw
   * a light that is emitted at the robot's own feet differently from one that is
   * thrown across a room — see `writeLightMesh` in `src/render/lighting.ts`.
   */
  skirt?: boolean;
}

/** The cinema screen: a horizontal mirror segment that re-emits light. */
export interface Mirror {
  x0: number;
  x1: number;
  y: number;
  /** Which way the reflective face points: -1 up, 1 down. */
  ny: -1 | 1;
}

/** A light-mix enigma: a point that must sit inside all of `need` at once. */
export interface Clue {
  x: number;
  y: number;
  /** Which robots' lamps must reach it simultaneously. */
  need: RobotKind[];
  /** The digit revealed, 0-9, randomised per run. */
  digit: number;
  /** Position in the four-digit code. */
  slot: number;
  found: boolean;
  label: string;
}

/** The camera rect a chapter shows, in sim px. */

/**
 * One contact the solver resolved, as telemetry for the physics view.
 *
 * Written by the three places that resolve one — the wall bounce in `stepBot`,
 * `botsCollide` and `standOff` — collected in `src/sim/contacts.ts` and published
 * on the snapshot. Nothing in the sim reads it back.
 */
export interface Contact {
  /** Where the two bodies touched, sim px — on the surface, not at either centre. */
  x: number;
  y: number;
  /** Unit normal, pointing OUT of whatever was hit and into the body that hit it. */
  nx: number;
  ny: number;
  /** Closing speed along the normal before the solve, px/s. Always >= 0. */
  rv: number;
  /**
   * The impulse the solver applied, in mass-px/s — the momentum this contact
   * actually took out of the body, which is the number the physics view draws.
   */
  j: number;
  /** What was hit. A `person` never moves; a `wall` never moves; a `bot` does. */
  kind: 'wall' | 'bot' | 'person';
  /** The robot that took the impulse, for the readout's own line. */
  who: RobotKind | string;
}

