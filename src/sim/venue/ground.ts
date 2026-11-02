/**
 * Ground floor (piano terreno) of the Palazzo dei Congressi, Lugano, digitised off
 * `plans/PCL_PT_Planimetria_1-200.pdf`. Metres, world frame — see `./types`.
 *
 * Public areas only. Restaurant, kitchen, bar, stage wings and the service corridors
 * are closed off at their doors; the restaurant and kitchen are listed (public: false)
 * so the 2D view can shade them. Every exit is sealed by a wall for now — the
 * `exit` doors record where the game may open one.
 *
 * Vertices are snapped to the drawing's own vector lines (`plans/trace-ground.json`).
 * Seat blocks, stair outlines and the stage steps are approximations — see the notes
 * on each.
 */

import type { FloorPlan } from './types';

export const GROUND: FloorPlan = {
  id: 'ground',
  source: 'PCL_PT_Planimetria_1-200.pdf',
  walls: [
    // North facade, west foyer to the Villa Ciani doors. Park exit 30.71-32.63 is sealed by this glass.
    { id: 'facade-north-w', pts: [[15.92, 28.23], [15.92, 22.43], [18.04, 18.77], [26.94, 18.77], [30.39, 24.74], [42.72, 24.74], [45.31, 20.23], [50.56, 20.23]], t: 0.15, kind: 'glass' },
    // North facade, Villa Ciani doors to the restaurant corner.
    { id: 'facade-north-e', pts: [[52.48, 20.23], [56.73, 20.23], [59.39, 24.68], [70.18, 24.76], [72.54, 28.68], [74.53, 28.77]], t: 0.15, kind: 'glass' },
    // Corridoio Villa Ciani, west side (exit door 17.39-19.31 kept shut).
    { pts: [[49.08, 20.15], [49.03, 16.51]] },
    // Corridoio Villa Ciani, east side (exit door 17.39-19.31 kept shut).
    { pts: [[53.87, 20.15], [53.82, 16.51]] },
    // Where the corridor carries on to Villa Ciani: sealed for now.
    { id: 'villa-ciani-link', pts: [[49.03, 16.51], [53.82, 16.51]], t: 0.15, kind: 'glass' },
    // Restaurant west wall, restaurant south wall (door at 74.6-76.1 shut), bar/kitchen side x 81 (doors shut).
    { id: 'restaurant-bar-edge', pts: [[74.53, 28.77], [74.53, 36.55], [80.99, 36.55], [80.99, 53.25]] },
    // South facade. Main entrance doors 49.86-56.42 are part of this glass until the game opens them.
    { id: 'facade-south', pts: [[80.99, 53.25], [63.55, 53.34], [60.81, 48.59], [47.59, 48.59]], t: 0.15, kind: 'glass' },
    // Outer face of the info-desk block between the main foyer and Sala A.
    { id: 'desk-block', pts: [[47.59, 48.59], [46.01, 45.89], [45.83, 42.52], [43.59, 38.69], [42.75, 37.61], [40.23, 39.64]] },
    // Cassa / cashier kiosk.
    { id: 'cassa', pts: [[58.71, 46.00], [60.91, 46.00], [60.85, 48.50], [58.71, 48.59]], closed: true },
    // Lift, ground <-> first.
    { id: 'lift-main', pts: [[65.84, 30.67], [68.14, 30.67], [68.34, 33.24], [65.84, 33.24]], closed: true },
    // Main stair, west balustrade.
    { pts: [[62.68, 24.81], [62.68, 29.73]], t: 0.15, kind: 'rail' },
    // Main stair, south and east side.
    { pts: [[63.90, 29.73], [68.01, 29.73], [68.01, 24.93]], t: 0.15, kind: 'rail' },
    // Guardaroba counter; coats behind it.
    { id: 'wardrobe-counter', pts: [[63.50, 46.98], [65.35, 50.20], [72.63, 50.20], [72.63, 53.30]], t: 0.6, kind: 'rail' },
    // West foyer, around the stair along Sala A (the side corridor below it is back of house).
    { pts: [[15.92, 28.23], [14.28, 29.10], [12.60, 29.82], [14.30, 33.02], [15.63, 32.36], [16.84, 34.61], [17.24, 36.52]] },
    // Sala A, west and back-left wall.
    { id: 'sala-a-wall-nw', pts: [[7.44, 45.81], [10.26, 41.37], [11.30, 39.85], [17.24, 36.52], [18.22, 36.54]] },
    // Sala A back wall around the booth that stands into the foyer ("740 posti").
    { id: 'sala-a-booth', pts: [[20.51, 36.32], [21.93, 36.18], [22.33, 34.24], [29.55, 34.24], [29.89, 36.27], [31.49, 36.33]] },
    // Sala A, back-right and east wall down to the proscenium.
    { id: 'sala-a-wall-e', pts: [[33.77, 36.55], [34.96, 36.86], [40.23, 39.64], [42.08, 41.55], [36.26, 50.13], [34.04, 53.78], [36.68, 57.09], [35.15, 58.64]] },
    // Sala A, west wall.
    { id: 'sala-a-wall-w', pts: [[7.44, 45.81], [7.29, 47.38], [8.39, 51.87], [9.89, 54.40], [13.01, 57.51], [16.72, 58.64]] },
    // Stage front (palco), raised.
    // Stage front: a ledge (~1 m, height not on the plan), too high for Voxxy's hop.
    // The two speaker steps at its ends are the way up — narrow enough to keep Biggy
    // off the stage, which is a puzzle, not a bug (Michele, 2 Nov 2026).
    { id: 'stage-front', pts: [[18.20, 58.64], [33.60, 58.64]], t: 0.3, kind: 'ledge' },
    // Palco / stage: proscenium wings, back wall, wings sealed (backstage stairs and goods lift beyond).
    { id: 'stage', pts: [[16.72, 58.64], [17.07, 60.03], [13.85, 60.74], [12.87, 60.96], [12.82, 65.23], [14.75, 68.58], [35.67, 68.58], [39.93, 61.18], [35.15, 58.64]] },
    // Seat block (stalls).
    { id: 'seats-centre', pts: [[20.80, 37.40], [31.30, 37.40], [31.90, 40.30], [29.40, 50.70], [28.60, 53.40], [23.80, 53.40], [22.70, 50.70], [20.30, 40.30]], closed: true, t: 0.1, kind: 'rail' },
    // Seat block (stalls).
    { id: 'seats-left', pts: [[17.60, 37.40], [18.20, 38.60], [20.40, 50.40], [20.90, 51.60], [19.80, 54.40], [16.80, 57.00], [14.60, 56.40], [10.20, 51.80], [8.60, 46.60], [8.70, 44.50], [10.90, 40.60]], closed: true, t: 0.1, kind: 'rail' },
    // Seat block (stalls).
    { id: 'seats-right', pts: [[34.60, 37.20], [39.90, 39.90], [41.40, 41.60], [36.00, 50.00], [33.80, 53.80], [35.60, 56.10], [33.90, 56.90], [31.20, 55.50], [30.40, 51.90], [30.90, 50.70], [33.80, 38.20]], closed: true, t: 0.1, kind: 'rail' },
    // Orchestra pit, covered with 70 seats.
    { id: 'seats-pit', pts: [[19.95, 55.88], [31.94, 55.88], [31.94, 58.30], [19.95, 58.30]], closed: true, t: 0.1, kind: 'rail' },
    // Atrio E: north part; exterior doors on x 109.65 shut.
    { id: 'atrio-e-n', pts: [[105.13, 32.19], [105.19, 27.61], [109.65, 27.61], [109.52, 35.26]] },
    // Atrio E: restaurant side shut; stair well to the south.
    { id: 'atrio-e-w', pts: [[105.13, 32.19], [100.20, 32.10], [100.20, 38.70], [105.19, 38.70]] },
    // Lift E.
    { id: 'lift-e', pts: [[102.96, 35.46], [104.92, 35.39], [105.13, 37.18], [102.94, 37.20]], closed: true },
    // Sala E north wall, west of its door.
    { pts: [[105.13, 35.39], [107.06, 35.39]] },
    // Sala E.
    { id: 'sala-e', pts: [[108.87, 35.48], [111.35, 35.39], [113.01, 36.33], [112.94, 50.58], [105.04, 50.80], [105.13, 35.39]] },
  ],
  columns: [
    { x: 22.84, y: 25.89, w: 1.0, h: 1.0, round: true },
    { x: 38.48, y: 30.69, w: 1.0, h: 1.0, round: true },
    { x: 51.01, y: 25.75, w: 1.1, h: 1.1, round: true },
    { x: 51.01, y: 37.92, w: 1.1, h: 1.1, round: true },
    { x: 62.03, y: 36.44, w: 0.57, h: 0.78 },
    { x: 68.34, y: 36.44, w: 0.58, h: 0.78 },
    { x: 62.03, y: 46.18, w: 0.57, h: 0.78 },
    { x: 68.34, y: 46.18, w: 0.58, h: 0.78 },
    { x: 74.64, y: 46.18, w: 0.58, h: 0.78 },
  ],
  doors: [
    { id: 'main-entrance', a: [49.86, 48.59], b: [56.42, 48.59], kind: 'exit' },
    { id: 'park-west', a: [30.71, 24.74], b: [32.63, 24.74], kind: 'exit' },
    { id: 'villa-ciani-foyer', a: [50.56, 20.23], b: [52.48, 20.23], kind: 'door' },
    { id: 'corridor-w', a: [49.16, 17.39], b: [49.16, 19.31], kind: 'exit' },
    { id: 'corridor-e', a: [53.87, 17.39], b: [53.87, 19.31], kind: 'exit' },
    { id: 'villa-ciani-link', a: [49.03, 16.51], b: [53.82, 16.51], kind: 'exit' },
    { id: 'sala-a-back-left', a: [18.22, 36.54], b: [20.51, 36.32], kind: 'door' },
    { id: 'sala-a-back-right', a: [31.49, 36.33], b: [33.77, 36.55], kind: 'door' },
    { id: 'stage-steps-left', a: [16.72, 58.64], b: [18.20, 58.64], kind: 'opening' },
    { id: 'stage-steps-right', a: [33.60, 58.64], b: [35.15, 58.64], kind: 'opening' },
    { id: 'sala-e', a: [107.06, 35.39], b: [108.87, 35.48], kind: 'door' },
    { id: 'atrio-e-out-1', a: [109.69, 29.27], b: [109.69, 30.26], kind: 'exit' },
    { id: 'atrio-e-out-2', a: [109.69, 31.26], b: [109.69, 33.05], kind: 'exit' },
    { id: 'main-stair', a: [62.68, 29.73], b: [63.90, 29.73], kind: 'opening' },
  ],
  rooms: [
    { id: 'foyer-principale', name: 'Atrio / Foyer principale', label: [51.00, 34.00], poly: [[37.43, 24.93], [42.02, 24.84], [43.14, 28.18], [55.47, 28.18], [57.54, 31.78], [62.39, 31.78], [63.03, 30.67], [63.79, 29.93], [68.01, 29.93], [68.01, 24.93], [70.18, 24.76], [72.54, 28.68], [74.53, 28.77], [74.53, 36.30], [73.11, 36.30], [71.89, 37.94], [60.82, 37.94], [59.35, 40.49], [59.28, 46.00], [58.71, 46.00], [58.71, 48.59], [47.59, 48.59], [46.01, 45.89], [45.83, 42.52], [43.59, 38.69], [42.63, 37.69], [40.68, 34.31], [39.93, 35.54], [37.43, 34.10]], area: 480, ceiling: [6.50, 4.95, 2.80], public: true },
    { id: 'foyer-villa-ciani', name: 'Atrio / Foyer Villa Ciani', label: [51.00, 22.50], poly: [[42.72, 24.74], [45.31, 20.23], [56.73, 20.23], [59.39, 24.68], [62.39, 24.81], [62.39, 29.73], [62.71, 30.59], [62.02, 31.14], [57.91, 31.14], [55.84, 27.55], [43.51, 27.55], [42.34, 25.51]], area: 137, ceiling: [5.50, 4.50], public: true },
    { id: 'corridoio-villa-ciani', name: 'Corridoio / Corridor Villa Ciani', label: [51.50, 18.00], poly: [[49.03, 16.51], [53.82, 16.51], [53.87, 20.15], [49.08, 20.15]], public: true },
    { id: 'foyer-west', name: 'Atrio / Foyer', label: [23.00, 23.00], poly: [[15.92, 22.43], [18.04, 18.77], [26.94, 18.77], [30.39, 24.74], [37.43, 24.93], [37.43, 26.44], [36.47, 26.44], [36.47, 34.40], [37.31, 35.98], [39.08, 36.99], [40.23, 39.64], [34.96, 36.86], [33.77, 36.55], [29.89, 36.27], [29.55, 34.24], [22.33, 34.24], [21.93, 36.18], [18.22, 36.54], [17.24, 36.52], [16.84, 34.61], [15.63, 32.36], [14.30, 33.02], [12.60, 29.82], [14.28, 29.10], [15.92, 28.23]], area: 280, ceiling: [7.00, 5.50, 2.45], public: true },
    { id: 'foyer-wardrobe', name: 'Atrio / Foyer (Guardaroba)', label: [69.50, 43.00], poly: [[59.99, 44.48], [59.99, 40.66], [61.19, 38.58], [72.26, 38.58], [73.53, 36.83], [74.53, 36.55], [74.55, 53.30], [63.55, 53.34], [60.81, 48.59], [60.91, 46.00], [62.98, 45.86], [62.98, 44.48]], area: 200, ceiling: [3.15], public: true },
    { id: 'foyer-bar', name: 'Foyer in front of the bar', label: [77.80, 45.00], poly: [[74.53, 36.55], [80.99, 36.55], [80.99, 53.25], [74.55, 53.30]], ceiling: [2.10], public: true },
    { id: 'sala-a', name: 'Sala A (platea)', label: [26.00, 54.60], poly: [[17.24, 36.52], [34.96, 36.86], [40.23, 39.64], [42.08, 41.55], [36.26, 50.13], [34.04, 53.78], [36.68, 57.09], [35.15, 58.64], [16.72, 58.64], [13.01, 57.51], [9.89, 54.40], [8.39, 51.87], [7.29, 47.38], [7.44, 45.81], [10.26, 41.37], [11.30, 39.85]], public: true },
    { id: 'sala-a-stage', name: 'Palco / Stage', label: [25.50, 64.00], poly: [[16.72, 58.64], [35.15, 58.64], [39.93, 61.18], [35.67, 68.58], [14.75, 68.58], [12.82, 65.23], [12.87, 60.96], [13.85, 60.74], [17.07, 60.03]], public: true },
    // Sala E and its atrium: out of scope (Michele, 2 Nov 2026: "small and not so relevant").
    // Reached on site from the secondary entrance or the east stair down from Atrio C; walled off here.
    { id: 'sala-e', name: 'Sala / Room E', label: [109.00, 43.00], poly: [[105.13, 35.39], [111.35, 35.39], [113.01, 36.33], [112.94, 50.58], [105.04, 50.80]], area: 115, public: false },
    { id: 'atrio-e', name: 'Atrio (Sala E)', label: [103.00, 33.50], poly: [[105.19, 27.61], [109.65, 27.61], [109.52, 35.26], [105.13, 35.39], [105.19, 38.70], [100.20, 38.70], [100.20, 32.10], [105.13, 32.19]], public: false },
    { id: 'restaurant', name: 'Ristorante / Restaurant', label: [88.00, 31.00], poly: [[74.53, 28.77], [89.21, 28.77], [93.59, 21.16], [108.48, 21.16], [109.60, 23.10], [109.60, 27.08], [105.13, 27.08], [105.13, 31.46], [100.03, 31.49], [100.20, 39.98], [81.07, 39.98], [80.99, 36.55], [74.53, 36.55]], public: false },
    { id: 'kitchen', name: 'Cucina / Kitchen', label: [91.00, 47.00], poly: [[84.04, 39.98], [100.20, 39.98], [100.24, 41.58], [105.04, 41.78], [104.92, 51.98], [84.04, 51.98]], public: false },
  ],
  stairs: [
    { id: 'stair-main', kind: 'stair', poly: [[62.68, 24.81], [68.01, 24.93], [68.01, 29.73], [62.68, 29.73]], from: 'foyer-principale', to: 'atrio-b' },
    { id: 'lift-main', kind: 'lift', poly: [[65.84, 30.67], [68.14, 30.67], [68.34, 33.24], [65.84, 33.24]], from: 'foyer-principale', to: 'atrio-b' },
    { id: 'steps-villa-ciani', kind: 'steps', poly: [[41.70, 25.68], [42.34, 25.51], [43.51, 27.55], [55.84, 27.55], [57.91, 31.14], [62.02, 31.14], [62.71, 30.59], [63.03, 30.67], [62.39, 31.78], [57.54, 31.78], [55.47, 28.18], [43.14, 28.18]], from: 'foyer-villa-ciani', to: 'foyer-principale' },
    { id: 'steps-west', kind: 'steps', poly: [[36.47, 26.44], [37.43, 26.44], [37.43, 34.10], [39.93, 35.54], [39.08, 36.99], [37.31, 35.98], [36.47, 34.40]], from: 'foyer-west', to: 'foyer-principale' },
    { id: 'steps-desk', kind: 'steps', poly: [[40.29, 34.91], [40.68, 34.31], [42.63, 37.69], [42.08, 38.03]], from: 'foyer-west', to: 'foyer-principale' },
    { id: 'ramp-west', kind: 'steps', poly: [[32.83, 24.93], [37.43, 24.93], [37.43, 26.44], [32.83, 26.44]], from: 'foyer-west', to: 'foyer-principale' },
    { id: 'steps-wardrobe', kind: 'steps', poly: [[59.35, 44.48], [59.35, 40.49], [60.82, 37.94], [71.89, 37.94], [73.11, 36.30], [74.53, 36.30], [74.53, 36.55], [73.53, 36.83], [72.26, 38.58], [61.19, 38.58], [59.99, 40.66], [59.99, 44.48]], from: 'foyer-principale', to: 'foyer-wardrobe' },
    { id: 'ramp-wardrobe', kind: 'steps', poly: [[59.35, 44.48], [62.98, 44.48], [62.98, 45.86], [59.35, 45.79]], from: 'foyer-principale', to: 'foyer-wardrobe' },
    { id: 'stair-balcony-west', kind: 'stair', poly: [[12.93, 30.70], [15.03, 29.40], [17.44, 31.78], [16.05, 32.94], [14.30, 33.02]], from: 'foyer-west', to: 'sala-a-balcony' },
    { id: 'stage-steps-left', kind: 'steps', poly: [[16.72, 58.10], [18.20, 58.10], [18.20, 58.64], [16.72, 58.64]], from: 'sala-a', to: 'sala-a-stage' },
    { id: 'stage-steps-right', kind: 'steps', poly: [[33.60, 58.10], [35.15, 58.10], [35.15, 58.64], [33.60, 58.64]], from: 'sala-a', to: 'sala-a-stage' },
  ],
  // Conference use. Michele's sketch (plans/PCL_PT_zones-michele.pdf, 2 Nov 2026), then his
  // call: "don't keep my sign as law, stretch it to be realistic (no overlap, red part until
  // the stairs on the left)". So zones are whole rooms minus what must stay clear.
  zones: [
    {
      id: 'booths',
      kind: 'booths',
      rooms: ['foyer-principale', 'foyer-villa-ciani'],
      note: 'Sponsor booths: Foyer principale (west to the steps by Sala A) and Foyer Villa Ciani.',
      keepClear: [
        // The low entrance hall (H 2.80 m), main doors to the foyer: the arrival flow.
        [[45.83, 42.52], [59.35, 42.52], [59.28, 48.59], [45.83, 48.59]],
        // Foot of the main stair, 2.5 m apron on its west side.
        [[60.18, 24.81], [62.68, 24.81], [62.68, 29.93], [60.18, 29.93]],
        // In front of the main lift, 1.5 m all round.
        [[64.34, 29.93], [69.84, 29.93], [69.84, 34.74], [64.34, 34.74]],
      ],
    },
    {
      id: 'buffet-west',
      kind: 'buffet',
      rooms: ['foyer-west'],
      note: 'Buffet / refreshments, the west foyer. Marked "2": a booth sometimes stands here too.',
    },
    {
      id: 'buffet-wardrobe',
      kind: 'buffet',
      rooms: ['foyer-wardrobe', 'foyer-bar'],
      note: 'Buffet / refreshments, the wardrobe foyer up to the bar.',
      keepClear: [
        // The steps' landing from the main foyer.
        [[59.99, 38.58], [63.20, 38.58], [63.20, 46.00], [59.99, 46.00]],
      ],
    },
  ],
};
