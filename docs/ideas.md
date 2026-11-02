# Game ideas — the parking lot

Ideas raised while building, not yet designed into a challenge. Each says who raised it and what in
the building or the engine it rests on. A design doc picks from here; nothing here is a commitment.

## Getting Biggy on stage (Sala A) — Michele, 2 Nov 2026

The stage front is a ~1 m ledge no robot can hop, and the speaker steps at its ends are too narrow for
Biggy (1.18 m clear, he is 1.44 m). Michele: *"for biggy it could be a puzzle"*. Ways in:

- **Build a stair.** Push pieces (flight cases, stage risers, the lectern?) against the ledge to make
  a ramp wide enough for him. Rests on: pushable bodies (`mkBody`, After Dark's crates) and plates
  for height (`src/sim/surface.ts`, not yet carried over).
- **Help from the others.** Voxxy and Droid shove or tow him up a ramp he cannot climb alone — the
  After Dark roller-door pattern (Biggy alone fails, pushed he succeeds) and the tow bar.
- **Voxxy goes over the top.** Voxxy jumps on Biggy, climbs onto the stage from his back, and drops
  the stage stair/ramp down for him. Rests on: Voxxy's hop (`JUMP_AIR`) and a mount — today only
  Droid mounts Biggy (`toggleMount`), so Voxxy-on-Biggy is a new mechanic.

Natural payoff: all three robots on the Sala A stage, the keynote room, as a finale.
