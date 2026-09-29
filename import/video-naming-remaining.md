# Exercise videos still to name

As of 2026-09-29: **341 of 664 exercises have a named video.** These **38 clips**
are what's left in the main folder of `/Volumes/Extreme SSD/EXERCISE LIBRARY`
matching no exercise id. Regenerate this list from the drive if it drifts — the
audit is in the session notes; it compares filenames against the ids in
`data.js`.

Chris answers by number in chat. Valid answers: an exercise name, "add to
folder" (moves it to `_not-in-library/`), "spare" (moves it to `_duplicates/`),
or "add the exercise". My pick is first, alternatives after.

| # | Video file | My pick | Or |
|---|---|---|---|
| 1 | `military-press-complex-single-single-both` | spare — Military Press Complex already has one | |
| 2 | `neutral-landmine-row` | Landmine Row | |
| 3 | `neutral-normal-glute-bridge` | Neutral Glute Bridge | |
| 4 | `neutral-to-supinated-incline-db-chest-press` | probably new | Incline Neutral to Supinated DB Fly |
| 5 | `pendlay-overhand-barbell-row` | Pendlay Row | |
| 6 | `pronated-db-chest-press` | probably new | Pronated DB Floor Press, DB Chest Press |
| 7 | `pronated-front-raise-with-singles` | Pronated DB Front Raise Complex | |
| 8 | `pronated-to-supinated-cable-tricep-extension` | probably new | |
| 9 | `pulse-squat` | probably new | Sumo DB Pulse Squat, Sumo Cable Pulse Squat |
| 10 | `resistance-band-row-with-static-hold` | Neutral Banded Row Static Hold | |
| 11 | `resistance-band-squat` | probably new | |
| 12 | `resistance-band-thruster` | Banded Thruster | |
| 13 | `reverse-incline-db-row` | Chest Supported Incline DB Row | Reverse Incline Rear Delt Fly |
| 14 | `reverse-lunge-to-kick` | probably new | Reverse Lunge to Knee Up / Knee Hug |
| 15 | `seated-military-press` | Seated DB Shoulder Press | Standing DB Military Press |
| 16 | `seated-single-arm-pulldown` | Floor Single Arm Lat Pulldown | |
| 17 | `single-arm-bent-over-cable-tricep-extension` | Single Arm Bent Over Cable Tricep Kickback | |
| 18 | `single-arm-cable-field-goal-external-rotation` | Single Arm Cable Field Goals | Cable External Rotation |
| 19 | `single-arm-db-snatch` | probably new | |
| 20 | `single-arm-db-upright-row-with-front-raise` | probably new | Single Arm DB Upright Row w/ Static Hold |
| 21 | `single-arm-lat-pulldown-complex` | probably new | |
| 22 | `single-arm-preacher-curl-on-bench` | Single Arm Machine Preacher Curl | |
| 23 | `single-db-squat` | Single KB Front Squat | Goblet Squats |
| 24 | `slow-eccentric-crossbody-rdl-with-kb-db` | probably new | |
| 25 | `spring-ig-2` | not an exercise? | Sprint Intervals |
| 26 | `standing-band-row` | Standing Neutral Band Row | |
| 27 | `standing-lat-pulldown-with-rope` | Straight Arm Lat Pulldown w/ Rope | |
| 28 | `sumo-deadlift` | Sumo Barbell Deadlift | Sumo Cable Deadlift, KB Deadlift |
| 29 | `sumo-landmine-rdl` | Sumo Landmine Deadlift | |
| 30 | `supinated-db-chest-press` | probably new | Alternating Supinated DB Chest Press |
| 31 | `supinated-db-curl` | probably new | |
| 32 | `supinated-db-row` | probably new | Supinated Inverted Row, 3-Point Row |
| 33 | `supinated-grip-cross-body-front-raise` | probably new | |
| 34 | `supinated-shoulder-press-complex-single-single-both` | spare — Supinated Shoulder Press Complex has one | |
| 35 | `supinated-underhand-barbell-row` | Supinated Barbell Row | |
| 36 | `traditional-deadlift` | Barbell Traditional Deadlift | Barbell Deadlift |
| 37 | `trx-and-db-field-goals` | TRX Field Goals | |
| 38 | `walk-out-plank` | Walk Out Plank/Inchworm | |

Worth Chris's eye rather than a guess:

- **1 and 34** are his "single single both" files, and both exercises already have
  a video. Spares, or genuinely different movements?
- **31 and 32**, plain `supinated-db-curl` and `supinated-db-row`, are staples the
  library doesn't have. They may need adding, as Alternating Reverse DB Lunge did.
- **25** `spring-ig-2` looks like an Instagram clip swept in with the rest.

## How to apply an answer

Rename the file on the drive to `<exercise-id>.mp4`, or move it to
`_not-in-library/` or `_duplicates/`. Then re-run
`import/compress-videos.sh`: it skips names already compressed, so delete any
output in `~/Desktop/burn-club-videos` whose name no longer exists on the drive
before re-running.
