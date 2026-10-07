#!/bin/bash
# Cover frames for the admin Exercise Library (Burn Club, 2026-10-07).
#
# Chris: "Id like to see a cover phote taken from 50% of the way through the
# video". Halfway is deliberate — the middle of a demo is the middle of the
# movement, where frame zero is usually someone standing still, or walking into
# shot.
#
# Why a file at all, when a <video> can be seeked to its own midpoint and left
# paused? Because that frame would not paint in the admin grid at all (the
# element rendered empty however it was laid out), and because 450 tiles each
# fetching video metadata to find their own midpoint is a lot of request for a
# still. An image is ~25KB, paints like any other image, and lets the video load
# only when someone hovers.
#
# Named <exercise-id>.jpg, beside <exercise-id>.mp4 in the same bucket: the app
# derives one URL from the other rather than storing a second one.
#
# Usage:  ./make-posters.sh [out-dir] [src-dir ...]
set -u

OUT="${1:-$HOME/Desktop/burn-club-posters}"
shift || true
SRCS=("$@")
[ ${#SRCS[@]} -gt 0 ] || SRCS=("$HOME/Desktop/burn-club-videos" "$HOME/Desktop/burn-club-upload-2")

command -v ffmpeg >/dev/null || { echo "ffmpeg not found. Run: brew install ffmpeg"; exit 1; }
mkdir -p "$OUT"

done_n=0; skip_n=0; fail_n=0
# Later sources win, so a re-shot clip's poster replaces the old one.
for dir in "${SRCS[@]}"; do
  [ -d "$dir" ] || { echo "skipping missing $dir"; continue; }
  for f in "$dir"/*.mp4; do
    [ -e "$f" ] || continue
    name=$(basename "$f" .mp4)
    case "$name" in ._*) continue;; esac

    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" 2>/dev/null)
    case "$dur" in ''|N/A) echo "FAILED (no duration): $name"; fail_n=$((fail_n+1)); continue;; esac
    mid=$(echo "$dur / 2" | bc -l)

    # -ss before -i seeks by keyframe, which is fast and close enough for a
    # still; -frames:v 1 takes exactly one.
    if ffmpeg -nostdin -loglevel error -ss "$mid" -i "$f" -frames:v 1 \
        -vf "scale='min(480,iw)':-2" -q:v 4 "$OUT/$name.jpg" -y 2>"$OUT/.last-error"; then
      done_n=$((done_n+1))
    else
      fail_n=$((fail_n+1)); echo "FAILED: $name"; sed 's/^/        /' "$OUT/.last-error" | head -2
    fi
  done
done

total_size=$(du -sh "$OUT" | cut -f1)
echo
echo "posters: $done_n   failed: $fail_n   total size: $total_size"
echo "output: $OUT"
