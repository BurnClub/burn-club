# Workout & program import

For **structured** programs — a fixed week-by-week schedule. 30 Minute Burn is
the first: 8 weeks, 4 sessions a week, Home and Gym versions of each.

One row per **exercise line**. A workout spans several rows; a block within it
spans one row per exercise. Fill `workouts-template.csv` and upload it in
Admin → Programs.

## Identity

A workout is identified by **Week + Day + Variant**. There is no id column to
author, deliberately: in a structured program a workout *is* "the Home version
of week 3, day 2", so that triple is already its name. Renaming a session's
title or changing its focus doesn't change which workout it is, and a
re-import updates in place rather than creating a duplicate.

`Day` is **1–7 within the week**, not 1–56. Days with no rows are rest days —
there is nothing to write for them.

**The schedule comes from the sheet.** Which days carry sessions, and how many
weeks the program runs, are read off the rows rather than fixed in the code.
Move a session from day 3 to day 4 and re-import, and the schedule follows.

## Columns

### Workout level — Week, Day, Variant, Title, Focus, Difficulty, Description

`Variant` is `Home` or `Gym`. Every session needs both, so each appears twice
with the same Week and Day.

Title, Focus, Difficulty and Description can be written **once on the
workout's first row** or filled down every row — whichever you prefer. The
importer takes the first non-blank value and flags it if two rows of the same
workout disagree, so a mis-sorted sheet is caught rather than silently taking
one at random.

### Block level — Block, Block Label, Block Type, and the timing columns

`Block` is 1, 2, 3 … in the order they're performed. Every row of the same
block repeats its number.

`Block Label` is what the member reads above it ("Main Strength",
"8-Minute Finisher"). Once per block is enough.

| Block Type | What it means | Timing columns it uses |
|---|---|---|
| `Straight` | One exercise, sets × reps, rest between | `Rest (sec)`, plus `Sets`/`Reps` per row |
| `Superset` | Work down the list back-to-back, rest, repeat | `Rounds`, `Rest (sec)`, plus `Reps` per row |
| `AMRAP` | As many rounds as possible in the time | `Duration (min)`, plus `Reps` per row |
| `EMOM` | One set at the top of each interval | `Duration (min)`, `EMOM Interval (sec)`, plus `Reps` |
| `Interval` | Timed stations, short rest, repeat for rounds | `Rounds`, `Work (sec)`, `Rest (sec)` — no reps |
| `Ladder` | One exercise, descending/ascending reps | `Ladder Scheme` (`10;8;6;4;2`), `Rest (sec)` |

Interval and Ladder aren't in 30 Minute Burn but the format carries them, so
they're there if a later program needs them.

**Durations are in minutes, rest and work in seconds.** The code stores
everything in seconds — a 12-minute AMRAP is `720` internally — but you write
`12`, and the importer converts. Rest of `60` means sixty seconds.

### Exercise level — Exercise Id, Sets, Reps, Ladder Scheme

`Exercise Id` is the id from the exercise library — `goblet-squat`, not
"Goblet Squat". **Use the id, not the name.** Workouts currently reference
exercises by name and the app matches exactly, so "Goblet squat" against
"Goblet Squat" silently costs that exercise its technique text and its video.
The id is checked against the library on upload and an unknown one blocks its
row.

Which of Sets / Reps apply depends on the block type — see the table above.
A blank is fine where the type doesn't use it.

## What gets checked on upload

- Every `Exercise Id` exists in the library
- `Block Type` is one of the six, and its required timing columns are present
- Rows of one workout agree on Title, Focus, Difficulty and Description
- `Week`/`Day` are in range, `Variant` is Home or Gym
- Every Week + Day has **both** variants — a session with only one is flagged,
  since a member who bought the other would find an empty day
- Block numbers within a workout run 1, 2, 3 with nothing skipped

As with exercises, a row that fails **blocks** rather than importing something
broken, and the preview says what it found before anything is written.
