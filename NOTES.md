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

**Card titles need resizing or more breathing room (Chris, 2026-10-01).**
"Community Buzz" looks like it is hanging off the edge of its card. Those two
Home cards (Daily Habits and Community Buzz) sit side by side at half width, and
Nunito is wider than the condensed face it replaced, so a 16px title nearly
fills the card. Fix by some combination of title size, card padding (18px now)
and letting the longer ones wrap — check every card title at phone width, not
just these two. Kelly flagged the same risk in her handoff.

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

3. [ ] **Preview next week** — Chris wants a button to look ahead, and said it
       could come later. Worth noting that pinning the Calendar made it less
       optional than it was: on a Saturday the screen now shows one day, which
       is exactly when someone is thinking about what is next.
       `calendarWeekStart` already exists for this and resets to the member's
       own week whenever the tab is opened — a preview is a look ahead, not a
       new place to be.

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

## Final Walkthrough

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
- [ ] **Rewrite the invite email template — now the main suspect.**
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

- [ ] **Invites for the first six are hand-delivered** (Chris, 2026-10-13).
      The invite email still lands in spam and that is not being fixed before
      the trial. The decision is to send the link personally and walk each
      tester through setting a password. Fixing deliverability is wanted soon
      after, not before.

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
