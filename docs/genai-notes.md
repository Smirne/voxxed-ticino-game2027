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

### Same day, later — Michele's answers, zones, photos

- **Decided by Michele:** Sala E out ("small and not so relevant"); the bridge over the entrance out
  (not public); Biggy-on-stage is a puzzle, not a geometry fix (ideas in `docs/ideas.md`); booth and
  buffet areas sketched on the plan, then "don't keep my sign as law, stretch it to be realistic".
- **Agent:** zones became whole rooms minus keep-clear floor, so they cannot overlap; a new `ledge`
  wall kind (blocks robots mid-hop, passes light) for the stage front, with a test that Voxxy cannot
  hop it.
- **Photos.** Michele pushed eleven of WellD's own photos straight to the public branch: full size
  (40 MB), GPS in the EXIF, recognisable attendees. With his go-ahead the agent rewrote the branch:
  1600 px, metadata stripped, faces blurred with OpenCV's YuNet detector. The first detector pass
  also "found faces" in the foyer painting and smeared walls; fixed by excluding the painting and
  filtering box size and confidence, then two missed profiles were blurred by hand after a visual
  check. Lesson for the talk: the detector is a first pass, a human-style look at every frame is the
  real check.
- A local Claude session on Michele's PC (the cloud one could not reach the sites) collected 76
  linked photos and found the venue's **Matterport** tours, whose measure tool can answer the open
  questions the plans cannot (storey height, step rises, stage height).
