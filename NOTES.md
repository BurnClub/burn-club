# Burn Club — open notes

## Start the next session here (2026-10-02)

**Workout flow — supersets, straight sets and static holds all done.**
Per-round rep schemes (`scheme: [10,8,8,6]` on a superset exercise), the demo
strip with its pause, weights moved to one screen per block, the round line
under the heading, and the overview button on the block pill. What remains is
under "Agreed, not yet built".

**Per-set weights work end to end** (2026-10-02). `supabase/12-per-set-lifts.sql`
is run, and Chris logged a real superset on his phone: three rows for the
kettlebell swings, labelled Round 1-3. The old model kept one of those three.

**Admin → member content is phase 6, still after testers.** Nothing authored in
admin can reach a member: admin writes to its own localStorage, and the member
app reads workouts from the bundled `data.js`. For the trial Chris's spreadsheet
comes to me and goes in through `data.js` — which means every content change,
including a typo in a workout, costs a push. He has accepted that, and wants a
real set of workouts loaded before testers arrive.

**The tour replaying every session is fixed** (2026-10-02) along with the worse
bug under it: preferences are one row, so a device with empty localStorage was
pushing its defaults over everyone's. Preferences are a replacing store now.

---

**The videos are live in the app.** All 375 are uploaded to Supabase Storage and
playing: silent, looping, starting on their own when the frame appears. The 299
exercises with no video keep the old placeholder frame.

Resuming a demo when the app returns to the foreground **works — Chris
confirmed it on his phone on 2026-09-30.** It could not be tested here at all:
the browser pane keeps the page hidden, and a hidden page cannot start playback,
which is the very state the code recovers from. Anything touching
backgrounding, autoplay or screen lock needs a real phone, not this browser.

**Unfinished-workout banner (2026-09-30, Chris).** Leaving a workout always
saved it, but the only sign was a toast that vanished — you found out by
reopening the app. Home and Workouts now carry a banner: the workout, which
block you're on, and how long the resume is still offered. Past that window it
becomes the log-as-partial-or-discard question the overlay already asked.
**Nothing auto-logs** — Chris's call, so a member's record never gains an entry
they didn't agree to.

**Palette (2026-10-01).** Kelly's new palette is in — `palette.css` holds her
tokens, `style.css` maps the app's own 91 names onto them. **Chris doesn't like
the cream page background (`--cream` #FAF7F2)** but is shipping it to see what
Kelly thinks — he is discussing it with her and will decide next session. It is
one value in `palette.css`; changing it moves the whole app.

**Card titles — DONE 2026-10-19.** Was: "Community Buzz" looks like it is
hanging off the edge of its card.

Measured every card title on every tab at phone width first, which changed
what the fix was. **Full-width cards were never the problem** — every title
there has 157-233px of slack. It was only the two half-width Home cards, and
the cause was not the title size but the BADGE: a 162px card spends 18+18 on
its own padding and another 28+8 on the badge and its gap, leaving the title
88px. "Community Buzz" needs 115 and wrapped. "Daily Habits" needs 84 and fit
with four pixels to spare — luck, not a fix.

**Tried and rejected: stacking the badge above the title.** That gave the
title the full 124px and put both on one line, but Chris: "I don't like that
the title is sitting below the icon. We need to keep it inline with the icon,
even if that means putting community buzz on two lines centred vertically to
the icon." A badge beside its title is what every other card does, and
consistency beats a line break. **Do not re-stack it.**

The actual fix is one word. The row was `align-items: flex-start`, so a
two-line title hung off the TOP of the badge with its second line dangling —
which is what read as falling off the card. `center` makes the wrap look
deliberate. Verified by comparing midpoints, not by eye: title and badge
centre to within 2px on both cards, and the cards stay the same height.

Degrades sanely at 320px (iPhone SE): the title still wraps inside the card,
no overflow, no horizontal page scroll.

**Where the palette landed (2026-10-01).** Kelly's colours throughout, but a
good way from her intent, which puts every card on its lightest tint. Chris's
first reaction was "everything is too pale".

- **Workouts card: solid `blue-500`**, the brand blue itself, white title at
  3.17:1. The lightest blue a white title survives — nothing smaller may sit on it.
- **Every other card: pale tints**, `jade-100` and `#FBEADC`.
- **Icon badges on all 13 sections** — this is what makes the pale cards work.
  One saturated mark each, **coloured by the card it sits on, not by subject**,
  scoped by card class in `style.css`. Two exceptions: white badge on the solid
  blue card, blue badge on a white card, the only cases where matching the
  background hides the badge.
- **Gold is retired.** Surfaces that were gold take the community fill; marks
  take `#F1A07F`. The Gold *team* keeps its own colour in `data.js` — don't
  recolour a team called Gold.
- **Category chips are off the workout cards**; only the tick and date remain.
  The scheduled-day label on upcoming cards was kept: it says *when*, not *what kind*.
- **The bright accent works on filled shapes, not on words.** `#F1A07F` is
  1.78:1 on a pale card, so dots and badges can take it and 11px text cannot.
  Small text in that family uses `--persimmon-800` (#8A4522).
- **Empty states don't get cards** — the wearable prompt sits on the page.

**Kelly hasn't been told** we moved away from her tint-only system. Her mockup
anchors Home with a strong "Today's pick" hero card and keeps everything else
pale; Chris chose not to build the hero, which is why the Workouts card carries
the weight instead.

Three grounds were previewed for him on 2026-10-01 (browser only, nothing
committed): cream #FAF7F2, pure white #FFFFFF, and a barely-off-white #FCFBF9.
**If pure white wins, check the white cards first** — `--card-white` is #FFFFFF,
so those surfaces lose their separation from the page and need their own edge.
#FCFBF9 avoids that at 1.02:1, which is why his old #FDFBF7 worked.
Still open: the admin app is untouched (its own 82 colours — follow or not?),
the three fonts load from Google's CDN which breaks offline and the App Store
build, and red still marks "down" deltas.

**Phase 4 — offline, done 2026-10-01.** Five things:

1. **Opening with no signal no longer signs a member out.** A network failure
   during the member lookup was being read as a bad account, and `signOut()`
   stranded them: they could not sign back in without the connection they
   didn't have. The profile and program are now cached (`burnclub-auth-cache`,
   cleared on sign-out, never handed to a different user id), and only a real
   account error signs anyone out.
2. **The app itself opens offline** — `sw.js`, registered from `index.html`.
   Network-first with a cache fallback, so a deploy is never masked by a stale
   cache; fonts are cache-first. Supabase is never cached: a cached API response
   would be a lie about what is saved. **Bump `CACHE` in `sw.js` when editing it.**
3. **The "not backing up" warning stopped crying wolf.** It fired after five
   retries at 30s — two and a half minutes without signal, every gym session.
   Offline failures no longer count. Instead, work stranded for 24h warns once,
   which is the case a one-device member can never spot for themselves.
4. **Reconnecting uploads immediately** rather than waiting out the 30s timer,
   and re-queues anything a previous page load left dirty.
5. **A boot screen** replaces the login form flashing before auto sign-in.

`tests/sync/run.sh` is 34 tests now. **It also catches crashed test files:** an
exception inside the async body prints nothing, so a broken test used to count
as "0 passed, 0 failed" and read as success.

Next:

1. **Check the tags on the 11 exercises added from videos** — see below.
2. **Phase 4** (offline and states), then **the workout-flow rework**, which is
   Chris's top pre-tester priority.
3. Film or rename the remaining 299. Not a naming problem — those clips don't
   exist yet.

**Cover frames in admin** (2026-10-07). The Exercise Library's cards show a
still taken from 50% through each clip, and play a preview after the pointer
rests on one for 450ms. Two things are worth knowing before touching it:

- **Do not give each card its own `<video>`.** The first build did, seeked each
  to its own midpoint, and nothing rendered — 450 media elements on one page is
  past what a browser keeps alive, so they sat decoded but unpainted. The cover
  is now an `<img loading="lazy">` and there is exactly **one** `<video>` on the
  page, moved into whichever card is hovered.
- Posters are `<id>.jpg` beside `<id>.mp4` in the same bucket, generated by
  `import/make-posters.sh` and uploaded by the same script as the clips. The app
  derives one URL from the other, so there is no second field to keep in step.

The preview cannot be verified in the browser pane: the page is always
`visibilityState: "hidden"` there, and Chromium pauses video-only background
media, so `play()` rejects with AbortError. Same wall as the demo-resume work.

### Where we are with the videos

**The masters live on the CJV SSD, at `/Volumes/CJV SSD/Burn Club Exercises`**
(2026-10-08 — consolidated off the Extreme SSD, where the folder was first
called EXERCISE LIBRARY).

**Every master is on the CJV SSD, verified** (2026-10-08). Consolidated off the
Extreme SSD and checked by checksum rather than by eye — 558 files, all
identical:

- `Burn Club Exercises` — 104 (the October batch, `Duplicates` included)
- `EXERCISE LIBRARY` — 441 (September, with `_duplicates`, `_too-long` and
  `_not-in-library`)
- `Duplicate Exercise Videos` — 13

Matching names and sizes is what a copy looks like when it has silently
corrupted a file; the checksums are what rule that out. Worth the same pass
before erasing any source drive in future.

Compression is one way — 720p, CRF 26, audio stripped — so a higher-quality
re-encode, a different crop or a better poster frame can only come from a
master. That is the reason to keep them.

**Second batch, 2026-10-07: 104 more clips, already slug-named by Chris.**
26 of them turned out to be duplicates of demos already live — he spot-checked
three, all matched — and sit in `Burn Club Exercises/Duplicates/` rather than
being deleted. Of the 78 left: 34 matched an exercise id outright, 16 were
spelling variants of one, and 28 went to Chris as a numbered list with my best
guess each (the same batch rhythm as last time: he replies only with the
numbers that are wrong).

The check that earned its keep was looking for **two clips landing on one
exercise**, run across all 78 rather than just the ones in question. It found
two, both invisible from the list Chris was answering: `t-spine-rotation.mp4`
already matched T-Spine Rotation by name while he was assigning a second clip
to it, and the same for Low Kneeling Lat Pulldown. He re-cut both — the plain
T-Spine clip is Kneeling T-Spine Rotation, and `-to-elbow` is new. Ask about
collisions before showing a batch list next time; the 34 exact matches were
never put in front of him, which is what made the question unanswerable.

**14 exercises the library had no entry for** came out of this batch and are
added to `data.js` and `admin/data.js`. Their tags are copied from the nearest
sibling and are my guesses, not his — same unchecked caveat as the 11 added on
2026-09-28.

All 25 of those now carry a **"New" tag** so Chris can work through them
(2026-10-07, his ask). It rides in `bodyParts` rather than being its own field,
because that is what the Filters popup and the exercise edit modal already
read, so it needed no code: tick New in Filters to list them, untick it on an
exercise once its real tags are in, and when the list empties delete "New" from
`BODY_PART_TAGS`. Admin-only — the member app never reads `bodyParts`. Nothing
in the library is *literally* untagged, which is what he asked for; these are
the ones whose tags are mine.

**The Bear Plank demo currently live is the wrong clip** (Chris, 2026-10-07).
The new `bear-plank-quadruped.mp4` is the right one and replaces it. What the
old one actually shows is unidentified — it may belong to another exercise
that is now silently wrong too, so it is worth watching before the next batch
goes up.

As of 2026-09-28:

- **375 clips in the main folder, every one named to match an exercise id.**
  Worked through with Chris in batches of ~20 in chat: my best guess per clip,
  he replies with only the numbers that are wrong. Far faster than the
  spreadsheet, which is stale and can be deleted
  (`~/Desktop/burn-club-video-matches.csv`).
- **Uploaded and serving.** All 375 are in the public `exercise-videos` bucket
  (`supabase/11-video-bucket.sql`), pushed there by `import/upload-videos.sh`,
  which Chris runs himself with the service key in his environment. Every one
  was fetched back from its public URL to confirm. `videoUrl` in both data files
  points at them.
- **Compressed copies: `~/Desktop/burn-club-videos`, all 375, 339 MB.**
  `import/compress-videos.sh` with ffmpeg 9: 720p, CRF 26, no audio, faststart.
  11.4 GB in, 0.4 GB out, about 1.1 MB a clip, nothing failed. Chris approved
  the quality from a sample. Re-run it after any rename: it skips names already
  done, so delete outputs whose name no longer exists in the source folder.
- **Holding folders on the drive**, all Chris's to empty:
  `_duplicates/` (21, spares and second takes), `_too-long/` (29 over 45s,
  15 GB, he is re-cutting them), `_not-in-library/` (17 clips whose exercise
  doesn't exist, including `spring-ig-2.mp4`, which isn't an exercise at all).
- **`._*` files** — 429 of them, macOS sidecar files that appear when copying to
  an exFAT drive. Junk. Every script here skips them; never upload them.
- **Exercise count is now 674, up from 663.** Eleven were added from videos with
  no matching exercise: Alternating Reverse DB Lunge, Pronated to Supinated Cable
  Tricep Extension, Pulse Squat, Banded Squat, Reverse Lunge to Kick, Single Arm
  DB Snatch, Single Arm DB Upright Row w/ Front Raise, Single Arm Lat Pulldown
  Complex, Supinated DB Chest Press, Supinated DB Curl, Supinated DB Row.
  **Every one has tags copied from its nearest sibling and no technique text.
  Chris has not checked them.** Banded Squat was his `resistance-band-squat`
  file, renamed to match the library's "Banded" convention — his to veto.
- Sizes were the whole problem: the median camera clip is 14 seconds and 30 MB
  (~18 Mbps), which is why nothing can be uploaded straight off the drive.

## Programme building — changes before the migration (2026-10-14)

Chris wants a few builder changes first, which is the right order: the
migration turns this data into tables, so anything that changes the SHAPE of a
programme, workout or block is cheap now and a second migration later.

1. [x] **A note per week folder, shown to the member** — done. Written on the
       week's card in admin (on blur, no second button), read at the top of
       that week in the member's Calendar. Structured programmes only; Chris
       explicitly left on-demand folders out for now.

       **Keyed by programme + week number, NOT by folder id.** The folder ids
       are three conventions for one idea: `ff-home-week-N` for Fit &
       Functional, `tmb-week-N` for 30 Minute Burn, and `<programId>-week-N`
       from `ensureWeekFolders()`, added 2026-10-08. Keying the note on the id
       would make the member app learn all three and any future fourth.
       `memberWeekNoteKey()` in admin emits the logical key and `WEEK_NOTES` in
       data.js consumes it.
       **Unified 2026-10-14, ahead of the migration.** One convention now:
       `<programId>-week-<n>`. The seed is fixed and
       `normaliseWeekFolderIds()` repairs state already saved in a browser,
       renaming the folder and every workout citing it in the same pass —
       otherwise a workout is orphaned and vanishes from its week.
       Derived from each folder's own `program` rather than a list of known
       prefixes, so it also catches a convention nobody has invented yet.
       Idempotent, and it refuses to rename when the target id already exists:
       two folders collapsing into one would silently move workouts between
       weeks, which is worse than one odd id.

       **Chris's naming holds up.** He builds a new Fit & Functional every two
       months — "26' Nov-Dec Fit & Functional" — and asked whether folders
       keyed on the programme would collide. They will not: a new programme id
       is `slug + Date.now()`, unique even for two identically-named
       programmes, and editing a programme deliberately does not change its id,
       so a rename cannot orphan a folder.

2. [x] **The Calendar is pinned to the programme week** — done, same day.
       It ran today → today+6, so from Tuesday on it straddled two programme
       weeks: the heading said one thing and half the rows belonged to the
       next. Home's week strip had always followed the programme week, so the
       two screens disagreed about what "this week" meant.
       Past days stay in the list and stay tappable (Chris: "keep past days
       tappable") — a missed Tuesday is still openable on Thursday. They are
       receded, which says "behind you", not "locked".

3. [x] **Preview next week** — done 2026-10-16. "Week 3 ›" steps forward,
       "‹ This week" comes home. Bounded both ways: never before the member's
       own week (what is behind is in Progress) and never past the last week
       of the programme, so the forward button simply disappears at the end.
       Back is a RESET, not a shift — written as a shift first, which the
       bounds check would have refused outright, leaving a button that looked
       fine and did nothing.
       **Capped at ONE week ahead** (Chris, 2026-10-16: "I don't need them
       moving forward a bunch of weeks, just one"). A look ahead is for
       deciding whether to swap a session or book a gym slot; reading week 7
       in week 2 is browsing, not planning, and it invites "why has this
       changed?" while the programme is still being written. `calendarMaxWeek`
       is one function used by BOTH the bounds check and the button's hidden
       state — two copies of that arithmetic is how you get a Next button that
       shows and then refuses, which is the same bug as the paragraph above.
       Verified by calling `shiftCalendarWeek(1)` from the console with the
       button hidden: refused, so the cap is in the logic and not just in what
       is on screen.

       **Two bugs the preview surfaced, both older than it:**

       - `memberProgramPosition` computed `totalDays` as `template.length` —
         the number of ENTRIES, not the last day. True only while every day
         held exactly one, which stopped being the case on 2026-10-10 when
         cardio and reminders could share a day with a workout. An 8-week
         programme with 10 extra items read as **10 weeks**: "Week 2 of 10",
         a completion card that never arrived, and two weeks of empty days
         after the programme had really ended. Found because the preview
         button offered a Week 9 that does not exist.
       - A day INSIDE the programme with no entry read **"Program complete"**
         — mid-week, often with a Rest Day the day after it. There were two
         empty states where there needed to be three; a gap now says "Nothing
         scheduled", which also lets Chris spot his own while building.
6. [x] **The + moved onto each day, and the card text lightened** —
       2026-10-16, Chris. One blue + per day row instead of one for the whole
       week: the day you tapped IS the date, so the popup stops asking for one,
       which was its only question a member could answer wrongly. The heading
       says which day instead, so nothing is hidden — only settled. Not offered
       on a day already past.
       Titles dropped to normal, the line under them to light, and the
       HOME/GYM pills and the + to normal as well. The pills keep their
       uppercase and letter-spacing, which is what makes a 10px label legible
       — the weight was not doing that work.
       **"✓ Done" is still 800 and deliberately so:** it is the one mark on a
       card that reports a fact rather than describing the workout, and it is
       the thing a member scans a week for. Flag it if it now looks out of
       place against everything around it.
       **The font link had to change first:** Nunito was loaded at 600-800 and
       Inter from 400 up, so asking for 300 or 400 would have rendered as the
       nearest loaded weight and changed nothing visible. Verified with
       `document.fonts.check()` that both faces are real rather than
       synthesised.
       The week nav then moved up onto the title row, since "+ Add" leaving
       had turned the header into a title and a gap with a row of buttons
       beneath it.

7. [x] **Home's "Coming Up" shows only today** — 2026-10-16, Chris: "it looks
       a little too busy ... just show what is on the calendar for today,
       thats it." It had been the next three items from today forward, so on a
       Tuesday you read Wednesday and Thursday's sessions before knowing what
       to do now. Looking ahead belongs to the Calendar, which got a week
       preview the same day. Retitled "Today".
       Three states where there had been one: a session, a **rest day** said
       back as a rest day rather than falling through to an empty state as if
       the schedule had a hole in it, and genuinely nothing.
       **A finished session stays on the card, marked and receded**, instead of
       dropping off the way the forward-looking list dropped it — an empty
       section on a day the member has already trained reads as "nothing
       scheduled", which is the opposite of what happened.
       `upcomingScheduledItems` and `upcomingDayLabel` were left with no
       callers and have been deleted; git has them if the three-day view is
       ever wanted back.
       **Both Home and Gym now show**, as two cards tagged accordingly.
       The old list took `const [circuit] = workoutsForSlot(...)` — the first
       variant only — under a rule that one card per session was enough and
       the Home/Gym choice belonged on the Calendar. That rule existed to stop
       a three-slot list reading as six cards; a one-day list has nothing to
       crowd, and a combo member who could not see the choice on the screen
       they open first was being asked to go looking for it. Completing either
       variant still closes the day: the other card drops and what is left is
       the one that was done, marked.
       Two self-inflicted bugs on the way, both worth remembering.
       `todayScheduledItems` itself was **deleted** while clearing out those
       two dead functions above — the removal started at a comment that sat
       directly beneath it. Home would have thrown for every structured
       member. The `jsc` syntax check passed, because a function that is gone
       is valid JavaScript right up until something calls it: syntax checking
       proves a file parses, not that it works.
       And the variant tag was written by a script that failed its own
       assertion partway through and therefore saved nothing, while reporting
       the earlier steps as done. Caught by asking the rendered page whether
       the tag was there, rather than by trusting the edit had landed.

4. [x] **More than one drop set per exercise** — done 2026-10-15. There was
       only ever one because "+ Add Drop Set" lives in the combine bar, which
       only appears for a SINGLE-exercise block — and adding a drop turns that
       block into a superset, so the button that made it disappears the moment
       it is used. A "+ Drop Set" now sits in the superset's own header beside
       "+ Exercise", appending a drop that copies the LAST row rather than the
       first: a second drop drops from the first drop, which is the order
       someone building one is thinking in.
       On the block header, not the exercise row, because a per-row control
       was deliberately rejected in August — the row should not gain a
       permanent column for something used rarely.
       The member app already handled any number of drops; only the builder
       could not make them. What it did NOT handle: the workout breakdown
       listed a drop as an ordinary exercise, so a stack read as "Lat Pulldown
       (10 reps)" four times over. Marked now.

5. [x] **The block header stopped pushing its buttons off the edge** — fixed
       2026-10-15 from Chris's screenshot, where an EMOM's "+ Exercise" and
       "Split" sat past the right edge. `.inline-field` was `flex: 0 0 auto`,
       so the number boxes never gave up a pixel and the buttons absorbed the
       whole shortfall. They shrink first now, to a floor that still holds two
       digits, and the buttons do not shrink at all: a number box is readable
       at half its preferred width, a button you cannot reach is not a button.
       `flex-wrap` added as a last resort below that floor — in practice the
       builder column has a 460px minimum so it never fires, but if it ever
       does the result is ugly rather than broken.


## The workout player — the 2026-10-16 pass

Chris: "I keep coming back to this page ... it is almost there, but it has
never felt right to me." Every detail on the superset screen had already been
tuned — ticks removed, numbering circles removed, weight moved off the rows.
The problem was underneath the details, and fixing it opened up the rest.

### A superset counts SETS, not rounds

"Round is for circuits." A round is a lap of several stations; going down two
exercises back to back and resting is one set of the pair. Changed in five
places, not just the heading: the big heading, the button, the rest screen
between sets, the overview's summary line ("4 sets · rest 90s between sets")
and the Before You Start explainer. Circuits and AMRAP keep *Round*.

The fifth place is the one to remember. The superset weight-log labels are
persisted as `set_label` — "what the member saw" — so a record written before
today reads "Round 1" and one after reads "Set 1" for the same thing. Done NOW
deliberately, while the only weight history on the database is Jordan's demo
account; after six testers have a month of it, it would not have been worth it.

### The hierarchy was upside down

The 39px slot belongs to `setPlayerExerciseHeading`, built for the
single-exercise player where the exercise name IS the thing you read from
three feet away. A superset has no single name, so the code made one up:
`${length}-Exercise Superset` — a description of the block's SHAPE, which
cannot change while you are inside the block, printed in the largest type on
the screen, while the set, the one thing that does change, sat small
underneath. On a descending scheme the set number is the only way to know
which numbers apply to you. The set now takes the big slot. A one-movement
superset — reps then a hold of the same lift — keeps its name there and keeps
its separate round line.

### Space that was paying for furniture that no longer exists

Chris: "I don't like how there is so much empty space in the exercise lines."
Measured rather than guessed, and most of it was structural:

- BOTH lines were indented **32px to clear a numbering circle removed on
  2026-10-06**. 32 of the row's 306px, paying for nothing. The divider was
  inset to clear the same ghost.
- `.amrap-row-line2` reserved a 26px min-height for the weight input that can
  sit there. A plain "10 reps" is 16px, so every row carried 10px of air.
- 12px top and bottom put another 24px around two lines totalling 36px.

73px tall for 36px of text, floating 32px in from a card edge it should have
been flush with. Then reps moved to the right of the name (Chris tried it both
ways and picked one line), and the card went **150px to 84px**.

Then back the other way, deliberately: "the text is too bold, and I think we
can add 20% more space in the card." Name 700 to 400, reps 500 to 300, demo
caption 800 to 400 — the rule he set on the Calendar and Home cards, title
normal and the line under it light. Card 84px to 100px. **Inter loads a 300 and
Nunito does not**, which is why nothing here asks the heading face for a light.

### Set numbers outside the card, and the bracket

From Chris's sketch: cut the straight-sets card off before the number, so the
numbers run down the cream outside it. Dark circle, white numeral — white read
as a hole punched in the page, periwinkle was too quiet, and `--text` is the
app's own black (nothing in Burn Club uses a true #000).

Two things that came out of it:

- The number is a child of the row, so **it fades when the set is done** — you
  read your progress down the left column without looking inside the card.
  That was not designed, it fell out, and it is better than what it replaced.
- The whole row has been the button since 2026-10-05, so a tap on a number now
  sitting OUTSIDE the card still had to register. Verified: it does.

Then Chris saw it and said "this may be what I have been waiting for on the
superset ... anything that connects the two." The superset card now carries
the same marker, centred against the whole card, **plus a connector line** he
picked over the number alone. The number says which set; the line is what says
the exercises inside are one thing. Two rows in a card look identical whether
they are a superset or just two exercises listed — nothing on the screen said
otherwise except the word "Superset" in a pill.

### The button says what it does

"It marks the set complete, and triggers the rest period. So lets say that."
Two lines, no checkmark: **Mark Set Complete** / *Starts your 90s rest*. The
rest length is read off the block, and on the last set it says "Last set —
finishes this block" instead, because no rest phase is pushed there and the
old copy would have promised one that never comes.

The button had to go from `display: block` to `flex` in JS — an inline style
beats the stylesheet, so the two lines would have sat side by side whatever
the CSS said. The sub-line is Inter: Nunito has no weight below 400 to say
something quietly in.

### "Up next", anchored to the bottom

Built for the superset, then "add it everywhere **where it is applicable**".

One helper, one call site at the end of `renderPhase`, rather than a copy in
each branch — the branches already disagree about enough. `nextWorkingPhase`
skips rests and the logging screen ("up next: rest" is not news; the button
already said it), `previewLinesFor` describes whatever it finds, and the
preview hides when there is nothing after.

Where it lands:

| screen | shows |
|---|---|
| Superset | the next set, with its reps — the original case |
| Interval work | the next station and its work time |
| Last block of any kind | nothing |
| Last set / last station | nothing |
| Crossing into a new block | that block, named, with what it opens with |
| Rest, log-weights | nothing — rest already has its own Up next |
| Single-block Straight Sets, Ladder, AMRAP, EMOM, Cardio | nothing |

It reads the next PHASE, never recomputed from the block, so it cannot
disagree with the screen it is predicting. `margin-top: auto` inside the
player's flex column puts it on the floor on a tall phone and lets it follow
the button on a short one, instead of overlapping.

**Open:** on an interval circuit every work screen gets one, and the rest
screen between stations already says "Up next" 40 seconds later. Arguably the
work screen's is the useful one and the rest screen's is the echo — but if it
reads as noise, `previewLinesFor` returning `[]` for `kind === "work"` removes
it and nothing else changes.

### Tried and REVERTED: videos merged into the list rows

The first attempt replaced the demo strip with one row per exercise — small
thumbnail, name, reps — on the grounds that it removed duplication and put
both exercises on screen without a sideways scroll. Chris, same day: "not a
fan of the videos inside the lines. I liked having them up above, i think it
matched what we are doing in other spots, and i like that they are big enough
to see without having to squint."

Both reasons beat the one they overruled: the strip is the pattern used
elsewhere, and a demo you squint at is not doing its job. **Do not re-propose
shrinking these.** The duplication was real but only the reps were worth
removing — the demo caption keeps the name, since that is what says which clip
you are looking at.

### Two bugs made and caught on the way

- **A finished demo rewinds to its first frame** now, because these clips end
  dark and a played-out demo sat on a black rectangle. That rewind is a seek,
  a seek fires `canplay`, and the cold-start handler
  (`v.oncanplay = () => tryPlayDemo(v)`, there because `preload="none"` makes
  the first `play()` a no-op) started the clip again — forever. The live
  elements said `stopped: "1"` with `paused: false` and a play count past its
  limit while the screen looked fine. One-shot now, and it checks the flag.
  **A standing handler plus anything that seeks is a loop waiting to happen.**
- The local server served a **stale `app.js`** through three test runs — the
  rename looked like it had not worked. `fetch(f, {cache: 'reload'})` on each
  file before reloading is what finally cleared it. Check the running page has
  the new code before believing a negative result.

## The Progress page, and settings that finally leave the building (2026-10-18)

### Colour, and a rule that came out of it

Chris tried the Workout Mix card in green and reverted it the same hour:
"cards that have a lot of stuff going on in them don't look good with any
colors other than white." A donut, a four-row legend and four counts is a lot
of stuff. **Benchmarks is the card on this page that can take a fill** — three
tiles with a number each and nothing for a colour to compete with — so it
moved above Check-Ins and the page now alternates white, blue, white, peach
instead of running two plain cards together with all the colour at the bottom.

The quote card was `var(--yellow)` = #F1A07F, the **saturated persimmon used
for small marks and section badges**. So the one full-width panel on Progress
was shouting in a colour every other surface only whispers in. It now takes
`--card-community` (#FBEADC), exactly what Community Buzz is painted with —
which the note at the top of style.css had already said these card-like
surfaces should do, and this one never did.

It also gained a horns badge, because Chris is right that the pale fill needs
anchoring. Drawn as a line icon to match the other section badges, and
**judged at 19px rather than at full size**: a version with a thumb (closer to
his reference) collapsed into a blob at real size, and the thumbless
silhouette reads as horns far more clearly.

### The stat bubbles are a jade ramp

The palette is three hues — palette.css calls persimmon "the one warm accent"
— and the page was already carrying blue three times and persimmon twice. So
the minutes bubble took the DARK end of the hue its neighbour already used
rather than a fourth colour that does not exist. The two bubbles are one pair,
and light/dark of a single hue says they belong together.

| | fill | text | contrast |
|---|---|---|---|
| minutes | jade-700 #3F7A5E | white | 5.05:1 |
| *a third would slot here* | jade-400 #9DBFA8 | ink | 6.67:1 |
| calories | jade-100 #E3EEE6 | muted | 4.54:1 |

jade-500 was the obvious midpoint and is **not usable**: 3.59:1 with white,
which the 38px number survives and the 11px label does not. The ramp works
because jade-400 flips to dark text.

**Three bubbles do not fit on one line** — 3×132 + 2×16 = 428px against 335px
on a phone. The row now wraps at full size, giving two over one centred, which
is what Chris sketched. The alternative was shrinking the number from 38px to
28px to save a row, which is paying in the wrong currency. `justify-content:
center` was already there, so wrapping needed one property and handles four
the same way.

### Admin Settings has never reached a single member

Found while making the Progress quote editable, and it is the headline here.

Every Settings panel — tour copy, FAQs, check-in wording, habit presets,
cardio types, support details — wrote to `localStorage` in the COACH's
browser, and the member app read `localStorage` in the MEMBER's browser.
Nothing connected them. The panel has been saying "members will see this the
next time their app loads", which was only ever true if the member was Chris,
on Chris's laptop. Same shape as the messages that sat in localStorage until
16-messages.sql, and as the staff policies is_staff() never matched.

**No migration was needed**, which is the good news: `app_settings` (key text
primary key, value jsonb) has existed since 01-schema.sql, 02-policies.sql
already grants it "signed-in members read / staff write", and
03-seed-content.sql already seeded nine keys. Only the client code was
missing.

- `fetchAppSettings()` / `saveAppSettingsToServer()` in supabase-client.js.
- Admin upserts on every save, and **says so when the push fails** rather than
  claiming success — "Saved on this computer, but not sent to members".
  Written back diffed against the defaults, so a value nobody touched keeps
  tracking the code instead of freezing at whatever it said the first time
  someone opened Settings.
- The member app loads them on sign-in, caches them for offline, and
  re-renders Progress if it is open. Not awaited: a gym basement must not get
  a blank screen while the network confirms some wording.
- Demo sessions skip it — the demo shows the app as built, not as one coach
  configured it.

That fixes every panel at once, not just the quote.

**TESTED AND WORKING** (2026-10-18). Chris edited the Progress quote in admin
and it appeared in the member app — "worked". So `is_staff()` does pass for a
real admin session writing `app_settings`, and the upsert's `onConflict: "key"`
behaves. Every Settings panel is now live, not just the quote.

### The quote card's badge, and what moving it exposed

Chris, after seeing it centred: "can we make the icon appear in the upper
corner like we have in all of the other cards?" Then, with a sketch: text to
the right of the badge, all lines starting at the same x, the card growing
downward if the quote runs long.

Moving the badge left exposed a 3px misalignment. The quote card had 16px of
padding; every `.home-section-card` has 18px plus a 1px border, so its badge
sat 3px left of every other badge on the page. Invisible on its own, obvious
once you scroll past four cards whose badges line up and one that does not.
All four now measure x=39.

Text went left-aligned with it: centred text beside a left-aligned badge has a
ragged left edge that fights the badge it is meant to sit with. `min-width: 0`
on the paragraph so a long unbroken word wraps rather than shoving the badge
off the card — the failure mode a free-text field invites.

Growth verified rather than assumed: a four-line quote took the card from 72px
to 100px with the badge unmoved at top-left and the text still starting at
x=85.

Left alone: the card still uses `--radius-md` where the others use
`--radius-lg`, so its corners are slightly tighter. Not raised as a problem.

### The quote itself

`APP_SETTINGS.copy.motivation`, edited in admin → Settings → Member-Facing
Copy. Clearing it hides the card rather than leaving a coloured blank — a
coach who empties the field means "no quote". Rendered with `textContent`, not
innerHTML: it comes from a free-text field and the day it holds an ampersand
it should read as one.

## Weeks start Monday (2026-10-18)

Chris: "we default the start of the week to Monday in everything we do."

`getDay()` calls Sunday 0, so `- d.getDay()` was giving Sunday weeks
everywhere. The fix is `- ((d.getDay() + 6) % 7)`, which maps Mon 0 ... Sun 6,
so a Sunday walks back six days to the Monday that began its week instead of
starting a new one. Verified across all seven days plus both edges on a
Sunday, which was the one day of the week where the old and new answers
differ most visibly.

**THREE copies of `startOfWeek` exist and must stay identical** — app.js,
data.js, admin/data.js. The last two are not cosmetic: admin tags a workout
into a week and the member app decides whether that week is the live one, so a
one-day disagreement silently publishes the wrong circuits with nothing on
screen to show for it. The warning is written into both files.

What moved:

- Home's week strip for ROLLING members, and Progress's "This Week"
- `completionsInRange("week")` / `completionsInPreviousRange("week")` — so the
  stat bubbles, the mix donut and every weekly sum
- The month grid's leading blanks, `(getDay() + 6) % 7`
- **The content rotation.** Chris chose to move his drop day rather than run
  two different weeks in one app. **A circuit dated to a Sunday now belongs to
  the week ENDING that day**, not the one starting it — date new ones to
  Mondays. Landed deliberately before the real Burn Club content was built.
- Admin's activity chart, which needed no edit: its columns come from
  `currentWeekStartKey()` and its labels from `getDay()`, so both follow.

What deliberately did NOT move, and should not be "fixed" later:

**Structured programme weeks stay anchored to the member's start date.** A
member who starts on a Thursday has their Week 2 begin on a Thursday, and the
Calendar, the "Week 2 · Day 4" counter and the schedule template's day 1..N
all depend on that. Forcing Monday would mean start dates had to be Mondays,
with a short or delayed first week for anyone joining mid-week. Chris was
asked directly and chose to leave it (2026-10-18). Verified after the change:
the Fit & Functional demo member starts Thu 2026-10-08 and still shows a
programme week beginning Thu 2026-10-15.

Not touched: `data.js`'s seed generator still treats Sunday as the demo rest
day (`date.getDay() === 0`), which is about which day is a rest day, not about
where a week begins.

## The admin export was lossy (2026-10-18)

Found while confirming the content-migration workflow with Chris, BEFORE he
built the real Burn Club programme.

`exportAllPrograms()` carried a comment saying "an export is a snapshot of
admin's own state" and then exported five hand-picked fields per programme:
id, name, durationWeeks, workoutsPerWeek, circuitsPerWeek. It silently dropped

- `benchmarks` — The Gauntlet and friends live on the programme, and the
  member app's Progress tab reads them
- `scheduleType` — which decides whether a member gets a Calendar at all
- `status`, `color`, `description`
- the entire `EXERCISE_LIBRARY` — workouts reference exercises by NAME, so an
  export carrying circuits but not the library cannot be rebuilt anywhere the
  exercises were never typed in

Now exports whole objects plus the library. Admin is not in the service
worker's SHELL list, so admin-only changes need no cache bump.

The workflow itself, confirmed: build in admin, Programs page → Export All →
send the JSON. There is no importer on the other end; the file is read and
turned into content, not loaded back into admin. And admin's state lives in
one browser's localStorage, so export often rather than once at the end.

## Macro targets (2026-10-19)

Chris, on the brief: "I do not want to be a food tracker whatsoever. I want
the member to see targets, and if we can influence people to track, just to
help build the discipline/habit — but more importantly, when they are
tracking, they are at the same time learning more about food, serving sizes,
where calories come from. That is the goal."

So there is no food in this feature. No meals, no entries, no food database.
The logging stays in MyFitnessPal, which is where they already are and where
it belongs. **Do not propose building a diary.** Nobody logs their food twice,
and a diary screen members ignore looks worse than no diary at all.

### Why MyFitnessPal is not integrated

Its public API has been partner-only for years — there is no self-serve
developer access. The route that does exist is **Apple Health**, which MFP
writes nutrition into, but HealthKit needs a native app and that is the same
wall the wearables feature hit. Parked behind the native build, which Chris
agreed to (2026-10-19). The schema below is shaped so daily actuals can land
beside the targets later without a rewrite.

### Two tables, deliberately opposite owners

`20-nutrition.sql`, run 2026-10-19.

- **`member_nutrition`** — calories, protein, carbs, fat, and a coach's note.
  The member may READ it and has no write policy at all. These are explicitly
  NOT in `health_profile`, which is the member's own jsonb and which the
  member edits: **targets a member can change are not targets.**
- **`nutrition_log`** — one row per member per day, two booleans. The member
  owns it; staff may read it (so a coach sees adherence before a check-in)
  and may not write it, because nobody should mark someone else's day as
  tracked.

**`hit_targets` is nullable, and that is load-bearing.** null is "didn't say",
false is "said no". A member who never tracked cannot answer whether they hit
their numbers. Defaulting it to false would quietly record a failed day every
time someone forgot to open the app.

Nulls in `member_nutrition` mean "not set", and the card hides entirely rather
than showing four dashes — the right default for anyone not on the nutrition
service.

### Where it lives, and why not Profile

Chris: "everything is too easily lost in the profile section ... I do want
these numbers to be visible, with the goal to be a few times per week."

It sits on the **training tab** — the screen opened on the way into a session,
which is 3-5x a week without anyone going looking.

**It is rendered into BOTH training tabs, and that is not redundancy.** The
two are mutually exclusive per member: rolling members have Workouts and no
Calendar, structured members have Calendar and no Workouts. A card on one tab
alone would have reached exactly half the members — Fit & Functional would
never have seen their macros.

The Workouts tab is now **"Program"**, Chris's call: it stopped being a list
of circuits the moment coach content that was not training landed on it. The
section inside keeps the name "This Week's Workouts".

### The two markers

One question, and the second only appears once the first is yes:

1. "Tracked your food today?" → Yes / Not today
2. (only if yes) "Hit your targets?" → Yes / Not quite

Asking both flat invites garbage, because the second is unanswerable without
the first. Re-tapping "Yes" on the first keeps the second answer; switching to
"Not today" clears it, because the question stops applying. Both paths tested.

Ten days of dots underneath, not fourteen (Chris: "14 days is too much, lets
see 10 and go from there"). Three states that mean three different things: not
tracked, tracked but missed, tracked and hit.

**Deliberately outside the three daily habits.** Members are capped at three,
so making them spend a slot on food tracking would tax the exact behaviour
this is trying to encourage.

### Calendar order, which changed twice in a day

Chris: "I don't like how after the second day, you have to scroll down to see
your workout." By Thursday of a programme week today's session was the fourth
row down — and the targets card had just made it worse.

Final order: **the coach's note, today, the targets, then the rest of the
week.** Chris moved the note back above today after seeing today-first: the
note frames the whole week, so it reads before the day rather than
interrupting after it. Today still precedes the targets and every other day,
which was the actual complaint. Structured members only.

**Three handlers broke silently when today moved out of the day list**, and
testing found them, not reading:

- the per-day **+** button, delegated to `#calendar-day-list` — so the one day
  anybody actually adds to had a dead button
- `data-open-circuit`, `data-remove-scheduled`, `data-complete-scheduled` and
  `data-coach-cardio`, all scoped to that id

All now cover `#calendar-day-list, #calendar-today`. **Anything new bound by
that id needs both.**

A previewed week has no today in it, and neither does a programme that has not
started or has finished. The pinned block and its label simply hide and the
list is the whole week — verified on Week 3.

### Open

- **Admin's macro fields are UNTESTED against the real database.** Same
  caveat the settings wiring carried: it needs Chris signed in as staff
  saving targets, then a member account reading them back.
- HealthKit import, parked behind the native build.

## The duplicated habits (2026-10-19)

Chris: "If you check 10 push ups, all of the boxes for 10 push ups get
checked." His screenshot showed TEN rows in a list capped at three — three
"10,000 Steps", three "100oz Water", three "Outdoor Activity", one
"25 Push-ups" — and the footer underneath cheerfully reading "3 of 3".

### Root cause: LOCAL, not the server — first diagnosis was wrong

The first call was "removals never reached the server, so the pull handed
them back". Chris's own query killed it: every account had `habit_rows` equal
to `distinct_labels`, and his held four rows, not ten. **The server was
clean.** The duplication lived entirely in one browser's localStorage.

The ten entries also carried only FOUR distinct ids, which is how we know.
The push upserts on `(member_id, habit_id)`, so ten distinct ids would have
produced ten server rows; four means the same habits were appended repeatedly
under the SAME id. That also explains the reported symptom exactly — identical
ids share one checked state, so ticking one ticked all three.

The likely mechanism is the one fixed alongside it: habit handlers bound with
a document-wide `querySelectorAll`, which stacks a listener per render, so one
tap can call `addHabit` several times. Three stacked listeners on one click
gives precisely three identical entries, and `addHabit` had no duplicate
guard to stop it.

**The `replace` fix below is still correct and still shipped** — a removed
habit genuinely never deleted server-side, which is a real bug waiting to
bite. It just was not the cause of this one. Keep the two separate when
reading this back.

The all-boxes-check symptom was downstream of that: `isHabitChecked()` keys
off the habit id, so three rows carrying the same id all render checked. The
checking logic was never wrong — the list under it was.

**Same label, different id** is the second half. `readHabitRows()` in admin
computes `row.dataset.habitId || slugifyHabit(label)`, so a Habit Library row
edited without a stored id gets a NEW id for the same label. The table's
primary key is `(member_id, habit_id)`, so those are entirely different rows
as far as Postgres is concerned — which is how the same label survived three
times over despite the key.

### What hid it for so long

`"3 of 3 habits set — remove one to add another."` was a **hardcoded
string**, shown whenever the count was >= 3. Ten habits read as completely
normal. Nothing on that screen could have told anyone anything was wrong. It
now prints the real numbers — forced to a broken state it reads "5 of 3".

### The fixes

- **`myHabits` is a REPLACE store now**, and in `REPLACE_STORES` so a device
  that did not edit the list never fires a destructive push.
- **One carve-out, and it matters:** an empty server does NOT clear local
  habits for `myHabits`, the way it does for the other replacing stores. A
  brand new account has no rows yet and `loadMyHabits()` has just seeded three
  defaults — clearing those would hand a new member an empty habits card on
  day one. They are kept and marked dirty so they push up and become real.
- **`dedupeHabits()`** on load AND on pull, by LABEL as well as id. Label
  matters because the drifted-id case is invisible to an id check, and two
  rows reading the same thing are the same habit however they are filed.
- **Self-healing.** An account already carrying duplicates is repaired on the
  next load and the repair written back — no manual pruning. Tested by
  planting Chris's exact list (ten rows, drifted ids, same interleaved order):
  it collapsed to three and kept the auto-tracking flag on the steps habit.
- **`addHabit` refuses a duplicate** by id or label. It is the only line that
  can grow the list.
- **Habit handlers were bound with document-wide `querySelectorAll`.** That
  adds a listener to every habit button on the page each render, including
  ones in a container the render did not replace — so those stack and one tap
  fires several times. All three are scoped to their own container now.
- **`MAX_HABITS`** replaces four scattered literal 3s.

### Verified on a real account (2026-10-19)

Chris opened the app on the affected device. It healed to three, the
replacing push rewrote his rows, and the database came back
`steps-10k / water-100oz / pushups-25` at positions 0, 1, 2 — contiguous,
so the set was rewritten rather than patched. App and database agree.

Worth knowing for next time: **the local copy wins.** The heal marks the
store dirty and the push replaces, so editing habits directly in SQL is
pointless — whatever the app settles on overwrites it. Change them in
Profile → Manage your daily habits instead.

### Still open

The cap of 3 is enforced in the app only; nothing stops the database holding
more, which is how Chris came to have four. Chris confirmed 3 is the real
limit (2026-10-19) and deleted one by hand. If it ever needs to vary per
member it should become a setting rather than `MAX_HABITS`.

To survey everyone:

    select habit_id, label, position from member_habits
    where member_id = (select id from members where email = '...')
    order by position;

## Program tab order (2026-10-19)

Chris: targets below This Week's Workouts, Cardio Log at the very bottom.

Both training tabs now follow one rule from opposite directions — **training
first, targets after.** On the structured Calendar that is today's single
session pinned at the top with the card below it; on the rolling Program tab
the workout list IS the page, so the card sits under it.

**The Cardio Log block is MOVED between tabs at runtime, not duplicated** —
structured members have no Program tab, so the node is relocated to Home for
them (2026-08-19). It is positioned with a marker element,
`#workouts-cardio-slot`, so moving the section means moving the marker with
it. Move only the section and the next profile switch yanks it back to the
old position. Verified both ways after the change: rolling keeps it last on
the Program tab, structured still sends it to Home with its button intact.

## Deleting a programme (2026-10-19)

Chris: "I really need to be able to delete programs ... there has to be
double verification before deletion that nobody is current on the program."

**Archive stays the default.** It is reversible and destroys nothing. Delete
is the escape hatch for a programme that should never have existed.

### Half the guard already existed and nobody could see it

`members.program_id` carries **no ON DELETE clause**, so Postgres raises a
foreign key error if anyone is assigned. Correct, but it surfaced as a raw
constraint violation. The UI now says it in words instead.

### What dies, and what does not

Everything below the programme cascades: folders, workouts, schedule_slots,
benchmarks — **and `messages` for that programme, which is its group chat and
every message in it.** That one is easy to miss and irreversible, so the
confirm panel names it explicitly.

**Member history SURVIVES.** `completions.workout_id` is ON DELETE SET NULL
and the workout title is copied onto the completion when it is logged, so a
deleted programme leaves everyone's logged sessions intact. Progress does not
go blank. The panel says so, because the natural assumption is the opposite.

### The two guards

1. **A refusal, not a confirmation.** Anyone on the programme and there is no
   confirm field at all — just their names and "move them first". The check
   is **fail-closed**: if it cannot reach the server it blocks, because the
   one outcome worth being wrong about is deleting a programme out from under
   a member. Re-checked immediately before deleting, since the modal can sit
   open while someone is assigned elsewhere, and the FK error is translated if
   the database catches the race first.
2. **The programme's name, typed out**, over a panel listing what goes.

**Counted on the SERVER, not from `p.memberCount`.** That field is admin's own
local number — Burn Club's card reads 214, which is demo data, not real
members. The card's number is decorative; the guard's number is live.

### A const trap worth remembering

`PROGRAMS`, `FOLDERS` and `CIRCUITS` are declared **`const`** in
admin/data.js. The obvious `CIRCUITS = CIRCUITS.filter(...)` throws
"Assignment to constant variable" the first time anyone presses the button —
and `jsc` passes it, because that is a runtime error in code that parses
perfectly. They are spliced in place. Anything else pruning those arrays must
do the same.

**Verified end to end by Chris** (2026-10-19): refused on Burn Club, deleted
the test programme.

### Left undone

Deleting clears the server row and THIS admin browser's local state. Another
machine with admin open would still hold the programme in its own
localStorage until the content migration puts programmes on the server for
real.

## Admin deploys were invisible for ten minutes (2026-10-19)

Chris pushed the delete feature, refreshed admin twice, and saw nothing. The
code was live and correct; his browser was not being given it.

GitHub Pages serves **`cache-control: max-age=600`**, so for ten minutes a
browser answers from its own cache without asking the server at all. The
member app has been immune since 2026-10-12 because its service worker stamps
every request `?v=<CACHE>` — a bumped version is a URL no cache has ever seen.
**Admin had nothing equivalent**, so every admin deploy has been silently
delayed since the project began.

Admin now versions its own `app.js`, `data.js`, `supabase-client.js` and
`style.css` from **one string in its `<head>`**. BUMP IT whenever an admin
file changes; it only has to differ from last time.

Also bumped `sw.js`: it registers at `/burn-club/` scope, which **covers
`/burn-club/admin/` too**, so it was serving admin through a version stamp
from before the feature existed.

**A wrong turn worth not repeating:** `?v=2` on `admin/index.html` does
nothing for this. It busts index.html alone, and index.html referenced
`app.js` with no query string — so the stale app.js was still used. The
version has to be on the ASSET urls, not the page's.

## Rest as a block (2026-10-19)

Chris: "I am programing a workout with a 15 minute amrap, but I want them to
take a dedicated 2 minute rest between that and the next block. Need a button
for it, just with the option to pick time."

**This is a different thing from every other `rest` in the builder.** Those
are a NUMBER ON a block — seconds between that block's own rounds or sets.
This is a block in its own right, and it is the only way to put a gap
*between* two blocks.

Seconds, not minutes, because every other rest field in the builder is
seconds and one unit meaning two things is how 120 gets typed into a box
expecting 2. Defaults to 120.

**The player needed no new screen.** It already had a `rest` phase with a
clock and an "Up next" line, so a rest block pushes one of those. `upNext` is
resolved at build time from the NEXT block, falling back to "the end of the
workout" — a coach can legitimately finish on one.

**A rest never waits for Start.** `isNewBlockStart()` is true for a
standalone rest block, which would have put a Start button in front of a
break: pressing a button to begin resting, while the rest you are already
taking goes uncounted. Stepping back still pauses, because that is a
deliberate rewind.

### The bug this surfaced, and the fix worth keeping

Adding the type by hand threw `Cannot read properties of undefined (reading
'map')` the first time a rest block rendered — `blockExerciseList` mapped
`values.exercises`, which a rest does not have.

Four places in the builder were asking "does this block hold no exercises?"
and all four asked it as `blockIsCardioChoice(block)`. Four call sites is
four chances to forget one. They now share **`blockHoldsNoExercises()`**:
no exercise list, no "+ Add Exercise", no type dropdown, a static type label
instead. **Any future block type that holds nothing goes in there, not into
four separate conditions.**

## Burn Club Test, migrated from the export (2026-10-20)

Chris built the trial programme in admin and sent
`burn-club-programs-2026-10-20.json`. Five workouts migrated into `data.js`:
three circuits dated **Monday 2026-10-26**, plus October Warm Up and October
Cool Down with no date, so they sit in the Stretch & Core library and are
available from day one.

The other two programmes in that export (30 Minute Burn Test, Pregnancy) and
the Foundations: Week 1 orphan are **being deleted**, so nothing from them was
migrated.

### The export is missing two fields the member app cannot run without

`meta` and `color` are not in the export, and both are load-bearing on the
member side:

- `parseInt(circuit.meta)` is where the duration badge comes from, and
  `meta.split("·")[1]` is the focus line under the title.
- `color-${c.color}` is a CSS class; without it a card renders unstyled.

Admin does not store either one — it **derives** them at publish time from
the blocks. So rather than inventing values, both were produced by running
admin's own `estimateCircuitMinutes()` and `deriveWorkoutFocus()` against the
exported blocks in the live admin page. Anything migrated from a future
export has to do the same, or the numbers will not match what admin shows
Chris.

### What was checked before it went in

- 6 programmes, 56 folders, 199 circuits, 688 exercises parsed.
- All 29 exercise refs in the five workouts resolve to library ids.
- Exercise library diffed against `data.js`: **identical**, 688/688, nothing
  added, changed or removed. No exercise migration was needed.
- Rest blocks carry their seconds through (90s and 120s).
- `data.js` parses; `CIRCUITS` is 118.
- Phase queues build for all five workouts.
- Availability reads `scheduled (week of 2026-10-26)` for the three circuits
  and `always` for the warm-up and cool-down.
- With the clock faked to Mon 26 Oct, all three appear in This Week's
  Workouts with the derived meta, and the two library pieces stay in Stretch
  & Core. Before that date This Week's Workouts is correctly empty.

### The id is deliberately ugly

`burn-club-test-1791470187441` is the id admin generated and it was **not**
tidied. It is the key the workouts in `data.js` reference and the key every
member row will carry. Renaming it here would desync this from admin, which
still holds the long id and would hand it back on the next export.

### Rolling, so the date is the schedule

`scheduleType` is `rolling`, so there is no `duration_weeks` and no
`schedule_slots` — a rolling programme has no day-by-day template. Its
workouts surface from `availableFrom`, which is the only reason the three
circuits are dated to a Monday.

### `supabase/21-burn-club-test.sql`

One row in `programs`, for one reason: `members.program_id` is a foreign key,
and without it the member modal refuses every assignment with "violates
foreign key constraint members_program_id_fkey" — the error Chris hit on
2026-10-13. The workouts themselves still live in the bundled `data.js`;
this file is not content migration.

### Open: Burn Club Test has no benchmarks, and testers will see three

Found while checking this, **not introduced by it**. The programme carries no
`benchmarks` array. Two things combine badly:

- `syncBenchmarksToMemberApp()` filters to programmes that *have* benchmarks,
  so Burn Club Test is never in the bridge payload.
- `loadProgramBenchmarks()` only replaces `BENCHMARKS` on a real match, by
  design — "a bridge that was never written shouldn't wipe the seeded demo
  list". With no match it keeps `BENCHMARKS_SEED`.

So a real tester's Progress → Benchmarks shows **The Gauntlet, Sprint 500m
and Endurance Test** — three benchmarks that are not in their programme. The
*results* are demo-gated and will be empty, so it reads as three untouched
benchmarks rather than fake history, but they are still the wrong three.

It is also worth noting the bridge is `localStorage`, written by admin in
Chris's browser. It never reaches a tester's phone, so even a programme that
*does* have benchmarks gets the seed on a real device. Benchmarks are the
next thing after programmes that wants to come off the bridge and onto the
server.

## Benchmarks, and self-testing (2026-10-21)

Chris asked how a push-up test, a 1 mile run or a 500m sprint would ever work,
since none of them is a workout the builder can express: "do we need to build
a new type of workout called a 'test'?"

**No.** The gap was never a workout type. Every score type except time scores a
whole workout, and the app cannot pace a mile run at all — wrap one in the
player and you get a screen saying *go run* over a timer nobody looks at. What
was actually missing is that **a benchmark with no workout attached had no way
to be performed or scored**. That is a button.

### Tapping a benchmark card does one of two things

Decided by whether any workout in the member's own program is tagged with it,
which is data that already existed (`isBenchmark` / `benchmarkId`):

- **No workout tagged** → a small overlay: type the number, save, gone.
- **A workout tagged** → "retesting runs the full workout", then straight to
  that workout's detail screen, where Start already lives. The score is asked
  for at the end by the prompt that was already there, so there is one prompt
  rather than two that could disagree.

Chris, 2026-10-21: *"Say you click on 500 m run, I'd like to build a little pop
up screen that allows them to enter there, save and then it goes away. But if
they want to self test an amrap gauntlet for example, it wouldn't just be a
number to enter, it ask them if they want to retest then would pop up to the
actual workout where they can press start and go."*

The card says which — "Log result ›" or "Retest ›" — because a card that acts
has to say so, and the two actions are genuinely different.

`circuitForBenchmark()` is scoped to the member's own `programId`. Two programs
can tag their own workouts against their own benchmark ids, and a member must
only ever be sent to theirs.

### Benchmarks are now BUNDLED, which is a correction

They used to reach the member app only through admin's `localStorage` bridge,
with a hardcoded demo list as the fallback. **That bridge is written by admin in
Chris's browser and never reaches a member's phone**, so every real member saw
the fallback: three benchmarks that were not theirs. Burn Club Test, which has
none, would have shown all three of Burn Club's.

They now live in `PROGRAM_BENCHMARKS` in data.js, keyed by programId —
arriving the way content already arrives, costing a push to change, exactly
like `CIRCUITS`. The bridge still *overrides* where it exists, so editing a
program's benchmarks in admin previews them on that machine without a push.
A program that is absent from the map has no benchmarks, and that is a real
answer rather than a gap to fill with someone else's.

When admin content moves to the server this moves with it.

### Score types: reps added, weight deliberately refused

`rounds` and `reps` are the same number counted differently — more is better,
only the word changes, which is why admin's picker had always lumped them
together as one option. But the member's card then printed "42 rounds" on a max
push-ups test. Split, so the card can be honest.

**`weight` is in the server's check constraint and is not offered.** Three
reasons, the second being the real one:

- It is the wrong shape: every other type scores a whole workout, weight scores
  one lift.
- **It already exists.** Personal Bests track weight per exercise, and Chris
  decided on 2026-09-04 that *"this program isn't necessarily about breaking
  PRs... that shouldn't be the goal of each workout"* — which is why they are
  member-curated instead of a wall of numbers. A weight benchmark is a 1RM
  test, which is a PR with a schedule on it, and it would put the same number
  twice on one page, one of them deliberately quiet.
- It forces the unit decision the player has avoided: the field just says
  "Weight used", and only the health profile says lbs.

If a strength re-test is ever wanted, it leans on Personal Bests. It is not a
fourth score type.

**A bug this nearly caused:** `best` was computed as `scoreType === "rounds" ?
max : min`. Adding reps would have quietly taken the MINIMUM of a reps
benchmark. Direction now comes from `benchmarkLowerIsBetter()`, which asks the
question that actually decides it, and only `time` answers yes.

Score type is also editable now. It wasn't, so a benchmark created with the
wrong one could only be fixed by removing it — which untagged its workouts and,
once results live on the server, would have taken every member's history.

### The AMRAP counter counted, then asked again

The player tallies rounds behind the "+ Add Round" button for the whole block.
The benchmark prompt then **blanked the field** and asked the member to retype
it from memory — on a benchmark AMRAP, the one number the entire test is about.
It is prefilled now, and still editable, because a miscount is the member's to
correct.

Only prefilled when the workout has exactly ONE amrap block. With two, "the"
round count is ambiguous, and a guess sitting in the box is worse than an empty
one.

**And the counter was per-session, not per-block.** `amrapRounds` was reset in
`start()` and nowhere else, so a workout with two AMRAP blocks carried the first
block's count into the second and kept adding. No workout has ever had two, so
it was latent — but it is a count, and a count that silently belongs to the
wrong block is exactly the kind of thing nobody notices until a benchmark
depends on it. Now `amrapRoundsByBlock`, keyed on `blockIndex`, with +1 and −1
both routed through `bumpRounds()` so the stored number and the number on
screen cannot disagree. An in-flight resume record from the old shape is mapped
onto its only AMRAP block.

### Deleting a benchmark keeps the results

Chris: *"Keep the workout data. only thing that gets deleted should be the view
of that specific benchmark from the progress page, and likely replaced by
another one."*

`benchmark_results.benchmark_id` was `on delete cascade`, so removing a
benchmark in admin would have wiped every member's history for it — and admin's
own warning said members keep their results, which was true only by accident,
because admin never touched the server table.

`supabase/22-benchmarks.sql` changes it to ON DELETE SET NULL and copies the
benchmark's **name** onto the result at save time, so a result can still say
what it was a result for. Same decision, same shape, as
`completions.workout_id`.

### When the test took place

Chris, 2026-10-21: "can we add a button on the benchmark that tells them when
this test took place?" A score with no date behind it can't be read — "8
rounds, +2 since your first test" means something very different if the 8 was
last week or two years ago.

Done in two places rather than as a second button on the card, because the
cards are a 3-column grid about 100px wide on a phone and two tap targets in
that width is fiddly:

- **On the card**, under the score, the date the BEST was set — not the
  latest, because the best is the number printed above it.
- **In the tap overlay**, which already existed, the full history: every
  result newest first with the best marked. That answers the harder question
  too, which is whether they have been retesting at all and how long it has
  been. The list scrolls rather than growing the card, so a member two years
  into retesting gets the same shaped popup as one on their second attempt.

**The cards are denser now** — name, format, score, date, delta pill, action.
It still holds at 375px and the three columns stay aligned. If it ever needs
cutting, the delta pill is the one to go: "+2 rounds since your first test" is
derivable from the history list that is now one tap away.

### The empty state exists because of a colour decision

A program with no benchmarks rendered an empty blue card: a title and nothing
under it. Hiding the card is not the answer either — it is the blue one Chris
deliberately put between the two white ones on 2026-10-18 ("the card that can
take a colour"), and removing it leaves two plain cards butted together, which
is the exact problem that placement solved. So: an empty state inside the card.

### For the trial

Burn Club Test gets **one** benchmark, 500m Sprint, scored by time and
self-logged — the example Chris named himself. Nothing in the program is tagged
as a benchmark, so the retest path is not exercised by the trial.

**Still open:** which Burn Club Test circuit to tag, and what to call it, if
Chris wants testers to try the retest path too. That is Kelly's content call.
Tagging it is `isBenchmark: true` plus a `benchmarkId` on the circuit in
data.js, an entry in `PROGRAM_BENCHMARKS`, and a row in `benchmarks`.

## The laptop (2026-10-22)

Feedback plus competitor research: a lot of women training at home bring a
laptop into the space rather than propping a phone. Bigger screen, nothing to
balance, phone stays free. Chris: "This is mainly to be a player, and whatever
is needed to get the person from logging on, and getting to/starting the
workout. that is all i care about right now."

**The website already existed.** The app is served over HTTPS at a URL; a
laptop could always open it. What it GOT was a 402px drawing of a phone,
bezel and all, floating in the middle of the window — about four inches of app
on a fifteen inch screen.

### Not a second codebase

Two builds means every feature built twice, and the player alone has had months
of iteration. Auth, sync, Supabase, the service worker and all the content are
shared. A separate desktop app duplicates all of it to serve the same product
on a bigger screen. One codebase, one media query.

### Stretching does not work, and that is measured

With the bezel removed and nothing else changed, the superset player at 1440px
wide: videos letterboxed with the aspect ratio shot, exercise names and their
rep counts a foot apart at opposite edges, a 1400px-wide button, "Up next"
stranded at the bottom with a dead zone above it. **Nothing broke** — every
screen still worked — but "make it responsive" is not a flag to flip.

### Why 640 and not wider

The app is designed at 402x860. **A laptop viewport is roughly 650-900 tall**,
so there is no room to grow vertically — the only axis with slack is width, and
using it properly means a two-column player, which is a real design job and was
explicitly deferred. 640 is as wide as the phone-shaped layout stretches before
it reads badly.

So Phase 1 is: same layout, about 60% bigger, filling the height, no toy bezel.
**The bigger win still needs the two-column player.** Don't let anyone think
this was that.

### The two things that actually needed fixing

**Video frames were fixed heights** — 180px for the single demo above a
straight set, 170px per card in a superset pair. Right at 402 wide, letterbox
strips at 640, and `object-fit: cover` then crops the lift out of the middle of
the frame.

Now `aspect-ratio: 16/9` (the clips are 1280x720) with the cap on **width**,
not height. Capping height fights aspect-ratio: the frame stops at the cap,
keeps its full width and is a letterbox again. Capping width lets it shrink
whole, so the ratio always holds.

Two different caps, because the two sit differently: the single demo has the
column to itself (32vh), the superset pair is already half-width each (18vh).
18 is not arbitrary — at 650px tall, anything more pushes "Up next" off the
bottom, and 650 is what a 13-inch laptop with a browser toolbar actually has.

**The demo strip is a swipeable carousel on a phone** — each card 82% of the
width so one and a bit show and you flick. There is no flicking on a laptop and
there is room for the pair, so on desktop it stops scrolling and lays out side
by side, wrapping, so a superset of four becomes 2x2 rather than four cards
nobody can see.

### Verified

All eight block types, every phase kind (sets, work, superset, amrap, emom,
rest, cardio-choice, log-weights): no horizontal overflow at 1440x900. Nothing
scrolls at 1366x650. **The phone layout is byte-for-byte unchanged** — same
carousel, same 170px cards, next one peeking.

### The surround, and the frame

Chris, same day: make the unused space either side read as branding, "and
depending on how it looks, add a frame to the player so it seems the build was
more intentional than just a repurpose of the app."

**The field is deep, and that was decided rather than chosen.** The same
melting-smiley artwork is already the watermark behind the Workouts card, and
the note there records that it reads as a watermark "on a solid blue fill" and
looked like "a grey smudge" at the same opacity over a pale tint. A light
surround would have reproduced that smudge at ten times the size. It also
suits the room: a laptop a few feet away, often with a window behind it, so a
dark field throws less glare and the light panel is what the eye goes to.

**Two marks, one per side, mostly off the edge.** First pass was 112vh at 38%
off with 0.07 opacity, and you got two near-complete faces — eyes, smiles, the
lot — competing with the real logo on the login card. Bigger (150vh), pushed
further out (55%) and fainter (0.045) leaves a fragment, the drips and part of
a smile, which is texture rather than a second logo. Inverted to white because
the PNG has #172A3A baked in and would be invisible on this fill.

**The frame is conditional, and that is the whole trick.** Rounded corners and
a margin are what stop this reading as the phone build stretched to fit — but
they cost vertical space, and vertical space is the one thing a laptop has
none of. So the panel only lifts off the edges above 780px of height. Below
that it stays full bleed and keeps every pixel for the workout.

**Dark mode needed its own field.** The app goes to #1E2237 in dark, which is
darker than a surround built from --deepblue and --ink — so the panel became
the dark thing in a lighter room, which is backwards. Dark mode gets a deeper
gradient taken down past the app, and the marks come back slightly since they
have less to hide against.

`body { overflow: hidden }` on desktop is safe: every screen scrolls inside
itself, which was checked on Progress (1597px of content in a 752px screen,
scrolls internally, body does not).

### A phone turned sideways (2026-10-23)

**iPad was never the problem.** Measured on the live site: it re-centres and
re-fits its height on rotation, nothing is cut off, the button and "Up next"
stay visible in both orientations. It just does not USE the landscape width —
640px column with 270px bands either side on a 10.9", 363px on a 12.9". Since
the surround landed, that reads as deliberate rather than stranded.

**iPhone landscape was broken, and had always been.** Every iPhone on its side
is WIDER than 441px — 852 on a 15 Pro, 932 on a Pro Max, 667 on an SE — so on
width alone they all took the desktop branch and got a 640px column in a window
375-430px tall. Measured: the player overflowed by 177-222px, "Up next" fell
below the fold, and the demo videos shrank to 120x68.

It was no better before the desktop branch existed: the old fixed 402x860 frame
in a 393px-tall window just scrolled the page and showed a slice of a phone.

**The guard.** The phone layout now applies to narrow OR SHORT —
`(max-width: 440px), (max-height: 499px)`. 500 is above every iPhone landscape
height with room to spare (440 on the largest, and Apple keeps growing these)
and well below every iPad landscape height (744 on a mini, the smallest).

**The two conditions must stay mutually exclusive AND exhaustive.** Merely
excluding short-and-wide from the desktop branch would drop it through to the
base `.phone-frame` rule — the fixed 402x860 — which is the broken thing both
branches exist to replace.

Two things the guard exposed, both now fixed for that zone only:

- The demo frames' fixed 170px height is right in a 402px column and a 3.9:1
  letterbox at 852 wide (a card came out 666x170). Sized off viewport HEIGHT
  there instead, which is the dimension actually short. The strip still scrolls
  horizontally, because a sideways phone is still a phone.
- `fitPlayerHeading()` shrinks to fit the WIDTH, and a phone on its side has
  width to spare — so "Set 1 of 4" stayed at the full 39px on a 393px-tall
  screen, eating a sixth of it. The ceiling drops to 26 below 500px tall. The
  existing resize listener already re-runs the fit on rotation.

It still scrolls at 393px tall — header, heading, two videos, the exercise
list, the button and "Up next" are never going to fit — but the button is
`position: sticky; bottom: 0`, so it follows you down and stays reachable.
That is the bar this was built to: **rotation is unhelpful, not broken.**

**The real answer is to lock the phone build to portrait** when the native app
ships — one key in Info.plist, and what most fitness apps do. Nobody
deliberately trains holding a phone sideways; this is accidental rotation.

## Later: a landscape player (logged 2026-10-23)

Chris, 2026-10-23: "eventually, it is worth making just the workout player able
to go into landscape mode, if it can be done. Project for later, so log it
away, but something to think about."

Scope is **the player only** — the same instinct as the laptop: the player is
the thing worth building for a different shape, and nothing else is.

**This is the same job as the laptop's two-column player, not a second one.**
An iPad in landscape is 1180x820. A laptop is 1280x800. They are very nearly
the same viewport, and a phone on its side is the same SHAPE at a third of the
size. One landscape layout — video and clock on one side, the exercise list and
controls on the other — serves all three. That is a much better argument for
doing it properly once than any of the three cases made alone.

What would have to be decided when it is picked up:

- **The phone version is not just a smaller iPad version.** At 393px tall there
  is room for roughly one video and one row of controls. Something has to go,
  and choosing what goes is the actual design work.
- **If the phone build is locked to portrait** (above), a landscape player
  means unlocking rotation for one screen and re-locking on exit. That is
  normal on iOS — video players do it — but it is app-level behaviour, not CSS,
  so it cannot be prototyped in the web build.
- The web build can do landscape today with a media query, so the iPad and
  laptop halves are reachable without waiting for the native app.

## Keeping the screen on (2026-10-22)

The app had **no wake lock at all**. On a phone that mattered less because a
phone gets picked up; a laptop sitting untouched through a 90-second rest dims
and then locks.

Bracketed by `startHeartbeat`/`stopHeartbeat`, which already mark exactly the
span where a workout is live — `start()` turns both on, `finish()` and `exit()`
turn both off. No new lifecycle to keep in sync.

**Every call is best-effort and silent.** The API is missing in some browsers,
and where it exists the request *rejects* when the page is hidden or the
battery is low. Neither is worth a dialog mid-set, and the workout runs fine
without it.

**The browser drops the lock whenever the tab is hidden and does not give it
back.** Without re-taking it on `visibilitychange`, one tab switch during a
workout silently ends it for good. Re-taking is keyed on `Player.heartbeatId`
rather than on the player screen being visible: the heartbeat is the one flag
that means a workout is actually running, so a member reading Progress between
sets doesn't have the lock pulled out from under a live session.

**Not verified end to end.** The built-in browser pane denies the permission
outright — `NotAllowedError: Wake Lock permission request denied` — so what is
proven is that the rejection is handled and the workout runs normally without
it. That it actually holds the screen on needs a real laptop.

## The two trial weeks, migrated without schedules (2026-10-26)

From `burn-club-programs-2026-10-26.json`: FIT & FUNCTIONAL TEST WEEK (6
workouts) and 30 MINUTE BURN TEST (4). Both STRUCTURED, duration 1 week.

### They have no schedule, and that is not a migration fault

Both programmes have **seven rest days and zero workouts assigned**. The
contrast in the same export makes it unambiguous: Fit & Functional has 48
workout slots, 30 Minute Burn has 40, these two have none. Admin's own copy
says why — "every day starts as a Rest Day until you assign workouts" — so the
Schedule step was simply never done.

**A member on either programme today sees a rest day every day.** The workouts
exist and are unreachable.

Chris asked for them to be migrated anyway (2026-10-26), which is the right
call: the content lands now, and filling the schedule later is a small separate
import rather than redoing the whole thing. `SCHEDULE_TEMPLATES` holds seven
rest days for each, which is faithful to what admin actually contains.

### Structured programmes do not resolve like Burn Club Test did

Burn Club Test was **rolling** — workouts surface from a date on the circuit
(`availableFrom`). These are **structured**: workouts surface from the member's
own `start_date` plus a day offset, driven by the schedule. So:

- None of these circuits carry `availableFrom`, and none should.
- Every member needs a `start_date` as well as a `program_id`. A structured
  member with no start date hits a dead-end screen.

`workoutsForSlot()` first looks for circuits whose `slotId` matches, then falls
back to a direct id match. Fit & Functional uses the first path — its slots
hold a BASE id and the real circuits are `<base>-home` / `<base>-gym`. These
trial workouts have no variant, so they take the fallback and their slot's
`workoutId` is simply the circuit id verbatim. **Verified by simulating a
filled-in schedule: all six F&F Test workouts resolved 1:1.**

### The export is lossy in the same two ways as last time

`meta` and `color` are absent — derived by running admin's own
`estimateCircuitMinutes()` and `deriveWorkoutFocus()` against these exact
blocks in the live admin page, with colour rotating `LIVE_CARD_COLORS` the way
publishing does.

**And `programId` is absent on every structured circuit** — 187 of 203 carry
null. They are linked to a programme only through their folder.

Correction to what I first wrote here: I said the folder's programme was null
too and that I recovered it from the id prefix. **That was wrong — I queried
the wrong key.** Admin's folders carry `program`, not `programId`, and it is
populated correctly:

```
{"id": "fit-functional-test-week-1792947605130-week-1", "name": "Week 1",
 "program": "fit-functional-test-week-1792947605130"}
```

The prefix happens to agree, so the migrated result is the same either way —
but anything reading a future export should use `folder.program` rather than
trusting the id's shape, which is a convention and not a guarantee.

### Verified

All 10 build a phase queue (3-33 phases), **zero unresolved exercise
references** out of 122, `data.js` parses, CIRCUITS 118 -> 128.

### Admin can import now (2026-10-26)

Admin could always export and never import, which is what stranded content on
whichever machine built it. There is now an **Import File** button beside
Export All on the Programs page.

**Strictly additive.** It adds programmes, folders, workouts and exercises
whose id this browser does not already have, and touches nothing it does. That
is the whole design, not caution: a replacing import is precisely the operation
that would wipe the other machine's work, which is the problem it exists to
solve. An id already here is left alone even if the file's copy is newer — to
take the file's version, delete yours first and import again.

A schedule is only taken for a programme being **added**, for the same reason:
overwriting the schedule of a programme already here would silently discard
days somebody filled in.

**It does not publish.** Importing means "I now have this content"; publishing
means "members should see it". Keeping them separate stops an import quietly
pushing someone else's half-built week at live members.

Verified against Kelly's real 2026-10-26 export: +2 programmes, +2 folders,
+10 workouts, 0 exercises (all 688 already present), **193 existing workouts
untouched**. Run a second time it reports "nothing to import" and changes no
counts. `openScheduleView()` builds for an imported programme.

This does not remove the need for the content migration — two people editing
the same programme still have no merge, and last import still wins. It removes
the need to hand-carry a file through me.

### Scheduled, and imported (2026-10-26)

Chris imported Kelly's export into his own admin with the new Import File
button, scheduled both weeks there, and exported again. Those schedules are now
in `SCHEDULE_TEMPLATES` verbatim.

| | Mon 26 | Tue 27 | Wed 28 | Thu 29 | Fri 30 | Sat 31 | Sun 1 |
|---|---|---|---|---|---|---|---|
| F&F TEST WEEK | SHOULDERS/ABS | HAMSTRINGS/GLUTES | CHEST/TRICEPS | BACK/BICPES | QUADS/GLUTES | CIRCUIT | rest |
| 30 MIN BURN TEST | SHOULDERS/ABS | HAMSTRINGS/GLUTES | rest | CHEST/TRICEPS | QUADS/GLUTES | rest | rest |

Day 1 is the member's own `start_date`, not a calendar date, so a tester set to
start 2026-10-26 gets that Monday column. **Verified** by faking the clock to
Monday: every slot resolved to a real workout, and Home read "Week 1 · Day 1 /
0 of 6 Done This Week / Today SHOULDERS/ABS".

A false alarm worth recording so nobody re-chases it: Home's text appeared to
contain "You finished Fit & Functional" on day 1. The completion card is
`display: none` there — `textContent` returns hidden elements too, so the
scrape was reading stale invisible DOM left over from switching programme
in-session. Check `offsetParent` or the element's own display, not textContent.

### Archiving a programme does nothing to members

Chris archived Burn Club rather than deleting it, to get the `block-*` test
workouts out of the way: "i think that will be good enough."

**It isn't, technically.** The member app has no concept of programme status —
there is no `PROGRAMS` array in data.js and nothing reads `archived` anywhere
on that side. Archiving is an admin-only filter. The 17 `burn-club` circuits in
data.js, which are mostly the one-block demo workouts, would still show to any
member on Burn Club, and they are dated to the current week.

It does not matter for the trial, because every tester is on one of the two
structured trial weeks and nobody is on Burn Club. It will matter the moment a
real Burn Club member signs in — which today includes
chris@worthitcandy.com.

### The member modal: first/last names, and a start date that fills itself (2026-10-26)

Two things Chris hit while setting up the six testers.

**Name is two fields now.** It was one box, split on whitespace at save time.
Editing an existing member splits on the LAST space rather than the first —
"Mary Anne Clarke" is a two-word first name far more often than a two-word
surname in this membership.

**Program Start Date moved to sit directly under Program.** It was in the
Staff Only group at the bottom, separated from the thing that makes it
required by the whole of Member Since, Badge, Habits, Health Profile and Macro
Targets. Assigning a structured programme meant scrolling past all of that to
set the one field that programme now needs.

**And it fills itself.** Picking a structured programme puts the next Monday in
the box — or today, if today is Monday. Two reasons it is Monday and not
today-whatever-day-it-is: day 1 of a schedule IS the start date, and every week
in this app begins on Monday, so a Wednesday start spreads "Week 1" across two
calendar weeks and makes the week-by-week view read wrongly from then on.

**It only ever fills a BLANK field.** Someone editing an existing member has a
start date already anchoring real completions; recomputing it because the modal
was opened would silently move their whole schedule.

Forgetting this field is not a cosmetic miss — a structured member without a
start date lands on the same dead-end screen as one with no programme at all,
which is why it is now hard to leave empty rather than merely closer to hand.

### The Reps field holds words now (2026-10-26)

Chris writes "8 each leg" in Reps for single-limb work. The box saved it, and
reopening the workout showed 0.

`parseRepsField()` split on commas and did `Number(parts[0]) || 0`.
`Number("8 each leg")` is NaN, and `NaN || 0` is **0**. The straight-sets Reps
box was `type="number"` as well, so the text could not even be typed there.

**The fault was not that it rejected text — it was that it did so silently.**
Typed, saved without complaint, came back as zero. Nobody would have found it
until a member saw "0 reps" mid-workout.

The rule, Chris's: **a bare number gets the word added, anything else prints
verbatim.** "8" reads "8 reps"; "8 each leg" reads "8 each leg", because
appending the word gives "8 each leg reps". One helper, `repsLabel()`, used by
every place the member app shows reps — superset rows, straight-set rows, AMRAP
and EMOM rows, the player's reps pill, "Up next", and the block summary.

**Nothing arithmetic depended on reps.** `estimateBlockSeconds()` counts a flat
30 seconds per exercise and never reads it, so there was no duration to break.
A numeric SCHEME (10,8,8,6) is a separate field and is untouched.

It also makes rep ranges work as a side effect: "8-10" now reads "8-10" rather
than collapsing to 8.

**Still plural at one.** "1" reads "1 reps", which is what it did before — left
alone deliberately rather than quietly changed alongside a requested fix.

**Cue is still the better home for a qualifier that is not a count.** It renders
as `Name — cue` everywhere the exercise appears, including under the demo video
and in Up next. Reps-with-words is for when the count itself needs the words.

### A set is 45 seconds now, not 30 (2026-10-26)

Chris: "we have found that is closer to what the average person takes,
especially with all of the natural breaks we take." The old 30 counted the set
and nothing around it — picking the weight up, finding position, the pause
before starting.

It is `SECONDS_PER_SET` in admin now rather than two loose 30s, and it only
affects blocks with **no clock of their own**: supersets and straight sets. An
interval reads its real work and rest; an AMRAP, EMOM, cardio choice or rest
block IS a duration. None of those moved.

**The ladder's 20 was deliberately left alone.** A ladder's steps get shorter as
it climbs, so its per-step figure was never the same number as a straight set's
and is not what Chris changed. Flagged rather than moved in sympathy.

**Every migrated `meta` had to be re-derived.** Those strings are baked into
data.js at migration time, so changing the constant in admin alone would have
left the member app showing the old numbers forever while admin showed the new
ones. All 15 trial circuits were rebuilt from the 2026-10-26 (4) export with
the new rule.

### What the change actually did

The trim Chris did matters more than the constant. 30 MINUTE BURN TEST had a
55-minute session in it; he cut blocks from three of its four workouts, and
even at 45s per set the whole programme now reads **30 / 25 / 25 / 25** — a
programme called 30 Minute Burn that is finally under thirty minutes.

FIT & FUNCTIONAL TEST WEEK went the other way, as expected: 45 / 55 / 50 / 40 /
50 / 25 across its six days.

### Re-migrating is a block replacement, not a line edit

Worth recording because the first attempt failed. Splitting the CIRCUITS array
text on brace depth does not work — comments and strings carry braces and
brackets, so the depth counter desynchronises and only 5 of 15 target entries
were found. Both migrations had gone in as contiguous blocks under header
comments, so the reliable move is to replace from the first header to the
array's closing `];` wholesale. Keep future migrations in labelled contiguous
blocks for the same reason.

### An export is ONE browser, not the content library

Burn Club Test was missing from this export and I assumed it had been deleted.
It had not — Chris built the Burn Club circuits on his machine and Kelly built
these two on hers, so each export is a snapshot of **that browser's
localStorage** and neither is complete.

**This is a live hazard, not a curiosity.** Admin content has no shared
backend, so:

- **No single export is the whole library.** Migrating one wholesale — "replace
  CIRCUITS with what is in the export" — would silently delete whatever lives
  on the other machine. Every migration so far has been ADDITIVE, splicing in
  only the new programme's circuits, and must stay that way until content moves
  to the server.
- **Deleting a programme only clears the server row and THAT browser's local
  state.** Kelly deleting something on her machine leaves it intact on Chris's,
  and the next export from his side brings it back.
- Two people editing the same programme on different machines have no merge —
  last export to be migrated wins.

This is the sharpest argument yet for the content migration in "The next real
piece of work", and worth re-reading before anyone migrates a future export.

### Content notes for Kelly, not bugs

- **"BACK/BICPES"** is a typo in the workout title. Members see it.
- **30 MINUTE BURN TEST is copies of the F&F Test workouts** — the ids carry
  `-copy-`. One was trimmed from 5 blocks to 3; the rest are unchanged, which
  is why its HAMSTRINGS/GLUTES estimates at **55 minutes** in a programme
  called 30 Minute Burn.
- **Every description is "No description yet."** That string shows on the
  workout detail screen.
- 21 of the exercise references have no video yet, so those rows show the play
  placeholder rather than a demo.

## Settled: programmes are hand-built on purpose — do not "fix" this

I raised the absence of a "duplicate programme" feature on 2026-10-14 as a
workflow cost. It is not. Chris, same day:

> "we build all of the new programs by hand, and its for a reason. We do this
> because we promise new, unique, hand built workouts every new program. Its a
> major selling point for us that our members are not getting some cookie
> cutter, boring, repeating every 2 weeks plan."

So: 48 hand-built workouts every two months is the product, not an
inefficiency. **Do not propose programme duplication as a time-saver**, and do
not let the content migration quietly make copying the path of least
resistance — a feature that is easy to reach is a feature that gets used.

The distinction that stays open, and only this one: the SKELETON of a
programme is mechanical and repeats — its length, its variants, its week
folders, and which day of the week each session falls on. None of that is the
promise; the promise is the exercises inside. `ensureWeekFolders()` already
automates part of it. If anything else here is ever worth automating it is
that, and it has to be obvious it carries no content with it.

## The next real piece of work: admin content on the backend

Raised by a real failure 2026-10-14, not by planning. Programmes, workouts and
folders created in admin live in that browser's localStorage and never reach
Supabase. That was harmless while nothing on the server read them — and stopped
being harmless the moment a real `members` row had to point at a programme,
because `program_id` is a foreign key and the server only has the three seeded
ones.

**It does not block the trial** as long as the six testers go on Burn Club, 30
Minute Burn or Fit & Functional. It blocks everything after: every programme
Chris builds from here is invisible to the database, and the member app still
reads its workouts from the bundled `data.js`, so content changes cost a push.

Order worth considering when it starts: programmes first (smallest, and the
thing foreign keys point at), then folders, then workouts and their blocks —
which is the same order `03-seed-content.sql` writes them in, for the same
reason.

## window.prompt() is not safe to use in the member app

Found 2026-10-16 when Chris reported both profile pencils doing nothing.
`prompt()` **throws** — "prompt() is not supported" — in some contexts and
works fine in others: it worked in his normal browser and failed in the
in-app one, and an installed home-screen app is the usual place it is
blocked. That is worse than simply broken. It would have worked for some
testers and silently done nothing for others, with no pattern any of them
could have described.

All four member-app uses are gone, replaced by `askText()` — one dialog with
the same resolve-or-null contract prompt had, so call sites read the way they
did before. The profile name, the session note, a new notebook note and
editing one.

**Admin still uses prompt()** in three places (benchmark name and subtitle,
the importer's programme picker). Left deliberately: admin is used by Chris
and Kelly in a desktop browser where it works. Worth moving if admin ever
gets opened on a phone.

The email pencil was removed rather than fixed. A member cannot change their
own email: `protect_member_columns` blocks the column, and the address they
sign in with lives in auth rather than in `members`. It had been dead for its
whole life and nobody noticed, which is the real lesson here — a control whose
only failure mode is silence will sit broken for weeks.

## Final Walkthrough

- [ ] **Benchmarks are named for their workout now** (2026-10-16) — "The
      Gauntlet" rather than "Benchmark A", with the format underneath. The IDS
      stay `benchmark-a/b/c`: they are what every recorded score is filed
      under, and renaming them would orphan a member's history for a cosmetic
      change. Nothing to do here unless the three seeded names change when
      Chris writes the real ones.


- [ ] **Turn wearables back on.** Greyed out 2026-10-16 (Chris: "this feature
      will not be available for some time"). One flag — `WEARABLES_AVAILABLE`
      in app.js — set it true and both buttons come back; the notice above them
      hides itself off the same flag.
      Greyed rather than hidden on purpose: the Today card still shows steps
      and resting heart rate for a connected member, so removing the section
      would leave someone wondering where that number comes from with no way to
      ask. **Disconnect is disabled too**, which is the part worth keeping —
      Jordan Tester is connected deliberately, his watch figures are what the
      demo visuals are built on, and a live Disconnect beside a dead Connect is
      a one-way door.


Opened 2026-10-14 at Chris's request: "a few weeks before final launch." Things
that are **not** tester blockers and should not be allowed to look like them —
polish, wording and judgement calls that want fresh eyes once the product has
stopped moving. Nothing here stops a trial; everything here would be noticed by
a paying member.

The distinction that keeps this list honest: an item belongs **here** if the app
works without it and a tester would not be confused by its absence. It belongs
in *Before we go live* if launching without it causes a problem.

- [ ] **Tour copy is placeholder** (moved here 2026-10-14 — Chris: "tour copy
      is fine, let's drop it off the list for the tester priorities"). Five
      slides, editable at Admin → Settings → Member-Facing Copy, no code change
      needed. It is the first thing a member reads, which is exactly why it
      wants writing once rather than twice.

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
- [x] **Open signup is off** — confirmed 2026-10-13 by reading
      `/auth/v1/settings` on the live project, which reports the setting
      without attempting a signup, so nothing was created to find out.
      `disable_signup: true`, `mailer_autoconfirm: false` (so a confirmation is
      still required), and email is the only provider enabled.
      Original note: `disable_signup` was `false` on 2026-09-18:
      anyone holding the publishable key — which ships in the app's own
      JavaScript — can create an account, and the content policies grant read
      to any authenticated user. That hands a stranger the entire exercise
      library, every program and every workout. Member data stays protected by
      RLS; the content *is* the product. Burn Club is invite-only, so this
      should be off. Authentication -> Sign In / Providers -> Email.
- [x] **DMARC record — done, confirmed in DNS 2026-10-24.**
      `_dmarc.mail.kellyyager.com` returns
      `v=DMARC1; p=none; rua=mailto:dmarc@kellyyager.com`. All three
      mechanisms are live and correctly built on the sending subdomain:

      | | where | |
      |---|---|---|
      | SPF | `send.mail.kellyyager.com` | `v=spf1 ip4:52.3.252.119 ip4:44.222.39.36 ip4:199.249.231.0/24 ~all` |
      | DKIM | `resend._domainkey.mail.kellyyager.com` | key present |
      | DMARC | `_dmarc.mail.kellyyager.com` | `p=none` with rua |

      Return-Path is `send.mail.kellyyager.com` (its MX points at Resend's
      `forge.rmta.net`), which shares the org domain with the From domain, so
      **SPF aligns under relaxed alignment and DKIM `d=` matches exactly.**

      **The one thing DNS cannot answer: what the From address actually is.**
      This decides everything. From `@mail.kellyyager.com` and DMARC resolves
      on the record above. From the ROOT `@kellyyager.com` and there is **no
      `_dmarc.kellyyager.com`** — the lookup falls back to the org domain,
      which is the same missing record, so Gmail sees no DMARC policy at all
      and the bulk-sender requirement is missed. That is exactly the fault the
      original note guessed at ("most likely the From address not aligning
      with the DMARC domain"). Check it in Authentication -> Emails -> SMTP
      Settings, or read the From line on a spam copy.

      Worth adding regardless: a root `_dmarc.kellyyager.com` at `p=none`.
      It cannot cause a rejection — `p=none` asks receivers to report and take
      no action — and the subdomain keeps its own record, so Kelly's
      Workspace mail is unaffected either way.

      Original note below.
- [ ] ~~**DMARC record — required, not optional.**~~ The first real invite landed
      in Gmail's spam folder on 2026-09-18 and this is why: SPF and DKIM both
      pass, but there is no DMARC record on either the root or the `mail.`
      subdomain, and **Google has required all three from volume senders since
      early 2024**. Two out of three is not a partial pass. Resend labels DMARC
      optional because Resend does not need it; Gmail does.
      Fix: TXT at `_dmarc.mail` with
      `v=DMARC1; p=none; rua=mailto:dmarc@kellyyager.com`. Receivers check the
      subdomain first, so this satisfies Gmail while putting no policy on
      `kellyyager.com` itself and leaving Kelly's Workspace mail untouched.
- [x] **Invite deliverability — SOLVED 2026-10-25. The cause was the sender
      address, not the copy.**

      Both providers that previously put invites in spam now deliver to the
      inbox: a Google-hosted domain on 2026-10-24 (still on the *default*
      template, which is what gave the cause away) and Yahoo on 2026-10-25
      with the rewrite in.

      **What it actually was.** The sender was `kelly@kellyyager.com` — the
      bare root. Two separate faults in one field:

      1. Resend has only `mail.kellyyager.com` verified. The root has no
         `resend._domainkey` and no bounce host, so Resend **refused the send
         outright** — Supabase surfaced it as "Error sending invite email".
      2. There is no `_dmarc.kellyyager.com`, and the org-domain fallback
         resolves to that same missing record, so mail from the root carried
         **no DMARC policy at all** — precisely the bulk-sender requirement
         Gmail has enforced since 2024.

      Moving it to `kelly@mail.kellyyager.com` fixed both at once: SPF via
      `send.mail.kellyyager.com`, DKIM `d=` matching the From exactly, and
      DMARC found on the subdomain.

      **The rejection was luck.** Had Resend happened to accept root mail, it
      would have sent fine and quietly failed DMARC, and the hunt would have
      stayed on the copy for another week.

      **So the earlier diagnosis in this file was wrong** — it named the
      template as "now the main suspect" after DMARC went in. The template was
      never the problem; the From address was. The original note's own advice
      is what should have been followed first: read `Authentication-Results`
      on a spam copy before rewriting anything, because that says which.

      Still worth doing, both cheap:
      - Read the five header lines (`From`, `Return-Path`, `spf=`, `dkim=`,
        `dmarc=`) off a delivered copy. DNS implies they pass; the header
        proves it.
      - Test one consumer **gmail.com** address. Workspace-hosted Google and
        Yahoo have both passed; consumer Gmail is the strictest and is the
        one provider not yet directly confirmed.
      - Add a root `_dmarc.kellyyager.com` at `p=none` anyway. It cannot cause
        a rejection and it closes the hole for anything that ever sends as the
        root.

- [x] **Invite template rewritten and live 2026-10-25.** `supabase/invite-email.html` is ready to paste into
      Authentication -> Emails -> Invite user. Written for the six testers
      specifically rather than for members generally: it says who it is from,
      why it arrived, what the link does, and asks for a reply — which is both
      true and the single strongest "this is not bulk" signal there is.

      **No images, deliberately.** A logo is one more fetch from a domain with
      no sending history, and most clients block images by default, so the mail
      has to read without it anyway.

      **One requirement from the original note could NOT be met:** Supabase's
      template field is HTML only and it does not generate a `text/plain`
      alternative, so a multipart message is not achievable from the dashboard.
      The mitigation is that the HTML is text-forward and reads correctly as
      plain text if a client strips it. Don't record this as done.

      Original note below.
- [ ] ~~**Rewrite the invite email template — now the main suspect.**~~
      Tested 2026-09-19 after DMARC went in: invites to a Gmail address **and**
      a Yahoo address both still landed in spam. Authentication is no longer
      the problem — SPF, DKIM and a DMARC record are all in place — so what is
      left is content and reputation.

      Supabase's default is "Accept the invite" over a bare link, with no
      sender name, no product name and no explanation of why it arrived. That
      is structurally what phishing looks like, and filters score it that way
      regardless of who actually sent it.

      What a rewritten invite needs:
      - Who it is from, in words: Kelly Yager / KY Fit, and that this is Burn
        Club — the thing they paid for.
      - Why they are getting it now, referring to their purchase.
      - What the link does: sets their password. A link with no stated purpose
        is the single strongest phishing signal in a short email.
      - Real text, not one button on an empty page. A body with almost no
        content and one link scores badly on its own.
      - A plain-text alternative alongside the HTML. HTML-only mail is
        penalised by both Gmail and Yahoo.
      - A reply-to that reaches a person.

      **Next diagnostic before rewriting:** open one of the spam copies and
      read the headers (Gmail: "Show original"). `Authentication-Results` says
      plainly whether SPF, DKIM and DMARC each passed for that specific
      message. If any says fail, that is a configuration fault worth fixing
      first — most likely the From address not aligning with the DMARC domain.
      If all three pass, the cause is content and reputation and the rewrite is
      the fix. Guessing between those two is wasted work; the headers say
      which.

      Reputation is the other half and it only comes with time: a domain that
      has never sent mail gets no benefit of the doubt. Sending a few real
      messages a day for a couple of weeks before the import does more than any
      template change.
- [ ] **Point a real domain at the app.** Mail comes from
      `mail.kellyyager.com` and the invite link goes to `burnclub.github.io`.
      Different registrable domains, which filters weigh and members notice.
      `app.kellyyager.com` as a CNAME to GitHub Pages fixes both.
- [ ] **Warm the sending domain.** Don't send 200 invites in an hour from a
      domain with no history — that is the shape of a spam run. Spread the
      import across several days.

### Security — the sharpest items

- [x] **The member app authenticates.** Done 2026-09-19: real Supabase
      sign-in replaced a handler that was `e.preventDefault()` and nothing else.
      Invite-only — open signup is closed and confirmed refused by the server.
- [x] **The admin app authenticates too** — done 2026-10-08, this entry was
      stale. Real Supabase sign-in for Chris and Kelly, gated on the `staff`
      table; a member's own password is refused. Note what it does NOT do:
      admin still reads and writes its own browser storage for content, so
      signing in gates the screens, not the data.
- [~] **`admin/` and `staff/` are on the same public URL as the member app.**
      Worked through 2026-10-13. What was actually exposed, having looked:
      - **admin/** — the page is public but the gate is real (sign-in plus a
        row in `staff`), and the live member data behind it is protected by
        RLS, not by the URL. The content in `admin/data.js` is the same content
        the member app's own public `data.js` already carries, so moving admin
        to a private host would protect nothing that is not already published.
      - **staff/** — **its login was still decoration**: `preventDefault()` and
        show the app, any email, any password. Missed when admin was fixed.
        Now gated on the same `staff` table. It holds no real data — its own
        seeded MEMBERS and MESSAGES, all `@example.com` — so this was a page
        titled "BURN CLUB STAFF" full of invented people that a tester had no
        way to read as a demo, rather than a data leak.
      - Both now carry `noindex, nofollow`, which is the only thing that keeps
        a staff tool on a public host out of a search result.
      **Left open deliberately:** GitHub Pages has no server-side auth, so the
      HTML and JS of both apps remain fetchable by anyone. The protections that
      matter are the sign-in and RLS, and both hold.
- [ ] **A security pass over the auth surface** — not a read of the code, an
      attempt to break it. Started, and it has already paid for itself: on
      2026-09-21 a member could set their own `role` to `admin` from the browser
      console, because the policy letting members edit their profile covered
      every column. Closed by a trigger (`10-reset-epoch-and-lock-members.sql`)
      and **proven closed** by running that exact exploit against a real
      signed-in session: refused. Still to do: sign in as one member and try to
      read another's rows, and the same for storage once videos are there.

### Deploys reaching members

- [x] **The shell is versioned as a unit** — fixed 2026-10-12, after catching
      the real thing live. The service worker was network-first with
      `cache: "no-cache"`, which was meant to stop a member running yesterday's
      build. It was not enough: GitHub Pages serves `cache-control:
      max-age=600`, so each file revalidated on its own schedule and files
      deployed together arrived at different moments.
      What that produced was worse than stale. The live app was running a
      **NEW app.js against an OLD sync.js** — app.js calling a function that
      did not exist yet. Old code is a bug you can see; mismatched code is one
      you cannot. Two reloads did not clear it.
      Every shell request now carries `?v=<CACHE>`, so bumping `CACHE` in
      sw.js makes each one a URL the browser has never seen and no HTTP cache
      can answer. **This means CACHE must be bumped on any deploy that changes
      app.js, sync.js, data.js, style.css or index.html** — not just on changes
      to sw.js itself.
      Note: the service worker cannot be registered from the in-app browser on
      localhost ("an unknown error occurred when fetching the script"), so this
      is only testable on the live site.

### Onboarding, from the sale to the app

- [x] **A tester can be put on a program from admin** — built 2026-10-13.
      "Live accounts" at the top of Members lists the REAL `members` rows and
      sets program, start date and access on each. It is kept visually apart
      from the table below it, which is seeded demo content: merging them is
      how a coach ends up editing a fictional Priya K. and wondering why
      nothing happened.
      Each row says what is still missing — **Needs program**, **Needs start
      date**, or **Ready** — because those are exactly the two dead-end screens
      in `enterAsAuthedMember`. A rolling programme needs no start date and the
      field disables itself.
      Staff may write those columns: "staff manage members" covers the table
      and the `protect_member_columns` trigger only blocks NON-staff.
      **Proven on the live database 2026-10-14** — Chris edited Jordan Tester's
      name and internal note and both landed, which matters because they go to
      two different tables (`members` and `member_private`) and a partial
      success would have been the easy thing to miss.

      The first attempt failed, and the failure was worth having: *"violates
      foreign key constraint members_program_id_fkey"*. `members.program_id`
      points at the SERVER's `programs` table, which holds the three seeded
      programmes; admin's list is local to the browser and includes everything
      created in admin since. The modal was offering a choice the database
      would refuse. It now builds that list from the server, keeps a member's
      existing programme visible but labelled "not on the server yet" rather
      than silently reassigning them, and translates that one error into
      something actionable.
      Note it did not matter which field he changed: `saveMemberToServer` sends
      the whole record, so `program_id` rides along with every save.

- [x] **Members can change their own password** — built 2026-10-15, because
      hand-delivered invites made it necessary. A tester is handed a password
      set for them in the Supabase dashboard, and until now the only way to
      change it was the emailed reset link — the exact channel landing in spam.
      So they would have kept whatever they were given, indefinitely.
      Profile → Change Password. It asks for the current password and proves it
      by signing in with it, because Supabase will change a password on a live
      session alone — fine for a recovery link, which was itself proof, not
      fine for a phone left unlocked on a bench. Supabase's own reauthentication
      flow emails a code, which is the channel being routed around.
      Hidden for a demo session, which has no account to change.

- [x] **Invites: use the MAGIC LINK, not the invite email** (Chris,
      2026-10-16). He created a user and sent a magic link — **it arrived in
      the inbox, not spam**, and he will use that for the testers.
      Worth knowing why, because it is not luck: a magic link is a different
      Supabase template from the invite, and the invite's default is one bare
      "Accept the invite" button with no sender name, no product name and no
      reason for arriving — which is structurally what phishing looks like and
      is scored that way. See the invite-template rewrite further down; the
      magic link sidesteps it rather than solving it, and bulk sending will
      still need the real fix.
      **The actual flow, confirmed by Chris doing it 2026-10-16:**
      1. Create the user in the dashboard WITH an email and password. The
         password only has to exist; the tester never needs to know it.
      2. Send a magic link.
      3. They land in the app already signed in, on the "Choose a password to
         finish setting up your account" form — and set their own there.

      Caught by `access_token=` in `arrivedFromEmailLink()`, not by the type
      list; "magiclink" has been added to that list too so the path is
      explicit rather than incidental.

      **The trap, if a tester skips that screen:** the session persists, so
      they come back signed in — not knowing their password, and Profile →
      Change Password asks for the current one. Keep the passwords you type at
      creation; it is the fallback that always works. If someone does get
      stuck, the fix is a "send me a reset link" escape on the change-password
      screen, which should deliver like the magic link did.

- [x] **A member can change their own name and picture** — built 2026-10-16.
      Neither was possible: the name came from whatever the account was
      created with, which for an emailed invite is the part before the @, so
      "jordan.tester" rather than Jordan. `first_name`, `last_name` and the new
      `avatar_url` are exactly the columns `protect_member_columns` leaves
      alone — a member owns their own name and face.
      The picture is downscaled in the browser to a 512px square before upload
      (a phone photo is 3-5MB and 4000px wide for a circle rendered at 96), and
      one file per member, overwritten. The stored URL carries a cache-busting
      suffix, which is the reason for storing a URL rather than deriving one:
      the path never changes, so every browser and CDN would otherwise keep
      serving the old picture.
      Needs `supabase/19-avatars.sql` — the bucket, and policies scoped to
      `avatars/<auth uid>/`, so a member can only write in their own folder.

- [ ] **Plan the whole post-sale path, end to end** (Chris, 2026-10-13) —
      "from the listing on our shopify site, to the download of the app."
      Not started; it is a design conversation, not a task. Today the pieces
      exist but nothing joins them: Shopify takes the money and knows the
      buyer's email, Supabase holds the account, the invite email sets the
      password, and the app is a web page rather than a download. Nothing
      carries a buyer from one step to the next automatically, and nobody has
      decided what should.
      Worth doing properly when it comes up, because it decides several things
      at once: whether an account is created at purchase or on first sign-in,
      who sends the welcome, what a buyer sees in the gap between paying and
      being set up, what happens to a refund or a lapsed subscription, and
      whether "download" means an App Store build or an add-to-home-screen web
      app. The App Store answer in particular reaches back into the product —
      see the App Store section above.

### Members in admin — the rebuild (2026-10-13)

Chris: "now is the time when we start getting rid of the invented, demo
information." The five seeded members, their messages and the activity feed are
gone; `MEMBERS` is filled from the real table by `loadRealMembers()` and mapped
into the old shape so the eleven other things reading it keep working.

Agreed build order for the bulk actions, from his list:

1. [x] **Message each selected member individually** — done. One row per
       member into their own `dm-<id>` thread, in a single insert so a partial
       send cannot leave half the testers answering a question the other half
       never got. Group messaging dropped on his call.
2. [x] **Deactivate / reactivate** — done, and it had to be given a meaning
       first. Before today "inactive" was a label on the admin list and nothing
       else: proven 2026-10-13 that a paused member still appeared in challenge
       standings and in the group roster, and the member app has never read the
       field at all. An inactive member on a leaderboard is wrong under any
       reading of the word, so `groupMembers` and `challengeStandings` now
       exclude them, and the table carries a quiet "Paused" tag since Setup
       replaced Status as a column.
       **It deliberately does NOT revoke access.** An inactive member can still
       sign in and train. Taking away what somebody paid for is a commercial
       decision, not a checkbox, and it belongs with the refund and
       lapsed-subscription questions in the post-sale flow — Chris's call,
       not assumed. The confirm dialog says so in as many words.
3. [x] **Add to custom group** — done. Only CUSTOM groups are offered: a
       programme group is automatic (the way in is to change someone's
       programme) and teams are drawn per challenge.
4. [x] **Invite-only challenges** — done. A `programId` of `"none"` matches no
       programme, so nothing is swept in and membership is only what you add;
       `challenge.memberIds` holds those people. Both verified: an invite-only
       challenge starts empty while a programme challenge still returns
       everyone, and adding two of three Burn Club members to a private
       challenge leaves the third out.
       "Add to challenge" offers invite-only challenges ONLY. Naming someone on
       a programme challenge would write a list for people who are already in
       by derivation, and the two would disagree the moment anyone changed
       programme.

**Found while building 3, and fixed first:** `adminStateSnapshot` saved
circuits, schedules, folders and programs — **not CUSTOM_GROUPS and not
CHALLENGES**. Every custom group and every challenge ever set up existed only
until the page reloaded. The same shape of bug as `saveAdminCircuits` having
one call site: work that looks saved and is not. Both are in the snapshot now,
restored on load, and `saveGroup` / `deleteGroup` / `saveChallenge` /
"add group to challenge" all flush. Proven by reloading and reading them back.

**How membership actually works, since it decided the above:**
- **Program groups** are automatic — membership IS being on the program.
- **Custom groups** carry an explicit list, edited only from the group page.
- **Teams** are drawn by the app per challenge, not hand-managed.
- **Challenges have no member list at all.** `challengeStandings` computes it
  live from program scope plus attached groups. Proven 2026-10-13 by adding a
  member mid-challenge and watching the standings go 2 → 3 with no action.
  **That is why challenges must not simply get a member list** — a stored list
  is a snapshot, and Chris's first requirement is that a mid-program joiner is
  added automatically. The derived behaviour already does that; a list would
  break it.
  His second requirement — a private challenge between friends who are all in
  Burn Club — needs a scope matching NOBODY plus named members. So: add an
  "Invite only" scope (`programId` that matches no program, which the existing
  filter handles for free) and an explicit `memberIds` alongside the derived
  sources. Old challenges, having neither, behave exactly as now.

### The first-run experience

- [x] **The login screen showed two forms at once** — found and fixed
      2026-10-12, live on the site until then. `set-password-form` carries the
      `hidden` attribute, but `[hidden]` is only a UA default of
      `display: none` and `.login-form { display: flex }` beat it on
      specificity. So a signed-out member saw the sign-in form with "Welcome to
      Burn Club. Choose a password to finish setting up your account." stacked
      underneath it. Every `el.hidden = true` in app.js on one of those forms
      was a no-op for the same reason, which means arriving from an invite link
      showed BOTH forms, and the "not on a program yet" screen appeared below a
      live login form. One rule — `[hidden] { display: none !important; }` —
      fixes all three.
- [x] **Nothing is asked of a new member — settled 2026-10-12.** Setting a
      password still drops them straight into the app: no goal, no units, no
      height/weight, no notification permission. Chris's call is to leave the
      filling-in to the member and just make the gap visible ("we just need to
      make sure they know that it is 'incomplete' ... a red icon of sorts in
      their profile"). So: a red dot on the Profile tab, a red "N of 6 missing"
      badge on the My Health Profile row, and a small flag beside each required
      field in the form that is still empty — pointing at the field rather than
      naming it in a list at the top (Chris, same day). Each flag goes when
      that field is saved; the dot and badge go when the last one is.
      Required = height, weight, date of birth, sex, activity level, primary
      goal. Target Weight and Injuries are excluded because the form itself
      labels them optional, and a badge that can never be cleared is worse than
      no badge.
      The three dropdowns (Sex, Activity Level, Primary Goal) are now editable
      at Admin → Settings → Health Profile Options rather than written into the
      member app's HTML (2026-10-12, Chris). That also removed a second copy of
      the same three lists, which admin's member readout had been holding as
      its own label maps. An option's **id** is shown read-only and never
      follows a reworded label, because the id is what sits on every member
      profile that picked it; and an option removed after someone answered
      still shows on their form rather than silently blanking.
      **Still open:** nothing asks for a notification permission anywhere, and
      the profile is the only thing flagged — if anything else should carry a
      badge later, `renderHealthProfileFlag` is the pattern to copy.
- [ ] **No invite button in admin.** Admin's Members section creates a member
      record; the auth invite itself is sent by hand from the Supabase
      dashboard. Workable for 6–10 testers, not past that.
- [x] **The demo entries are off the login screen** — done 2026-10-12.
      "Continue as Guest" and "Preview as Fit & Functional member" run the app
      on `data.js`'s seed and never touch Supabase, so a tester tapping one
      would be reading someone else's fake workouts and logging into nothing.
      Hidden rather than deleted: `?demo=1` brings them back, so a walkthrough
      or a quick check still works without burning a real account. They also
      still show when Supabase is not configured at all, since otherwise a
      local copy with no config is a login form that cannot do anything.

### Content

- [ ] **Assign programs to the real accounts.** Partly stale as of 2026-10-12:
      chris@worthitcandy.com now has `program_id = burn-club` (confirmed on the
      live database), so that one is done. Re-check the other two.
      Previously: chris@worthitcandy.com,
      kelly@kellyyager.com and k_yager@yahoo.com all had `program_id` null,
      so they hit the "not on a program yet" screen. Set them in SQL or through
      admin once the members table is editable there.
- [ ] **Make Chris's account `role = 'admin'`.** All three real accounts are
      `member`, which is the right default — but nothing can currently pass
      `is_staff()`, so no one can read another member's rows or write content
      through the API. Needed before the admin app moves to the backend.

- [ ] **Technique text.** 661 of 663 exercises have none. It is also what the
      app reads aloud, so an empty field is a silently missing feature rather
      than a blank line.
- [x] **Videos — done 2026-09-30.** All 375 named clips are compressed and in
      the public `exercise-videos` bucket, and they play in the app. The
      remaining 299 exercises have no footage yet; that's filming, not a task
      for here.
- [ ] **Reload the exercises table in Supabase.** Ten misspelled ids were
      fixed in `data.js` on 2026-09-24 (`peck-deck` → `pec-deck`,
      `dd-reverse-crunch` → `db-`, `eg-extension` → `leg-`, `posts-march` →
      `psoas-march`, `sumo-db-db-squat` → one `db`, plus `rdlto`, `rdl-ro` and
      `5-secon`). The seeded table still has the old ones. Harmless today —
      nothing reads exercises from the server yet — and wrong the moment
      anything does.
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
- [x] **Benchmarks — answered and built 2026-10-21** (see the benchmarks
      section). Real members no longer inherit the demo three, results survive
      a deleted benchmark, and a benchmark with no workout can be self-tested.
      What is left is content: whether a Burn Club Test circuit gets tagged so
      testers can try the retest path. Original note below.
- [ ] ~~**Benchmarks — Chris wants a bigger conversation than the bug**~~
      (2026-10-20). Found while migrating Burn Club Test, and flagged as a
      decision rather than a fix. Full detail in the migration section; the
      short version is two separate problems that happen to show up as one
      symptom.

      **The symptom:** Burn Club Test carries no `benchmarks` array, so a
      tester's Progress -> Benchmarks shows the three seeded demo ones — The
      Gauntlet, Sprint 500m, Endurance Test. `syncBenchmarksToMemberApp()`
      filters to programmes that *have* benchmarks, so there is no bridge
      entry to match, and `loadProgramBenchmarks()` deliberately keeps the
      seed when nothing matches. Results are demo-gated, so it reads as three
      untouched benchmarks rather than invented history — still the wrong
      three.

      **The deeper half:** that bridge is `localStorage`, written by admin in
      Chris's browser. It never reaches a tester's phone. So even a programme
      that *does* have benchmarks hands a real member the seed. Benchmarks are
      the next thing after programmes that wants to come off the bridge and
      onto the server — same job as the content migration above, and probably
      the same push.

      **The question Chris is holding:** does Burn Club Test get real
      benchmarks for the trial week, does the section hide itself for a
      programme with none, or does the whole thing wait for the server move?
      Don't pick one; this is his and Kelly's call, and the answer decides how
      much of it is worth building now.

### Accessibility

- [ ] Reflow at 200% text, reduced-motion coverage, and native VoiceOver /
      TalkBack testing. The measurable contrast failures are fixed; these are
      the ones that need a device and a person.
- [x] **The brand blue — resolved by the new palette, 2026-10-01.** Buttons and
      anything carrying white text use `--color-action` (#4F6BD0) at 4.83:1. The
      lighter brand blue (#6B8AF9, 3.17:1) is now reserved for large fills like
      the Workouts card, where it clears the bar for big bold text only.

### App Store

- [ ] **A permanent demo account** for review, that never expires and always
      has data in it.
- [ ] **Nothing in the app may link to, mention, or hint at buying elsewhere.**
      Purchase happens on the website; Apple rejects apps that point at it.
- [ ] **A free-trial Burn Club program** so a reviewer can see the app work
      without a purchase.

### Known limits to close or accept

- [x] **Offline writes — done 2026-10-01 (phase 4).** The queue survives a
      reload, uploads the moment the connection returns, and the app itself
      opens with no signal. Chris confirmed it in airplane mode on his phone.
- [ ] **Admin and staff apps are still on browser storage.** Content is seeded
      into Supabase from `data.js`, so editing a workout in admin will not
      reach members until those apps move too. Acceptable for a tester trial —
      content should be stable while people hammer it — and wrong for live
      members.
- [~] **Messaging — client built 2026-10-12, waiting on the SQL.** The member
      UI was always finished (inbox, threads, bubbles, unread, compose, send);
      what it lacked was storage, so a sent message went to localStorage and
      reached admin only in the same browser on the same machine.
      `supabase/16-messages.sql` adds the table, policies and grants for two
      thread shapes: the member↔staff DM, and one group chat per PROGRAM so
      testers can talk to each other (Chris, 2026-10-12: "people often feel
      more comfortable talking to a peer, than they would Kelly").
      **Done 2026-10-12, both halves.** Migration run, and admin's inbox now
      reads the same table: DM threads rebuilt from the real `members` rows
      (admin built them from the SEEDED list, so its "dm-chris-v" never met a
      real "dm-<uuid>"), shared `staff_read_at` written on opening a thread,
      and replies sent under the coach's own name rather than "Staff".
      Verified end to end on the live site: member sends → appears in admin's
      inbox with an unread dot → opening it stamps `staff_read_at` in Postgres
      → coach replies → the reply shows in the member app.
      **Custom group chats — added 2026-10-15 (`18-group-chats.sql`).** Chris
      is putting all six testers in one group so they can talk to each other,
      which the peer-room thesis depends on: three rooms of two would not test
      it. The group and its roster now live on the server (`member_groups`,
      `group_members`), because RLS decides who may read a thread by asking the
      database and the membership was previously in admin's localStorage only.
      A policy cannot check a fact the database does not have, and filtering in
      the browser is hiding, not security.
      `messages` gained a `group_id` and a third `kind`. The one-target check
      constraint was rewritten rather than extended: the old one asserted that
      member_id and program_id were the only possibilities and would have
      refused every custom row.
      A member may read the groups they are in but **only their own row** in
      `group_members` — handing over the roster would turn a group chat into a
      member directory for anyone who opens the console.
      Team chats still have no table. They are drawn per challenge and were
      never what this was for.

      **Still open:** admin's Members section is still seeded — only the
      conversation list reads the real table, which is the smallest slice that
      makes the inbox true. Challenge team chats and custom-group chats have no
      table; they are hidden in the member app and say so in admin rather than
      swallowing a reply. Polling is a fetch a minute, paused in a background
      tab; Realtime is the answer past a handful of members.

- [ ] **`is_staff()` asks the wrong table — confirmed against the live database
      2026-10-12.** It reads `members.role`, but 15-staff-accounts.sql made
      staff their own table. Chris's account has `staff.role = 'admin'` and
      `members.role = 'member'`, so `is_staff()` returns **false** for him
      today, and every "staff read all" / "staff write" policy across all 25
      tables is dead code. Harmless so far only because admin has no backend
      code at all. `16-messages.sql` widens the function to accept either.

## Backend progress

Supabase, member-app-first. As of 2026-09-21:

- **Phase 1 — schema and content: done.** 25 tables, RLS on all of them, 663
  exercises and 185 workouts seeded from `data.js` by `supabase/generate-seed.py`.
- **Phase 2 — auth: done.** Real sign-in, invites, set-your-own-password,
  sign-out that actually ends the session.
- **Phase 3 — member data sync: done.** A member's history follows them between
  devices — proven with a weight logged on a phone appearing on a PC.
  Local-first: the device writes instantly, which matters in a gym with bad
  wifi, and syncs behind it.
- **Phase 4 — offline and states** and **phase 5 — hardening and testers** are
  next. **Phase 6 — admin onto the backend** is after testers, by Chris's call.

**Design assumption: members use one device.** Chris expects nearly everyone to
use one phone. "One device" still means a new device when the phone is lost,
replaced or the app is reinstalled, so the backend's main job is that **the
history survives the phone**. What that means for the work ahead:

- **Offline comes first.** One phone in a gym with bad wifi is the normal case,
  not the edge case. Phase 4 should be built around it.
- **The "not backing up" warning carries real weight.** A one-device member can't
  spot a sync failure by comparing devices; that warning is the only way they
  find out before the phone is gone. It must be hard to miss and must not cry wolf.
- **Two-device conflict handling is done and good enough.** It's built and
  tested (the dirty set, replace-store rules), so don't spend more on it.
  Keep testing with two devices anyway, because the second device is how we
  stand in for "the replacement phone".

**Before changing `sync.js`, run `tests/sync/run.sh`.** Sync failures are
silent by design — the work is always saved on the device — so a regression
there does not show up from using the app. Every one of the 24 tests exists
because the case it covers was broken at some point.

**Test the backend as a real signed-in member, not a demo profile.** The demo
profiles filled every gap with seeded data, which is precisely what hid most of
what was wrong: an unmapped field inherited the demo value and rendered fine.
Eight real faults in phase 3 were found only by Chris signing in and using it.

**To reset a test account:** reload every device first (so none is running old
code), then `supabase/reset-member-history.sql`. It bumps a counter that makes
each device discard its local copy rather than upload it. No clearing phones by
hand — that failed twice, and there is no way to see whether it worked.

## Security — a hard look before the real app

Chris's call (2026-08-30): before this becomes a downloadable app with real
members in it, security gets its own proper pass. Not a checklist to tick at
the end — several of these decide how things are stored, so they want deciding
before the backend is written, not after.

Nothing below is a live emergency: the prototype holds no real member data,
and every seeded record uses an @example.com address. They all become real the
day the member import runs.

**The two that matter most**

- **~~Neither app authenticates~~ — both do now** (member 2026-09-18, admin
  2026-10-08). Admin signs in against the same Supabase project and checks for
  a row in `staff`; being signed in is not enough, because a member has a valid
  account on this project and without that check their password would open the
  coach's admin. `supabase/15-staff-accounts.sql` creates the table.

  **The two apps share one session.** They are served from the same origin, so
  Supabase's stored session is shared between them. That is why `loadStaff`
  only signs a non-staff account out when they *deliberately* signed in at the
  admin URL — doing it while restoring a session would sign a member out of
  their own app just for opening `/admin/` once.

  **It gates the interface, not the content.** `data.js` is a static file in a
  public repo: the workouts and exercise library are readable by anyone who
  looks, signed in or not. Making the content itself private is phase 6.

- **The old position, superseded:** The member login form and the admin login
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


**Audio cues — built on 2026-10-03, and as good as the web allows, which is
not good enough.** Timers now sound two notes ten seconds out and three when
time is up: interval work and rest, AMRAP, cardio, and every EMOM minute. The
limit is the audio session, which a web page does not own:

- Web Audio gets iOS's **ambient** category. It mixes with music — what Chris
  wants — but it is **silenced by the hardware mute switch** and cannot duck
  what is playing. Chris tested it against Pandora and could not hear it, or it
  did not play; both are this.
- An `<audio>` element gets the **playback** category. Loud, survives the mute
  switch, and **pauses the music**.
- Only a native build can have both: playback + `mixWithOthers`. That one line
  of audio-session config is the whole fix, and it is the reason this stays on
  this list.

What was done in the meantime: the tones moved to 1-2kHz with a triangle plus
its octave (a pure sine is the easiest thing there is for music to mask), the
level went up about four times, **the clock now pulses persimmon for the last
ten seconds** so the warning survives a muted phone entirely, and Profile →
Workout Sounds turns the sounds off for members they don't suit. The pulse is
not a stopgap — keep it after the native build.

Still audio-only-when-native, and the reason the cues matter:

- **Static hold finishing.** The strongest case, and now the only cue a hold
  has no way to give: as of 2026-10-03 a hold is an instruction with no clock
  at all, so the member counts it themselves. During a hip thrust the member is
  looking at the ceiling, not the phone, so a pulse is no use — it has to be a
  sound, and the honest version of that is native.
- **Anything with the screen off or the phone in a pocket**, which the web
  cannot do at all.

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

- **Member management on the STAFF PHONE APP** (Chris, 2026-10-12: "i want to
  see it on the phone staff site as well so we can make these changes when we
  are on the go"). Open a member, change their program, set or change their
  program start date, and make account changes from a phone. Explicitly **not**
  for the tester trial — Chris raised it so it would be written down, not
  scheduled.

  Build it after admin's members go onto the backend, not before. The desktop
  member modal already has every field this needs — name, email, program,
  access variant, start date, status, member-since, badge, internal notes, plus
  read-only habits and health profile — but `saveMember()` mutates the
  in-memory `MEMBERS` array from `admin/data.js` and nothing else. No
  localStorage, no database: a refresh loses it, on desktop as much as on a
  phone. Building the phone screen first just adds a second screen that
  forgets.

  The database half is already done and waiting. `02-policies.sql` ships
  `"staff read all members"` and `"staff manage members"`, both `using
  (is_staff())`. **One catch to check first:** `is_staff()` reads
  `members.role in ('staff','admin')` — the members table — *not* the `staff`
  table from `15-staff-accounts.sql`, which only gates the admin app's UI. Per
  this file's own checklist all three real accounts are still `role = 'member'`,
  so nothing passes `is_staff()` yet. That is one UPDATE away, and it unblocks
  the whole permission layer.

  Three things about the staff app itself that will need handling whenever this
  is picked up — it has had no attention since 2026-08-06:
  - **No sign-in at all.** It opens straight into Messages, on the same public
    URL. Admin got real auth on 2026-10-08; this did not.
  - **No persistence, not even localStorage** — its own header says
    "everything here is in-memory only".
  - **It predates the palette.** It loads only its own `style.css`, never
    `palette.css`, so none of Kelly's 2026-10-01 colours reach it.

- **Per-slot cues are in; a block-level note is not** (2026-10-09). Chris asked
  how to give an exercise an instruction inside one workout — his case being an
  EMOM of Bulgarian Split Squats, left leg on the first minute and right leg on
  the second. Any exercise slot now takes an optional `cue`, shown after the
  name ("Bulgarian Split Squats / Left Leg"). What was offered alongside it and
  **not** built: a **note on the block** — a sentence shown on the breakdown
  card and once as the block starts, for instructions about the structure
  rather than one movement ("rest between A and B if you need it"). Chris took
  the cue and left this; build it if he asks.

  Two things that came out of the design and are worth not rediscovering:

  - **Equipment substitutions belong in the library's `technique` field**, not
    in a cue. "No bench? Use the floor" is true every time that exercise
    appears, so it is written once and shows in every workout — the player
    already has a collapsible technique row with a read-aloud button. It is
    blank on nearly all 636 exercises, so that field is sitting unused.
  - **AMRAP cannot carry per-round cues.** The member self-paces the list and
    the app never knows which round they are in, so there is nowhere for a
    round-specific cue to appear. Sides inside an AMRAP have to go in the
    exercise name in the library, or wait for the block note.

- **~~The member app ignores the new schedule item types~~ — done 2026-10-10.**
  Admin could put `cardio` and `note` (reminder) items on a programme day since
  2026-10-08 and the member app dropped every one. Worse than invisible on a
  day of its own: the Calendar took `template.find(...)`, the FIRST item for a
  day, so a cardio-only day rendered the words **"Workout unavailable"** at the
  member. Both confirmed against the running app before the fix.

  Now: the Calendar draws every item on a day, Home's list (retitled "Coming
  Up") carries them alongside the workouts, and a coach's cardio item taps
  through to the cardio log pre-dated to its own day.

  Two decisions inside it, both reversible:

  - **A coach's cardio item is ticked by any cardio logged that date** — and
    Chris wants it that way (2026-10-10: "if a person logs a normal cardio
    session on a day with coachs cardio, it will prioritize the coaches cardio
    ... if so, i like it"). Nothing is matched and nothing is tagged: a member
    who runs and logs it from the Cardio tab clears the day's assigned cardio
    without ever opening the card. Not checked: the activity, or the duration —
    six minutes of stairs clears "20 min easy run".

    There is no per-item completion record because the item belongs to the
    programme template, the coach's, not the member's — unlike a session the
    member schedules themselves, which lives in their own store with its own
    `completedId`. The remaining trade: two cardio items on one day both read
    done off the same log. If that starts mattering, the fix is a member-owned
    record keyed by programme day.

    Minutes on the card are **summed across the day**, not read off one entry.
    Showing the first logged meant a 6-minute stair session hid the 25-minute
    run done later the same day; it now says "31 min logged across 2 sessions".
  - **Progress still counts workouts only.** `memberProgramPosition` drives
    "3/6 Done This Week", and cardio days do not add to the denominator. A
    programme with three cardio days a week would under-report how much the
    member is actually being asked to do — worth revisiting with Chris once
    he has written one.

  **Reminders cannot be ticked off.** They show on the day and on Home, and
  they go when the day passes. A check-off needs a member-owned store; nobody
  has asked for one yet.

- **Focus is derived, difficulty is off, and both are on trial** (2026-10-08).
  The builder's Focus and Difficulty are hidden inputs — hidden in August
  because "focus is carried by the workout's name" — but they were still being
  *saved*, as defaults nobody chose: focus fell back to "Full Body" and
  difficulty was hardcoded "Intermediate" in the HTML. Every workout Chris
  built reached members as "Full Body · Intermediate" with a full-body icon,
  because `circuitIconKey` reads the middle of that string.

  Focus now comes from the body-part tags of the exercises in the workout —
  his "W1 Shoulders and Abs" derives "Shoulders & Abs". Difficulty is dropped
  from display. **Both values are still stored**, so this is reversible: Chris
  wants to live with it before deciding whether derived focus is the permanent
  answer, whether difficulty comes back as a real field, or whether it belongs
  on the program rather than the workout.

  Two things to watch while it is on trial: the derived focus is computed when
  a workout is saved, so re-tagging an exercise later does not update workouts
  already synced; and the icon picks the first rule that matches, so
  "Shoulders & Abs" draws the core icon rather than the upper-body one.

- **When messaging is built, it is a SHARED STAFF INBOX** (Chris, 2026-10-08 —
  a decision to apply then, not a job for now; he knows it does not work yet).
  A member writes to "the coaches", not to a person. Both staff accounts see
  that a message is open, and either can answer it.

  That falls out of the right data model rather than needing anything extra:
  one `messages` table of member↔staff threads, RLS so a member reads only
  their own and staff read all. Both admin accounts are then looking at the
  same rows by construction. Building it any other way — per-staff copies, or
  a thread owned by whoever replied first — would take work to get wrong.

  **Read is shared too** (Chris, 2026-10-08): when one of them reads a message
  it clears for both. So "read" belongs on the message — a single `read_at`,
  and who cleared it if that turns out to be worth knowing — not on a
  per-staff join table. One of them handles it and it stops nagging the other,
  which is the whole point of a shared inbox.

  Where it stands today: no table, nothing in `sync.js`, and
  `broadcastMessage` writes to `LIVE_MESSAGES_KEY` in localStorage — its own
  comment says "same-browser only". A member messaging from a phone writes to
  that phone and nowhere else; admin's inbox is seed data. Which also means a
  tester tapping "message your coach" gets silence, so messaging wants either
  building or hiding before testers arrive.

- **~~Archiving a program is a filing action and nothing more~~ — fixed
  2026-10-08.** Archiving now means what Chris wants it to mean: whoever is on
  the program carries on, nobody new is put on it. Archived programs leave the
  pickers that *start* something (assign a member, file a folder, aim a
  challenge) and stay in the ones that *find* something (the member list
  filter, the activity filter) — which is exactly when you need them. The
  member-assign dropdown re-adds a member's own archived program, labelled, so
  that opening their record does not silently move them to whatever is first in
  the list. The member app is untouched: it never read program status, and a
  member mid-program notices nothing.

  Was, before that:
  `toggleProgramArchived` sets `status: "archived"` on admin's own copy and
  that is the whole of it. Demonstrated by archiving one: it leaves the
  Programs grid for the Library, its workouts stay in `CIRCUITS`, **and it is
  still offered in the member-assign dropdown** — `populateProgramFilters`
  lists every program regardless of status. The member app never reads program
  status at all; a member gets workouts by `programId`, so archiving changes
  nothing for anyone already on it.

  Half of that is right and half is a trap. Not pulling a program out from
  under someone mid-way is correct. Still offering it for *new* assignments is
  not what "archived" means to anyone, and nothing in the UI says otherwise.
  **Decide what archiving should mean before it is used in anger**: almost
  certainly "existing members carry on, no new assignments", which is a filter
  on the dropdown plus a line on the member modal explaining why someone is on
  a program that is not listed.

- **~~The exercise NAME is the join key everywhere~~ — done 2026-10-08 for
  member data.** `lifts` and `showcased_prs` now carry `exercise_id` and
  conflict on it, so renaming an exercise no longer orphans a member's logged
  sets or their pinned PRs; history comes back under whatever the exercise is
  called now. `supabase/14-exercise-id.sql` backfills existing rows. The id is
  *derived* from the name (slugify, with five hand-authored exceptions) rather
  than looked up, which is what makes it safe for an exercise the library has
  never heard of — a lookup could miss, a derivation cannot. `tests/sync/
  exercise-rename.test.js` fails if the name-keyed read comes back.

  Still outstanding, and much smaller: **workout blocks still name their
  exercise** (`exercise: { name }` in `data.js`). Admin cascades a rename
  through them, so nothing breaks today, but they should carry the id too.
  `personal_bests` is a dead table — in `01-schema.sql`, never read or written;
  drop it when convenient.

- **Local caches still key on the name, and that is fine.** `LAST_WEIGHTS` and
  a completion's own `weights` object are keyed by exercise name. After a
  rename the pre-fill forgets one weight and relearns it, and the completion's
  names are rewritten from the server on the next hydrate. Neither loses
  anything, so neither is worth a migration.
- **Admin only saved what the importer wrote, until 2026-10-08.** Chris asked
  whether Kelly could build a program across several sessions without losing
  it. The answer was no, and the test was one reload: a workout built in the
  builder went into memory and nowhere else, and a program created in the UI
  was dropped by the restore, which skipped any program not already in the
  seed. `saveAdminCircuits()` had exactly one call site — the end of the
  spreadsheet importer.
  Now a debounced save hangs off the four render functions that follow every
  change, rather than off the thirteen separate mutation sites, so code written
  later cannot forget it. Writes are gated on the restore having succeeded; a
  store that fails to parse is copied aside, left in place, and saving stays
  off for that session, because a corrupt value is still the only copy of
  someone's work. Also flushes on pagehide and visibilitychange, for the edit
  made inside the 400ms debounce.
  **What this still is not:** localStorage. Clearing site data takes it, a
  private window never keeps it, and Safari evicts script-writable storage
  after about 7 days without a visit. Export All is the actual backup.

- **Getting admin content to members is still a hand-carry** (2026-10-08).
  Chris builds programs in admin; admin keeps them in `localStorage`; members
  read `data.js`. So a program reaches testers by my folding the export into
  `data.js` and pushing — every content change costs a deploy, which he has
  accepted for the trial. Two things make that bearable:
  - **Export All** (Programs header) downloads everything authored as one JSON
    file. That is how the work reaches me, and it is also the only backup —
    until phase 6 his programs exist in one browser's localStorage, and a
    cleared cache takes them with it. Worth clicking after any real session.
  - **For his own testing he does not need me at all**: admin writes
    `burnClubLiveCircuits`, the member app reads it and listens for changes, so
    in the same browser a workout he just built is immediately walkable. That
    is the loop for "go through the motions and see what we want to change".

- **The importer still can't carry a superset rep scheme.** The builder can
  since 2026-10-08 — the Reps field takes "10,8,8,6" and writes `scheme`, one
  number still writes plain `reps`, and editing a workout puts the scheme back
  in the field. The spreadsheet route did not follow: its "Ladder Scheme"
  column is read only for the ladder type (`BLOCK_FORMATS`, `admin/app.js`).
  Either let superset rows use it or rename the column to cover both — it is
  the same idea in both places. Only matters once Chris imports rather than
  builds by hand.

- **The workout flow: straight sets and static holds are done** (2026-10-03).
  Supersets first — per-round rep schemes, the demo strip, weights at the end
  of each block, the overview button. Then:
  - **Straight sets.** Done-per-set is right: it's what starts the rest period.
    The four separate set tiles became **one card** on 2026-10-05 (Chris: "i
    want to try out combining all of the set cards into one large card. It
    looks to seperate right now"), drawn from his sketch — exercise name
    outside, a drop shadow a quarter darker than the old one (a 1pt outline
    was tried on 2026-10-05 and rejected the next day), SETS as a left-hand
    column header (no count), then set number, reps, dotted leader, Done. Reps stayed on the left where they have always been, and
    Done stayed a word rather than becoming a tick — both Chris's call, for
    consistency with everything else. The whole row is the tap target, not
    just the Done box. The end-of-block weight screen was rebuilt on the same
    card so the two screens read the same way round, with the input standing
    where Done stands.
    Behaviour is untouched: same Done, same rest, same weights.
  - **Static holds are instructions, not timers** (2026-10-03). The hold used
    to be a button on the row that started a countdown, and reps-then-hold was
    rewritten into a two-row superset — the same exercise listed twice. Chris
    killed both: his case is a superset of normal glute bridges with the last
    rep held at the top, where the member is under load with no free hand and
    the phone is on the floor. Now the lift and its hold are one row —
    "10 reps", with "last rep: hold 20s" as subtext beneath it rather than a
    pill beside it (2026-10-06, Chris, to differentiate the two). A hold that
    is its own superset station still reads as a "hold 30s" pill, and a
    hold-only straight set got its Done button back. Nothing
    to start, and completion is the tap that was happening anyway. A hold still
    takes no weight. `holdExercise` went with the second row — a hold can no
    longer carry its own library entry, and so its own video. Nothing in the
    data used it. The demo workout **Static Hold** shows both shapes.

- **The workout flow is the most important thing in the app** (Chris,
  2026-09-21). How a member moves through a workout must be as intuitive as
  possible, and it gets reworked before phase 5 (testers). His main concerns
  are straight sets and, above all, **supersets, which the programs use
  constantly**. Settle the workout data structure as part of this work, because
  after testers start logging, changing it means converting real history.
- **Whole-workout overview button** (Chris, 2026-09-21). A button near the top
  of every workout that opens a pop-up of the entire workout, start to finish.
  It's like the workout's opening page but more drawn out, with finished
  exercises crossed out or faded. It's for a member who gets lost, or who just
  likes seeing their progress. Build it as part of the workout-flow rework.

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

- **Download a workout as an image** (Chris, 2026-10-16). "We have some users
  who like to do the workouts on their own, not go through the progression
  within the app ... a version of a workout that they can pull up outside of
  the app (like in their photos or similar)." Deferred the same day, once the
  shape was clear: "hold off on this build for now ... we can revisit when we
  aren't preparing for a live test." **Not for the tester trial.** The design
  below is the whole conversation, so this does not have to be re-derived.

  **Source: the workout overview screen** (`#screen-detail`), which is what
  Chris pictured and is already the one page showing the whole session at once.
  It serves structured and on-demand workouts both, so the feature covers both
  with no extra work.

  **Draw it on a canvas from the data — do NOT screenshot the DOM.** The
  obvious route is html2canvas, and it is the wrong one: a ~50KB dependency on
  a PWA that must work offline (and that already has a service-worker cache
  coherence problem), output that differs per browser engine, and known
  trouble with exactly what this app uses — custom fonts, inline SVG icons,
  CSS custom properties. It would also export the furniture: back button, week
  pill, bottom nav, Start Workout.

  Drawing it instead costs more code and buys three things. `blockHeading()`,
  `blockSummaryLine()` and `blockExerciseNames()` already produce every string
  on that screen, so the exporter reuses them and cannot drift from what
  members read. Exercise cues come along free, since they live in
  `exerciseDisplayName()`. And the sheet becomes a document rather than a photo
  of an app — wordmark (`assets/burn-club-wordmark.png`), title, programme and
  week, then the blocks. Render at 2x for a crisp image.

  **PNG, not PDF**, because Chris said Photos: on iOS a PDF goes to Files.

  **Delivery is two taps and there is no way around it.** `navigator.share({files})`
  opens the share sheet, where the member taps "Save Image"; no web API writes
  to the camera roll directly. Desktop falls back to a download.
  **Verify Web Share inside the INSTALLED home-screen app, not just Safari** —
  that standalone context is exactly where `window.prompt()` turned out to be
  unsupported (see the section on it above), and the same class of surprise is
  likely here.

  **Open question Chris had not answered when this was parked:** blank weight
  lines beside each exercise. It is the one thing a sheet can do that the
  screen cannot, and it changes the layout rather than a line of code — it
  turns the export from a picture of the workout into the thing someone
  carries round a gym. Decide this before building, not during.

  **The real product question, also unanswered.** A workout trained off a saved
  image **is not logged**: no completion, no streak, no benchmark entry,
  nothing in the Community feed, and holes in Progress on days the member
  actually trained. Chris knows these members and says some already train this
  way, so this may be acceptable — but it should be chosen, not discovered.
  Three options: accept the gap, print "log it in the app when you're done" on
  the sheet, or have the export set up a one-tap "mark as done". Related, and
  accepted: an image cannot carry the demo videos. For the experienced members
  this is aimed at, that is the point rather than a loss.

## Settled — don't revisit

- **A cue is a suffix, never the exercise name itself** (2026-10-09). Chris
  asked whether he could just type "- Left Leg" onto the end of an exercise
  name in the builder. He can have exactly that on screen, but the name in the
  data stays the library's and only the suffix is stored, because four things
  join on the name: the demo video, the technique row, the Track Weight flag,
  and — the one that cannot be undone — the member's logged history.
  `exerciseIdForName` in `sync.js` slugifies any name the library does not
  know, so "Bulgarian Split Squats - Left Leg" would log under its own id,
  giving that movement three separate histories and three separate PRs with
  nothing able to merge them afterwards. `tests/sync/exercise-cue.test.js`
  holds that line; it was checked against the free-text version and five of its
  seven checks fail there.

  A bonus of storing only the suffix: renaming an exercise in the library still
  flows through to every cue that uses it.

- **The player's big heading never runs past two lines** (2026-10-09, Chris:
  "lets shrink the type enough to make sure it is only 2 lines. Lets make this
  a rule across the board"). It started as a cue problem — "Bulgarian Split
  Squats / Left Leg" wrapped to three at 39px and pushed the clock off the
  screen — but it was never only about cues: "Single Arm Farmer Carry Cossack
  Squat" already ran to three on its own.

  `fitPlayerHeading` shrinks from 39px down to a 20px floor until the heading
  fits two lines, and every write to that element goes through
  `setPlayerExerciseHeading` so nothing can bypass it. Short names keep the
  full 39px; only a name that needs room gives any up.

  Three things the fit depends on, so don't break them casually:

  - `line-height` in `.player-exercise-name` must stay in step with
    `PLAYER_NAME_LINE_RATIO` — the measurement is "is this taller than two of
    those?".
  - It re-fits on **resize** (rotation changes the width) and on
    **`document.fonts.ready`** (a fit measured against the fallback font picks
    the wrong size on a cold load).
  - It bails when the player screen is hidden, because every measurement reads
    0 there. `Player.start` shows the screen before the first render, so this
    is a guard, not a code path.

  The 20px floor is measured: at 320px wide — an SE, the narrowest phone worth
  supporting — all 636 library names fit two lines, the worst of them
  ("Sumo DB Squat Static Hold w/ Alternating Calf Raise") needing 21px. A name
  that long *plus* a cue would need 17px, which is past readable, so it takes a
  third line instead; the answer there is a shorter cue.

- **In a superset of one movement, the rows show only the cue** (2026-10-09,
  Chris: "like the superset idea, keep that"). The heading above the list is
  already the exercise name, so "Bulgarian Split Squats" + two rows repeating
  it was three lines saying the same thing. Rows read "Left Leg" / "Right Leg"
  when the whole list shares a name, and the full cued name otherwise.

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
