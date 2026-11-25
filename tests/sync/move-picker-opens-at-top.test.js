// The move picker reopened wherever the member had left it, so the row they
// wanted was clipped off the top (tester T-89).
//
// Move Wednesday's workout to a day late next week, change your mind, and tap
// the move arrow again. The list opens five days in. "Back to its own day" is
// always the FIRST row, so it is always the first thing hidden - and nothing
// on screen says it is there: no half-visible row, no arrow, no shadow. Tapping
// where that row belongs does nothing at all, because it is clipped out of the
// scrolling area, which reads as a broken button.
//
// MEASURED ON THE LIVE SITE, signed in as a real member, at 375 wide. Moved
// Wednesday's CHEST/TRICEPS to the furthest day offered, Sun Dec 6, then
// reopened the picker from the origin row:
//   scrollTop 260.5 of a maximum 260      - pinned to the bottom
//   five rows unreachable, document.elementFromPoint at each centre returns
//   something else: Nov 25 [Back to its own day], 26, 27, 28, 29
//   the hidden rows end at y 221; the visible list starts at y 268
//
// The cause is NOT what it looks like. It looks like the picker scrolls the
// "currently here" row into view - but with the workout on Nov 29, a row that
// happened to fit on screen, the list opened at 0 and nothing scrolled. The
// real cause is that the list keeps the offset from the last time the picker
// was open, and a member only ever leaves it scrolled DOWN, because scrolling
// down is how they reached the later day they picked in the first place.
//
// And the trap, measured step by step on the live site: the jump happens on
// `classList.add("visible")`, not before it.
//
//   start: 0   after subtitle: 0   after innerHTML: 0   after .visible: 260.5
//
// A hidden overlay is display:none, so the list inside it has no scroll box:
// reading scrollTop answers 0 whatever the real offset is, and writing it is
// ignored. The browser puts the remembered offset back when the overlay is
// shown. So the obvious one-line fix, written a line too early, looks right and
// does nothing - openNotebook() has had exactly that for months, under a
// comment saying "Opening starts at the top".
//
// Everything below is built on that measurement: this fake ignores a write
// while hidden and restores the remembered offset on show, which is the only
// thing that makes the ordering checkable.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function braceMatch(src, from) {
  var depth = 0;
  for (var i = src.indexOf("{", from); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(from, i + 1); }
  }
  throw new Error("unbalanced braces from " + from);
}
function liftFn(name) {
  var at = APP.indexOf("function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from app.js");
  return braceMatch(APP, at);
}

// ---------------- a scrolling area that behaves like a real one ----------------

function Node(opts) {
  opts = opts || {};
  this.kids = [];
  this.scrollable = !!opts.scrollable;
  this.remembered = opts.at || 0;   // what the browser is holding for it
  this.writes = 0;                  // how many times anything wrote to it
  this.overlay = null;              // the overlay it lives in
  var node = this;
  Object.defineProperty(this, "scrollTop", {
    get: function () {
      // No scroll box while the overlay is display:none, and none ever for a
      // node that does not scroll.
      if (!node.scrollable) return 0;
      if (node.overlay && !node.overlay.shown) return 0;
      return node.remembered;
    },
    set: function (v) {
      node.writes++;
      if (!node.scrollable) return;
      if (node.overlay && !node.overlay.shown) return;   // silently ignored
      node.remembered = v;
    },
  });
}
Node.prototype.querySelectorAll = function () {
  var all = [];
  (function walk(n) { n.kids.forEach(function (k) { all.push(k); walk(k); }); })(this);
  return all;
};

function Overlay(opts) {
  Node.call(this, opts || {});
  var ov = this;
  this.shown = false;
  this.overlay = this;
  this.classes = {};
  this.classList = {
    add: function (c) { ov.classes[c] = true; if (c === "visible") ov.shown = true; },
    remove: function (c) { delete ov.classes[c]; if (c === "visible") ov.shown = false; },
    contains: function (c) { return !!ov.classes[c]; },
  };
}
Overlay.prototype = Object.create(Node.prototype);
Overlay.prototype.querySelectorAll = Node.prototype.querySelectorAll;
function addChild(parent, child) { child.overlay = parent.overlay; parent.kids.push(child); }

var REGISTRY = {};
var document = { getElementById: function (id) { return REGISTRY[id] || null; } };

eval(liftFn("resetOverlayScroll"));
eval(liftFn("showOverlay"));

// The move picker as it really is: an overlay holding one scrolling list of
// days, left where the member last scrolled it.
function buildPicker(leftAt) {
  var overlay = new Overlay();
  var list = new Node({ scrollable: true, at: leftAt });
  addChild(overlay, list);
  REGISTRY["move-workout-overlay"] = overlay;
  return { overlay: overlay, list: list };
}

// ---------------- the finding ----------------

var p = buildPicker(260.5);          // exactly what was measured on the live site
check(p.list.scrollTop === 0, "while the picker is closed the list reads as 0, which is the trap");
showOverlay("move-workout-overlay");
check(p.overlay.shown, "opening the picker shows it");
check(p.list.scrollTop === 0,
  "and the list of days starts at the top, where \"Back to its own day\" is (got "
  + p.list.scrollTop + ")");
check(p.list.remembered === 0, "the browser is no longer holding the old offset either");

// The ordering, which is the whole fix: written before the overlay is shown,
// the same line does nothing. This is the check that fails against the
// plausible-looking version.
p = buildPicker(260.5);
p.list.scrollTop = 0;                // the fix, one line too early
check(p.list.remembered === 260.5,
  "a reset written while the overlay is hidden is thrown away (remembered "
  + p.list.remembered + ")");
p.overlay.classList.add("visible");
check(p.list.scrollTop === 260.5, "and the old offset comes back the moment it is shown");

// A member who never scrolled is not disturbed.
p = buildPicker(0);
showOverlay("move-workout-overlay");
check(p.list.scrollTop === 0, "a picker that was never scrolled still opens at the top");

// ---------------- every scrolling area, not just the first ----------------

var overlay = new Overlay();
var first = new Node({ scrollable: true, at: 120 });
var second = new Node({ scrollable: true, at: 300 });
var nested = new Node({ scrollable: true, at: 44 });
var plain = new Node({ at: 0 });
addChild(overlay, first);
addChild(overlay, second);
addChild(overlay, plain);
addChild(plain, nested);
REGISTRY["many"] = overlay;
showOverlay("many");
check(first.scrollTop === 0 && second.scrollTop === 0,
  "two lists in one overlay both go back to the top");
check(nested.scrollTop === 0, "and one nested inside something else");
check(plain.writes === 0,
  "while something that does not scroll is not written to at all (writes " + plain.writes + ")");

// The overlay itself can be the thing that scrolls - a tall card rather than a
// list inside it.
var card = new Overlay({ scrollable: true, at: 210 });
REGISTRY["card"] = card;
showOverlay("card");
check(card.scrollTop === 0, "an overlay that scrolls as a whole is reset too");

// Handed the element rather than its id, which is how the text prompt opens.
var direct = new Overlay();
var dList = new Node({ scrollable: true, at: 90 });
addChild(direct, dList);
showOverlay(direct);
check(direct.shown && dList.scrollTop === 0, "an overlay passed by element works the same way");
check(showOverlay("no-such-overlay") === null, "and an id that is not there is not an error");

// ---------------- one way in ----------------

check(CODE.indexOf("function showOverlay(") !== -1, "showOverlay is still there");
var body = braceMatch(CODE, CODE.indexOf("function showOverlay("));
var addAt = body.indexOf('classList.add("visible")');
var resetAt = body.indexOf("resetOverlayScroll(el)");
check(addAt !== -1 && resetAt !== -1 && resetAt > addAt,
  "and it shows the overlay BEFORE resetting the scroll, which is the only order that works");

// Every modal overlay goes through it. A check that the move picker is right
// is one overlay; a check that nothing opens an overlay any other way is all
// of them, including the next one somebody adds.
var strays = [];
var re = /document\.getElementById\("([a-z0-9-]+-overlay)"\)\.classList\.add\("visible"\)/g;
var m;
while ((m = re.exec(CODE)) !== null) strays.push(m[1]);
check(strays.length === 0,
  "no overlay is opened by setting the class directly any more (strays: " + strays.join(", ") + ")");
var opens = CODE.match(/showOverlay\(/g) || [];
check(opens.length >= 20,
  "and the overlays the app has all go through it (" + opens.length + " calls)");

// The picker itself, and the notebook, which had the one-line version of this
// fix written a line too early for months.
var picker = braceMatch(CODE, CODE.indexOf("function openMoveWorkoutPopup("));
check(picker.indexOf('showOverlay("move-workout-overlay")') !== -1,
  "the move picker opens through showOverlay");
var notebook = braceMatch(CODE, CODE.indexOf("function openNotebook("));
check(notebook.indexOf('showOverlay("notebook-overlay")') !== -1, "and so does the notebook");
check(notebook.indexOf("scrollTop = 0") === -1,
  "with its own dead reset gone, rather than left there looking like it works");

print("\n  " + pass + " passed, " + fail + " failed");
