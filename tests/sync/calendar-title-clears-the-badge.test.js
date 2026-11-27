// On a small phone the HOME / GYM pill and the "Done" tick were drawn over
// the workout's name instead of beside it (tester T-63).
//
// The badge is absolutely positioned in the card's top-right corner and the
// title is in normal flow underneath it, full width. At 320 wide - an SE or a
// mini - that was nearly every card: "Week 7 Shoulders a HOME Abs", and the
// completed ones worst because the tick is wider: "Week 7 Quads and Gl ✓Done",
// not readable at all. At 375 only the longest titles clashed, which is how it
// survived testing on a bigger phone.
//
// MEASURED IN THE BROWSER, on the Fit & Functional week at 320 wide, by
// comparing each title's own text rectangle against its badge's:
//
//   with the fix disabled   9 of 11 calendar items overlapped
//   with it                 0 of 11, and 0 of 11 at 375 too (2 before)
//
// The numbers in the CSS comment come from the same run: Home 50px wide, Gym
// 43, "✓ Done" 41, and the widest, the CARDIO pill, 59. The title has to clear
// the badge's width plus its 12px offset, less the button's own 12px padding,
// so 59 is the bar and 68 is what is reserved.
//
// This file cannot lay out a page. What it holds is the SHAPE of the fix: the
// rule exists, it reserves enough, and the class that turns it on is put on
// every card that actually draws a badge. Those are the three ways it could
// quietly come undone.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var CSS = readFile("../../style.css");
var APP = readFile("../../app.js").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// ---------------- the premise: both badges sit in the same corner ----------------

function ruleFor(selector) {
  var at = CSS.indexOf(selector);
  if (at < 0) return "";
  var open = CSS.indexOf("{", at), close = CSS.indexOf("}", open);
  return CSS.slice(open, close);
}
var check_ = ruleFor(".calendar-item-check");
var variant = ruleFor(".calendar-variant-tag {");
check(check_.indexOf("position: absolute") !== -1 && check_.indexOf("right: 12px") !== -1,
  "the Done tick is still absolutely positioned in the corner");
check(variant.indexOf("position: absolute") !== -1 && variant.indexOf("right: 12px") !== -1,
  "and so is the Home/Gym/Cardio pill - which is why the title has to be told about it");

// ---------------- the rule, and the number in it ----------------

var reserve = CSS.match(/\.calendar-item-btn\.has-corner-tag \.calendar-item-label \{ padding-right: (\d+)px; \}/);
check(!!reserve, "the title reserves the corner where a badge is drawn");
check(reserve && Number(reserve[1]) >= 59,
  "and reserves at least the 59px the widest badge, CARDIO, needs (got "
  + (reserve ? reserve[1] : "none") + ")");
check(reserve && Number(reserve[1]) <= 90,
  "without taking so much that a short title wraps for nothing (got "
  + (reserve ? reserve[1] : "none") + ")");

// ---------------- and it is turned on wherever a badge is drawn ----------------
// Two places draw one. A card that draws a badge without the class is the
// finding again, on that card only - which is exactly how it would come back.

function markupNear(anchor, span) {
  var at = APP.indexOf(anchor);
  return at < 0 ? "" : APP.slice(at, at + span);
}
var workout = markupNear('<button class="calendar-item-btn ${isDone ? "done" : ""}', 900);
check(workout.length > 0, "found the calendar workout card");
check(workout.indexOf("has-corner-tag") !== -1, "which asks for the corner to be reserved");
check(/isDone \|\| showVariantLabels \? " has-corner-tag"/.test(workout),
  "on exactly the two states that draw a badge: done, and a Home/Gym choice");
check(workout.indexOf('<span class="calendar-item-check">') !== -1
   && workout.indexOf('<span class="calendar-variant-tag">') !== -1,
  "set up: those are the two badges it draws");

var cardio = markupNear('<button class="calendar-item-btn calendar-item-cardio', 700);
check(cardio.length > 0, "found the calendar cardio card");
check(cardio.indexOf("has-corner-tag") !== -1,
  "which reserves it too - a cardio item ALWAYS has a badge, a tick or the Cardio pill");
check(cardio.indexOf('calendar-item-check') !== -1 && cardio.indexOf('calendar-variant-tag') !== -1,
  "set up: one or the other, every time");

// Nothing else draws one. If a third card type appears, this fails and asks.
var badgeSites = (APP.match(/class="calendar-item-check"|class="calendar-variant-tag"/g) || []).length;
check(badgeSites === 4,
  "two cards, two badges each, and nothing else draws one (found " + badgeSites + ")");

print("\n  " + pass + " passed, " + fail + " failed");
