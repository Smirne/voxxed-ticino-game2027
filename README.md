# Voxxed Days Ticino — robot game (working title)

Voxxy, Droid and Biggy loose in the **Palazzo dei Congressi, Lugano**, home of Voxxed Days Ticino.
A successor to *After Dark* (Devoxx Belgium 2026 Robot Games), built for the Voxxed Days Ticino 2027
sponsor booth and a talk on building games with AI agents.

**Status: stage 1 — the venue, verified in 2D.** There is no game yet: what runs is the plan check,
the building digitised off its 1:200 plans with the three robots driveable on it at true scale.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:5173 — the plan check
pnpm test       # physics, robots, and the venue against its drawing
```

Plan check controls: arrows/WASD drive, `1` `2` `3` pick Voxxy/Droid/Biggy, `G` switches floor, drag
to pan, wheel to zoom. The slider fades the original drawing under the digitised walls; the
coordinates in the corner are the metres used in `src/sim/venue`.

## Layout

| | |
|---|---|
| `src/sim` | headless simulation, the only source of truth (from After Dark, physics frozen) |
| `src/sim/venue` | the Palazzo, both floors, in metres — see `docs/venue.md` |
| `src/plan` | the 2D plan check |
| `src/render/robots` | the three procedural robot rigs (Three.js) |
| `plans/` | Lugano Conventions' 1:200 plans, plus world-oriented renders and vector traces |
| `tools/plans/extract.py` | regenerates the renders and traces from the PDFs |

## Credits

Floor plans: © Lugano Conventions / Palazzo dei Congressi Lugano, from luganoconventions.com, used as
reference for the venue's layout. Voxxy, Droid and Biggy are the Devoxx robots. Engine from
*After Dark* by Michele Giacobazzi.

Code: MIT, see `LICENSE`.
