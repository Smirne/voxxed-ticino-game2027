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

## 2 Nov 2026: venue photos (local session, Claude Code desktop)

**Asked.** Michele: collect reference photos of the Palazzo (interior first, rooms with no coverage),
link and caption them for a 3D artist, never commit web photos; find out what the virtual tour is.

**What the agent did.**
- The network was open in this session. Scraped the Lugano Conventions room pages (full-size
  originals behind the resized gallery copies, several 6720 px wide). Found the "virtual tour" is
  four **Matterport** models (building, Sala A, stage, Sala B), and listed their direct URLs.
- **One subagent** searched the other sources in parallel: Commons, Flickr, luganoregion, lugano.ch,
  swiss-congress, myswitzerland, and the official Voxxed Days Ticino Flickr albums (the richest
  source: Sala B and the foyers in use). Commons had **one** photo of the building (CC BY 3.0), the only
  image committed (`media/venue/`).
- Captioned 76 photos for a 3D artist after looking at each (surfaces, light temperature, signage,
  glazing, camera position). Cropping at full resolution read the room signs: dark-brown squares with
  white **serif** capitals.
- Built throwaway local review pages (gitignored) with keep/drop buttons and a questions-only page,
  so Michele could answer 9 questions instead of scanning 76 photos. Drew boxes on photos when asked
  "highlight this", and a plan crop with the traced `wardrobe-counter` line over the 1:200 drawing.
- Stepped through Lugano Convention's 24 s promo video in the browser pane (seeking the `<video>`
  element) instead of asking for screenshots.
- Created `main` (the repo only had the auto-named `claude/funny-bohr-98o502`), made it the default,
  opened PR #1.

**Mistakes, caught.**
- The subagent filed a Sala E photo as Sala D; the agent caught it from the plaster relief. The
  agent then renamed files in the doc but not on disk, so two cards showed no image; Michele noticed.
- The agent called a band of white panels in Sala B "timber slats" from a thumbnail; drawing the
  highlight box at full size showed it was wrong. Fixed in the doc.
- Room ids: the agent labelled the sunken area by the Ciani bar `foyer-west` and Michele okayed it,
  but the digitisation already uses `foyer-west` for the foyer along Sala A. Checking the answers
  against `src/sim/venue/ground.ts` caught the clash; Michele chose to keep the plan's ids.
- Michele answered the podium question with the car park as "north"; restated in the plan's frame.

**Human decisions.** Sala B ceiling is concrete; the high slats are cladding, no robot up there.
The counter under the painting is the reception (badges); the wardrobe is tables with coat racks
behind. Two stairs reach the Sala A balcony (both already in the plan). Sala D is the speakers' room.
Build the lift core red. Keep the Sala E photos. Villa Ciani foyer and corridor: not needed. Voxxed
layout: B1+B2 merged, **B3 the only closed-off section**; podium west in B1, south in B2 and B3.
The Sala A balcony is **closed to the public during the conference, but robots may get in**. Work on
`main` from now on, one PR per step. Storyline and challenges: keep After Dark's storyline, recycle
some challenges and add new ones (folding-wall layouts are a candidate); brainstorm after this phase.

**Rejected / not done.** No photo committed except the CC one; the 2026 Voxxed album says "All Rights
Reserved" on the album and CC BY-NC-ND on each photo, so treated as all rights reserved. The
"zones" Michele drew on the first-floor plan stay a raw reference for now (he offered to help trace
them properly). Merging PR #1 was left to Michele (the agent's merge was blocked as unreviewed).

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

## 3–9 Nov 2026: storyline and the first six jobs (local session, Claude Code desktop)

**Asked.** Michele: brainstorm challenges and a storyline. Keep it close to After Dark, reuse some
of its challenges and add new ones.

**What the agent did.** Read `docs/lessons-from-after-dark.md`, After Dark's README and the header
comments of its four chapter files (fetched from the reference repo). Wrote
`docs/challenges-brainstorm.md`: ten After Dark challenges moved into rooms of the Palazzo, seven new
ones from what the 2D check taught us about the building (the folding walls, the lift only Voxxy
fits, the stage steps Biggy can't climb, the closed balconies, the wardrobe tables), and a list of
decisions.

**Human decisions.**
- **Story:** night, then doors; some jobs come after the doors open.
- **Why it's dark:** a storm cuts the power.
- **People:** Federico and Tiziano, the organisers, sleep late after the speakers' dinner, and the
  robots save the day. They take the place of After Dark's Stephan.
- **The overload joke:** beer, which there always is at the end of the conference, in the wardrobe
  foyer.
- **The coat rush:** backpacks are put under the tables, not fetched.
- **Scope:** start with six jobs, three before the doors and three after; "then we'll add more".

**Rejected / parked.** The agent's three candidate loads for the overload joke (Merlot, mineral
water, panettone): Michele had a real one. The soup (the same beat as the beer). The cable run, the
balconies as a job of their own, and the lift gag: parked for after the first six.

**Flagged, not decided.** Federico and Tiziano are real people and the joke is at their expense, so
they need to agree before it ships. The same goes for Celestino if he appears.

## 11 Nov 2026 — repo cleanup, the conference site, decisions D3–D8

- **Found:** `main` and three branches had been cut before the photo cleanup and still carried the
  original photos (GPS, faces). Michele said yes to rewriting them. `photos`, `story-run-sheet` and
  `venue-voxxed-layout` were rewritten with the cleaned copies and force-pushed (no other file
  changed, checked by diff). `main` first refused (a pull-request rule); Michele lifted it and the cleaned
  `main` was force-pushed the same day. GitHub support still has to purge the merged PRs' frozen
  heads and the unreachable commits.
- **Network:** the cloud environment blocked the conference site; with Michele's approval a
  personal environment allowing `vdt27.voxxeddays.ch` was created and this session moved onto it.
  `docs/conference.md` records the date (19 Feb 2027, workshops the day before), theme ("From
  Developer to Builder", "Build, Agents + Debug"), tracks and the copy the game can reuse.
- **Decided by Michele:** D3 leans fixed order (to discuss); D4 Ticino references or local beer
  brands; D5 he is asking Federico and Tiziano; D6 "some Swiss Italian stereotype"; January talk
  wanted, possibly on the old game. The agent expanded D3 (the relay), D6 (the Gotthard queue),
  D7 (four ways onto the stage, the wheelchair ramp recommended) and D8 (what "soft" means).
- **Later the same day, Michele:** D7 approved, A, the wheelchair ramp (Voxxy climbs Biggy, drops it,
  Droid squares it, Biggy rolls up). Controls: a gamepad at the booth, but keyboard-first. First
  deadline: a short talk at GDG Milano in the second half of January.
