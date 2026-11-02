# GenAI notes — how this game is being built

Raw material for the Voxxed Days Ticino talk. One entry per session: what the agent did, what a human
decided, what was rejected and why.

## 2 Nov 2026 — seeding the repo, digitising the Palazzo

**Asked.** Michele: make a new game for Voxxed Days Ticino starting from After Dark (Devoxx 2026), same
robots, new venue, more challenges; fork or reference? Then: "put on the repo just what we need", start
in 2D to verify the floor plans, find venue pictures.

**Human decisions.**
- Reference, not fork: new repo `voxxed-ticino-game2027`; After Dark stays frozen as the reference.
- No contest: WellD is a sponsor; the game is for the booth and a talk.
- Both floors, **only what the audience can enter** (no kitchen, no restaurant).
- Same three robots, **frozen physics carried over** unchanged.
- Web photos are **links and captions, not committed**; own photos may be committed.

**What the agent did.**
- Copied only the engine: sim physics (`bot`, `lights`, `contacts`, `constants`, `units`, pruned
  `types`), the robot rigs and model sheets, and the 8 test files that do not need the old venue.
  Left out chapters, story, Kinepolis, the 3D renderer (for later), the opening music.
- Dropped the test block that parsed the Kinepolis prototype HTML for parity: the frozen values are
  still pinned directly in `tests/frozen-constants.test.ts`.
- **Engine change:** walls may be oriented boxes (`src/sim/walls.ts`), because the Palazzo is full of
  diagonals and After Dark only knew axis-aligned slabs. Axis-aligned walls take the old path.
- Found the PDFs are vector and true 1:200 (scale bar: 2 m = 28.346 pt exactly), and that the two floors
  share one registration. Wrote `tools/plans/extract.py`: world-oriented PNGs plus every vector line in
  metres. The first render came out rotated 180°; overlaying the trace on the PNG caught it.
- Two parallel agents digitised the ground and first floors (snap-to-trace) while the main agent built
  the 2D plan check (`pnpm dev`) and `tests/venue.test.ts` (areas against the plan's printed m²,
  reachability, sealed building, cross-floor ids). The two agents named the cross-floor rooms
  differently ("first-east" vs "atrio-c"); a test now pins that.
- **Bug the tests caught:** wall slabs were lengthened at both ends to close corners, which also
  narrowed every doorway by the wall thickness. A 0.9 m door became 0.6 m and even Voxxy could not
  pass. Now only joints are lengthened.
- **Bug in the test itself:** a stair too narrow for Biggy seeded his flood fill outside the building.
- Photo search failed: the environment's network policy blocks luganoconventions.com and Wikimedia.
  Michele is running a local session for it instead (prompt given in the session).

**Found in the building, for the game.** At the frozen radii a 0.9 m single door admits Voxxy only;
Droid (1.0 m) and Biggy (1.44 m) need double doors. The added stage steps (1.18 m clear) keep Biggy off
the stage. These are kept as the building's own gates, not geometry bugs.

**Open for Michele:** the calls listed in `docs/venue.md` (Sala E access, the bridge, stage steps,
seat blocks, exits).

## 2 Nov 2026 — the Voxxed layout on the venue (local session, Claude Code desktop)

**Asked.** Michele: apply the answers from the photo review to the venue, then a quick 2D run.

**Human decisions.** B1+B2 merged and B3 the only folding section closed. Room B taken from the venue
description as prescriptive: podium on the west side of B1, the south side of B2 and B3. The Sala A
balcony is closed during the conference but robots can get in. The wardrobe is tables, not a counter.
The lift core is red.

**What the agent did.** Folding walls carry `open`, and `buildWalls` defaults to the Voxxed layout.
Podiums are zones, rooms can be marked `conference: 'closed'`, and the plan view draws both. Four
tests pin the layout: only B3 shut, every section still reachable with all folds shut, each podium
inside its section, the balcony reachable. Re-checked `foyer-west` (312 m² against the printed 280)
on the drawing: the outline follows the drawn walls, so it was documented and not moved.

**Not done / assumed.** The agent opened Sala C's folds by inference from "B3 is the only closed
one". It asked, and Michele confirmed: one room. First-floor zones not traced (Michele: raw reference is fine). Podiums are
not collision yet.
