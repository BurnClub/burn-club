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

## Decisions still open

- **Personal Bests placement.** Chris wants it somewhere other than the
  Progress tab but hasn't decided where. Its current spot is provisional.
- **Check-in feature** is paused pending partner feedback. Not a thread to
  push on unprompted.
- **Drop sets.** Designed for but not built — they'll be a sibling field on
  the exercise entry alongside `hold`, not an overloaded "add-on" object.
- **Exiting mid-workout via the ✕ still discards.** An *abandoned* session
  now offers to log a partial; a deliberate quit doesn't. Slightly
  inconsistent, and left alone rather than redesigned unasked.
