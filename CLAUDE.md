# Voxxed Days Ticino 2027 robot game — project notes for the coding agent

- **What it is.** Voxxy, Droid and Biggy loose in the Palazzo dei Congressi, Lugano, the venue of
  Voxxed Days Ticino. WellD is a sponsor: the game is shown **at the booth** (strangers playing
  cold, a few minutes each) and **in a talk** about building it with AI agents. No contest, no
  rubric, no deadline set yet. Public repo, MIT, must run from a clone.
- **Lineage.** The engine (sim, frozen physics, robot rigs, lights) comes from *After Dark*,
  Michele's Devoxx Belgium 2026 entry, `smirne/devoxx-gauntlet-m`. That repo is the **reference**,
  frozen; nothing here is a fork of it. Its chapters, story, Kinepolis venue and Devoxx gags were
  deliberately NOT copied — see `docs/lessons-from-after-dark.md` for what to carry over and what
  not to. Do not reintroduce Kinepolis geometry or Devoxx-specific jokes (Stephan, tomato soup,
  Zaal numerals) without re-thinking them for Ticino.
- **Build methodology:** `GAUNTLET.md`. Builder/critic loop, lighter than After Dark's.
- **Architecture:** `src/sim` (2D, headless, tested) is the only source of truth; renderers only
  read it. No game logic in render code, ever. `src/plan` is the 2D plan-check view (canvas);
  the 3D renderer will come from After Dark's `src/render3d` once the venue is verified.
- **Physics constants are frozen** (`src/sim/constants.ts`, asserted by
  `tests/frozen-constants.test.ts`), carried over unchanged from After Dark by Michele's decision
  of 2 Nov 2026. Changing one is a human decision, never a builder's. The table and history are in
  `GAUNTLET.md`.
- **Walls may be oriented** (`src/sim/walls.ts`): the Palazzo is not rectilinear. Axis-aligned
  walls take the original code path, so the frozen behaviour is untouched.
- **Venue: the real plans in `plans/`** — Lugano Conventions' 1:200 PDFs, ground floor (`PT`) and
  first floor (`P1`). `src/sim/venue/{ground,first}.ts` is the digitisation, in metres, world frame
  documented in `docs/venue.md`. **When a drawing in `plans/` and a `.md` disagree, the drawing
  wins** — re-measure, move the geometry, fix the prose in the same change (After Dark's rule,
  Michele, 24 Sep 2026). Scope: **only what the conference audience can enter** — no kitchen, no
  restaurant, no backstage (Michele, 2 Nov 2026).
- **Verify the venue in 2D before building 3D on it.** `pnpm dev` opens the plan check: the
  digitised walls over the drawing, robots driveable at true scale. `tests/venue.test.ts` checks
  room areas against the plan's printed m² and that every public room is reachable and the
  building sealed.
- **Robots:** Voxxy small/fast (orange beam), Droid tall/deliberate (green pool, climbs Biggy),
  Biggy heavy/inertial (blue flood). Appearance must match `robots/*.png`;
  `docs/model-sheet-targets.md` decides the numbers. *"I vote funny, robots must be
  recognizable."* Every gate says *why* a robot is blocked, in that robot's voice.
  Collision radii 0.38 / 0.50 / 0.72 m: Droid (1.0 m) does not fit a 0.9 m single door, Biggy
  (1.44 m) needs a double door — that is the building, use it.
- **Booth constraints** (new): playable in short sessions by someone who has never seen it,
  restartable at any moment, no setup, readable from a step back. Prefer a loop of short challenges
  over a long story.
- **Venue photos:** `docs/venue-photos.md`. Web photos are links and captions only — copyrighted images are not
  committed (Michele, 2 Nov 2026). WellD's own photos live in `media/welld/`.
- Tooling: pnpm, Vite, TypeScript strict, vitest, three. No physics engine, no external 3D/audio
  asset files (After Dark's one exception, its opening music, did not come over). Small PRs, one
  step each.
- After every session append to `docs/genai-notes.md` (what the agent did, what a human decided,
  what was rejected and why). No longer scored — it is raw material for the talk, so keep it honest
  and specific.
- Tests are the acceptance criteria: never weaken one to get green.
