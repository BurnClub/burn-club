# Burn Club — open notes

Things deliberately left undone, and why. Not a bug list — everything here
works as built; these are decisions deferred or work blocked on something
outside the prototype.

## Blocked on the native build

Everything here is a thing a web app fundamentally can't do, so it waits for
the wrapped app. Grouped because they land together, not one at a time.


**Audio cues.** The prototype is a web app, so it has no reliable way to make
a sound while the screen is off or the phone is in a pocket. Every one of
these is currently a *visual-only* interim, and the audio is the real answer:

- **Static hold finishing.** The strongest case. During a hip thrust or squat
  hold the member is looking at the ceiling, not the phone — the countdown on
  the row is a fallback for a beep they can't miss.
- **Interval work → rest → work transitions.**
- **EMOM minute change**, which is the moment the exercise swaps.
- **AMRAP cap expiring.**

When the native build happens, these four are the list.

**Wearable / health data.** The step, calorie and resting-HR figures on Home
are currently invented. Real ones mean HealthKit on iOS and Health Connect on
Android — both native-only, both needing their own permission prompt and
privacy disclosure. Until then this is faked data shown to the member as
though it were real, which is fine for a demo and is not fine for a paying
member. Either it becomes real at the native step or it comes off the screen.

**Push notifications.** No workout reminders, no "your coach replied", no
check-in nudge unless the app is already open.

**Background timers.** A phone that locks mid-AMRAP suspends the page. The
clocks are wall-clock driven now, so nothing drifts and the time is right when
they come back — but the workout doesn't *run* while they're away.

**Offline.** A gym basement with no signal should not break a workout. Needs
the day's content cached on the device and completions queued for upload.
Worth deciding early: it shapes how the app stores things, not just how it
syncs them.

## Blocked on real content or a backend

- **Hover-to-preview exercise video** — needs real video files.
- **Back-dating members' history at conversion** — needs the export from the
  old platform.
- **Program changes reaching the member app** — the three apps share only
  same-origin localStorage. Real propagation needs a backend.
- **Check-in / journal on the staff app** — built on the member side only;
  it was always meant to exist on both.
- **"Already took the app tour" flag** — stored in localStorage, so it's per
  browser. It belongs on the member's record once there's a backend, otherwise
  a reinstall or a second device replays the tour for someone who has already
  taken it.
- **Member preferences generally** — the app-tour flag above, the daily
  check-in on/off switch, and notification toggles are all localStorage, so
  they're per browser. Same fix as everything else here: they belong on the
  member record. Until then a member who turns the check-in off and reinstalls
  gets asked again. Worth doing in one pass rather than one flag at a time.

## Agreed, not yet built

- **Admin validation report** (agreed 2026-08-25, tabled 2026-08-27). One page
  listing what would break on import: every workout referencing an exercise
  name that isn't in the library, and every member record with a missing or
  malformed field. Both failure modes are known and silent — a typo'd exercise
  name loses its video, cues and weight tracking without saying so, and a blank
  `start_date` crashes `init()`. Worth having before ~600 workouts and a couple
  hundred member records land, because after the import these are found by
  hand. Deliberately tabled for its own session, not dropped.


### Next candidates for Settings (2026-08-27)

Reviewed after the first four moved out of the code (Challenge Scoring,
Support & Contact, Member-Facing Copy, Default Habits). Listed in the order
they were recommended; Chris parked all five for a later session.

- **Habit Library** (`HABIT_PRESETS`, data.js). The starting habits are
  editable now but the menu members pick *from* is not, so Chris can set what
  a member begins with and not what they can switch to. Cheap — reuses the
  Default Habits panel almost wholesale.
- **Cardio activity types** (hardcoded buttons in index.html's cardio-log
  overlay: Walk / Run / Bike / Stair Stepper). A member who rows, swims, hikes
  or uses an elliptical has nowhere to log it, so it earns no challenge points
  either. Each type wants its own unit — "Distance (mi)" is wrong for a stair
  stepper. Cheap, and the only one on this list that fixes something broken
  rather than unfreezing a constant.
- **Benchmarks** (`BENCHMARKS`, data.js). Still literally named "Benchmark A /
  B / C" on a member-visible Progress screen. Wants real names, descriptions,
  a fourth, and a per-benchmark score type. Medium: scoreType drives how
  results render, so a new benchmark with no history has to render cleanly.
- **Daily check-in questions** (the two sliders in index.html + `CHECKIN_SERIES`
  in app.js). Chris's coaching instrumentation — it decides what he can see
  about a member over time. Medium: the questions drive a two-line chart with
  fixed colours, so a third question means teaching the chart to handle N
  series.
- **Notification types and defaults** (`NOTIF_TYPES`, app.js). Five toggles,
  all defaulting to on. Cosmetic until push exists, but "all on by default" is
  the setting that decides whether an imported member's first week is helpful
  or annoying — worth choosing before the import, not after.

Left off deliberately: the referral/invite offer (offered 2026-08-26, Chris
picked the other four — still available); default team names and draw
behaviour (belongs with the team challenge conversation above); and streak
rules, which are real logic rather than config and want their own design pass.


- **Offline.** Wanted, but deliberately *not* first: the current platform has
  no offline support and no member has ever complained, which is better
  evidence than a hunch. The rule is therefore don't build it now, don't
  foreclose it — the app should store the day's content and queue completions
  in a way that offline can be switched on later without a rewrite.

- **Free-trial Burn Club program**, to hand App Review as a working demo
  account. It needs to be a real member record on a real program, not a
  special case, or it won't exercise what a reviewer is checking. Tabled for a
  later session (2026-08-27) — it's gated on the App Store submission actually
  being imminent, so there's no value in building it early.

## Settled — don't revisit

- **The completion card stays on Home until a new program is assigned**
  (Chris, 2026-08-23). Not dismissible, not a popup — it's a standing call to
  action, and it clears when `start_date` changes. Don't propose a dismiss.

- **Its CTA already opens the coach DM.** "Message your coach" goes straight
  to the staff thread with the composer ready; there's no separate link to
  add.

- **Exercise names stay as they are.** Long names were a layout problem and
  have been fixed as one; they are not a naming problem. In particular, a lot
  of exercises with "Static Hold" in the name are *standalone exercises*, not
  candidates for the hold modifier (Chris, 2026-08-23). The modifier exists
  for reps-then-hold on the same movement; an exercise that is only a hold
  keeps its own library entry and its own name. Don't propose a bulk rename.

## Decisions still open

- **What the notes feature could be — Chris wants a longer conversation**
  (2026-08-30). Raised straight after the daily check-in got a member-facing
  on/off switch. Deferred deliberately; he leads this one, so don't arrive
  with a design.

  Scope was not defined when he raised it, and the phrasing ("the notes app")
  could reasonably mean more than one thing — ask before building anything.
  What exists today that it would grow out of:

  - The **check-in note**: one optional free-text field per day, prompted as
    "Anything worth noting?" with the placeholder "Sleep, soreness, stress, a
    win…". Stored on the check-in record alongside the two 1–10 scales, and
    read back in Progress → Check-Ins. Both the prompt and the placeholder are
    editable in Admin → Settings → Daily Check-In.
  - A member can send a single day's entry to their coach from that section
    ("Send to coach").
  - The **staff-side check-in / journal** is listed above as still unbuilt —
    it was always meant to exist on both sides, and it's the obvious other
    half of whatever this becomes.

  Questions worth having answers to before it's built: is this the member's
  private journal, or a shared record the coach reads by default? Is it tied
  to a day like the check-in is, or free-standing? And does it want to be
  searchable, which is the thing that would decide how it's stored.


- **Team challenges — Chris wants a longer conversation about this section**
  (2026-08-26). Raised right after teams moved into Groups and challenges got
  an Individual/Teams format. Not blocked on anything; pick it up next session.
  Two things already on the table when that happens: default team names are
  still hard-coded (`DEFAULT_TEAM_NAMES`), and nothing stops two team
  challenges running at once — a member drawn into both would be on two teams,
  and the member app's `myChallengeTeam()` silently returns the first match.


- **The completion card stays open for revision** (Chris, 2026-08-23). Two
  separate things to settle on it:

  1. **The copy itself.** Chris has approved the current wording; leaving it
     open only in the sense that he may want to revise it later.

- **Does a finished program end, or re-enrol?** If members repeat a program
  or move to another, `start_date` stops being one field and becomes a
  history of enrolments. Decide before members are imported — see
  `import/README.md`.

- **Personal Bests placement.** Chris wants it somewhere other than the
  Progress tab but hasn't decided where. Its current spot is provisional.
- **Check-in feature** is paused pending partner feedback. Not a thread to
  push on unprompted.
