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

See `src/sim/venue/ground.ts` and `first.ts`; `tests/venue.test.ts` checks each room's outline
against the m² the plan prints, and that every public room is reachable from the main foyer
(ground) or Atrio B (first) while the building stays sealed.

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
- **Which rooms Voxxed Days Ticino uses**, and where the sponsor booths stand.
- **The corridor to Villa Ciani**: in or out of scope?
