# The venue — Palazzo dei Congressi, Lugano

Source of truth: Lugano Conventions' plans in `plans/`, `PCL_PT_Planimetria_1-200.pdf` (piano
terreno, ground floor) and `PCL_P1_Planimetria_1-200.pdf` (primo piano, first floor). Both are vector
PDFs drawn at 1:200, so the game's walls are measured off the drawing's own lines, not off a raster.

## World frame and scale

- Units: **metres**. The sim converts with `px()` (`PX_PER_M = 12.5`, unchanged from After Dark).
- **+x east along the building**: Sala A (the auditorium drum) at the west end, Sala E (ground) and
  Sala C/D (first) at the east end. **+y south**: lake and Parco Ciani at the top, the main entrance
  and Piazza Indipendenza at the bottom. This is the orientation the drawings read in, and the one
  luganoconventions.com's interactive maps use.
- Origin: the drawing sheet's corner. In PDF points (sheet as displayed, portrait 1053 × 1786 pt),
  `X = (1786 − y_pt) · k`, `Y = x_pt · k`, with `k = 25.4/72 mm × 200 = 0.0705556 m/pt`.
- **Scale check:** the drawing's scale bar is drawn in 2 m blocks of 28.346 pt = 10.00 mm on paper =
  2.000 m at 1:200. Exact.
- **Registration:** the two sheets share one frame — columns, the goods lift, Sala A's drum and the
  title block coincide when overlaid (checked 2 Nov 2026). So a point on the ground floor and the
  point above it on the first floor have the same (x, y).

`tools/plans/extract.py` regenerates `plans/{ground,first}-floor.png` (20 px/m, world-oriented) and
`plans/trace-{ground,first}.json` (every vector line, in metres) from the PDFs.

## Scope

Only what the conference audience can enter (Michele, 2 Nov 2026). Kitchen, restaurant, backstage,
plant rooms, service stairs and the goods lift are walled off at their doors.

## Rooms

`src/sim/venue/ground.ts` and `first.ts`, digitised 2 Nov 2026 (vertices snapped to the PDF's own
lines within 0.35 m). `tests/venue.test.ts` checks each outline against the m² the plan prints, that
every public room is reachable from the floor's hub or a stair/lift, that the building is sealed,
and that the two floors' stairs name each other's rooms.

| Floor | Room id | Plan m² | Outline m² |
|---|---|---|---|
| ground | foyer-principale | 480 | 487 |
| ground | foyer-villa-ciani | 137 | 138 |
| ground | foyer-west | 280 | 312 (+11.5%; re-checked on the drawing 2 Nov 2026: the outline follows the drawn walls, the H. 7.00 m north wall, the steps on the east and the Sala A doors on the south. The surplus is the low corner by the WC and the steps to Sala A, which the printed figure probably leaves out. Kept as drawn) |
| ground | foyer-wardrobe | 200 | 199 (west of the column line x 74.6; the strip by the bar is `foyer-bar`) |
| ground | sala-e | 115 | 120 |
| ground | sala-a, sala-a-stage, atrio-e, corridoio-villa-ciani, foyer-bar | — | 604, 237, 67, 17, 108 |
| first | atrio-b | 199 | 204 |
| first | sala-b1 / b2 / b3 | 335 / 140 / 365 | 342 / 143 / 367 |
| first | sala-c1 / c2 / c3 | 59 / 27 / 35 | 56 / 26 / 35 |
| first | atrio-c | 54 | 57 |
| first | sala-d | 30 | 31 |
| first | sala-a-balcony | — | 438 |

Not public, walled off: restaurant, kitchen (both floors), `bridge-a` (see below), backstage, service
stairs and cores, the goods lift.

### Calls made while digitising — confirm or overrule

- **Sala E is out of scope** (Michele, 2 Nov 2026: *"leave that out, it's small and not so
  relevant"*). On site it is reached from the secondary entrance or by the east stair down from
  Atrio C; here Sala E and its atrium are `public: false` and the east lift door is shut.
- **The bridge over the main entrance (`bridge-a`, first floor)** has no drawn opening to Sala A, and
  B1's only door onto it is a 0.9 m leaf. Kept closed, not public.
- **Sala A stage steps** are not drawn on the plan; two 1.5 m flights were added at the stage front
  from the venue photo. Their clear gap is 1.18 m, so **Biggy cannot get on stage** — a gate, or move them.
- **Seat blocks** (stalls and balcony) are outlined by eye, ±0.5 m, keeping every aisle ≥ 1.0 m:
  Voxxy and Droid walk the aisles, Biggy (1.44 m) stays on the cross-aisles.
- **The hatched strip at Sala B3's east end** is part of B3's floor (the 365 m² only adds up with it),
  left walkable. Probably a platform or technical zone.
- **Exits are sealed** with glass for now (main entrance, park door, Villa Ciani link, Atrio E,
  terraces off C1, C3 and D) and recorded as `exit` doors.
- **Balcony stair directions** are inferred from the treads, not from printed arrows.
- **WC / Tel** are only arrows on the plan; no room was invented for them.

## How Voxxed Days Ticino uses it

Michele marked it on the ground plan (`plans/PCL_PT_zones-michele.pdf`, 2 Nov 2026), traced into
`GROUND.zones`:

- **Sponsor booths (red):** Atrio/Foyer principale and Foyer Villa Ciani, from the entrance hall up
  to the Villa Ciani corridor. All booths go here — WellD's included.
- **Buffet / refreshments (green):** the west foyer beside Sala A (marked "2": a booth sometimes
  stands there too) and the wardrobe foyer.
- Talks: Sala A (keynotes) and the first-floor rooms.

The first-floor zones in Michele's marked plan are a raw reference only, not traced. The rest comes from
his photo review (2 Nov 2026, `docs/venue-photos.md`):

- **Folding walls, the Voxxed layout** (`VenueWall.open`, the default of `buildWalls`): Sala B1 and
  B2 merged, **B3 the only section closed off**. Sala C is one room, its folds open (Michele confirmed,
  2 Nov 2026). Other layouts are a candidate
  for challenges: `buildWalls(floor, { foldingShut })` closes any set of them.
- **Podiums** (`FIRST.zones`, kind `podium`, not collision yet): west side of B1 (and of B1+B2
  merged), south side of B2 and of B3. Sizes are guesses, about 0.3 m high.
- **Sala A balcony:** closed to the audience during the conference (`conference: 'closed'`), but a
  robot can still get up there by its stairs.
- **Wardrobe** (`wardrobe-counter`, ground floor): no real counter. A line of tables in the west foyer
  acts as one, with coat racks and space for backpacks behind. Same line as the plan's GUARDAROBA
  counter.
- **Lift core** (3D note): the lift doors are red now; the WellD photo shows the older finish.

## What the robots' size means here

Collision diameters: Voxxy 0.76 m, Droid 1.00 m, Biggy 1.44 m. A single door leaf on these plans is
about 0.9 m: Voxxy fits, Droid and Biggy do not. Double doors fit everyone. That is not a bug to fix
in the geometry — it is the building's own gate, and the game should use it (with a line in that
robot's voice explaining why).

## Open questions

- **Floor-to-floor height.** Not on the plans. The ceiling heights printed per room (H. 2.80 m to
  H. 7.00 m) bound it. `STOREY_H_M` is still Kinepolis's 5.5 m.
- **Steps between foyers.** The ground floor has several flights of `GRADINI / STEPS` between the
  foyers; their rise is not printed. They are marked as steps, not yet as height plates.
- **The corridor to Villa Ciani**: in or out of scope? (Digitised as a stub up to the link door.)
- **Main stair top landing** north of the façade line (y 23.3–24.7) is outside the model.
