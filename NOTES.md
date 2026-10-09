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
- [ ] **The admin app still doesn't.** Its login is still decorative. Moves
      when admin goes onto the backend (phase 6).
- [ ] **`admin/` is on the same public URL as the member app.** Anyone with the
      link has full access to every admin screen today. Harmless with seed
      data; not on import day.
- [ ] **A security pass over the auth surface** — not a read of the code, an
      attempt to break it. Started, and it has already paid for itself: on
      2026-09-21 a member could set their own `role` to `admin` from the browser
      console, because the policy letting members edit their profile covered
      every column. Closed by a trigger (`10-reset-epoch-and-lock-members.sql`)
      and **proven closed** by running that exact exploit against a real
      signed-in session: refused. Still to do: sign in as one member and try to
      read another's rows, and the same for storage once videos are there.

### Content

- [ ] **Assign programs to the three real accounts.** chris@worthitcandy.com,
      kelly@kellyyager.com and k_yager@yahoo.com all have `program_id` null,
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
- [ ] **Messaging, groups and challenge teams have no tables yet.** Phase 2 of
      the schema.

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
