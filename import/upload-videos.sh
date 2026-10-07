#!/bin/bash
# Upload the compressed exercise demos to Supabase Storage (Burn Club).
#
# Chris runs this himself: it needs the project's service key, which must never
# appear in the repo, in a chat, or in my hands. Read it from the environment,
# never as an argument — an argument shows up in `ps` and in shell history.
#
#   export SUPABASE_SERVICE_KEY='...'      (Dashboard > Settings > API)
#   ./upload-videos.sh
#   unset SUPABASE_SERVICE_KEY
#
# Safe to re-run: every upload is an upsert, so a half-finished run just
# carries on. Files are named <exercise-id>.mp4 (and <exercise-id>.jpg for the
# cover frame) and that name is the contract with the app — it builds both URLs
# from the exercise id.
set -u

DIR="${1:-$HOME/Desktop/burn-club-videos}"
PROJECT_URL="https://nuszxjopsxwpywojbrdw.supabase.co"
BUCKET="exercise-videos"

if [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then
  echo "SUPABASE_SERVICE_KEY is not set."
  echo "  export SUPABASE_SERVICE_KEY='...'   then run this again."
  exit 1
fi
[ -d "$DIR" ] || { echo "No such folder: $DIR"; exit 1; }

# Posters ride in the same bucket beside their clips, <id>.jpg next to
# <id>.mp4 (2026-10-07), so the content type comes from the extension rather
# than being hardcoded to video.
total=$(ls -1 "$DIR"/*.mp4 "$DIR"/*.jpg 2>/dev/null | grep -vc '/\._' || true)
[ "${total:-0}" -gt 0 ] || { echo "No .mp4 or .jpg files in $DIR"; exit 1; }
echo "Uploading $total files to $BUCKET"

ok=0; failed=0; n=0
for f in "$DIR"/*.mp4 "$DIR"/*.jpg; do
  [ -e "$f" ] || continue
  name=$(basename "$f")
  case "$name" in ._*) continue;; esac
  case "$name" in *.jpg) ctype="image/jpeg";; *) ctype="video/mp4";; esac
  n=$((n+1))

  code=$(curl -s -o /tmp/upload-body.txt -w '%{http_code}' \
    -X POST "$PROJECT_URL/storage/v1/object/$BUCKET/$name" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: $ctype" \
    -H "x-upsert: true" \
    --data-binary "@$f")

  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    ok=$((ok+1))
    printf "\r  %d/%d  %-55.55s" "$n" "$total" "$name"
  else
    # One retry: a dropped connection mid-upload is ordinary.
    sleep 2
    code=$(curl -s -o /tmp/upload-body.txt -w '%{http_code}' \
      -X POST "$PROJECT_URL/storage/v1/object/$BUCKET/$name" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
      -H "apikey: $SUPABASE_SERVICE_KEY" \
      -H "Content-Type: $ctype" \
      -H "x-upsert: true" \
      --data-binary "@$f")
    if [ "$code" = "200" ] || [ "$code" = "201" ]; then
      ok=$((ok+1))
    else
      failed=$((failed+1))
      printf "\nFAILED (%s): %s\n" "$code" "$name"
      sed 's/^/        /' /tmp/upload-body.txt | head -2
    fi
  fi
done
rm -f /tmp/upload-body.txt

echo
echo "uploaded: $ok   failed: $failed   of $total"
echo "public URL pattern:"
echo "  $PROJECT_URL/storage/v1/object/public/$BUCKET/<exercise-id>.mp4"
