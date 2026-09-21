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
  printf '%-32s %2d passed  %2d failed\n' "$t" "$n_pass" "$n_fail"
  [ "$n_fail" -gt 0 ] && { printf '%s\n' "$out" | grep "FAIL" | sed 's/^/    /'; fails=$((fails+n_fail)); }
done
echo "---"
[ "$fails" -eq 0 ] && echo "all passing" || { echo "$fails failing"; exit 1; }
