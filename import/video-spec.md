# Exercise video delivery spec

Settle this before shooting more — renaming and re-encoding a finished library
is the expensive kind of rework.

## Format

| | |
|---|---|
| **Container** | `.mp4` — **not** `.mov` |
| **Video codec** | H.264 (AVC), High profile |
| **Audio** | None. Strip the track entirely. |
| **Resolution** | 1920×1080 max. 1280×720 is genuinely enough for a form demo. |
| **Aspect** | 16:9 landscape |
| **Frame rate** | 30fps |
| **Length** | 5–15s, framed so it loops cleanly |

**Why mp4 over mov:** `.mov` is a container that usually carries ProRes out of
an editor — huge files, and Android playback is unreliable. H.264 in `.mp4`
plays everywhere: iOS, Android, and every browser. Shoot and edit in whatever
your camera and editor prefer; export to this.

**Why no audio:** these are silent form demos, and a muted video autoplays
reliably on mobile where one with a track often won't. It also cuts file size.
If a voiceover is ever wanted, that's a different asset.

## Framing

The player shows the video in a **16:9 landscape panel about 180px tall** on a
phone. That's small — so frame tight on the movement. A wide gym shot with the
lifter a third of the frame tall will be unreadable at that size.

Shoot the angle that shows the thing being coached: the hinge for a hip
thrust, the knee track for a squat.

## Naming

**One file per exercise, named for the exercise's id, kebab-case:**

```
glute-bridge.mp4
glute-bridge-static-hold.mp4
goblet-squats.mp4
walking-lunges.mp4
```

Not `Glute Bridge FINAL v2.mp4`. The filename is what links the video to the
exercise, so a rename later means re-linking the whole library by hand.

If an exercise gets its own static-hold entry with separate coaching, it's its
own file — that's the case the `holdExercise` field exists for.

## Size

Aim under ~3MB each. At 720p/30fps for 10 seconds that's comfortable. It
matters twice: members on gym wifi, and the offline caching that comes later.

---

## The pipeline, end to end

The scripts in this folder, in the order a batch of footage goes through them.
Each is safe to re-run; none of them touches the originals.

| Script | What it does |
|---|---|
| `rename-videos.sh`, `-2`, `-3` | Rename camera files to exercise ids. Each carries its own mapping table — see below. |
| `compress-videos.sh` | 720p, CRF 26, audio stripped, faststart. Reads the masters, writes copies. |
| `make-posters.sh` | A cover frame from 50% through each clip, `<id>.jpg`. |
| `upload-videos.sh` | Sends clips and posters to Supabase Storage. Chris runs this one — it needs the secret key. |

### The rename scripts

Three batches, kept as they were run rather than merged, because each one *is*
the record of how that batch got its names:

| Script | Batch | Mappings |
|---|---|---|
| `rename-videos.sh` | September, the original ~440 | 433 |
| `rename-videos-3.sh` | September follow-up | 14 |
| `rename-videos-2.sh` | October, the second shoot | 104 |

Run from inside the folder of footage, previewing first:

```
cd "/Volumes/CJV SSD/EXERCISE LIBRARY"
bash ~/path/to/rename-videos.sh          # prints what it would do
bash ~/path/to/rename-videos.sh --go     # actually renames, and logs to the Desktop
```

They rename via a temporary name so a case-only change works on exFAT, refuse
to overwrite an existing file, and bail early if the folder doesn't look like
the right one.

**A few ids in `rename-videos.sh` were superseded.** `1-4-front-raise` and its
siblings became `quarter-front-raise` when the ids were corrected on
2026-09-28, and `bear-crawl-to-shoulder-taps` became
`bear-crawl-shoulder-taps`. The script is the historical record of that run,
not the current naming — `data.js` is.

**The id is the contract.** A clip is served as `<exercise-id>.mp4` and its
cover as `<exercise-id>.jpg`; the app builds both URLs from the id and stores
neither. Renaming an exercise's id orphans its video and its poster.
