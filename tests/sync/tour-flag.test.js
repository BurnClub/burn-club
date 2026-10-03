// The app tour must run once, not on every sign-in (Chris, 2026-10-02).
//
// It replayed forever because the two ends disagreed about the value: the app
// writes "1" when the tour finishes and tests for exactly "1", while hydrate
// wrote String(Date.now()). Every sync therefore destroyed the flag it was
// supposed to be restoring. Nothing in the old tests covered a preference
// surviving a round trip, which is why it sat there.
// TOUR_SEEN_KEY is already a global in the mock, so this file must not
// redeclare it.
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }
function tourSeen() { return !!localStorage.getItem(memberKey(TOUR_SEEN_KEY)); }

(async function () {
  onDevice("phone");

  // The member finishes the tour: the app writes "1".
  localStorage.setItem(memberKey(TOUR_SEEN_KEY), "1");
  check(tourSeen(), "the tour is marked seen when it finishes");

  // It goes up with the rest of their preferences.
  await pushPreferences();
  const row = tbl("member_preferences")[0];
  print("server row  tour_seen=" + (row && row.tour_seen));
  check(row && row.tour_seen === true, "and reaches the server as true");

  // A second device — a new phone, a reinstall — signs in. Hydrate writes the
  // flag back from the server, and it has to arrive in a shape the app
  // recognises. (Clearing it on THIS device and re-hydrating would prove
  // nothing: hydrate pushes before it pulls, so it would simply tell the
  // server the tour had not been seen.)
  onDevice("pc");
  await hydrateMemberData();
  print("new device  value=" + JSON.stringify(localStorage.getItem(memberKey(TOUR_SEEN_KEY))));
  check(tourSeen(), "a new device picks it up and does not replay the tour");

  // The specific regression: a timestamp written where "1" was expected.
  localStorage.setItem(memberKey(TOUR_SEEN_KEY), String(Date.now()));
  check(tourSeen(), "a phone still holding the old timestamp counts as seen too");

  // The worse bug underneath, found while chasing this one: preferences are a
  // single row, so a push overwrites the lot. A device that has never been
  // told about a preference must not send its defaults — it used to flip
  // tour_seen to false for every device the member owns.
  onDevice("pc");
  Object.keys(localStorage).forEach((k) => { if (k.indexOf("dirty") < 0) localStorage.removeItem(k); });
  clearDirty("preferences");
  await hydrateMemberData();
  print("server after an untouched device signed in: tour_seen=" +
        (tbl("member_preferences")[0] || {}).tour_seen);
  check((tbl("member_preferences")[0] || {}).tour_seen === true,
        "an untouched device does not wipe the server's preferences");
})();
