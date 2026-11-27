// The "SETS" heading hung off the left edge of every weights screen
// (tester T-64).
//
// `.set-card-title { margin-left: -36px; }` was written for ONE screen. The
// working sets screen gives .player-sets-list 36px of left padding - the
// gutter the set numbers hang in, outside the card, from Chris's 2026-10-16
// sketch - and the heading cancels it so SETS sits at the true left edge
// above those numbers.
//
// The end-of-block weights screen reuses .set-card-title inside
// .player-weight-log, which has no such padding. So the same -36px pulled the
// heading 36px out of its card and into the page gutter, on every weights
// screen in the app.
//
// MEASURED IN THE BROWSER at 375, reading the live boxes before and after:
//
//                       heading left   card left
//   sets screen         20             56          (unchanged by the fix)
//   weights, unscoped    0             20          <- in the page gutter
//   weights, scoped     36             20          <- the card's own left edge
//
// 36 is exactly the card's 20px left plus its 16px padding, which is where
// everything else in the card starts.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var CSS = readFile("../../style.css");
var APP = readFile("../../app.js").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// ---------------- the rule is scoped to the screen that needs it ----------------

var pulls = CSS.match(/^[^\n{]*\.set-card-title[^\n{]*\{[^}]*margin-left:\s*-36px/gm) || [];
check(pulls.length === 1,
  "exactly one rule pulls the heading into the gutter (found " + pulls.length + ")");
check(pulls.length === 1 && pulls[0].indexOf(".player-sets-list") !== -1,
  "and it is scoped to the sets list, which is the screen with the 36px gutter (got "
  + JSON.stringify(pulls[0] ? pulls[0].split("{")[0].trim() : null) + ")");
// Stricter than today's markup strictly needs - there is no nested heading
// for a descendant selector to catch - and deliberately so: the pull belongs
// to the ONE heading that sits above the gutter, and a card dropped inside
// the list later should not inherit it by accident.
check(pulls.length === 1 && /\.player-sets-list\s*>\s*\.set-card-title/.test(pulls[0]),
  "as a direct child, which is where that screen puts its heading");

// ---------------- the gutter it cancels is real, and only there ----------------

function ruleBodies(selector) {
  var out = [], at = 0;
  while (true) {
    var hit = CSS.indexOf(selector, at);
    if (hit < 0) return out;
    var open = CSS.indexOf("{", hit), close = CSS.indexOf("}", open);
    if (open < 0 || close < 0) return out;
    // only when the selector really ends there, not as part of a longer one
    if (/^[\s,{]/.test(CSS.slice(hit + selector.length, hit + selector.length + 1))) {
      out.push(CSS.slice(open + 1, close));
    }
    at = hit + selector.length;
  }
}
var listRules = ruleBodies(".player-sets-list").join(" ");
check(/padding:\s*0 0 0 36px/.test(listRules),
  "the sets list still carries the 36px the heading is cancelling");
var logRules = ruleBodies(".player-weight-log").join(" ");
check(logRules.length > 0, "found the weights screen's own rule");
check(!/padding-left:\s*36px/.test(logRules) && !/padding:[^;]*36px/.test(logRules),
  "and the weights screen has no such gutter, which is why it must not be cancelled there");

// ---------------- both screens really do share the class ----------------
// If they ever stop, this fix is pointless and should be reconsidered rather
// than left sitting there.

check(APP.indexOf('<p class="set-card-title">Sets</p>') !== -1,
  "the working sets screen draws the heading");
check(/<p class="set-card-title">\$\{unit\}<\/p>/.test(APP),
  "and so does the weights screen, with Sets or Rounds");
var uses = (APP.match(/class="set-card-title"/g) || []).length;
check(uses === 2, "two screens, and no third one to surprise this (found " + uses + ")");

print("\n  " + pass + " passed, " + fail + " failed");
