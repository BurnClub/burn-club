# Burn Club — open notes

Things deliberately left undone, and why. Not a bug list — everything here
works as built; these are decisions deferred or work blocked on something
outside the prototype.

## Before we go live

Started 2026-09-18. One list of everything that must be true before real
members are let in, so none of it is remembered on the day. The detailed
reasoning for most items lives in its own section further down; this is the
checklist, not the argument.

An item is here because **launching without it causes a problem**, not because
it would be nice. Things that can follow launch belong in the sections below.

### Accounts and money — Chris's to do, not mine

- [x] **Supabase paid tier** — upgraded 2026-09-18. The free tier **pauses the project after
      a week of inactivity** — which is exactly what a quiet week before launch
      looks like, and it comes back only when someone visits the dashboard.
      It also has **no automatic backups**: today the entire content library
      exists in one free-tier database and in `data.js`, and only the second of
      those is versioned. Pro adds daily backups with 7-day retention, no
      pausing, and 100GB of file storage, which is where the 633 videos go.
- [x] **Email sending** — done 2026-09-18, ahead of plan. Resend verified on
      `mail.kellyyager.com` (DKIM plus two CNAMEs; the root SPF, MX and A
      records were never touched, so Kelly's Workspace mail is unaffected) and
      wired into Supabase SMTP. Test send landed.
      **Still before import day:** Resend's free tier is 100/day and 200
      invites in an afternoon exceeds it — upgrade to the $20 tier, or send
      across three days.
- [ ] **Turn off open signup.** `disable_signup` was `false` on 2026-09-18:
      anyone holding the publishable key — which ships in the app's own
      JavaScript — can create an account, and the content policies grant read
      to any authenticated user. That hands a stranger the entire exercise
      library, every program and every workout. Member data stays protected by
      RLS; the content *is* the product. Burn Club is invite-only, so this
      should be off. Authentication -> Sign In / Providers -> Email.
- [ ] **DMARC record — required, not optional.** The first real invite landed
      in Gmail's spam folder on 2026-09-18 and this is why: SPF and DKIM both
      pass, but there is no DMARC record on either the root or the `mail.`
      subdomain, and **Google has required all three from volume senders since
      early 2024**. Two out of three is not a partial pass. Resend labels DMARC
      optional because Resend does not need it; Gmail does.
      Fix: TXT at `_dmarc.mail` with
      `v=DMARC1; p=none; rua=mailto:dmarc@kellyyager.com`. Receivers check the
      subdomain first, so this satisfies Gmail while putting no policy on
      `kellyyager.com` itself and leaving Kelly's Workspace mail untouched.
- [ ] **Rewrite the invite email template.** Supabase's default is "Accept the
      invite" over a bare link with no sender name, product name or
      explanation — structurally identical to phishing, and scored that way.
- [ ] **Point a real domain at the app.** Mail comes from
      `mail.kellyyager.com` and the invite link goes to `burnclub.github.io`.
      Different registrable domains, which filters weigh and members notice.
      `app.kellyyager.com` as a CNAME to GitHub Pages fixes both.
- [ ] **Warm the sending domain.** Don't send 200 invites in an hour from a
      domain with no history — that is the shape of a spam run. Spread the
      import across several days.

### Security — the sharpest items

- [ ] **Neither login authenticates.** The member app's handler is
      `e.preventDefault()` and nothing else. Real auth is phase 2 and in
      progress.
- [ ] **`admin/` is on the same public URL as the member app.** Anyone with the
      link has full access to every admin screen today. Harmless with seed
      data; not on import day.
- [ ] **A security pass over the auth surface** once it exists — not a read of
      the code, an attempt to break it. Sign in as one member and try to reach
      another's rows.

### Content

- [ ] **Technique text.** 661 of 663 exercises have none. It is also what the
      app reads aloud, so an empty field is a silently missing feature rather
      than a blank line.
- [ ] **Videos** — convert `.mov` to `.mp4` (633 files), run the 12 renames in
      `~/Desktop/burn-club-rename-videos.sh`, and upload to Supabase Storage at
      `<exercise-id>.mp4`.
- [ ] **Five placeholder stretches** I added on 2026-09-18 so the seed would
      hold together: Cat-Cow Stretch, Child's Pose, Hip Flexor Stretch,
      Shoulder & Chest Opener, Standing Hamstring Stretch. They have no
      technique and no real authoring. Either write them properly or take them
      out of the Stretch & Core circuit.
- [ ] **30 Minute Burn is still placeholder** — 80 workouts of a single timed
      interval block each, which matches none of the formats Chris actually
      uses. The importer is built and the sheet format is specified; the
      content isn't written.
- [ ] **Member import.** There's a documented CSV template and no importer.
      Members are added one at a time through a modal today.

### Accessibility

- [ ] Reflow at 200% text, reduced-motion coverage, and native VoiceOver /
      TalkBack testing. The measurable contrast failures are fixed; these are
      the ones that need a device and a person.
- [ ] **The brand blue.** White on `#788CE3` is 3.15:1 — below the 4.5:1 floor —
      on the primary button, Profile rows and the unread badge. Waiting on
      Chris and his partner.

### App Store

- [ ] **A permanent demo account** for review, that never expires and always
      has data in it.
- [ ] **Nothing in the app may link to, mention, or hint at buying elsewhere.**
      Purchase happens on the website; Apple rejects apps that point at it.
- [ ] **A free-trial Burn Club program** so a reviewer can see the app work
      without a purchase.

### Known limits to close or accept

- [ ] **Offline writes.** Members are in gyms with bad wifi. The player already
      writes to browser storage first; that needs to become a queue that syncs
      on reconnect, designed before the storage rewire rather than after.
- [ ] **Admin and staff apps are still on browser storage.** Content is seeded
      into Supabase from `data.js`, so editing a workout in admin will not
      reach members until those apps move too. Acceptable for a tester trial —
      content should be stable while people hammer it — and wrong for live
      members.
- [ ] **Messaging, groups and challenge teams have no tables yet.** Phase 2 of
      the schema.

## Security — a hard look before the real app

Chris's call (2026-08-30): before this becomes a downloadable app with real
members in it, security gets its own proper pass. Not a checklist to tick at
the end — several of these decide how things are stored, so they want deciding
before the backend is written, not after.

Nothing below is a live emergency: the prototype holds no real member data,
and every seeded record uses an @example.com address. They all become real the
day the member import runs.

**The two that matter most**

- **Neither app authenticates.** The member login form and the admin login
  form both just `preventDefault()` and reveal the app — any email, any
  password, or none. There is no session, no token, no check.
- **`admin/` is published to the same public GitHub Pages site.** Anyone with
  the URL has full coach access: every member record, every message, the
  health profiles, the lot. Today that's fake data behind an unguessable-ish
  path. On import day it is real data behind an unguessable-ish path, which is
  not a control.

**The rest of the surface**

- **Everything is client-side.** All member data lives in localStorage,
  unencrypted, readable by anything running on the origin and by anyone with
  the device. The health profile (height, weight, activity level, notes) is in
  there too.
- **Health data raises the bar.** Height/weight/activity now, and HealthKit /
  Health Connect later, need an explicit privacy disclosure and a real answer
  to where the data goes and who can read it. Apple will ask.
- **The repo is public.** Anything committed here is world-readable forever,
  including in history. No real member data, keys or tokens should ever land
  in it — worth a check of what's already there before the repo is anything
  but a prototype.
- **The import must carry no passwords** (already settled — members set their
  own on first sign-in). Worth restating here because it's a security decision
  as much as a UX one.
- **Payment stays on the website**, so the app never handles card data. That's
  a genuine security advantage and it's worth keeping deliberately rather than
  losing it by accident later.
- **The three apps trust each other completely** through same-origin
  localStorage. Whatever replaces that bridge needs to decide what the member
  app is actually allowed to ask for — right now it could ask for anything.

**Worth deciding early, because they shape storage**

Where member data lives and who can read it; whether check-in notes are
private to the member or readable by the coach (see the notes-feature
conversation below); how account recovery works; and what happens to a
member's data when they cancel.

## Accessibility — WCAG 2.1 AA before the real app

Chris's call (2026-09-04), alongside the security pass: he wants the app clear
of ADA exposure before it ships.

Worth being precise about the target. **The ADA itself specifies no technical
standard for apps.** In practice — DOJ actions, and effectively every
settlement — the standard applied is **WCAG 2.1 Level AA**, plus the platform
screen readers (VoiceOver, TalkBack) once it's a native build. Nothing in this
file is legal advice; it's engineering readiness. A real audit by someone who
does this for a living is worth buying before launch, not after a demand
letter.

**Already done (2026-09-04)**

- Every decorative SVG icon is `aria-hidden` — 30 of them were being walked by
  screen readers on top of the label the button already had.
- The Messages button had no label, so its accessible name came from the
  unread badge: it announced as "4, button" on every tab.
- Habit remove buttons announced as "✕". They name their habit now.
- A visible `:focus-visible` ring. Six input rules set `outline: none`; some
  replaced it with a focus border, but the RPE slider and the rest-overlay
  weight field replaced it with nothing, so a keyboard or switch user lost the
  caret completely. That's 2.4.7, a straight AA failure.
- Contrast has been measured rather than eyeballed throughout, and the dark
  theme was audited element-by-element in the live DOM.

**Known failures, not yet fixed**

- **White on the brand blue is 3.15:1 and white on the coral badge is 2.94:1**,
  against a 4.5:1 requirement. That's the primary button, the Profile rows and
  every unread badge, in both themes. Fixing it means moving the brand colours,
  which is Chris's decision and is pending a conversation with his partner.

**Not yet assessed — needs its own pass**

- **Exercise video alternatives — largely already satisfied** (corrected
  2026-09-05). The demo videos are filmed and silent. Captions (1.2.2) apply
  to *audio* in video, so they don't apply here at all — the relevant criterion
  is 1.2.1, which a text alternative conveying the same information satisfies.
  `EXERCISE_LIBRARY.technique` is that alternative and already exists for every
  exercise. No refilming, no voiceover, no caption tracks.
  What's left is narrower: make sure every exercise actually *has* technique
  text (the admin validation report would catch the gaps), and that the text
  genuinely describes the movement rather than just cueing it.
- **Timing** (2.2.1). The app is built out of countdowns. There is an explicit
  exception where timing is essential to the activity, which exercise timing
  plausibly meets — but that's a position worth writing down deliberately
  rather than discovering under challenge.
- **Reflow and text resize** (1.4.4, 1.4.10) — 200% text and 320px width
  without losing content. Untested; the two-line exercise rows and the fixed
  column widths in the team standings are the likely trouble spots.
- **Native screen reader support.** Everything above is the web layer. A
  wrapped app has to be walked with VoiceOver and TalkBack for real, by hand.
- **Motion.** `prefers-reduced-motion` is honoured in two places already; the
  rest of the app's transitions haven't been checked against it.

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

- **Median RPE per workout, in admin** (Chris, 2026-09-17). On every workout in
  every program, so he can see whether he's pitching them hard enough or too
  hard. Median rather than mean is the right call and his own — RPE is an
  ordinal 1-10 scale where one brutal outlier would drag an average around.

  **The display is the easy half.** RPE is already captured properly: the
  member sets it on the completion screen and `saveCompletions()` persists it,
  so it is real member-entered data, not a placeholder. Aggregating and
  rendering it is maybe an afternoon.

  **The blocker is that admin cannot see it.** Member completions live in the
  member's own `localStorage` under `burnclub-completions`, and there is no
  bridge to admin — unlike circuits, messages, teams and benchmarks, which all
  have one. This is not an oversight to patch with another bridge: a member's
  completion history is *their* device's data, and every member's has to reach
  one place for a median across a workout to mean anything. It needs the
  backend. Filed here rather than under "blocked on a backend" only because
  the aggregation and the UI can be built and tested against seeded data first.

  **What's there to test against is thin.** `ACTIVITY_FEED` carries
  `workoutTitle` and `rpe`, but it is 12 entries across 5 workouts — so
  **180 of 185 circuits have no RPE at all**, and of the five that do, the
  medians rest on 1 to 4 data points. Building it against today's seed would
  show nothing on 97% of workouts. Either seed richer demo activity first
  (and say so in the UI), or wait for the backend.

  **Show the sample count next to the median, always.** The entire point is
  deciding whether to change a workout, and "median 8, n=2" is not a reason to
  change anything while "median 8, n=40" is. A median with no n invites exactly
  the wrong call. Worth a minimum-n threshold below which it says "not enough
  data yet" rather than printing a number that looks authoritative.

  One more thing to settle when it's built: `ACTIVITY_FEED` joins to workouts
  by **title string**, not id — the same weak key as everywhere else. Renaming
  a workout would silently orphan its RPE history.

- **Workout & program import spreadsheet** (Chris, 2026-09-15). A defined
  spreadsheet format that the admin app can read to create programs and
  workouts in bulk. Two distinct jobs, and they pull the design in different
  directions:
  1. **Migration** — getting the existing programs out of the old app and into
     this one. One-way, one-time, tolerant of mess, and the volume is the
     problem (~600 workouts).
  2. **Authoring** — Chris builds programs in Excel by preference, because a
     grid shows progressions across weeks and makes it obvious which exercises
     are under-programmed. A screen full of cards does not. This one is
     ongoing, and it is the reason the feature is worth more than a migration
     script.
  Job 2 means this should not be a one-way importer. If Chris keeps authoring
  in Excel after launch, the sheet is a working surface and edits will flow
  both ways — export-current-program-to-sheet matters as much as import. Decide
  that early; retro-fitting round-trip onto a one-way importer means matching
  rows to records that have no stable ids, which is the expensive version.
  Open questions for that session: what identifies a row across a re-import
  (exercise name is not stable — a rename silently orphans the video and cues);
  how sets/reps/tempo/progressions are laid out per row; whether structured and
  rolling programs share one sheet shape or need two.
  **This and the validation report below are the same piece of work.** Bulk
  import is exactly where a typo'd exercise name fails silently, and the
  report is what makes that visible. Building the importer without it means
  importing 600 workouts and finding the breakage by hand.

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

- **What the app is actually called** (raised 2026-09-19, parked by Chris until
  it matters). Working assumption: **Burn Club by KY Fit**. Code now uses it
  consistently, so there is one name rather than four drifting variants — but
  it is provisional, not settled.

  It stops being cosmetic at two moments. It becomes the **App Store listing
  name**, which is what members search for and what has to match what they were
  sold. And it is the **email sender name**, where a mismatch between the brand
  someone bought from and the name in their inbox is part of why an invite gets
  filtered — the first one landed in spam.

  The underlying question is which name members actually say. Burn Club is the
  program, KY Fit / Kelly Yager is the brand, and they bought through
  kellyyager.com. Chris and Kelly decide; don't arrive with a preference.

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
