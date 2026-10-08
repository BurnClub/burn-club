#!/bin/bash
# Compress the exercise demo clips for the app (Burn Club).
#
# The camera files are far too heavy to serve: 28 GB for 440 clips, a typical
# one being 14 seconds and 30 MB. This re-encodes them to something a member on
# cellular can load in a second, and leaves the originals untouched.
#
#   - short side capped at 720px (these are mostly portrait phone video)
#   - CRF 26, which is visually clean for a demo clip of a person moving
#   - no audio track at all — the demos are silent
#   - faststart, so playback begins before the whole file has downloaded
#
# Needs ffmpeg:  brew install ffmpeg
#
# Usage:  ./compress-videos.sh [source-dir] [output-dir]
set -u

# The masters moved to the CJV SSD on 2026-10-08 when Chris consolidated his
# drives; the folder was called EXERCISE LIBRARY on the old one.
SRC="${1:-/Volumes/CJV SSD/Burn Club Exercises}"
OUT="${2:-$HOME/Desktop/burn-club-videos}"

command -v ffmpeg >/dev/null || { echo "ffmpeg not found. Run: brew install ffmpeg"; exit 1; }
[ -d "$SRC" ] || { echo "No such folder: $SRC"; exit 1; }
mkdir -p "$OUT"

done_n=0; skip_n=0; fail_n=0; total_in=0; total_out=0
for f in "$SRC"/*.mp4; do
  [ -e "$f" ] || continue
  name=$(basename "$f")
  case "$name" in ._*) continue;; esac     # macOS sidecar files on exFAT drives
  if [ -f "$OUT/$name" ]; then skip_n=$((skip_n+1)); continue; fi

  # Write to a temp name first, so an interrupted run never leaves a half file
  # that a later run would skip. It keeps the .mp4 extension: ffmpeg picks the
  # output format from it, and rejects a name it doesn't recognise.
  part="$OUT/.part-$name"
  if ffmpeg -nostdin -loglevel error -i "$f" \
      -vf "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)',fps=30" \
      -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p \
      -an -movflags +faststart \
      "$part" -y 2>"$OUT/.last-error"; then
    mv -- "$part" "$OUT/$name"
    i=$(stat -f %z "$f"); o=$(stat -f %z "$OUT/$name")
    total_in=$((total_in+i)); total_out=$((total_out+o)); done_n=$((done_n+1))
    printf "%4d  %7.1fMB -> %5.1fMB  %s\n" "$done_n" "$(echo "$i/1048576" | bc -l)" "$(echo "$o/1048576" | bc -l)" "$name"
  else
    rm -f -- "$part"; fail_n=$((fail_n+1))
    echo "FAILED: $name"; sed 's/^/        /' "$OUT/.last-error" | head -3
  fi
done

echo
echo "compressed: $done_n   already done: $skip_n   failed: $fail_n"
[ "$done_n" -gt 0 ] && printf "in: %.1f GB   out: %.1f GB\n" \
  "$(echo "$total_in/1073741824" | bc -l)" "$(echo "$total_out/1073741824" | bc -l)"
echo "output: $OUT"
