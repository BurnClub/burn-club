# Exercise import

Admin → Exercise Library → **Upload Spreadsheet**. CSV only — export from
Excel or Sheets. Download the template from that same screen for a
correctly-headed starting file.

## Columns

Matched **by header name, not position**, so column order doesn't matter.

| Column | Required | Notes |
|---|---|---|
| `Id` | **yes** | The exercise's identity, and its video filename (`<id>.mp4` — see `video-spec.md`). Lowercase letters, digits and single hyphens. Never change one after videos are named. |
| `Name` | new rows | What members read. No character restrictions — punctuation is fine here. |
| `Body Parts` | no | Semicolon-separated: `Quads;Glutes`. Commas are the CSV delimiter, so they can't be used inside a cell. |
| `Equipment` | no | Semicolon-separated: `Dumbbells;Kettlebell`. This is where "either DB or KB" belongs — as data, not as a slash in the name. |
| `Type` | no | `Strength`, `Cardio` or `Stretch`. Anything else warns and falls back to Strength. |
| `Technique` | no | The coaching cue. Also what the app reads aloud, so write it to be heard. |
| `Track Weight` | no | `Yes`/`No`. Turns on the weight field and PR tracking. |
| `Video URL` | no | Leave blank until videos are hosted. |

## Deriving the Id

Lowercase the name and turn spaces into hyphens — but **punctuation has to go
too**, and a spreadsheet's find-and-replace won't catch it on its own. A `/`
is the one that actually breaks things: it can't exist in a filename.

`DB/KB Row` → **`db-kb-row`** (keep the slash in `Name`, drop it in `Id`).

This Excel formula handles the slash, stray double spaces and `DB / KB`
spacing in one go, by splitting on separators and rejoining:

```
=TEXTJOIN("-",TRUE,TEXTSPLIT(LOWER(TRIM(SUBSTITUTE(SUBSTITUTE(A2,"/"," "),"-"," ")))," "))
```

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
