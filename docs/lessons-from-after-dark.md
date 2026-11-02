# Lessons from After Dark — for the Voxxed Days Ticino 2027 builders

*Source repo: `devoxx-gauntlet-m` ("After Dark", Devoxx Belgium 2026 Robot Games entry, built
22–30 Sep 2026). Every claim below cites the file it comes from; paths are relative to that repo.
Quotes are verbatim from those files. Written 2 Nov 2026 for the successor game at the Palazzo dei
Congressi, Lugano — a booth demo and a conference talk, not a contest entry.*

**Scale of what came before.** The last credits recount says 553 commits, 93,372 lines and 954 tests
(`git log`, commit `ed6aa4a`). The GenAI record puts the token bill at 17.5 billion across four
sessions, and one session's transcript alone counts 233 messages from Michele against 7,245 model
turns (`docs/genai-notes.md`, "In one page"; `docs/playtest-notes.md`, credits section). Ten browser
prototypes came first (`docs/ideas-history.md`). Budget for that, or cut scope on purpose.

---

## 1. What players and Michele loved — carry these over

**The core idea: physics differences are the puzzles.** Michele's founding idea was a Lost Vikings
style escape room built on the robots' physical rules, with their lights combining to reveal clues
(`docs/ideas-history.md`). Every chapter is "solved with the three robots' *physical* differences,
never with an inventory" (`README.md`). Keep that as the spine. Same robots, same frozen physics.

**Mechanics that landed:**

- **Light mixing with real shadows.** Clues show only under the right mix of colours. Glass passes
  light but blocks robots. Seat rows block robots but let light through. The cinema screen is a
  mirror (`docs/lights-and-locks-rules.md`). When Michele asked for a fourth colour he dropped it
  himself ("that's too much"). The fix was per-colour arcs on the clue ring instead
  (`docs/playtest-notes.md`, "Ideas he raised"; ch.1 note 7).
- **Biggy as a battering ram.** The jammed door breaks for Biggy alone. The roller door needs Voxxy
  pushing him (`GAUNTLET.md` §4). The **tow bar** solved aiming: a 2 px miss on a free push halved
  his top speed, while the tow drifted 0 px. Michele: *"The voxxy-biggy run worked, even if a bit
  clumsy."* (`docs/playtest-notes.md`, "The tow bar is wired", "Chapter 2, second pass").
- **Droid climbing Biggy** (the "tower"). It runs from chapter 1's projector panel to the curtain
  call (`docs/lights-and-locks-rules.md`; `docs/playtest-notes.md`, ending section).
- **OutOfMemoryError beer crates.** Each crate adds mass and cuts Biggy's acceleration. The fifth one
  "throws", so greed is "punished by physics rather than by a rule". Approved as *"OutOfMemory, yes
  build it"* (`docs/gameplay-additions.md` §3). The *pattern* is worth keeping: a joke built out of
  the physics model. The Belgian-beer joke itself is Devoxx-specific (see §6).
- **Party tricks on `E`.** Voxxy jumps, Biggy rolls, Droid unfolds. Michele asked for them (*"Not
  needed for gameplay"*). *"the roll is great!"* (`docs/playtest-notes.md`, 24 Sep evening and V46).
  Cheap, and they are what passers-by will press first.
- **Objects that make a journey, not booleans.** *"The ladle thing: I think droid should take it
  and drop it in the soup. Otherwise the action is a bit pointless."* The ladle now goes shelf →
  carried → in the pot (`docs/playtest-notes.md`, V47). The same goes for the reel that winds down
  as the cable pays out, and for the #DEVOXX letters Droid carries as mass (`docs/gameplay-additions.md` §4).
- **The curtain call.** All three robots take their marks, do their party tricks and form the tower,
  and the room applauds. The ending also plays back the night's bloopers from your own run. *"Movie
  approved, build it."* (`docs/playtest-notes.md`, 28 Sep ending sections).
- **Soft failure instead of game over.** A full keynote room used to fail chapter 4. Now it is noise
  from the crowd plus a line on the end video. That change came from Michele's *"Game does not end
  if room is full, but some rumors from the crowd?"* (`docs/playtest-notes.md`, 28 Sep).
- **Michele's emergency-light intro.** In the opening, a light flickers out and the three lamps come
  up. "Taken whole" (`docs/playtest-notes.md`, "The emergency light").
- **Every gate says why, in the robot's voice.** This was the first lesson of POC 1: "no in-game
  hints → players get lost" (`docs/ideas-history.md`; `CLAUDE.md`).

## 2. What went wrong or got cut, and why

### Recurring playtest complaints

| Theme | What happened | Source |
|---|---|---|
| **Speed / control** | *"Voxxy feels too fast, it's almost hard to control"*. The prototype's numbers came out at 23 m/s in venue scale. Fixed by the one-off `SPEED_SCALE = 0.25` rescale. Then Droid was too slow (*"a bit cumbersome to move around"*, so ×1.4), and Biggy took 6.6 s to stop (accel 1.5 plus a driven-only brake). | `docs/playtest-notes.md` ch.1 #9; `GAUNTLET.md` frozen constants |
| **Aiming** | *"it's really hard to stop a character pointing the light in the right direction"*. Voxxy coasted 2.6 m, and a wall bounce flipped her heading on release. | ch.1 #10 |
| **Contacts** | *"droid is pushing Biggy just by coming close, with no contacts"*. The radii had been guessed, not measured off the rigs. Crowd and prop radii were never re-measured afterwards. | ch.1 #11; "Structural" table |
| **Walk-through objects** | Reported three rounds running ("this cube is walk-through", "Entrance walls are still walkable"). The renderer drew things the sim had never heard of. Fixed for good by `tests/colliders.test.ts`: "a drawn solid must be a collider". | "Chapter 3 of the same bug" |
| **Robots / pilots walking through people** | Standing staff, Stephan and the speaker were drawn but not solid until `standOff()`. A test pilot routed Droid straight through Stephan. Curtain-call marks tied to roles made robots shove through each other. The speaker glided over tables Voxxy could only pass *under*. | `docs/genai-notes.md` ~L3600, ~L5635, ~L5434; playtest "voxxy can go under the tables" |
| **Camera** | After a day of 3D camera changes: *"still hard with the camera. Can we reset it as in the first tries?"* Every change "fixed one screenshot and made steering harder". A camera that could end up inside the robot's head was rejected. Earlier, the fixed diorama camera hid cinema E's clue (only 35% of the area in shot). | `docs/genai-notes.md` ~L3903, "In one page", cinema E |
| **Unreadable / invisible objectives** | The projector was a grey floor box, the breaker was a crate, the ladle a grey slab, and clue 4 was covered by a prop 4 cm above it. *"The hint must be visible, it's unsolvable this way"*. | ch.1 #5, ch.2 #4, 24 Sep evening |
| **Tests green, human stuck** | Cinema E: *"i wasn't able to solve it"*. `tests/aisle.test.ts` measured reachability and called it playability. | `docs/genai-notes.md`, "cinema E" |
| **Lighting** | Clue numerals were drawn under the light pools. The robots came out "whitey-grey" from per-panel tone compression. The x-ray ghost made robots look "ethereal". | "Light and readability"; "Why the robots were whitey-grey" |
| **Discoverability** | *"How do I activate Biggy's rolling?"*, asked four times. A spec read too literally ("at least when he's pushed" taken to mean "only"). | 27–28 Sep sections |
| **Pacing** | Chapter 4 was "about six minutes" by Michele's note. The measured floor for a solver on one stick is 92 s, against his *"I'd say 3 minutes?"* | 28 Sep; `docs/gameplay-additions.md` §4 |
| **Stability on real machines** | *"my friends say it crashed a couple times"*. `Q` cycled quality *upward* into a lost GPU. Shader recompiles caused 12 s blank screens between chapters. | `docs/genai-notes.md`, 29 Sep late night |

**Cut:** the cam-lock WiFi wheel (*"Remove the wheel, too complicated."*). Letter-collection
(busywork). A fourth light colour. Free zoom-out (`docs/gameplay-additions.md` §2, §4;
`docs/playtest-notes.md` backlog).

### Process failures

- **Prose vs drawing.** For days `CLAUDE.md`/`GAUNTLET.md` put the secondary staircases in the
  wrong place. The drawing won: *"Follow the plan — move them"*, *"follow the devoxx plant, not the
  plan.md"* (`CLAUDE.md`; `GAUNTLET.md` Stage 1). Docs went stale in other places too: `GAUNTLET.md`
  "still prescribing the fixed diorama camera and a 28 Sep cut-off" until the judges' critic found it
  (`docs/genai-notes.md`, 30 Sep panel). One backlog row said "in flight" for two days after the
  work had shipped (`docs/playtest-notes.md` ch.1 #9).
- **Agents drifting from the model sheets.** The likeness gate failed four rounds. Briefs copied the
  organisers' demo instead of the sheet: a whip antenna, a flared brim and pauldron caps on Biggy
  that "came from the demo via a brief of mine". Rounds inherited sheet numbers, so a fixer tuned to "a figure that does not
  exist in the reference art". Michele: *"They are all similar to the model, but need much polish."*
  (`docs/genai-notes.md`, Round 5; `docs/reference-demo-observations.md`).
- **Test timeouts.** The `buildLights` cost (lights × rays × walls) took the suite from 58 s to 71 s
  and "tripped a vitest worker RPC timeout". `canWalk` "tipped over vitest's 5 s default". Pilot
  tests needed bigger wall-clock budgets. And there were "usual timeouts under four concurrent
  agents" (`docs/playtest-notes.md`, cost sections; `docs/genai-notes.md` ~L1267, ~L2030; commit
  `61f2637`).
- **Shared worktree and scratch files.** Agents ran `git checkout <file>` to undo a mutation test and
  wiped a session's work. A `git stash` "moved someone else's in-flight `biggy.ts` out from under
  them". The lesson recorded: "copy the file to the scratchpad and copy it back". `pkill -f` killed
  the agent's own shell (`docs/genai-notes.md` ~L1295, ~L3765). 298 progress screenshots (53.6 MB)
  had to be purged from history. Michele overrode the agent: *"reducing size is important, and now
  it's the moment to do it"* (same file, 29 Sep merge).
- **Publishing.** Version 28 shipped without its bundle and never started (`GAUNTLET.md` §3).
  `?chapter=N` switches are "silently ignored" inside the artifact host (`docs/playtest-notes.md`,
  27 Sep).
- **Critics measuring their harness.** "Tab cycles robots backwards" turned out to be a synthetic
  key being dispatched twice (`docs/genai-notes.md`, round 4).
- **What the agent could not perceive.** It never heard the music ("described to it, not heard"),
  and it judged renders only as SwiftShader screenshots. "Frame rate and feel on real hardware came
  only from the human" (`docs/genai-notes.md`, "Honest limits").

## 3. Michele's standing rules and taste

- *"I vote funny, robots must be recognizable."* A caricature that reads as *him* beats a ratio
  measured to three decimals. Hoop shoulders on Droid stay because they are fun, and the face goes
  back to the sheet (`CLAUDE.md`).
- **The drawing beats the prose.** *"follow the devoxx plant, not the plan.md"*. Re-measure, move
  the geometry, and fix the prose in the same change (`CLAUDE.md`).
- **The model sheet is the authority on appearance. The organisers' demo is the craft bar.**
  "Where they disagree the sheet wins." Biggy keeps amber eyes by Michele's standing decision, even
  though the sheet has none (`docs/genai-notes.md` Round 5; `docs/reference-demo-observations.md`).
- **Frozen constants change only by a human decision**, on playtest evidence: *"ok for biggy
  inertia"* (`GAUNTLET.md`).
- **Plays before looks.** *"Priority is making it playable and finishing all chapters"*
  (`docs/playtest-notes.md`, backlog).
- **Cut complexity.** *"Remove the wheel, too complicated."* Busywork collection is out
  (`docs/gameplay-additions.md` §2). *"Droid swap. Droid is already slow, so don't scatter the
  letters around."* (§4).
- **One key.** *"Why space and not e for catching? I'd keep it to one key."* and *"Voxxy jump:
  let's make it. I'd keep E, when no other action is available."* (`docs/playtest-notes.md`).
- **Don't over-hint, but always point.** *"I'd leave out the robot name here ... That's already a
  big hint"*. On the other hand, an object outside the view needs *"something pointing at it"*
  (`docs/playtest-notes.md`, Version 30).
- **The fiction must be believable.** *"Stephan is powerful, but i don't think he can remove a
  wall. I'd use something simpler, like «Nastri»"* (27 Sep). On the password: *"what is excluding
  droid? Fingers too long?"*. Don't invent restrictions ("tidiness posing as design").
- **Generous tolerance.** *"I would be more generous with the light / hint match."* `CLUE_SPOT`
  went from 0.4 m to 0.8 m (`docs/genai-notes.md` ~L3895).
- **Ask before deviating.** Agents raise ideas and a human decides (`docs/genai-notes.md`, prompting
  technique #8). Nothing needing permission: first names and caricature only (`CLAUDE.md`).
- **Exceptions are personal and singular.** The one audio file ("Heroic Motif") is "Michele's",
  and "the next one is another human decision" (`CLAUDE.md`).

## 4. The gauntlet loop — what it cost, what it bought

**Bought:**
- **A critic on fresh context that sees only the running build** was "the single change that most
  improved output quality" (`docs/genai-notes.md`, prompting technique #2).
- **Factual checks before aesthetics** (plan overlay, model-sheet comparison) stopped the loop from
  "polishing something that is factually the wrong building" (same, #3).
- **Class-closing tests beat symptom fixes.** `colliders.test.ts` ended three rounds of
  walk-through reports. `cutscene-pace.test.ts` caught a cutscene driving Droid at 263% of his top
  speed. `full-run.test.ts` found a soft-lock on 12 of 14 seeds on its first run (`docs/playtest-notes.md`).
- **Freezing numbers in code, not prompts** meant no agent could re-tune a threshold to make its
  scene pass (`docs/genai-notes.md` #4). The 23 Sep rescale went through as "a change of unit rather
  than a re-tune" (`GAUNTLET.md`).
- **`CLAUDE.md` as the standing prompt.** A ruling "lands there the day it is made", so the next
  agent starts from it (`docs/genai-notes.md`, "The prompts").

**Cost / limits:**
- Numeric gates verify only what someone wrote a measurement for. Four rounds "never once flagged
  Voxxy's hands, because nobody had written a measurement for them" (`docs/genai-notes.md`, Round 5).
  Thresholded measurements of soft glows were unstable ("eye area" swept 0.004–0.081)
  (`docs/reference-demo-observations.md`).
- "Almost everything here was invisible to a passing test suite" (`docs/playtest-notes.md`, header).
  Michele playing the published build was "worth more than another critic" (`GAUNTLET.md` §3).
- The brief-writer is fallible too: "the person writing the brief is not exempt from the rule the
  brief imposes" (`docs/genai-notes.md`, Round 5).
- Parallel builders in one worktree collided (see §2). Later sessions gave each helper its own git
  worktree (`docs/genai-notes.md` ~L6269, ~L6853). Explicit file ownership per builder is listed as
  prompting technique #6.
- The 3-round / ~3-hour cap per piece did not hold the calendar. "In practice the 3D build's rounds
  and the critic panel ran into 30 Sep", the deadline day (`GAUNTLET.md` header). The late switch to
  3D (27–29 Sep) is the biggest single reason.
- The last critic panel scored 76/100 and came "on the day of the deadline". Two of its ideas were
  rejected as too late (`docs/genai-notes.md`, 30 Sep panel). Run the judge-style panel *early*.

**Practices to keep:** publish to one bookmarked artifact after every green round, built from
committed `HEAD` in a throwaway worktree, with known defects stated (`GAUNTLET.md` §3). Keep a
single backlog file. Michele asked *"Are you keeping track of all those 'later' polish?"* and the
honest answer was "Partially, and not well enough" (`docs/playtest-notes.md`, backlog). Ask the
agent to look first and fix second (cinema E, `docs/genai-notes.md`).

## 5. Recommendations for a booth-demo game (Voxxed Days Ticino 2027)

These are inferences from the evidence above. Nothing in the source repo measured cold booth
players.

1. **Session length: one room, 2–4 minutes.** The only measured play times are a solver's: 92 s
   for chapter 4 on one stick, and a 108 s sim-clock full run with choreography. Michele's own
   target for a chapter was *"3 minutes?"* (`docs/playtest-notes.md`, 28 Sep). A cold player at a
   booth needs one self-contained challenge with its own ending, not four chained chapters. Make
   each challenge playable on its own from a menu, the way `?resume=N` and Skip chapter already do
   (`README.md`).
2. **Onboarding in seconds, not in a run sheet.** After Dark relies on `I` (run sheet), `H` (hint),
   `1/2/3/Tab`, `E`, `Space`, `Q`, `P`, `M`, `N`, `R` and `C` (`README.md` controls). For a booth:
   move, switch robot, act, and nothing else. The emergency-light intro shows each robot's
   character, so keep that shape and cap it at ~10 s. Let any key skip it after a short grace, as the
   final build did (`git log` `49304a8`).
3. **Teach by gates, not text.** Keep "every gate says why, in that robot's voice" (`CLAUDE.md`).
   Keep an off-screen chevron to the objective (`docs/playtest-notes.md`, Version 30). Make every
   interactive prop glow the same way. Michele suggested "one visual language for interactive
   props" (`docs/playtest-notes.md`, deferred looks).
4. **Be generous.** Use wide clue tolerances (`CLUE_SPOT` 0.8 m) and the tow bar instead of free
   pushes, because a 2 px miss halves Biggy's speed. No hard fail states (`docs/playtest-notes.md`;
   `README.md` "no timers you can fail hard").
5. **Camera: fixed or lightly assisted. No mouse-look and no pointer lock at a kiosk.** Michele
   reverted every camera experiment (`docs/genai-notes.md` ~L3903). A diorama camera needs checking
   for shot coverage per puzzle (the cinema E lesson).
6. **Hardware: pin it.** Pick one booth machine and one quality level. Precompile every shader
   behind a loading screen. Never let quality cycle upward. Add a context-lost recovery card
   (`docs/genai-notes.md`, 29 Sep late night). Test on the real booth hardware, because the agent
   only ever saw SwiftShader.
7. **Kiosk loop.** After Dark's title "never starts on its own" (`docs/genai-notes.md`, 30 Sep
   panel). A booth wants the opposite: an attract loop (the curtain call or the promo trailer from
   the real build), and auto-reset to the title after idle. Consider a gamepad, since the game is
   "keyboard-only" (`GAUNTLET.md` §3). Desktop/phone detection exists (`docs/genai-notes.md`, 30 Sep).
8. **Show-off moments for spectators.** The roll, the tower and the OOM crash are readable from two
   metres away. Text toasts are not. The blooper reel works as a shareable ending.
9. **Cut:** chained multi-floor progression, the credits screen as a game feature (keep the counted
   figures for the *talk*), photo mode, 2.5D/3D dual renderers (pick one early), and optional
   minigames that compete with the main objective for `E` (the Sticker Mine soft-lock hit one run
   in six: `docs/playtest-notes.md`, Structural).
10. **Start with the Palazzo dei Congressi plans as images, and keep the drawing-wins rule.**
    Measure radii and prop/crowd sizes off rigs from day one. That is the "guess vs measure"
    mistake, which was never fixed for the crowd (`docs/playtest-notes.md`, Structural).
11. **For the talk:** `docs/playtest-notes.md` (the human found what tests did not) and the
    "In one page" / prompting-technique sections of `docs/genai-notes.md` are ready-made material.

## 6. Devoxx-specific — do NOT copy without re-thinking

| Item | Why it is Devoxx/Kinepolis-only | Source |
|---|---|---|
| **Stephan** (caricature of the programme chair), Celestino, Duke, Lize Raes, Aurélie Vache | These are real Devoxx community people, by first name and from photos. Ticino has different organisers and needs its own people, *with their consent*. | `docs/ideas-history.md`; `docs/genai-notes.md` ~L5659 |
| **Tomato soup, crab sandwich** | Devoxx's food folklore (*"the most famous part of the infamous devoxx food"*). | `docs/playtest-notes.md` V30 |
| **"Belgian beers may cause hangovers and OutOfMemoryErrors"** | This line is on Devoxx's own signage. Keep the mass-and-greed mechanic, and find a local load. | `docs/gameplay-additions.md` §3 |
| **`DevoxxForever` WiFi joke, #DEVOXX stage letters, the Devoxx t-shirt** | Devoxx Belgium traditions and branding. | `docs/gameplay-additions.md` §2, §4 |
| **Kinepolis cinemas, Zaal numeral panels, Dutch wayfinding, Room 8 movie night, "ANTWERPEN" crate stencil** | Venue-specific. Lugano needs its own plans, photos and signage, in Italian. | `GAUNTLET.md` Stage 1; `docs/playtest-notes.md` crate stencils |
| **Keynote speaker "TBA", the four-chapter night→keynote arc** | Built around the Devoxx week. Re-think it around a Voxxed Days single-day format. | `CLAUDE.md`; `docs/ideas-history.md` |
| **Contest rubric and scoring framing** (40/20/15/10/10/5, "judges", the GenAI-notes 5 points) | This is not a contest any more. Keep the notes for the talk, and drop the rubric as the driver. | `CLAUDE.md`; `GAUNTLET.md` |
| **The "Heroic Motif" audio exception** | It was Michele's one-off for this game, and reuse is a new human decision. | `CLAUDE.md` |
| **Puzzle thresholds tied to Kinepolis geometry** (cable 1480 px, jammed/roller door speeds, `PX_PER_M = 12.5`) | The robots' constants carry over. These thresholds belong to specific Antwerp rooms and need re-deriving against new rooms by a human. | `GAUNTLET.md` frozen constants |
