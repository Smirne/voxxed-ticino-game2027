/**
 * Palazzo dei Congressi, Lugano — FIRST floor (primo piano), public areas.
 *
 * Measured off `plans/PCL_P1_Planimetria_1-200.pdf` via `plans/trace-first.json`
 * (metres, world frame — see `./types.ts`). Wall vertices are snapped to the
 * drawing's own vector vertices (within 0.35 m) except where a comment says
 * "by eye". Doors are gaps between wall polylines; 'exit' doors (to the roof
 * terraces) are listed but drawn shut — the wall runs across them.
 *
 * Open to the floor below, so not floor here: the whole area over Foyer
 * principale, Foyer Villa Ciani and the west foyer. On this floor that void is
 * bounded by the main stair's balustrade, Atrio B's west edge at the lift, and
 * the Sala A balcony lobby's rear wall.
 */

import type { FloorPlan } from './types';

export const FIRST: FloorPlan = {
  id: 'first',
  source: 'PCL_P1_Planimetria_1-200.pdf',
  walls: [
    // Atrio B north façade, over the main stair to the C1 corner
    { pts: [[62.45, 24.84], [68.08, 24.84], [70.24, 24.79], [71.00, 26.09], [89.49, 26.01]] },
    // main stair south balustrade, then Atrio B west edge to the lift
    { kind: 'rail', pts: [[62.45, 29.76], [68.40, 29.96], [68.40, 31.91]] },
    // stair foot: the flight drops west to the ground floor here
    { id: 'main-stair-foot', kind: 'rail', pts: [[62.45, 24.84], [62.45, 29.76]] },
    // main lift shaft; door on its east face
    { pts: [[68.40, 32.71], [68.40, 33.27], [66.30, 33.27], [66.30, 31.36], [68.40, 31.36]] },
    // riser by the north door
    { closed: true, pts: [[69.06, 24.88], [69.90, 24.88], [69.90, 25.73], [69.06, 25.73]] },
    // B1 west side and Sala B north wall; B1 west door (45.68-46.58) kept shut
    { pts: [[59.24, 51.35], [59.24, 36.82], [61.19, 33.43], [70.55, 33.43]] },
    { pts: [[72.55, 33.43], [76.85, 33.43]] },
    { pts: [[78.85, 33.43], [83.15, 33.43]] },
    { pts: [[85.14, 33.43], [89.45, 33.43]] },
    { pts: [[91.44, 33.43], [97.12, 33.51]] },
    // Sala B south and east walls; service doors on the east kept shut
    { pts: [[59.24, 51.35], [62.10, 56.31], [97.02, 56.31], [97.12, 33.51]] },
    { id: 'fold-b1-b2', kind: 'folding', pts: [[74.70, 33.50], [74.70, 56.23]] },
    { id: 'fold-b2-b3', kind: 'folding', pts: [[81.00, 33.50], [81.00, 56.23]] },
    // C rooms north/east, Sala D east and south; terrace exits kept shut
    { pts: [[89.49, 26.01], [92.36, 21.19], [108.55, 21.19], [109.66, 23.13], [109.58, 35.29], [105.40, 35.53]] },
    // C1 west chamfer and south wall
    { pts: [[89.49, 26.01], [90.68, 28.08], [97.12, 28.16]] },
    // band between the C rooms and Atrio C (cupboards, phone booths), 1.05 m deep
    { t: 1.05, pts: [[98.45, 27.64], [101.60, 27.64]] },
    { t: 1.05, pts: [[102.85, 27.64], [104.00, 27.64]] },
    { t: 1.05, pts: [[105.14, 27.64], [109.70, 27.64]] },
    { id: 'fold-c1-c2', kind: 'folding', pts: [[99.05, 21.18], [99.05, 27.04]] },
    { id: 'fold-c2-c3', kind: 'folding', pts: [[103.45, 21.18], [103.45, 27.04]] },
    // Atrio B | Atrio C glazing, sliding doors open between
    { kind: 'glass', pts: [[97.12, 28.16], [97.12, 29.51]] },
    { kind: 'glass', pts: [[97.12, 32.08], [97.12, 33.51]] },
    // Atrio C south: service corridor door and stair core kept shut
    { pts: [[97.12, 33.51], [97.12, 34.92], [100.10, 34.89], [100.30, 35.21], [104.14, 35.21]] },
    // East lift door shut: it serves Sala E, left out of scope (Michele, 2 Nov 2026).
    { pts: [[104.14, 35.21], [105.36, 35.21]] },
    // Sala D west wall, door 30.28-31.17
    { pts: [[105.36, 28.16], [105.36, 30.26]] },
    { pts: [[105.36, 31.17], [105.36, 35.21]] },
    // east lift car, door on its north face
    { pts: [[104.14, 35.21], [103.59, 35.42], [103.59, 37.21], [105.19, 37.21], [105.19, 35.42], [104.97, 35.21]] },
    // balcony lobby rear wall, east end and the east stair side
    { pts: [[16.58, 31.41], [34.90, 31.41], [36.85, 33.76], [39.99, 35.57]] },
    // east stair foot (drops to the ground floor) and its south side
    { id: 'balcony-stair-east-foot', kind: 'rail', pts: [[39.76, 35.66], [38.27, 38.26], [35.30, 36.64]] },
    // lobby front wall; door to the seats 20.70-21.70
    { pts: [[16.72, 33.94], [20.65, 34.11]] },
    { pts: [[21.70, 34.00], [30.81, 34.04], [32.48, 34.94]] },
    // galleria: lobby door 32.36-33.39, then back and east walls (vestibule to the bridge closed)
    { pts: [[33.40, 35.75], [34.26, 36.20], [35.00, 36.94], [40.56, 40.05], [41.52, 40.59], [43.98, 45.30], [43.34, 47.51], [44.14, 49.46], [43.40, 51.69], [40.78, 55.41], [34.02, 55.85]] },
    // lobby front wall west end
    { pts: [[16.72, 33.94], [14.49, 35.22], [13.69, 35.69]] },
    // west stair, south side
    { kind: 'rail', pts: [[13.73, 33.31], [16.96, 31.22], [16.58, 31.41]] },
    { id: 'balcony-stair-west-foot', kind: 'rail', pts: [[15.50, 28.67], [16.96, 31.22]] },
    // west stair, north side
    { pts: [[12.43, 31.05], [15.50, 28.67]] },
    // landing at the west stair head; "scala al piano regia" (control room) behind it, closed
    { pts: [[12.43, 31.05], [11.29, 31.71], [10.50, 33.26], [10.59, 34.12], [13.69, 35.69]] },
    // balcony west wall
    { pts: [[13.69, 35.69], [11.44, 37.00], [10.41, 37.84], [9.92, 39.39], [9.77, 41.94]] },
    // parapet over the stalls
    { id: 'balcony-parapet', kind: 'rail', pts: [[9.90, 42.20], [13.53, 47.49], [15.87, 45.39], [19.50, 43.37], [26.00, 42.72], [32.69, 43.38], [36.10, 45.35], [35.25, 51.00], [33.25, 53.25], [34.00, 56.00]] },
    // seat blocks as rails, outlined by eye from the seat rows (+-0.5 m)
    { id: 'seats-balcony-west', kind: 'rail', closed: true, pts: [[11.90, 40.60], [17.30, 37.45], [18.90, 42.40], [19.00, 43.62], [15.87, 45.39], [13.53, 47.49], [12.60, 46.10]] },
    { id: 'seats-balcony-centre', kind: 'rail', closed: true, pts: [[19.90, 36.45], [25.80, 35.98], [31.50, 36.40], [30.50, 41.70], [30.50, 43.13], [26.00, 42.72], [19.60, 43.31]] },
    { id: 'seats-galleria', kind: 'rail', closed: true, pts: [[33.90, 38.10], [35.00, 36.94], [40.56, 40.05], [41.60, 40.55], [43.93, 45.28], [43.34, 47.51], [43.90, 49.50], [43.40, 51.70], [41.00, 55.40], [34.00, 56.00], [33.25, 53.25], [35.25, 51.00], [36.10, 45.35], [32.85, 43.48], [32.92, 41.84]] },
    // bridge-a north wall
    { pts: [[46.94, 44.70], [59.24, 44.70]] },
    // bridge-a south wall
    { pts: [[45.89, 51.52], [59.24, 51.35], [59.24, 51.35]] },
    // bridge-a west end: Sala A envelope, no opening drawn
    { pts: [[46.94, 44.70], [45.06, 47.27], [44.45, 49.05], [45.89, 51.52]] },
  ],
  // Square posts and columns inside public rooms, from the drawing's filled shapes.
  columns: [
    { x: 62.10, y: 36.46, w: 0.58, h: 0.76 },
    { x: 62.10, y: 54.44, w: 0.40, h: 0.55 },
    { x: 68.39, y: 54.44, w: 0.41, h: 0.55 },
    { x: 68.41, y: 36.46, w: 0.55, h: 0.76 },
    { x: 74.69, y: 27.38, w: 0.41, h: 0.55 },
    { x: 74.69, y: 54.44, w: 0.41, h: 0.55 },
    { x: 74.71, y: 36.46, w: 0.55, h: 0.76 },
    { x: 81.00, y: 27.38, w: 0.40, h: 0.55 },
    { x: 81.00, y: 36.46, w: 0.55, h: 0.76 },
    { x: 81.02, y: 54.44, w: 0.40, h: 0.55 },
    { x: 87.29, y: 36.46, w: 0.55, h: 0.76 },
    { x: 87.30, y: 27.38, w: 0.40, h: 0.55 },
    { x: 87.32, y: 54.44, w: 0.39, h: 0.55 },
    { x: 93.56, y: 54.44, w: 0.62, h: 0.55 },
    { x: 93.59, y: 36.46, w: 0.55, h: 0.76 },
    { x: 93.69, y: 27.54, w: 0.63, h: 0.85 },
  ],
  doors: [
    { id: 'door-b1-1', kind: 'door', a: [70.55, 33.43], b: [72.55, 33.43] },
    { id: 'door-b2', kind: 'door', a: [76.85, 33.43], b: [78.85, 33.43] },
    { id: 'door-b3-1', kind: 'door', a: [83.15, 33.43], b: [85.14, 33.43] },
    { id: 'door-b3-2', kind: 'door', a: [89.45, 33.43], b: [91.44, 33.43] },
    { id: 'door-atrio-c', kind: 'door', a: [97.12, 29.51], b: [97.12, 32.08] },
    { id: 'door-c1', kind: 'door', a: [97.17, 27.64], b: [98.45, 27.64] },
    { id: 'door-c2', kind: 'door', a: [101.60, 27.64], b: [102.85, 27.64] },
    { id: 'door-c3', kind: 'door', a: [104.00, 27.64], b: [105.14, 27.64] },
    { id: 'door-d', kind: 'door', a: [105.36, 30.26], b: [105.36, 31.17] },
    { id: 'lift-main-door', kind: 'door', a: [68.40, 31.91], b: [68.40, 32.71] },
    { id: 'door-balcony-seats', kind: 'door', a: [20.70, 34.00], b: [21.70, 34.00] },
    { id: 'door-galleria', kind: 'door', a: [32.36, 35.01], b: [33.40, 35.75] },
    { id: 'exit-b1-west', kind: 'exit', a: [59.24, 45.68], b: [59.24, 46.57] },
    { id: 'exit-c1-north', kind: 'exit', a: [97.55, 21.12], b: [98.45, 21.12] },
    { id: 'exit-c3-north', kind: 'exit', a: [103.99, 21.12], b: [104.89, 21.12] },
    { id: 'exit-d-east', kind: 'exit', a: [109.70, 30.33], b: [109.75, 31.23] },
  ],
  rooms: [
    { id: 'atrio-b', name: 'Atrio / Foyer B', label: [76.80, 30.60], public: true, area: 199, ceiling: [4.5],
      poly: [[68.08, 24.84], [70.24, 24.79], [71.00, 26.09], [89.49, 26.01], [90.68, 28.08], [97.12, 28.16], [97.12, 33.51], [68.40, 33.47], [68.40, 29.96], [68.08, 29.76]] },
    { id: 'sala-b1', name: 'Sala / Room B1', label: [66.90, 44.40], public: true, area: 335, ceiling: [4.45, 5.3, 3.15],
      poly: [[61.19, 33.43], [74.70, 33.50], [74.70, 56.23], [62.10, 56.31], [59.24, 51.35], [59.24, 36.82]] },
    { id: 'sala-b2', name: 'Sala / Room B2', label: [77.90, 44.40], public: true, area: 140, ceiling: [3.15],
      poly: [[74.70, 33.50], [81.00, 33.50], [81.00, 56.23], [74.70, 56.23]] },
    { id: 'sala-b3', name: 'Sala / Room B3', label: [86.80, 44.40], public: true, area: 365, ceiling: [4.45, 5.3, 3.15],
      poly: [[81.00, 33.50], [97.12, 33.51], [97.15, 56.27], [81.00, 56.23]] },
    { id: 'sala-c1', name: 'Sala / Room C1', label: [94.50, 23.00], public: true, area: 59, ceiling: [3.15],
      poly: [[92.36, 21.19], [99.05, 21.18], [99.05, 27.04], [97.17, 27.11], [97.12, 28.16], [90.68, 28.08], [89.49, 26.01]] },
    { id: 'sala-c2', name: 'Sala / Room C2', label: [101.20, 23.00], public: true, area: 27, ceiling: [3.15],
      poly: [[99.05, 21.18], [103.45, 21.18], [103.45, 27.04], [99.05, 27.04]] },
    { id: 'sala-c3', name: 'Sala / Room C3', label: [106.30, 23.00], public: true, area: 35, ceiling: [3.15],
      poly: [[103.45, 21.18], [108.55, 21.19], [109.66, 23.13], [109.66, 27.11], [103.45, 27.04]] },
    { id: 'atrio-c', name: 'Atrio / Foyer C', label: [101.20, 30.60], public: true, area: 54, ceiling: [3.15],
      poly: [[97.12, 28.16], [105.36, 28.16], [105.36, 35.21], [100.10, 35.31], [100.10, 34.89], [97.12, 34.92]] },
    { id: 'sala-d', name: 'Sala / Room D', label: [107.50, 30.60], public: true, area: 30, ceiling: [3.15],
      poly: [[105.36, 28.16], [109.66, 28.16], [109.70, 35.37], [105.40, 35.37]] },
    { id: 'sala-a-balcony', name: 'Sala A — Balconata / Balcony and Galleria', label: [26.00, 32.60], public: true,
      poly: [[16.58, 31.41], [34.90, 31.41], [36.77, 33.85], [35.30, 36.64], [40.56, 40.05], [41.52, 40.59], [43.98, 45.30], [43.34, 47.51], [43.90, 49.50], [43.40, 51.69], [41.00, 55.40], [34.00, 56.00], [33.25, 53.25], [35.25, 51.00], [36.10, 45.35], [32.69, 43.38], [26.00, 42.66], [19.50, 43.37], [15.83, 45.35], [13.53, 47.49], [9.90, 42.20], [9.92, 39.39], [10.41, 37.84], [11.44, 37.00], [13.69, 35.69], [10.59, 34.12], [10.50, 33.26], [11.29, 31.71], [12.43, 31.05], [13.73, 33.31], [16.96, 31.22]] },
    { id: 'bridge-a', name: 'Bridge over the main entrance', label: [52.50, 48.00], public: false, ceiling: [3.15],
      poly: [[46.94, 44.70], [59.24, 44.70], [59.28, 51.60], [45.89, 51.52], [44.45, 49.05], [45.06, 47.27]] },
    { id: 'kitchen', name: 'Cucina / Kitchen', label: [103.60, 44.60], public: false,
      poly: [[97.19, 34.98], [110.55, 35.29], [113.35, 36.31], [113.25, 51.50], [100.15, 51.51], [97.19, 53.42]] },
  ],
  stairs: [
    { id: 'main-stair', kind: 'stair', from: 'foyer-principale', to: 'atrio-b', poly: [[62.45, 24.84], [68.08, 24.84], [68.08, 29.76], [62.45, 29.76]] },
    { id: 'lift-main', kind: 'lift', from: 'foyer-principale', to: 'atrio-b', poly: [[66.50, 31.56], [68.19, 31.56], [68.19, 33.06], [66.50, 33.06]] },
    { id: 'balcony-stair-east', kind: 'stair', from: 'foyer-principale', to: 'sala-a-balcony', poly: [[36.83, 33.98], [39.76, 35.66], [38.27, 38.26], [35.30, 36.64]] },
    { id: 'balcony-stair-west', kind: 'stair', from: 'foyer-west', to: 'sala-a-balcony', poly: [[12.43, 31.05], [15.50, 28.67], [16.96, 31.22], [13.73, 33.31]] },
  ],
  zones: [],
};
