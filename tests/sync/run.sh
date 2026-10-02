#!/bin/bash
# Cross-device sync tests. A mock Supabase in memory, shared by two simulated
# devices ("phone" and "pc") that each get their own localStorage, driving the
# real sync.js. Uses macOS's built-in JavaScriptCore, so there is nothing to
# install.
set -u
cd "$(dirname "$0")"
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
SYNC=../../sync.js
fails=0
for t in *.test.js; do
  out=$("$JSC" mock-supabase.js "$SYNC" "$t" 2>&1)
  n_fail=$(printf '%s\n' "$out" | grep -c "FAIL")
  n_pass=$(printf '%s\n' "$out" | grep -c "PASS")
  # A file that ran no checks at all is a failure, not a pass. An exception
  # inside the async body is swallowed by the runtime, so a crashed test used to
  # print nothing and be counted as "0 passed 0 failed" — indistinguishable from
  # success, and exactly how a broken test file hides a broken fix.
  if [ "$n_pass" -eq 0 ] && [ "$n_fail" -eq 0 ]; then
    printf '%-32s  NO CHECKS RAN (crashed?)\n' "$t"
    printf '%s\n' "$out" | head -3 | sed 's/^/    /'
    fails=$((fails+1))
    continue
  fi
  printf '%-32s %2d passed  %2d failed\n' "$t" "$n_pass" "$n_fail"
  [ "$n_fail" -gt 0 ] && { printf '%s\n' "$out" | grep "FAIL" | sed 's/^/    /'; fails=$((fails+n_fail)); }
done
echo "---"
[ "$fails" -eq 0 ] && echo "all passing" || { echo "$fails failing"; exit 1; }
