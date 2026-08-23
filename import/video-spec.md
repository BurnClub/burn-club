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
