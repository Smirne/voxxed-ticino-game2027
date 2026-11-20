/**
 * The venue as data: the Palazzo dei Congressi, Lugano, digitised off the 1:200
 * plans in `plans/`. See `docs/venue.md` for the frame and how it was measured.
 *
 * Everything here is in METRES in the world frame of `plans/*-floor.png` and
 * `plans/trace-*.json`: +x east along the building (Sala A at the west end, Sala E /
 * Sala D at the east end), +y south (lake and park at the top, main entrance at the
 * bottom), origin at the drawing sheet's corner. Vertices are snapped to the
 * drawing's own vector lines, so a wall here is a line in the PDF.
 *
 * `src/sim/venue/build.ts` turns this into sim walls (pixels, `PX_PER_M`); nothing
 * else should read metres as collision.
 */

export type P = readonly [number, number];

export type WallKind =
  /** Structural or partition wall: blocks robots and light. */
  | 'wall'
  /** Glazing (façade, glass doors kept shut): blocks robots, passes light. */
  | 'glass'
  /** Balustrade, handrail, the balcony's parapet: blocks robots, passes light. */
  | 'rail'
  /** Sala B's folding walls between B1, B2, B3: a wall that can be open or shut. */
  | 'folding';

export interface VenueWall {
  /** Optional name, for walls the game will talk about. */
  id?: string;
  /** The wall's centre line. Doors are gaps between polylines, not walls. */
  pts: P[];
  closed?: boolean;
  /** Thickness, metres. Default `WALL_T_M`. */
  t?: number;
  kind?: WallKind;
  /**
   * Folding walls only: stands open in the Voxxed Days layout (Michele, 2 Nov 2026:
   * B1 and B2 merged, B3 the only section closed off). Default shut.
   */
  open?: boolean;
}

/** A column. Round ones (the foyer's big round pillars) set `round`. */
export interface VenueColumn {
  x: number;
  y: number;
  /** Full width and depth for a square column, diameter for a round one. */
  w: number;
  h: number;
  round?: boolean;
}

/** A doorway: the gap between two wall ends, a to b. */
export interface VenueDoor {
  id?: string;
  a: P;
  b: P;
  /** 'door' = a leaf the drawing shows; 'opening' = no leaf; 'exit' = to outside. */
  kind: 'door' | 'opening' | 'exit';
}

export interface VenueRoom {
  id: string;
  /** As the plan labels it, e.g. "Atrio / Foyer principale", "Sala / Room B1". */
  name: string;
  /** Where the plan's label sits. */
  label: P;
  /** Floor outline, metres. Used for the area check and the 2D view. */
  poly: P[];
  /** The plan's own area figure, m², when it prints one. Tests compare the polygon to it. */
  area?: number;
  /** The plan's ceiling height(s), metres ("H. 4.50 m"). */
  ceiling?: number[];
  /** False for anything the conference audience does not enter (kitchen, restaurant, plant). */
  public: boolean;
  /**
   * 'closed': part of the building the audience could enter, but shut during Voxxed Days
   * (the Sala A balcony). Still walkable: a robot may get in.
   */
  conference?: 'closed';
}

/** Steps, stairs and lifts: where a robot changes level, or is told why it can't. */
export interface VenueStair {
  id: string;
  kind: 'stair' | 'steps' | 'lift';
  poly: P[];
  /** Room ids at the two ends (for a lift: the floors' rooms it opens on). */
  from: string;
  to: string;
  /**
   * Stairs and lifts that change floor: the edge a robot steps on from, on this floor. Coming
   * from the other floor it comes out here, facing out. Without one it comes out at the same spot.
   */
  mouth?: [P, P];
}

/**
 * An area of the floor with a use during the conference — where the sponsor booths
 * stand, where the buffet is laid out, where the speaker's podium goes. Booths and
 * buffet are hand-drawn by Michele on the plan (`plans/PCL_PT_zones-michele.pdf`);
 * podiums are placed from his description. Outlines are sketches, not walls.
 */
export interface VenueZone {
  id: string;
  kind: 'booths' | 'buffet' | 'podium';
  poly: P[];
  note?: string;
}

export interface FloorPlan {
  id: 'ground' | 'first';
  /** Which PDF in `plans/` this was measured from. */
  source: string;
  walls: VenueWall[];
  columns: VenueColumn[];
  doors: VenueDoor[];
  rooms: VenueRoom[];
  stairs: VenueStair[];
  zones: VenueZone[];
}

/** Default wall thickness: the drawing's double wall lines are ~0.3 m apart. */
export const WALL_T_M = 0.3;
