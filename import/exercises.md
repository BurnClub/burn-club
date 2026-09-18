# Exercise import

Admin → Exercise Library → **Upload Spreadsheet**. CSV only — export from
Excel or Sheets. Download the template from that same screen for a
correctly-headed starting file.

## Columns

Matched **by header name, not position**, so column order doesn't matter.

| Column | Required | Notes |
|---|---|---|
| `Id` | **yes** | The exercise's identity, and its video filename (`<id>.mp4` — see `video-spec.md`). Lowercase letters, digits and hyphens. Also accepted as `Workout ID`, which is what the sheet calls it. Never change one after videos are named. |
| `Name` | new rows | What members read. No character restrictions — punctuation is fine here. |
| `Body Parts` | no | Either one semicolon-separated cell (`Quads;Glutes`) **or** numbered columns — `Body Part 1`, `Body Part 2`, `Body Part 3` are merged. A trailing number is stripped off any header, so add as many as you like. Commas are the CSV delimiter and can't appear inside a cell. |
| `Equipment` | no | Same: one semicolon-separated cell, or `Equipment`, `Equipment 2`, … merged. This is where "either DB or KB" belongs — as data, not as a slash in the name. |
| `Type` | no | `Strength`, `Core`, `Cardio`, `Stretch` or `Static Hold`. Anything else warns and falls back to Strength. |
| `Technique` | no | The coaching cue. Also what the app reads aloud, so write it to be heard. |
| `Track Weight` | no | `Yes`/`No`. Turns on the weight field and PR tracking. |
| `Video URL` | no | Leave blank until videos are hosted. |

## Deriving the Id

Lowercase the name and turn spaces into hyphens, then deal with punctuation —
a spreadsheet's find-and-replace won't catch it on its own.

| in the name | in the id | |
|---|---|---|
| `/` | `-` | `DB/KB Row` → `db-kb-row` |
| `&` or `+` | `and` | `Up & Overs` → `up-and-overs` |
| `w/ ` | `w--` | `Squat w/ Hold` → `squat-w--hold` |

**Double hyphens are fine** (Chris, 2026-09-17) — `w/ ` collapsing to `w--` is
the convention, and a run of hyphens is legal in both a filename and a URL
path. What isn't fine is a character that can't be in a filename at all, or a
leading/trailing hyphen, which only ever comes from a stray space.

Keep the punctuation in `Name` — that's display text with no restrictions.
Only `Id` is constrained.

The upload validates every Id and **blocks** rows it can't accept rather than
importing an exercise whose video could never be found. Bad ids are reported
per row with the offending characters named, so fix and re-upload.

## Partial uploads

**Only the columns in the file are written.** A sheet of just `Id` and
`Technique` fills in technique and leaves body parts, equipment, type and
track-weight exactly as they were.

That's what makes it safe to import the library now and bulk-upload the
technique column later, as a separate pass, once it's written. The preview
screen lists which columns the file carries before you confirm.

## Matching

Rows match existing exercises on `Id`. A row whose Id is already in the
library updates it; a new Id adds one.

If a sheet has no `Id` column at all, rows fall back to matching on `Name`,
case-insensitively — weaker, and worth knowing why: **workouts reference
exercises by name, and the member app matches names exactly.** So a sheet
saying `Goblet squats` against a workout saying `Goblet Squats` would match
here and then silently show no technique in the app. Use the Id column.

## Tag vocabulary

`BODY_PART_TAGS`, `EQUIPMENT_TAGS` and `MODALITY_TAGS` in `data.js` follow the
spreadsheet, not the other way round — they're search tags and nothing computes
from them. Short forms are canonical (`DB`, `KB`, `Bands`) because that's what
gets typed in the sheet.

`TAG_ALIASES` folds variants onto one tag so they don't become two filter chips
for the same idea: the long forms the demo data used (`Dumbbells` → `DB`),
singular/plural drift (`Hip Flexor` → `Hip Flexors`), and `Endurance` → `Cardio`.

Adding a tag means adding it to both `data.js` files — the member app keeps its
own copy.
