# Challenges and storyline: brainstorm draft

*Draft by the agent, 3 Nov 2026, for Michele to react to; his decisions are marked as they come in. Sources: After
Dark's four chapters (`src/sim/chapters/ch1..ch4` and `README.md` in `smirne/devoxx-gauntlet-m`),
`docs/lessons-from-after-dark.md`, and what the 2D venue check taught us about the Palazzo
(`docs/venue.md`). The decisions to make are numbered **D1–D8** at the end.*

## The shape: a night shift, cut into jobs you can play alone

After Dark is one night, from closing to the keynote, told in four chained chapters of about six
minutes each. A booth needs a stranger to start cold and finish in 2–4 minutes, and needs any
moment to be a fine place to stop.

**Decided (Michele, 3 Nov 2026): night, then doors.** *The night before Voxxed Days Ticino, and
the morning after it starts.* A summer storm over the lake has cut the power, and the Palazzo is
dark. Federico and Tiziano, the two main organisers, are sleeping late after the speakers' dinner
(and the Merlot?), so the robots have to save the day. The run sheet lists the jobs in two acts:

- **Before the doors (dark, the storm):** the jobs where light is the mechanic. Power, the lift,
  the light-mix keypad, the folding walls and podiums, the beer delivery.
- **After the doors (lit, people arriving):** the coat rush at the wardrobe, the missing keynote
  speaker, and the keynote itself.

Each job:

- is **one room or one floor**, playable on its own from a menu;
- takes **2–4 minutes**;
- has its own small ending (a light comes on, a door opens, a robot cheers);
- ticks a box on a run sheet that stays on screen.

Finishing every job unlocks the **curtain call** in Sala A, which also runs as the attract loop.
A visitor plays one job; a fan plays them all. The talk can show the whole night. A possible
closing beat: Federico and Tiziano arrive at last, and everything is already done.

What we keep from After Dark's spine: it is solved with physical differences, never an inventory;
every gate says why in the robot's own voice; failure is soft; the emergency-light intro stays, capped
at ~10 s.

## Recycle: After Dark's challenges, re-homed

| # | After Dark | What it tests | In the Palazzo |
|---|---|---|---|
| R1 | **Ch.1, four light-mix clues → fire-door keypad.** Orange+green, orange+blue through glass, green+blue behind a door only the tower opens, all three behind a jammed door and a mirror | Light mixing, the tower, the ram | **Sala B3 is the closed section: its keypad.** Clues in the merged B1+B2 room, in Atrio B, in Atrio C, and one in the closed galleria. A shut folding wall blocks light in the sim, so the folding layout decides which colours can meet (see N1). |
| R2 | **The tower:** Droid on Biggy reaches a high panel | Height | **The slatted strip high on Sala B's end wall** (Michele: not walkable). A panel up there is the obvious tower target: projector, mixer, or a lost clicker. |
| R3 | **Ch.2, breaker → cabinet → router → password chain** | One link per robot, each visibly dead until the last lands | **The lift is dead.** Droid throws the breakers (too high for the others), Biggy shoulders a seized service door, and the lift comes up. Then the twist: the lift door is 0.9 m, so only Voxxy rides it. |
| R4 | **Ch.2, the measured cable run**, only fits under the sponsor tables | Voxxy's size | **The booths in Foyer principale and Villa Ciani** (Michele's zones). Voxxy runs a cable from the reception desk to a sponsor's screen; the short route goes under the booth tables. |
| R5 | **Ch.2, roller door above Biggy's top speed**: Voxxy shoves him the length of a lane | Momentum, the tow bar | **A stuck folding wall** in Sala B: too heavy to slide unless Biggy hits it at speed, which needs Voxxy towing him the length of the room. |
| R6 | **Ch.3, OutOfMemoryError crates**: each one adds mass, the next one too many throws | Greed punished by physics | **Beer, for the end of the conference** (Michele, 3 Nov 2026: *"there are always beer at the end of the conference, in the wardrobe foyer"*). The crates are delivered early for tonight and stand in the way; Biggy takes them to the wardrobe foyer. The heap error stays (it's a Java joke, not a Devoxx one); After Dark's Devoxx signage line and its invented Belgian breweries do not come over. |
| R7 | **Ch.3, the soup pot**: heavy robot, gentle driving, spills on bumps | Biggy's inertia | Same beat with a local dish to the buffet: Biggy cannot stop quickly, the wardrobe tables are in the way. |
| R8 | **Ch.3, find the speaker hiding behind a booth** | Exploring, Voxxy's speed | **The speakers' room (Sala D) is tiny.** A speaker is missing ten minutes before the talk; Voxxy finds them (closed balcony? galleria?) and walks them to Sala D. |
| R9 | **Ch.4, keynote: cake to its mark, a sign letter by letter, spotlights in order, a filling room** | All three at once, the crowd as clock | **The opening keynote in Sala A.** The crowd comes in through the back doors from the west foyer and fills the stalls. |
| R10 | **Party tricks on E**, the curtain call, the blooper reel | Spectator fun | Keep all three. They read from two metres away at a booth. |

## New: from what this building does that Kinepolis didn't

| # | Idea | Why this building |
|---|---|---|
| N1 | **Set the room.** The day's programme card shows a layout (B1+B2 merged, B3 alone; or all three split). Robots slide the folding walls to match before the doors open: Biggy pushes a section, Droid locks the top latch, Voxxy checks under the gap. | Folding walls are the Palazzo's own trick; Michele floated it ("Challenges might include the current layout of folding walls"). The sim already has walls that can stand open or shut. |
| N2 | **Everyone upstairs.** Get all three robots to Sala B. The lift takes only Voxxy, the main stair takes everyone, and the west balcony stair goes to the wrong place. A short first job that teaches the gates. | We now know the gates: the 0.9 m lift door, single doors only Voxxy fits, double doors for Biggy. The *why* lines write themselves ("I'm 1.44 m wide, that lift is not."). |
| N3 | **Biggy and the stage.** The steps up to the Sala A stage are 1.18 m apart, so Biggy cannot climb them. For the curtain call he needs a way up: a ramp to push into place, or the tower happens at the foot of the stage. | A real constraint of the drawing, not invented. It gives the finale its own puzzle. |
| N4 | **The closed balconies.** The balcony and the galleria are closed to the audience but robots can get in. Something has ended up there: a sponsor's drone, the keynote's clicker, a frisbee from the booth. Voxxy goes up the east stair by the WC, and only light from below (Biggy's flood from the stalls) shows where it is. | Michele's call: "closed during the conference, but might be accessible to robots". Two stairs, two balconies, joined by a door. |
| N5 | **The wardrobe rush.** At 8 the coats start. Droid (tall) hangs coats on the racks, Voxxy stows backpacks under the tables, and Biggy is the trolley. A sorting job against a soft clock (the queue complains, nobody fails). | The wardrobe is tables with racks behind (Michele). A cheap, readable, funny job. |
| N6 | **Podiums to their marks.** Each section has its podium on a fixed side: west in B1, south in B2 and B3. When the layout changes, the podiums move, and they are heavy. Pairs with N1. | Podium sides are in the venue data already. |
| N7 | **The lift ride (a gag, not a job).** Voxxy rides the lift alone, comes out upstairs, and the other two arrive by the stairs, out of breath. A cutscene beat for the curtain call or the attract loop. | |

## The run sheet: six jobs, three per act (decided for v1, Michele, 9 Nov 2026)

| # | Job | Act | Built from | Who does what | Where |
|---|---|---|---|---|---|
| 1 | **Lights back** | Before the doors | R3 + N2 | Droid throws the breakers (too high for the others), Biggy shoulders the seized service door, the lift wakes up. Voxxy rides it; Droid and Biggy take the main stair ("I'm 1.44 m wide, that lift is not"). Teaches every gate in the building. | Ground → first floor |
| 2 | **The B3 keypad** | Before the doors | R1 + R2 | Four light-mix clues give the code to the one closed section. One clue is high on the slatted strip: the tower. | First floor, Sala B and the atria |
| 3 | **Set the room** | Before the doors | N1 + N6 (+ R5) | Match the programme card: folding walls to the Voxxed layout, podiums to their sides. One fold is stuck: Voxxy tows Biggy into it. | Sala B |
| 4 | **The coat rush** | Doors open, 8:00 | N5 | Droid hangs coats, Voxxy stows backpacks under the tables (Michele: they are put under, not fetched), Biggy is the trolley. The queue is the clock, and it complains rather than fails. | Wardrobe foyer |
| 5 | **The beer** | Doors open | R6 | The delivery for tonight lands in the middle of the morning crowd. Biggy carries the crates to the wardrobe foyer; one crate too many throws the heap error. | Ground floor |
| 6 | **The keynote** | Doors open | R9 + R8 + N3 | The keynote speaker is missing (hiding in the closed galleria?), the stage needs setting, Biggy needs a way onto it, and the room fills. Then the curtain call, and Federico and Tiziano walk in. | Sala A |

**Left for later:** the cable run under the booth tables (R4), the soup (R7, the same beat as the
beer), the closed balconies as a job of their own (N4, partly inside job 6), and the lift ride as a
gag (N7, for the curtain call). The night as a whole is about 15–20 minutes.

## What a session at the booth looks like

1. **Attract loop:** the curtain call, or the night in 30 s cut from real play.
2. **Any key:** the emergency-light intro (≤10 s), then a menu of jobs with a run-sheet look, the
   undone ones blinking. The first time, it suggests job 1, Lights back.
3. **One job, 2–4 min:** move, switch robot, one action key. The chevron points at the objective.
4. **Its own ending**, then back to the menu. After 60 s idle, back to the attract loop.

## Decisions for Michele

- **D1 Story frame.** *Decided:* night, then doors; some jobs come after the doors open (coats,
  the keynote speaker). It's dark because a storm cut the power. Federico and Tiziano, the
  organisers, are sleeping late after the speakers' dinner and the robots save the day.
- **D2 Which jobs for a first version.** *Decided:* the six on the run sheet above, three before
  the doors and three after. *"Start with those 6 jobs. Then we'll add more."*
- **D3 Chained or free.** *Michele leans to a fixed order (11 Nov 2026), to discuss.* The tension:
  a fixed order tells the story; a booth stranger should not have to play jobs 1–3 to see job 4.
  Proposal, **the relay**: the night runs in a fixed order, and the booth keeps one shared run sheet
  for the whole day. Each visitor plays *the next job*, picking up where the last visitor stopped,
  with a 10 s "previously" card. The board at the booth shows how far the crowd has got the
  Palazzo ready; when job 6 is done the curtain call plays and the night starts again. Story mode
  for one player at home is the same order from job 1. A hidden operator key (and the debug URL)
  jumps to any job, for the talk and for testing.
- **D4 The local joke for R6.** *Answered:* beer for the end of the conference, in the wardrobe
  foyer; **Ticino references or local brands** (Michele, 11 Nov 2026). Proposal: invented names
  built on Ticino references for v1, e.g. *Birra del Ceresio* (the lake's Italian name), a crate of
  *gazosa* for the drivers; switch to a real brand only if the actual beer supplier of the
  conference agrees (a real brand name in a public game is the brewery's call). The heap-error line
  stays: it is a Java joke.
- **D5 People.** *Answered:* Federico and Tiziano are in; **Michele is getting their yes**
  (11 Nov 2026), and Celestino's if he is in. Nothing with their names or likeness ships before.
- **D6 The running gag** (After Dark's `DevoxxForever`). *Michele: none he knows of; "some Swiss
  Italian stereotype".* Proposals, kind and local (avoid anything about frontalieri or politics):
  - **The Gotthard queue.** Every Ticinese knows the *coda al Gottardo*. Every queue in the game —
    the coats, the coffee, the robots jammed at the lift — is announced like a traffic report:
    *"Coda al Gottardo: 12 minutes. Coat queue: 14."* Repeats well, readable from a step back.
  - **Swiss precision, Italian improvisation.** Droid is the Swiss one (on time, by the rulebook,
    reads the run sheet aloud), Voxxy is the Italian one (improvises, gestures, *"ma dai"*), Biggy
    is just hungry. A cast note, not a mechanic.
  - **"Palm trees included."** The site's own joke: a potted palm in the foyer that Biggy keeps
    knocking over, and the WiFi password `PalmTreesIncluded`.
  - Food and drink as props: the boccalino of Merlot by the sleeping organisers, polenta, the
    grotto, *gazosa*.
- **D7 Biggy on stage (N3).** *Michele: tell me more.* The facts: the stage front is a ~1 m ledge no
  robot can hop; the speaker steps are 1.18 m clear and Biggy is 1.44 m wide. Four ways up:
  - **A. The ramp (recommended).** A real stage keeps a portable ramp for speakers in wheelchairs.
    It is stored backstage. Voxxy cannot reach it from the stalls: she jumps on Biggy, climbs onto
    the stage from his back (Michele's idea), runs backstage and drops the ramp over the edge.
    It lands crooked; Droid squares it (he is the only one tall enough to lift its end). Biggy
    rolls up. All three robots, one puzzle, and an accessibility nod. Needs: Voxxy riding Biggy (a
    new mount, today only Droid mounts) and a ramp as a height plate.
  - **B. Build a stair.** Push flight cases against the ledge to make steps wide enough. More
    physics (stacking, heights), slower to read at a booth.
  - **C. The goods lift.** The stage has its own goods lift (2.25 × 3.00 m, 1000 kg on the plan),
    dead since the storm: job 1's power brings it back, a nice callback. But it opens backstage,
    which is out of scope, so Biggy would appear on stage from the wings off-screen.
  - **D. No climb.** Biggy stays at the foot of the stage and the tower (Droid on Biggy) hangs the
    last spotlight. Cheapest; the finale has Biggy below, the others on stage.
  For the January talk, D is enough; A is the target for the conference.
- **D8 Fail states.** *Michele: expand.* "Soft" means: **nothing ends the job but finishing it, and
  nothing leaves a stranger stuck.** In practice:
  - **Clocks cost stars, not lives.** The coat queue and the filling Sala A are clocks; running
    over makes the crowd grumble (a line, a sound) and costs a star on the job's ending card
    (three stars: in time, nothing broken, nobody bumped). The job still finishes.
  - **Mistakes undo themselves or cost time.** The fifth crate throws the heap error: crates
    spill and must be restacked. A wrong keypad code buzzes and a robot quips; no lockout. A
    spilled tray is cleaned by Voxxy, costing time.
  - **Hints escalate.** After 30 s without progress the chevron points; after 60 s the robot who
    should act says what to do, in his voice; after 120 s it says exactly how.
  - **Fail forward at the booth.** After 3 minutes on one job a gag ends it for you (Federico
    wakes up, shuffles in, does it badly) and the relay moves on: no visitor leaves on a failure.
  - **Never:** game over, restart-from-the-beginning, a timer that kills.
