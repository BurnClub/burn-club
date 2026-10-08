#!/bin/bash
# Renames the exercise videos (batch 3) in the CURRENT Terminal folder.
#   Preview only (changes nothing):  bash ~/Downloads/rename-videos-3.sh
#   Actually rename:                 bash ~/Downloads/rename-videos-3.sh --go

GO=0; [ "$1" = "--go" ] && GO=1
LOG="$HOME/Desktop/rename-log-$(date +%Y%m%d-%H%M%S).txt"
found=0; done_n=0; missing=0; skipped=0; i=0

if [ ! -e "YTA raise.mp4" ] && [ ! -e "yta-raise.mp4" ]; then
  echo "This doesn't look like the video folder."
  echo "Use cd to get into the folder first, then run this again."
  exit 1
fi

while IFS=$'\t' read -r old new; do
  [ -z "$old" ] && continue
  i=$((i+1))
  if [ ! -e "$old" ]; then missing=$((missing+1)); continue; fi
  found=$((found+1))
  if [ $GO -eq 0 ]; then printf '%s\n    -> %s\n' "$old" "$new"; continue; fi
  tmp=".renaming-tmp-$$-$i"
  if ! mv "$old" "$tmp"; then echo "FAILED: $old"; skipped=$((skipped+1)); continue; fi
  if [ -e "$new" ]; then
    mv "$tmp" "$old"; echo "SKIPPED (a file named $new already exists): $old"; skipped=$((skipped+1)); continue
  fi
  mv "$tmp" "$new" && { printf '%s\t%s\n' "$old" "$new" >> "$LOG"; done_n=$((done_n+1)); }
done << 'MAP'
3 second eccentric puch up.mp4	3-second-eccentric-push-up.mp4
3-point row.mp4	3-point-row.mp4
90:90 hip switch.mp4	90-90-hip-switch.mp4
Adductor rocks.mp4	adductor-rocks.mp4
alternating wall leaning psoas march.mp4	alternating-wall-leaning-psoas-march.mp4
arms only assult:echo bike.mp4	arms-only-assault-echo-bike.mp4
assault:echo bike.mp4	assault-echo-bike.mp4
assisted cossack squat.mp4	assisted-cossack-squat.mp4
band pull aparts with slow eccentric.mp4	band-pull-aparts-w--slow-eccentric.mp4
Banded row with 3 second eccentric.mp4	banded-row-w--3-second-eccentric.mp4
barbell split squat.mp4	barbell-split-squat.mp4
bear plank with KB:DB pass.mp4	bear-plank-w--kb-db-pass.mp4
bodyweight:banded good morning.mp4	bodyweight-banded-good-morning.mp4
YTA raise.mp4	yta-raise.mp4
MAP

echo
if [ $GO -eq 0 ]; then
  echo "PREVIEW ONLY: $found files would be renamed. Nothing has been changed."
  [ $missing -gt 0 ] && echo "($missing names on the list weren't found here, likely already renamed.)"
  echo "To rename for real, run:  bash ~/Downloads/rename-videos-3.sh --go"
else
  echo "Done. Renamed $done_n files. Skipped: $skipped."
  echo "A record of every change was saved to your Desktop: $(basename "$LOG")"
fi
